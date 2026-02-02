/**
 * Auto RAG Interactive Demo - Full Working Version
 * Connects to Cloudflare Worker RAG API
 */

import './main.js';

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadStatus = document.getElementById('uploadStatus');
const documentList = document.getElementById('documentList');
const refreshDocsBtn = document.getElementById('refreshDocsBtn');
const ragInput = document.getElementById('ragInput');
const ragQueryBtn = document.getElementById('ragQueryBtn');
const ragLoading = document.getElementById('ragLoading');
const loadingText = document.getElementById('loadingText');
const retrievedContext = document.getElementById('retrievedContext');
const contextChunks = document.getElementById('contextChunks');
const generatedResponse = document.getElementById('generatedResponse');
const ragResponse = document.getElementById('ragResponse');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');

// Pipeline steps
const steps = ['step-query', 'step-embed', 'step-retrieve', 'step-augment', 'step-generate'];

// API Configuration
const API_URL = 'https://rag-api.nforce-lab.workers.dev';

// Get API base URL
function getApiUrl() {
    return API_URL;
}

// Show error
function showError(message) {
    errorMessage.textContent = message;
    errorState.style.display = 'block';
}

// Hide error
function hideError() {
    errorState.style.display = 'none';
}

// Activate pipeline step
function activateStep(stepId) {
    steps.forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
    document.getElementById(stepId).classList.add('active');
}

// Reset pipeline
function resetPipeline() {
    steps.forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
}

// Test API connection
// Test API connection - Removed, strictly using hardcoded URL
// No manual test button needed anymore


// File upload handling
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--cf-orange)';
    dropZone.style.background = 'rgba(246, 130, 31, 0.05)';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border-color)';
    dropZone.style.background = '';
});

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
    dropZone.style.background = '';

    const files = e.dataTransfer.files;
    for (const file of files) {
        await uploadFile(file);
    }
});

fileInput.addEventListener('change', async (e) => {
    for (const file of e.target.files) {
        await uploadFile(file);
    }
    fileInput.value = '';
});

// Upload file to API
async function uploadFile(file) {
    const url = getApiUrl();
    if (!url) {
        showError('Please set the API endpoint first');
        return;
    }

    // Check file type
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md') && !file.name.endsWith('.pdf')) {
        showError('Only .txt, .md, and .pdf files are supported');
        return;
    }

    hideError();
    uploadStatus.style.display = 'flex';

    try {
        let fileToUpload = file;

        // If PDF, extract text first
        if (file.name.endsWith('.pdf')) {
            loadingText.textContent = 'Extracting text from PDF...';
            const text = await extractTextFromPDF(file);
            // Create a new blob with extracted text
            const blob = new Blob([text], { type: 'text/plain' });
            fileToUpload = new File([blob], file.name, { type: 'text/plain' });
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);

        const response = await fetch(`${url}/api/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            // Refresh document list
            await loadDocuments();
        } else {
            showError(data.error || 'Upload failed');
        }
    } catch (error) {
        showError('Upload failed: ' + error.message);
    } finally {
        uploadStatus.style.display = 'none';
        loadingText.textContent = 'Processing query...'; // Reset text
    }
}

// Extract text from PDF using PDF.js
async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
    }

    return fullText;
}

// Load documents from API
async function loadDocuments() {
    const url = getApiUrl();
    if (!url) return;

    try {
        const response = await fetch(`${url}/api/documents`);
        const data = await response.json();

        if (data.documents && data.documents.length > 0) {
            documentList.innerHTML = data.documents.map(doc => `
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          background: var(--bg-glass);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          margin-bottom: 0.5rem;
        ">
          <div>
            <span style="font-weight: 500;">${doc.fileName}</span>
            <span style="color: var(--text-muted); font-size: 0.75rem; margin-left: 0.5rem;">
              ${doc.chunkCount} chunks
            </span>
          </div>
          <button 
            onclick="deleteDocument('${doc.id}')"
            style="
              background: none;
              border: none;
              color: var(--text-muted);
              cursor: pointer;
              padding: 0.25rem;
            "
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `).join('');
        } else {
            documentList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.875rem;">No documents uploaded yet.</p>';
        }
    } catch (error) {
        console.error('Failed to load documents:', error);
    }
}

// Delete document
window.deleteDocument = async function (docId) {
    const url = getApiUrl();
    if (!url) return;

    try {
        const response = await fetch(`${url}/api/documents/${docId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            await loadDocuments();
        }
    } catch (error) {
        showError('Failed to delete: ' + error.message);
    }
};

// Refresh documents
refreshDocsBtn.addEventListener('click', loadDocuments);

// RAG Query
async function runRAGQuery() {
    const query = ragInput.value.trim();
    const url = getApiUrl();

    if (!query) return;
    if (!url) {
        showError('Please set the API endpoint first');
        return;
    }

    // Reset UI
    hideError();
    retrievedContext.style.display = 'none';
    generatedResponse.style.display = 'none';
    ragLoading.style.display = 'flex';
    ragQueryBtn.disabled = true;

    try {
        // Animate pipeline
        activateStep('step-query');
        loadingText.textContent = 'Processing query...';
        await sleep(300);

        activateStep('step-embed');
        loadingText.textContent = 'Generating embeddings...';

        // Make API call
        const response = await fetch(`${url}/api/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, topK: 3 }),
        });

        activateStep('step-retrieve');
        loadingText.textContent = 'Retrieving context...';
        await sleep(300);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Query failed');
        }

        // Display context
        if (data.context && data.context.length > 0) {
            contextChunks.innerHTML = data.context.map(chunk => `
        <div class="context-chunk">
          "${chunk.text.substring(0, 300)}${chunk.text.length > 300 ? '...' : ''}"
          <div class="source">
            📎 ${chunk.fileName} • Similarity: ${(chunk.score * 100).toFixed(1)}%
          </div>
        </div>
      `).join('');
            retrievedContext.style.display = 'block';
        }

        activateStep('step-augment');
        loadingText.textContent = 'Augmenting prompt...';
        await sleep(300);

        activateStep('step-generate');
        loadingText.textContent = 'Generating response...';
        await sleep(200);

        // Display response
        ragLoading.style.display = 'none';
        ragResponse.innerHTML = formatResponse(data.response);
        generatedResponse.style.display = 'block';

    } catch (error) {
        ragLoading.style.display = 'none';
        resetPipeline();
        showError(error.message);
    } finally {
        ragQueryBtn.disabled = false;
    }
}

// Format response with basic markdown
function formatResponse(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
        .replace(/• /g, '&nbsp;&nbsp;• ');
}

// Sleep utility
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Event listeners
ragQueryBtn.addEventListener('click', runRAGQuery);
ragInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        runRAGQuery();
    }
});

// Initialize
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    resetPipeline();
    loadDocuments();
});
