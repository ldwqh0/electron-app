# 数据库模块使用指南

## 📁 架构概览

```
src/main/
├── database/
│   └── index.ts          # 数据库连接管理（核心）
├── service/
│   ├── SyncTaskService.ts # 同步任务服务
│   └── ExampleService.ts  # 示例服务
└── index.ts               # 主进程入口
```

## 🎯 职责划分

### 1️⃣ **database/index.ts** - 数据库基础设施
- ✅ 创建和管理数据库连接
- ✅ 初始化数据库表结构
- ✅ 配置数据库选项（WAL、缓存等）
- ✅ 提供连接状态检查
- ✅ 优雅关闭连接

### 2️⃣ **service/*.ts** - 业务逻辑
- ✅ 使用 `db` 实例执行 CRUD 操作
- ✅ 预编译 SQL 语句
- ✅ 业务数据处理和转换
- ✅ 事务管理

## 📖 使用方式

### 在任何文件中使用数据库

```typescript
// 导入 db 实例
import { db } from '../database'

// 执行 SQL
db.exec('CREATE TABLE ...')

// 预编译语句
const stmt = db.prepare('SELECT * FROM table WHERE id = ?')
const result = stmt.get(id)

// 事务
const transaction = db.transaction(() => {
  // 多个操作
})
transaction()
```

### 创建新的 Service

```typescript
// src/main/service/UserService.ts
import { db } from '../database'

// 预编译语句（模块加载时创建，复用）
const insertUserStmt = db.prepare(`
  INSERT INTO users (name, email) VALUES (@name, @email)
`)

export async function createUser(name: string, email: string) {
  const result = insertUserStmt.run({ name, email })
  return result.lastInsertRowid
}

export async function getUser(id: number) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
}
```

### 添加新表

在 `database/index.ts` 的 `initializeDatabase()` 中添加：

```typescript
export function initializeDatabase(): void {
  // 现有表
  db.exec(`CREATE TABLE IF NOT EXISTS sync_tasks (...)`)
  
  // 新增表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `)
  
  console.log('✅ Database initialized')
}
```

## 🔧 数据库配置

### WAL 模式（已启用）
- 提高并发性能
- 读写不阻塞
- 更好的崩溃恢复

### 缓存配置
```typescript
// 在 database/index.ts 中
db.pragma('cache_size = -2000')  // 2MB 缓存
db.pragma('synchronous = NORMAL') // 平衡性能和安全
```

## 📊 监控和调试

### 查看数据库统计
```typescript
import { getDatabaseStats } from './database'

const stats = getDatabaseStats()
console.log(stats)
// {
//   path: 'C:\\Users\\xxx\\AppData\\Roaming\\electron-app\\sync-tasks.db',
//   isOpen: true,
//   pageSize: 4096,
//   pageCount: 10,
//   sizeMB: 0.04
// }
```

### 检查连接状态
```typescript
import { isDatabaseOpen } from './database'

if (isDatabaseOpen()) {
  console.log('数据库连接正常')
}
```

## ⚠️ 注意事项

### 1. 避免循环依赖
```typescript
// ❌ 错误
// database/index.ts → import from service/SyncTaskService
// service/SyncTaskService → import from database

// ✅ 正确
// database/index.ts （无依赖）
// service/SyncTaskService → import from database
```

### 2. 单例保证
Node.js 模块系统确保 `db` 实例只创建一次：

```typescript
// file1.ts
import { db } from '../database'  // 创建实例

// file2.ts
import { db } from '../database'  // 返回同一个实例

// file3.ts
import { db } from '../database'  // 还是同一个实例
```

### 3. 初始化顺序
```typescript
// 在 index.ts 中
app.whenReady().then(() => {
  // 1. 创建窗口
  createWindow()
  
  // 2. 配置数据库（触发初始化）
  configureDatabase()
  
  // 3. 注册 IPC（使用数据库）
  ipcRegistry.apply()
})
```

## 🚀 完整示例

### 创建新服务
```typescript
// src/main/service/LogService.ts
import { db } from '../database'

// 初始化表（在 database/index.ts 中添加表定义后）
const insertLogStmt = db.prepare(`
  INSERT INTO logs (level, message, timestamp)
  VALUES (@level, @message, @timestamp)
`)

export async function saveLog(level: string, message: string) {
  return insertLogStmt.run({
    level,
    message,
    timestamp: new Date().toISOString()
  })
}

export async function getLogs(limit = 100) {
  return db.prepare(`
    SELECT * FROM logs 
    ORDER BY timestamp DESC 
    LIMIT ?
  `).all(limit)
}
```

### 注册 IPC
```typescript
// src/main/ipc/LogIpc.ts
import { IpcChannel, withErrorHandler, successResponse } from './IpcRegistry'
import * as LogService from '../service/LogService'

export const logChannels: IpcChannel[] = [
  {
    channel: 'log:save',
    handler: withErrorHandler(async (_, { level, message }) => {
      const result = await LogService.saveLog(level, message)
      return successResponse(result)
    })
  }
]

// 在 index.ts 中注册
ipcRegistry.registerBatch(logChannels)
```

## 📝 总结

- ✅ **database/index.ts** - 连接管理（基础设施）
- ✅ **service/*.ts** - 业务逻辑（使用 db）
- ✅ **ipc/*.ts** - IPC 处理（调用 service）
- ✅ 单例模式，性能最优
- ✅ 类型安全，易于维护

这种架构清晰、易扩展，适合中小型 Electron 应用！
