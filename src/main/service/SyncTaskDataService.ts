import { SyncTaskData } from '../../types'
import { PageableParam } from '../../types/PageableParam'
import { db } from '../database'
import { SQLInputValue, SQLOutputValue } from 'node:sqlite'

const insertStatement = db.prepare(`
  INSERT INTO sync_task_data (task_id, data)
  VALUES (@taskId, @data)
`)
insertStatement.setAllowUnknownNamedParameters(true)

const selectNewStmt = db.prepare(`
      SELECT id, task_id, data, succeed, exception, running, version, created_at, last_modified_at
      FROM sync_task_data
      WHERE running = 0 AND succeeded IS NULL AND task_id = @taskId
      LIMIT 1
    `)

const selectStmt = db.prepare(`
      SELECT id, task_id, data, succeed, exception, running, version, created_at, last_modified_at
      FROM sync_task_data
      WHERE id = @id
    `)

const updateStmt = db.prepare(`
      UPDATE sync_task_data
      SET 
      succeed = @succeed,
      exception = @exception,
      running = @running,
      version = version + 1      
      updated_at = CURRENT_TIMESTAMP 
      WHERE id = @id AND version = @version 
    `)
updateStmt.setAllowUnknownNamedParameters(true)

function initializeDatabase (): void {
  // 创建 sync_task_data 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_task_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      data TEXT NOT NULL,
      succeed INTEGER DEFAULT NULL,
      exception TEXT DEFAULT NULL,
      running INTEGER DEFAULT 0,
      version INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_modified_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

function fromDb (row: Record<string, SQLOutputValue>): SyncTaskData {
  const succeed: boolean | null = row.succeed !== null && row.succeed !== undefined ? row.succeed === 1 : null
  return {
    id: row.id as number,
    taskId: row.task_id as number,
    data: row.data as string,
    succeed,
    exception: (row.exception ?? '') as string,
    running: row.running === 1,
    version: row.version as number,
    createdAt: new Date(row.created_at as string | Date),
    lastModifiedAt: new Date(row.last_modified_at as string | Date)
  }
}

function toDb (data: SyncTaskData): Record<string, SQLInputValue> {
  return {
    task_id: data.taskId,
    data: data.data,
    succeed: data.succeed ? 1 : 0,
    exception: data.exception ?? '',
    running: data.running ? 1 : 0,
    version: data.version ?? 0
  }
}

async function saveAll (data: SyncTaskData[]): Promise<SyncTaskData[]> {
  if (!data || data.length === 0) {
    return []
  }
  const savedData: SyncTaskData[] = []

  // 使用事务批量插入
  db.exec('BEGIN TRANSACTION')
  try {
    for (const item of data) {
      const dbData = toDb(item)
      const result = insertStatement.run(dbData)
      savedData.push({
        ...item,
        id: Number(result.lastInsertRowid)
      })
    }
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  return savedData
}

function findById (id: number): SyncTaskData | null {
  const row = selectStmt.get({ id }) as Record<string, SQLOutputValue>
  return row ? fromDb(row) : null
}

async function getNext (taskId: number): Promise<SyncTaskData | null> {
  // 在事务中查询并更新

  db.exec('BEGIN TRANSACTION')
  try {
    // 查询待处理的任务
    // 找到一条 running = false，并且 succeeded is null 的记录
    const row = selectNewStmt.get({ taskId }) as Record<string, SQLOutputValue>
    const data = fromDb(row)

    if (!row) {
      db.exec('ROLLBACK')
      return null
    }

    // 修改为 running = true
    data.running = true
    // 更新为 running = true
    const result = updateStmt.run(toDb(data))
    if (result.changes === 0) {
      throw new Error('Failed to update task data')
    } else {
      db.exec('COMMIT')
    }
    return fromDb(row)
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

async function findAll (
  params: PageableParam
): Promise<SyncTaskData[]> {
  const { page, size, ...filters } = params
  const offset = (page - 1) * size

  let sql = 'SELECT id, task_id, data, succeeded, exception, running, version, created_at, last_modified_at FROM sync_task_data WHERE 1=1'
  const queryParams: Record<string, SQLInputValue> = {}

  // 添加过滤条件
  if (filters.taskId !== undefined) {
    sql += ' AND task_id = @taskId'
    queryParams.taskId = filters.taskId as number
  }
  if (filters.running !== undefined) {
    sql += ' AND running = @running'
    queryParams.running = filters.running ? 1 : 0
  }
  if (filters.succeed !== undefined) {
    if (filters.succeed === null) {
      sql += ' AND succeed IS NULL'
    } else {
      sql += ' AND succeed = @succeed'
      queryParams.succeed = filters.succeed ? 1 : 0
    }
  }

  sql += ' ORDER BY id ASC LIMIT @limit OFFSET @offset'
  queryParams.limit = size as number
  queryParams.offset = offset

  const stmt = db.prepare(sql)
  const rows = stmt.all(queryParams) as Record<string, SQLOutputValue>[]

  return rows.map(row => fromDb(row))
}

async function update (id: number, data: SyncTaskData): Promise<SyncTaskData> {
  const dbData = toDb(data)
  updateStmt.run({ ...dbData, id })
  return data
}

initializeDatabase()

export default {
  saveAll,
  getNext,
  findAll,
  findById,
  update
}
