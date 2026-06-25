import { db } from '@/database'
import type { PageableParam, RangePagedModel, SyncTask } from '@/types'
import { isEmpty } from 'lodash-es'
import type { SQLInputValue, SQLOutputValue } from 'node:sqlite'

const initStmt = db.prepare(`
  UPDATE sync_task_ SET running = 0 WHERE running = 1
`)

const resetTaskDataStmt = db.prepare(`
  UPDATE sync_task_data SET running = 0 WHERE running = 1 and task_id = ?
`)

const resetTaskStmt = db.prepare(`
  UPDATE sync_task_
  SET running = 0
  WHERE running = 1 AND id = ?
`)

const countTaskStmt = db.prepare(
  `
  UPDATE sync_task_
  SET (succeed_count, fail_count, count_) = (
        SELECT 
          COUNT(CASE WHEN succeed = 1 THEN 1 END),
          COUNT(CASE WHEN succeed = 0 THEN 1 END),
          COUNT(id)
        FROM sync_task_data 
        WHERE task_id = @id
      ),
      last_modified_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  WHERE id = @id;
  `
)

const completeStmt = db.prepare(`
  UPDATE sync_task_
  SET running = 0,
      completed_time = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      last_modified_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  WHERE id = ? 
  AND completed_time IS NULL
  AND exception IS NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM sync_task_data d
    WHERE d.task_id = sync_task_.id
      AND d.succeed IS NULL
  )
`)

// 预编译 SQL 语句
const insertStmt = db.prepare(`
  INSERT INTO sync_task_ (data_name, start_time, end_time,start_period, end_period, note, ready)
  VALUES (@dataName, @startTime, @endTime, @startPeriod, @endPeriod, @note, @ready)
`)
insertStmt.setAllowUnknownNamedParameters(true)

const updateStmt = db.prepare(`
  UPDATE sync_task_
  SET data_name = @dataName,
      start_time = @startTime,
      end_time = @endTime,
      completed_time = @completedTime,
      start_period = @startPeriod,
      end_period = @endPeriod,
      exception = @exception,
      note = @note,
      succeed_count = @succeedCount,
      fail_count = @failCount,
      ready = @ready,
      running = @running,
      last_modified_at = (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      version = version + 1
  WHERE id = @id AND version = @version
`)
updateStmt.setAllowUnknownNamedParameters(true)

const selectStmt = db.prepare('SELECT * FROM sync_task_ WHERE id = ?')
const deleteStmt = db.prepare('DELETE FROM sync_task_ WHERE id = ?')
const deleteItemStmt = db.prepare('DELETE FROM sync_task_data WHERE task_id = ?')

/**
 * 将 SyncTask 转换为数据库存储格式
 */
function toDbFormat (data: SyncTask): Record<string, SQLInputValue> {
  return {
    dataName: data.dataName ?? null,
    startTime: (data.startTime instanceof Date ? data.startTime.toISOString() : data.startTime) ?? null,
    endTime: (data.endTime instanceof Date ? data.endTime.toISOString() : data.endTime) ?? null,
    completedTime: (data.completedTime instanceof Date ? data.completedTime.toISOString() : data.completedTime) ?? null,
    startPeriod: data.startPeriod,
    endPeriod: data.endPeriod,
    exception: data.exception as string ?? null,
    note: data.note,
    succeedCount: data.succeedCount ?? 0,
    failCount: data.failCount ?? 0,
    running: data.running ? 1 : 0,
    ready: data.ready ? 1 : 0,
    version: data.version ?? 0
  }
}

/**
 * 将数据库记录转换为 SyncTask 格式
 */

function fromDbFormat (row: Record<string, SQLOutputValue>): SyncTask {
  return {
    id: row.id as number,
    dataName: row.data_name as string,
    startTime: new Date(row.start_time as string),
    endTime: new Date(row.end_time as string),
    completedTime: row.completed_time == null ? null : new Date(row.completed_time as string),
    exception: row.exception as string | null,
    startPeriod: row.start_period as string,
    endPeriod: row.end_period as string,
    note: row.note as string | null,
    succeedCount: row.succeed_count as number,
    failCount: row.fail_count as number,
    count: row.count_ as number,
    ready: row.ready === 1,
    datas: [],
    running: row.running === 1,
    version: row.version as number,
    createdTime: new Date(row.created_at as string),
    lastModifiedTime: new Date(row.last_modified_at as string)
  }
}

/**
 * 保存同步任务数据到数据库
 * @param data 同步任务数据
 * @returns 保存后的数据（包含数据库生成的 id）
 */
function save (data: SyncTask): SyncTask {
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
function update (id: number, data: SyncTask): SyncTask {
  const result = updateStmt.run({
    id,
    ...toDbFormat(data)
  })
  if (result.changes === 0) {
    throw new Error('未找到要更新的记录')
  }
  return fromDbFormat(selectStmt.get(id)!)
}

/**
 * 根据 id 查询同步任务
 * @param id 任务 id
 * @returns 同步任务数据
 */
function findById (id: number | string): SyncTask | null {
  const row = selectStmt.get(Number(id))
  if (!row) return null
  return fromDbFormat(row)
}

/**
 * 查询所有同步任务（支持分页）
 * @param params 分页参数
 * @returns 分页数据
 */
function findAll (params: PageableParam): RangePagedModel<SyncTask, number> {
  const { page = 0, size = 10, ...filters } = params
  const countSql = 'SELECT COUNT(1) as count FROM sync_task_ WHERE 1=1'
  const selectSql = 'SELECT * FROM sync_task_ WHERE 1=1'
  // 计算偏移量

  let where = ''
  const queryParams: Record<string, SQLInputValue> = {}

  if (!isEmpty(filters.keyword)) {
    where = ' AND data_name LIKE @keyword'
    queryParams.keyword = `%${filters.keyword}%`
  }

  // 查询总数
  const { count } = db.prepare(`${countSql}${where}`).get(queryParams) as { count: number }
  let content: SyncTask[] = []
  if (count > 0) {
    // 查询分页数据
    const selectStmt = db.prepare(`${selectSql}${where} ORDER BY id DESC LIMIT @limit OFFSET @offset`)
    content = selectStmt.all({
      ...queryParams,
      limit: size,
      offset: page * size
    }).map(fromDbFormat)
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

/**
 * 删除同步任务
 * @param id 任务 id
 * @returns 是否删除成功
 */
function remove (id: number): boolean {
  // 检查任务是否存在以及是否在运行中
  const task = findById(id)
  if (!task) {
    throw new Error('任务不存在')
  }
  if (task.running) {
    throw new Error('任务正在运行中，请先停止任务后再删除')
  }
  db.exec('BEGIN TRANSACTION')
  try {
    deleteItemStmt.run(id)
    const result = deleteStmt.run(id)
    db.exec('COMMIT')
    return result.changes > 0
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

function updateTaskStatus (id: number): SyncTask | null {
  db.exec('BEGIN TRANSACTION')
  try {
    completeStmt.run(id)
    countTaskStmt.run({ id })
    const newRow = selectStmt.get(id)
    if (newRow) {
      const data = fromDbFormat(newRow)
      if (data.completedTime != null) {
        resetTaskDataStmt.run(id)
        resetTaskStmt.run(id)
      }
      db.exec('COMMIT')
      return fromDbFormat(selectStmt.get(id)!)
    } else {
      db.exec('COMMIT')
      return null
    }
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

function init () {
  initStmt.run()
}

export default {
  save,
  update,
  findById,
  findAll,
  remove,
  updateTaskStatus,
  init
}
