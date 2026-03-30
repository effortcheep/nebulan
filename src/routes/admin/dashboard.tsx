import { createFileRoute, useNavigate } from '@tanstack/solid-router'
import { createSignal, Show, For } from 'solid-js'

// 模拟数据
const mockApps = [
  {
    id: 1,
    name: 'Nebula Work',
    slug: 'nebula-work',
    description: '企业内部协同办公平台',
    versionCount: 3,
    downloadCount: 128,
  },
  {
    id: 2,
    name: 'Nebula CRM',
    slug: 'nebula-crm',
    description: '客户关系管理系统',
    versionCount: 2,
    downloadCount: 85,
  },
  {
    id: 3,
    name: 'Nebula Approval',
    slug: 'nebula-approval',
    description: '移动审批应用',
    versionCount: 1,
    downloadCount: 42,
  },
]

const mockVersions = [
  {
    id: 1,
    appId: 1,
    version: '2.5.0',
    platform: 'android' as const,
    fileSize: 45_000_000,
    changelog: '新增视频会议功能',
    createdAt: '2024-03-20',
  },
  {
    id: 2,
    appId: 1,
    version: '2.4.1',
    platform: 'ios' as const,
    fileSize: 52_000_000,
    changelog: '适配 iOS 17',
    createdAt: '2024-03-15',
  },
  {
    id: 3,
    appId: 2,
    version: '1.8.0',
    platform: 'android' as const,
    fileSize: 38_000_000,
    changelog: '新增报表功能',
    createdAt: '2024-03-18',
  },
]

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  const navigate = useNavigate()
  const [currentView, setCurrentView] = createSignal<
    'list' | 'add-app' | 'edit-app' | 'versions'
  >('list')
  const [selectedAppId, setSelectedAppId] = createSignal<number | null>(null)
  const [apps] = createSignal(mockApps)
  const [showUploadModal, setShowUploadModal] = createSignal(false)

  // 表单状态
  const [appName, setAppName] = createSignal('')
  const [appSlug, setAppSlug] = createSignal('')
  const [appDescription, setAppDescription] = createSignal('')
  const [uploadPlatform, setUploadPlatform] = createSignal<'android' | 'ios'>(
    'android',
  )
  const [uploadVersion, setUploadVersion] = createSignal('')
  const [uploadFile, setUploadFile] = createSignal<File | null>(null)
  const [testflightUrl, setTestflightUrl] = createSignal('')
  const [changelog, setChangelog] = createSignal('')

  const handleLogout = () => {
    navigate({ to: '/admin' })
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const totalDownloads = () =>
    apps().reduce((sum, app) => sum + app.downloadCount, 0)
  const totalVersions = () =>
    apps().reduce((sum, app) => sum + app.versionCount, 0)

  const getAppVersions = (appId: number) =>
    mockVersions.filter((v) => v.appId === appId)

  const handleAddApp = () => {
    setAppName('')
    setAppSlug('')
    setAppDescription('')
    setCurrentView('add-app')
  }

  const handleEditApp = (appId: number) => {
    const app = apps().find((a) => a.id === appId)
    if (app) {
      setAppName(app.name)
      setAppSlug(app.slug)
      setAppDescription(app.description || '')
      setSelectedAppId(appId)
      setCurrentView('edit-app')
    }
  }

  const handleManageVersions = (appId: number) => {
    setSelectedAppId(appId)
    setCurrentView('versions')
  }

  const handleSaveApp = (e: Event) => {
    e.preventDefault()
    // TODO: 保存应用
    console.log('保存应用:', {
      name: appName(),
      slug: appSlug(),
      description: appDescription(),
    })
    setCurrentView('list')
  }

  const handleUploadVersion = (e: Event) => {
    e.preventDefault()
    // TODO: 上传版本
    console.log('上传版本:', {
      platform: uploadPlatform(),
      version: uploadVersion(),
      file: uploadFile(),
      testflightUrl: testflightUrl(),
      changelog: changelog(),
    })
    setShowUploadModal(false)
    setUploadVersion('')
    setUploadFile(null)
    setTestflightUrl('')
    setChangelog('')
  }

  return (
    <div class="min-h-screen bg-[var(--bg-primary)]">
        {/* Header */}
        <header class="bg-white border-b border-[var(--border-light)] sticky top-0 z-50">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-16">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                  <svg
                    class="w-6 h-6 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                  </svg>
                </div>
                <span class="text-xl font-bold text-[var(--text-primary)]">
                  管理后台
                </span>
              </div>

              <div class="flex items-center gap-4">
                <a
                  href="/apps"
                  target="_blank"
                  class="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  查看前端
                </a>
                <button
                  onClick={handleLogout}
                  class="text-sm text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors"
                >
                  退出登录
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 面包屑导航 */}
          <Show when={currentView() !== 'list'}>
            <nav class="mb-6">
              <button
                onClick={() => setCurrentView('list')}
                class="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                返回列表
              </button>
            </nav>
          </Show>

          {/* 应用列表视图 */}
          <Show when={currentView() === 'list'}>
            <div class="space-y-8">
              {/* 统计卡片 */}
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="app-card p-5">
                  <div class="text-sm text-[var(--text-secondary)] mb-1">
                    应用总数
                  </div>
                  <div class="text-3xl font-bold text-[var(--text-primary)]">
                    {apps().length}
                  </div>
                </div>
                <div class="app-card p-5">
                  <div class="text-sm text-[var(--text-secondary)] mb-1">
                    版本总数
                  </div>
                  <div class="text-3xl font-bold text-[var(--primary)]">
                    {totalVersions()}
                  </div>
                </div>
                <div class="app-card p-5">
                  <div class="text-sm text-[var(--text-secondary)] mb-1">
                    总下载量
                  </div>
                  <div class="text-3xl font-bold text-[var(--success)]">
                    {totalDownloads()}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div class="flex flex-col sm:flex-row gap-3">
                <button onClick={handleAddApp} class="btn-primary">
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  新建应用
                </button>
              </div>

              {/* 应用列表 */}
              <div>
                <h2 class="text-lg font-bold text-[var(--text-primary)] mb-4">
                  应用管理
                </h2>
                <div class="app-card overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead class="bg-[var(--bg-hover)]">
                        <tr>
                          <th class="text-left px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                            应用名称
                          </th>
                          <th class="text-left px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                            标识
                          </th>
                          <th class="text-center px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                            版本数
                          </th>
                          <th class="text-center px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                            下载量
                          </th>
                          <th class="text-right px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-[var(--border-light)]">
                        <For each={apps()}>
                          {(app) => (
                            <tr class="hover:bg-[var(--bg-hover)] transition-colors">
                              <td class="px-4 py-3">
                                <div class="font-medium text-[var(--text-primary)]">
                                  {app.name}
                                </div>
                                <div class="text-xs text-[var(--text-muted)] mt-0.5">
                                  {app.description}
                                </div>
                              </td>
                              <td class="px-4 py-3 text-sm text-[var(--text-secondary)]">
                                {app.slug}
                              </td>
                              <td class="px-4 py-3 text-center">
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {app.versionCount}
                                </span>
                              </td>
                              <td class="px-4 py-3 text-center text-sm text-[var(--text-secondary)]">
                                {app.downloadCount}
                              </td>
                              <td class="px-4 py-3 text-right">
                                <div class="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEditApp(app.id)}
                                    class="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium"
                                  >
                                    编辑
                                  </button>
                                  <button
                                    onClick={() => handleManageVersions(app.id)}
                                    class="text-sm text-[var(--success)] hover:text-green-700 font-medium"
                                  >
                                    版本
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </Show>

          {/* 添加/编辑应用视图 */}
          <Show
            when={currentView() === 'add-app' || currentView() === 'edit-app'}
          >
            <div class="max-w-2xl">
              <h1 class="text-2xl font-bold text-[var(--text-primary)] mb-6">
                {currentView() === 'add-app' ? '新建应用' : '编辑应用'}
              </h1>

              <form onSubmit={handleSaveApp} class="app-card p-6 space-y-6">
                <div>
                  <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    应用名称 <span class="text-[var(--error)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={appName()}
                    onInput={(e) => setAppName(e.currentTarget.value)}
                    class="input-modern"
                    placeholder="例如：Nebula Work"
                    required
                  />
                </div>

                <Show when={currentView() === 'add-app'}>
                  <div>
                    <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      应用标识 (slug) <span class="text-[var(--error)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={appSlug()}
                      onInput={(e) =>
                        setAppSlug(
                          e.currentTarget.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '-'),
                        )
                      }
                      class="input-modern"
                      placeholder="例如：nebula-work"
                      required
                    />
                    <p class="text-xs text-[var(--text-muted)] mt-1">
                      用于 URL，只能包含小写字母、数字和连字符
                    </p>
                  </div>
                </Show>

                <div>
                  <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    应用描述
                  </label>
                  <textarea
                    value={appDescription()}
                    onInput={(e) => setAppDescription(e.currentTarget.value)}
                    class="input-modern min-h-[100px] resize-y"
                    placeholder="简单描述这个应用的功能..."
                    rows={4}
                  />
                </div>

                <div class="flex justify-end gap-3 pt-4 border-t border-[var(--border-light)]">
                  <button
                    type="button"
                    onClick={() => setCurrentView('list')}
                    class="btn-secondary"
                  >
                    取消
                  </button>
                  <button type="submit" class="btn-primary">
                    {currentView() === 'add-app' ? '创建应用' : '保存修改'}
                  </button>
                </div>
              </form>
            </div>
          </Show>

          {/* 版本管理视图 */}
          <Show when={currentView() === 'versions'}>
            <div>
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 class="text-2xl font-bold text-[var(--text-primary)]">
                    版本管理
                  </h1>
                  <p class="text-sm text-[var(--text-secondary)]">
                    应用: {apps().find((a) => a.id === selectedAppId())?.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowUploadModal(true)}
                  class="btn-primary"
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  上传新版本
                </button>
              </div>

              {/* 版本列表 */}
              <div class="app-card overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-[var(--bg-hover)]">
                      <tr>
                        <th class="text-left px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                          版本号
                        </th>
                        <th class="text-left px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                          平台
                        </th>
                        <th class="text-left px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                          文件大小
                        </th>
                        <th class="text-left px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                          上传时间
                        </th>
                        <th class="text-right px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--border-light)]">
                      <For each={getAppVersions(selectedAppId()!)}>
                        {(v) => (
                          <tr class="hover:bg-[var(--bg-hover)] transition-colors">
                            <td class="px-4 py-3">
                              <span class="version-tag">v{v.version}</span>
                            </td>
                            <td class="px-4 py-3">
                              <span
                                class={`platform-badge platform-${v.platform}`}
                              >
                                {v.platform === 'ios' ? 'iOS' : 'Android'}
                              </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-[var(--text-secondary)]">
                              {formatFileSize(v.fileSize)}
                            </td>
                            <td class="px-4 py-3 text-sm text-[var(--text-secondary)]">
                              {v.createdAt}
                            </td>
                            <td class="px-4 py-3 text-right">
                              <button class="text-sm text-[var(--error)] hover:text-red-700 font-medium">
                                删除
                              </button>
                            </td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Show>
        </main>

        {/* 上传弹窗 */}
        <Show when={showUploadModal()}>
          <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div class="app-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div class="p-6">
                <div class="flex items-center justify-between mb-6">
                  <h2 class="text-xl font-bold text-[var(--text-primary)]">
                    上传新版本
                  </h2>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    class="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <svg
                      class="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleUploadVersion} class="space-y-5">
                  <div>
                    <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      平台 <span class="text-[var(--error)]">*</span>
                    </label>
                    <div class="flex gap-4">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="platform"
                          value="android"
                          checked={uploadPlatform() === 'android'}
                          onChange={() => setUploadPlatform('android')}
                          class="w-4 h-4 text-[var(--primary)]"
                        />
                        <span class="text-sm">Android (APK)</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="platform"
                          value="ios"
                          checked={uploadPlatform() === 'ios'}
                          onChange={() => setUploadPlatform('ios')}
                          class="w-4 h-4 text-[var(--primary)]"
                        />
                        <span class="text-sm">iOS (TestFlight)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      版本号 <span class="text-[var(--error)]">*</span>
                    </label>
                    <input
                      type="text"
                      value={uploadVersion()}
                      onInput={(e) => setUploadVersion(e.currentTarget.value)}
                      class="input-modern"
                      placeholder="例如：1.0.0"
                      required
                    />
                  </div>

                  <Show when={uploadPlatform() === 'android'}>
                    <div>
                      <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        APK 文件
                      </label>
                      <input
                        type="file"
                        accept=".apk"
                        onChange={(e) =>
                          setUploadFile(e.currentTarget.files?.[0] || null)
                        }
                        class="input-modern"
                      />
                      <Show when={uploadFile()}>
                        <p class="text-xs text-[var(--text-muted)] mt-1">
                          {uploadFile()!.name} (
                          {formatFileSize(uploadFile()!.size)})
                        </p>
                      </Show>
                    </div>
                  </Show>

                  <Show when={uploadPlatform() === 'ios'}>
                    <div>
                      <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        TestFlight 链接
                      </label>
                      <input
                        type="url"
                        value={testflightUrl()}
                        onInput={(e) => setTestflightUrl(e.currentTarget.value)}
                        class="input-modern"
                        placeholder="https://testflight.apple.com/join/xxxxx"
                      />
                    </div>
                  </Show>

                  <div>
                    <label class="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      更新日志
                    </label>
                    <textarea
                      value={changelog()}
                      onInput={(e) => setChangelog(e.currentTarget.value)}
                      class="input-modern min-h-[80px] resize-y"
                      placeholder="描述此版本的更新内容..."
                      rows={3}
                    />
                  </div>

                  <div class="flex justify-end gap-3 pt-4 border-t border-[var(--border-light)]">
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      class="btn-secondary"
                    >
                      取消
                    </button>
                    <button type="submit" class="btn-primary">
                      上传版本
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Show>
      </div>
    )
  }
