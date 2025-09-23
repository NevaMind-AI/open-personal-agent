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
- 💾 **Session Management**: Persistent chat sessions with history
- 🔌 **WebSocket Support**: Real-time communication between frontend and backend
- 📁 **Application Management**: Create and manage AI-generated applications
- 🎨 **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Anthropic API key
- Claude Code (for local code tasks) - see [Claude Code Quickstart](https://docs.claude.com/en/docs/claude-code/quickstart)
- Memory API key - visit [memu.so to get an API key](https://app.memu.so/api-key)

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
