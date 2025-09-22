# Open Personal Agent

<p align="center">
  <img src="app/public/memu-logo.svg" alt="Open Personal Agent Logo" width="120">
</p>

<p align="center">
  A modern AI-powered personal agent application built with React and powered by Anthropic Claude
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#installation">Installation</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#development">Development</a> •
  <a href="#contributing">Contributing</a>
</p>

## Features

- 🤖 **AI Chat Interface**: Seamless chat experience powered by Anthropic Claude
- 🛠️ **Code Generation**: Integrated Claude Code for automated development tasks
- 📱 **Responsive Design**: Beautiful, modern UI that works on desktop and mobile
- 🔧 **Tool Integration**: Extensible tool system with MCP (Model Context Protocol) support
- 💾 **Session Management**: Persistent chat sessions with history
- 🔌 **WebSocket Support**: Real-time communication between frontend and backend
- 📁 **Application Management**: Create and manage AI-generated applications
- 🎨 **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Anthropic API key
- Claude Code (for local code tasks) - see [Claude Code Quickstart](https://docs.claude.com/zh-CN/docs/claude-code/quickstart)
- Memory API key (optional) - visit [memu.so to get an API key](https://app.memu.so/api-key)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/open-personal-agent.git
cd open-personal-agent
```

### 2. Install dependencies

```bash
# Install frontend dependencies
cd app
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 3. Set up environment variables

Create a `.env` file in the `backend` directory:

```env
PORT=5174
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 4. Start the application

```bash
# Start backend (in backend directory)
npm run dev

# Start frontend (in app directory, in a new terminal)
npm run dev
```

### 5. Open your browser

Navigate to `http://localhost:5173` (frontend) to start using Open Personal Agent.

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   ```bash
   cp .env.example .env  # If example exists, or create manually
   ```

4. Configure your environment variables in `.env`:
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `PORT`: Backend server port (default: 5174)

### Frontend Setup

1. Navigate to the app directory:
   ```bash
   cd app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

### Environment Variables

#### Backend (`backend/.env`)
- `ANTHROPIC_API_KEY`: Required. Your Anthropic API key for Claude integration
- `PORT`: Optional. Backend server port (default: 5174)

### API Key Setup

1. Get your Anthropic API key from [Anthropic Console](https://console.anthropic.com/)
2. Add it to your backend `.env` file
3. The frontend will prompt you to enter the API key on first use

## Development

### Project Structure

```
open-personal-agent/
├── app/                    # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── api/           # API client
│   │   └── ...
│   └── package.json
├── backend/               # Backend Express server
│   ├── src/
│   │   ├── api/          # API routes
│   │   ├── utils/        # Utilities and tools
│   │   ├── ws/           # WebSocket server
│   │   └── ...
│   └── package.json
└── README.md
```

### Available Scripts

#### Frontend (app/)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

#### Backend (backend/)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm test` - Run tests (when available)

### Technology Stack

#### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and development server
- **Tailwind CSS** - Styling
- **React Markdown** - Markdown rendering

#### Backend
- **Express** - Web server framework
- **TypeScript** - Type safety
- **WebSocket (ws)** - Real-time communication
- **LokiJS** - In-memory database
- **Anthropic SDK** - Claude API integration
- **MCP SDK** - Model Context Protocol

### Adding New Tools

Open Personal Agent supports extensible tools through the MCP (Model Context Protocol). To add new tools:

1. Create a new tool definition in `backend/src/utils/tools/`
2. Export the tool definition and executor
3. Register the tool in `backend/src/utils/toolBase.ts`

Example tool structure:
```typescript
export const myToolDefine: ToolUnion = {
  name: "my_tool",
  description: "Description of what the tool does",
  input_schema: {
    type: "object",
    properties: {
      // Define input parameters
    }
  }
};

export async function myToolExec(input: MyToolInput): Promise<MyToolOutput> {
  // Tool implementation
}
```

## API Reference

### REST Endpoints

- `GET /api/health` - Health check
- `POST /api/anthropic/stream` - Stream chat with Claude
- `GET /api/sessions` - List chat sessions
- `POST /api/sessions` - Save chat session
- `DELETE /api/sessions/:id` - Delete chat session

### WebSocket Events

- `connection` - Client connected
- `session_switch` - Switch chat session
- `disconnect` - Client disconnected

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -am 'Add some feature'`
6. Push to the branch: `git push origin feature/my-feature`
7. Submit a pull request

### Code Style

- Use TypeScript for type safety
- Follow existing code formatting
- Run `npm run lint` to check code style
- Ensure all tests pass

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Anthropic](https://www.anthropic.com/) for the Claude API
- [Vite](https://vitejs.dev/) for the excellent build tool
- [React](https://reactjs.org/) for the UI framework
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/open-personal-agent/issues) page
2. Create a new issue if your problem isn't already reported
3. Join our community discussions

---

<p align="center">
  Made with ❤️ by the Open Personal Agent team
</p>
