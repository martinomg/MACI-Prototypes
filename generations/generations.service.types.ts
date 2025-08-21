// Common types for generative providers

export interface ProviderContext {
  env: Record<string, any>;
}

// Tool definitions for providers that support them (like Google Search)
export interface Tool {
  google_search?: GoogleSearchTool;
  code_execution?: CodeExecutionTool;
  web_search_20250305?: WebSearchTool; // Anthropic's web search tool
  functionDeclarations?: FunctionDeclaration[];
  // Add other tools as needed
}

export interface GoogleSearchTool {
  // Empty object for basic Google Search functionality
  // Can be extended with parameters if needed
}

export interface CodeExecutionTool {
  // Empty object for basic Code Execution functionality
  // Can be extended with parameters if needed
}

export interface WebSearchTool {
  name?: string; // Optional name for the tool
  max_uses?: number; // Maximum number of searches allowed (default is 5)
}

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface GenerateArgs {
  context?: ProviderContext;
  model?: string;
  system?: string;
  message?: string;
  prev?: any[];
  temperature?: number;
  max_tokens?: number | null;
  json_mode?: boolean; // Enable structured JSON output
  response_schema?: JsonSchema; // JSON Schema for structured output (compatible with LangChain withStructuredOutput)
  region?: string;
  stream?: boolean; // Added for streaming support
  tools?: Tool[]; // Support for tools like Google Search
}

// JSON Schema interface compatible with LangChain's withStructuredOutput
export interface JsonSchema {
  name?: string;
  description?: string;
  strict?: boolean; // Controls whether to use strict mode (additionalProperties: false)
  parameters?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
    additionalProperties?: boolean; // Allow/disallow additional properties
    [key: string]: any;
  };
}

export interface GenerateWithImageArgs extends GenerateArgs {
  imagePath: string;
}

export interface EmbeddingArgs {
  context?: ProviderContext;
  model?: string;
  message: string | string[];
}

export interface LLMArgs {
  context?: ProviderContext;
  model?: string;
  system?: string;
  input: string;
}

export interface TextToSpeechArgs {
  context?: ProviderContext;
  text: string;
  output_path?: string;
  language?: string;
  output_format?: string;
  voice?: string;
  engine?: string;
}
