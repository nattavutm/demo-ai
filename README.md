# Cloudflare AI Features Demo

Interactive demo website showcasing Cloudflare's AI capabilities - specifically **AI Gateway** and **Auto RAG**.

![Cloudflare Demo](https://img.shields.io/badge/Cloudflare-Demo-F6821F?style=for-the-badge&logo=cloudflare&logoColor=white)

## Features

### 🌐 AI Gateway Demo
- Interactive chat interface simulating AI Gateway usage
- Real-time analytics (latency, tokens, cache status)
- Code examples and documentation
- Supported providers showcase

### 🔍 Auto RAG Demo
- Animated RAG pipeline visualization
- Mock knowledge base with document retrieval
- Context chunks display with similarity scores
- Interactive query interface

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

```bash
# Navigate to project directory
cd cloudflare-demo

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deploy to Cloudflare Pages

### Option 1: Connect GitHub Repository

1. Push this project to a GitHub repository
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
3. Click "Create a project" → "Connect to Git"
4. Select your repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
6. Click "Save and Deploy"

### Option 2: Direct Upload via Wrangler

```bash
# Login to Cloudflare
npx wrangler login

# Deploy
npm run deploy
```

## Project Structure

```
cloudflare-demo/
├── index.html          # Landing page
├── ai-gateway.html     # AI Gateway demo
├── auto-rag.html       # Auto RAG demo
├── css/
│   └── styles.css      # Design system & styles
├── js/
│   ├── main.js         # Shared utilities
│   ├── ai-gateway.js   # AI Gateway demo logic
│   └── auto-rag.js     # Auto RAG demo logic
├── package.json        # Dependencies & scripts
├── vite.config.js      # Vite configuration
└── wrangler.toml       # Cloudflare config
```

## Tech Stack

- **Vite** - Build tool
- **Vanilla JS** - No framework dependencies
- **CSS3** - Modern styling with CSS custom properties

## License

MIT
