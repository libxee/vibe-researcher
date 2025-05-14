import dotenv from 'dotenv';
import path from 'path';
import { WorkflowConfig, SearchEngineConfig } from '../interfaces';

// 加载.env文件
dotenv.config();

/**
 * 服务器配置
 */
export const SERVER_CONFIG = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
};

/**
 * 数据库配置
 */
export const DB_CONFIG = {
  path: process.env.DB_PATH || path.join(process.cwd(), 'database.sqlite'),
};

/**
 * LLM模型配置
 */
export const LLM_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY || '',
  defaultModel: process.env.MODEL_NAME || 'gpt-4-0125-preview',
  temperature: process.env.TEMPERATURE ? parseFloat(process.env.TEMPERATURE) : 0.2,
};

/**
 * DeepSeek模型配置
 */
export const DEEPSEEK_CONFIG = {
  apiKey: process.env.DEEPSEEK_API_KEY || '',
  baseUrl: process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com',
  defaultModel: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
};

/**
 * LangChain配置
 */
export const LANGCHAIN_CONFIG = {
  tracing: process.env.LANGCHAIN_TRACING === 'true',
  project: process.env.LANGCHAIN_PROJECT || 'multi-agent-research',
  endpoint: process.env.LANGCHAIN_ENDPOINT || 'https://api.smith.langchain.com',
  apiKey: process.env.LANGCHAIN_API_KEY || '',
};

/**
 * 搜索引擎配置
 */
export const SEARCH_CONFIG: SearchEngineConfig = {
  type: (process.env.SEARCH_API_TYPE as 'tavily' | 'bing' | 'google' | 'duckduckgo') || 'tavily',
  apiKey: process.env.SEARCH_API_KEY || '',
  maxResults: 10,
};

/**
 * 内容提取配置
 */
export const SCRAPING_CONFIG = {
  timeout: process.env.SCRAPING_TIMEOUT ? parseInt(process.env.SCRAPING_TIMEOUT) : 30000,
  includeLinks: true,
  includeImages: true,
};

/**
 * 工作流配置
 */
export const WORKFLOW_CONFIG: WorkflowConfig = {
  maxDepth: 3,
  defaultBreadth: 4,
  useLocalModel: false,
  modelConfig: {
    coordinator: DEEPSEEK_CONFIG.defaultModel,
    planner: DEEPSEEK_CONFIG.defaultModel,
    researcher: DEEPSEEK_CONFIG.defaultModel,
    writer: DEEPSEEK_CONFIG.defaultModel,
  },
  providerConfig: {
    coordinator: 'deepseek',
    planner: 'deepseek',
    researcher: 'deepseek',
    writer: 'deepseek',
  },
  searchEngine: (process.env.SEARCH_API_TYPE as 'tavily' | 'bing' | 'google' | 'duckduckgo') || 'tavily',
}; 