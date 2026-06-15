import * as fs from 'fs'

export default async function (_, content: string) {
  try {
    const filePath = 'd:\\a.txt'
    fs.writeFileSync(filePath, content, 'utf-8')
    return { success: true, message: `文件写入成功: ${filePath}` }
  } catch (error) {
    return { success: false, message: `文件写入失败: ${error}` }
  }
}
