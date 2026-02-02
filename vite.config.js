import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                'ai-gateway': resolve(__dirname, 'ai-gateway.html'),
                'auto-rag': resolve(__dirname, 'auto-rag.html'),
                'workers-ai': resolve(__dirname, 'workers-ai.html'),
            },
        },
    },
});
