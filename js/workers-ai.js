/**
 * Workers AI Interactive Demo
 * Connects to Cloudflare Worker Chat API
 */

import './main.js';

// DOM Elements
const apiEndpoint = document.getElementById('apiEndpoint');
const testApiBtn = document.getElementById('testApiBtn');
const apiStatus = document.getElementById('apiStatus');
const modelSelect = document.getElementById('modelSelect');
const systemPrompt = document.getElementById('systemPrompt');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

// State
let messageHistory = [];

// Load saved API endpoint
const savedEndpoint = localStorage.getItem('ragApiEndpoint');
if (savedEndpoint) {
    apiEndpoint.value = savedEndpoint;
}

// Save API endpoint on change
apiEndpoint.addEventListener('change', () => {
    localStorage.setItem('ragApiEndpoint', apiEndpoint.value);
});

// Get API base URL
function getApiUrl() {
    return apiEndpoint.value.replace(/\/$/, '');
}

// Test API connection
testApiBtn.addEventListener('click', async () => {
    const url = getApiUrl();
    if (!url) {
        apiStatus.textContent = '❌ Enter API URL';
        apiStatus.style.color = '#ff6b6b';
        return;
    }

    apiStatus.textContent = '⏳ Testing...';
    apiStatus.style.color = 'var(--text-muted)';

    try {
        const response = await fetch(`${url}/api/health`);
        if (response.ok) {
            apiStatus.textContent = '✅ Connected';
            apiStatus.style.color = '#27ca40';
        } else {
            apiStatus.textContent = '❌ Error ' + response.status;
            apiStatus.style.color = '#ff6b6b';
        }
    } catch (error) {
        apiStatus.textContent = '❌ Connection failed';
        apiStatus.style.color = '#ff6b6b';
    }
});

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

// Auto-test if endpoint is saved
document.addEventListener('DOMContentLoaded', () => {
    if (apiEndpoint.value) {
        testApiBtn.click();
    }
});
