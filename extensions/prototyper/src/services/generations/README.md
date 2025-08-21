# Generations Service Documentation

The Generations Service provides a unified interface for working with multiple AI providers (OpenAI, AWS Bedrock, Google) through Directus endpoints.

## Overview

This service includes:
- **Service Layer** (`generations.service.ts`) - Core business logic
- **Controller Layer** (`generations.controllers.ts`) - Request handling and validation
- **Endpoint Layer** (`generations.endpoints.ts`) - REST API routes
- **Provider Support** - OpenAI, AWS Bedrock, Google GenAI

## Available Endpoints

### Base URL
All endpoints are prefixed with `/generations/:provider` where provider is one of:
- `openai`
- `bedrock` 
- `google`

### 1. Text Generation
`POST /generations/:provider/generate`

Generate text content with optional streaming support.

**Request Body:**
```json
{
  "message": "Write a haiku about coding",
  "model": "gpt-4",
  "system": "You are a helpful assistant",
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false,
  "prev": []
}
```

**Response (Non-streaming):**
```json
{
  "result": "Code flows like water\nThrough silicon pathways bright\nLogic finds its way"
}
```

**Response (Streaming):**
Server-sent events with `Content-Type: text/event-stream`
```
data: {"kwargs":{"content":"Code"}}

data: {"kwargs":{"content":" flows"}}

data: {"kwargs":{"content":" like"}}
```

### 2. Image-based Generation
`POST /generations/:provider/generateWithImage`

Generate content based on image input.

**Request Body:**
```json
{
  "message": "What do you see in this image?",
  "imagePath": "/uploads/image.jpg",
  "model": "gpt-4-vision-preview",
  "temperature": 0.7
}
```

**Response:**
```json
{
  "result": "I can see a beautiful landscape with mountains in the background..."
}
```

### 3. Text Embeddings
`POST /generations/:provider/embedding`

Generate vector embeddings for text.

**Request Body:**
```json
{
  "message": "This is text to convert to embeddings",
  "model": "text-embedding-ada-002"
}
```

**Response:**
```json
{
  "result": [0.1234, -0.5678, 0.9012, ...]
}
```

### 4. Language Model Instance
`POST /generations/:provider/llm`

Create a configured language model instance.

**Request Body:**
```json
{
  "input": "Explain quantum computing",
  "model": "gpt-4",
  "system": "You are a physics expert",
  "temperature": 0.5
}
```

### 5. Text to Speech
`POST /generations/:provider/textToSpeech`

Convert text to speech audio.

**Request Body:**
```json
{
  "text": "Hello, this is a test of text to speech",
  "voice": "alloy",
  "output_format": "mp3",
  "language": "en",
  "output_path": "/uploads/speech.mp3"
}
```

### 6. Provider Information
`GET /generations/providers`

Get information about available providers and capabilities.

**Response:**
```json
{
  "providers": ["bedrock", "openai", "google"],
  "capabilities": {
    "bedrock": ["generate", "generateWithImage", "embedding", "llm", "textToSpeech"],
    "openai": ["generate", "generateWithImage", "embedding", "llm", "textToSpeech"],
    "google": ["generate", "generateWithImage", "embedding", "llm", "textToSpeech"]
  },
  "endpoints": [
    "POST /generations/:provider/generate",
    "POST /generations/:provider/generateWithImage",
    "POST /generations/:provider/embedding",
    "POST /generations/:provider/llm",
    "POST /generations/:provider/textToSpeech",
    "GET /generations/providers"
  ]
}
```

## Environment Variables

Each provider requires specific environment variables:

### OpenAI
```bash
OPENAI_API_KEY=sk-...
```

### AWS Bedrock
```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

### Google GenAI
```bash
GOOGLE_AI_API_KEY=...
```

## Usage Examples

### JavaScript/TypeScript Client

```javascript
// Non-streaming generation
const response = await fetch('/generations/openai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Write a short story about robots",
    model: "gpt-4",
    temperature: 0.8,
    stream: false
  })
});

const { result } = await response.json();
console.log(result);

// Streaming generation
const response = await fetch('/generations/openai/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Write a long story about robots",
    model: "gpt-4",
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data);
    }
  }
}
```

### cURL Examples

```bash
# Text generation
curl -X POST http://localhost:8055/generations/openai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain machine learning in simple terms",
    "model": "gpt-4",
    "temperature": 0.7
  }'

# Embeddings
curl -X POST http://localhost:8055/generations/openai/embedding \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Sample text for embedding",
    "model": "text-embedding-ada-002"
  }'

# Provider info
curl http://localhost:8055/generations/providers
```

## Architecture

### Service Layer
- **Purpose**: Core business logic and provider abstraction
- **File**: `src/services/generations/generations.service.ts`
- **Responsibilities**:
  - Unified interface across providers
  - Parameter validation and transformation
  - Provider routing

### Controller Layer
- **Purpose**: Request handling and business logic coordination
- **File**: `src/services/generations/generations.controllers.ts`
- **Responsibilities**:
  - Request validation
  - Response formatting
  - Error handling
  - Context management

### Endpoint Layer
- **Purpose**: REST API routing and HTTP handling
- **File**: `src/endpoints/generations.endpoints.ts`
- **Responsibilities**:
  - Route definition
  - HTTP request/response handling
  - Streaming setup
  - Documentation

### Provider Layer
- **Purpose**: Provider-specific implementations
- **Files**: `src/services/generations/providers/*.provider.ts`
- **Responsibilities**:
  - Provider-specific API integration
  - Model parameter mapping
  - Authentication handling

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid API keys)
- `500` - Internal Server Error

## Adding New Providers

To add a new provider:

1. Create `src/services/generations/providers/newprovider.provider.ts`
2. Implement required functions: `generate`, `generateWithImage`, `embedding`, `llm`, `textToSpeech`
3. Add to provider imports in `generations.service.ts`
4. Update the `ProviderName` type
5. Add to the providers object
6. Update documentation

## Streaming Support

Streaming is supported for text generation endpoints. When `stream: true` is set:
- Response uses `text/event-stream` content type
- Data is sent as Server-Sent Events
- Each chunk is JSON-encoded in `data:` lines
- Connection is kept alive until generation completes

## Type Definitions

All TypeScript interfaces are defined in `generations.service.types.ts`:

- `ProviderContext` - Context passed to providers
- `GenerateArgs` - Text generation parameters  
- `GenerateWithImageArgs` - Image generation parameters
- `EmbeddingArgs` - Embedding parameters
- `LLMArgs` - LLM instance parameters
- `TextToSpeechArgs` - TTS parameters
