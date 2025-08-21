import * as generations from "./generations.service";
import { ProviderContext } from "./generations.service.types";

/**
 * Controller for handling generation requests.
 * Separates business logic from endpoint routing.
 */

/**
 * Handle text generation requests with streaming support.
 * 
 * @param provider - The AI provider to use
 * @param args - Generation arguments from request body
 * @param context - Directus context
 * @returns Promise<any> - Generated content or async generator for streaming
 */
export const handleGenerate = async (
  provider: generations.ProviderName, 
  args: any, 
  context: ProviderContext
) => {
  // Merge context into args as expected by the service
  const serviceArgs = { ...args, context };
  
  if (args.stream === true) {
    // Return the async generator directly for streaming
    return await generations.generate(provider, { ...serviceArgs, stream: true });
  } else {
    // For non-streaming, collect all chunks and return the final result
    const generator = await generations.generate(provider, { ...serviceArgs, stream: false });
    let lastChunk = null;
    let content = "";
    
    for await (const chunk of generator) {
      lastChunk = chunk;
      // Defensive: handle chunk as AIMessageChunk or array
      if (chunk && typeof chunk === "object" && !Array.isArray(chunk)) {
        const k = (chunk as any).kwargs;
        if (k && typeof k.content === "string") {
          content += k.content;
        }
      } else if (typeof chunk === "string") {
        content += chunk;
      }
    }
    
    // Check if tools were used and format response accordingly
    if (args.tools && args.tools.length > 0 && lastChunk) {
      return formatToolResponse(lastChunk);
    }
    
    // Prefer concatenated content, fallback to lastChunk
    return content || lastChunk;
  }
};

/**
 * Handle text generation with tools (enhanced version using native APIs)
 * 
 * @param provider - The AI provider to use
 * @param args - Generation arguments including tools
 * @param context - Directus context
 * @returns Promise<any> - Generated content with tool usage
 */
export const handleGenerateWithTools = async (
  provider: generations.ProviderName, 
  args: any, 
  context: ProviderContext
) => {
  // Merge context into args as expected by the service
  const serviceArgs = { ...args, context };
  
  if (args.stream === true) {
    // Return the async generator directly for streaming
    return await generations.generateWithTools(provider, { ...serviceArgs, stream: true });
  } else {
    // For non-streaming, collect all chunks and return the final result
    const generator = await generations.generateWithTools(provider, { ...serviceArgs, stream: false });
    let result = null;
    
    for await (const chunk of generator) {
      result = chunk;
    }
    
    // Clean and format the response when tools are used
    if (args.tools && args.tools.length > 0 && result) {
      return formatToolResponse(result);
    }
    
    // For regular requests without tools, extract content as before
    if (result && typeof result === "object" && !Array.isArray(result)) {
      if (result.content) {
        return result.content;
      }
      const k = (result as any).kwargs;
      if (k && typeof k.content === "string") {
        return k.content;
      }
    }
    
    return result;
  }
};

/**
 * Format tool response to a cleaner structure while maintaining original API naming
 */
function formatToolResponse(rawResponse: any) {
  // Extract main content
  const content = rawResponse.content || rawResponse.kwargs?.content || "";
  
  // Extract grounding metadata if available (Google format)
  const groundingMetadata = rawResponse.additional_kwargs?.groundingMetadata || 
                           rawResponse.kwargs?.additional_kwargs?.groundingMetadata ||
                           rawResponse.response_metadata?.groundingMetadata;
  
  // Extract tool calls if available (Anthropic format)
  const toolCalls = rawResponse.toolCalls || [];
  
  // Extract usage metadata
  const usageMetadata = rawResponse.usage_metadata || 
                       rawResponse.kwargs?.usage_metadata ||
                       rawResponse.response_metadata?.tokenUsage ||
                       rawResponse.metadata?.usage;
  
  // Build clean response
  const cleanResponse: any = {
    content,
    metadata: {
      finishReason: rawResponse.additional_kwargs?.finishReason || 
                   rawResponse.kwargs?.additional_kwargs?.finishReason ||
                   rawResponse.response_metadata?.finishReason ||
                   rawResponse.metadata?.finishReason ||
                   "STOP",
      usage: {
        inputTokens: usageMetadata?.input_tokens || usageMetadata?.promptTokens || 0,
        outputTokens: usageMetadata?.output_tokens || usageMetadata?.completionTokens || 0,
        totalTokens: usageMetadata?.total_tokens || usageMetadata?.totalTokens || 0
      }
    }
  };
  
  // Add grounding information if available (for Google Search) with original naming
  if (groundingMetadata) {
    cleanResponse.groundingMetadata = {
      // Array of search queries used - useful for debugging and understanding model reasoning
      webSearchQueries: groundingMetadata.webSearchQueries || [],
      
      // HTML/CSS for rendering search suggestions (if required by ToS)
      searchEntryPoint: groundingMetadata.searchEntryPoint || null,
      
      // Array of web sources (uri and title)
      groundingChunks: groundingMetadata.groundingChunks || [],
      
      // Array of text segments linking response text to sources
      // Each segment connects text (by startIndex/endIndex) to groundingChunkIndices
      groundingSupports: groundingMetadata.groundingSupports || []
    };
  }
  
  // Add Anthropic tool calls if available (web search, function calls, etc.)
  if (toolCalls && toolCalls.length > 0) {
    cleanResponse.toolCalls = toolCalls.map((tool: any) => ({
      type: tool.type,
      name: tool.name,
      id: tool.id,
      args: tool.args || tool.input // Support both args and input for compatibility
    }));
  }
  
  // Extract code execution information if available
  const codeExecutionParts = extractCodeExecutionParts(rawResponse);
  if (codeExecutionParts.length > 0) {
    cleanResponse.codeExecution = codeExecutionParts;
  }
  
  return cleanResponse;
}

/**
 * Extract code execution parts from the response
 */
function extractCodeExecutionParts(rawResponse: any): any[] {
  const codeExecutionParts: any[] = [];
  
  // Try to extract from different possible locations in the response structure
  const candidates = rawResponse.candidates || 
                    rawResponse.kwargs?.candidates || 
                    rawResponse.additional_kwargs?.candidates ||
                    [];
  
  for (const candidate of candidates) {
    if (candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.executable_code || part.code_execution_result) {
          const executionPart: any = {};
          
          if (part.executable_code) {
            executionPart.executable_code = {
              language: part.executable_code.language || "PYTHON",
              code: part.executable_code.code || ""
            };
          }
          
          if (part.code_execution_result) {
            executionPart.code_execution_result = {
              outcome: part.code_execution_result.outcome || "OUTCOME_UNKNOWN",
              output: part.code_execution_result.output || ""
            };
          }
          
          if (part.text) {
            executionPart.text = part.text;
          }
          
          codeExecutionParts.push(executionPart);
        }
      }
    }
  }
  
  return codeExecutionParts;
}

/**
 * Handle image-based generation requests.
 * 
 * @param provider - The AI provider to use
 * @param args - Generation arguments including image data
 * @param context - Directus context
 * @returns Promise<any> - Generated content based on image input
 */
export const handleGenerateWithImage = async (
  provider: generations.ProviderName, 
  args: any, 
  context: ProviderContext
) => {
  const serviceArgs = { ...args, context };
  return await generations.generateWithImage(provider, serviceArgs);
};

/**
 * Handle embedding generation requests.
 * 
 * @param provider - The AI provider to use
 * @param args - Embedding arguments
 * @param context - Directus context
 * @returns Promise<number[]> - Vector embeddings
 */
export const handleEmbedding = async (
  provider: generations.ProviderName, 
  args: any, 
  context: ProviderContext
) => {
  const serviceArgs = { ...args, context };
  return await generations.embedding(provider, serviceArgs);
};

/**
 * Handle LLM instance creation requests.
 * 
 * @param provider - The AI provider to use
 * @param args - LLM configuration arguments
 * @param context - Directus context
 * @returns Promise<any> - Configured language model instance
 */
export const handleLLM = async (
  provider: generations.ProviderName, 
  args: any, 
  context: ProviderContext
) => {
  const serviceArgs = { ...args, context };
  return await generations.llm(provider, serviceArgs);
};

/**
 * Handle text-to-speech requests.
 * 
 * @param provider - The AI provider to use
 * @param args - Text-to-speech arguments
 * @param context - Directus context
 * @returns Promise<Buffer | string> - Audio data
 */
export const handleTextToSpeech = async (
  provider: generations.ProviderName, 
  args: any, 
  context: ProviderContext
) => {
  const serviceArgs = { ...args, context };
  return await generations.textToSpeech(provider, serviceArgs);
};

/**
 * Validate that the provider is supported.
 * 
 * @param provider - The provider name to validate
 * @throws Error if provider is not supported
 */
export const validateProvider = (provider: string): provider is generations.ProviderName => {
  const validProviders: generations.ProviderName[] = ["bedrock", "openai", "google"];
  if (!validProviders.includes(provider as generations.ProviderName)) {
    throw new Error(`Unsupported provider: ${provider}. Valid providers are: ${validProviders.join(", ")}`);
  }
  return true;
};

/**
 * Create a Directus-compatible context from the request context.
 * Uses direct process.env access for environment variables with fallback to Directus context.env.
 * 
 * @param directusContext - The Directus context from the endpoint (used as fallback)
 * @param customEnv - Optional custom environment variables from request
 * @returns ProviderContext - Context formatted for the generation providers
 */
export const createProviderContext = (directusContext: any, customEnv?: Record<string, string>): ProviderContext => {
  // Use direct process.env access first, fallback to Directus context.env
  const env = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || directusContext?.env?.OPENAI_API_KEY,
    GOOGLEGENAI_API_KEY: process.env.GOOGLEGENAI_API_KEY || directusContext?.env?.GOOGLEGENAI_API_KEY,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || directusContext?.env?.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || directusContext?.env?.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || directusContext?.env?.AWS_REGION,
    // Include any custom environment variables (takes priority)
    ...customEnv,
  };
  
  return {
    env
  };
};

export default {
  handleGenerate,
  handleGenerateWithImage,
  handleEmbedding,
  handleLLM,
  handleTextToSpeech,
  validateProvider,
  createProviderContext,
};
