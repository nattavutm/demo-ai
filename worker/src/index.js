/**
 * Cloudflare Worker - RAG API
 * Handles document upload, embedding generation, and RAG queries
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // Route handlers
            if (url.pathname === '/api/upload' && request.method === 'POST') {
                return await handleUpload(request, env, corsHeaders);
            }

            if (url.pathname === '/api/query' && request.method === 'POST') {
                return await handleQuery(request, env, corsHeaders);
            }

            if (url.pathname === '/api/documents' && request.method === 'GET') {
                return await handleListDocuments(request, env, corsHeaders);
            }

            if (url.pathname.startsWith('/api/documents/') && request.method === 'DELETE') {
                const docId = url.pathname.split('/').pop();
                return await handleDeleteDocument(docId, env, corsHeaders);
            }

            if (url.pathname === '/api/health') {
                return Response.json({ status: 'ok', timestamp: new Date().toISOString() }, { headers: corsHeaders });
            }

            return new Response('Not Found', { status: 404, headers: corsHeaders });
        } catch (error) {
            console.error('Worker error:', error);
            return Response.json(
                { error: error.message || 'Internal Server Error' },
                { status: 500, headers: corsHeaders }
            );
        }
    },
};

/**
 * Handle document upload
 * Extracts text, generates embeddings, and stores in Vectorize
 */
async function handleUpload(request, env, corsHeaders) {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
        return Response.json({ error: 'No file provided' }, { status: 400, headers: corsHeaders });
    }

    // Extract text from file
    const text = await file.text();
    const fileName = file.name;
    const docId = crypto.randomUUID();

    // Split text into chunks (simple chunking by paragraphs)
    const chunks = splitIntoChunks(text, 500);

    if (chunks.length === 0) {
        return Response.json({ error: 'No text content found in file' }, { status: 400, headers: corsHeaders });
    }

    // Generate embeddings for each chunk
    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Generate embedding using Workers AI
        const embedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
            text: chunk
        });

        vectors.push({
            id: `${docId}-${i}`,
            values: embedding.data[0],
            metadata: {
                docId: docId,
                fileName: fileName,
                chunkIndex: i,
                text: chunk.substring(0, 1000), // Store first 1000 chars for retrieval
                fullText: chunk,
            }
        });
    }

    // Insert vectors into Vectorize
    await env.VECTORIZE.insert(vectors);

    // Store document metadata in KV (optional, for listing)
    const docMeta = {
        id: docId,
        fileName: fileName,
        chunkCount: chunks.length,
        uploadedAt: new Date().toISOString(),
    };
    await env.DOC_METADATA.put(docId, JSON.stringify(docMeta));

    return Response.json({
        success: true,
        document: docMeta,
        message: `Uploaded ${fileName} with ${chunks.length} chunks`
    }, { headers: corsHeaders });
}

/**
 * Handle RAG query
 * Generates embedding for query, retrieves similar chunks, generates response
 */
async function handleQuery(request, env, corsHeaders) {
    const { query, topK = 3 } = await request.json();

    if (!query) {
        return Response.json({ error: 'No query provided' }, { status: 400, headers: corsHeaders });
    }

    // Generate embedding for query
    const queryEmbedding = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: query
    });

    // Search Vectorize for similar chunks
    const results = await env.VECTORIZE.query(queryEmbedding.data[0], {
        topK: topK,
        returnMetadata: true,
    });

    // Extract context from results
    const contextChunks = results.matches.map(match => ({
        text: match.metadata.fullText || match.metadata.text,
        fileName: match.metadata.fileName,
        score: match.score,
    }));

    // If no context found, return early
    if (contextChunks.length === 0) {
        return Response.json({
            query: query,
            response: "I don't have any relevant information in the knowledge base to answer this question. Please upload some documents first.",
            context: [],
        }, { headers: corsHeaders });
    }

    // Build context string for LLM
    const contextString = contextChunks
        .map((c, i) => `[Document ${i + 1}: ${c.fileName}]\n${c.text}`)
        .join('\n\n');

    // Generate response using LLM with RAG context
    const llmResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
        messages: [
            {
                role: 'system',
                content: `You are a helpful assistant that answers questions based on the provided context. 
Use the following context to answer the user's question. 
If the context doesn't contain relevant information, say so.
Always cite which document the information came from.

Context:
${contextString}`
            },
            {
                role: 'user',
                content: query
            }
        ],
        max_tokens: 500,
    });

    return Response.json({
        query: query,
        response: llmResponse.response,
        context: contextChunks,
    }, { headers: corsHeaders });
}

/**
 * List all uploaded documents
 */
async function handleListDocuments(request, env, corsHeaders) {
    const list = await env.DOC_METADATA.list();
    const documents = [];

    for (const key of list.keys) {
        const doc = await env.DOC_METADATA.get(key.name, 'json');
        if (doc) {
            documents.push(doc);
        }
    }

    return Response.json({ documents }, { headers: corsHeaders });
}

/**
 * Delete a document and its vectors
 */
async function handleDeleteDocument(docId, env, corsHeaders) {
    // Get document metadata
    const docMeta = await env.DOC_METADATA.get(docId, 'json');

    if (!docMeta) {
        return Response.json({ error: 'Document not found' }, { status: 404, headers: corsHeaders });
    }

    // Delete vectors (by IDs)
    const vectorIds = [];
    for (let i = 0; i < docMeta.chunkCount; i++) {
        vectorIds.push(`${docId}-${i}`);
    }

    await env.VECTORIZE.deleteByIds(vectorIds);

    // Delete metadata
    await env.DOC_METADATA.delete(docId);

    return Response.json({
        success: true,
        message: `Deleted document ${docMeta.fileName}`
    }, { headers: corsHeaders });
}

/**
 * Split text into chunks
 */
function splitIntoChunks(text, maxChunkSize = 500) {
    // Clean and normalize text
    const cleanText = text.replace(/\r\n/g, '\n').trim();

    if (!cleanText) return [];

    // Split by paragraphs first
    const paragraphs = cleanText.split(/\n\n+/);
    const chunks = [];
    let currentChunk = '';

    for (const para of paragraphs) {
        const trimmedPara = para.trim();
        if (!trimmedPara) continue;

        if (currentChunk.length + trimmedPara.length > maxChunkSize && currentChunk) {
            chunks.push(currentChunk.trim());
            currentChunk = trimmedPara;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + trimmedPara;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    // If no chunks created (single block of text), split by sentences
    if (chunks.length === 0 && cleanText) {
        const sentences = cleanText.split(/(?<=[.!?])\s+/);
        let chunk = '';

        for (const sentence of sentences) {
            if (chunk.length + sentence.length > maxChunkSize && chunk) {
                chunks.push(chunk.trim());
                chunk = sentence;
            } else {
                chunk += (chunk ? ' ' : '') + sentence;
            }
        }

        if (chunk.trim()) {
            chunks.push(chunk.trim());
        }
    }

    return chunks;
}
