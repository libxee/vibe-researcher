#!/usr/bin/env node

import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createResearchWorkflow, runResearchWorkflow } from './workflows/researchWorkflow';
import { WorkflowState, ResearchTask } from './interfaces';

// 加载环境变量
dotenv.config();

// 版本信息
const VERSION = '1.0.0';
const RELEASE_DATE = '2025-05-14';

// ANSI颜色代码，用于终端输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

/**
 * 打印启动标题
 */
function printStartupBanner(): void {
  console.log('\n');
  console.log(colors.fg.cyan + colors.bright + '==============================================' + colors.reset);
  console.log(colors.fg.cyan + colors.bright + '    深度研究系统 (Deep Research System)    ' + colors.reset);
  console.log(colors.fg.cyan + colors.bright + '==============================================' + colors.reset);
  console.log(colors.fg.cyan + `版本: ${VERSION} (${RELEASE_DATE})` + colors.reset);
  console.log(colors.fg.cyan + '多代理研究框架 - 自动执行深度研究任务' + colors.reset);
  console.log(colors.fg.cyan + colors.bright + '==============================================' + colors.reset);
  console.log('\n');
}

/**
 * 打印环境信息
 */
function printEnvironmentInfo(): void {
  console.log(colors.fg.yellow + colors.bright + '系统环境信息' + colors.reset);
  console.log(colors.fg.yellow + '-----------------' + colors.reset);
  console.log(`Node.js版本: ${process.version}`);
  console.log(`操作系统: ${process.platform} ${process.arch}`);
  console.log(`OpenAI API密钥: ${process.env.OPENAI_API_KEY ? '已配置' : '未配置'}`);
  console.log(`DeepSeek API密钥: ${process.env.DEEPSEEK_API_KEY ? '已配置' : '未配置'}`);
  console.log(`Serper API密钥: ${process.env.SERPER_API_KEY ? '已配置' : '未配置'}`);
  console.log(colors.fg.yellow + '-----------------' + colors.reset);
  console.log('\n');
}

/**
 * 打印彩色标题
 */
function printTitle(title: string): void {
  console.log('\n' + colors.fg.cyan + colors.bright + '='.repeat(80) + colors.reset);
  console.log(colors.fg.cyan + colors.bright + ' ' + title + colors.reset);
  console.log(colors.fg.cyan + colors.bright + '='.repeat(80) + colors.reset + '\n');
}

/**
 * 打印彩色小标题
 */
function printSubtitle(subtitle: string): void {
  console.log('\n' + colors.fg.magenta + colors.bright + subtitle + colors.reset);
  console.log(colors.fg.magenta + '-'.repeat(subtitle.length) + colors.reset + '\n');
}

// 打印带有颜色的状态信息
function printStatus(message: string): void {
  console.log(`${colors.fg.green}${colors.bright}[状态] ${colors.reset}${message}`);
}

// 打印错误信息
function printError(message: string): void {
  console.error(`${colors.fg.red}${colors.bright}[错误] ${colors.reset}${message}`);
}

// 打印重要信息
function printInfo(message: string): void {
  console.log(`${colors.fg.blue}${colors.bright}[信息] ${colors.reset}${message}`);
}

// 创建并执行研究任务
async function runResearch(query: string, depth: number = 3): Promise<void> {
  const taskId = uuidv4();
  const task: ResearchTask = {
    id: taskId,
    query,
    depth,
    breadth: 4, // 设置默认广度
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  printTitle(`新研究任务: "${query}"`);
  printStatus(`任务ID: ${taskId}`);
  printInfo(`研究深度: ${depth}`);
  printInfo(`研究广度: ${task.breadth}`);
  printInfo(`开始时间: ${task.createdAt.toLocaleString()}`);
  
  try {
    printStatus('初始化研究工作流...');
    
    printStatus('开始执行研究工作流...');
    printInfo('这可能需要几分钟时间，取决于研究的复杂度和深度');
    console.log('\n');
    
    const startTime = Date.now();
    const finalReport = await runResearchWorkflow(query, depth, task.breadth);
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000); // 秒
    
    printTitle('研究完成!');
    printInfo(`总耗时: ${Math.floor(duration / 60)}分${duration % 60}秒`);
    
    if (finalReport) {
      printStatus('研究报告:');
      console.log('\n' + colors.fg.cyan + '===== 研究报告 =====\n' + colors.reset);
      console.log(finalReport);
      console.log('\n' + colors.fg.cyan + '===================' + colors.reset);
      
      // 打印报告统计信息
      const reportLength = finalReport.length;
      const wordCount = finalReport.split(/\s+/).length;
      printInfo(`报告长度: ${reportLength} 字符 (约 ${wordCount} 个词)`);
      
      // 提示保存路径
      printStatus('研究报告和过程已保存到文件:');
      printInfo(`位置: ${process.cwd()}/research_output/`);
    } else {
      printError('研究未能生成报告');
    }
    
    // 更新任务状态
    task.status = 'completed';
    task.result = finalReport;
    task.updatedAt = new Date();
    
    printInfo(`任务 ${taskId} 已完成并保存`);
    printInfo(`结束时间: ${task.updatedAt.toLocaleString()}`);
  } catch (error) {
    printError(`研究过程中出错: ${error instanceof Error ? error.message : String(error)}`);
    
    // 更新任务状态为失败
    task.status = 'failed';
    task.updatedAt = new Date();
    
    printInfo(`任务 ${taskId} 已标记为失败`);
  }
}

// 命令行界面
async function main(): Promise<void> {
  // 打印启动标题
  printStartupBanner();
  
  // 打印环境信息
  printEnvironmentInfo();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'research') {
    const query = args[1];
    const depth = parseInt(args[2] || '3', 10);
    
    if (!query) {
      printError('请提供研究查询内容');
      console.log(`
用法: npm run research "您的研究查询" [深度]
例如: npm run research "量子计算机的最新进展" 4

参数:
  - 研究查询: 您想要深入研究的主题(必填)
  - 深度: 研究的深度级别(可选，默认为3)
      `);
      process.exit(1);
    }
    
    // 验证环境配置
    if (!process.env.OPENAI_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      printError('未配置API密钥。请在.env文件中设置OPENAI_API_KEY或DEEPSEEK_API_KEY');
      process.exit(1);
    }
    
    // if (!process.env.SERPER_API_KEY) {
    //   printError('未配置SERPER_API_KEY。搜索功能可能无法正常工作');
    //   printInfo('您可以在https://serper.dev获取API密钥');
      
    //   // 询问用户是否继续
    //   console.log(colors.fg.yellow + '\n警告: 没有搜索API密钥，系统将无法进行网络搜索，研究能力将受到严重限制。' + colors.reset);
    //   process.exit(1);
    // }
    
    await runResearch(query, depth);
  } else {
    printError('未知命令');
    console.log(`
可用命令:
  - research: 执行研究任务
    用法: npm run research "您的研究查询" [深度]
    `);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(error => {
    printError(`程序出错: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}

export { runResearch }; 