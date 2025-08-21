import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { messagesToObjects } from "../utils/messagesToObjects.util";
import { GenerateArgs, EmbeddingArgs, ProviderContext, Tool } from "../generations.service.types";

// Note: Type should be imported from @google/generative-ai for schema construction

const getEnv = (context?: ProviderContext) => {
  const env = context?.env || process.env;
  return {
    GOOGLEGENAI_API_KEY: env.GOOGLEGENAI_API_KEY,
  };
};

export async function* generate(
  {
    context,
    model = "gemini-pro",
    system = "You are a helpful assistant. Never explain what you do, just provide the requested response.",
    message = "",
    prev = [],
    temperature = 0.7,
    json_mode = false,
    response_schema,
    stream = false,
    tools = [],
  }: GenerateArgs,
  details = false,
  checkPayload = false
) {
  const { GOOGLEGENAI_API_KEY } = getEnv(context);
  
  // Build the model configuration
  const modelConfig: any = {
    model: model,
    maxOutputTokens: 2048,
    apiKey: GOOGLEGENAI_API_KEY,
    temperature,
    streaming: stream,
  };
  
  let model_class = new ChatGoogleGenerativeAI(modelConfig);
  
  // Combine tool and JSON mode configurations
  const bindConfig: any = {};
  
  // Add tools configuration if provided
  if (tools && tools.length > 0) {
    const googleTools = convertToGoogleTools(tools);
    if (googleTools.length > 0) {
      bindConfig.tools = googleTools;
    }
  }
  
  // Add JSON mode configuration if enabled
  if (json_mode) {
    bindConfig.responseMimeType = "application/json";
    
    if (response_schema) {
      bindConfig.responseSchema = convertToGoogleSchema(response_schema);
    }
  }
  
  // Apply configurations if any exist
  if (Object.keys(bindConfig).length > 0) {
    model_class = model_class.bind(bindConfig) as any;
  }
  
  const generatePayload = [
    { role: "system", content: system },
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
  
  // Handle JSON mode response
  if (json_mode) {
    // For JSON mode, try to parse the content as JSON
    try {
      const jsonResponse = JSON.parse(res.content as string);
      yield jsonResponse;
    } catch (e) {
      // If parsing fails, return the raw content
      yield res.content;
    }
  } else {
    // Return enhanced response with metadata when tools are used
    if (tools && tools.length > 0) {
      yield {
        ...res,
        content: res.content,
        enhanced_metadata: {
          response_metadata: res.response_metadata || {},
          usage_metadata: res.usage_metadata || {},
          tool_calls: res.tool_calls || []
        }
      };
    } else {
      yield res.content;
    }
  }
};

// Helper function to convert our schema format to Google's native schema format
function convertToGoogleSchema(schema: any) {
  const schemaData = schema.parameters || schema;
  
  function convertSchema(schemaObj: any): any {
    if (schemaObj.type === "object") {
      const result: any = {
        type: "object",
        properties: {}
      };
      
      if (schemaObj.properties) {
        for (const [key, prop] of Object.entries(schemaObj.properties as any)) {
          result.properties[key] = convertSchema(prop);
        }
      }
      
      if (schemaObj.required) {
        result.required = schemaObj.required;
      }
      
      return result;
    } else if (schemaObj.type === "array") {
      return {
        type: "array",
        items: schemaObj.items ? convertSchema(schemaObj.items) : { type: "string" }
      };
    } else {
      return {
        type: schemaObj.type,
        description: schemaObj.description
      };
    }
  }
  
  return convertSchema(schemaData);
}

// Helper function to convert our tools format to LangChain compatible format
function convertToLangChainTools(tools: Tool[]) {
  const langchainTools: any[] = [];
  
  for (const tool of tools) {
    if (tool.google_search !== undefined) {
      // LangChain supports Google Search via binding
      langchainTools.push({
        type: "google_search"
      });
    }
    if (tool.functionDeclarations && tool.functionDeclarations.length > 0) {
      // Convert function declarations to LangChain format
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

// Helper function to convert our tools format to Google's native tools format (for native API)
function convertToGoogleTools(tools: Tool[]) {
  const googleTools: any[] = [];
  
  for (const tool of tools) {
    if (tool.google_search !== undefined) {
      // Google Search tool configuration
      googleTools.push({
        google_search: {}
      });
    }
    
    if (tool.code_execution !== undefined) {
      // Code Execution tool configuration
      googleTools.push({
        code_execution: {}
      });
    }
    
    if (tool.functionDeclarations && tool.functionDeclarations.length > 0) {
      // Custom function declarations
      googleTools.push({
        functionDeclarations: tool.functionDeclarations
      });
    }
  }
  
  return googleTools;
}

// Helper function to extract source information from grounding metadata
function extractSourceInformation(groundingMetadata: any) {
  if (!groundingMetadata) return null;

  const sources = [];
  
  // Extract grounding supports (search results)
  if (groundingMetadata.groundingSupports) {
    for (const support of groundingMetadata.groundingSupports) {
      if (support.segment) {
        const source = {
          startIndex: support.segment.startIndex,
          endIndex: support.segment.endIndex,
          text: support.segment.text,
          groundingChunkIndices: support.groundingChunkIndices || []
        };
        sources.push(source);
      }
    }
  }

  // Extract search entry point (main search information)
  const searchEntryPoint = groundingMetadata.searchEntryPoint;
  
  // Extract web search queries that were performed
  const webSearchQueries = groundingMetadata.webSearchQueries || [];

  return {
    sources,
    searchEntryPoint,
    webSearchQueries,
    retrievalMetadata: groundingMetadata.retrievalMetadata
  };
}

export const embedding = async ({ context, model = "text-embedding-004", message }: EmbeddingArgs) => {
  const { GOOGLEGENAI_API_KEY } = getEnv(context);
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: GOOGLEGENAI_API_KEY,
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    model,
  });
  if (Array.isArray(message)) {
    return await embeddings.embedDocuments(message);
  } else {
    return await embeddings.embedQuery(message);
  }
};

export const generateWithImage = async () => {
  throw new Error("GoogleGenAI: generateWithImage is not supported in this provider.");
};

export const llm = async () => {
  throw new Error("GoogleGenAI: llm is not supported in this provider.");
};

export const textToSpeech = async () => {
  throw new Error("GoogleGenAI: textToSpeech is not supported in this provider.");
};

export default {
  generate,
  embedding,
  generateWithImage,
  llm,
  textToSpeech,
};
