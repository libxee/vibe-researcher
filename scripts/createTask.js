/**
 * 创建研究任务的脚本
 */
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
require('dotenv').config();

// 主函数
async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('错误: 缺少查询参数');
    console.log('用法: node createTask.js "您的研究查询" [--depth=数字] [--breadth=数字]');
    process.exit(1);
  }

  // 解析参数
  const query = args[0];
  let depth = 2;
  let breadth = 4;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--depth=')) {
      depth = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--breadth=')) {
      breadth = parseInt(arg.split('=')[1]);
    }
  }

  // 打开数据库连接
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), '..', 'database.sqlite');
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  try {
    // 创建任务表（如果不存在）
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        query TEXT NOT NULL,
        depth INTEGER NOT NULL,
        breadth INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL,
        result TEXT
      )
    `);

    // 创建任务
    const taskId = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO tasks (id, query, depth, breadth, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [taskId, query, depth, breadth, 'pending', now, now]
    );

    console.log(`创建了研究任务: "${query}"`);
    console.log(`任务ID: ${taskId}`);
    console.log(`深度: ${depth}, 广度: ${breadth}`);
    console.log('任务已添加到队列，可以通过API查询状态或启动服务器进行管理');
  } catch (error) {
    console.error('创建任务失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    await db.close();
  }
}

// 执行主函数
main().catch((error) => {
  console.error('致命错误:', error);
  process.exit(1);
}); 