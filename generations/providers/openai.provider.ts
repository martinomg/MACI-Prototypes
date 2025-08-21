import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { messagesToObjects } from "../utils/messagesToObjects.util";
import { GenerateArgs, EmbeddingArgs, ProviderContext } from "../generations.service.types";

declare const process: any;

const getEnv = (context?: ProviderContext) => {
  const env = context?.env || process.env;
  return {
    OPENAI_API_KEY: env.OPENAI_API_KEY,
  };
};

export async function* generate(
  {
    context,
    model = "gpt-4o-mini",
    system = "You are a helpful assistant. Never explain what you do, just provide the requested response.",
    message = "",
    prev = [],
    temperature = 0.7,
    json_mode = false,
    response_schema,
    stream = false,
  }: GenerateArgs,
  details = false,
  checkPayload = false
) {
  const { OPENAI_API_KEY } = getEnv(context);
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not found in environment variables");
  
  let model_class = new ChatOpenAI({
    apiKey: OPENAI_API_KEY,
    modelName: model,
    temperature,
    streaming: stream,
  });
  
  // Apply structured output if json_mode is enabled
  if (json_mode) {
    if (response_schema) {
      // Convert our schema format to OpenAI's expected format
      let openaiSchema = response_schema.parameters || response_schema;
      
      // Handle additionalProperties setting
      if ((openaiSchema as any).type === "object") {
        // Check if additionalProperties is explicitly set in the schema
        const hasExplicitAdditionalProps = 'additionalProperties' in openaiSchema;
        
        // If strict mode is disabled (strict: false), allow additional properties
        // If strict mode is enabled or not specified, follow OpenAI requirements
        const useStrictMode = response_schema.strict !== false;
        
        if (!hasExplicitAdditionalProps) {
          // Only set additionalProperties if not explicitly provided
          openaiSchema = {
            ...openaiSchema,
            additionalProperties: !useStrictMode // true for flexible, false for strict
          };
        }
      }
      
      // Use strict mode unless explicitly disabled
      const strictMode = response_schema.strict !== false;
      
      model_class = model_class.withStructuredOutput(openaiSchema, {
        name: response_schema.name || "structured_output",
        strict: strictMode
      }) as any;
    } else {
      // Use basic JSON structure when no schema provided
      const basicSchema = {
        type: "object",
        properties: {
          response: { 
            type: "string", 
            description: "The response content" 
          }
        },
        required: ["response"],
        additionalProperties: false
      };
      model_class = model_class.withStructuredOutput(basicSchema, {
        name: "json_response",
        strict: true
      }) as any;
    }
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
  
  // Handle structured output differently - it returns the object directly, not in .content
  if (json_mode) {
    yield res; // For structured output, return the whole response object
  } else {
    yield res.content; // For regular text, return just the content
  }
};

export const embedding = async ({ model = "text-embedding-3-small", message }: EmbeddingArgs) => {
  const { OPENAI_API_KEY } = getEnv();
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not found in environment variables");
  const embeddings = new OpenAIEmbeddings({
    apiKey: OPENAI_API_KEY,
    modelName: model,
  });
  if (Array.isArray(message)) {
    return await embeddings.embedDocuments(message);
  } else {
    return await embeddings.embedQuery(message);
  }
};

export const generateWithImage = async () => {
  throw new Error("OpenAI: generateWithImage is not supported in this provider.");
};

export const llm = async () => {
  throw new Error("OpenAI: llm is not supported in this provider.");
};

export const textToSpeech = async () => {
  throw new Error("OpenAI: textToSpeech is not supported in this provider.");
};

export default {
  generate,
  embedding,
  generateWithImage,
  llm,
  textToSpeech,
};
