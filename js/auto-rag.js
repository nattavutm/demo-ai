/**
 * Auto RAG Interactive Demo
 */

import './main.js';

// DOM Elements
const ragInput = document.getElementById('ragInput');
const ragQueryBtn = document.getElementById('ragQueryBtn');
const retrievedContext = document.getElementById('retrievedContext');
const contextChunks = document.getElementById('contextChunks');
const generatedResponse = document.getElementById('generatedResponse');
const ragResponse = document.getElementById('ragResponse');
const ragLoading = document.getElementById('ragLoading');

// Pipeline steps
const steps = ['step-query', 'step-embed', 'step-retrieve', 'step-augment', 'step-generate'];

// Mock knowledge base
const knowledgeBase = {
    'refund': [
        {
            text: "Our refund policy allows customers to request a full refund within 30 days of purchase. After 30 days, we offer store credit for eligible returns.",
            source: "company-policies.pdf",
            similarity: 0.94
        },
        {
            text: "To initiate a refund, contact our support team at support@example.com or use the self-service portal in your account dashboard.",
            source: "faq.txt",
            similarity: 0.87
        },
        {
            text: "Refunds are processed within 5-7 business days. Digital products are non-refundable after download or activation.",
            source: "company-policies.pdf",
            similarity: 0.82
        }
    ],
    'product': [
        {
            text: "Our flagship product, CloudSync Pro, offers real-time data synchronization across multiple cloud providers with end-to-end encryption.",
            source: "product-docs.md",
            similarity: 0.91
        },
        {
            text: "CloudSync Pro supports integration with AWS, Google Cloud, Azure, and Cloudflare R2. Setup takes less than 5 minutes.",
            source: "product-docs.md",
            similarity: 0.85
        },
        {
            text: "Pricing starts at $29/month for the Starter plan (up to 100GB) and $99/month for the Pro plan (unlimited storage).",
            source: "product-docs.md",
            similarity: 0.78
        }
    ],
    'support': [
        {
            text: "Our support team is available 24/7 via email at support@example.com. Premium customers have access to priority phone support.",
            source: "faq.txt",
            similarity: 0.93
        },
        {
            text: "Check our knowledge base at docs.example.com for tutorials, guides, and troubleshooting tips before contacting support.",
            source: "faq.txt",
            similarity: 0.86
        },
        {
            text: "Average response time for email support is 2 hours during business days. Premium support guarantees response within 30 minutes.",
            source: "company-policies.pdf",
            similarity: 0.79
        }
    ],
    'default': [
        {
            text: "Welcome to our company! We provide cloud-based solutions for businesses of all sizes. Our products help you manage data, sync files, and collaborate with your team.",
            source: "product-docs.md",
            similarity: 0.65
        },
        {
            text: "For any questions, please visit our FAQ section or contact our support team. We're here to help!",
            source: "faq.txt",
            similarity: 0.58
        }
    ]
};

// Mock AI responses
const mockAIResponses = {
    'refund': "Based on our company policies, you can request a **full refund within 30 days** of your purchase. After that period, we offer store credit for eligible returns.\n\nTo initiate a refund:\n1. Contact support@example.com, or\n2. Use the self-service portal in your account dashboard\n\n⏱️ Refunds are typically processed within 5-7 business days. Note that digital products are non-refundable after download or activation.",
    'product': "Our flagship product is **CloudSync Pro** - a real-time data synchronization solution with end-to-end encryption.\n\n**Key Features:**\n• Multi-cloud support (AWS, Google Cloud, Azure, Cloudflare R2)\n• Quick 5-minute setup\n• End-to-end encryption\n\n**Pricing:**\n• Starter: $29/month (up to 100GB)\n• Pro: $99/month (unlimited storage)",
    'support': "Our support team is available **24/7** via email at support@example.com.\n\n**Support Options:**\n• Email: 2-hour average response time\n• Premium phone support (for premium customers)\n• Self-service: docs.example.com\n\n💡 **Tip:** Premium support guarantees response within 30 minutes!",
    'default': "I found some general information about our company. We provide cloud-based solutions for businesses of all sizes, including data management, file sync, and team collaboration tools.\n\nFor specific questions, please try asking about:\n• Our products\n• Refund policy\n• Support options"
};

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

// Get relevant context based on query
function getRelevantContext(query) {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('refund') || lowerQuery.includes('return') || lowerQuery.includes('money back')) {
        return { key: 'refund', chunks: knowledgeBase['refund'] };
    } else if (lowerQuery.includes('product') || lowerQuery.includes('cloudsync') || lowerQuery.includes('price') || lowerQuery.includes('feature')) {
        return { key: 'product', chunks: knowledgeBase['product'] };
    } else if (lowerQuery.includes('support') || lowerQuery.includes('help') || lowerQuery.includes('contact')) {
        return { key: 'support', chunks: knowledgeBase['support'] };
    }
    return { key: 'default', chunks: knowledgeBase['default'] };
}

// Display retrieved chunks
function displayChunks(chunks) {
    contextChunks.innerHTML = chunks.map(chunk => `
    <div class="context-chunk">
      "${chunk.text}"
      <div class="source">📎 ${chunk.source} • Similarity: ${(chunk.similarity * 100).toFixed(0)}%</div>
    </div>
  `).join('');
}

// Run RAG query
async function runRAGQuery() {
    const query = ragInput.value.trim();
    if (!query) return;

    // Reset state
    retrievedContext.style.display = 'none';
    generatedResponse.style.display = 'none';
    ragLoading.style.display = 'block';
    ragQueryBtn.disabled = true;

    // Step 1: Query
    activateStep('step-query');
    await sleep(400);

    // Step 2: Embed
    activateStep('step-embed');
    await sleep(500);

    // Step 3: Retrieve
    activateStep('step-retrieve');
    await sleep(600);

    const { key, chunks } = getRelevantContext(query);
    displayChunks(chunks);
    retrievedContext.style.display = 'block';

    // Step 4: Augment
    activateStep('step-augment');
    await sleep(400);

    // Step 5: Generate
    activateStep('step-generate');
    await sleep(800);

    // Show response
    ragLoading.style.display = 'none';
    ragResponse.innerHTML = formatResponse(mockAIResponses[key]);
    generatedResponse.style.display = 'block';

    ragQueryBtn.disabled = false;
}

// Format response with basic markdown
function formatResponse(text) {
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

// Sample queries for easy testing
const sampleQueries = [
    "What is the refund policy?",
    "Tell me about your products",
    "How can I contact support?",
    "What are the pricing plans?"
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    resetPipeline();
});
