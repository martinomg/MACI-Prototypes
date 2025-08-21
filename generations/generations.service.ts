import * as bedrock from "./providers/awsbedrock.provider";
import * as openai from "./providers/openai.provider";
import * as google from "./providers/googlegenai.provider";
import integrateDataToPromptTemplate from "./utils/integrateDataToPromptTemplate.util";
import {
  GenerateArgs,
  GenerateWithImageArgs,
  EmbeddingArgs,
  LLMArgs,
  TextToSpeechArgs,
  ProviderContext
} from "./generations.service.types";

export type ProviderName = "bedrock" | "openai" | "google";

const providers = {
  bedrock,
  openai,
  google,
};

/**
 * Generate text content using the specified provider.
 * 
 * @param provider - The AI provider to use ("bedrock", "openai", or "google")
 * @param args - Generation arguments including prompt, model, temperature, etc.
 * @param ...rest - Additional provider-specific arguments
 * @returns Promise<any> - Generated content or async generator if streaming
 * 
 * @example
 * ```typescript
 * // Non-streaming generation
 * const result = await generate("openai", {
 *   message: "Write a short story",
 *   model: "gpt-4",
 *   temperature: 0.7,
 *   stream: false,
 *   context: { env: process.env }
 * });
 * 
 * // Streaming generation
 * const stream = await generate("openai", {
 *   message: "Write a long story",
 *   model: "gpt-4",
 *   stream: true,
 *   context: { env: process.env }
 * });
 * 
 * for await (const chunk of stream) {
 *   console.log(chunk);
 * }
 * ```
 */
export const generate = async (provider: ProviderName, args: GenerateArgs, ...rest: any[]) => {
  if (args.stream) {
    // Assume each provider's generate returns an async generator if stream:true
    return providers[provider].generate({ ...args, stream: true }, ...rest);
  }
  return providers[provider].generate(args, ...rest);
};

/**
 * Generate text content using enhanced tool support with LangChain.
 * When tools are provided, uses LangChain's tool integration capabilities.
 * 
 * @param provider - The AI provider to use (currently supports "google")
 * @param args - Generation arguments including tools, prompt, model, etc.
 * @returns Promise<any> - Generated content with tool usage
 * 
 * @example
 * ```typescript
 * const result = await generateWithTools("google", {
 *   message: "Who won the euro 2024?",
 *   model: "gemini-2.5-flash",
 *   tools: [{ google_search: {} }],
 *   context: { env: process.env }
 * });
 * ```
 */
export const generateWithTools = async (provider: ProviderName, args: GenerateArgs, ...rest: any[]) => {
  // Use the same generate function but ensure tools are passed through
  return providers[provider].generate(args, ...rest);
};

/**
 * Generate content with image input using the specified provider.
 * 
 * @param provider - The AI provider to use ("bedrock", "openai", or "google")
 * @param args - Generation arguments including prompt, image data, model, etc.
 * @param ...rest - Additional provider-specific arguments
 * @returns Promise<any> - Generated content based on image and text input
 * 
 * @example
 * ```typescript
 * const result = await generateWithImage("openai", {
 *   message: "Describe this image",
 *   imagePath: "/path/to/image.jpg",
 *   model: "gpt-4-vision-preview",
 *   context: { env: process.env }
 * });
 * ```
 */
export const generateWithImage = async (provider: ProviderName, args: GenerateWithImageArgs, ...rest: any[]) => {
  return providers[provider].generateWithImage(args, ...rest);
};

/**
 * Generate embeddings for text using the specified provider.
 * 
 * @param provider - The AI provider to use ("bedrock", "openai", or "google")
 * @param args - Embedding arguments including text and model
 * @returns Promise<number[]> - Vector embeddings for the input text
 * 
 * @example
 * ```typescript
 * const embeddings = await embedding("openai", {
 *   message: "This is a sample text to embed",
 *   model: "text-embedding-ada-002",
 *   context: { env: process.env }
 * });
 * ```
 */
export const embedding = async (provider: ProviderName, args: EmbeddingArgs) => {
  return providers[provider].embedding(args);
};

/**
 * Create a Language Model instance using the specified provider.
 * 
 * @param provider - The AI provider to use ("bedrock", "openai", or "google")
 * @param args - LLM configuration arguments including model, temperature, etc.
 * @param ...rest - Additional provider-specific arguments
 * @returns Promise<any> - Configured language model instance
 * 
 * @example
 * ```typescript
 * const llmInstance = await llm("openai", {
 *   model: "gpt-4",
 *   input: "Sample input text",
 *   context: { env: process.env }
 * });
 * ```
 */
export const llm = async (provider: ProviderName, args: LLMArgs, ...rest: any[]) => {
  return providers[provider].llm(args, ...rest);
};

/**
 * Convert text to speech using the specified provider.
 * 
 * @param provider - The AI provider to use ("bedrock", "openai", or "google")
 * @param args - Text-to-speech arguments including text, voice, speed, etc.
 * @returns Promise<Buffer | string> - Audio data as buffer or URL
 * 
 * @example
 * ```typescript
 * const audioBuffer = await textToSpeech("openai", {
 *   text: "Hello, this is a text-to-speech example",
 *   voice: "alloy",
 *   context: { env: process.env }
 * });
 * ```
 */
export const textToSpeech = async (provider: ProviderName, args: TextToSpeechArgs) => {
  return providers[provider].textToSpeech(args);
};

export { integrateDataToPromptTemplate };

export default {
  generate,
  generateWithImage,
  embedding,
  llm,
  textToSpeech,
  integrateDataToPromptTemplate,
};
