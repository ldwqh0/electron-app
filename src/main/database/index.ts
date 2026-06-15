/**
 * 数据库连接管理
 * 负责创建和管理 SQLite 数据库连接
 */

import { DatabaseSync } from 'node:sqlite'
import { join } from 'path'
import { app } from 'electron'

// 数据库路径 - 存储在用户数据目录
const dbPath = join(app.getPath('userData'), 'sync-tasks.db')

// 创建数据库连接（单例）
export const db = new DatabaseSync(dbPath)

/**
 * 初始化数据库
 * 创建所有需要的表
 */

/**
 * 配置数据库选项
 */
export function configureDatabase (): void {
  // 设置 WAL 模式以提高性能和可靠性
  db.exec('PRAGMA journal_mode = WAL')

  // 设置同步模式
  db.exec('PRAGMA synchronous = NORMAL')

  // 设置缓存大小（单位：KB，负数表示 KB，正数表示页数）
  db.exec('PRAGMA cache_size = -2000') // 2MB

  console.log('✅ Database configured')
}

/**
 * 关闭数据库连接
 */
export function closeDatabase (): void {
  try {
    db.close()
    console.log('✅ Database connection closed')
  } catch (error) {
    console.error('❌ Error closing database:', error)
  }
}

/**
 * 检查数据库连接状态
 */
export function isDatabaseOpen (): boolean {
  try {
    // 尝试执行一个简单的查询来检查连接
    db.prepare('SELECT 1').get()
    return true
  } catch {
    return false
  }
}

/**
 * 获取数据库路径
 */
export function getDatabasePath (): string {
  return dbPath
}

/**
 * 获取数据库统计信息
 */
export function getDatabaseStats (): {
  path: string
  isOpen: boolean
  pageSize: number
  pageCount: number
  sizeMB: number
  } {
  // 使用 prepared statement 查询 PRAGMA
  const pageSizeStmt = db.prepare('PRAGMA page_size')
  const pageCountStmt = db.prepare('PRAGMA page_count')

  const pageSizeRow = pageSizeStmt.get() as { page_size: number }
  const pageCountRow = pageCountStmt.get() as { page_count: number }

  const pageSize = pageSizeRow?.page_size || 0
  const pageCount = pageCountRow?.page_count || 0

  return {
    path: dbPath,
    isOpen: isDatabaseOpen(),
    pageSize,
    pageCount,
    sizeMB: Number(((pageSize * pageCount) / (1024 * 1024)).toFixed(2))
  }
}

// 导出默认对象
export default {
  db,
  configureDatabase,
  closeDatabase,
  isDatabaseOpen,
  getDatabasePath,
  getDatabaseStats
}
