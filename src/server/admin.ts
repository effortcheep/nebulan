import { createServerFn } from '@tanstack/solid-start'
import { db } from '../db'
import { apps, versions, users } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 管理员登录
export const adminLogin = createServerFn({ method: 'POST' }).handler(
  async (ctx: any) => {
    try {
      const { username, password } = ctx.payload || {}

      if (!username || !password) {
        return { success: false, error: '用户名和密码不能为空' }
      }

      const user = await db.query.users.findFirst({
        where: eq(users.username, username),
      })

      if (!user) {
        return { success: false, error: '用户名或密码错误' }
      }

      const isValid = await bcrypt.compare(password, user.passwordHash)

      if (!isValid) {
        return { success: false, error: '用户名或密码错误' }
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' },
      )

      return {
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
        },
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: '登录失败' }
    }
  },
)

// 创建应用
export const createApp = createServerFn({ method: 'POST' }).handler(
  async (ctx: any) => {
    try {
      const { name, slug, description, iconUrl } = ctx.payload || {}

      if (!name || !slug) {
        return { success: false, error: '应用名称和标识不能为空' }
      }

      // 检查 slug 是否已存在
      const existing = await db.query.apps.findFirst({
        where: eq(apps.slug, slug),
      })

      if (existing) {
        return { success: false, error: '应用标识已存在' }
      }

      const [newApp] = await db
        .insert(apps)
        .values({
          name,
          slug,
          description,
          iconUrl,
        })
        .returning()

      return { success: true, data: newApp }
    } catch (error) {
      console.error('Create app failed:', error)
      return { success: false, error: '创建应用失败' }
    }
  },
)

// 更新应用
export const updateApp = createServerFn({ method: 'POST' }).handler(
  async (ctx: any) => {
    try {
      const { id, name, description, iconUrl } = ctx.payload || {}

      const [updated] = await db
        .update(apps)
        .set({
          name,
          description,
          iconUrl,
          updatedAt: new Date(),
        })
        .where(eq(apps.id, id))
        .returning()

      return { success: true, data: updated }
    } catch (error) {
      console.error('Update app failed:', error)
      return { success: false, error: '更新应用失败' }
    }
  },
)

// 创建版本
export const createVersion = createServerFn({ method: 'POST' }).handler(
  async (ctx: any) => {
    try {
      const { appId, version, platform, downloadUrl, fileSize, changelog } =
        ctx.payload || {}

      if (!appId || !version || !platform || !downloadUrl) {
        return { success: false, error: '缺少必要参数' }
      }

      const [newVersion] = await db
        .insert(versions)
        .values({
          appId,
          version,
          platform,
          downloadUrl,
          fileSize,
          changelog,
        })
        .returning()

      // 更新应用的 updatedAt
      await db
        .update(apps)
        .set({ updatedAt: new Date() })
        .where(eq(apps.id, appId))

      return { success: true, data: newVersion }
    } catch (error) {
      console.error('Create version failed:', error)
      return { success: false, error: '创建版本失败' }
    }
  },
)

// 删除版本
export const deleteVersion = createServerFn({ method: 'POST' }).handler(
  async (ctx: any) => {
    try {
      const { id } = ctx.payload || {}

      await db.delete(versions).where(eq(versions.id, id))

      return { success: true }
    } catch (error) {
      console.error('Delete version failed:', error)
      return { success: false, error: '删除版本失败' }
    }
  },
)

// 获取所有应用（管理端）
export const getAllAppsAdmin = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const allApps = await db.query.apps.findMany({
        orderBy: [desc(apps.updatedAt)],
      })

      // 获取每个应用的版本数和下载数
      const appsWithStats = await Promise.all(
        allApps.map(async (app) => {
          const appVersions = await db.query.versions.findMany({
            where: eq(versions.appId, app.id),
            orderBy: [desc(versions.createdAt)],
          })

          return {
            ...app,
            versions: appVersions,
            versionCount: appVersions.length,
          }
        }),
      )

      return { success: true, data: appsWithStats }
    } catch (error) {
      console.error('Failed to get apps:', error)
      return { success: false, error: '获取应用列表失败' }
    }
  },
)
