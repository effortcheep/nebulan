# PRD: 日志采集与追踪服务

## Problem Statement

Nebulan 平台目前只有应用分发能力（上传/下载 App），无法获取客户端（移动端、其他终端）的运行数据。平台运营者无法了解：
- 用户在 App 中的操作行为（如表单提交、按钮点击）
- 接口请求和响应的实际数据
- 设备环境信息（OS、机型、网络状态）
- 业务流程的完整链路

这导致平台对客户端的运行状态完全黑盒，无法追踪问题、优化体验。

## Solution

为 Nebulan 增加一个日志采集服务，客户端通过 REST API 批量上报日志数据，平台 Admin 后台提供日志查看、链路追踪、统计分析和搜索能力。

## User Stories

1. 作为平台管理员，我希望客户端 App 能自动上报设备信息（OS、机型、App 版本），以便了解用户设备分布
2. 作为平台管理员，我希望客户端能上报用户操作事件（如"用户点击了提交按钮"），以便分析用户行为
3. 作为平台管理员，我希望客户端能上报接口请求数据（URL、请求体），以便排查接口问题
4. 作为平台管理员，我希望客户端能上报接口响应数据（状态码、响应体），以便监控接口健康状态
5. 作为平台管理员，我希望每条日志都有级别（debug/info/warn/error），以便按严重程度筛选
6. 作为平台管理员，我希望日志支持链路追踪（trace_id/span_id/parent_span_id），以便查看一个业务流程的完整调用链
7. 作为平台管理员，我希望在 Admin 后台看到日志列表，按时间倒序排列
8. 作为平台管理员，我希望按 App 筛选日志，只看某个 App 的上报数据
9. 作为平台管理员，我希望按日志级别筛选，快速定位 error 日志
10. 作为平台管理员，我希望按 trace_id 搜索，查看某个业务流程的完整链路
11. 作为平台管理员，我希望点击某条日志后展开整个 trace 的调用树，看到父子关系
12. 作为平台管理员，我希望看到统计面板：日志总量、错误率、接口耗时分布
13. 作为平台管理员，我希望对 event_data 内容进行全文搜索，定位特定业务数据
14. 作为平台管理员，我希望普通日志保留 7 天后自动清理，error 日志保留 30 天
15. 作为平台管理员，我希望每个 App 有一个唯一的 API Key，客户端上报时携带，防止未授权上报
16. 作为客户端开发者，我希望通过 HTTP POST 批量上报日志，减少网络请求次数
17. 作为平台管理员，我希望在 Admin Dashboard 中通过导航切换到日志管理页面

## Implementation Decisions

### Module 1: Logs Schema

**apps 表变更：**
- 新增 `api_key` 字段（varchar, 64 位，唯一），用于客户端上报认证
- 创建 App 时自动生成 api_key

**新建 `logs` 表：**

```
logs {
  id              serial PK
  app_id          integer FK -> apps.id
  trace_id        varchar(64)      -- 同一业务流程共享
  span_id         varchar(64)      -- 当前步骤唯一 ID
  parent_span_id  varchar(64)      -- 父步骤（顶层为空）
  level           log_level_enum   -- debug | info | warn | error
  event_type      varchar(100)     -- 事件类型，如 form_submit, api_request, api_response
  event_data      jsonb            -- 自由结构的事件数据
  app_version     varchar(50)      -- 客户端 App 版本
  device_id       varchar(128)     -- 设备唯一标识
  os              varchar(20)      -- ios | android
  os_version      varchar(20)      -- 系统版本
  device_model    varchar(100)     -- 设备型号
  status          varchar(10)      -- ok | error（接口调用场景）
  duration_ms     integer          -- 耗时（可选）
  created_at      timestamp        -- 日志产生时间
}
```

**索引策略：**
- `idx_logs_app_id` — 按 App 查询
- `idx_logs_trace_id` — 按链路查询
- `idx_logs_level` — 按级别筛选
- `idx_logs_created_at` — 按时间排序和清理
- `idx_logs_event_data` — GIN 索引，支持 JSONB 全文搜索

### Module 2: Log Ingestion API

**端点：** `POST /api/logs/ingest`

**认证：** Header `X-App-Key: <api_key>`

**请求体：**
```json
{
  "logs": [
    {
      "trace_id": "abc123",
      "span_id": "span-1",
      "parent_span_id": null,
      "level": "info",
      "event_type": "form_submit",
      "event_data": { "form": "order", "fields": {...} },
      "app_version": "1.2.0",
      "device_id": "device-xyz",
      "os": "android",
      "os_version": "14",
      "device_model": "Pixel 8",
      "status": "ok",
      "duration_ms": 230,
      "timestamp": "2024-03-20T10:30:00Z"
    }
  ]
}
```

**处理逻辑：**
1. 校验 X-App-Key，查找对应 App
2. 校验 logs 数组非空，单次最多 100 条
3. 校验每条日志必填字段（trace_id, span_id, level, event_type, device_id）
4. 批量 INSERT 到 logs 表
5. 返回 `{ success: true, accepted: <数量> }`

**错误响应：**
- 401: 无效的 App Key
- 400: 请求体格式错误或缺少必填字段
- 413: 单次上报超过 100 条

### Module 3: Log Query Service

**查询接口（Server Functions）：**

- `getLogs(filters)` — 分页查询日志列表
  - 筛选条件：app_id, level, event_type, trace_id, 时间范围
  - 排序：created_at DESC
  - 分页：offset + limit

- `getTraceByTraceId(trace_id)` — 获取完整链路
  - 查出同一 trace_id 的所有 span
  - 按 parent_span_id 组装树形结构
  - 返回树形 JSON

- `getLogStats(app_id, timeRange)` — 统计数据
  - 日志总量（按级别分组）
  - 错误率（error 数 / 总数）
  - 接口耗时分布（P50/P90/P99，基于 duration_ms）
  - 按时间粒度（小时/天）的趋势图数据

- `searchLogs(query, filters)` — 全文搜索
  - 对 event_data JSONB 字段做 LIKE 或全文搜索
  - 支持组合筛选条件

### Module 4: Log Cleanup

**定时任务：** 每天执行一次

**清理逻辑：**
- 删除 `created_at < NOW() - 7 days` 且 `level != 'error'` 的日志
- 删除 `created_at < NOW() - 30 days` 且 `level = 'error'` 的日志

**实现方式：** 使用 PostgreSQL 的 `pg_cron` 扩展或应用层定时任务（Node.js cron job）

### Module 5: Admin Logs UI

**路由：** `/admin/app/logs`

**页面结构：**

1. **顶部筛选栏**
   - App 下拉选择
   - 级别筛选（debug/info/warn/error 多选）
   - 事件类型筛选
   - 时间范围选择器
   - Trace ID 搜索框
   - 全文搜索输入框

2. **统计面板**（筛选栏下方）
   - 日志总量卡片（按级别分色显示）
   - 错误率卡片
   - 趋势图（日志量随时间变化）

3. **日志列表**（主体区域）
   - 表格列：时间、App、级别、事件类型、设备、摘要（event_data 截断）
   - 级别用颜色标签区分（debug 灰、info 蓝、warn 黄、error 红）
   - 点击行展开详情面板或跳转链路视图

4. **链路详情**（点击 trace_id 触发）
   - 树形展示该 trace 下的所有 span
   - 每个节点显示：事件类型、耗时、状态
   - 点击节点展开 event_data 详情

**导航：** 在 Admin Dashboard 顶部 header 添加"日志管理"入口链接

## Testing Decisions

不写测试。

## Out of Scope

1. **移动端 SDK** — 现阶段只提供 REST API，客户端自行集成上报逻辑，SDK 后续再做
2. **Admin 登录认证** — 日志页面暂不需要登录，后续统一处理
3. **实时推送/告警** — 不做 WebSocket 实时日志流，不做 error 告警通知
4. **日志导出** — 暂不做日志导出为 CSV/JSON 功能
5. **多租户隔离** — 当前所有 App 的日志在同一个 Admin 视图中可见，不做租户级隔离
6. **冷数据归档** — 暂不做日志归档到 OSS，只做定期删除

## Further Notes

- 日志数据量取决于接入 App 数量和用户量，初期 PostgreSQL 单表足够。如果数据量增长到百万级以上，需要考虑分区表（按 created_at 分区）或引入 ClickHouse 等 OLAP 方案
- JSONB 字段的全文搜索性能取决于数据量，初期用 LIKE 即可，后续可升级为 PostgreSQL 全文搜索（tsvector）或引入 Elasticsearch
- pg_cron 需要 PostgreSQL 扩展支持，如果云数据库不支持，改为应用层 node-cron 实现
