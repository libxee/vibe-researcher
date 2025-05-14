# Deep Research

一个基于Vibe Coding理念的深度研究项目，完全通过Claude 3.7 AI交互式创建的多代理协作系统，用于高效进行深度研究和信息收集。通过直觉驱动的编程方法，实现AI赋能的研究体验。

**项目灵感来源于 [bytedance/deer-flow](https://github.com/bytedance/deer-flow)**

## 项目亮点

- 🔮 **Vibe Coding**: AI驱动的交互式编程方式，通过与Claude 3.7对话完成全部代码创建，让开发过程更加自然和高效
- 💻 **Cursor集成**: 充分利用Cursor IDE的强大功能，实现无缝开发体验
- 🤖 **多代理协作**: 基于LangGraph实现的多代理协作架构，各司其职
- 🔍 **深度研究**: 通过迭代搜索和信息处理，深入探索复杂主题
- 📊 **可控深度和广度**: 自定义研究深度和广度，灵活调整研究范围
- 🌐 **多搜索引擎支持**: 支持Tavily, DuckDuckGo, Bing, Google等多种搜索引擎
- 📝 **高质量报告**: 自动生成结构化的研究报告，包含引用和关键发现
- 🔄 **递归研究流程**: 基于初始发现自动深入探索相关主题
- 🔌 **多LLM提供商**: 支持OpenAI和DeepSeek，可灵活切换不同代理使用的LLM

## 开发理念

本项目基于Vibe Coding理念开发，这是一种完全通过AI交互创建代码的编程方式，通过以下方式实现：

- 使用Cursor作为主要IDE，充分利用AI辅助编程功能
- 通过与Claude 3.7的对话直接生成代码，无需手动编写
- 采用流畅的开发工作流，减少上下文切换
- 专注于创意实现而非样板代码编写
- 直觉驱动的开发过程，让编码更具表现力和效率

## 系统架构

系统由以下几个主要代理组成：

1. **协调者(Coordinator)**: 管理整个研究流程，决定下一步行动
2. **规划者(Planner)**: 分析研究问题，制定详细的研究计划
3. **研究员(Researcher)**: 执行搜索查询，提取和分析信息
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
│   └── index.ts              # 入口文件
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
```

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

# 其他模型配置
GPT_MODEL_NAME=gpt-4-0125-preview
TEMPERATURE=0.2
```

## LLM提供商集成

### DeepSeek集成

系统可以配置研究员代理使用DeepSeek模型，因为它擅长处理和分析信息。你可以在`src/config/index.ts`中的`WORKFLOW_CONFIG`修改这些设置：

```typescript
providerConfig: {
  coordinator: 'openai',  // 协调者使用OpenAI
  planner: 'openai',      // 规划者使用OpenAI
  researcher: 'deepseek', // 研究员使用DeepSeek
  writer: 'openai',       // 撰写者使用OpenAI
}
```

所有提供商API通过统一的接口进行调用，配置不同的baseURL和API Key即可。

## Vibe Coding工作流

本项目采用Vibe Coding工作流，完全通过AI交互创建，具体步骤如下：

1. 使用Cursor IDE创建项目结构
2. 通过与Claude 3.7的对话直接生成代码框架
3. 通过交互式对话，迭代优化功能
4. 使用AI辅助进行重构和测试
5. 保持简洁高效的代码风格和项目结构

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

## 灵感来源

本项目受到字节跳动的[DeerFlow](https://github.com/bytedance/deer-flow)项目启发，DeerFlow是一个社区驱动的深度研究框架，将语言模型与网页搜索、爬取和Python执行等工具相结合，并将成果回馈开源社区。

## 许可证

MIT 