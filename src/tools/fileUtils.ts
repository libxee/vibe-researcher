import fs from 'fs';
import path from 'path';
import { WorkflowState } from '../interfaces';

/**
 * 确保目录存在，如果不存在则创建
 */
function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 生成唯一的文件名
 */
function generateFileName(query: string): string {
  // 清理查询以生成合法的文件名
  const sanitizedQuery = query
    .replace(/[^\w\s\u4e00-\u9fa5]/g, '_') // 将特殊字符替换为下划线
    .replace(/\s+/g, '_')                  // 将空格替换为下划线
    .substring(0, 50);                     // 截断长度
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${sanitizedQuery}_${timestamp}`;
}

/**
 * 格式化研究状态为Markdown
 */
function formatStateToMarkdown(state: WorkflowState): string {
  const createdAt = state.createdAt ? state.createdAt.toLocaleString() : new Date().toLocaleString();
  const finishedAt = new Date().toLocaleString();
  
  return `# 研究过程记录

## 基本信息
- **研究主题**: ${state.query}
- **研究深度**: ${state.depth}
- **研究广度**: ${state.breadth}
- **开始时间**: ${createdAt}
- **完成时间**: ${finishedAt}
- **任务ID**: ${state.taskId}

## 研究统计
- **搜索查询数**: ${state.searchQueries.length}
- **搜索结果数**: ${state.searchResults.length}
- **研究发现数**: ${state.processedResults?.learnings?.length || 0}
- **后续问题数**: ${state.processedResults?.followUpQuestions?.length || 0}

## 搜索查询
${state.searchQueries.map((query, index) => `${index + 1}. ${query}`).join('\n')}

## 研究发现
${state.processedResults?.learnings?.map((learning, index) => `${index + 1}. ${learning}`).join('\n') || '无研究发现'}

## 后续问题
${state.processedResults?.followUpQuestions?.map((question, index) => `${index + 1}. ${question}`).join('\n') || '无后续问题'}

## 搜索结果来源
${state.searchResults.map((result, index) => `${index + 1}. [${result.title}](${result.url})`).join('\n') || '无搜索结果'}
`;
}

/**
 * 保存研究报告和研究过程到文件
 */
export async function saveResearchToFile(state: WorkflowState): Promise<{ reportPath: string; processPath: string }> {
  // 创建保存目录
  const outputDir = path.join(process.cwd(), 'research_output');
  ensureDirectoryExists(outputDir);
  
  // 为当前研究创建一个子目录
  const fileName = generateFileName(state.query);
  const researchDir = path.join(outputDir, fileName);
  ensureDirectoryExists(researchDir);
  
  // 创建两个文件路径：一个用于报告，一个用于过程
  const reportPath = path.join(researchDir, 'report.md');
  const processPath = path.join(researchDir, 'process.md');
  
  // 保存报告（如果存在）
  if (state.finalReport) {
    fs.writeFileSync(reportPath, state.finalReport, 'utf8');
    console.log(`\x1b[32m✓ 研究报告已保存至: ${reportPath}\x1b[0m`);
  } else {
    console.log(`\x1b[33m⚠ 没有最终报告可保存\x1b[0m`);
  }
  
  // 保存研究过程
  const processMarkdown = formatStateToMarkdown(state);
  fs.writeFileSync(processPath, processMarkdown, 'utf8');
  console.log(`\x1b[32m✓ 研究过程已保存至: ${processPath}\x1b[0m`);
  
  return { reportPath, processPath };
} 