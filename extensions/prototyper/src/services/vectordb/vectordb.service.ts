// https://github.com/qdrant/qdrant-js
// https://qdrant.tech/documentation/concepts/
import axios, { AxiosError } from 'axios';

// TypeScript interfaces for type safety
interface CollectionParams {
    collection_name?: string | null | undefined;
    distance?: 'Cosine' | 'Euclid' | 'Dot' | 'Manhattan';
    size?: number;
    init_from?: string | null;
    optimizers_config?: any;
    hnsw_config?: any;
    quantization_config?: any;
    params?: any;
    on_disk?: boolean;
    on_disk_payload?: boolean;
}

interface VectorConfig {
    size: number;
    distance: string;
    hnsw_config?: any;
    quantization_config?: any;
    on_disk?: boolean;
}

interface MultiVectorParams {
    collection_name?: string | null | undefined;
    vectors: Record<string, VectorConfig>;
}

interface UpdateCollectionParams {
    collection_name?: string | null | undefined;
    optimizers_config?: any;
    hnsw_config?: any;
    quantization_config?: any;
    vectors_config?: any;
    params?: any;
}

interface PointsParams {
    collection_name?: string | null | undefined;
    ids?: (number | string)[];
    filter?: any;
    payload?: any;
    points?: any[];
    vectors?: any[];
    payloads?: any[];
}

interface SearchParams {
    collection_name?: string | null | undefined;
    mode?: 'default' | 'lookup' | 'random';
    filter?: any;
    params?: any;
    using?: string | null;
    with_vectors?: boolean | null;
    with_payload?: boolean | any;
    limit?: number;
    offset?: number;
    group_by?: string | null;
    vector?: number[] | null;
    lookup_strategy?: 'average_vector' | 'best_score';
    lookup_positive_vectors?: any[];
    lookup_negative_vectors?: any[];
    lookup_external_collection_name?: string | null;
    lookup_external_vector_name?: string | null;
}

interface GroupsSearchParams {
    vector: number[] | null;
    group_by: string | null;
    limit?: number;
    group_size?: number;
    with_lookup?: {
        collection: string;
        with_payload?: boolean | string[];
        with_vectors?: boolean;
    } | null;
}

// Use environment variables for host and port
const getQdrantUrl = () => {
  const host = process.env.QDRANT_HOST || 'http://host.docker.internal';
  const port = process.env.QDRANT_PORT || '6333';
  return `${host}:${port}`;
};


async function getStatus(){
    try {
        const {data:status} = await axios.get(`${getQdrantUrl()}`)
        return status
    } catch (error) {
        console.error('@status', error)
        return false
    }
}

/**
 * COLLECTIONS
 * A collection is a collection_named set of points (vectors with a payload) among which you can search. 
 * The vector of each point within the same collection must have the same dimensionality and be compared by a single metric. 
 * collection_named vectors can be used to have multiple vectors in a single point
 * each of which can have their own dimensionality and metric requirements.
 */

async function listCollections(){
    try {
        const {
            data:{
                result: {
                    collections
                }
            }
        } = await axios.get(`${getQdrantUrl()}/collections?wait=true`)
        return collections
    } catch (error) {
        console.error('@list_collections', error)
        return []
    }
}

async function listAliases(){
    try {
        const {
            data: {
                result: {
                    aliases
                }
            }
        } = await axios.get(`${getQdrantUrl()}/aliases`)
        return aliases
    } catch (error) {
        console.error('@list_aliases', error)
        return []
    }
}


async function collectionExists({
    collection_name = null,
}: { collection_name?: string | null }){
    try {
        if (!collection_name) {
            throw new Error('Collection collection_name is required');
        }

        const {
            data: {
                result
            }
        } = await axios.get(`${getQdrantUrl()}/collections/${collection_name}/exists`);
        
        return result;
    } catch (error: any) {
        if (error.response && error.response.status === 404) {
            return false;
        }
        console.error('@collection_exists', error);
        throw error;
    }
}

/**
 * Creates a new collection in Qdrant or returns existing collection status
 * @param {Object} params - The parameters object
 * @param {('Cosine'|'Euclid'|'Dot'|'Manhattan')} [params.distance='Cosine'] - Distance function for vector comparison
 * @param {string} params.collection_name - Name of the collection to create
 * @param {number} [params.size=1536] - Vector dimension size
 * @param {string} [params.init_from] - Name of collection to initialize from
 * @param {Object} [params.optimizers_config] - Configuration for vector index optimizers
 * @param {Object} [params.optimizers_config.deleted_threshold] - Threshold for deleted points
 * @param {Object} [params.optimizers_config.vacuum_min_vector_number] - Minimum vectors for vacuum
 * @param {Object} [params.optimizers_config.default_segment_number] - Default number of segments
 * @param {Object} [params.hnsw_config] - HNSW index configuration
 * @param {number} [params.hnsw_config.m] - Number of edges per node in the index graph
 * @param {number} [params.hnsw_config.ef_construct] - Size of the candidate list during index building
 * @param {number} [params.hnsw_config.full_scan_threshold] - Threshold for full scan
 * @param {Object} [params.quantization_config] - Vector quantization configuration
 * @param {Object} [params.params] - Additional collection parameters
 * @param {boolean} [params.on_disk=true] - Whether to store vectors on disk
 * @param {boolean} [params.on_disk_payload=true] - Whether to store payload on disk
 * 
 * @returns {Promise<Object>} Response object containing collection status
 * @throws {Error} If collection_name is missing
 * @throws {Error} If creation fails
 * 
 * @example
 * // Create a basic collection
 * const result = await create_collection({
 *   collection_name: "my_collection",
 *   size: 1536,
 *   distance: "Cosine"
 * });
 * 
 * @example
 * // Create collection with advanced configuration
 * const result = await create_collection({
 *   collection_name: "optimized_collection",
 *   size: 768,
 *   distance: "Euclid",
 *   hnsw_config: {
 *     m: 16,
 *     ef_construct: 100,
 *     full_scan_threshold: 10000
 *   },
 *   optimizers_config: {
 *     deleted_threshold: 0.2,
 *     vacuum_min_vector_number: 1000
 *   },
 *   on_disk: true,
 *   on_disk_payload: true
 * });
 * 
 * @example
 * // Create collection by copying from existing one
 * const result = await create_collection({
 *   collection_name: "new_collection",
 *   init_from: "existing_collection"
 * });
 */
async function createCollection({
    distance = "Cosine",
    collection_name = null,
    size = 1536,
    init_from = null,
    optimizers_config = null,
    hnsw_config = null,
    quantization_config = null,
    params = null,
    on_disk = true,
    on_disk_payload = true,
}: {
    distance?: 'Cosine' | 'Euclid' | 'Dot' | 'Manhattan',
    collection_name?: string | null,
    size?: number,
    init_from?: string | null,
    optimizers_config?: any,
    hnsw_config?: any,
    quantization_config?: any,
    params?: any,
    on_disk?: boolean,
    on_disk_payload?: boolean
}){
    try {
        if (!collection_name) {
            throw new Error('Collection collection_name is required');
        }

        // Check if collection already exists
        const {exists} = await collectionExists({ collection_name });
        if (exists === true) {
            console.log(`Collection ${collection_name} already exists`);
            return { status: 'exists', message: `Collection ${collection_name} already exists` };
        }        const payload: {
            vectors: {
                size: number;
                distance: string;
            };
            on_disk: boolean;
            on_disk_payload: boolean;
            optimizers_config?: any;
            hnsw_config?: any;
            quantization_config?: any;
            params?: any;
            init_from?: {
                collection: string;
            };
        } = {
            vectors: {
                size: size,
                distance: distance,
            },
            on_disk,
            on_disk_payload,
        };

        if (optimizers_config) payload.optimizers_config = optimizers_config;
        if (hnsw_config) payload.hnsw_config = hnsw_config;
        if (quantization_config) payload.quantization_config = quantization_config;
        if (params) payload.params = params;
        if (init_from) {
            payload.init_from = {
                collection: init_from
            };
        }

        const response = await axios.put(
            `${getQdrantUrl()}/collections/${collection_name}`,
            payload
        );

        return response.data;
    } catch (error) {
        console.error('@create_collection', error);
        throw error;
    }
}

async function deleteCollection({
    collection_name = null
}: { collection_name?: string | null }){
    try {
        if (!collection_name) {
            throw new Error('Collection collection_name is required');
        }

        const response = await axios.delete(`${getQdrantUrl()}/collections/${collection_name}`);
        
        return response.data;
    } catch (error) {
        console.error('@delete_collection', error);
        throw error;
    }
}

/**
 * Creates a new collection in Qdrant with multiple vector fields
 * @param {Object} params - The parameters object
 * @param {string} params.collection_name - Name of the collection to create
 * @param {Object.<string, Object>} params.vectors - Map of vector field configurations
 * @param {Object} params.vectors[vectorName] - Configuration for each vector field
 * @param {number} params.vectors[vectorName].size - Dimension size of the vector
 * @param {('Cosine'|'Euclid'|'Dot')} params.vectors[vectorName].distance - Distance function for vector comparison
 * @param {Object} [params.vectors[vectorName].hnsw_config] - HNSW index configuration
 * @param {number} [params.vectors[vectorName].hnsw_config.m] - Number of edges per node
 * @param {number} [params.vectors[vectorName].hnsw_config.ef_construct] - Size of candidate list during index building
 * @param {Object} [params.vectors[vectorName].quantization_config] - Vector quantization configuration
 * @param {boolean} [params.vectors[vectorName].on_disk] - Whether to store this vector field on disk
 * @returns {Promise<Object>} Response object containing collection status
 * @throws {Error} If collection_name is missing
 * @throws {Error} If vectors configuration is missing or invalid
 * 
 * @example
 * // Create collection with image and text vectors
 * const result = await create_collection_multivector({
 *   collection_name: "multi_modal",
 *   vectors: {
 *     image: {
 *       size: 512,
 *       distance: "Cosine",
 *       hnsw_config: {
 *         m: 16,
 *         ef_construct: 100
 *       },
 *       on_disk: true
 *     },
 *     text: {
 *       size: 768,
 *       distance: "Dot",
 *       quantization_config: {
 *         quantizer: "ScalarQuantizer"
 *       }
 *     }
 *   }
 * });
 * 
 * @example
 * // Create collection with multiple embeddings from different models
 * const result = await create_collection_multivector({
 *   collection_name: "multi_embedding",
 *   vectors: {
 *     gpt: {
 *       size: 1536,
 *       distance: "Cosine"
 *     },
 *     bert: {
 *       size: 768,
 *       distance: "Dot"
 *     }
 *   }
 * });
 */
async function createCollectionMultivector({
    collection_name = null,
    vectors = null
}: { collection_name?: string | null, vectors?: any }) {
    try {
        if (!collection_name) {
            throw new Error('Collection name is required');
        }

        if (!vectors || typeof vectors !== 'object' || Object.keys(vectors).length === 0) {
            throw new Error('Vector configurations are required');
        }

        // Check if collection already exists
        const { exists } = await collectionExists({ collection_name });
        if (exists === true) {
            console.log(`Collection ${collection_name} already exists`);
            return { status: 'exists', message: `Collection ${collection_name} already exists` };
        }

        // Validate each vector configuration
        for (const [name, config] of Object.entries(vectors)) {
            const typedConfig = config as VectorConfig;
            if (!typedConfig.size || !typedConfig.distance) {
                throw new Error(`Invalid configuration for vector field "${name}": size and distance are required`);
            }
        }

        const response = await axios.put(
            `${getQdrantUrl()}/collections/${collection_name}`,
            {
                vectors
            }
        );

        return response.data;
    } catch (error) {
        console.error('@create_collection_multivector', error);
        throw error;
    }
}

async function updateCollection({
    collection_name = null,
    optimizers_config = null,
    hnsw_config = null,
    quantization_config = null,
    vectors_config = null,
    params = null,
}: { collection_name?: string | null, optimizers_config?: any, hnsw_config?: any, quantization_config?: any, vectors_config?: any, params?: any }){
    try {
        if (!collection_name) {
            throw new Error('Collection collection_name is required');
        }

        const payload: {
            optimizers_config?: any;
            hnsw_config?: any;
            quantization_config?: any;
            vectors_config?: any;
            params?: any;
        } = {};

        // Add configurations to payload only if they are provided
        if (optimizers_config) payload.optimizers_config = optimizers_config;
        if (hnsw_config) payload.hnsw_config = hnsw_config;
        if (quantization_config) payload.quantization_config = quantization_config;
        if (vectors_config) payload.vectors_config = vectors_config;
        if (params) payload.params = params;

        // Only send request if there are configurations to update
        if (Object.keys(payload).length > 0) {
            const response = await axios.patch(
                `${getQdrantUrl()}/collections/${collection_name}`,
                payload
            );
            return response.data;
        }

        throw new Error('No configuration provided for update');
    } catch (error) {
        console.error('@update_collection', error);
        throw error;
    }
}






async function getCollectionInfo({
    collection_name = null
}: { collection_name?: string | null }){
    try {
        if (!collection_name) {
            throw new Error('Collection collection_name is required');
        }

        const response = await axios.get(`${getQdrantUrl()}/collections/${collection_name}`);
        
        return response.data.result;
    } catch (error) {
        console.error('@collection_info', error);
        throw error;
    }
}

async function rebuildCollection({
    distance = "Cosine",
    collection_name = null,
    size = 1536,
    init_from = null,
    optimizers_config = null,
    hnsw_config = null,
    quantization_config = null,
    params = null
}: {
    distance?: 'Cosine' | 'Euclid' | 'Dot' | 'Manhattan',
    collection_name?: string | null,
    size?: number,
    init_from?: string | null,
    optimizers_config?: any,
    hnsw_config?: any,
    quantization_config?: any,
    params?: any
}){
    try {
        if (!collection_name) {
            throw new Error('Collection collection_name is required');
        }

        // Check if collection exists before trying to delete
        const exists = await collectionExists({ collection_name });
        
        if (exists) {
            // Delete the existing collection
            await deleteCollection({ collection_name });
            
            // Optional: Wait a short time to ensure deletion is complete
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Create new collection with provided configuration
        const result = await createCollection({
            collection_name,
            distance,
            size,
            init_from,
            optimizers_config,
            hnsw_config,
            quantization_config,
            params
        });

        return result;
    } catch (error) {
        console.error('@rebuild_collection', error);
        throw error;
    }
}

/**
 * POINTS
 * The points are the central entity that Qdrant operates with. A point is a record consisting of a vector and an optional payload.
 * 
 * Supported vectors:
 * Dense Vectors: A regular vectors, generated by majority of the embedding models.
 * Sparse Vectors: Vectors with no fixed length, but only a few non-zero elements.
 *      Useful for exact token match and collaborative filtering recommendations.
 * MultiVectors: Matrices of numbers with fixed length but variable height
 *      Usually obtained from late interaction models like ColBERT
 */
async function listPoints({
    collection_name = null,
    ids = []
}: { collection_name?: string | null, ids?: any[] }){
    try {
        if (!collection_name) {
            throw new Error('Collection collection_name is required');
        }
        const payload = ids.length ? { ids } : {};
        const { data } = await axios.post(
            `${getQdrantUrl()}/collections/${collection_name}/points`,
            payload
        );
        return data;
    } catch (error) {
        console.error('@list_points error:', error);
        return { result: [] };
    }
}

async function scrollPoints({
    name=null,
    limit=1,
    with_payload=true,
    with_vector=false,
    order_by=null
}){
    // // POST /collections/{collection_name}/points/scroll
    // {
    //     "filter": {
    //         "must": [
    //             {
    //                 "key": "color",
    //                 "match": {
    //                     "value": "red"
    //                 }
    //             }
    //         ]
    //     },
    //     "limit": 1,
    //     "order_by": "timestamp",
    //     "with_payload": true,
    //     "with_vector": false
    // }

    // when order_by pagination is disabled
    // "order_by": {
    //     "key": "timestamp",
    //     "direction": "desc" // default is "asc"
    //     "start_from": 123, // start from this value
    // }
}

async function getPoint({
    collection_name = null,
    id = null
}: { collection_name?: string | null, id?: any }){
    try {
        if (!collection_name) {
            throw new Error('Collection collection_name is required');
        }
        if (id === null || id === undefined) {
            throw new Error('Point id is required');
        }
        const { data } = await axios.get(
            `${getQdrantUrl()}/collections/${collection_name}/points/${id}`
        );
        return data;
    } catch (error) {
        console.error('@get_point error:', error);
        return { result: null };
    }
}

async function countPoints({
    collection_name = null,
    filter = null,
}: { collection_name?: string | null, filter?: any }) {
    try {
        if (!collection_name) {
            throw new Error('Collection collection_name is required');
        }

        const {
            data: {
                result
            }
        } = await axios.post(
            `${getQdrantUrl()}/collections/${collection_name}/points/count`,
            {
                ...(filter ? {filter} : {}),
                exact: true
            }
        );

        return result
    } catch (error) {
        console.error('@count_points error');
        return null
    }
}


/**
 * Delete points from a Qdrant collection by either point IDs or filter
 * @param {Object} params - The parameters object
 * @param {string} params.collection_name - Name of the collection to delete points from
 * @param {Array<number|string>} [params.ids=[]] - Array of point IDs to delete
 * @param {Object} [params.filter=null] - Filter condition to delete points matching the filter
 * @param {Object} [params.filter.must] - Must conditions that all need to match
 * @param {Object} [params.filter.should] - Should conditions where at least one needs to match
 * @param {Object} [params.filter.must_not] - Must not conditions that none should match
 * @returns {Promise<Object|null>} Returns response data if successful, null if failed
 * @throws {Error} Throws error if collection_name is not provided
 * @throws {Error} Throws error if neither ids nor filter is provided
 * @example
 * // Delete points by IDs
 * await delete_points({
 *   collection_name: "my_collection",
 *   ids: [1, 2, 3]
 * });
 * 
 * // Delete points by filter
 * await delete_points({
 *   collection_name: "my_collection",
 *   filter: {
 *     must: [{
 *       key: "color",
 *       match: { value: "red" }
 *     }]
 *   }
 * });
 */
async function deletePoints({
    collection_name = null,
    ids = [],
    filter = null
}: { collection_name?: string | null, ids?: any[], filter?: any }) {
    try {
        if (!collection_name) {
            throw new Error('Collection name is required');
        }

        if (!ids.length && !filter) {
            throw new Error('Either points ids or filter is required');
        }

        const payload = ids.length 
            ? { points: ids }
            : { filter };

        const response = await axios.post(
            `${getQdrantUrl()}/collections/${collection_name}/points/delete`,
            payload
        );

        return response.data;
    } catch (error: any) {
        console.error('@delete_points error:', error);
        return null;
    }
}


/**
 * Upserts (insert or update) points into a Qdrant collection
 * @param {Object} params - The parameters object
 * @param {string} params.collection_name - The name of the collection to upsert points into 
 * @param {Array<Object>} params.points - Array of points to upsert
 * @param {number|string} params.points[].id - Unique identifier for the point
 * @param {Object} params.points[].payload - Metadata/payload associated with the point
 * @param {Array<number>} params.points[].vector - Vector representation of the point
 * @returns {Promise<Object>} Response from Qdrant API
 * @throws {Error} If collection_name is missing or if the request fails
 * 
 * @example
 *  upsert_points_records({
 *     collection_name: 'videos-clips-lg',
 *     points:[
 *         {
 *             id: 1,
 *             vector: v,
 *             payload: {
 *                 label: 'hello world'
 *             }
 *         }
 *     ]
 * })
 * 
 */
async function upsertPointsRecords({
    collection_name = null,
    points = []
}: { collection_name?: string | null, points?: any[] }) {
    try {
        if (!collection_name) {
            throw new Error('Collection collection_name is required');
        }

        if (!Array.isArray(points) || points.length === 0) {
            throw new Error('Points array is required and must not be empty');
        }

        const {
            data: {
                result
            }
        } = await axios.put(
            `${getQdrantUrl()}/collections/${collection_name}/points`,
            {
                points: points
            },
            {
                params: {
                    wait: true
                }
            }
        );

        return result
    } catch (error) {
        console.error('@upsert_points_records error');
        throw error;
    }
}

/**
 * Upserts (insert or update) points in batch format into a Qdrant collection
 * @param {Object} params - The parameters object
 * @param {string} params.collection_name - The name of the collection to upsert points into
 * @param {Array<number|string>} params.ids - Array of point IDs
 * @param {Array<Object>} params.payloads - Array of payloads corresponding to the IDs
 * @param {Array<Array<number>>} params.vectors - Array of vectors corresponding to the IDs
 * @returns {Promise<Object|null>} Response from Qdrant API or null if error
 * @throws {Error} If collection_name is missing
 * @throws {Error} If ids, payloads, and vectors arrays are not provided or have different lengths
 * @example
 * await upsert_points_batch({
 *   collection_name: "my_collection",
 *   ids: [1, 2, 3],
 *   payloads: [
 *     {"color": "red"},
 *     {"color": "green"},
 *     {"color": "blue"}
 *   ],
 *   vectors: [
 *     [0.9, 0.1, 0.1],
 *     [0.1, 0.9, 0.1],
 *     [0.1, 0.1, 0.9]
 *   ]
 * });
 */
async function upsertPointsBatch({
    collection_name = null,
    ids = [],
    payloads = [],
    vectors = []
}: { collection_name?: string | null, ids?: any[], payloads?: any[], vectors?: any[] }) {
    try {
        if (!collection_name) {
            throw new Error('Collection name is required');
        }

        if (!ids.length || !payloads.length || !vectors.length) {
            throw new Error('ids, payloads, and vectors arrays are required and must not be empty');
        }

        if (ids.length !== payloads.length || ids.length !== vectors.length) {
            throw new Error('ids, payloads, and vectors arrays must have the same length');
        }

        const {
            data: {
                result
            }
        } = await axios.put(
            `${getQdrantUrl()}/collections/${collection_name}/points`,
            {
                batch: {
                    ids,
                    payloads,
                    vectors
                }
            },
            {
                params: {
                    wait: true
                }
            }
        );

        return result;
    } catch (error: any) {
        console.error('@upsert_points_batch error:', error);
        return null;
    }
}


/**
 * Sets payload for points in a Qdrant collection that match the given filter
 * @param {Object} params - The parameters object
 * @param {string} params.collection_name - Name of the collection to update points in
 * @param {Object} params.payload - Payload to set for the matching points
 * @param {Object} [params.filter] - Filter to select points to update
 * @param {Object[]} [params.filter.must] - Conditions that all must match
 * @param {Object[]} [params.filter.should] - Conditions where at least one must match
 * @param {Object[]} [params.filter.must_not] - Conditions that must not match
 * @returns {Promise<Object|null>} Response from Qdrant API or null if error
 * @throws {Error} If collection_name is missing
 * @throws {Error} If payload is missing or not an object
 * @example
 * await set_points_payload({
 *   collection_name: "my_collection",
 *   payload: {
 *     status: "active",
 *     last_updated: "2024-01-01"
 *   },
 *   filter: {
 *     must: [{
 *       key: "color",
 *       match: { value: "red" }
 *     }]
 *   }
 * });
 */
async function setPointsPayload({
    collection_name = null,
    ids = [],
    payload = null,
    filter = null,
}: { collection_name?: string | null, ids?: any[], payload?: any, filter?: any }) {
    try {
        if (!collection_name) {
            throw new Error('Collection name is required');
        }

        if (!payload || typeof payload !== 'object') {
            throw new Error('Payload must be a valid object');
        }

        const {
            data: {
                result
            }
        } = await axios.post(
            `${getQdrantUrl()}/collections/${collection_name}/points/payload`,
            {
                payload,
                points: ids,
                ...(filter ? { filter } : {})
            }
        );

        return result;
    } catch (error: any) {
        // console.error('@set_points_payload error:', error);
        return null;
    }
}

/**
 * Overwrites the payload for specific points in a Qdrant collection
 * @param {Object} params - The parameters object
 * @param {string} params.collection_name - Name of the collection containing the points
 * @param {Object} params.payload - New payload to overwrite existing payload
 * @param {Array<number|string>} params.ids - Array of point IDs to update
 * @returns {Promise<Object|null>} Response from Qdrant API or null if error
 * @throws {Error} If collection_name is missing
 * @throws {Error} If payload is missing or not an object
 * @throws {Error} If ids array is empty
 * @example
 * await overwrite_points_payload({
 *   collection_name: "my_collection",
 *   payload: {
 *     status: "inactive",
 *     updated_at: "2024-01-01"
 *   },
 *   ids: [1, 2, 3]
 * });
 */
async function overwritePointsPayload({
    collection_name = null,
    payload = null,
    ids = [],
}: { collection_name?: string | null, payload?: any, ids?: any[] }) {
    try {
        if (!collection_name) {
            throw new Error('Collection name is required');
        }

        if (!payload || typeof payload !== 'object') {
            throw new Error('Payload must be a valid object');
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error('Points ids array is required and must not be empty');
        }

        const {
            data: {
                result
            }
        } = await axios.put(
            `${getQdrantUrl()}/collections/${collection_name}/points/payload`,
            {
                payload,
                points: ids
            }
        );

        return result;
    } catch (error: any) {
        console.error('@overwrite_points_payload error:', error);
        return null;
    }
}


/**
 * Creates or updates an index for payload fields in a Qdrant collection
 * @param {Object} params - The parameters object
 * @param {string} params.collection_name - Name of the collection to create index in
 * @param {string} params.field_name - Name of the field to index
 * @param {('keyword'|'integer'|'float'|'bool'|'geo'|'datetime'|'text'|'uuid')} [params.type='keyword'] - Type of the index. `datetime` is RFC 3339 format
 * @param {boolean} [params.on_disk=false] - Whether to store the index on disk instead of memory
 * @param {boolean} [params.is_tenant=true] - Whether to enable multi-tenant search optimization
 * @param {boolean} [params.is_principal=true] - Whether to mark this as a principal field for search optimization
 * @param {Object} [params.field_schema=null] - Custom field schema that overwrites default settings
 * @param {string} [params.field_schema.type] - Index type
 * @param {string} [params.field_schema.tokenizer] - Tokenizer type for text fields
 * @param {number} [params.field_schema.min_token_len] - Minimum token length for text fields
 * @param {number} [params.field_schema.max_token_len] - Maximum token length for text fields
 * @param {boolean} [params.field_schema.lowercase] - Whether to lowercase tokens
 * @param {boolean} [params.field_schema.on_disk] - Whether to store on disk
 * @param {boolean} [params.field_schema.is_tenant] - Whether it's a tenant field
 * @param {boolean} [params.field_schema.is_principal] - Whether it's a principal field
 * @returns {Promise<Object|null>} Response from Qdrant API or null if error
 * @throws {Error} If collection_name or field_name is missing
 * @example
 * // Basic keyword index
 * await index_points_payload({
 *   collection_name: "my_collection",
 *   field_name: "category",
 *   type: "keyword"
 * });
 * 
 * // Full text search index
 * await index_points_payload({
 *   collection_name: "my_collection",
 *   field_name: "description",
 *   field_schema: {
 *     type: "text",
 *     tokenizer: "word",
 *     min_token_len: 2,
 *     max_token_len: 20,
 *     lowercase: true
 *   }
 * });
 * 
 * // Principal field for timestamp-based searches
 * await index_points_payload({
 *   collection_name: "my_collection",
 *   field_name: "timestamp",
 *   type: "integer",
 *   is_principal: true
 * });
 */
async function indexPointsPayload({
    collection_name = null,
    field_name = null,
    type = 'keyword',
    on_disk = false,
    is_tenant = true,
    is_principal = true,
    field_schema = null,
}: { collection_name?: string | null, field_name?: string | null, type?: string, on_disk?: boolean, is_tenant?: boolean, is_principal?: boolean, field_schema?: any }) {
    try {
        if (!collection_name) {
            throw new Error('Collection name is required');
        }

        if (!field_name) {
            throw new Error('Field name is required');
        }

        // If custom field_schema is provided, use it directly
        // Otherwise, build the schema based on provided parameters
        const schema = field_schema || {
            type,
            ...(type === 'text' && {
                tokenizer: 'word',
                min_token_len: 2,
                max_token_len: 20,
                lowercase: true
            }),
            on_disk,
            is_tenant,
            is_principal
        };        const {
            data: {
                result
            }
        } = await axios.put(
            `${getQdrantUrl()}/collections/${collection_name}/index`,
            {
                field_name,
                field_schema: schema
            }
        );

        return result;
    } catch (error) {
        console.error('@index_points_payload error:', error);
        return null;
    }
}


/**
 * Performs a faceted count of points in a Qdrant collection based on a specific payload field
 * @param {Object} params - The parameters object
 * @param {string} params.collection_name - Name of the collection to perform faceted count on
 * @param {string} params.key - Payload field to facet on
 * @param {Object} [params.filter] - Filter conditions to apply before counting
 * @param {Object} [params.filter.must] - Conditions that must match
 * @param {Object} [params.filter.should] - Conditions where at least one must match
 * @param {Object} [params.filter.must_not] - Conditions that must not match
 * @returns {Promise<Object|null>} Returns facet counts or null if error
 * @throws {Error} If collection_name is missing
 * @throws {Error} If key is missing
 * 
 * @example
 * // Basic faceted count
 * const counts = await facet_count_points_payload({
 *   collection_name: "products",
 *   key: "category"
 * });
 * 
 * @example
 * // Faceted count with filter
 * const counts = await facet_count_points_payload({
 *   collection_name: "products",
 *   key: "size",
 *   filter: {
 *     must: {
 *       key: "color",
 *       match: { value: "red" }
 *     }
 *   }
 * });
 */
async function facetCountPointsPayload({
    collection_name = null,
    key = null,
    filter = null,
}: { collection_name?: string | null, key?: string | null, filter?: any }) {
    try {
        if (!collection_name) {
            throw new Error('Collection name is required');
        }

        if (!key) {
            throw new Error('Facet key is required');
        }

        const {
            data: {
                result
            }
        } = await axios.post(
            `${getQdrantUrl()}/collections/${collection_name}/facet`,
            {
                key,
                ...(filter ? { filter } : {})
            }
        );

        return result;
    } catch (error: any) {
        console.error('@facet_count_points_payload error:', error);
        return null;
    }
}

/**
 * Performs k-nearest neighbors (KNN) search in a Qdrant collection with various modes and options
 * @param {Object} params - The parameters object
 * @param {string} params.colletion_name - Name of the collection to search in
 * @param {('default'|'lookup'|'random')} [params.mode='default'] - Search mode:
 *   - 'default': Standard vector similarity search
 *   - 'lookup': Search using positive/negative examples
 *   - 'random': Random sampling from collection
 * @param {Object} [params.filter] - Filter conditions for search
 * @param {Object} [params.params] - Search parameters
 * @param {number} [params.params.hnsw_ef] - Size of the candidates list during the search
 * @param {boolean} [params.params.exact] - Whether to use exact search
 * @param {string} [params.using] - Name of the vector field to use for search
 * @param {boolean} [params.with_vectors=null] - Whether to return vectors in response
 * @param {boolean|Object} [params.with_payload=true] - Whether to return payload in response
 * @param {string[]} [params.with_payload.exclude] - Payload fields to exclude
 * @param {number} [params.limit=10] - Maximum number of results to return
 * @param {number} [params.offset=0] - Number of results to skip
 * @param {string} [params.group_by] - Field to group results by
 * 
 * // Default mode parameters
 * @param {number[]} [params.vector] - Query vector for default mode
 * 
 * // Lookup mode parameters
 * @param {('average_vector'|'best_score')} [params.lookup_strategy='average_vector'] - Strategy for lookup:
 *   - 'average_vector': Creates single vector from examples (faster)
 *   - 'best_score': Measures each candidate against every example (more accurate)
 * @param {Array<number[]|number>} [params.lookup_positive_vectors] - Positive example vectors or IDs
 * @param {Array<number[]|number>} [params.lookup_negative_vectors] - Negative example vectors or IDs
 * @param {string} [params.lookup_external_collection_name] - External collection for lookup
 * @param {string} [params.lookup_external_vector_name] - Vector field name in external collection
 * 
 * @returns {Promise<Array|Object|false>} Returns search results or false if error
 * @throws {Error} If collection_name is missing
 * @throws {Error} If vector is missing in default mode
 * @throws {Error} If invalid search mode is specified
 * 
 * @example
 * // Default vector search
 * const results = await search_knn({
 *   colletion_name: "my_collection",
 *   vector: [0.2, 0.1, 0.9, 0.7],
 *   filter: {
 *     must: [{
 *       key: "category",
 *       match: { value: "electronics" }
 *     }]
 *   },
 *   limit: 5
 * });
 * 
 * @example
 * // Lookup-based search with positive/negative examples
 * const results = await search_knn({
 *   colletion_name: "my_collection",
 *   mode: "lookup",
 *   lookup_strategy: "average_vector",
 *   lookup_positive_vectors: [100, 231],
 *   lookup_negative_vectors: [718],
 *   with_payload: {
 *     exclude: ["description"]
 *   }
 * });
 * 
 * @example
 * // Grouped search results
 * const results = await search_knn({
 *   colletion_name: "my_collection",
 *   vector: [0.2, 0.1, 0.9, 0.7],
 *   group_by: "category",
 *   limit: 4,
 *   group_size: 2
 * });
 * 
 * @example
 * // Random sampling
 * const results = await search_knn({
 *   colletion_name: "my_collection",
 *   mode: "random",
 *   limit: 10
 * });
 */
async function searchKnn({
    // All
    collection_name = null,
    mode = 'default', // default, lookup, random
    filter = null,
    params = null,
    using = null,
    with_vectors = null,
    with_payload = true,
    limit = 10,
    offset = 0,
    group_by = null,
    
    // default only
    vector = null,
    
    // lookup
    lookup_strategy = 'average_vector',
    lookup_positive_vectors = [],
    lookup_negative_vectors = [],
    lookup_external_collection_name = null,
    lookup_external_vector_name = null,
}: {
    collection_name?: string | null,
    mode?: string,
    filter?: any,
    params?: any,
    using?: string | null,
    with_vectors?: boolean | null,
    with_payload?: boolean | object,
    limit?: number,
    offset?: number,
    group_by?: string | null,
    vector?: any,
    lookup_strategy?: string,
    lookup_positive_vectors?: any[],
    lookup_negative_vectors?: any[],
    lookup_external_collection_name?: string | null,
    lookup_external_vector_name?: string | null
}){
    try {
        if (!collection_name) {
            throw new Error('Collection name is required');
        }

        let requestBody: any = {
            limit,
            offset,
            with_vectors,
            with_payload
        };

        if (filter) requestBody.filter = filter;
        if (params) requestBody.params = params;
        if (using) requestBody.using = using;

        // Configure query based on mode
        switch (mode) {
            case 'default':
                if (!vector) {
                    throw new Error('Vector is required for default mode');
                }
                requestBody.query = vector;
                break;

            case 'lookup':
                requestBody.query = {
                    recommend: {
                        strategy: lookup_strategy,
                        positive: lookup_positive_vectors,
                        negative: lookup_negative_vectors
                    }
                };

                if (lookup_external_collection_name && lookup_external_vector_name) {
                    requestBody.lookup_from = {
                        collection: lookup_external_collection_name,
                        vector: lookup_external_vector_name
                    };
                }
                break;

            case 'random':
                requestBody.query = {
                    sample: 'random'
                };
                break;

            default:
                throw new Error('Invalid search mode');
        }

        // Handle grouping
        if (group_by) {
            const endpoint = `${getQdrantUrl()}/collections/${collection_name}/points/query/groups`;
            requestBody.group_by = group_by;
            const response = await axios.post(endpoint, requestBody);
            return response.data.result;
        }

        // Regular search
        const endpoint = `${getQdrantUrl()}/collections/${collection_name}/points/query`;
        const {
            data: {
                result: {
                    points
                }
            }
        } = await axios.post(endpoint, requestBody);
        return points;

    } catch (error: any) {
        console.error('@search_knn', error.message);
        return false
    }
}

/**
 * TODO: FIX
 * TODO: https://qdrant.tech/documentation/concepts/search/#lookup-in-groups 
 * Performs a grouped vector search with lookup capabilities in a Qdrant collection
 * @param {Object} params - The parameters object
 * @param {number[]} params.vector - Query vector for similarity search
 * @param {string} params.group_by - Field to group results by (e.g., "document_id")
 * @param {number} [params.limit=2] - Maximum number of groups to return
 * @param {number} [params.group_size=2] - Maximum number of points per group
 * @param {Object} [params.with_lookup] - Configuration for looking up related data
 * @param {string} params.with_lookup.collection - Name of the collection to look up points in
 * @param {boolean|string[]} [params.with_lookup.with_payload=true] - Payload fields to include from lookup
 * @param {boolean} [params.with_lookup.with_vectors=false] - Whether to include vectors from lookup
 * @returns {Promise<Object|null>} Returns grouped search results with lookups or null if error
 * @throws {Error} If vector is missing
 * @throws {Error} If group_by is missing
 * 
 * @example
 * // Basic grouped search with lookup
 * const results = await search_lookup_groups({
 *   vector: [0.2, 0.1, 0.9, 0.7],
 *   group_by: "document_id",
 *   limit: 3,
 *   group_size: 2,
 *   with_lookup: {
 *     collection: "documents",
 *     with_payload: ["title", "text"],
 *     with_vectors: false
 *   }
 * });
 * 
 * @example
 * // Grouped search without lookup
 * const results = await search_lookup_groups({
 *   vector: [0.2, 0.1, 0.9, 0.7],
 *   group_by: "category",
 *   limit: 5,
 *   group_size: 3
 * });
 */
async function searchLookupGroups({
    vector = null,
    group_by = null,
    limit = 2,
    group_size = 2,
    with_lookup = null,
}: { vector?: any, group_by?: string | null, limit?: number, group_size?: number, with_lookup?: any }) {
    try {
        if (!vector) {
            throw new Error('Query vector is required');
        }

        if (!group_by) {
            throw new Error('group_by field is required');
        }

        const requestBody: any = {
            query: vector,
            group_by,
            limit,
            group_size
        };

        if (with_lookup) {
            requestBody.with_lookup = {
                collection: with_lookup.collection,
                with_payload: with_lookup.with_payload ?? true,
                with_vectors: with_lookup.with_vectors ?? false
            };
        }

        const {
            data: {
                result
            }
        } = await axios.post(
            `${getQdrantUrl()}/collections/chunks/points/query/groups`,
            requestBody
        );

        return result;
    } catch (error: any) {
        console.error('@search_lookup_groups error:', error.message);
        return null;
    }
}




/**
 * Performs multiple KNN searches in parallel within a Qdrant collection
 * @param {Object} params - The parameters object
 * @param {string} params.collection_name - Name of the collection to search in
 * @param {Array<Object>} params.searches - Array of search configurations
 * @param {Array<number>} params.searches[].query - Query vector for the search
 * @param {Object} [params.searches[].filter] - Filter conditions for the search
 * @param {Object} [params.searches[].params] - Search parameters
 * @param {number} [params.searches[].params.hnsw_ef] - Size of the candidates list
 * @param {boolean} [params.searches[].params.exact] - Whether to use exact search
 * @param {string} [params.searches[].using] - Name of the vector field to use
 * @param {boolean|Object} [params.searches[].with_payload] - Whether to return payload
 * @param {boolean} [params.searches[].with_vectors] - Whether to return vectors
 * @param {number} [params.searches[].limit=10] - Maximum number of results
 * @param {number} [params.searches[].offset=0] - Number of results to skip
 * @returns {Promise<Array<Object>|null>} Array of search results for each query or null if error
 * @throws {Error} If collection_name is missing
 * @throws {Error} If searches array is empty
 * 
 * @example
 * // Multiple searches with different vectors and filters
 * const results = await search_knn_batch({
 *   collection_name: "products",
 *   searches: [
 *     {
 *       query: [0.2, 0.1, 0.9, 0.7],
 *       filter: {
 *         must: [{
 *           key: "category",
 *           match: { value: "electronics" }
 *         }]
 *       },
 *       limit: 3
 *     },
 *     {
 *       query: [0.5, 0.3, 0.2, 0.3],
 *       filter: {
 *         must: [{
 *           key: "category",
 *           match: { value: "clothing" }
 *         }]
 *       },
 *       limit: 5,
 *       with_payload: true
 *     }
 *   ]
 * });
 * 
 * @example
 * // Batch search with common parameters
 * const results = await search_knn_batch({
 *   collection_name: "images",
 *   searches: [
 *     {
 *       query: [0.1, 0.2, 0.3],
 *       params: { hnsw_ef: 128 }
 *     },
 *     {
 *       query: [0.4, 0.5, 0.6],
 *       params: { hnsw_ef: 128 }
 *     }
 *   ]
 * });
 */
async function searchKnnBatch({
    collection_name = null,
    searches = [],
}: { collection_name?: string | null, searches?: any[] }) {
    try {
        if (!collection_name) {
            throw new Error('Collection name is required');
        }

        if (!Array.isArray(searches) || searches.length === 0) {
            throw new Error('Searches array is required and must not be empty');
        }

        const {
            data: {
                result
            }
        } = await axios.post(
            `${getQdrantUrl()}/collections/${collection_name}/points/query/batch?`,
            { searches },
            {
                params: {
                    wait: true,
                }
            }
        );

        return result.map((res: any) => res.points);
    } catch (error: any) {
        console.error('@search_knn_batch error:', error);
        return null;
    }
}

/**
 * Searches for a specific point by ID in a Qdrant collection
 * @param {Object} params - The parameters object
 * @param {string} params.colletion_name - Name of the collection to search in
 * @param {string|number} params.id - ID of the point to search for
 * @returns {Promise<Object|null>} Returns the point data or null if not found/error
 * @throws {Error} If collection_name is missing
 * @throws {Error} If id is missing
 * 
 * @example
 * // Search by numeric ID
 * const point = await search_id({
 *   colletion_name: "products",
 *   id: 123
 * });
 * 
 * @example
 * // Search by UUID
 * const point = await search_id({
 *   colletion_name: "users",
 *   id: "43cf51e2-8777-4f52-bc74-c2cbde0c8b04"
 * });
 */
async function searchById({
    collection_name = null,
    id = null,
    with_payload = false,
    with_vector = false,
}) {
    try {
        if (!collection_name) {
            throw new Error('Collection name is required');
        }

        if (id === null) {
            throw new Error('Point ID is required');
        }

        const {
            data: {
                result: {
                    points
                }
            }
        } = await axios.post(
            `${getQdrantUrl()}/collections/${collection_name}/points/query`,
            {
                query: id,
                with_payload,
                with_vector,
            }
        );

        return points?.[0] || null
    } catch (error: any) {
        console.error('@search_id error:', error);
        return null;
    }
}

async function clearPointsPayload({
    collection_name = null,
    ids = []
}: PointsParams) {
    try {
        if (!collection_name) {
            throw new Error('Collection name is required');
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error('ids array is required and must not be empty');
        }

        const {
            data: {
                result
            }
        } = await axios.post(
            `${getQdrantUrl()}/collections/${collection_name}/points/payload/clear`,
            {
                points:ids
            }
        );

        return result;
    } catch (error: any) {
        console.error('@clear_points_payload error:', error);
        return null;
    }
}


async function updateVectors({
    collection_name = null
}){
    // PUT /collections/{collection_name}/points/vectors
    // {
    //     "points": [
    //         {
    //             "id": 1,
    //             "vector": {
    //                 "image": [0.1, 0.2, 0.3, 0.4]
    //             }
    //         },
    //         {
    //             "id": 2,
    //             "vector": {
    //                 "text": [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2]
    //             }
    //         }
    //     ]
    // }
}

async function deleteVectors({
    collection_name = null
}){
    // POST /collections/{collection_name}/points/vectors/delete
    // {
    //     "points": [0, 3, 100],
    //     "vectors": ["text", "image"]
    // }
}

/**
 * PAYLOAD
 * One of the significant features of Qdrant is the ability to store additional information along with vectors. 
 * This information is called payload in Qdrant terminology.
 * 
 * Payload types:
 * - integer - 64-bit integer in the range from -9223372036854775808 to 9223372036854775807.
 * - float - 64-bit floating point number.
 * - bool - binary value. Equals to true or false.
 * - keyword - string value.
 * - geo is used to represent geographical coordinates.
 * - datetime - date and time in RFC 3339 format.
 *      The following formats are supported:
        "2023-02-08T10:49:00Z" (RFC 3339, UTC)
        "2023-02-08T11:49:00+01:00" (RFC 3339, with timezone)
        "2023-02-08T10:49:00" (without timezone, UTC is assumed)
        "2023-02-08T10:49" (without timezone and seconds)
        "2023-02-08" (only date, midnight is assumed)
 * - uuid
 * 
 */


export default {
    // Server Status
    getStatus,

    // Collection Management
    listCollections,
    listAliases,
    createCollection,
    createCollectionMultivector,
    updateCollection,
    deleteCollection,
    collectionExists,
    getCollectionInfo,
    rebuildCollection,

    // Points Management
    listPoints,
    scrollPoints,
    getPoint,
    countPoints,
    deletePoints,
    upsertPointsRecords,
    upsertPointsBatch,

    // Payload Operations
    setPointsPayload,
    overwritePointsPayload,
    indexPointsPayload,
    facetCountPointsPayload,
    clearPointsPayload,

    // Search Operations
    searchKnn,
    searchLookupGroups,
    searchKnnBatch,
    searchById,

    // Vector Operations
    updateVectors,
    deleteVectors
}