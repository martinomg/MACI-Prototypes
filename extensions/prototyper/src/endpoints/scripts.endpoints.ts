import vectordb from '../services/vectordb/vectordb.service';
import pkg from '../../package.json';
import { handleGenerate, handleGenerateWithTools, validateProvider, createProviderContext } from '../services/generations/generations.controllers';

export default (router: any, context: any) => {
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

            // Step 1: Search for job opportunities
            const searchArgs = {
                model: 'gemini-2.5-flash',
                message: `busca 5 oportunidades de empleo concretas en Chile (con un link y un ficha) que calcen bien con el siguiente perfil que escribió un usuario: ${instruction}`,
                stream: false,
                tools: [
                    {
                        "google_search": {}
                    }
                ]
            };

            validateProvider(provider);
            const providerContext = createProviderContext(context);
            
            const searchResult = await handleGenerateWithTools(provider, searchArgs, providerContext);

            // Step 2: Structure the results
            const structureArgs = {
                model: 'gemini-2.5-flash',
                message: `dale estructura al siguiente resultado: ${JSON.stringify(searchResult)}`,
                stream: false,
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

            const structuredResult = await handleGenerate(provider, structureArgs, providerContext);

            res.json({ result: structuredResult });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    });
};
