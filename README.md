# Directus Prototyper

A powerful framework for rapidly prototyping ERP-like applications using Directus CMS with generative AI assistance. Built for developers who want to move fast and build complex business applications with minimal setup.

Includes ready-to-use utilities to interact with Google, OpenAI, and AWS Bedrock, providing access to models from Claude, GPT, Gemini, Meta, and DeepSeek.

## 🚀 Overview

Directus Prototyper combines the flexibility of Directus CMS with AI-powered code generation to accelerate the development of enterprise resource planning (ERP) systems, business management tools, and data-driven applications. Perfect for technical teams practicing "vibe coding" - rapid prototyping with intelligent assistance.

### Key Features

- **🏗️ Directus-Powered Backend**: Leverage Directus CMS for instant API generation, admin panels, and database management
- **🤖 AI-Enhanced Development**: Integrated AI providers (OpenAI, Google Gemini) for code generation and intelligent assistance
- **⚡ Rapid Prototyping**: Pre-configured Docker environment with hot-reload development
- **🔧 Extension Framework**: Custom Directus extensions for specialized business logic
- **📊 Schema Management**: Automated collection and field management with version control
- **🛠️ Developer Tools**: Comprehensive utility scripts for debugging and development

## 🛠️ Tech Stack

- **Backend**: Directus CMS v10+
- **Database**: PostgreSQL
- **Runtime**: Node.js 20.19.2 with pnpm
- **AI Providers**: OpenAI GPT, Google Gemini, AWS Bedrock (Claude, Meta, DeepSeek)
- **Infrastructure**: Docker & Docker Compose
- **Frontend**: Vue.js 3 (for custom interfaces)
- **Language**: TypeScript throughout

## 🚦 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20.19.2
- pnpm package manager

### Installation

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd directus-prototyper
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

3. **Start Development Environment**
   ```bash
   docker-compose up -d
   pnpm use 20.19.2
   pnpm install
   ```

4. **Build Extensions**
   ```bash
   ./bin/build-extension.sh prototyper
   ```

5. **Access Applications**
   - Directus Admin: http://localhost:17777
   - API: http://localhost:17777/api

## 📁 Project Structure

```
directus-prototyper/
├── bin/                           # Utility scripts
│   ├── sync-backup.sh            # Sync configuration from dev instance
│   ├── list-collections.sh       # List available collections
│   ├── get-collections-fields.sh # Extract field configurations
│   ├── get-docker-console-snapshot.sh # Docker diagnostics
│   ├── get-extension-console-snapshot.sh # Extension diagnostics
│   └── build-extension.sh        # Build specific extensions
├── extensions/
│   └── prototyper/               # Main extension bundle
│       ├── src/
│       │   ├── endpoints/        # Custom API endpoints
│       │   ├── hooks/            # Database hooks
│       │   ├── services/         # Business logic services
│       │   └── views/            # Custom admin interfaces
│       └── log/                  # Development logs
├── directus-config/
│   └── snapshot/                 # Schema snapshots
│       ├── collections/          # Collection definitions
│       ├── fields/               # Field configurations
│       └── relations/            # Relationship definitions
├── directus-sync-configurations/ # Sync tool configurations
└── data/                         # Persistent database data
```

## 🔧 Development Workflow

### 1. Schema Design
- Design your data model in Directus Admin
- Use the built-in schema builder for collections, fields, and relationships

### 2. Sync Configuration
```bash
./bin/sync-backup.sh  # Pull latest schema from development instance
```

### 3. Extension Development
```bash
cd extensions/prototyper
pnpm dev:log  # Start development with logging
```

### 4. AI-Assisted Coding
- Use the integrated AI services for code generation
- Leverage the custom endpoints for AI-powered features
- Generate business logic, validation rules, and UI components

### 5. Testing & Debugging
```bash
./bin/get-extension-console-snapshot.sh prototyper  # Check extension status
./bin/get-docker-console-snapshot.sh  # Monitor container health
```

## 🤖 AI Integration

### Supported Providers
- **OpenAI**: GPT models for code generation and business logic
- **Google Gemini**: Advanced reasoning and data analysis
- **AWS Bedrock**: Access to Claude, Meta Llama, and DeepSeek models
- **Multi-Model Support**: Switch between providers seamlessly for different use cases

### Usage Examples
```typescript
// Generate business validation rules
const validationRules = await aiService.generateValidation({
  collection: 'orders',
  requirements: 'Validate order total > 0 and customer exists'
});

// Create custom field interfaces
const interface = await aiService.generateInterface({
  type: 'financial-calculator',
  fields: ['amount', 'tax_rate', 'total']
});
```

## 📊 Utility Scripts

The `bin/` directory contains powerful utilities for development:

- **`sync-backup.sh`**: Synchronize schema from development instance
- **`list-collections.sh`**: View all available collections and field counts
- **`get-collections-fields.sh`**: Extract detailed field/relation configurations
- **`get-docker-console-snapshot.sh`**: Docker container diagnostics
- **`get-extension-console-snapshot.sh`**: Extension build status and logs
- **`build-extension.sh`**: Build extensions with proper environment setup

See individual script documentation for detailed usage.

## 🎯 Use Cases

### Enterprise Resource Planning (ERP)
- Inventory management systems
- Order processing workflows
- Financial reporting dashboards
- Customer relationship management

### Business Management Tools
- Project management platforms
- HR management systems
- Document management solutions
- Compliance tracking systems

### Data-Driven Applications
- Analytics dashboards
- Reporting systems
- Data transformation pipelines
- API-first architectures

## 🔒 Environment Variables

Key configuration options:

```env
# Database
POSTGRES_USER=directus
POSTGRES_PASSWORD=directus
POSTGRES_DB=directus

# Directus
DIRECTUS_URL=http://0.0.0.0:17777
DIRECTUS_KEY=your-directus-key
DIRECTUS_SECRET=your-directus-secret

# AI Providers
OPENAI_API_KEY=your-openai-key
GOOGLEGENAI_API_KEY=your-gemini-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1

# Docker
DOCKER_DIRECTUS_CONTAINER_NAME=ls-directus-directus-prototyper
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🛟 Support

- **Documentation**: Check the AI instruction files (`.github/copilot-instructions.md`, `CLAUDE.md`, `GEMINI.md`)
- **Issues**: Report bugs and request features via GitHub Issues
- **Community**: Join discussions in GitHub Discussions

---

**Built with ❤️ for developers who move fast and build things.**