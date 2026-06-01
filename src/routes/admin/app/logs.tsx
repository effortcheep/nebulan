import { createFileRoute } from '@tanstack/solid-router'
import { createSignal, Show, For, onMount } from 'solid-js'
import { getLogs, getApps, getTraceByTraceId, getLogStats } from '../../../server/logs'
import type { LogFilters, TraceSpan, LogStats } from '../../../server/logs'

export const Route = createFileRoute('/admin/app/logs')({
  component: AdminLogsPage,
})

function AdminLogsPage() {
  const [logs, setLogs] = createSignal<any[]>([])
  const [apps, setApps] = createSignal<any[]>([])
  const [total, setTotal] = createSignal(0)
  const [page, setPage] = createSignal(1)
  const [totalPages, setTotalPages] = createSignal(1)
  const [loading, setLoading] = createSignal(false)

  // 筛选状态
  const [filterAppId, setFilterAppId] = createSignal<number | undefined>()
  const [filterLevel, setFilterLevel] = createSignal<string>('')
  const [filterEventType, setFilterEventType] = createSignal('')
  const [filterTraceId, setFilterTraceId] = createSignal('')
  const [filterStartTime, setFilterStartTime] = createSignal('')
  const [filterEndTime, setFilterEndTime] = createSignal('')
  const [filterSearch, setFilterSearch] = createSignal('')

  // 链路追踪状态
  const [selectedTraceId, setSelectedTraceId] = createSignal<string | null>(
    null,
  )
  const [traceTree, setTraceTree] = createSignal<TraceSpan[]>([])
  const [traceLoading, setTraceLoading] = createSignal(false)
  const [expandedSpans, setExpandedSpans] = createSignal<Set<string>>(
    new Set(),
  )

  // 统计状态
  const [stats, setStats] = createSignal<LogStats | null>(null)

  const PAGE_SIZE = 20

  const loadApps = async () => {
    const result = (await getApps()) as { success: boolean; data?: unknown[] }
    if (result.success && result.data) {
      setApps(result.data)
    }
  }

  const loadLogs = async () => {
    setLoading(true)
    try {
      const filters: LogFilters = {
        page: page(),
        pageSize: PAGE_SIZE,
      }

      if (filterAppId()) filters.appId = filterAppId()
      if (filterLevel()) filters.level = filterLevel()
      if (filterEventType()) filters.eventType = filterEventType()
      if (filterTraceId()) filters.traceId = filterTraceId()
      if (filterStartTime()) filters.startTime = filterStartTime()
      if (filterEndTime()) filters.endTime = filterEndTime()
      if (filterSearch()) filters.search = filterSearch()

      const result = await getLogs({ data: filters })
      if (result.success && result.data) {
        setLogs(result.data.logs)
        setTotal(result.data.total)
        setTotalPages(result.data.totalPages)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadTrace = async (traceId: string) => {
    setTraceLoading(true)
    setSelectedTraceId(traceId)
    setExpandedSpans(new Set<string>())
    try {
      const result = await getTraceByTraceId({ data: traceId })
      if (result.success && result.data) {
        setTraceTree(result.data)
        // 默认展开所有顶层节点
        const topIds = result.data.map((s: TraceSpan) => s.spanId) as string[]
        setExpandedSpans(new Set<string>(topIds))
      }
    } finally {
      setTraceLoading(false)
    }
  }

  const toggleSpan = (spanId: string) => {
    setExpandedSpans((prev) => {
      const next = new Set(prev)
      if (next.has(spanId)) {
        next.delete(spanId)
      } else {
        next.add(spanId)
      }
      return next
    })
  }

  const closeTrace = () => {
    setSelectedTraceId(null)
    setTraceTree([])
  }

  const loadStats = async () => {
    try {
      const filters: { appId?: number; startTime?: string; endTime?: string } =
        {}
      if (filterAppId()) filters.appId = filterAppId()
      if (filterStartTime()) filters.startTime = filterStartTime()
      if (filterEndTime()) filters.endTime = filterEndTime()

      const result = (await getLogStats({ data: filters })) as {
        success: boolean
        data?: LogStats
      }
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch {
      // ignore
    }
  }

  onMount(() => {
    loadApps()
    loadLogs()
    loadStats()
  })

  const handleSearch = () => {
    setPage(1)
    loadLogs()
    loadStats()
  }

  const handleReset = () => {
    setFilterAppId(undefined)
    setFilterLevel('')
    setFilterEventType('')
    setFilterTraceId('')
    setFilterStartTime('')
    setFilterEndTime('')
    setFilterSearch('')
    setPage(1)
    setTimeout(() => loadLogs(), 0)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    loadLogs()
  }

  const formatTime = (date: Date | string) => {
    const d = new Date(date)
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const truncateJson = (data: unknown, maxLen = 80) => {
    if (!data) return '-'
    const str = JSON.stringify(data)
    return str.length > maxLen ? str.substring(0, maxLen) + '...' : str
  }

  const levelColor = (level: string) => {
    switch (level) {
      case 'debug':
        return 'bg-gray-100 text-gray-700'
      case 'info':
        return 'bg-blue-100 text-blue-700'
      case 'warn':
        return 'bg-yellow-100 text-yellow-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div class="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header class="bg-white border-b border-[var(--border-light)] sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-16">
            <div class="flex items-center gap-3">
              <a
                href="/admin/dashboard"
                class="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center"
              >
                <svg
                  class="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </a>
              <span class="text-xl font-bold text-[var(--text-primary)]">
                日志管理
              </span>
            </div>

            <div class="flex items-center gap-4">
              <a
                href="/admin/dashboard"
                class="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                应用管理
              </a>
              <a
                href="/apps"
                target="_blank"
                class="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                查看前端
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 筛选栏 */}
        <div class="app-card p-5 mb-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* App 选择 */}
            <div>
              <label class="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                应用
              </label>
              <select
                value={filterAppId() ?? ''}
                onChange={(e) =>
                  setFilterAppId(
                    e.currentTarget.value
                      ? Number(e.currentTarget.value)
                      : undefined,
                  )
                }
                class="input-modern w-full"
              >
                <option value="">全部应用</option>
                <For each={apps()}>
                  {(app) => <option value={app.id}>{app.name}</option>}
                </For>
              </select>
            </div>

            {/* 级别 */}
            <div>
              <label class="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                日志级别
              </label>
              <select
                value={filterLevel()}
                onChange={(e) => setFilterLevel(e.currentTarget.value)}
                class="input-modern w-full"
              >
                <option value="">全部级别</option>
                <option value="debug">debug</option>
                <option value="info">info</option>
                <option value="warn">warn</option>
                <option value="error">error</option>
              </select>
            </div>

            {/* 事件类型 */}
            <div>
              <label class="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                事件类型
              </label>
              <input
                type="text"
                value={filterEventType()}
                onInput={(e) => setFilterEventType(e.currentTarget.value)}
                class="input-modern w-full"
                placeholder="如 form_submit"
              />
            </div>

            {/* Trace ID */}
            <div>
              <label class="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                Trace ID
              </label>
              <input
                type="text"
                value={filterTraceId()}
                onInput={(e) => setFilterTraceId(e.currentTarget.value)}
                class="input-modern w-full"
                placeholder="链路追踪 ID"
              />
            </div>

            {/* 时间范围 */}
            <div>
              <label class="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                开始时间
              </label>
              <input
                type="datetime-local"
                value={filterStartTime()}
                onInput={(e) => setFilterStartTime(e.currentTarget.value)}
                class="input-modern w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                结束时间
              </label>
              <input
                type="datetime-local"
                value={filterEndTime()}
                onInput={(e) => setFilterEndTime(e.currentTarget.value)}
                class="input-modern w-full"
              />
            </div>

            {/* 全文搜索 */}
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                搜索 event_data
              </label>
              <input
                type="text"
                value={filterSearch()}
                onInput={(e) => setFilterSearch(e.currentTarget.value)}
                class="input-modern w-full"
                placeholder="关键词搜索..."
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-[var(--border-light)]">
            <button onClick={handleReset} class="btn-secondary">
              重置
            </button>
            <button onClick={handleSearch} class="btn-primary">
              搜索
            </button>
          </div>
        </div>

        {/* 统计面板 */}
        <Show when={stats()}>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div class="app-card p-4">
              <div class="text-sm text-[var(--text-secondary)] mb-1">
                日志总量
              </div>
              <div class="text-2xl font-bold text-[var(--text-primary)]">
                {stats()!.total}
              </div>
            </div>
            <div class="app-card p-4">
              <div class="text-sm text-[var(--text-secondary)] mb-1">
                错误率
              </div>
              <div
                class={`text-2xl font-bold ${stats()!.errorRate > 10 ? 'text-[var(--error)]' : 'text-[var(--success)]'}`}
              >
                {stats()!.errorRate}%
              </div>
            </div>
            <For each={stats()!.byLevel}>
              {(item) => (
                <div class="app-card p-4">
                  <div class="text-sm text-[var(--text-secondary)] mb-1">
                    {item.level}
                  </div>
                  <div class="text-2xl font-bold text-[var(--text-primary)]">
                    {item.count}
                  </div>
                </div>
              )}
            </For>
          </div>

          {/* 趋势图 */}
          <Show when={stats()!.trend.length > 0}>
            <div class="app-card p-4 mb-6">
              <div class="text-sm font-medium text-[var(--text-primary)] mb-3">
                最近 24 小时趋势
              </div>
              <div class="flex items-end gap-1 h-20">
                <For each={stats()!.trend}>
                  {(item) => {
                    const maxCount = Math.max(
                      ...stats()!.trend.map((t) => t.count),
                    )
                    const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                    return (
                      <div class="flex-1 flex flex-col items-center gap-1">
                        <div class="text-xs text-[var(--text-muted)]">
                          {item.count}
                        </div>
                        <div
                          class="w-full bg-[var(--primary)] rounded-t"
                          style={{ height: `${Math.max(height, 4)}%` }}
                        />
                        <div class="text-xs text-[var(--text-muted)]">
                          {item.hour}
                        </div>
                      </div>
                    )
                  }}
                </For>
              </div>
            </div>
          </Show>
        </Show>

        {/* 日志列表统计 */}
        <div class="flex items-center justify-between mb-4">
          <div class="text-sm text-[var(--text-secondary)]">
            共 {total()} 条日志
          </div>
          <div class="text-sm text-[var(--text-muted)]">
            第 {page()} / {totalPages()} 页
          </div>
        </div>

        {/* 日志列表 */}
        <div class="app-card overflow-hidden">
          <Show
            when={!loading()}
            fallback={
              <div class="p-8 text-center text-[var(--text-secondary)]">
                加载中...
              </div>
            }
          >
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-[var(--bg-hover)]">
                  <tr>
                    <th class="text-left px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                      时间
                    </th>
                    <th class="text-left px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                      应用
                    </th>
                    <th class="text-center px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                      级别
                    </th>
                    <th class="text-left px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                      事件类型
                    </th>
                    <th class="text-left px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                      设备
                    </th>
                    <th class="text-left px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                      Trace ID
                    </th>
                    <th class="text-left px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                      摘要
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[var(--border-light)]">
                  <For
                    each={logs()}
                    fallback={
                      <tr>
                        <td
                          colspan="7"
                          class="px-4 py-8 text-center text-[var(--text-secondary)]"
                        >
                          暂无日志数据
                        </td>
                      </tr>
                    }
                  >
                    {(log) => (
                      <tr class="hover:bg-[var(--bg-hover)] transition-colors">
                        <td class="px-4 py-3 text-sm text-[var(--text-secondary)] whitespace-nowrap">
                          {formatTime(log.createdAt)}
                        </td>
                        <td class="px-4 py-3 text-sm text-[var(--text-primary)]">
                          {log.appName || '-'}
                        </td>
                        <td class="px-4 py-3 text-center">
                          <span
                            class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelColor(log.level)}`}
                          >
                            {log.level}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-sm text-[var(--text-primary)] font-mono">
                          {log.eventType}
                        </td>
                        <td class="px-4 py-3 text-sm text-[var(--text-secondary)]">
                          <div>{log.deviceModel || '-'}</div>
                          <div class="text-xs text-[var(--text-muted)]">
                            {log.os} {log.osVersion}
                          </div>
                        </td>
                        <td class="px-4 py-3 text-sm font-mono">
                          <button
                            onClick={() => loadTrace(log.traceId)}
                            class="text-[var(--primary)] hover:text-[var(--primary-dark)] hover:underline cursor-pointer text-xs"
                          >
                            {log.traceId}
                          </button>
                        </td>
                        <td class="px-4 py-3 text-sm text-[var(--text-secondary)] max-w-xs truncate">
                          {truncateJson(log.eventData)}
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </div>

        {/* 分页 */}
        <Show when={totalPages() > 1}>
          <div class="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(page() - 1)}
              disabled={page() <= 1}
              class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span class="text-sm text-[var(--text-secondary)] px-4">
              {page()} / {totalPages()}
            </span>
            <button
              onClick={() => handlePageChange(page() + 1)}
              disabled={page() >= totalPages()}
              class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </Show>
      </main>

      {/* 链路追踪详情面板 */}
      <Show when={selectedTraceId()}>
        <div class="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div class="bg-white w-full max-w-2xl h-full overflow-y-auto shadow-xl">
            {/* 面板头部 */}
            <div class="sticky top-0 bg-white border-b border-[var(--border-light)] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 class="text-lg font-bold text-[var(--text-primary)]">
                  链路追踪
                </h2>
                <p class="text-xs text-[var(--text-muted)] font-mono mt-1">
                  {selectedTraceId()}
                </p>
              </div>
              <button
                onClick={closeTrace}
                class="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1"
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

            {/* 面板内容 */}
            <div class="p-6">
              <Show
                when={!traceLoading()}
                fallback={
                  <div class="text-center py-8 text-[var(--text-secondary)]">
                    加载中...
                  </div>
                }
              >
                <Show
                  when={traceTree().length > 0}
                  fallback={
                    <div class="text-center py-8 text-[var(--text-secondary)]">
                      无链路数据
                    </div>
                  }
                >
                  <div class="space-y-1">
                    <For each={traceTree()}>
                      {(span) => (
                        <TraceNode
                          span={span}
                          depth={0}
                          expandedSpans={expandedSpans()}
                          onToggle={toggleSpan}
                        />
                      )}
                    </For>
                  </div>
                </Show>
              </Show>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

function TraceNode(props: {
  span: TraceSpan
  depth: number
  expandedSpans: Set<string>
  onToggle: (spanId: string) => void
}) {
  const hasChildren = () => props.span.children.length > 0
  const isExpanded = () => props.expandedSpans.has(props.span.spanId)

  const levelColor = (level: string) => {
    switch (level) {
      case 'debug':
        return 'bg-gray-100 text-gray-700'
      case 'info':
        return 'bg-blue-100 text-blue-700'
      case 'warn':
        return 'bg-yellow-100 text-yellow-700'
      case 'error':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const statusColor = (status: string | null) => {
    if (status === 'ok') return 'text-green-600'
    if (status === 'error') return 'text-red-600'
    return 'text-gray-500'
  }

  const formatJson = (data: unknown) => {
    if (!data) return '-'
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  return (
    <div>
      <div
        class="flex items-start gap-2 py-2 px-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
        style={{ 'padding-left': `${props.depth * 24 + 12}px` }}
        onClick={() => hasChildren() && props.onToggle(props.span.spanId)}
      >
        {/* 展开/折叠图标 */}
        <div class="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Show
            when={hasChildren()}
            fallback={<span class="w-2 h-2 rounded-full bg-gray-300" />}
          >
            <svg
              class={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isExpanded() ? 'rotate-90' : ''}`}
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
          </Show>
        </div>

        {/* 节点内容 */}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span
              class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${levelColor(props.span.level)}`}
            >
              {props.span.level}
            </span>
            <span class="font-mono text-sm text-[var(--text-primary)]">
              {props.span.eventType}
            </span>
            <Show when={props.span.status}>
              <span
                class={`text-xs font-medium ${statusColor(props.span.status)}`}
              >
                [{props.span.status}]
              </span>
            </Show>
            <Show when={props.span.durationMs}>
              <span class="text-xs text-[var(--text-muted)]">
                {props.span.durationMs}ms
              </span>
            </Show>
          </div>
          <div class="text-xs text-[var(--text-muted)] mt-1">
            span: {props.span.spanId}
          </div>
        </div>
      </div>

      {/* 展开的 event_data */}
      <Show when={isExpanded() && props.span.eventData}>
        <div
          class="mx-3 mb-2 rounded-lg bg-gray-50 border border-[var(--border-light)] overflow-hidden"
          style={{ 'margin-left': `${props.depth * 24 + 40}px` }}
        >
          <pre class="p-3 text-xs text-[var(--text-secondary)] font-mono whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
            {formatJson(props.span.eventData)}
          </pre>
        </div>
      </Show>

      {/* 子节点 */}
      <Show when={isExpanded() && hasChildren()}>
        <For each={props.span.children}>
          {(child) => (
            <TraceNode
              span={child}
              depth={props.depth + 1}
              expandedSpans={props.expandedSpans}
              onToggle={props.onToggle}
            />
          )}
        </For>
      </Show>
    </div>
  )
}
