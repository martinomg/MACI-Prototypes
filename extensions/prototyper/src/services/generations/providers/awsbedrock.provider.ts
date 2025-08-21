import { BedrockEmbeddings, ChatBedrockConverse } from "@langchain/aws";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { BedrockChat } from "@langchain/community/chat_models/bedrock";
import { Bedrock } from "@langchain/community/llms/bedrock";
import fs from "node:fs";
import path from "path";
import { Readable } from "stream";
import models from "./awsbedrock.models";
import { messagesToObjects } from "../utils/messagesToObjects.util";
import {
  GenerateArgs,
  GenerateWithImageArgs,
  EmbeddingArgs,
  LLMArgs,
  TextToSpeechArgs,
  ProviderContext,
  Tool
} from "../generations.service.types.js";

// Helper function to convert tools to LangChain format for Bedrock Converse
function convertToLangChainTools(tools: any[] = []): any[] {
  const langchainTools: any[] = [];
  
  for (const tool of tools) {
    // Handle function type tools
    if (tool.type === "function") {
      langchainTools.push({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema
        }
      });
    }
    // Handle built-in bedrock tools
    else if (tool.type && tool.type !== "function") {
      langchainTools.push({
        type: tool.type,
        name: tool.name || tool.type,
        ...tool
      });
    }
    // Handle function declarations format
    else if (tool.functionDeclarations) {
      for (const func of tool.functionDeclarations) {
        langchainTools.push({
          type: "function",
          function: {
            name: func.name,
            description: func.description,
            parameters: func.parameters
          }
        });
      }
    }
  }
  
  return langchainTools;
}
function convertToAnthropicTools(tools: any[] = []): any[] {
  const anthropicTools: any[] = [];
  
  for (const tool of tools) {
    // Handle direct tool format (pass through as-is)
    if (tool.type) {
      anthropicTools.push(tool);
    }
    // Handle nested formats
    else if (tool.web_search_20250305) {
      anthropicTools.push({
        type: "web_search_20250305",
        name: tool.web_search_20250305.name || "web_search",
        max_uses: tool.web_search_20250305.max_uses || 5
      });
    }
    else if (tool.functionDeclarations) {
      for (const func of tool.functionDeclarations) {
        anthropicTools.push({
          type: "function",
          name: func.name,
          description: func.description,
          input_schema: func.parameters
        });
      }
    }
    // Handle other nested tool formats by extracting the first property
    else {
      const toolKeys = Object.keys(tool);
      if (toolKeys.length > 0) {
        const toolType = toolKeys[0];
        const toolConfig = tool[toolType];
        anthropicTools.push({
          type: toolType,
          ...toolConfig
        });
      }
    }
  }
  
  return anthropicTools;
}

const getEnv = (context?: ProviderContext) => {
  const env = context?.env || process.env;
  return {
    AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: env.AWS_REGION,
  };
};

export const generateWithImage = async (
  {
    context,
    model = "meta.llama3-2-11b-instruct-v1:0",
    system = "You are a helpful assistant that can understand both text and images.",
    message = "",
    imagePath = "",
    prev = [],
  }: GenerateWithImageArgs,
  details = false,
  checkPayload = false
) => {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = getEnv(context);
  const servicePayload = {
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
  };
  const { integrate_model_parameters } = models;
  const configPayload = integrate_model_parameters(servicePayload, model);
  const model_class = new BedrockChat(configPayload);
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const generatePayload = [
    { role: "system", content: system },
    ...prev,
    {
      role: "user",
      content: [
        { type: "text", text: message },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
      ],
    },
  ];
  // Remove nulls for type safety and cast
  const lcPayload = (messagesToObjects(generatePayload).filter(Boolean)) as any[];
  if (checkPayload) return lcPayload;
  const res = await model_class.invoke(lcPayload);
  return res.content;
};

export async function* generate(
  {
    context,
    model = "anthropic.claude-3-5-haiku-serverless",
    system = "You are a helpful assistant.",
    max_tokens = null,
    temperature = 0.7,
    message = "",
    prev = [],
    json_mode = false,
    response_schema,
    region = "us-east-1",
    stream = false,
    tools,
  }: GenerateArgs,
  details = false,
  checkPayload = false
) {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = getEnv(context);
  const { integrate_model_parameters } = models; // Declare at the top for all uses
  
  // Use ChatBedrockConverse for tools support (better tool handling)
  if (tools?.length) {
    // Check if we have predefined tools (like text_editor_20250429) that need native API
    const hasPredefinedTools = tools.some((tool: any) => 
      tool.type && !['function'].includes(tool.type) && 
      (tool.type.includes('_') || tool.type === 'text_editor_20250429' || tool.type === 'bash_20250124' || tool.type === 'web_search_20250305')
    );
    
    if (hasPredefinedTools) {
      // Use native AWS SDK for predefined tools
      const bedrockClient = new BedrockRuntimeClient({
        region: region || AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      });
      
      const { integrate_model_parameters } = models;
      const modelConfig = integrate_model_parameters({}, model);
      const actualModelId = modelConfig.model || model;
      
      // Build conversation history in Claude's format
      const messages = [];
      
      // Add conversation history
      for (const msg of prev) {
        messages.push({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content
        });
      }
      
      // Add current message
      messages.push({
        role: "user",
        content: message
      });
      
      // Build the request payload for Claude
      const requestBody: any = {
        anthropic_version: "bedrock-2023-05-31",
        messages,
        max_tokens: max_tokens || 4096,
        temperature,
      };
      
      // Add system message if provided
      if (system) {
        requestBody.system = system;
      }

      // Add tools if provided
      const anthropicTools = convertToAnthropicTools(tools);
      if (anthropicTools.length > 0) {
        requestBody.tools = anthropicTools;
      }
      
      if (checkPayload) {
        yield { requestBody, model: actualModelId };
        return;
      }
      
      try {
        const command = new InvokeModelCommand({
          modelId: actualModelId,
          body: JSON.stringify(requestBody),
          contentType: "application/json",
        });
        
        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        // Handle mixed content (text + tool calls)
        let textContent = "";
        const toolCalls = [];
        
        if (responseBody.content) {
          for (const item of responseBody.content) {
            if (item.type === "text") {
              textContent += item.text;
            } else if (item.type === "tool_use") {
              toolCalls.push({
                type: "function",
                name: item.name,
                id: item.id,
                args: item.input
              });
            }
          }
        }
        
        // Return structured response with tool calls
        if (toolCalls.length > 0) {
          const result = {
            content: textContent,
            toolCalls: toolCalls,
            metadata: {
              finishReason: "TOOL_USE",
              usage: responseBody.usage || {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
              }
            }
          };
          yield result;
        } else {
          // Regular text response
          yield textContent;
        }
        return;
      } catch (error) {
        console.error('Native Claude API error:', error);
        throw error;
      }
    }
    
    // For custom function tools, use LangChain ChatBedrockConverse
    const servicePayload = {
      region: region || AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    };
    const configPayload = integrate_model_parameters(servicePayload, model);
    
    const converseModel = new ChatBedrockConverse({
      ...configPayload,
      temperature,
      maxTokens: max_tokens || undefined,
      streaming: stream,
    });
    
    // Convert tools to LangChain format
    const langchainTools = convertToLangChainTools(tools);
    
    // Bind tools to the model
    const modelWithTools = converseModel.bindTools(langchainTools);
    
    // Build conversation history
    const messages = [];
    
    // Add system message if provided
    if (system) {
      messages.push({ role: "system", content: system });
    }
    
    // Add conversation history
    for (const msg of prev) {
      messages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      });
    }
    
    // Add current message
    messages.push({ role: "user", content: message });
    
    if (checkPayload) {
      yield { messages, tools: langchainTools, model: configPayload.model };
      return;
    }
    
    try {
      if (stream) {
        const streamIterator = await modelWithTools.stream(messages);
        for await (const chunk of streamIterator) {
          yield chunk;
        }
        return;
      }
      
      const response = await modelWithTools.invoke(messages);
      
      // Check if the model wants to use tools
      if (response.tool_calls && response.tool_calls.length > 0) {
        // Return the tool calls for the caller to handle
        let content = "";
        if (Array.isArray(response.content)) {
          for (const item of response.content) {
            if (typeof item === 'string') {
              content += item;
            } else if (typeof item === 'object' && 'text' in item) {
              content += (item as any).text;
            }
          }
        } else if (typeof response.content === 'string') {
          content = response.content;
        }
          
        const result = {
          content: content,
          toolCalls: response.tool_calls.map(toolCall => {
            return {
              type: "function",
              name: toolCall.name,
              id: toolCall.id,
              args: toolCall.args
            };
          }),
          metadata: {
            finishReason: "TOOL_USE",
            usage: response.usage_metadata || {
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0
            }
          }
        };
        
        // Always return the structured result with tool calls
        yield result;
        return;
      }
      
      // No tool calls, return normal response
      if (details) {
        yield {
          content: response.content,
          usage: response.usage_metadata,
          metadata: response
        };
      } else {
        yield response.content;
      }
      return;
    } catch (error) {
      console.error('ChatBedrockConverse error:', error);
      throw error;
    }
  }
  
  const isClaudeModel = model.includes('anthropic') || model.includes('claude');
  
  // Check if model requires inference profile (newer models)
  const modelConfig = integrate_model_parameters({}, model);
  const actualModelId = modelConfig.model || model;
  const requiresInferenceProfile = actualModelId.startsWith('us.') || actualModelId.startsWith('arn:aws:bedrock:') || 
    model.includes('sonnet-4') || model.includes('sonnet-3-7') || model.includes('opus-4') || 
    model.includes('deepseek') || model.includes('nova-');
  
  // Use native AWS SDK for Claude models when using JSON mode, tools, response schema, OR when model requires inference profile
  if (isClaudeModel && (json_mode || tools?.length || response_schema || requiresInferenceProfile)) {
    // Check if the model is supported before attempting native API call
    const modelConfig = integrate_model_parameters({}, model);
    const actualModelId = modelConfig.model || model;
    
    // For inference profile models, don't fallback to LangChain
    if (requiresInferenceProfile || modelConfig.model) {
      // Proceed with native API
      const bedrockClient = new BedrockRuntimeClient({
        region: region || AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      });
    
    // Build conversation history in Claude's format
    const messages = [];
    
    // Add conversation history
    for (const msg of prev) {
      messages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content
      });
    }
    
    // Add current message
    messages.push({
      role: "user",
      content: message
    });
    
    // Build the request payload for Claude
    const requestBody: any = {
      anthropic_version: "bedrock-2023-05-31",
      messages,
      max_tokens: max_tokens || 4096,
      temperature,
    };
    
    // Add system message if provided
    if (system) {
      requestBody.system = system;
    }

    // Add tools if provided
    if (tools?.length) {
      const anthropicTools = convertToAnthropicTools(tools);
      if (anthropicTools.length > 0) {
        requestBody.tools = anthropicTools;
      }
    }
    
    // Apply JSON schema if provided
    if (response_schema) {
      // Convert our schema format to Claude's tool format
      const schemaData = response_schema.parameters || response_schema;
      
      requestBody.tools = [{
        name: response_schema.name || "structured_response",
        description: response_schema.description || "Structured response",
        input_schema: schemaData
      }];
      
      requestBody.tool_choice = {
        type: "tool",
        name: response_schema.name || "structured_response"
      };
    } else if (json_mode) {
      // Basic JSON mode - instruct Claude to respond in JSON
      requestBody.system = (requestBody.system || "") + "\n\nPlease respond with valid JSON format.";
    }
    
    if (checkPayload) {
      yield { requestBody, model: actualModelId };
      return;
    }
    
    try {
      const command = new InvokeModelCommand({
        modelId: actualModelId, // Use the properly mapped model ID
        body: JSON.stringify(requestBody),
        contentType: "application/json",
      });
      
      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      if (details) {
        yield {
          content: responseBody,
          usage: responseBody.usage,
          metadata: responseBody
        };
        return;
      }
      
      // Handle tool call response for structured output
      if (response_schema && responseBody.content?.[0]?.type === "tool_use") {
        yield responseBody.content[0].input;
      } else if (responseBody.content) {
        // Handle mixed content (text + tool calls)
        let textContent = "";
        const toolCalls = [];
        
        for (const item of responseBody.content) {
          if (item.type === "text") {
            textContent += item.text;
          } else if (item.type === "tool_use") {
            toolCalls.push(item);
          }
        }
        
        // If we have tools, return structured response similar to Google's format
        if (toolCalls.length > 0) {
          const result = {
            content: textContent,
            toolCalls: toolCalls.map(tool => ({
              type: tool.type,
              name: tool.name,
              id: tool.id,
              input: tool.input
            })),
            metadata: {
              finishReason: responseBody.stop_reason || "STOP",
              usage: responseBody.usage
            }
          };
          yield result;
        } else {
          // Regular text response
          if (json_mode && !response_schema) {
            try {
              const jsonResponse = JSON.parse(textContent);
              yield jsonResponse;
            } catch (e) {
              yield textContent;
            }
          } else {
            yield textContent;
          }
        }
      } else {
        yield responseBody;
      }
      return;
    } catch (error) {
      // Don't fallback to LangChain, throw the error to let the user know
      throw error;
    }
    } // Close the else block for valid model mapping
  }
  
  // Fallback to LangChain for non-JSON mode or non-Claude models
  const servicePayload = {
    region: region || AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    httpOptions: { timeout: 10 * 60 * 1000 },
  };
  const configPayload = integrate_model_parameters(servicePayload, model);
  
  let model_class = new BedrockChat({
    ...configPayload,
    temperature,
    maxTokens: max_tokens || undefined,
    streaming: stream,
  });
  
  // For Claude models, include system message in the payload but ensure it's properly formatted
  const generatePayload = system ? [
    ...prev,
    { role: "user", content: `System: ${system}\n\nUser: ${message}` },
  ] : [
    ...prev,
    { role: "user", content: message },
  ];
  
  const lcPayload = (messagesToObjects(generatePayload).filter(Boolean)) as any[];
  
  if (checkPayload) {
    yield lcPayload;
    return;
  }
  if (stream) {
    const streamIterator = await model_class.stream(lcPayload);
    for await (const chunk of streamIterator) {
      yield chunk;
    }
    return;
  }
  
  const res = await model_class.invoke(lcPayload);
  yield res.content;
};

export const llm = async (
  { context, model = "anthropic.claude-instant-v1", system = "", input = "" }: LLMArgs,
  details = false,
  checkPayload = false
) => {
  try {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = getEnv(context);
    const servicePayload = {
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    };
    const { integrate_model_parameters } = models;
    const configPayload = integrate_model_parameters(servicePayload, model);
    const model_class = new Bedrock(configPayload);
    const res = await model_class.invoke(`Human: ${input} \nAssistant:`);
    return res;
  } catch (error) {
    console.log("aws llm error", error);
    return false;
  }
};

export const embedding = async ({ context, model = "amazon.titan-embed-text-v1", message }: EmbeddingArgs) => {
  const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = getEnv(context);
  const embeddings = new BedrockEmbeddings({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    model,
  });
  if (Array.isArray(message)) {
    return await embeddings.embedDocuments(message);
  } else {
    return await embeddings.embedQuery(message);
  }
};

export const textToSpeech = async ({
  context,
  text,
  output_path = "./uploads/audios",
  language = "en-US",
  output_format = "mp3",
  voice = "Danielle",
  engine = "generative",
}: TextToSpeechArgs) => {
  try {
    const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION } = getEnv(context);
    const params = {
      OutputFormat: output_format as any, // Fix type error
      Text: text,
      TextType: "text" as any, // Fix type error
      VoiceId: voice as any, // Fix type error
      LanguageCode: language as any, // Fix type error
      SampleRate: "22050",
      Engine: engine as any, // Fix type error
    };
    const polly_client = new PollyClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
    const command = new SynthesizeSpeechCommand(params);
    const response = await polly_client.send(command);
    if (!fs.existsSync(output_path)) {
      fs.mkdirSync(output_path, { recursive: true });
    }
    const fileName = `speech_${Date.now()}.${output_format}`;
    const filePath = path.join(output_path, fileName);
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      if (response.AudioStream instanceof Readable) {
        response.AudioStream.pipe(writer);
        writer.on("finish", () => resolve(true));
        writer.on("error", reject);
      } else if (response.AudioStream instanceof Buffer) {
        fs.writeFile(filePath, response.AudioStream, (err) => {
          if (err) reject(err);
          else resolve(true);
        });
      } else {
        reject(new Error("Unsupported AudioStream type"));
      }
    });
  } catch (error) {
    console.log("AWS text to speech error", error);
    return false;
  }
};

export default {
  generate,
  generateWithImage,
  embedding,
  llm,
  textToSpeech,
};
