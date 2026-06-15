import { db } from '../database'
import type { SyncTask } from '../model/SyncTask'

// 初始化数据库表（在模块加载时执行）

function initializeDatabase (): void {
  // 创建同步任务表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_tasks (
      id INTEGER PRIMARY KEY,
      dataName TEXT NOT NULL,
      startTime TEXT NOT NULL,
      completedTime TEXT,
      exception TEXT,
      successCount INTEGER DEFAULT 0,
      failCount INTEGER DEFAULT 0,
      ready INTEGER DEFAULT 0
    )
  `)
}

// 预编译 SQL 语句
const insertStmt = db.prepare(`
  INSERT INTO sync_tasks (dataName, startTime, completedTime, exception, successCount, failCount, ready)
  VALUES (@dataName, @startTime, @completedTime, @exception, @successCount, @failCount, @ready)
`)

const updateStmt = db.prepare(`
  UPDATE sync_tasks
  SET dataName = @dataName,
      startTime = @startTime,
      completedTime = @completedTime,
      exception = @exception,
      successCount = @successCount,
      failCount = @failCount,
      ready = @ready
  WHERE id = @id
`)

const selectStmt = db.prepare('SELECT * FROM sync_tasks WHERE id = ?')
const selectAllStmt = db.prepare('SELECT * FROM sync_tasks ORDER BY id DESC')
const deleteStmt = db.prepare('DELETE FROM sync_tasks WHERE id = ?')

/**
 * 将 SyncTask 转换为数据库存储格式
 */
function toDbFormat (data: SyncTask) {
  return {
    dataName: data.dataName,
    startTime: data.startTime instanceof Date ? data.startTime.toISOString() : data.startTime,
    completedTime: data.completedTime instanceof Date ? data.completedTime.toISOString() : data.completedTime,
    exception: data.exception,
    successCount: data.successCount,
    failCount: data.failCount,
    ready: data.ready ? 1 : 0
  }
}

/**
 * 将数据库记录转换为 SyncTask 格式
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDbFormat (row: any): SyncTask {
  return {
    id: row.id,
    dataName: row.dataName,
    startTime: row.startTime,
    completedTime: row.completedTime,
    exception: row.exception,
    successCount: row.successCount,
    failCount: row.failCount,
    ready: row.ready === 1,
    datas: []
  }
}

/**
 * 保存同步任务数据到数据库
 * @param data 同步任务数据
 * @returns 保存后的数据（包含数据库生成的 id）
 */
async function save (data: SyncTask): Promise<SyncTask> {
  const result = insertStmt.run(toDbFormat(data))
  return {
    ...data,
    id: Number(result.lastInsertRowid)
  }
}

/**
 * 更新同步任务数据
 * @param id 数据ID
 * @param data 同步任务数据（必须包含 id）
 * @returns 更新后的数据
 */
async function update (id: number, data: SyncTask): Promise<SyncTask> {
  const result = updateStmt.run({
    id,
    ...toDbFormat(data)
  })

  if (result.changes === 0) {
    throw new Error('未找到要更新的记录')
  }

  return data
}

/**
 * 根据 id 查询同步任务
 * @param id 任务 id
 * @returns 同步任务数据
 */
async function findById (id: number | string): Promise<SyncTask | null> {
  const row = selectStmt.get(Number(id))
  if (!row) return null
  return fromDbFormat(row)
}

/**
 * 查询所有同步任务
 * @returns 同步任务列表
 */
async function findAll (): Promise<SyncTask[]> {
  const rows = selectAllStmt.all()
  return rows.map(fromDbFormat)
}

/**
 * 删除同步任务
 * @param id 任务 id
 * @returns 是否删除成功
 */
async function remove (id: number): Promise<boolean> {
  const result = deleteStmt.run(id)
  return result.changes > 0
}

initializeDatabase()

export default {
  save,
  update,
  findById,
  findAll,
  remove
}
