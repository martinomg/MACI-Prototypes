import * as generationsController from "../services/generations/generations.controllers";

/**
 * Directus Endpoint for AI Generation Services
 * 
 * Provides REST API endpoints for various AI generation capabilities:
 * - Text generation with streaming support
 * - Image-based text generation
 * - Text embeddings
 * - Language model instances
 * - Text-to-speech synthesis
 * 
 * Usage:
 * POST /generations/:provider/generate - Generate text content
 * POST /generations/:provider/generateWithImage - Generate content from image
 * POST /generations/:provider/embedding - Generate text embeddings
 * POST /generations/:provider/llm - Create LLM instance
 * POST /generations/:provider/textToSpeech - Convert text to speech
 * 
 * Supported providers: "bedrock", "openai", "google"
 */

export default (router: any, context: any) => {
  // Helper to extract provider and args from request
  const getProviderAndArgs = (req: any) => {
    const provider = req.params.provider;
    const { env: customEnv, ...args } = req.body || {};
    return { provider, args, customEnv };
  };

  /**
   * Generate text content with optional streaming
   * 
   * POST /:provider/generate
   * 
   * Body parameters:
   * - message: string - The input text/prompt
   * - model?: string - Model to use (defaults to provider default)
   * - system?: string - System prompt
   * - prev?: any[] - Previous conversation history
   * - temperature?: number - Sampling temperature (0-1)
   * - max_tokens?: number - Maximum tokens to generate
   * - stream?: boolean - Enable streaming response
   * - env?: object - Custom environment variables (for API keys)
   * 
   * Example:
   * POST /generations/openai/generate
   * {
   *   "message": "Write a haiku about coding",
   *   "model": "gpt-4",
   *   "temperature": 0.7,
   *   "stream": false,
   *   "env": {
   *     "OPENAI_API_KEY": "sk-..."
   *   }
   * }
   */
  router.post("/:provider/generate", async (req: any, res: any) => {
    try {
      const { provider, args, customEnv } = getProviderAndArgs(req);
      generationsController.validateProvider(provider);
      
      const providerContext = generationsController.createProviderContext(context, customEnv);
      const stream = args.stream === true;
      
      if (stream) {
        // Set up Server-Sent Events for streaming
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Cache-Control");
        res.flushHeaders();
        
        const generator = await generationsController.handleGenerate(provider, args, providerContext);
        
        // Check if generator is an async iterator
        if (generator && typeof (generator as any)[Symbol.asyncIterator] === 'function') {
          for await (const chunk of (generator as AsyncIterable<any>)) {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
        } else {
          // If not an async iterator, treat as single result
          res.write(`data: ${JSON.stringify(generator)}\n\n`);
        }
        res.end();
      } else {
        const result = await generationsController.handleGenerate(provider, args, providerContext);
        res.json({ result });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * Generate content based on image input
   * 
   * POST /:provider/generateWithImage
   * 
   * Body parameters:
   * - message: string - The text prompt about the image
   * - imagePath: string - Path to the image file
   * - model?: string - Model to use (must support vision)
   * - temperature?: number - Sampling temperature
   * 
   * Example:
   * POST /generations/openai/generateWithImage
   * {
   *   "message": "What do you see in this image?",
   *   "imagePath": "/uploads/image.jpg",
   *   "model": "gpt-4-vision-preview"
   * }
   */
  router.post("/:provider/generateWithImage", async (req: any, res: any) => {
    try {
      const { provider, args, customEnv } = getProviderAndArgs(req);
      generationsController.validateProvider(provider);
      
      const providerContext = generationsController.createProviderContext(context, customEnv);
      const result = await generationsController.handleGenerateWithImage(provider, args, providerContext);
      
      res.json({ result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * Generate text content with tools (enhanced native API support)
   * 
   * POST /:provider/generateWithTools
   * 
   * Body parameters:
   * - message: string - The input text/prompt
   * - model?: string - Model to use (defaults to provider default)
   * - system?: string - System prompt
   * - prev?: any[] - Previous conversation history
   * - temperature?: number - Sampling temperature (0-1)
   * - max_tokens?: number - Maximum tokens to generate
   * - stream?: boolean - Enable streaming response
   * - tools?: Tool[] - Array of tools to use (e.g., [{ google_search: {} }])
   * - env?: object - Custom environment variables (for API keys)
   * 
   * Example:
   * POST /generations/google/generateWithTools
   * {
   *   "message": "Who won the euro 2024?",
   *   "model": "gemini-2.0-flash-exp",
   *   "tools": [{ "google_search": {} }],
   *   "env": {
   *     "GOOGLEGENAI_API_KEY": "..."
   *   }
   * }
   */
  router.post("/:provider/generateWithTools", async (req: any, res: any) => {
    try {
      const { provider, args, customEnv } = getProviderAndArgs(req);
      generationsController.validateProvider(provider);
      
      const providerContext = generationsController.createProviderContext(context, customEnv);
      const stream = args.stream === true;
      
      if (stream) {
        // Set up Server-Sent Events for streaming
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Headers", "Cache-Control");
        res.flushHeaders();
        
        const generator = await generationsController.handleGenerateWithTools(provider, args, providerContext);
        
        // Check if generator is an async iterator
        if (generator && typeof (generator as any)[Symbol.asyncIterator] === 'function') {
          for await (const chunk of (generator as AsyncIterable<any>)) {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
        } else {
          // If not an async iterator, treat as single result
          res.write(`data: ${JSON.stringify(generator)}\n\n`);
        }
        res.end();
      } else {
        const result = await generationsController.handleGenerateWithTools(provider, args, providerContext);
        res.json({ result });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * Generate text embeddings
   * 
   * POST /:provider/embedding
   * 
   * Body parameters:
   * - message: string | string[] - Text to embed
   * - model?: string - Embedding model to use
   * 
   * Example:
   * POST /generations/openai/embedding
   * {
   *   "message": "This is text to convert to embeddings",
   *   "model": "text-embedding-ada-002"
   * }
   */
  router.post("/:provider/embedding", async (req: any, res: any) => {
    try {
      const { provider, args, customEnv } = getProviderAndArgs(req);
      generationsController.validateProvider(provider);
      
      const providerContext = generationsController.createProviderContext(context, customEnv);
      const result = await generationsController.handleEmbedding(provider, args, providerContext);
      
      res.json({ result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * Create a language model instance
   * 
   * POST /:provider/llm
   * 
   * Body parameters:
   * - model?: string - Model to use
   * - input: string - Input text for the LLM
   * - system?: string - System prompt
   * - temperature?: number - Sampling temperature
   * 
   * Example:
   * POST /generations/openai/llm
   * {
   *   "input": "Explain quantum computing",
   *   "model": "gpt-4",
   *   "temperature": 0.5
   * }
   */
  router.post("/:provider/llm", async (req: any, res: any) => {
    try {
      const { provider, args, customEnv } = getProviderAndArgs(req);
      generationsController.validateProvider(provider);
      
      const providerContext = generationsController.createProviderContext(context, customEnv);
      const result = await generationsController.handleLLM(provider, args, providerContext);
      
      res.json({ result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * Convert text to speech
   * 
   * POST /:provider/textToSpeech
   * 
   * Body parameters:
   * - text: string - Text to convert to speech
   * - voice?: string - Voice to use
   * - output_format?: string - Audio format
   * - language?: string - Language code
   * - output_path?: string - Where to save the audio file
   * 
   * Example:
   * POST /generations/openai/textToSpeech
   * {
   *   "text": "Hello, this is a test of text to speech",
   *   "voice": "alloy",
   *   "output_format": "mp3"
   * }
   */
  router.post("/:provider/textToSpeech", async (req: any, res: any) => {
    try {
      const { provider, args, customEnv } = getProviderAndArgs(req);
      generationsController.validateProvider(provider);
      
      const providerContext = generationsController.createProviderContext(context, customEnv);
      const result = await generationsController.handleTextToSpeech(provider, args, providerContext);
      
      res.json({ result });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  /**
   * Get available providers and their capabilities
   * 
   * GET /providers
   */
  router.get("/providers", (req: any, res: any) => {
    res.json({
      providers: ["bedrock", "openai", "google"],
      capabilities: {
        bedrock: ["generate", "generateWithImage", "embedding", "llm", "textToSpeech"],
        openai: ["generate", "generateWithImage", "embedding", "llm", "textToSpeech"],
        google: ["generate", "generateWithImage", "generateWithTools", "embedding", "llm", "textToSpeech", "google_search", "code_execution"]
      },
      endpoints: [
        "POST /:provider/generate",
        "POST /:provider/generateWithImage",
        "POST /:provider/generateWithTools",
        "POST /:provider/embedding",
        "POST /:provider/llm",
        "POST /:provider/textToSpeech",
        "GET /providers"
      ]
    });
  });
};
