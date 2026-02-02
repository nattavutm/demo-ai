/**
 * AI Gateway Interactive Demo
 */

import './main.js';

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const latencyValue = document.getElementById('latencyValue');
const tokensValue = document.getElementById('tokensValue');
const cacheValue = document.getElementById('cacheValue');

// Mock responses for demo
const mockResponses = [
    {
        response: "Hello! I'm here to help you understand how Cloudflare AI Gateway works. It acts as a proxy between your application and AI providers, giving you control over caching, rate limiting, and analytics. What would you like to know more about?",
        latency: 245,
        tokens: 52,
        cached: false
    },
    {
        response: "AI Gateway supports multiple providers including OpenAI, Anthropic, Azure OpenAI, and Workers AI. You can even set up fallbacks so if one provider fails, your request automatically routes to another!",
        latency: 312,
        tokens: 41,
        cached: false
    },
    {
        response: "With caching enabled, identical requests return instantly from the cache. This dramatically reduces costs and latency. For example, if 100 users ask the same question, you only pay for 1 API call!",
        latency: 48,
        tokens: 45,
        cached: true
    },
    {
        response: "Rate limiting in AI Gateway helps you control costs and prevent abuse. You can set limits per user, per API key, or globally. Combined with analytics, you get full visibility into your AI usage.",
        latency: 278,
        tokens: 43,
        cached: false
    },
    {
        response: "To get started, create an AI Gateway in your Cloudflare dashboard, then update your API endpoint URLs to route through the gateway. It's just a simple URL change - no code refactoring needed!",
        latency: 52,
        tokens: 47,
        cached: true
    }
];

let responseIndex = 0;
let requestCount = 0;

// Add message to chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    messageDiv.textContent = content;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show loading state
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.id = 'loadingMessage';
    loadingDiv.innerHTML = `
    <div class="loading">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove loading state
function hideLoading() {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

// Update analytics display
function updateAnalytics(data) {
    latencyValue.textContent = `${data.latency}ms`;
    tokensValue.textContent = data.tokens;
    cacheValue.textContent = data.cached ? 'HIT ✓' : 'MISS';
    cacheValue.style.color = data.cached ? '#27ca40' : 'var(--cf-orange)';
}

// Simulate API call
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage(message, true);
    chatInput.value = '';
    requestCount++;

    // Show loading
    showLoading();
    sendBtn.disabled = true;

    // Get mock response
    const mockData = mockResponses[responseIndex % mockResponses.length];

    // Simulate variable latency based on cache status
    const delay = mockData.cached ? 100 : Math.random() * 500 + 500;

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, delay));

    // Hide loading and show response
    hideLoading();
    addMessage(mockData.response);
    updateAnalytics(mockData);

    responseIndex++;
    sendBtn.disabled = false;
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Initialize with welcome message analytics
document.addEventListener('DOMContentLoaded', () => {
    latencyValue.textContent = '0ms';
    tokensValue.textContent = '0';
    cacheValue.textContent = '--';
});
