import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core'

// 平台枚举
export const platformEnum = pgEnum('platform', ['ios', 'android'])

// 日志级别枚举
export const logLevelEnum = pgEnum('log_level', [
  'debug',
  'info',
  'warn',
  'error',
])

// 应用表
export const apps = pgTable('apps', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  iconUrl: varchar('icon_url', { length: 500 }),
  apiKey: varchar('api_key', { length: 64 }).unique(),
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

// 日志表
export const logs = pgTable(
  'logs',
  {
    id: serial('id').primaryKey(),
    appId: integer('app_id')
      .references(() => apps.id, { onDelete: 'cascade' })
      .notNull(),
    traceId: varchar('trace_id', { length: 64 }).notNull(),
    spanId: varchar('span_id', { length: 64 }).notNull(),
    parentSpanId: varchar('parent_span_id', { length: 64 }),
    level: logLevelEnum('level').notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    eventData: jsonb('event_data'),
    appVersion: varchar('app_version', { length: 50 }),
    deviceId: varchar('device_id', { length: 128 }).notNull(),
    os: varchar('os', { length: 20 }),
    osVersion: varchar('os_version', { length: 20 }),
    deviceModel: varchar('device_model', { length: 100 }),
    status: varchar('status', { length: 10 }),
    durationMs: integer('duration_ms'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_logs_app_id').on(table.appId),
    index('idx_logs_trace_id').on(table.traceId),
    index('idx_logs_level').on(table.level),
    index('idx_logs_created_at').on(table.createdAt),
  ],
)

export type Log = typeof logs.$inferSelect
export type NewLog = typeof logs.$inferInsert
