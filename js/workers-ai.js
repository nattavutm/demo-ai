/**
 * Workers AI Interactive Demo
 * Connects to Cloudflare Worker Chat API
 */

import './main.js';

// DOM Elements
const modelSelect = document.getElementById('modelSelect');
const systemPrompt = document.getElementById('systemPrompt');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

// State
let messageHistory = [];

// API Configuration
const API_URL = 'https://rag-api.nforce-lab.workers.dev';

// Get API base URL
function getApiUrl() {
    return API_URL;
}

// Test API connection - Removed, strictly using hardcoded URL
// No manual test button needed anymore



// Add message to chat UI
function addMessage(role, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    // Process basic markdown formatting
    const formattedText = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');

    messageDiv.innerHTML = formattedText;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Send message
async function sendMessage() {
    const text = chatInput.value.trim();
    const url = getApiUrl();

    if (!text) return;
    if (!url) {
        alert('Please set the API endpoint first');
        return;
    }

    // Add user message
    addMessage('user', text);
    chatInput.value = '';
    sendBtn.disabled = true;

    // Loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.innerHTML = '<div class="loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // Construct messages array
        const messages = [
            { role: 'system', content: systemPrompt.value },
            ...messageHistory,
            { role: 'user', content: text }
        ];

        const response = await fetch(`${url}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages,
                model: modelSelect.value
            })
        });

        const data = await response.json();

        // Remove loading
        chatMessages.removeChild(loadingDiv);

        if (response.ok) {
            const aiResponse = data.response;
            addMessage('assistant', aiResponse);

            // Update history
            messageHistory.push({ role: 'user', content: text });
            messageHistory.push({ role: 'assistant', content: aiResponse });
        } else {
            addMessage('assistant', `<span style="color: #ff6b6b">Error: ${data.error || 'Unknown error'}</span>`);
        }
    } catch (error) {
        chatMessages.removeChild(loadingDiv);
        addMessage('assistant', `<span style="color: #ff6b6b">Connection error: ${error.message}</span>`);
    } finally {
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});


