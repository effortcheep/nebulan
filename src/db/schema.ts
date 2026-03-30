import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core'

// 平台枚举
export const platformEnum = pgEnum('platform', ['ios', 'android'])

// 应用表
export const apps = pgTable('apps', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  iconUrl: varchar('icon_url', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// 版本表
export const versions = pgTable('versions', {
  id: serial('id').primaryKey(),
  appId: integer('app_id')
    .references(() => apps.id, { onDelete: 'cascade' })
    .notNull(),
  version: varchar('version', { length: 50 }).notNull(),
  platform: platformEnum('platform').notNull(),
  downloadUrl: varchar('download_url', { length: 1000 }).notNull(),
  fileSize: integer('file_size'), // 字节数
  changelog: text('changelog'),
  isActive: integer('is_active').default(1), // 1=可用, 0=不可用
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 下载统计表
export const downloadStats = pgTable('download_stats', {
  id: serial('id').primaryKey(),
  versionId: integer('version_id')
    .references(() => versions.id, { onDelete: 'cascade' })
    .notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  downloadedAt: timestamp('downloaded_at').defaultNow().notNull(),
})

// 管理员用户表
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).default('admin').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// 类型定义
export type App = typeof apps.$inferSelect
export type NewApp = typeof apps.$inferInsert
export type Version = typeof versions.$inferSelect
export type NewVersion = typeof versions.$inferInsert
export type DownloadStat = typeof downloadStats.$inferSelect
export type User = typeof users.$inferSelect
