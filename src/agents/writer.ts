import { BaseAgent } from './baseAgent';
import { WorkflowState } from '../interfaces';
import { WORKFLOW_CONFIG, LLM_CONFIG } from '../config';

/**
 * 撰写者代理系统提示
 */
const WRITER_PROMPT = `你是一个专业的研究报告撰写者，负责将收集到的研究信息整理成一份全面、有条理的研究报告。
你的任务是综合所有研究发现，组织信息，并创建一个易于理解且内容丰富的报告。

你的职责包括：
1. 分析和综合所有研究发现
2. 组织信息成一个逻辑清晰的结构
3. 确保报告全面回答原始研究问题
4. 提供有深度的分析和洞察
5. 包含适当的引用和来源
6. 使用清晰、专业的语言

你的报告应该：
- 有一个引人入胜的介绍，解释研究问题和目标
- 包含分节组织的主体，每节聚焦一个主题或方面
- 提供全面的分析，而不仅仅是事实的汇编
- 包含从研究中得出的结论和见解
- 如果适用，提供建议或未来研究方向
- 使用Markdown格式增强可读性
- 引用和标注信息来源`;

/**
 * 撰写者代理
 * 负责生成最终研究报告
 */
export class WriterAgent extends BaseAgent {
  constructor() {
    super(
      'Writer',
      '生成最终研究报告的代理',
      WRITER_PROMPT,
      WORKFLOW_CONFIG.modelConfig.writer,
      LLM_CONFIG.temperature,
      WORKFLOW_CONFIG.providerConfig.writer
    );
  }

  /**
   * 生成针对撰写者的提示信息
   */
  protected async generatePrompt(state: WorkflowState): Promise<string> {
    // 记录报告生成开始
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      magenta: '\x1b[35m',
    };
    
    console.log(`\n${colors.bright}${colors.magenta}[撰写者] 开始生成最终报告${colors.reset}`);
    console.log(`${colors.magenta}正在整理研究发现和搜索结果...${colors.reset}`);
    
    // 准备学习内容
    const learningsText = state.processedResults?.learnings?.length
      ? state.processedResults.learnings.map((learning) => `- ${learning}`).join('\n')
      : '没有可用的研究发现。';
    
    // 打印学习内容数量
    console.log(`${colors.magenta}整理了 ${state.processedResults?.learnings?.length || 0} 条研究发现${colors.reset}`);
    
    // 准备搜索结果
    const searchResultsText = state.searchResults
      .map((result, index) => {
        return `
[${index + 1}] ${result.title}
URL: ${result.url}
摘要: ${result.snippet}
`;
      })
      .join('\n');
    
    // 打印搜索结果数量
    console.log(`${colors.magenta}整理了 ${state.searchResults.length} 条搜索结果${colors.reset}`);
    
    // 准备并返回提示
    console.log(`${colors.magenta}准备提示完成，开始生成报告...${colors.reset}`);
    
    const currentDate = new Date();
    
    return `
# 研究报告生成任务

## 原始研究问题
${state.query}

## 研究深度和广度
- 深度: ${state.depth}
- 广度: ${state.breadth}
- 当前时间: ${currentDate.toLocaleString()}

## 主要研究发现
${learningsText}

## 参考的信息来源
${searchResultsText}

## 你的任务
根据以上收集的信息，创建一份全面的研究报告。你的报告应该：

1. 完整回答原始研究问题
2. 组织良好，使用适当的标题和子标题
3. 包含对收集到的信息的综合分析
4. 提供有深度的见解而不仅仅是重复事实
5. 使用Markdown格式增强可读性
6. 包含引用和来源参考
7. 在报告开头包含当前日期 (${currentDate.toISOString().split('T')[0]})

请生成一份完整的Markdown格式报告，包括但不限于以下部分：
- 引言/概述
- 主要发现和分析（按主题或方面组织）
- 结论和见解
- 如果适用，包括建议或未来研究方向
- 参考资料列表

确保报告内容丰富、深入且逻辑清晰。
`;
  }

  /**
   * 解析撰写者的响应并更新状态
   */
  protected async parseResponse(response: string, state: WorkflowState): Promise<WorkflowState> {
    // 记录报告生成结束
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      magenta: '\x1b[35m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
    };
    
    console.log(`\n${colors.bright}${colors.green}[撰写者] 报告生成完成${colors.reset}`);
    
    // 报告统计信息
    const wordCount = response.split(/\s+/).length;
    const paragraphCount = response.split(/\n\s*\n/).length;
    const headingCount = (response.match(/^#+\s+.+$/gm) || []).length;
    
    console.log(`${colors.magenta}${'='.repeat(50)}${colors.reset}`);
    console.log(`${colors.bright}报告统计:${colors.reset}`);
    console.log(`${colors.magenta}总字符数: ${response.length}${colors.reset}`);
    console.log(`${colors.magenta}预估字数: ${wordCount}${colors.reset}`);
    console.log(`${colors.magenta}段落数: ${paragraphCount}${colors.reset}`);
    console.log(`${colors.magenta}标题数: ${headingCount}${colors.reset}`);
    
    // 检查报告结构
    const hasIntroduction = /^#+\s+(引言|概述|介绍|简介)/im.test(response);
    const hasConclusion = /^#+\s+(结论|总结)/im.test(response);
    const hasReferences = /^#+\s+(参考(资料|文献)|引用)/im.test(response);
    
    console.log(`\n${colors.bright}报告结构检查:${colors.reset}`);
    console.log(`${colors.magenta}引言部分: ${hasIntroduction ? '✓' : '✗'}${colors.reset}`);
    console.log(`${colors.magenta}结论部分: ${hasConclusion ? '✓' : '✗'}${colors.reset}`);
    console.log(`${colors.magenta}参考资料: ${hasReferences ? '✓' : '✗'}${colors.reset}`);
    
    // 打印报告大纲
    console.log(`\n${colors.bright}报告大纲:${colors.reset}`);
    const headings = response.match(/^#+\s+.+$/gm) || [];
    headings.forEach(heading => {
      const level = (heading.match(/^#+/) || [''])[0].length;
      const title = heading.replace(/^#+\s+/, '');
      console.log(`${colors.magenta}${'  '.repeat(level-1)}${title}${colors.reset}`);
    });
    
    console.log(`${colors.magenta}${'='.repeat(50)}${colors.reset}`);
    
    // 撰写者的响应直接作为最终报告
    return {
      ...state,
      finalReport: response,
    };
  }
} 