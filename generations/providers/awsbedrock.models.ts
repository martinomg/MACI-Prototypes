import _ from 'lodash'
// 7673-9785-8529
const models = {
    "deepseek.r1-v1:0": {
        "$.model": "us.deepseek.r1-v1:0",
    },
    "anthropic.claude-sonnet-4": {
        "$.model": "us.anthropic.claude-sonnet-4-20250514-v1:0",
        "$.modelKwargs.anthropic_version": "bedrock-2023-05-31",
    },
    "anthropic.claude-sonnet-3-7": {
        "$.model": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-7-sonnet-20250219-v1:0",
        "$.modelKwargs.anthropic_version": "bedrock-2023-05-31",
    },
    "anthropic.claude-3-7-sonnet-20250219-v1:0": {
        "$.model": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-7-sonnet-20250219-v1:0",
        "$.modelKwargs.anthropic_version": "bedrock-2023-05-31",
    },
    "anthropic.claude-sonnet-3-5-2": {
        "$.model": "anthropic.claude-3-5-sonnet-20241022-v2:0",
    },
    "anthropic.claude-sonnet-3-5": {
        "$.model": "anthropic.claude-3-5-sonnet-20240620-v1:0",
    },
    "anthropic.claude-3-5-sonnet-20240620-v1:0": {
        "$.model": "anthropic.claude-3-5-sonnet-20240620-v1:0",
        "$.modelKwargs.anthropic_version": "bedrock-2023-05-31",
    },
    "anthropic.claude-sonnet-3": {
        "$.model": "anthropic.claude-3-sonnet-20240229-v1:0",
        "$.modelKwargs.anthropic_version": "bedrock-2023-05-31",
    },
    "anthropic.claude-3-sonnet-20240229-v1:0": {
        "$.model": "anthropic.claude-3-sonnet-20240229-v1:0",
        "$.modelKwargs.anthropic_version": "bedrock-2023-05-31",
    },
    "anthropic.claude-3-haiku": {
        "$.model": "anthropic.claude-3-haiku-20240307-v1:0",
        "$.modelKwargs.anthropic_version": "bedrock-2023-05-31",
    },
    "anthropic.claude-3-5-haiku": {
        "$.model": "anthropic.claude-3-5-haiku-20241022",
        "$.modelKwargs.anthropic_version": "bedrock-2023-05-31",
    },
    "anthropic.claude-3-5-haiku-serverless": {
        "$.model": "anthropic.claude-3-haiku-20240307-v1:0",
        "$.modelKwargs.anthropic_version": "bedrock-2023-05-31",
    },
    "anthropic.haiku": {
        "$.model": "anthropic.claude-3-haiku-20240307-v1:0",
        "$.modelKwargs.anthropic_version": "bedrock-2023-05-31",
    },
    "anthropic.claude-instant":{
        "$.model": "anthropic.claude-instant-v1",
    },
    "anthropic.claude-instant-v1":{
        "$.model": "anthropic.claude-instant-v1",
    },
    // Amazon Nova models
    "amazon.nova-premier-v1:0": {
        "$.model": "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-premier-v1:0",
    },
    "amazon.nova-pro-v1:0": {
        "$.model": "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0",
    },
    "amazon.nova-lite-v1:0": {
        "$.model": "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0",
    },
    "amazon.nova-micro-v1:0": {
        "$.model": "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-micro-v1:0",
    },
    "amazon.nova-canvas-v1:0": {
        "$.model": "amazon.nova-canvas-v1:0",
    },
    "amazon.nova-reel-v1:0": {
        "$.model": "amazon.nova-reel-v1:0",
    },
    "amazon.nova-reel-v1:1": {
        "$.model": "amazon.nova-reel-v1:1",
    },
    // Amazon Titan models
    "amazon.titan-text-premier-v1:0": {
        "$.model": "amazon.titan-text-premier-v1:0",
    },
    "amazon.titan-text-express-v1": {
        "$.model": "amazon.titan-text-express-v1",
    },
    "amazon.titan-text-lite-v1": {
        "$.model": "amazon.titan-text-lite-v1",
    },
    "amazon.titan-embed-text-v1": {
        "$.model": "amazon.titan-embed-text-v1",
    },
    "amazon.titan-embed-text-v2:0": {
        "$.model": "amazon.titan-embed-text-v2:0",
    },
    "amazon.titan-embed-image-v1": {
        "$.model": "amazon.titan-embed-image-v1",
    },
    "amazon.titan-image-generator-v1": {
        "$.model": "amazon.titan-image-generator-v1",
    },
    "amazon.titan-image-generator-v2:0": {
        "$.model": "amazon.titan-image-generator-v2:0",
    },
    // Meta Llama models
    "meta.llama3-8b":{
        "$.model": "meta.llama3-8b-instruct-v1:0",
    },
    "meta.llama3-8b-instruct-v1:0":{
        "$.model": "meta.llama3-8b-instruct-v1:0",
    },
    "meta.llama3-70b":{
        "$.model": "meta.llama3-70b-instruct-v1:0",
    },
    "meta.llama3-70b-instruct-v1:0":{
        "$.model": "meta.llama3-70b-instruct-v1:0",
    },
    // AI21 Labs models
    "ai21.jamba-1-5-large-v1:0": {
        "$.model": "ai21.jamba-1-5-large-v1:0",
    },
    "ai21.jamba-1-5-mini-v1:0": {
        "$.model": "ai21.jamba-1-5-mini-v1:0",
    },
    "ai21.jamba-instruct-v1:0": {
        "$.model": "ai21.jamba-instruct-v1:0",
    },
    // Stability AI models
    "stability.stable-diffusion-xl-v1": {
        "$.model": "stability.stable-diffusion-xl-v1",
    },
    "stability.stable-diffusion-xl-v1:0": {
        "$.model": "stability.stable-diffusion-xl-v1:0",
    },
}

type ModelName = keyof typeof models;
type ModelIdentifier = ModelName | string; // Can be modelId or modelArn
type ModelParams = Record<string, string>;

const integrate_model_parameters = (input: Record<string, any>, model: string): Record<string, any> => {
    let modelKey: string | null = null;
    
    // First, try to find by direct model key
    if(model && (model as keyof typeof models) in models){
        modelKey = model;
    } else if (model) {
        // If not found, check if it's a modelArn and extract the modelId
        if (model.startsWith('arn:aws:bedrock:')) {
            const arnParts = model.split('/');
            const modelIdFromArn = arnParts[arnParts.length - 1];
            
            // Try to find the extracted modelId in our models
            if ((modelIdFromArn as keyof typeof models) in models) {
                modelKey = modelIdFromArn;
            } else {
                // Try to find by partial matching for versioned models
                const modelKeys = Object.keys(models);
                const matchingKey = modelKeys.find(key => {
                    const modelConfig = models[key as keyof typeof models];
                    return modelConfig['$.model'] === modelIdFromArn;
                });
                if (matchingKey) {
                    modelKey = matchingKey;
                }
            }
        }
    }
    
    if (modelKey) {
        const modelConfig = models[modelKey as keyof typeof models];
        for(const [key,val] of Object.entries(modelConfig)){
            const path = key.replace(/^\$\./, '')
            _.set(input, path, val);
        }
    }
    return input
}

export default {
    integrate_model_parameters
}