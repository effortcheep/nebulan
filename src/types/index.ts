export interface App {
  id: number
  name: string
  slug: string
  description: string | null
  iconUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface Version {
  id: number
  appId: number
  version: string
  platform: 'ios' | 'android'
  downloadUrl: string
  fileSize: number | null
  changelog: string | null
  isActive: number
  createdAt: string
}

export interface AppWithVersions extends App {
  versions: Version[]
}

// 格式化文件大小
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

// 格式化日期
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
