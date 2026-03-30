# AGENTS.md - 代码规范指南

## 构建与开发命令

```bash
# 开发服务器 (端口 3000)
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# 预览生产构建
npm run preview

# 代码检查与格式化
npm run lint              # 运行 ESLint
npm run format            # 检查 Prettier 格式
npm run check             # 格式化并修复 ESLint 问题

# 测试
npm run test              # 使用 Vitest 运行所有测试
npx vitest run <path>     # 运行单个测试文件
npx vitest run --reporter=verbose  # 详细输出运行测试
```

## 技术栈

- **框架：** TanStack Start + TanStack Solid Router
- **UI 库：** SolidJS (v1.9.11)，启用 SSR
- **语言：** TypeScript (严格模式)
- **样式：** Tailwind CSS v4 + 自定义 CSS 变量
- **构建工具：** Vite
- **包管理器：** npm

## 代码风格规范

### TypeScript

- 启用严格模式及所有严格检查选项
- 目标：ES2022，模块：ESNext
- 包含 JSX 的文件使用 `.tsx` 扩展名
- 启用 `verbatimModuleSyntax` - 类型导入使用 `import type`
- JSX 导入源：`solid-js`

### 格式化 (Prettier)

- 不使用分号
- 使用单引号
- 使用尾随逗号（所有情况）
- 提交前运行 `npm run check`

### 命名规范

- 组件：PascalCase（如：`Header.tsx`、`UserProfile.tsx`）
- 函数：camelCase（如：`createSignal`、`handleClick`）
- 文件：组件使用 PascalCase，工具函数使用 camelCase
- CSS 类名：kebab-case（如：`nav-link`、`island-shell`）

### 导入规范

```typescript
// 分组导入：外部库在前，内部模块在后
import { createSignal } from 'solid-js'
import { Link } from '@tanstack/solid-router'
import Header from '../components/Header'

// 显式使用类型导入
import type { Component } from 'solid-js'
```

### 组件模式

```typescript
// 优先使用显式导出的函数式组件
export default function Header() {
  return <header>...</header>
}

// 使用 createSignal 管理响应式状态
import { createSignal } from 'solid-js'

function Counter() {
  const [count, setCount] = createSignal(0)
  return <button onClick={() => setCount(c => c + 1)}>{count()}</button>
}
```

### Tailwind CSS

- 使用 utility-first（工具类优先）方法
- 响应式前缀：`sm:`、`lg:` 等
- 在 `styles.css` 中通过 CSS 变量定义自定义设计令牌
- 配色方案：sea-ink、lagoon、palm、sand、foam
- 字体：Fraunces（衬线，标题）、Manrope（无衬线，正文）

### 错误处理

- 尽可能使用显式错误处理而非 try-catch
- 使用 TypeScript 的严格空检查
- 在边界处验证 props 和 state

## 项目结构

```
src/
  components/        # 可复用 UI 组件
  routes/           # 基于文件的路由 (TanStack Router)
    __root.tsx      # 根布局
    index.tsx       # 首页
    about.tsx       # 关于页面
  router.tsx        # 路由配置
  styles.css        # 全局样式 + CSS 变量
  routeTree.gen.ts  # 自动生成（请勿编辑）
```

## 路由约定

- 从 `src/routes/` 目录自动生成路由
- 使用 `createFileRoute()` 定义路由
- 布局使用 `__root.tsx` 或 `__layout.tsx` 命名
- 动态路由段：`[id].tsx`

## ESLint 配置

继承 `@tanstack/eslint-config`，并覆盖以下规则：

- `import/no-cycle`: off
- `import/order`: off
- `sort-imports`: off
- `@typescript-eslint/array-type`: off
- `@typescript-eslint/require-await`: off

## 核心依赖

- `@tanstack/solid-router` - 基于文件的路由
- `@tanstack/solid-start` - 全栈框架
- `@tailwindcss/vite` - Tailwind Vite 插件
- `vite-tsconfig-paths` - 从 tsconfig 读取路径别名

## Cursor 规则（来自 .cursorrules）

- 使用 `createSignal()` 管理响应式状态
- 使用 Tailwind CSS 类进行样式设置
- 包含 JSX 的文件使用 `.tsx` 扩展名
- 使用 TanStack Router 进行路由管理
- 使用类型安全的 `createContext` 创建上下文
- 为事件处理程序实现正确的类型
- 使用 Tailwind 的 `@layer` 指令定义自定义样式
- 遵循 utility-first CSS 方法
