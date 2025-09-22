# Contributing to Open Personal Agent

Thank you for considering contributing to Open Personal Agent! We welcome contributions from the community and are pleased to have you here.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

### Our Standards

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/yourusername/open-personal-agent.git
   cd open-personal-agent
   ```
3. Set up the development environment (see [Development Setup](#development-setup))
4. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

## How to Contribute

### Types of Contributions

We welcome several types of contributions:

- **Bug Reports**: Help us identify and fix bugs
- **Feature Requests**: Suggest new features or improvements
- **Code Contributions**: Submit bug fixes, new features, or improvements
- **Documentation**: Improve existing documentation or add new docs
- **Testing**: Write tests or improve test coverage
- **UI/UX Improvements**: Enhance the user interface and experience

### Before You Start

1. Check existing [issues](https://github.com/yourusername/open-personal-agent/issues) and [pull requests](https://github.com/yourusername/open-personal-agent/pulls) to avoid duplicates
2. For large changes, please open an issue first to discuss the proposed changes
3. Make sure you understand the project structure and coding standards

## Development Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- Anthropic API key for testing

### Setup Steps

1. **Install dependencies for both frontend and backend:**
   ```bash
   # Frontend
   cd app
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # In backend directory, create .env file
   touch .env
   # Add your Anthropic API key and other configurations
   ```

3. **Start development servers:**
   ```bash
   # Backend (in backend directory)
   npm run dev
   
   # Frontend (in app directory, new terminal)
   npm run dev
   ```

### Project Structure

```
open-personal-agent/
├── app/                    # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── api/           # API client code
│   │   ├── theme/         # Theme and styling
│   │   └── ...
├── backend/               # Express.js backend
│   ├── src/
│   │   ├── api/          # REST API routes
│   │   ├── utils/        # Utilities and tools
│   │   ├── ws/           # WebSocket handling
│   │   └── ...
└── ...
```

## Pull Request Process

1. **Create a descriptive branch name:**
   - `feature/add-dark-mode`
   - `fix/chat-scroll-issue`
   - `docs/api-documentation`

2. **Make your changes:**
   - Write clear, concise commit messages
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes:**
   ```bash
   # Run linting
   npm run lint
   
   # Run tests (when available)
   npm test
   
   # Test manually in browser
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add dark mode toggle functionality"
   ```

5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request:**
   - Use a clear, descriptive title
   - Describe what you've changed and why
   - Reference any related issues
   - Add screenshots for UI changes
   - Ensure CI checks pass

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other (please describe)

## Testing
- [ ] I have tested these changes locally
- [ ] I have added/updated tests as needed
- [ ] All existing tests pass

## Screenshots (if applicable)

## Related Issues
Fixes #123
```

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow existing code formatting (we recommend using Prettier)
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer `const` over `let`, avoid `var`

### React Components

- Use functional components with hooks
- Follow the existing component structure
- Use TypeScript for prop types
- Keep components focused and reusable
- Use meaningful component names

### Backend Code

- Follow RESTful API conventions
- Use proper error handling
- Validate input data
- Write secure code (sanitize inputs, etc.)
- Use TypeScript types for API contracts

### CSS/Styling

- Use Tailwind CSS classes when possible
- Follow responsive design principles
- Maintain consistent spacing and colors
- Use semantic class names for custom CSS

## Testing

### Running Tests

```bash
# Frontend tests (when available)
cd app
npm test

# Backend tests (when available)
cd backend
npm test
```

### Writing Tests

- Write unit tests for utility functions
- Add integration tests for API endpoints
- Test React components with React Testing Library
- Ensure good test coverage for new features

### Manual Testing

1. Test your changes in different browsers
2. Verify responsive design on mobile devices
3. Test with different API configurations
4. Verify accessibility standards

## Issue Reporting

### Before Reporting

1. Search existing issues to avoid duplicates
2. Try to reproduce the issue consistently
3. Test with the latest version

### Bug Reports

Include the following information:

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps to trigger the issue
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: 
  - OS and version
  - Browser and version
  - Node.js version
  - API key status (without revealing the key)
- **Screenshots**: If applicable
- **Error Messages**: Any console errors or logs

### Feature Requests

Include the following:

- **Description**: Clear description of the feature
- **Use Case**: Why this feature would be useful
- **Proposed Solution**: How you envision it working
- **Alternatives**: Other approaches you've considered
- **Additional Context**: Any other relevant information

## Development Guidelines

### Git Workflow

- Keep commits atomic (one logical change per commit)
- Write clear commit messages using conventional commits format:
  - `feat: add new feature`
  - `fix: resolve bug in chat component`
  - `docs: update API documentation`
  - `style: format code with prettier`
  - `refactor: simplify authentication logic`
  - `test: add unit tests for API client`

### Code Review

- Be respectful and constructive
- Focus on the code, not the person
- Explain the "why" behind your suggestions
- Ask questions when you don't understand
- Approve when ready, request changes when needed

### Performance Considerations

- Optimize for fast loading times
- Minimize bundle size
- Use lazy loading where appropriate
- Optimize API calls and database queries
- Consider mobile performance

## Getting Help

If you need help or have questions:

1. Check existing documentation
2. Search through existing issues
3. Ask questions in issue comments
4. Reach out to maintainers

## Recognition

Contributors will be recognized in the following ways:

- Listed in the project's contributors
- Mentioned in release notes for significant contributions
- Invited to join the core team for exceptional contributors

## License

By contributing to Open Personal Agent, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for contributing to Open Personal Agent! 🎉
