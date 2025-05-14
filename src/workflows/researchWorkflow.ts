import { BaseMessage } from '@langchain/core/messages';
import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
import { v4 as uuidv4 } from 'uuid';
import { 
  CoordinatorAgent, 
  PlannerAgent, 
  ResearcherAgent, 
  WriterAgent 
} from '../agents';
import { WorkflowState } from '../interfaces';
import { saveResearchToFile } from '../tools';

// ANSI颜色代码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

/**
 * 打印状态更新
 */
function printStatusUpdate(message: string): void {
  console.log(colors.cyan + '➤ ' + message + colors.reset);
}

/**
 * 打印节点执行
 */
function printNodeExecution(node: string, state: any): void {
  const nodeColors: { [key: string]: string } = {
    coordinator: colors.yellow,
    planner: colors.blue,
    researcher: colors.green,
    writer: colors.magenta
  };
  
  const color = nodeColors[node] || colors.reset;
  console.log(color + '◆ 执行节点: ' + colors.bright + node + colors.reset);
}

/**
 * 打印工作流状态摘要
 */
function printWorkflowStateSummary(state: WorkflowState, title: string = '当前工作流状态'): void {
  console.log(`\n${colors.bright}${colors.magenta}[工作流] ${title}${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(80)}${colors.reset}`);
  
  // 打印基本信息
  console.log(`${colors.bright}任务ID:${colors.reset} ${state.taskId}`);
  console.log(`${colors.bright}查询:${colors.reset} ${state.query}`);
  console.log(`${colors.bright}深度:${colors.reset} ${state.currentDepth}/${state.depth} (剩余: ${state.remainingDepth})`);
  console.log(`${colors.bright}广度:${colors.reset} ${state.breadth}`);
  if (state.createdAt) {
    console.log(`${colors.bright}创建时间:${colors.reset} ${state.createdAt.toLocaleString()}`);
  }
  
  // 打印当前决策
  console.log(`${colors.bright}当前决策:${colors.reset} ${state.decision || '无'}`);
  if (state.decisionReasoning) {
    console.log(`${colors.bright}决策理由:${colors.reset} ${state.decisionReasoning.substring(0, 100)}${state.decisionReasoning.length > 100 ? '...' : ''}`);
  }
  
  // 打印搜索统计
  console.log(`${colors.bright}搜索查询:${colors.reset} ${state.searchQueries.length}个`);
  console.log(`${colors.bright}搜索结果:${colors.reset} ${state.searchResults.length}个`);
  
  // 打印研究发现
  const learningsCount = state.processedResults?.learnings?.length || 0;
  const questionsCount = state.processedResults?.followUpQuestions?.length || 0;
  console.log(`${colors.bright}研究发现:${colors.reset} ${learningsCount}个`);
  console.log(`${colors.bright}后续问题:${colors.reset} ${questionsCount}个`);
  
  // 打印最终报告状态
  console.log(`${colors.bright}最终报告:${colors.reset} ${state.finalReport ? '已生成' : '未生成'}`);
  
  // 打印错误信息
  if (state.error) {
    console.log(`${colors.bright}${colors.red}错误:${colors.reset} ${state.error}`);
  }
  
  console.log(`${colors.magenta}${'='.repeat(80)}${colors.reset}\n`);
}

/**
 * 打印工作流跟踪信息
 */
function printWorkflowTrace(previousState: WorkflowState, currentState: WorkflowState, action: string): void {
  console.log(`\n${colors.bright}${colors.blue}[工作流] 状态变化跟踪${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}`);
  
  console.log(`${colors.bright}执行操作:${colors.reset} ${action}`);
  
  // 跟踪决策变化
  if (previousState.decision !== currentState.decision) {
    console.log(`${colors.bright}决策变化:${colors.reset} ${previousState.decision || '无'} -> ${currentState.decision || '无'}`);
  }
  
  // 跟踪深度变化
  if (previousState.currentDepth !== currentState.currentDepth) {
    console.log(`${colors.bright}深度变化:${colors.reset} ${previousState.currentDepth} -> ${currentState.currentDepth}`);
  }
  
  // 跟踪搜索查询变化
  const prevQueriesCount = previousState.searchQueries.length;
  const currQueriesCount = currentState.searchQueries.length;
  if (prevQueriesCount !== currQueriesCount) {
    console.log(`${colors.bright}搜索查询变化:${colors.reset} ${prevQueriesCount} -> ${currQueriesCount}`);
    
    // 打印新增的查询
    if (currQueriesCount > prevQueriesCount) {
      console.log(`${colors.bright}新增查询:${colors.reset}`);
      const newQueries = currentState.searchQueries.slice(prevQueriesCount);
      newQueries.forEach((query, i) => {
        console.log(`  ${i+1}. ${query}`);
      });
    }
  }
  
  // 跟踪搜索结果变化
  const prevResultsCount = previousState.searchResults.length;
  const currResultsCount = currentState.searchResults.length;
  if (prevResultsCount !== currResultsCount) {
    console.log(`${colors.bright}搜索结果变化:${colors.reset} ${prevResultsCount} -> ${currResultsCount}`);
  }
  
  // 跟踪研究发现变化
  const prevLearningsCount = previousState.processedResults?.learnings?.length || 0;
  const currLearningsCount = currentState.processedResults?.learnings?.length || 0;
  if (prevLearningsCount !== currLearningsCount) {
    console.log(`${colors.bright}研究发现变化:${colors.reset} ${prevLearningsCount} -> ${currLearningsCount}`);
  }
  
  // 跟踪最终报告状态
  if (!previousState.finalReport && currentState.finalReport) {
    console.log(`${colors.bright}${colors.green}最终报告:${colors.reset} 已生成 (${currentState.finalReport.length} 字符)`);
  }
  
  console.log(`${colors.blue}${'='.repeat(80)}${colors.reset}\n`);
}

/**
 * 创建初始工作流状态
 */
export function createInitialState(query: string, depth: number, breadth: number): WorkflowState {
  printStatusUpdate('创建初始工作流状态');
  
  const initialState = {
    taskId: uuidv4(),
    query,
    depth,
    breadth,
    currentDepth: 0,
    remainingDepth: depth,
    searchQueries: [],
    searchResults: [],
    processedResults: {
      learnings: [],
      followUpQuestions: [],
    },
    insights: [],
    nextDirections: [],
    messages: [] as BaseMessage[],
    createdAt: new Date(),
  };
  
  // 打印初始状态摘要
  printWorkflowStateSummary(initialState, '初始工作流状态');
  
  return initialState;
}

/**
 * 创建研究工作流
 */
export function createResearchWorkflow() {
  printStatusUpdate('初始化研究工作流');
  
  // 初始化代理
  const coordinator = new CoordinatorAgent();
  const planner = new PlannerAgent();
  const researcher = new ResearcherAgent();
  const writer = new WriterAgent();

  // 打印工作流初始化信息
  console.log(`\n${colors.bright}${colors.green}[工作流] 初始化详情${colors.reset}`);
  console.log(`${colors.green}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.bright}已加载代理:${colors.reset}`);
  console.log(`- 协调者 (${coordinator.name}): ${coordinator.description}`);
  console.log(`- 规划者 (${planner.name}): ${planner.description}`);
  console.log(`- 研究员 (${researcher.name}): ${researcher.description}`);
  console.log(`- 撰写者 (${writer.name}): ${writer.description}`);
  console.log(`${colors.green}${'='.repeat(50)}${colors.reset}\n`);

  // 路由函数：根据当前状态决定下一步行动
  const routeNextAction = new RunnableLambda({
    func: async (state: WorkflowState): Promise<WorkflowState> => {
      // 记录路由过程开始
      console.log(`\n${colors.bright}${colors.yellow}[工作流] 路由决策${colors.reset}`);
      console.log(`${colors.yellow}当前决策: ${state.decision || '无'}${colors.reset}`);
      
      // 检查是否有错误
      if (state.error) {
        console.error(`${colors.red}工作流错误: ${state.error}${colors.reset}`);
        return state;
      }

      // 如果有决策，执行相应的代理
      const decision = state.decision;
      let nextState = {...state};
      const prevState = {...state};
      
      if (!decision) {
        console.log(`${colors.yellow}没有决策，运行协调者${colors.reset}`);
        printNodeExecution('coordinator', state);
        nextState = await coordinator.execute(state);
        printWorkflowTrace(prevState, nextState, '执行协调者');
        return nextState;
      }
      
      switch (decision) {
        case 'plan':
          printStatusUpdate('决策: 制定研究计划');
          printNodeExecution('planner', state);
          nextState = await planner.execute(state);
          printWorkflowTrace(prevState, nextState, '执行规划者');
          return nextState;
        case 'research':
          printStatusUpdate('决策: 执行搜索研究');
          printNodeExecution('researcher', state);
          nextState = await researcher.execute(state);
          printWorkflowTrace(prevState, nextState, '执行研究员');
          return nextState;
        case 'report':
          printStatusUpdate('决策: 生成最终报告');
          printNodeExecution('writer', state);
          nextState = await writer.execute(state);
          printWorkflowTrace(prevState, nextState, '执行撰写者');
          return nextState;
        case 'continue':
          // 如果决定继续，递减剩余深度并重置协调者
          printStatusUpdate(`决策: 继续深入研究 (当前深度=${state.currentDepth}, 即将进入深度=${state.currentDepth + 1})`);
          const updatedState = {
            ...state,
            currentDepth: state.currentDepth + 1,
            remainingDepth: state.remainingDepth - 1,
            decision: undefined, // 清除决策以防止循环
          };
          
          // 打印深度变化信息
          console.log(`${colors.yellow}深度变化: ${state.currentDepth} -> ${updatedState.currentDepth} (剩余: ${updatedState.remainingDepth})${colors.reset}`);
          
          printNodeExecution('coordinator', updatedState);
          nextState = await coordinator.execute(updatedState);
          printWorkflowTrace(updatedState, nextState, '进入下一深度，执行协调者');
          return nextState;
        default:
          console.warn(`${colors.red}未知决策: ${decision}, 运行协调者${colors.reset}`);
          printNodeExecution('coordinator', state);
          nextState = await coordinator.execute(state);
          printWorkflowTrace(prevState, nextState, '执行协调者(未知决策)');
          return nextState;
      }
    }
  });

  // 检查是否完成
  const checkCompletion = new RunnableLambda({
    func: async (state: WorkflowState): Promise<{state: WorkflowState, completed: boolean}> => {
      // 记录检查完成状态
      console.log(`\n${colors.bright}${colors.yellow}[工作流] 检查完成状态${colors.reset}`);
      
      let completed = false;
      let reason = '';
      
      // 如果已经生成了最终报告，标记为完成
      if (state.finalReport) {
        completed = true;
        reason = '已生成最终报告';
      }
      
      // 如果发生错误，标记为完成
      else if (state.error) {
        completed = true;
        reason = `出现错误: ${state.error}`;
      }
      
      // 打印完成状态
      if (completed) {
        console.log(`${colors.green}工作流已完成 - 原因: ${reason}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}工作流继续执行${colors.reset}`);
      }
      
      // 否则继续执行
      return { state, completed };
    }
  });

  // 创建工作流
  const workflow = RunnableSequence.from([
    // 第一步：初始状态下运行协调者
    new RunnableLambda({
      func: async (state: WorkflowState): Promise<WorkflowState> => {
        console.log(`\n${colors.bright}${colors.green}[工作流] 开始执行${colors.reset}`);
        console.log(`${colors.green}初始化协调者...${colors.reset}`);
        
        printNodeExecution('coordinator', state);
        const nextState = await coordinator.execute(state);
        
        printWorkflowTrace(state, nextState, '初始执行协调者');
        return nextState;
      }
    }),
    // 第二步：启动迭代循环
    new RunnableLambda({
      func: async (state: WorkflowState): Promise<WorkflowState> => {
        let currentState = state;
        let maxIterations = 25; // 安全限制
        let iterations = 0;
        
        // 打印循环开始
        console.log(`\n${colors.bright}${colors.green}[工作流] 开始迭代循环${colors.reset}`);
        console.log(`${colors.green}最大迭代次数: ${maxIterations}${colors.reset}`);
        
        while (iterations < maxIterations) {
          iterations++;
          
          // 打印当前迭代
          console.log(`\n${colors.bright}${colors.green}[工作流] 迭代 ${iterations}/${maxIterations}${colors.reset}`);
          
          // 检查是否完成
          const { state: updatedState, completed } = await checkCompletion.invoke(currentState);
          currentState = updatedState;
          
          if (completed) {
            printStatusUpdate(`工作流完成，迭代次数: ${iterations}`);
            
            // 打印最终状态摘要
            printWorkflowStateSummary(currentState, '最终工作流状态');
            break;
          }
          
          // 打印当前状态摘要
          printWorkflowStateSummary(currentState, `迭代 ${iterations} 状态`);
          
          // 路由到下一个动作
          currentState = await routeNextAction.invoke(currentState);
        }
        
        if (iterations >= maxIterations) {
          printStatusUpdate(`达到最大迭代次数 (${maxIterations})，强制结束工作流`);
          if (!currentState.error) {
            currentState.error = '达到最大迭代次数限制';
          }
          
          // 打印最终状态摘要
          printWorkflowStateSummary(currentState, '最终工作流状态（达到最大迭代次数）');
        }
        
        return currentState;
      }
    })
  ]);
  
  printStatusUpdate('工作流创建完成');
  return workflow;
}

/**
 * 运行研究工作流
 */
export async function runResearchWorkflow(
  query: string,
  depth: number = 2,
  breadth: number = 4
): Promise<string> {
  // 创建初始状态
  const initialState = createInitialState(query, depth, breadth);
  
  // 创建工作流
  const workflow = createResearchWorkflow();
  
  try {
    // 运行工作流
    printStatusUpdate(`开始研究查询: "${query}" (深度=${depth}, 广度=${breadth})`);
    
    console.log(`\n${colors.bright}${colors.cyan}[工作流] 任务详情${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
    console.log(`${colors.bright}查询:${colors.reset} ${query}`);
    console.log(`${colors.bright}深度:${colors.reset} ${depth}`);
    console.log(`${colors.bright}广度:${colors.reset} ${breadth}`);
    console.log(`${colors.bright}任务ID:${colors.reset} ${initialState.taskId}`);
    console.log(`${colors.bright}开始时间:${colors.reset} ${new Date().toLocaleString()}`);
    console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}\n`);
    
    const startTime = Date.now();
    const result = await workflow.invoke(initialState);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // 秒
    
    if (!result.finalReport) {
      throw new Error('工作流未能生成最终报告');
    }
    
    // 打印完成摘要
    console.log(`\n${colors.bright}${colors.green}[工作流] 执行完成${colors.reset}`);
    console.log(`${colors.green}${'='.repeat(50)}${colors.reset}`);
    console.log(`${colors.bright}总执行时间:${colors.reset} ${Math.floor(duration / 60)}分${Math.floor(duration % 60)}秒`);
    console.log(`${colors.bright}最终报告长度:${colors.reset} ${result.finalReport.length} 字符`);
    console.log(`${colors.bright}研究发现数量:${colors.reset} ${result.processedResults.learnings.length}`);
    console.log(`${colors.bright}搜索结果数量:${colors.reset} ${result.searchResults.length}`);
    console.log(`${colors.bright}完成时间:${colors.reset} ${new Date().toLocaleString()}`);
    console.log(`${colors.green}${'='.repeat(50)}${colors.reset}\n`);
    
    // 保存研究报告和过程
    printStatusUpdate('保存研究报告和研究过程...');
    try {
      const { reportPath, processPath } = await saveResearchToFile(result);
      console.log(`\n${colors.bright}${colors.green}[工作流] 文件保存完成${colors.reset}`);
      console.log(`${colors.green}- 研究报告: ${reportPath}${colors.reset}`);
      console.log(`${colors.green}- 研究过程: ${processPath}${colors.reset}`);
    } catch (saveError: unknown) {
      const errorMessage = saveError instanceof Error ? saveError.message : String(saveError);
      console.error(`\n${colors.bright}${colors.red}[工作流] 保存文件失败: ${errorMessage}${colors.reset}`);
    }
    
    printStatusUpdate('研究工作流执行完成');
    return result.finalReport;
  } catch (error) {
    console.error('研究工作流执行失败:', error);
    throw error;
  }
} 