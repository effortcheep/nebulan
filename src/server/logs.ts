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
