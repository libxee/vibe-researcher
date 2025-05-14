# Deep Research

A deep research project based on Vibe Coding philosophy, completely created through interactive dialogue with Claude 3.7 AI, building a multi-agent collaborative system for efficient deep research and information gathering. It achieves excellent research experiences through intuition-driven programming methods.

**Inspired by [bytedance/deer-flow](https://github.com/bytedance/deer-flow)**

## Project Highlights

- 🔮 **Vibe Coding**: AI-driven interactive programming approach, creating all code through conversations with Claude 3.7, making the development process more natural and efficient
- 💻 **Cursor Integration**: Fully utilizing the powerful features of Cursor IDE for a seamless development experience
- 🤖 **Multi-agent Collaboration**: Multi-agent collaborative architecture based on LangGraph, each with specialized roles
- 🔍 **Deep Research**: In-depth exploration of complex topics through iterative search and information processing
- 📊 **Controllable Depth and Breadth**: Customizable research depth and breadth for flexible adjustment of research scope
- 🌐 **Multiple Search Engine Support**: Support for Tavily, DuckDuckGo, Bing, Google, and other search engines
- 📝 **High-quality Reports**: Automatically generate structured research reports with references and key findings
- 🔄 **Recursive Research Process**: Automatically explore related topics based on initial discoveries
- 🔌 **Multiple LLM Providers**: Support for OpenAI and DeepSeek, with flexible switching between different LLMs for agents

## Development Philosophy

This project is developed based on the Vibe Coding philosophy, which is a programming approach that creates code entirely through AI interaction, implemented through:

- Using Cursor as the primary IDE, fully leveraging AI-assisted programming features
- Generating code directly through conversations with Claude 3.7, without manual coding
- Adopting a fluid development workflow, reducing context switching
- Focusing on creative implementation rather than writing boilerplate code
- Intuition-driven development process, making coding more expressive and efficient

## System Architecture

The system consists of the following main agents:

1. **Coordinator**: Manages the entire research process and decides the next action
2. **Planner**: Analyzes research problems and develops detailed research plans
3. **Researcher**: Executes search queries, extracts, and analyzes information
4. **Writer**: Integrates all research findings and generates the final research report

These agents collaborate through a LangGraph state graph, with each agent focusing only on its area of expertise to collectively complete complex research tasks.

For detailed architecture information, please check the [architecture.md](docs/architecture.md) document.

## Project Structure

```
multi-agent-research/
├── docs/                     # Documentation
│   └── architecture.md       # Architecture document
├── src/                      # Source code
│   ├── agents/               # Agent implementations
│   │   ├── baseAgent.ts      # Base agent class
│   │   ├── coordinator.ts    # Coordinator agent
│   │   ├── planner.ts        # Planner agent
│   │   ├── researcher.ts     # Researcher agent
│   │   ├── writer.ts         # Writer agent
│   │   └── index.ts          # Agent index
│   ├── config/               # Configuration
│   │   └── index.ts          # Configuration loading module
│   ├── interfaces/           # Interface definitions
│   │   └── index.ts          # Type and interface definitions
│   ├── services/             # Services
│   │   ├── database.ts       # Database service
│   │   ├── llmClient.ts      # LLM client service
│   │   └── index.ts          # Service index
│   ├── tools/                # Tools
│   │   ├── scraping.ts       # Web scraping tool
│   │   ├── search.ts         # Search tool
│   │   └── index.ts          # Tool index
│   ├── workflows/            # Workflows
│   │   ├── researchWorkflow.ts # Research workflow
│   │   └── index.ts          # Workflow index
│   └── index.ts              # Entry file
├── .env.example              # Environment variable example
├── package.json              # Project configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project documentation
```

## Installation

```bash
# Clone repository
git clone https://github.com/yourusername/multi-agent-research.git
cd multi-agent-research

# Install dependencies
npm install

# Create environment variable file
cp .env.example .env
# Edit .env file to add required API keys

# Build project
npm run build
```

## Usage

### Command Line Usage

```bash
# Run research process
npm run research "Applications of AI in healthcare" --depth 3 --breadth 5
```

## Configuration

The following parameters can be configured in the `.env` file:

```
# OpenAI API Key
OPENAI_API_KEY=your_key_here

# DeepSeek API Configuration
DEEPSEEK_API_KEY=your_deepseek_key_here
DEEPSEEK_API_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# Search Engine Configuration
SEARCH_API_KEY=your_search_key_here
SEARCH_API_TYPE=tavily  # Supports: tavily, bing, google, duckduckgo

# Other Model Configuration
GPT_MODEL_NAME=gpt-4-0125-preview
TEMPERATURE=0.2
```

## LLM Provider Integration

### DeepSeek Integration

The system can be configured to use the DeepSeek model for the researcher agent, as it excels at processing and analyzing information. You can modify these settings in `WORKFLOW_CONFIG` in `src/config/index.ts`:

```typescript
providerConfig: {
  coordinator: 'openai',  // Coordinator uses OpenAI
  planner: 'openai',      // Planner uses OpenAI
  researcher: 'deepseek', // Researcher uses DeepSeek
  writer: 'openai',       // Writer uses OpenAI
}
```

All provider APIs are called through a unified interface, configuring different baseURLs and API Keys as needed.

## Vibe Coding Workflow

This project adopts the Vibe Coding workflow, completely created through AI interaction, with the following specific steps:

1. Using Cursor IDE to create project structure
2. Generating code framework directly through conversations with Claude 3.7
3. Iteratively optimizing features through interactive dialogue
4. Using AI to assist with refactoring and testing
5. Maintaining concise and efficient code style and project structure

## Development

```bash
# Start development mode
npm run dev

# Run tests
npm test

# Code check
npm run lint
```

## Extension Methods

1. Adding new tools: Create new tools in the `src/tools` directory
2. Adding new agents: Implement new agents in the `src/agents` directory
3. Modifying workflows: Modify the workflow in `src/workflows/researchWorkflow.ts`
4. Adding new LLM providers: Implement new clients in `src/services/llmClient.ts`

## Inspiration

This project is inspired by ByteDance's [DeerFlow](https://github.com/bytedance/deer-flow), a community-driven framework for deep research that combines language models with tools like web search, crawling, and Python execution, while contributing back to the open-source community.

## License

MIT 