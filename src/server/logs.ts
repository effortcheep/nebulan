import { createServerFn } from '@tanstack/solid-start'
import { db } from '../db'
import { logs, apps } from '../db/schema'
import { eq, and, desc, sql, ilike, gte, lte, SQL } from 'drizzle-orm'

export interface LogFilters {
  appId?: number
  level?: string
  eventType?: string
  traceId?: string
  startTime?: string
  endTime?: string
  search?: string
  page?: number
  pageSize?: number
}

export const getLogs = createServerFn({ method: 'POST' })
  .inputValidator((data: LogFilters) => data)
  .handler(async ({ data }) => {
    try {
      const {
        appId,
        level,
        eventType,
        traceId,
        startTime,
        endTime,
        search,
        page = 1,
        pageSize = 20,
      } = data

      const conditions: SQL[] = []

      if (appId) {
        conditions.push(eq(logs.appId, appId))
      }

      if (level) {
        conditions.push(
          eq(logs.level, level as 'debug' | 'info' | 'warn' | 'error'),
        )
      }

      if (eventType) {
        conditions.push(ilike(logs.eventType, `%${eventType}%`))
      }

      if (traceId) {
        conditions.push(eq(logs.traceId, traceId))
      }

      if (startTime) {
        conditions.push(gte(logs.createdAt, new Date(startTime)))
      }

      if (endTime) {
        conditions.push(lte(logs.createdAt, new Date(endTime)))
      }

      if (search) {
        conditions.push(sql`${logs.eventData}::text ILIKE ${`%${search}%`}`)
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      // 查询总数
      const [countResult] = await db
        .select({ total: sql<number>`count(*)` })
        .from(logs)
        .where(where)

      const total = countResult?.total ?? 0

      // 查询日志列表
      const offset = (page - 1) * pageSize
      const logList = await db
        .select({
          id: logs.id,
          appId: logs.appId,
          traceId: logs.traceId,
          spanId: logs.spanId,
          parentSpanId: logs.parentSpanId,
          level: logs.level,
          eventType: logs.eventType,
          eventData: logs.eventData,
          appVersion: logs.appVersion,
          deviceId: logs.deviceId,
          os: logs.os,
          osVersion: logs.osVersion,
          deviceModel: logs.deviceModel,
          status: logs.status,
          durationMs: logs.durationMs,
          createdAt: logs.createdAt,
          appName: apps.name,
        })
        .from(logs)
        .leftJoin(apps, eq(logs.appId, apps.id))
        .where(where)
        .orderBy(desc(logs.createdAt))
        .limit(pageSize)
        .offset(offset)

      return {
        success: true,
        data: {
          logs: logList,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      }
    } catch (error) {
      console.error('Failed to get logs:', error)
      return { success: false, error: '获取日志失败' }
    }
  })

export const getApps = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const allApps = await db.query.apps.findMany({
      orderBy: [desc(apps.updatedAt)],
    })
    return { success: true, data: allApps }
  } catch (error) {
    console.error('Failed to get apps:', error)
    return { success: false, error: '获取应用列表失败' }
  }
})

export interface TraceSpan {
  id: number
  spanId: string
  parentSpanId: string | null
  level: string
  eventType: string
  eventData: unknown
  status: string | null
  durationMs: number | null
  createdAt: Date
  children: TraceSpan[]
}

export const getTraceByTraceId = createServerFn({ method: 'GET' })
  .inputValidator((data: string) => data)
  .handler(async ({ data: traceId }) => {
    try {
      const spans = await db
        .select({
          id: logs.id,
          spanId: logs.spanId,
          parentSpanId: logs.parentSpanId,
          level: logs.level,
          eventType: logs.eventType,
          eventData: logs.eventData,
          status: logs.status,
          durationMs: logs.durationMs,
          createdAt: logs.createdAt,
        })
        .from(logs)
        .where(eq(logs.traceId, traceId))
        .orderBy(logs.createdAt)

      // 构建树形结构
      const spanMap = new Map<string, TraceSpan>()
      const roots: TraceSpan[] = []

      // 先创建所有节点
      for (const span of spans) {
        spanMap.set(span.spanId, {
          ...span,
          children: [],
        })
      }

      // 再建立父子关系
      for (const span of spans) {
        const node = spanMap.get(span.spanId)!
        if (span.parentSpanId && spanMap.has(span.parentSpanId)) {
          spanMap.get(span.parentSpanId)!.children.push(node)
        } else {
          roots.push(node)
        }
      }

      return { success: true, data: roots }
    } catch (error) {
      console.error('Failed to get trace:', error)
      return { success: false, error: '获取链路数据失败' }
    }
  })

export interface LogStatsFilters {
  appId?: number
  startTime?: string
  endTime?: string
}

export interface LogStats {
  total: number
  byLevel: { level: string; count: number }[]
  errorRate: number
  trend: { hour: string; count: number }[]
}

export const getLogStats = createServerFn({ method: 'POST' })
  .inputValidator((data: LogStatsFilters) => data)
  .handler(async ({ data }): Promise<{ success: true; data: LogStats } | { success: false; error: string }> => {
    try {
      const { appId, startTime, endTime } = data

      const conditions: SQL[] = []

      if (appId) {
        conditions.push(eq(logs.appId, appId))
      }

      if (startTime) {
        conditions.push(gte(logs.createdAt, new Date(startTime)))
      }

      if (endTime) {
        conditions.push(lte(logs.createdAt, new Date(endTime)))
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined

      // 总数
      const [totalResult] = await db
        .select({ total: sql<number>`count(*)` })
        .from(logs)
        .where(where)

      const total = totalResult?.total ?? 0

      // 按级别分组
      const byLevel = await db
        .select({
          level: logs.level,
          count: sql<number>`count(*)`,
        })
        .from(logs)
        .where(where)
        .groupBy(logs.level)

      // 错误率
      const [errorResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(logs)
        .where(
          where
            ? and(where, eq(logs.level, 'error'))
            : eq(logs.level, 'error'),
        )

      const errorCount = errorResult?.count ?? 0
      const errorRate = total > 0 ? Math.round((errorCount / total) * 100) : 0

      // 趋势数据（最近 24 小时，按小时分组）
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const trendConditions: SQL[] = [gte(logs.createdAt, oneDayAgo)]
      if (appId) {
        trendConditions.push(eq(logs.appId, appId))
      }

      const trend = await db
        .select({
          hour: sql<string>`to_char(${logs.createdAt}, 'HH24:00')`,
          count: sql<number>`count(*)`,
        })
        .from(logs)
        .where(and(...trendConditions))
        .groupBy(sql`to_char(${logs.createdAt}, 'HH24:00')`)
        .orderBy(sql`to_char(${logs.createdAt}, 'HH24:00')`)

      return {
        success: true,
        data: { total, byLevel, errorRate, trend },
      }
    } catch (error) {
      console.error('Failed to get log stats:', error)
      return { success: false, error: '获取统计数据失败' }
    }
  })
