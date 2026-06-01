import { createFileRoute } from '@tanstack/solid-router'
import { db } from '../../../db'
import { apps, logs } from '../../../db/schema'
import { eq } from 'drizzle-orm'

const MAX_BATCH_SIZE = 100

const REQUIRED_FIELDS = [
  'trace_id',
  'span_id',
  'level',
  'event_type',
  'device_id',
] as const

const VALID_LEVELS = ['debug', 'info', 'warn', 'error'] as const

interface LogEntry {
  trace_id: string
  span_id: string
  parent_span_id?: string | null
  level: string
  event_type: string
  event_data?: unknown
  app_version?: string
  device_id: string
  os?: string
  os_version?: string
  device_model?: string
  status?: string
  duration_ms?: number
  timestamp?: string
}

function validateLogEntry(entry: unknown): string | null {
  if (!entry || typeof entry !== 'object') {
    return '日志条目必须是对象'
  }

  const log = entry as Record<string, unknown>

  for (const field of REQUIRED_FIELDS) {
    if (!log[field] || typeof log[field] !== 'string') {
      return `缺少必填字段: ${field}`
    }
  }

  if (!VALID_LEVELS.includes(log.level as (typeof VALID_LEVELS)[number])) {
    return `无效的日志级别: ${log.level}，允许值: ${VALID_LEVELS.join(', ')}`
  }

  return null
}

export const Route = createFileRoute('/api/logs/ingest')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 验证 App Key
        const appKey = request.headers.get('X-App-Key')
        if (!appKey) {
          return new Response(
            JSON.stringify({ success: false, error: '缺少 X-App-Key 头' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
          )
        }

        const app = await db.query.apps.findFirst({
          where: eq(apps.apiKey, appKey),
        })

        if (!app) {
          return new Response(
            JSON.stringify({ success: false, error: '无效的 App Key' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } },
          )
        }

        // 解析请求体
        let body: unknown
        try {
          body = await request.json()
        } catch {
          return new Response(
            JSON.stringify({ success: false, error: '请求体不是有效的 JSON' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        if (
          !body ||
          typeof body !== 'object' ||
          !('logs' in body) ||
          !Array.isArray((body as Record<string, unknown>).logs)
        ) {
          return new Response(
            JSON.stringify({
              success: false,
              error: '请求体必须包含 logs 数组',
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        const logEntries = (body as Record<string, unknown>).logs as unknown[]

        if (logEntries.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: 'logs 数组不能为空' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        if (logEntries.length > MAX_BATCH_SIZE) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `单次上报最多 ${MAX_BATCH_SIZE} 条`,
            }),
            { status: 413, headers: { 'Content-Type': 'application/json' } },
          )
        }

        // 校验每条日志
        const errors: string[] = []
        for (let i = 0; i < logEntries.length; i++) {
          const error = validateLogEntry(logEntries[i])
          if (error) {
            errors.push(`第 ${i + 1} 条: ${error}`)
          }
        }

        if (errors.length > 0) {
          return new Response(
            JSON.stringify({ success: false, error: errors.join('; ') }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        // 批量插入
        try {
          const rows = logEntries.map((entry) => {
            const log = entry as LogEntry
            return {
              appId: app.id,
              traceId: log.trace_id,
              spanId: log.span_id,
              parentSpanId: log.parent_span_id || null,
              level: log.level as 'debug' | 'info' | 'warn' | 'error',
              eventType: log.event_type,
              eventData: log.event_data || null,
              appVersion: log.app_version || null,
              deviceId: log.device_id,
              os: log.os || null,
              osVersion: log.os_version || null,
              deviceModel: log.device_model || null,
              status: log.status || null,
              durationMs: log.duration_ms || null,
              createdAt: log.timestamp ? new Date(log.timestamp) : new Date(),
            }
          })

          await db.insert(logs).values(rows)

          return new Response(
            JSON.stringify({ success: true, accepted: rows.length }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        } catch (error) {
          console.error('Failed to insert logs:', error)
          return new Response(
            JSON.stringify({ success: false, error: '日志写入失败' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          )
        }
      },
    },
  },
})
