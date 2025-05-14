import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseMessage } from '@langchain/core/messages';
import { ToolDefinition } from 'langchain/tools';

/**
 * 代理基本结构接口
 */
export interface AgentInterface {
  name: string;
  description: string;
  systemPrompt: string;
  execute(state: WorkflowState): Promise<WorkflowState>;
}

/**
 * 工具接口
 */
export interface ToolInterface {
  name: string;
  description: string;
  func: (...args: any[]) => Promise<any>;
}

/**
 * 研究任务接口
 */
export interface ResearchTask {
  id: string;
  query: string;
  depth: number;
  breadth: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
}

/**
 * 研究步骤接口
 */
export interface ResearchStep {
  id: string;
  taskId: string;
  type: 'search' | 'process' | 'generate' | 'follow_up';
  input: string;
  output: string;
  createdAt: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

/**
 * 搜索结果接口
 */
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
  relevance?: number;
}

/**
 * LLM提供商类型
 */
export type LLMProvider = 'openai' | 'deepseek';

/**
 * 工作流状态接口
 */
export interface WorkflowState {
  taskId: string;
  query: string;
  depth: number;
  breadth: number;
  currentDepth: number;
  remainingDepth: number;
  searchQueries: string[];
  searchResults: SearchResult[];
  processedResults: {
    learnings: string[];
    followUpQuestions: string[];
  };
  insights: string[];
  nextDirections: string[];
  finalReport?: string;
  messages: BaseMessage[];
  error?: string;
  decision?: string;
  decisionReasoning?: string;
  nextAction?: string;
  plan?: any;
  createdAt?: Date;
}

/**
 * 代理配置接口
 */
export interface AgentConfig {
  name: string;
  description: string;
  modelName: string;
  temperature: number;
  systemPrompt: string;
  promptTemplate: ChatPromptTemplate;
  tools: ToolDefinition[];
  llmProvider?: LLMProvider;
}

/**
 * 工作流配置接口
 */
export interface WorkflowConfig {
  maxDepth: number;
  defaultBreadth: number;
  useLocalModel: boolean;
  modelConfig: {
    coordinator: string;
    planner: string;
    researcher: string;
    writer: string;
  };
  providerConfig: {
    coordinator: LLMProvider;
    planner: LLMProvider;
    researcher: LLMProvider;
    writer: LLMProvider;
  };
  searchEngine: 'tavily' | 'bing' | 'google' | 'duckduckgo';
}

/**
 * 搜索引擎配置接口
 */
export interface SearchEngineConfig {
  type: 'tavily' | 'bing' | 'google' | 'duckduckgo';
  apiKey: string;
  maxResults: number;
}

/**
 * 数据库服务接口
 */
export interface DatabaseService {
  saveTask(task: ResearchTask): Promise<ResearchTask>;
  getTask(id: string): Promise<ResearchTask | null>;
  updateTask(id: string, updates: Partial<ResearchTask>): Promise<ResearchTask>;
  saveStep(step: ResearchStep): Promise<ResearchStep>;
  getStepsByTaskId(taskId: string): Promise<ResearchStep[]>;
}

/**
 * 内容提取选项接口
 */
export interface ScrapingOptions {
  includeLinks: boolean;
  includeImages: boolean;
  timeout: number;
} 