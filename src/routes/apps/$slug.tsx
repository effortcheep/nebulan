import { createFileRoute, Link } from '@tanstack/solid-router'
import { createSignal, Show, For } from 'solid-js'
import type { App, Version } from '../../types'
import { formatFileSize, formatDate } from '../../types'

const mockApps: Record<string, App> = {
  'nebula-work': {
    id: 1,
    name: 'Nebula Work',
    slug: 'nebula-work',
    description:
      '企业内部协同办公平台，支持即时通讯、日程管理、文档协作等功能。打造高效移动办公体验，让团队协作更简单。',
    iconUrl: null,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-03-20T10:30:00Z',
  },
  'nebula-crm': {
    id: 2,
    name: 'Nebula CRM',
    slug: 'nebula-crm',
    description: '客户关系管理系统，帮助销售团队高效管理客户资源和商机。',
    iconUrl: null,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-03-18T14:20:00Z',
  },
  'nebula-approval': {
    id: 3,
    name: 'Nebula Approval',
    slug: 'nebula-approval',
    description: '移动审批应用，支持请假、报销、采购等各类审批流程。',
    iconUrl: null,
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: '2024-03-15T16:45:00Z',
  },
}

const mockVersions: Record<number, Version[]> = {
  1: [
    {
      id: 1,
      appId: 1,
      version: '2.5.0',
      platform: 'android',
      downloadUrl: '#',
      fileSize: 45_000_000,
      changelog: '新增视频会议功能\n优化消息同步速度\n修复已知问题',
      isActive: 1,
      createdAt: '2024-03-20T10:30:00Z',
    },
    {
      id: 2,
      appId: 1,
      version: '2.4.1',
      platform: 'ios',
      downloadUrl: 'https://testflight.apple.com/join/xxxx',
      fileSize: 52_000_000,
      changelog: '适配 iOS 17\n优化性能表现',
      isActive: 1,
      createdAt: '2024-03-15T09:00:00Z',
    },
    {
      id: 6,
      appId: 1,
      version: '2.4.0',
      platform: 'android',
      downloadUrl: '#',
      fileSize: 44_000_000,
      changelog: '全新界面设计\n新增暗黑模式',
      isActive: 1,
      createdAt: '2024-03-01T11:00:00Z',
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
      changelog: '新增数据分析报表\n支持导出 Excel',
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
      changelog: '新增数据分析报表\n支持导出 Excel',
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
      changelog: '修复闪退问题\n优化表单填写体验',
      isActive: 1,
      createdAt: '2024-03-15T16:45:00Z',
    },
  ],
}

export const Route = createFileRoute('/apps/$slug')({
  component: AppDetailPage,
})

function AppDetailPage() {
  const params = Route.useParams()
  const [expandedVersion, setExpandedVersion] = createSignal<number | null>(
    null,
  )

  const app = () => mockApps[params().slug]
  const versions = () => mockVersions[app().id] ?? []
  const latestAndroid = () => versions().find((v) => v.platform === 'android')
  const latestIOS = () => versions().find((v) => v.platform === 'ios')

  return (
    <div class="page-container safe-bottom">
      <Show
        when={app()}
        fallback={
          <div class="flex items-center justify-center min-h-[60vh]">
            <div class="text-[var(--text-muted)]">应用不存在</div>
          </div>
        }
      >
        {(appData) => (
          <>
            <Link
              to="/apps"
              class="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
            >
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
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              返回应用列表
            </Link>

            <section class="app-card p-5 sm:p-8 mb-6">
              <div class="flex flex-col items-center sm:items-start gap-4 sm:gap-6">
                <div class="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-3xl sm:text-5xl font-bold text-white shadow-xl shadow-blue-500/25">
                  {appData().name.charAt(0).toUpperCase()}
                </div>

                <div class="text-center sm:text-left w-full">
                  <h1 class="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2 sm:mb-3">
                    {appData().name}
                  </h1>
                  <p class="text-sm sm:text-base text-[var(--text-secondary)] mb-5 sm:mb-6 leading-relaxed">
                    {appData().description}
                  </p>

                  <div class="flex flex-col sm:flex-row gap-3">
                    {latestAndroid() && (
                      <button
                        class="btn-primary"
                        onClick={() => handleDownload(latestAndroid()!)}
                      >
                        <svg
                          class="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0225 3.503c-1.4655-.6696-3.1129-1.0462-4.8748-1.0462s-3.4093.3766-4.8748 1.0462L4.8453 5.4465a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589.3432 18.6617h23.3136c0-4.0028-2.3457-7.475-5.7795-9.3403" />
                        </svg>
                        <span>下载 Android</span>
                        <span class="text-sm opacity-75 hidden sm:inline">
                          {formatFileSize(latestAndroid()!.fileSize)}
                        </span>
                      </button>
                    )}

                    {latestIOS() && (
                      <a
                        href={latestIOS()!.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn-secondary"
                      >
                        <svg
                          class="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                        </svg>
                        <span>TestFlight 安装</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 class="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">
                版本历史
              </h2>

              <div class="space-y-3 sm:space-y-4">
                <For each={versions()}>
                  {(version) => (
                    <div class="app-card p-4 sm:p-5">
                      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div class="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span class="version-tag">v{version.version}</span>
                          <span
                            class={`platform-badge platform-${version.platform}`}
                          >
                            {version.platform === 'ios' ? 'iOS' : 'Android'}
                          </span>
                          <span class="text-xs sm:text-sm text-[var(--text-muted)]">
                            {formatDate(version.createdAt)}
                          </span>
                        </div>

                        <div class="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
                          <span class="text-xs sm:text-sm text-[var(--text-muted)] sm:mr-2">
                            {formatFileSize(version.fileSize)}
                          </span>
                          <div class="flex items-center gap-2">
                            <button
                              class="text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium px-2 py-1 rounded-lg hover:bg-[var(--primary)]/5 transition-colors"
                              onClick={() =>
                                setExpandedVersion(
                                  expandedVersion() === version.id
                                    ? null
                                    : version.id,
                                )
                              }
                            >
                              {expandedVersion() === version.id
                                ? '收起'
                                : '详情'}
                            </button>
                            <button
                              class="btn-primary py-2 px-3 sm:py-2.5 sm:px-4 text-xs sm:text-sm"
                              onClick={() => handleDownload(version)}
                            >
                              下载
                            </button>
                          </div>
                        </div>
                      </div>

                      <Show when={expandedVersion() === version.id}>
                        <div class="mt-3 sm:mt-4 pt-3 border-t border-[var(--border-light)]">
                          <h4 class="text-xs sm:text-sm font-semibold text-[var(--text-primary)] mb-2">
                            更新日志
                          </h4>
                          <div class="text-xs sm:text-sm text-[var(--text-secondary)] whitespace-pre-line">
                            {version.changelog || '暂无更新日志'}
                          </div>
                        </div>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </section>
          </>
        )}
      </Show>
    </div>
  )
}

function handleDownload(version: Version) {
  console.log('下载:', version.platform, version.version)

  if (version.platform === 'android') {
    window.location.href = version.downloadUrl
  } else {
    window.open(version.downloadUrl, '_blank')
  }
}
