import { OpenAI } from 'openai';
import { DEEPSEEK_CONFIG, LLM_CONFIG } from '../config';
import { LLMProvider } from '../interfaces';

/**
 * OpenAI客户端
 */
export const openaiClient = new OpenAI({
  apiKey: LLM_CONFIG.apiKey,
});

/**
 * DeepSeek客户端（使用OpenAI SDK）
 */
export const deepseekClient = new OpenAI({
  apiKey: DEEPSEEK_CONFIG.apiKey,
  baseURL: DEEPSEEK_CONFIG.baseUrl,
});

/**
 * 获取指定提供商的LLM客户端
 */
export function getLLMClient(provider: LLMProvider = 'openai') {
  switch (provider) {
    case 'deepseek':
      return deepseekClient;
    case 'openai':
    default:
      return openaiClient;
  }
}

/**
 * 根据提供商获取适当的模型名称
 */
export function getModelName(provider: LLMProvider, defaultModel?: string): string {
  switch (provider) {
    case 'deepseek':
      return DEEPSEEK_CONFIG.defaultModel;
    case 'openai':
    default:
      return defaultModel || LLM_CONFIG.defaultModel;
  }
} 