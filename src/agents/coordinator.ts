import { BaseAgent } from './baseAgent';
import { WorkflowState } from '../interfaces';
import { WORKFLOW_CONFIG } from '../config';
import { LLM_CONFIG } from '../config';

/**
 * 协调者代理系统提示
 */
const COORDINATOR_PROMPT = `你是一个研究协调者，负责管理整个深度研究流程。
你需要分析用户查询，确定研究范围，并协调整个研究过程。

你的职责：
1. 理解用户的研究问题并明确研究目标
2. 决定何时需要进一步研究，何时研究已经完成
3. 协调各个专业代理的工作，包括规划者、研究员和撰写者
4. 确保最终报告全面回答了用户的问题

目前的工作流程：
1. 协调者（你）：理解问题，控制整体流程
2. 规划者：制定详细研究计划
3. 研究员：执行搜索并收集信息
4. 撰写者：汇总研究结果并生成报告

每当收到状态更新时，你需要决定接下来要执行的步骤。
你的决定应该基于当前的研究深度、已收集的信息和研究目标。`;

/**
 * 协调者代理
 * 负责整体工作流程控制和决策
 */
export class CoordinatorAgent extends BaseAgent {
  constructor() {
    super(
      'Coordinator',
      '协调整个研究流程的代理',
      COORDINATOR_PROMPT,
      WORKFLOW_CONFIG.modelConfig.coordinator,
      LLM_CONFIG.temperature,
      WORKFLOW_CONFIG.providerConfig.coordinator
    );
  }

  /**
   * 生成针对协调者的提示信息
   */
  protected async generatePrompt(state: WorkflowState): Promise<string> {
    const currentDate = new Date();
    return `
# 研究任务状态

## 任务信息
- 查询: ${state.query}
- 当前深度: ${state.currentDepth}
- 剩余深度: ${state.remainingDepth}
- 研究广度: ${state.breadth}
- 当前时间: ${currentDate.toLocaleString()}

## 当前进度
${
  state.processedResults?.learnings?.length
    ? `
### 已获取的见解
${state.processedResults.learnings.map((learning) => `- ${learning}`).join('\n')}

### 后续问题
${state.processedResults.followUpQuestions.map((question) => `- ${question}`).join('\n')}
`
    : '尚未收集任何研究结果。'
}

## 你的决定
请评估当前研究进度，并决定接下来的步骤：
1. 如果这是初始查询，应启动规划阶段以创建研究计划
2. 如果需要收集信息，应启动研究阶段
3. 如果已经收集了足够的信息或达到了最大深度，应启动撰写阶段生成最终报告
4. 如果有明确的后续问题需要探索且还有剩余深度，应开始新一轮的深度研究

返回格式为JSON：
{
  "decision": "plan|research|report|continue",
  "reasoning": "你的决策理由...",
  "nextAction": "详细说明下一步行动..."
}
`;
  }

  /**
   * 解析协调者的响应并更新状态
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
      
      return {
        ...state,
        decision: parsed.decision,
        decisionReasoning: parsed.reasoning,
        nextAction: parsed.nextAction,
      };
    } catch (error) {
      console.error('Error parsing coordinator response:', error);
      
      // 如果解析失败，回退到基本状态更新
      return super.parseResponse(response, state);
    }
  }
} 