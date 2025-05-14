# Multi-Agent Research

一个基于TypeScript和LangGraph的MultiAgent架构研究助手，用于进行深度研究和信息收集。

## 功能特点

- 🤖 **多代理协作**: 基于LangGraph实现的多代理协作架构，各司其职
- 🔍 **深度研究**: 通过迭代搜索和信息处理，深入探索复杂主题
- 📊 **可控深度和广度**: 自定义研究深度和广度，灵活调整研究范围
- 🌐 **多搜索引擎支持**: 支持Tavily, DuckDuckGo, Bing, Google等多种搜索引擎
- 📝 **高质量报告**: 自动生成结构化的研究报告，包含引用和关键发现
- 🔄 **递归研究流程**: 基于初始发现自动深入探索相关主题
- 📦 **本地存储**: 使用SQLite存储研究任务和步骤，方便回顾和分析
- 🚀 **API服务**: 提供RESTful API接口，方便集成和扩展
- 🔌 **多LLM提供商**: 支持OpenAI和DeepSeek，可灵活切换不同代理使用的LLM

## 系统架构

系统由以下几个主要代理组成：

1. **协调者(Coordinator)**: 管理整个研究流程，决定下一步行动
2. **规划者(Planner)**: 分析研究问题，制定详细的研究计划
3. **研究员(Researcher)**: 执行搜索查询，提取和分析信息（默认使用DeepSeek）
4. **撰写者(Writer)**: 整合所有研究发现，生成最终研究报告

这些代理通过LangGraph状态图进行协作，每个代理只关注自己的专业领域，共同完成复杂的研究任务。

详细架构说明请查看 [architecture.md](docs/architecture.md) 文档。

## 项目结构

```
multi-agent-research/
├── docs/                     # 文档
│   └── architecture.md       # 架构文档
├── src/                      # 源代码
│   ├── agents/               # 代理实现
│   │   ├── baseAgent.ts      # 基础代理类
│   │   ├── coordinator.ts    # 协调者代理
│   │   ├── planner.ts        # 规划者代理
│   │   ├── researcher.ts     # 研究员代理
│   │   ├── writer.ts         # 撰写者代理
│   │   └── index.ts          # 代理索引
│   ├── config/               # 配置
│   │   └── index.ts          # 配置加载模块
│   ├── interfaces/           # 接口定义
│   │   └── index.ts          # 类型和接口定义
│   ├── services/             # 服务
│   │   ├── database.ts       # 数据库服务
│   │   ├── llmClient.ts      # LLM客户端服务
│   │   └── index.ts          # 服务索引
│   ├── tools/                # 工具
│   │   ├── scraping.ts       # 网页抓取工具
│   │   ├── search.ts         # 搜索工具
│   │   └── index.ts          # 工具索引
│   ├── workflows/            # 工作流
│   │   ├── researchWorkflow.ts # 研究工作流
│   │   └── index.ts          # 工作流索引
│   ├── index.ts              # 入口文件
│   └── server.ts             # API服务器
├── .env.example              # 环境变量示例
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript配置
└── README.md                 # 项目说明
```

## 安装

```bash
# 克隆仓库
git clone https://github.com/yourusername/multi-agent-research.git
cd multi-agent-research

# 安装依赖
npm install

# 创建环境变量文件
cp .env.example .env
# 编辑.env文件添加所需的API密钥

# 构建项目
npm run build
```

## 使用方法

### 命令行使用

```bash
# 运行研究流程
npm run research "人工智能在医疗领域的应用" --depth 3 --breadth 5

# 启动API服务器
npm run server

# 创建研究任务
npm run create-task "量子计算对密码学的影响" --depth 2 --breadth 4
```

### API使用

启动服务器后，可以通过以下API接口使用：

- `GET /health` - 健康检查
- `GET /api/tasks` - 获取任务列表
- `GET /api/tasks/:id` - 获取指定任务详情
- `POST /api/tasks` - 创建新研究任务

## 配置

在`.env`文件中可以配置以下参数：

```
# OpenAI API Key
OPENAI_API_KEY=your_key_here

# DeepSeek API配置
DEEPSEEK_API_KEY=your_deepseek_key_here
DEEPSEEK_API_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# 搜索引擎配置
SEARCH_API_KEY=your_search_key_here
SEARCH_API_TYPE=tavily  # 支持: tavily, bing, google, duckduckgo

# 服务器配置
PORT=3000
NODE_ENV=development

# 模型配置
MODEL_NAME=gpt-4-0125-preview
TEMPERATURE=0.2
```

## LLM提供商集成

### DeepSeek集成

系统默认配置研究员代理使用DeepSeek模型，因为它擅长处理和分析信息。其他代理默认使用OpenAI。你可以在`src/config/index.ts`中的`WORKFLOW_CONFIG`修改这些设置：

```typescript
providerConfig: {
  coordinator: 'openai',  // 协调者使用OpenAI
  planner: 'openai',      // 规划者使用OpenAI
  researcher: 'deepseek', // 研究员使用DeepSeek
  writer: 'openai',       // 撰写者使用OpenAI
}
```

DeepSeek API与OpenAI API格式兼容，通过OpenAI SDK进行调用，只需配置不同的baseURL和API Key即可。

## 开发

```bash
# 启动开发模式
npm run dev

# 运行测试
npm test

# 代码检查
npm run lint
```

## 扩展方法

1. 添加新工具: 在`src/tools`目录下创建新工具
2. 添加新代理: 在`src/agents`目录下实现新代理
3. 修改工作流: 在`src/workflows/researchWorkflow.ts`中修改工作流程
4. 添加新LLM提供商: 在`src/services/llmClient.ts`中实现新的客户端

## 许可证

MIT 