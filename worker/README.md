# RAG Worker Setup Guide

## Quick Setup

### Step 1: Create Cloudflare Resources

Run these commands in the `worker/` directory:

```bash
cd worker

# Create KV namespace for document metadata
npx wrangler kv:namespace create DOC_METADATA
# Copy the ID from output and update wrangler.toml

# Create Vectorize index
npx wrangler vectorize create rag-index --dimensions=768 --metric=cosine
```

### Step 2: Update wrangler.toml

Edit `worker/wrangler.toml` and replace `YOUR_KV_NAMESPACE_ID` with the ID from step 1:

```toml
[[kv_namespaces]]
binding = "DOC_METADATA"
id = "your-actual-kv-namespace-id"
```

### Step 3: Deploy Worker

```bash
cd worker
npm install
npm run deploy
```

After deployment, you'll get a URL like:
`https://rag-api.your-subdomain.workers.dev`

### Step 4: Configure Frontend

1. Open the Auto RAG demo page
2. Paste your Worker URL in the API Endpoint field
3. Click "Test Connection"
4. Upload documents and start querying!

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/upload` | POST | Upload document (multipart/form-data) |
| `/api/query` | POST | Query RAG system |
| `/api/documents` | GET | List all documents |
| `/api/documents/:id` | DELETE | Delete a document |

## Troubleshooting

**Error: "VECTORIZE is not defined"**
- Make sure you created the Vectorize index with name `rag-index`

**Error: "DOC_METADATA is not defined"**
- Update the KV namespace ID in wrangler.toml

**Error: "AI is not defined"**
- Workers AI should be automatically available on Enterprise plan
