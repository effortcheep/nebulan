#!/usr/bin/env node

// 日志清理脚本
// 用法: node scripts/cleanup-logs.mjs
// 建议通过 cron 每天执行一次: 0 2 * * * node /path/to/scripts/cleanup-logs.mjs

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { eq, and, lte, sql } from 'drizzle-orm'
import { logs } from '../src/db/schema.js'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'nebulan',
})

const db = drizzle(pool)

async function cleanup() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  console.log(`[Log Cleanup] 开始清理...`)
  console.log(`  普通日志保留: 7 天 (${sevenDaysAgo.toISOString()})`)
  console.log(`  错误日志保留: 30 天 (${thirtyDaysAgo.toISOString()})`)

  // 删除 7 天前的非 error 日志
  const normalResult = await db
    .delete(logs)
    .where(
      and(
        lte(logs.createdAt, sevenDaysAgo),
        sql`${logs.level} != 'error'`,
      ),
    )

  // 删除 30 天前的 error 日志
  const errorResult = await db
    .delete(logs)
    .where(
      and(lte(logs.createdAt, thirtyDaysAgo), eq(logs.level, 'error')),
    )

  console.log(
    `[Log Cleanup] 完成: 删除普通日志 ${normalResult.rowCount ?? 0} 条, 错误日志 ${errorResult.rowCount ?? 0} 条`,
  )

  await pool.end()
}

cleanup().catch((err) => {
  console.error('[Log Cleanup] 失败:', err)
  process.exit(1)
})
