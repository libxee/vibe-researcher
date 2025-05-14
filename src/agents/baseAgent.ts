import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentInterface, WorkflowState, LLMProvider } from '../interfaces';
import { LLM_CONFIG, DEEPSEEK_CONFIG } from '../config';

/**
 * 基础代理类
 */
export abstract class BaseAgent implements AgentInterface {
  name: string;
  description: string;
  systemPrompt: string;
  model: ChatOpenAI;
  promptTemplate: ChatPromptTemplate;
  llmProvider: LLMProvider;

  constructor(
    name: string,
    description: string,
    systemPrompt: string,
    modelName: string = LLM_CONFIG.defaultModel,
    temperature: number = LLM_CONFIG.temperature,
    llmProvider: LLMProvider = 'openai'
  ) {
    this.name = name;
    this.description = description;
    this.systemPrompt = systemPrompt;
    this.llmProvider = llmProvider;
    
    // 根据提供商选择不同的配置
    if (llmProvider === 'deepseek') {
      // DeepSeek API和OpenAI兼容，使用ChatOpenAI但配置不同的baseURL
      this.model = new ChatOpenAI({
        modelName: DEEPSEEK_CONFIG.defaultModel,
        temperature,
        openAIApiKey: DEEPSEEK_CONFIG.apiKey,
        configuration: {
          baseURL: DEEPSEEK_CONFIG.baseUrl,
        }
      });
    } else {
      this.model = new ChatOpenAI({
        modelName,
        temperature,
        openAIApiKey: LLM_CONFIG.apiKey,
      });
    }
    
    this.promptTemplate = ChatPromptTemplate.fromMessages([
      ['system', this.systemPrompt],
      ['human', '{input}'],
    ]);
  }

  /**
   * 生成提示信息
   */
  protected async generatePrompt(state: WorkflowState): Promise<string> {
    return JSON.stringify(state);
  }

  /**
   * 解析LLM响应
   */
  protected async parseResponse(response: string, state: WorkflowState): Promise<WorkflowState> {
    return {
      ...state,
      messages: [...state.messages, new HumanMessage(response)],
    };
  }

  /**
   * 打印彩色详细信息
   */
  protected printVerbose(title: string, content: any): void {
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
    };
    
    console.log(`\n${colors.bright}${colors.cyan}[${this.name}] ${title}${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
    
    if (typeof content === 'object') {
      // 处理对象内容，展示更多详细信息
      if (content instanceof Array) {
        // 如果是数组，则逐项打印
        content.forEach((item, index) => {
          console.log(`${colors.yellow}[${index}]${colors.reset}`);
          console.log(typeof item === 'object' ? JSON.stringify(item, null, 2) : item);
        });
      } else {
        // 对象内容的详细输出，自定义格式
        try {
          const formattedJson = JSON.stringify(content, null, 2);
          console.log(formattedJson);
        } catch (error) {
          console.log(content);
        }
      }
    } else if (typeof content === 'string') {
      // 对长文本进行分段处理，使之更易读
      const maxLineLength = 100;
      const lines = content.split('\n');
      
      lines.forEach(line => {
        // 为长行添加换行以提高可读性
        if (line.length > maxLineLength) {
          for (let i = 0; i < line.length; i += maxLineLength) {
            console.log(line.substring(i, i + maxLineLength));
          }
        } else {
          console.log(line);
        }
      });
    } else {
      console.log(content);
    }
    
    console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}\n`);
  }

  /**
   * 记录状态变化
   */
  protected logStateChanges(prevState: WorkflowState, newState: WorkflowState): void {
    const colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      yellow: '\x1b[33m',
      green: '\x1b[32m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      red: '\x1b[31m',
    };

    console.log(`\n${colors.bright}${colors.magenta}[${this.name}] 状态变化${colors.reset}`);
    console.log(`${colors.magenta}${'='.repeat(50)}${colors.reset}`);
    
    // 检查并记录决策变化
    if (prevState.decision !== newState.decision) {
      console.log(`${colors.bright}决策:${colors.reset} ${prevState.decision || '无'} -> ${newState.decision || '无'}`);
    }
    
    // 检查并记录理由变化
    if (prevState.decisionReasoning !== newState.decisionReasoning) {
      console.log(`${colors.bright}决策理由:${colors.reset}`);
      console.log(newState.decisionReasoning || '无');
    }
    
    // 检查并记录搜索查询变化
    if (prevState.searchQueries?.length !== newState.searchQueries?.length) {
      console.log(`${colors.bright}搜索查询:${colors.reset} ${prevState.searchQueries?.length || 0} -> ${newState.searchQueries?.length || 0}个`);
      if (newState.searchQueries?.length) {
        newState.searchQueries.forEach((q, i) => {
          console.log(`  ${i+1}. ${q}`);
        });
      }
    }
    
    // 检查并记录研究发现变化
    const prevLearnings = prevState.processedResults?.learnings?.length || 0;
    const newLearnings = newState.processedResults?.learnings?.length || 0;
    if (prevLearnings !== newLearnings) {
      console.log(`${colors.bright}研究发现:${colors.reset} ${prevLearnings} -> ${newLearnings}个`);
      if (newLearnings > prevLearnings) {
        const newItems = newState.processedResults.learnings.slice(prevLearnings);
        newItems.forEach((item, i) => {
          console.log(`  ${i+1}. ${item}`);
        });
      }
    }
    
    // 检查并记录后续问题变化
    const prevQuestions = prevState.processedResults?.followUpQuestions?.length || 0;
    const newQuestions = newState.processedResults?.followUpQuestions?.length || 0;
    if (prevQuestions !== newQuestions) {
      console.log(`${colors.bright}后续问题:${colors.reset} ${prevQuestions} -> ${newQuestions}个`);
      if (newQuestions > prevQuestions) {
        const newItems = newState.processedResults.followUpQuestions.slice(prevQuestions);
        newItems.forEach((item, i) => {
          console.log(`  ${i+1}. ${item}`);
        });
      }
    }
    
    console.log(`${colors.magenta}${'='.repeat(50)}${colors.reset}\n`);
  }

  /**
   * 执行代理逻辑
   */
  async execute(state: WorkflowState): Promise<WorkflowState> {
    try {
      // 构建输入提示
      const prompt = await this.generatePrompt(state);
      
      // 打印详细的提示信息
      this.printVerbose("输入提示", prompt);
      
      // 添加系统提示和用户输入到状态消息中
      state.messages.push(new SystemMessage(this.systemPrompt));
      state.messages.push(new HumanMessage(prompt));
      
      // 获取LLM响应
      const response = await this.model.invoke(state.messages);
      
      // 打印详细的响应信息
      this.printVerbose("LLM响应", response.content);
      
      // 将响应添加到状态消息中
      state.messages.push(response);
      
      // 解析响应并更新状态
      const updatedState = await this.parseResponse(response.content as string, state);
      
      // 记录状态变化
      this.logStateChanges(state, updatedState);
      
      // 打印解析后的状态更新
      this.printVerbose("解析后的状态更新", {
        decision: updatedState.decision,
        decisionReasoning: updatedState.decisionReasoning,
        plan: updatedState.plan ? '已更新' : '无变化',
        searchQueries: updatedState.searchQueries?.length || 0,
        insights: updatedState.insights?.length || 0
      });
      
      return updatedState;
    } catch (error) {
      console.error(`Error in ${this.name} agent:`, error);
      return {
        ...state,
        error: `${this.name} agent failed: ${(error as Error).message}`,
      };
    }
  }
} 