import { PageableParam, RangePagedModel, SyncTaskData } from '@/types'
import { db } from '@/database'
import { SQLInputValue, SQLOutputValue } from 'node:sqlite'

const initStmt = db.prepare(`
  UPDATE sync_task_data
  SET running = 0,
  succeed = NULL
  where running = 1
`)

const insertStatement = db.prepare(`
  INSERT INTO sync_task_data (task_id, data)
  VALUES (@taskId, @data)
`)
insertStatement.setAllowUnknownNamedParameters(true)

const selectNewStmt = db.prepare(`
      SELECT *
      FROM sync_task_data
      WHERE running = 0 AND succeed IS NULL AND task_id = ?
      LIMIT 1
    `)

const selectStmt = db.prepare(`
      SELECT id, task_id, data, succeed, exception, running, version, created_at, last_modified_at
      FROM sync_task_data
      WHERE id = ?
    `)

const updateStmt = db.prepare(`
      UPDATE sync_task_data
      SET 
      succeed = @succeed,
      exception = @exception,
      running = @running,
      version = version + 1,
      last_modified_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) 
      WHERE id = @id AND version = @version 
    `)
updateStmt.setAllowUnknownNamedParameters(true)

function fromDb (row: Record<string, SQLOutputValue>): SyncTaskData {
  return {
    id: row.id as number,
    taskId: row.task_id as number,
    data: row.data as string,
    succeed: row.succeed === null ? null : row.succeed === 1,
    exception: (row.exception ?? '') as string,
    running: row.running === 1,
    version: row.version as number,
    createdTime: new Date(row.created_at as string | Date),
    lastModifiedTime: new Date(row.last_modified_at as string | Date)
  }
}

function toDb (data: SyncTaskData): Record<string, SQLInputValue> {
  return {
    taskId: data.taskId,
    data: data.data,
    succeed: data.succeed === null ? null : data.succeed ? 1 : 0,
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
  const row = selectStmt.get(id)
  return row ? fromDb(row) : null
}

async function getNext (taskId: number): Promise<SyncTaskData | null> {
  // 在事务中查询并更新
  db.exec('BEGIN TRANSACTION')
  try {
    // 查询待处理的任务
    // 找到一条 running = false，并且 succeeded is null 的记录
    const row = selectNewStmt.get(taskId) as Record<string, SQLOutputValue>
    if (!row) {
      db.exec('ROLLBACK')
      return null
    }
    const data = fromDb(row)
    // 修改为 running = true
    data.running = true
    const result = updateStmt.run({ id: data.id!, ...toDb(data) })
    if (result.changes === 0) {
      throw new Error('Failed to update task data')
    } else {
      db.exec('COMMIT')
    }
    return fromDb(selectStmt.get(row.id) as Record<string, SQLOutputValue>)
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

async function findAll (
  params: PageableParam
): Promise<RangePagedModel<SyncTaskData, number>> {
  const { page, size, ...filters } = params
  const countQuery = 'SELECT count(1) as count FROM sync_task_data WHERE 1=1 '
  const sql = 'SELECT *  FROM sync_task_data WHERE 1=1 '
  let where = ''
  const queryParams: Record<string, SQLInputValue> = {}

  // 添加过滤条件
  if (filters.taskId !== undefined) {
    where += ' AND task_id = @taskId'
    queryParams.taskId = filters.taskId as number
  }
  if (filters.running !== undefined) {
    where += ' AND running = @running'
    queryParams.running = filters.running ? 1 : 0
  }
  if (filters.succeed !== undefined) {
    if (filters.succeed === null) {
      where += ' AND succeed IS NULL'
    } else {
      where += ' AND succeed = @succeed'
      queryParams.succeed = filters.succeed ? 1 : 0
    }
  }
  const countStmt = db.prepare(`${countQuery}${where}`)
  const { count } = countStmt.get(queryParams) as { count: number }
  let content: SyncTaskData[] = []
  if (count > 0) {
    const stmt = db.prepare(`${sql}${where} ORDER BY id ASC LIMIT @limit OFFSET @offset`)
    content = stmt.all({
      ...queryParams,
      limit: size as number,
      offset: page * size
    }).map(fromDb)
  }

  return {
    content,
    page: {
      page,
      size,
      totalElements: count
    }
  }
}

async function update (id: number, data: SyncTaskData): Promise<SyncTaskData> {
  const dbData = toDb(data)
  updateStmt.run({ ...dbData, id })
  return data
}

function init () {
  initStmt.run()
}

export default {
  saveAll,
  getNext,
  findAll,
  findById,
  update,
  init
}
