import { BaseAgent } from './baseAgent';
import { WorkflowState, SearchResult } from '../interfaces';
import { WORKFLOW_CONFIG, LLM_CONFIG } from '../config';
import { search } from '../tools/search';
import { scrapeUrl } from '../tools/scraping';

/**
 * 研究员代理系统提示
 */
const RESEARCHER_PROMPT = `你是一个专业的研究员，负责执行搜索查询并处理搜索结果。
你的任务是从搜索结果中提取重要信息，总结关键发现，并提出后续研究的方向。

你的职责包括：
1. 执行搜索查询以获取相关信息
2. 分析搜索结果，确定最相关的内容
3. 从高价值的来源中提取关键信息
4. 记录重要的发现和见解
5. 识别信息缺口并提出后续问题
6. 提供客观、全面的信息，避免偏见

处理搜索结果时，你应该：
- 关注与研究问题直接相关的内容
- 区分事实、观点和推测
- 注意信息的时效性和可靠性
- 找出不同来源之间的共识和分歧
- 识别需要更深入探索的领域`;

/**
 * 研究员代理
 * 负责执行搜索并处理结果
 */
export class ResearcherAgent extends BaseAgent {
  constructor() {
    super(
      'Researcher',
      '执行搜索和处理结果的代理',
      RESEARCHER_PROMPT,
      WORKFLOW_CONFIG.modelConfig.researcher,
      LLM_CONFIG.temperature,
      WORKFLOW_CONFIG.providerConfig.researcher // 使用DeepSeek作为研究员LLM
    );
  }

  /**
   * 打印详细的搜索统计信息
   */
  private printSearchStats(query: string, results: SearchResult[]): void {
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
    
    console.log(`\n${colors.bright}${colors.blue}[研究员] 搜索查询统计 "${query}"${colors.reset}`);
    console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
    
    console.log(`${colors.bright}总结果数:${colors.reset} ${results.length}`);
    
    // 按来源域名统计
    const domainStats: {[key: string]: number} = {};
    results.forEach(result => {
      try {
        const url = new URL(result.url);
        const domain = url.hostname;
        domainStats[domain] = (domainStats[domain] || 0) + 1;
      } catch (e) {
        // 忽略无效URL
      }
    });
    
    // 打印来源统计
    console.log(`\n${colors.bright}来源统计:${colors.reset}`);
    Object.entries(domainStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([domain, count]) => {
        console.log(`  ${domain}: ${count}个结果`);
      });
    
    // 打印结果类型分布
    console.log(`\n${colors.bright}结果预览:${colors.reset}`);
    results.slice(0, 5).forEach((result, i) => {
      console.log(`  ${i+1}. ${colors.green}${result.title}${colors.reset}`);
      console.log(`     ${colors.dim}${result.url}${colors.reset}`);
      console.log(`     相关度: ${result.relevance || 'N/A'}`);
    });
    
    console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}\n`);
  }

  /**
   * 打印内容抓取进度
   */
  private printScrapingProgress(current: number, total: number, result: SearchResult, contentLength: number): void {
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
    
    // 清除上一行 - 适用于终端环境
    process.stdout.write('\r\x1B[K');
    
    // 构建进度条
    const progressBarWidth = 30;
    const progress = Math.round((current / total) * progressBarWidth);
    const progressBar = '█'.repeat(progress) + '▒'.repeat(progressBarWidth - progress);
    
    // 打印进度信息
    process.stdout.write(
      `${colors.bright}${colors.magenta}[研究员]${colors.reset} 抓取进度 ${colors.yellow}[${progressBar}]${colors.reset} ${current}/${total} - ${contentLength} 字符 ${colors.dim}${result.url.substring(0, 30)}...${colors.reset}`
    );
  }

  /**
   * 执行搜索查询并获取结果
   */
  private async executeSearchQueries(queries: string[]): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    console.log(`\n${'-'.repeat(50)}`);
    console.log(`\x1b[1m\x1b[36m[研究员] 开始执行 ${queries.length} 个搜索查询\x1b[0m`);
    
    for (const query of queries) {
      try {
        const startTime = Date.now();
        console.log(`\n${'-'.repeat(50)}`);
        console.log(`\x1b[1m\x1b[36m[研究员] 执行搜索查询: "${query}"\x1b[0m`);
        const searchResults = await search(query);
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log(`\x1b[36m✓ 找到 ${searchResults.length} 条搜索结果 (耗时: ${duration}秒)\x1b[0m`);
        
        // 打印搜索结果的标题和URL
        searchResults.forEach((result, index) => {
          console.log(`\x1b[36m${index + 1}. ${result.title}\x1b[0m`);
          console.log(`   URL: ${result.url}`);
        });
        
        // 打印详细的搜索统计
        this.printSearchStats(query, searchResults);
        
        results.push(...searchResults);
      } catch (error) {
        console.error(`\x1b[31m[研究员] 搜索查询失败: "${query}"\x1b[0m`, error);
      }
    }
    
    // 打印汇总信息
    console.log(`\n${'-'.repeat(50)}`);
    console.log(`\x1b[1m\x1b[36m[研究员] 搜索查询完成，共收集 ${results.length} 条结果\x1b[0m`);
    
    // 按相关性排序并去重
    return this.filterAndRankResults(results);
  }

  /**
   * 过滤和排序搜索结果
   */
  private filterAndRankResults(results: SearchResult[]): SearchResult[] {
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      yellow: '\x1b[33m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
    };
    
    console.log(`\n${colors.bright}${colors.cyan}[研究员] 过滤和排序搜索结果${colors.reset}`);
    console.log(`${colors.cyan}开始处理 ${results.length} 条原始结果...${colors.reset}`);
    
    // 去除重复的URL
    const uniqueResults = results.filter(
      (result, index, self) => index === self.findIndex((r) => r.url === result.url)
    );
    
    console.log(`${colors.cyan}去重后剩余 ${uniqueResults.length} 条结果${colors.reset}`);
    
    // 按相关性排序
    const sortedResults = uniqueResults
      .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
      .slice(0, 10); // 保留前10个最相关的结果
    
    console.log(`${colors.cyan}按相关性排序并保留前 10 条最相关结果${colors.reset}`);
    sortedResults.forEach((result, index) => {
      console.log(`${colors.green}${index + 1}. ${result.title} ${colors.reset}(相关度: ${result.relevance || 'N/A'})`);
      console.log(`   ${result.url}`);
    });
    
    return sortedResults;
  }

  /**
   * 获取页面内容
   */
  private async getContentFromUrls(results: SearchResult[]): Promise<SearchResult[]> {
    const resultsWithContent = [...results];
    
    console.log(`\n${'-'.repeat(50)}`);
    console.log(`\x1b[1m\x1b[36m[研究员] 开始获取页面详细内容 (共${results.length}个页面)\x1b[0m`);
    
    // 跟踪成功和失败的数量
    let successCount = 0;
    let failCount = 0;
    let totalCharacters = 0;
    
    for (let i = 0; i < resultsWithContent.length; i++) {
      const result = resultsWithContent[i];
      
      if (!result.content) {
        try {
          const startTime = Date.now();
          console.log(`\x1b[36m[${i+1}/${results.length}] 获取页面内容: ${result.url}\x1b[0m`);
          const content = await scrapeUrl(result.url);
          const endTime = Date.now();
          const duration = ((endTime - startTime) / 1000).toFixed(2);
          
          resultsWithContent[i] = { ...result, content };
          
          // 更新统计数据
          successCount++;
          totalCharacters += content.length;
          
          // 打印内容长度和耗时
          console.log(`\x1b[36m✓ 获取内容成功，共${content.length}字符 (耗时: ${duration}秒)\x1b[0m`);
          
          // 打印抓取进度
          this.printScrapingProgress(i+1, results.length, result, content.length);
          
          // 打印内容预览
          const preview = content.substring(0, 200).replace(/\n/g, ' ');
          console.log(`\x1b[36m  预览: ${preview}...\x1b[0m`);
        } catch (error) {
          failCount++;
          console.error(`\x1b[31m✗ 获取页面内容失败: ${result.url}\x1b[0m`, error);
        }
      }
    }
    
    // 打印总结信息
    console.log(`\n${'-'.repeat(50)}`);
    console.log(`\x1b[1m\x1b[36m[研究员] 页面内容获取完成\x1b[0m`);
    console.log(`\x1b[36m总计: ${results.length} 个页面\x1b[0m`);
    console.log(`\x1b[36m成功: ${successCount} 个页面\x1b[0m`);
    console.log(`\x1b[36m失败: ${failCount} 个页面\x1b[0m`);
    console.log(`\x1b[36m总字符数: ${totalCharacters} 字符\x1b[0m`);
    console.log(`\x1b[36m平均每页字符数: ${Math.round(totalCharacters / successCount)} 字符\x1b[0m`);
    
    return resultsWithContent;
  }

  /**
   * 执行研究过程
   */
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      // 打印研究任务信息
      this.printVerbose("开始执行研究任务", {
        query: state.query,
        currentDepth: state.currentDepth,
        searchQueries: state.searchQueries,
      });
      
      // 第1步：执行搜索查询
      const searchResults = await this.executeSearchQueries(state.searchQueries);
      
      // 第2步：获取页面内容
      const resultsWithContent = await this.getContentFromUrls(searchResults);
      
      // 第3步：更新状态
      const updatedState = {
        ...state,
        searchResults: resultsWithContent,
      };
      
      // 第4步：使用LLM处理结果
      console.log(`\n${'-'.repeat(50)}`);
      console.log(`\x1b[1m\x1b[36m[研究员] 使用 ${this.llmProvider} (${WORKFLOW_CONFIG.modelConfig.researcher}) 模型处理研究结果\x1b[0m`);
      return super.execute(updatedState);
    } catch (error) {
      console.error('Research process failed:', error);
      return {
        ...state,
        error: `Research process failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 生成针对研究员的提示信息
   */
  protected async generatePrompt(state: WorkflowState): Promise<string> {
    const searchResultsText = state.searchResults
      .map((result, index) => {
        return `
### 结果 ${index + 1}: ${result.title}
- URL: ${result.url}
- 摘要: ${result.snippet}
${
  result.content
    ? `
- 内容:
\`\`\`
${result.content.substring(0, 2000)}${result.content.length > 2000 ? '...(内容已截断)' : ''}
\`\`\`
`
    : ''
}`;
      })
      .join('\n');

    const currentDate = new Date();

    return `
# 研究任务

## 研究问题
${state.query}

## 基本信息
- 当前时间: ${currentDate.toLocaleString()}
- 当前深度: ${state.currentDepth}/${state.depth}

## 搜索查询
${state.searchQueries.map((q) => `- ${q}`).join('\n')}

## 搜索结果
${searchResultsText}

## 你的任务
分析以上搜索结果，提取关键信息，并以JSON格式返回以下内容：

1. 主要发现：列出从搜索结果中获取的关键事实和见解
2. 信息缺口：确定尚未找到答案的问题或领域
3. 后续研究方向：建议进一步研究的方向或问题

请以以下格式返回：

{
  "learnings": [
    "关键发现1",
    "关键发现2",
    ...
  ],
  "followUpQuestions": [
    "后续问题1",
    "后续问题2",
    ...
  ]
}

确保你的分析全面、客观，基于搜索结果中的实际信息。
`;
  }

  /**
   * 解析研究者的响应
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
      
      // 确保所有数组字段都存在
      const insights = parsed.insights || [];
      const nextDirections = parsed.nextDirections || [];
      const learnings = parsed.learnings || [];
      const followUpQuestions = parsed.followUpQuestions || [];
      const decision = parsed.decision || 'continue';
      const reasoning = parsed.reasoning || '继续深入研究';
      
      // 打印解析结果
      this.printVerbose("研究发现", learnings);
      this.printVerbose("后续问题", followUpQuestions);
      
      // 将研究结果添加到状态中
      return {
        ...state,
        processedResults: {
          ...state.processedResults,
          learnings: [...state.processedResults.learnings, ...learnings],
          followUpQuestions: [
            ...state.processedResults.followUpQuestions,
            ...followUpQuestions,
          ],
        },
        insights: [...state.insights, ...insights],
        nextDirections: [...state.nextDirections, ...nextDirections],
        decision: decision,
        decisionReasoning: reasoning,
      };
    } catch (error) {
      console.error('Error parsing researcher response:', error);
      
      // 返回带有错误的状态
      return {
        ...state,
        error: `Error parsing researcher response: ${(error as Error).message}`,
      };
    }
  }
} 