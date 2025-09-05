import vectordb from '../services/vectordb/vectordb.service';
import pkg from '../../package.json';
import { handleGenerate, handleGenerateWithTools, validateProvider, createProviderContext, handleEmbedding } from '../services/generations/generations.controllers';

export default (router: any, context: any) => {
    const { services, getSchema } = context;
    const { ItemsService } = services;

    router.get('/status', async (req: any, res: any) => {
        const qdrantStatus = await vectordb.getStatus();
        const providers = {
            openai: !!process.env.OPENAI_API_KEY,
            google: !!process.env.GOOGLEGENAI_API_KEY,
            aws: !!process.env.AWS_ACCESS_KEY_ID,
        }

        res.json({ 
            status: 'Script Composer is running',
            version: pkg.version,
            providers,
            vectordb: qdrantStatus,
        });
    });

    router.get('/hello', async (req: any, res: any) => {
        res.json({ status: 'hello' });
    });

    router.post('/instruction', async (req: any, res: any) => {
        try {
            const provider = 'google';
            const { instruction } = req.body;

            if (!instruction) {
                return res.status(400).json({ error: 'Instruction is required' });
            }

            // Step 1: Search for job opportunities with retry logic
            let searchResult;
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    const searchArgs = {
                        model: 'gemini-2.5-flash',
                        message: `busca 5 oportunidades de empleo concretas en Chile (con un link y un ficha) que calcen bien con el siguiente perfil que escribió un usuario: ${instruction}`,
                        stream: false,
                        maxTokens: 20000,
                        tools: [
                            {
                                "google_search": {}
                            }
                        ]
                    };
                    validateProvider(provider);
                    const providerContext = createProviderContext(context);
                    searchResult = await handleGenerateWithTools(provider, searchArgs, providerContext);
                    if (searchResult && searchResult.content) {
                        break; // Success
                    }
                } catch (error) {
                    console.error(`Attempt ${attempts + 1} failed:`, error);
                }
                attempts++;
            }

            if (!searchResult || !searchResult.content) {
                return res.status(500).json({ error: 'Failed to get a valid search result from the AI model after several attempts.' });
            }

            console.log('Search Result:', JSON.stringify(searchResult, null, 2));

            // Step 2: Structure the results
            const structureArgs = {
                model: 'gemini-2.5-flash',
                message: `dale estructura al siguiente resultado: ${searchResult.content}`,
                stream: false,
                maxTokens: 20000,
                json_mode: true,
                response_schema: {
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "title": "OportunidadesLaboralesTerceraEdad",
                    "type": "object",
                    "properties": {
                        "oportunidades": {
                            "type": "array",
                            "description": "Lista de oportunidades laborales relevantes para adultos mayores o jubilados.",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "titulo": {
                                        "type": "string",
                                        "description": "Nombre o título del puesto de trabajo."
                                    },
                                    "descripcion": {
                                        "type": "string",
                                        "description": "Descripción detallada de la oportunidad laboral."
                                    },
                                    "perfil_requerido": {
                                        "type": "string",
                                        "description": "Requisitos o perfil buscado para la posición."
                                    },
                                    "horario": {
                                        "type": "string",
                                        "description": "Horario de trabajo especificado para la oferta."
                                    },
                                    "ubicacion": {
                                        "type": "string",
                                        "description": "Ciudad o región donde se ofrece el empleo."
                                    },
                                    "link": {
                                        "type": "string",
                                        "format": "uri",
                                        "description": "Enlace a la fuente o página donde se encuentra la oferta de empleo."
                                    }
                                },
                                "required": ["titulo", "descripcion", "perfil_requerido", "horario", "ubicacion", "link"],
                                "additionalProperties": false
                            },
                            "minItems": 1
                        }
                    },
                    "required": ["oportunidades"],
                    "additionalProperties": false
                }
            };

            const providerContext2 = createProviderContext(context);
            let structuredResult = await handleGenerate(provider, structureArgs, providerContext2);
            console.log('Structured Result (raw):', JSON.stringify(structuredResult, null, 2));

            // Handle cases where the result is a string that needs parsing
            if (typeof structuredResult === 'string') {
                try {
                    structuredResult = JSON.parse(structuredResult);
                } catch (e) {
                    console.error("Failed to parse structured result string:", e);
                    // The result is a string but not valid JSON, handle as an error or try to recover
                    return res.status(500).json({ error: 'The AI returned a malformed structured result.', data: structuredResult });
                }
            }

            // Save to Directus
            try {
                const schema = await getSchema();
                const perfilesService = new ItemsService('perfiles', { schema: schema, accountability: req.accountability });
                const perfilId = await perfilesService.createOne({
                    descripcion: instruction,
                    resultados_raw: searchResult,
                    ofertas: structuredResult,
                });

                if (structuredResult && structuredResult.oportunidades && structuredResult.oportunidades.length > 0) {
                    const oportunidadesService = new ItemsService('oportunidades', { schema: schema, accountability: req.accountability });
                    for (const oportunidad of structuredResult.oportunidades) {
                        await oportunidadesService.createOne({
                            ...oportunidad,
                            perfil: perfilId,
                        });
                    }
                }
            } catch (dbError: any) {
                console.error('Directus DB Error:', dbError);
            }

            res.json({ result: structuredResult });
        } catch (err: any) {
            console.error('General Error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/vectorize/oportunidad/:id', async (req:any, res:any) => {
        try {
            const { id } = req.params;
            const schema = await getSchema();
            const oportunidadesService = new ItemsService('oportunidades', { schema, accountability: req.accountability });
    
            // 1. Fetch the item
            const oportunidad = await oportunidadesService.readOne(id, {
                fields: ['titulo', 'descripcion', 'horario', 'link', 'perfil_requerido', 'ubicacion']
            });
    
            if (!oportunidad) {
                return res.status(404).json({ error: 'Oportunidad not found' });
            }
    
            // 2. Create the document for vectorization
            const documento = `
                Titulo: ${oportunidad.titulo || ''}
                Descripción: ${oportunidad.descripcion || ''}
                Horario: ${oportunidad.horario || ''}
                Link: ${oportunidad.link || ''}
                Perfil Requerido: ${oportunidad.perfil_requerido || ''}
                Ubicación: ${oportunidad.ubicacion || ''}
            `.trim();
    
            // 3. Generate the embedding
            const provider = 'google';
            const model = 'text-embedding-004';
            const embeddingProviderContext = createProviderContext(context);
            const embeddingResult = await handleEmbedding(provider, {
                message: documento,
                model: model,
            }, embeddingProviderContext);
            
            // The result can be number[] or number[][]. Since we send one document, we expect one embedding.
            const vector: number[] = (Array.isArray(embeddingResult[0])) 
                ? embeddingResult[0] as number[] 
                : embeddingResult as number[];
    
            // 4. Update the item in Directus
            await oportunidadesService.updateOne(id, {
                documento: documento,
                vector_provider: provider,
                vector_model: model,
                vector: vector,
            });
    
            // 5. Upsert the vector into Qdrant
            const qdrantCollection = 'oportunidades';
    
            // Ensure the collection exists
            const collectionExists = await vectordb.collectionExists({ collection_name: qdrantCollection });
            if (!collectionExists || !collectionExists.exists) {
                await vectordb.createCollection({
                    collection_name: qdrantCollection,
                    size: vector.length, // The size of the vector
                    distance: 'Cosine'
                });
            }
            
            await vectordb.upsertPointsRecords({
                collection_name: qdrantCollection,
                points: [
                    {
                        id: id,
                        vector: vector,
                        payload: {
                            documento: documento,
                            titulo: oportunidad.titulo,
                            descripcion: oportunidad.descripcion,
                            horario: oportunidad.horario,
                            link: oportunidad.link,
                            perfil_requerido: oportunidad.perfil_requerido,
                            ubicacion: oportunidad.ubicacion,
                        }
                    }
                ]
            });
    
            res.json({ success: true, message: `Oportunidad ${id} vectorized and saved.` });
    
        } catch (err: any) {
            console.error('Vectorization Error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/vectorize/oportunidades/pending', async (req:any, res:any) => {
        try {
            const schema = await getSchema();
            const oportunidadesService = new ItemsService('oportunidades', { schema, accountability: req.accountability });

            const itemsToVectorize = await oportunidadesService.readByQuery({
                filter: {
                    vector: { _null: true }
                },
                fields: ['id', 'titulo', 'descripcion', 'horario', 'link', 'perfil_requerido', 'ubicacion']
            });

            if (!itemsToVectorize || itemsToVectorize.length === 0) {
                return res.json({ success: true, message: 'No pending opportunities to vectorize.', processed: 0 });
            }

            let processedCount = 0;
            const qdrantCollection = 'oportunidades';

            // Ensure the collection exists before the loop
            const collectionExists = await vectordb.collectionExists({ collection_name: qdrantCollection });
            if (!collectionExists || !collectionExists.exists) {
                // Use a sample vector size from the first item to create the collection
                const sampleOportunidad = itemsToVectorize[0];
                const sampleDocumento = `
                    Titulo: ${sampleOportunidad.titulo || ''}
                    Descripción: ${sampleOportunidad.descripcion || ''}
                `.trim();
                const provider = 'google';
                const model = 'text-embedding-004';
                const embeddingProviderContext = createProviderContext(context);
                const sampleEmbeddingResult = await handleEmbedding(provider, {
                    message: sampleDocumento,
                    model: model,
                }, embeddingProviderContext);
                const sampleVector: number[] = (Array.isArray(sampleEmbeddingResult[0])) 
                    ? sampleEmbeddingResult[0] as number[] 
                    : sampleEmbeddingResult as number[];

                await vectordb.createCollection({
                    collection_name: qdrantCollection,
                    size: sampleVector.length,
                    distance: 'Cosine'
                });
            }

            for (const oportunidad of itemsToVectorize) {
                try {
                    const documento = `
                        Titulo: ${oportunidad.titulo || ''}
                        Descripción: ${oportunidad.descripcion || ''}
                        Horario: ${oportunidad.horario || ''}
                        Link: ${oportunidad.link || ''}
                        Perfil Requerido: ${oportunidad.perfil_requerido || ''}
                        Ubicación: ${oportunidad.ubicacion || ''}
                    `.trim();
        
                    const provider = 'google';
                    const model = 'text-embedding-004';
                    const embeddingProviderContext = createProviderContext(context);
                    const embeddingResult = await handleEmbedding(provider, {
                        message: documento,
                        model: model,
                    }, embeddingProviderContext);
                    
                    const vector: number[] = (Array.isArray(embeddingResult[0])) 
                        ? embeddingResult[0] as number[] 
                        : embeddingResult as number[];
            
                    await oportunidadesService.updateOne(oportunidad.id, {
                        documento: documento,
                        vector_provider: provider,
                        vector_model: model,
                        vector: vector,
                    });
            
                    await vectordb.upsertPointsRecords({
                        collection_name: qdrantCollection,
                        points: [
                            {
                                id: oportunidad.id,
                                vector: vector,
                                payload: {
                                    documento: documento,
                                    titulo: oportunidad.titulo,
                                    descripcion: oportunidad.descripcion,
                                    horario: oportunidad.horario,
                                    link: oportunidad.link,
                                    perfil_requerido: oportunidad.perfil_requerido,
                                    ubicacion: oportunidad.ubicacion,
                                }
                            }
                        ]
                    });

                    processedCount++;
                } catch (itemError: any) {
                    console.error(`Failed to process oportunidad ${oportunidad.id}:`, itemError.message);
                    // Continue to next item
                }
            }

            res.json({ success: true, message: `Successfully vectorized ${processedCount} opportunities.`, processed: processedCount });

        } catch (err: any) {
            console.error('Batch Vectorization Error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/search/oportunidades', async (req:any, res:any) => {
        try {
            const { frase, limit = 3 } = req.body;

            if (!frase || (Array.isArray(frase) && frase.length === 0)) {
                return res.status(400).json({ error: 'Search phrase "frase" is required and cannot be empty.' });
            }

            const provider = 'google';
            const model = 'text-embedding-004';
            const embeddingProviderContext = createProviderContext(context);
            const qdrantCollection = 'oportunidades';

            if (Array.isArray(frase)) {
                // Batch search for multiple phrases
                const embeddings = await handleEmbedding(provider, {
                    message: frase, // Pass the array of strings
                    model: model,
                }, embeddingProviderContext);

                const searchQueries = (embeddings as number[][]).map(vector => ({
                    query: vector,
                    limit: limit,
                    with_payload: true,
                }));

                const searchResult = await vectordb.searchKnnBatch({
                    collection_name: qdrantCollection,
                    searches: searchQueries,
                });

                res.json({ success: true, results: searchResult });

            } else {
                // Single search for one phrase
                const embeddingResult = await handleEmbedding(provider, {
                    message: frase,
                    model: model,
                }, embeddingProviderContext);

                const searchVector: number[] = embeddingResult as number[];

                const searchResult = await vectordb.searchKnn({
                    collection_name: qdrantCollection,
                    vector: searchVector,
                    limit: limit,
                    with_payload: true,
                });

                res.json({ success: true, results: searchResult });
            }

        } catch (err: any) {
            console.error('Search Error:', err);
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/ask/oportunidades', async (req:any, res:any) => {
        try {
            const { pregunta, limit = 5, link_pattern } = req.body;

            if (!pregunta) {
                return res.status(400).json({ error: 'Question "pregunta" is required.' });
            }

            // Step 1: Use Gemini to generate an optimized search phrase from the user's question
            const provider = 'google';
            const generationModel = 'gemini-2.5-flash';
            const embeddingModel = 'text-embedding-004';
            const providerContext = createProviderContext(context);

            const queryGenerationPrompt = `
                Eres un experto en optimización de consultas. Tu tarea es extraer una frase de búsqueda concisa de la pregunta del usuario que sea ideal para una búsqueda de similitud de vectores. 
                La frase debe capturar la intención principal y las palabras clave de la pregunta. No agregues nada más que la frase de búsqueda.

                Pregunta del usuario: "${pregunta}"

                Frase de búsqueda optimizada:
            `;

            const queryGenerationArgs = { 
                model: generationModel, 
                message: queryGenerationPrompt 
            };
            const queryGenerator = await handleGenerate(provider, queryGenerationArgs, providerContext);
            
            let searchPhrase = "";
            for await (const chunk of queryGenerator) {
                searchPhrase += (typeof chunk === 'string' ? chunk : chunk.content);
            }
            searchPhrase = searchPhrase.trim();

            // Step 2: Create an embedding for the *optimized* search phrase
            const embeddingResult = await handleEmbedding(provider, {
                message: searchPhrase,
                model: embeddingModel,
            }, providerContext);

            const searchVector: number[] = embeddingResult as number[];

            // Step 3: Use the vector to search for relevant opportunities in Qdrant
            const qdrantCollection = 'oportunidades';
            const searchOptions: any = {
                collection_name: qdrantCollection,
                vector: searchVector,
                limit: limit,
                with_payload: true,
            };

            if (link_pattern) {
                searchOptions.filter = {
                    must: [{
                        key: 'link',
                        match: {
                            text: link_pattern
                        }
                    }]
                };
            }

            const searchResults = await vectordb.searchKnn(searchOptions);

            if (!searchResults || searchResults.length === 0) {
                return res.json({ 
                    success: true, 
                    answer: "No se encontraron oportunidades relevantes para responder a tu pregunta.",
                    results: [],
                    searchPhrase 
                });
            }

            // Step 4: Augment - Create a context for the final answer generation
            const contextString = searchResults
                .map(result => result.payload.documento)
                .join('\n\n---\n\n');

            const finalPrompt = `
                Eres un asistente servicial para encontrar oportunidades de trabajo. 
                Responde la pregunta del usuario basándote únicamente en las siguientes oportunidades encontradas. 
                Si las oportunidades no proporcionan suficiente información para responder, indica que no pudiste encontrar una respuesta relevante en las oportunidades disponibles.

                Aquí están las oportunidades disponibles:
                ---
                ${contextString}
                ---

                Pregunta del usuario: "${pregunta}"

                Respuesta:
            `;

            // Step 5: Generate - Pass the context and original question to Gemini
            const llmArgs = { 
                model: generationModel, 
                message: finalPrompt 
            };
            const answerGenerator = await handleGenerate(provider, llmArgs, providerContext);
            
            let answer = "";
            for await (const chunk of answerGenerator) {
                answer += (typeof chunk === 'string' ? chunk : chunk.content);
            }

            res.json({ success: true, answer: answer, sources: searchResults, searchPhrase });

        } catch (err: any) {
            console.error('Ask Error:', err);
            res.status(500).json({ error: err.message });
        }
    });
};
