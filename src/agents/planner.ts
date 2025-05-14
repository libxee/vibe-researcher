import { BaseAgent } from './baseAgent';
import { WorkflowState } from '../interfaces';
import { WORKFLOW_CONFIG, LLM_CONFIG } from '../config';

/**
 * 规划者代理系统提示
 */
const PLANNER_PROMPT = `你是一个专业的研究规划者，负责为深度研究项目制定详细的计划。
你的主要职责是分析研究问题，将其分解为可管理的部分，并确定需要回答的关键问题。

你的任务：
1. 分析用户的研究问题，确定核心研究目标和范围
2. 将复杂问题分解为更小、更具体的子问题
3. 确定需要优先回答的关键问题
4. 制定有效的搜索查询策略，以获取相关信息
5. 考虑研究的深度和广度参数，调整计划的复杂性

请确保你的研究计划：
- 全面覆盖研究问题的各个方面
- 包含具体的搜索查询，能够获取相关信息
- 考虑不同的观点和来源
- 避免过于宽泛或过于狭窄的搜索范围
- 适合指定的研究深度和广度要求`;

/**
 * 规划者代理
 * 负责制定研究计划和策略
 */
export class PlannerAgent extends BaseAgent {
  constructor() {
    super(
      'Planner',
      '制定研究计划和策略的代理',
      PLANNER_PROMPT,
      WORKFLOW_CONFIG.modelConfig.planner,
      LLM_CONFIG.temperature,
      WORKFLOW_CONFIG.providerConfig.planner
    );
  }

  /**
   * 生成针对规划者的提示信息
   */
  protected async generatePrompt(state: WorkflowState): Promise<string> {
    // 记录生成规划提示的开始
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      yellow: '\x1b[33m',
      cyan: '\x1b[36m',
    };
    
    console.log(`\n${colors.bright}${colors.cyan}[规划者] 生成研究计划提示${colors.reset}`);
    console.log(`${colors.cyan}研究问题: ${state.query}${colors.reset}`);
    console.log(`${colors.cyan}深度: ${state.depth}, 广度: ${state.breadth}${colors.reset}`);
    
    const currentDate = new Date();
    
    return `
# 研究任务

## 基本信息
- 研究问题: ${state.query}
- 研究深度: ${state.depth}
- 研究广度: ${state.breadth}
- 当前时间: ${currentDate.toLocaleString()}

## 你的任务
请为这个研究问题制定一个详细的研究计划，包括：

1. 分析研究问题的核心和范围
2. 将问题分解为${state.breadth}个子主题或关键问题
3. 为每个子主题创建具体的搜索查询（每个子主题${Math.min(
      3,
      state.breadth
    )}个查询）
4. 提供研究策略和重点关注的方面

## 返回格式
请以JSON格式返回你的计划：

{
  "analysis": "对研究问题的简要分析...",
  "subTopics": [
    {
      "title": "子主题1标题",
      "description": "对这个子主题的简要描述",
      "searchQueries": ["具体搜索查询1", "具体搜索查询2", "具体搜索查询3"]
    },
    // 其他子主题...
  ],
  "searchStrategy": "整体搜索策略的说明..."
}

确保生成的所有搜索查询都是具体的、有针对性的，能够返回高质量的相关信息。
`;
  }

  /**
   * 解析规划者的响应
   */
  protected async parseResponse(response: string, state: WorkflowState): Promise<WorkflowState> {
    try {
      // 尝试提取和清理JSON响应
      let jsonStr = response;
      
      // 处理可能包含在markdown代码块中的JSON
      const jsonBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonBlockMatch && jsonBlockMatch[1]) {
        jsonStr = jsonBlockMatch[1].trim();
      }
      
      // 解析JSON
      const parsed = JSON.parse(jsonStr);
      
      // 打印分析摘要
      this.printAnalysisSummary(parsed, state.query);
      
      // 打印详细的计划信息
      this.printDetailedPlan(parsed);
      
      // 提取计划和下一个决策 
      const allQueries = this.extractSearchQueries(parsed);
      
      // 打印查询统计信息
      this.printQueryStatistics(allQueries);
      
      return {
        ...state,
        searchQueries: allQueries,
        plan: parsed,
        decision: 'research',
      };
    } catch (error) {
      console.error('Error parsing planner response:', error);
      
      // 如果解析失败，回退到基本状态更新
      return super.parseResponse(response, state);
    }
  }
  
  /**
   * 提取搜索查询
   */
  private extractSearchQueries(plan: any): string[] {
    const allQueries: string[] = [];
    
    try {
      if (plan.subTopics && Array.isArray(plan.subTopics)) {
        plan.subTopics.forEach((topic: any) => {
          if (topic.searchQueries && Array.isArray(topic.searchQueries)) {
            allQueries.push(...topic.searchQueries);
          }
        });
      }
    } catch (error) {
      console.error('提取搜索查询时出错:', error);
    }
    
    return allQueries;
  }
  
  /**
   * 打印计划分析摘要
   */
  private printAnalysisSummary(plan: any, originalQuery: string): void {
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      yellow: '\x1b[33m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m', 
      red: '\x1b[31m',
      dim: '\x1b[2m',
    };
    
    console.log(`\n${colors.bright}${colors.blue}[规划者] 研究问题分析${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}`);
    
    // 打印原始查询
    console.log(`${colors.bright}原始查询:${colors.reset} ${originalQuery}`);
    
    // 打印分析
    if (plan.analysis) {
      console.log(`\n${colors.bright}问题分析:${colors.reset}`);
      console.log(plan.analysis);
    }
    
    // 统计子主题数量
    const topicCount = plan.subTopics?.length || 0;
    console.log(`\n${colors.bright}子主题数量:${colors.reset} ${topicCount}`);
    
    // 统计查询数量
    let queryCount = 0;
    if (plan.subTopics && Array.isArray(plan.subTopics)) {
      plan.subTopics.forEach((topic: any) => {
        if (topic.searchQueries && Array.isArray(topic.searchQueries)) {
          queryCount += topic.searchQueries.length;
        }
      });
    }
    console.log(`${colors.bright}总查询数量:${colors.reset} ${queryCount}`);
    
    console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}\n`);
  }
  
  /**
   * 打印查询统计信息
   */
  private printQueryStatistics(queries: string[]): void {
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      yellow: '\x1b[33m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      red: '\x1b[31m',
      dim: '\x1b[2m',
    };
    
    console.log(`\n${colors.bright}${colors.green}[规划者] 搜索查询统计${colors.reset}`);
    console.log(`${colors.green}${'='.repeat(80)}${colors.reset}`);
    
    console.log(`${colors.bright}查询总数:${colors.reset} ${queries.length}`);
    
    // 计算平均查询长度
    const totalLength = queries.reduce((sum, query) => sum + query.length, 0);
    const avgLength = totalLength / queries.length;
    console.log(`${colors.bright}平均查询长度:${colors.reset} ${Math.round(avgLength)} 字符`);
    
    // 最长和最短查询
    const shortestQuery = queries.reduce((min, q) => q.length < min.length ? q : min, queries[0] || '');
    const longestQuery = queries.reduce((max, q) => q.length > max.length ? q : max, queries[0] || '');
    
    console.log(`${colors.bright}最短查询:${colors.reset} "${shortestQuery}" (${shortestQuery.length} 字符)`);
    console.log(`${colors.bright}最长查询:${colors.reset} "${longestQuery}" (${longestQuery.length} 字符)`);
    
    // 查询词频分析
    const words = queries.join(' ').toLowerCase().split(/\s+/);
    const wordFrequency: {[key: string]: number} = {};
    
    words.forEach(word => {
      // 忽略太短的词或常见的停用词
      if (word.length <= 2 || ['the', 'and', 'for', 'how', 'what', 'why', 'is', 'are', 'to', 'in', 'on', 'of'].includes(word)) {
        return;
      }
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    // 打印最常见的词
    console.log(`\n${colors.bright}最常见的关键词:${colors.reset}`);
    Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([word, count]) => {
        console.log(`  "${word}": ${count}次`);
      });
    
    console.log(`${colors.green}${'='.repeat(80)}${colors.reset}\n`);
  }
  
  /**
   * 打印详细的计划信息
   */
  private printDetailedPlan(plan: any): void {
    // ANSI颜色代码
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      yellow: '\x1b[33m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      red: '\x1b[31m',
      dim: '\x1b[2m',
    };
    
    console.log(`\n${colors.bright}${colors.yellow}[规划者] 研究计划详情${colors.reset}`);
    console.log(`${colors.yellow}${'='.repeat(80)}${colors.reset}`);
    
    // 打印搜索策略
    if (plan.searchStrategy) {
      console.log(`${colors.bright}搜索策略:${colors.reset}`);
      console.log(plan.searchStrategy);
      console.log();
    }
    
    // 打印子主题和搜索查询
    if (plan.subTopics && Array.isArray(plan.subTopics)) {
      console.log(`${colors.bright}子主题与搜索查询:${colors.reset}`);
      
      plan.subTopics.forEach((topic: any, index: number) => {
        console.log(`${colors.yellow}${index + 1}. ${topic.title}${colors.reset}`);
        
        if (topic.description) {
          console.log(`   ${topic.description}`);
        }
        
        if (topic.searchQueries && Array.isArray(topic.searchQueries)) {
          console.log(`   ${colors.bright}搜索查询:${colors.reset}`);
          topic.searchQueries.forEach((query: string, qIndex: number) => {
            console.log(`     ${colors.green}${qIndex + 1}. "${query}"${colors.reset}`);
          });
        }
        
        console.log();
      });
    }
    
    console.log(`${colors.yellow}${'='.repeat(80)}${colors.reset}\n`);
  }
} 