import { createFileRoute, Link } from '@tanstack/solid-router'
import type { App, Version } from '../../types'
import { formatDate } from '../../types'

const mockApps: App[] = [
  {
    id: 1,
    name: 'Nebula Work',
    slug: 'nebula-work',
    description:
      '企业内部协同办公平台，支持即时通讯、日程管理、文档协作等功能。',
    iconUrl: null,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-03-20T10:30:00Z',
  },
  {
    id: 2,
    name: 'Nebula CRM',
    slug: 'nebula-crm',
    description: '客户关系管理系统，帮助销售团队高效管理客户资源和商机。',
    iconUrl: null,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-03-18T14:20:00Z',
  },
  {
    id: 3,
    name: 'Nebula Approval',
    slug: 'nebula-approval',
    description: '移动审批应用，支持请假、报销、采购等各类审批流程。',
    iconUrl: null,
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-03-15T16:45:00Z',
  },
]

const mockVersions: Record<number, Version[]> = {
  1: [
    {
      id: 1,
      appId: 1,
      version: '2.5.0',
      platform: 'android',
      downloadUrl: '#',
      fileSize: 45_000_000,
      changelog: '新增功能',
      isActive: 1,
      createdAt: '2024-03-20T10:30:00Z',
    },
    {
      id: 2,
      appId: 1,
      version: '2.4.1',
      platform: 'ios',
      downloadUrl: '#',
      fileSize: 52_000_000,
      changelog: '适配 iOS',
      isActive: 1,
      createdAt: '2024-03-15T09:00:00Z',
    },
  ],
  2: [
    {
      id: 3,
      appId: 2,
      version: '1.8.0',
      platform: 'android',
      downloadUrl: '#',
      fileSize: 38_000_000,
      changelog: '新增报表',
      isActive: 1,
      createdAt: '2024-03-18T14:20:00Z',
    },
    {
      id: 4,
      appId: 2,
      version: '1.8.0',
      platform: 'ios',
      downloadUrl: '#',
      fileSize: 41_000_000,
      changelog: '新增报表',
      isActive: 1,
      createdAt: '2024-03-18T14:20:00Z',
    },
  ],
  3: [
    {
      id: 5,
      appId: 3,
      version: '3.0.2',
      platform: 'android',
      downloadUrl: '#',
      fileSize: 28_000_000,
      changelog: '修复问题',
      isActive: 1,
      createdAt: '2024-03-15T16:45:00Z',
    },
  ],
}

export const Route = createFileRoute('/apps/')({
  component: AppsListPage,
})

function AppsListPage() {
  return (
    <div class="page-container safe-bottom">
      <section class="py-8 sm:py-12 text-center">
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/5 border border-[var(--primary)]/20 mb-6">
          <span class="w-2 h-2 rounded-full bg-[var(--success)]" />
          <span class="text-sm text-[var(--text-secondary)] font-medium">
            内部测试分发
          </span>
        </div>

        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-[var(--text-primary)]">
          应用分发平台
        </h1>

        <p class="text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-2">
          安全高效的内部应用测试与分发系统
        </p>
        <p class="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          支持 iOS TestFlight 与 Android APK 一键安装
        </p>
      </section>

      <section class="py-4">
        <div class="flex items-center justify-between mb-4 sm:mb-6">
          <h2 class="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            应用列表
          </h2>
          <span class="text-sm text-[var(--text-muted)]">
            {mockApps.length} 个应用
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {mockApps.map((app) => {
            const versions = mockVersions[app.id] ?? []
            const hasIOS = versions.some((v) => v.platform === 'ios')
            const hasAndroid = versions.some((v) => v.platform === 'android')

            return (
              <Link
                to="/apps/$slug"
                params={{ slug: app.slug }}
                class="app-card p-4 sm:p-5 block"
              >
                <div class="flex items-start gap-3 sm:gap-4">
                  <div class="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-lg shadow-blue-500/25">
                    {app.name.charAt(0).toUpperCase()}
                  </div>

                  <div class="flex-1 min-w-0">
                    <h3 class="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-1 truncate">
                      {app.name}
                    </h3>
                    <p class="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2 mb-2">
                      {app.description || '暂无描述'}
                    </p>

                    <div class="flex flex-wrap gap-1.5 sm:gap-2">
                      {hasIOS && (
                        <span class="platform-badge platform-ios">iOS</span>
                      )}
                      {hasAndroid && (
                        <span class="platform-badge platform-android">
                          Android
                        </span>
                      )}
                    </div>
                  </div>

                  <div class="flex-shrink-0 text-[var(--text-muted)]">
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>

                <div class="mt-3 sm:mt-4 pt-3 border-t border-[var(--border-light)] text-xs text-[var(--text-muted)]">
                  更新于 {formatDate(app.updatedAt)}
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
