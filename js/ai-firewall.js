import './main.js';

document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const firewallStatus = document.getElementById('firewallStatus');
    const demoPanel = document.getElementById('demoPanel');
    const tryPrompts = document.querySelectorAll('.try-prompt');

    // API Configuration
    const API_URL = 'https://rag-api.nforce-lab.workers.dev';

    const addMessage = (role, content, blocked = false, detections = []) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        let html = content;

        if (blocked) {
            messageDiv.classList.add('firewall-alert');
            const badge = `<div class="block-badge badge-blocked">Request Blocked by Cloudflare</div>`;
            const detHtml = detections.length > 0
                ? detections.map(d => `<div class="detection-label">⚠️ ${d}</div>`).join('')
                : `<div class="detection-label">⚠️ Firewall for AI Policy Violation</div>`;
            html = `${badge}<div>${content}</div>${detHtml}`;
        } else if (role === 'assistant') {
            // Process basic markdown formatting for assistant responses
            html = content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/`([^`]+)`/g, '<code>$1</code>')
                .replace(/\n/g, '<br>');
        }

        messageDiv.innerHTML = html;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const showLoading = () => {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant';
        loadingDiv.id = 'loadingMessage';
        loadingDiv.innerHTML = '<div class="loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return loadingDiv;
    };

    const handleSend = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        // Add user message
        addMessage('user', text);
        chatInput.value = '';
        sendBtn.disabled = true;

        const loadingDiv = showLoading();

        try {
            const response = await fetch(`${API_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant. If you see this, the firewall allowed the request.' },
                        { role: 'user', content: text }
                    ],
                    model: '@cf/meta/llama-3-8b-instruct'
                })
            });

            // Remove loading
            loadingDiv.remove();

            if (response.status === 403) {
                // Blocked by Cloudflare Firewall
                firewallStatus.className = 'block-badge badge-blocked';
                firewallStatus.textContent = 'Threat Blocked';
                demoPanel.classList.add('firewall-alert');

                addMessage('assistant', "Your request was blocked by Cloudflare Firewall for AI. This prompt contains patterns that violate the configured security policies (e.g., Prompt Injection or Sensitive Data).", true);

                setTimeout(() => {
                    firewallStatus.className = 'block-badge badge-passed';
                    firewallStatus.textContent = 'Firewall Active';
                    demoPanel.classList.remove('firewall-alert');
                }, 5000);
            } else if (response.ok) {
                const data = await response.json();
                addMessage('assistant', data.response);
            } else {
                const data = await response.json().catch(() => ({}));
                addMessage('assistant', `<span style="color: #ff6b6b">Error: ${data.error || 'Server error'}</span>`);
            }
        } catch (error) {
            loadingDiv.remove();
            addMessage('assistant', `<span style="color: #ff6b6b">Connection error: ${error.message}</span>`);
        } finally {
            sendBtn.disabled = false;
            chatInput.focus();
        }
    };

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    tryPrompts.forEach(p => {
        p.addEventListener('click', () => {
            chatInput.value = p.textContent.replace(/"/g, '');
            handleSend();
        });
    });
});
