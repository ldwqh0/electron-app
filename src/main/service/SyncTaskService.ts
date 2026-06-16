import { db } from '../database'
import type { RangePagedModel, SyncTask } from '../../types'
import { isEmpty } from 'lodash-es'
import type { SQLInputValue, SQLOutputValue } from 'node:sqlite'
import { PageableParam } from '../../types/PageableParam'
import cleanObj from '../../lib/cleanObj'

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
  INSERT INTO sync_tasks (dataName, startTime, ready)
  VALUES (@dataName, @startTime, @ready)
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
const deleteStmt = db.prepare('DELETE FROM sync_tasks WHERE id = ?')

/**
 * 将 SyncTask 转换为数据库存储格式
 */
function toDbFormat (data: SyncTask): Record<string, SQLInputValue> {
  return {
    dataName: data.dataName ?? null,
    startTime: (data.startTime instanceof Date ? data.startTime.toISOString() : data.startTime) ?? null,
    completedTime: (data.completedTime instanceof Date ? data.completedTime.toISOString() : data.completedTime) ?? null,
    exception: data.exception as string ?? null,
    successCount: data.successCount ?? 0,
    failCount: data.failCount ?? 0,
    ready: data.ready ? 1 : 0
  }
}

/**
 * 将数据库记录转换为 SyncTask 格式
 */

function fromDbFormat (row: Record<string, SQLOutputValue>): SyncTask {
  return {
    id: row.id as number,
    dataName: row.dataName as string,
    startTime: row.startTime as unknown as Date,
    completedTime: row.completedTime as unknown as Date | null,
    exception: row.exception as string | null,
    successCount: row.successCount as number,
    failCount: row.failCount as number,
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
  insertStmt.setAllowUnknownNamedParameters(true)
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
 * 查询所有同步任务（支持分页）
 * @param params 分页参数
 * @returns 分页数据
 */
export async function findAll (params: PageableParam): Promise<RangePagedModel<SyncTask, number>> {
  const { page = 0, size = 10, keyword } = params
  const queryParams = cleanObj(params)
  const countSql = 'SELECT COUNT(*) as count FROM sync_tasks WHERE 1=1 '
  const selectSql = 'SELECT * FROM sync_tasks WHERE 1=1 '
  // 计算偏移量
  let where = ''

  if (!isEmpty(keyword)) {
    where = ' AND dataName LIKE @keyword'
  }

  // 查询总数
  const countResult = db.prepare(`${countSql}${where}`).get(queryParams) as { count: number }
  // 查询分页数据
  const selectStmt = db.prepare(`${selectSql}${where} ORDER BY id DESC LIMIT @limit OFFSET @offset`)
  const content = selectStmt.all({
    ...queryParams,
    limit: size,
    offset: page * size
  }).map(fromDbFormat)
  return {
    content,
    page: {
      page,
      size,
      totalElements: countResult.count
    }
  }
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
