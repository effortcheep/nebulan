import { createServerFn } from '@tanstack/solid-start'
import { db } from '../db'
import { apps, versions, downloadStats } from '../db/schema'
import { eq, desc, sql } from 'drizzle-orm'

// 获取所有应用列表
export const getApps = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const allApps = await db.query.apps.findMany({
      orderBy: [desc(apps.updatedAt)],
    })

    // 获取每个应用的版本信息
    const appsWithVersions = await Promise.all(
      allApps.map(async (app) => {
        const appVersions = await db.query.versions.findMany({
          where: eq(versions.appId, app.id),
          orderBy: [desc(versions.createdAt)],
        })

        return {
          ...app,
          versions: appVersions,
        }
      }),
    )

    return { success: true, data: appsWithVersions }
  } catch (error) {
    console.error('Failed to get apps:', error)
    return { success: false, error: 'Failed to fetch apps' }
  }
})

// 根据 slug 获取应用详情
export const getAppBySlug = createServerFn({ method: 'GET' }).handler(
  async (ctx: { payload: string }) => {
    try {
      const slug = ctx.payload
      const app = await db.query.apps.findFirst({
        where: eq(apps.slug, slug),
      })

      if (!app) {
        return { success: false, error: 'App not found' }
      }

      const appVersions = await db.query.versions.findMany({
        where: eq(versions.appId, app.id),
        orderBy: [desc(versions.createdAt)],
      })

      return {
        success: true,
        data: {
          ...app,
          versions: appVersions,
        },
      }
    } catch (error) {
      console.error('Failed to get app:', error)
      return { success: false, error: 'Failed to fetch app' }
    }
  },
)

// 记录下载
export const recordDownload = createServerFn({ method: 'POST' }).handler(
  async (ctx: {
    payload: { versionId: number; ipAddress?: string; userAgent?: string }
  }) => {
    try {
      const { versionId, ipAddress, userAgent } = ctx.payload
      await db.insert(downloadStats).values({
        versionId,
        ipAddress,
        userAgent,
      })

      return { success: true }
    } catch (error) {
      console.error('Failed to record download:', error)
      return { success: false, error: 'Failed to record download' }
    }
  },
)

// 获取下载统计
export const getDownloadStats = createServerFn({ method: 'GET' }).handler(
  async (ctx: { payload: number }) => {
    try {
      const appId = ctx.payload
      // 获取该应用所有版本的下载统计
      const stats = await db
        .select({
          versionId: versions.id,
          version: versions.version,
          platform: versions.platform,
          downloadCount: sql<number>`count(${downloadStats.id})`,
        })
        .from(versions)
        .leftJoin(downloadStats, eq(versions.id, downloadStats.versionId))
        .where(eq(versions.appId, appId))
        .groupBy(versions.id, versions.version, versions.platform)
        .orderBy(desc(versions.createdAt))

      return { success: true, data: stats }
    } catch (error) {
      console.error('Failed to get download stats:', error)
      return { success: false, error: 'Failed to fetch stats' }
    }
  },
)
