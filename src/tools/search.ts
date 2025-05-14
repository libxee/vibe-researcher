import axios from 'axios';
import { SEARCH_CONFIG } from '../config';
import { SearchResult } from '../interfaces';
import { DynamicTool } from '@langchain/core/tools';

/**
 * Tavily搜索API工具
 */
export async function searchWithTavily(query: string): Promise<SearchResult[]> {
  try {
    const response = await axios.post(
      'https://api.tavily.com/search',
      {
        query,
        search_depth: 'advanced',
        include_domains: [],
        exclude_domains: [],
        max_results: SEARCH_CONFIG.maxResults,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SEARCH_CONFIG.apiKey}`,
        },
      }
    );

    return response.data.results.map((result: any) => ({
      title: result.title,
      url: result.url,
      snippet: result.content,
      relevance: result.score,
    }));
  } catch (error) {
    console.error('Error searching with Tavily:', error);
    throw new Error(`Tavily search failed: ${(error as Error).message}`);
  }
}

/**
 * DuckDuckGo搜索工具
 */
export async function searchWithDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    // 使用无API密钥的DDG API
    const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);

    return response.data.RelatedTopics.slice(0, SEARCH_CONFIG.maxResults).map((topic: any) => ({
      title: topic.Text?.split(' - ')[0] || 'No Title',
      url: topic.FirstURL || '',
      snippet: topic.Text || '',
    }));
  } catch (error) {
    console.error('Error searching with DuckDuckGo:', error);
    throw new Error(`DuckDuckGo search failed: ${(error as Error).message}`);
  }
}

/**
 * Bing搜索工具
 */
export async function searchWithBing(query: string): Promise<SearchResult[]> {
  try {
    const response = await axios.get(
      `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${SEARCH_CONFIG.maxResults}`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': SEARCH_CONFIG.apiKey,
        },
      }
    );

    return response.data.webPages.value.map((result: any) => ({
      title: result.name,
      url: result.url,
      snippet: result.snippet,
    }));
  } catch (error) {
    console.error('Error searching with Bing:', error);
    throw new Error(`Bing search failed: ${(error as Error).message}`);
  }
}

/**
 * Google搜索工具（使用自定义搜索引擎）
 */
export async function searchWithGoogle(query: string): Promise<SearchResult[]> {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1?key=${
        SEARCH_CONFIG.apiKey
      }&cx=YOUR_CUSTOM_SEARCH_ENGINE_ID&q=${encodeURIComponent(query)}`
    );

    return response.data.items.map((item: any) => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet,
    }));
  } catch (error) {
    console.error('Error searching with Google:', error);
    throw new Error(`Google search failed: ${(error as Error).message}`);
  }
}

/**
 * 统一搜索接口
 */
export async function search(query: string): Promise<SearchResult[]> {
  switch (SEARCH_CONFIG.type) {
    case 'tavily':
      return searchWithTavily(query);
    case 'bing':
      return searchWithBing(query);
    case 'google':
      return searchWithGoogle(query);
    case 'duckduckgo':
      return searchWithDuckDuckGo(query);
    default:
      return searchWithTavily(query);
  }
}

/**
 * LangChain搜索工具
 */
export const searchTool = new DynamicTool({
  name: 'web_search',
  description: '搜索网络以查找有关特定查询的信息。输入应该是一个搜索查询。',
  func: async (query: string) => {
    try {
      const results = await search(query);
      return JSON.stringify(results, null, 2);
    } catch (error) {
      return `搜索失败: ${(error as Error).message}`;
    }
  },
}); 