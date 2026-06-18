/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/database'
import log from 'electron-log'

// 配置的固定 ID
const CONFIG_ID = '1'

// 预编译 SQL 语句
const upsertStmt = db.prepare(`
  INSERT OR REPLACE INTO config (id, data)
  VALUES (@id, @data)
`)

const selectStmt = db.prepare(`
  SELECT data FROM config WHERE id = ?
`)

/**
 * 保存应用配置到数据库
 * 将配置对象序列化为 JSON 字符串存储
 * @param config 配置对象
 */
async function save (config: Record<string, any>): Promise<void> {
  try {
    const data = JSON.stringify(config)
    upsertStmt.run({
      id: CONFIG_ID,
      data
    })
    log.info('✅ App config saved successfully')
  } catch (error) {
    log.error('❌ Error saving app config:', error)
    throw error
  }
}

/**
 * 从数据库获取应用配置
 * @returns 配置对象，如果不存在则返回空对象
 */
async function get (): Promise<Record<string, any>> {
  try {
    const row = selectStmt.get(CONFIG_ID) as { data: string } | undefined

    if (!row || !row.data) {
      // 返回空对象
      return {}
    }

    // 反序列化 JSON 字符串
    return JSON.parse(row.data) as Record<string, any>
  } catch (error) {
    log.error('❌ Error loading app config:', error)
    // 发生错误时返回空对象
    return {}
  }
}

export default {
  save,
  get
}
