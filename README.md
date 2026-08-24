# 🐋 DSH 插件库

一个用于**收录与评价** [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）社区插件的静态网站。

- 按 **Star 数 + 能力匹配度** 综合排序（可切换排序方式）
- 每个插件按能力赋予**动态标签**（标签的数量与类型随收录插件自动增减）
- 醒目的 **🔥 新手必装** 板块（按能力对比主流 agent + 新手需求精选）
- 只收录下载地址（GitHub 链接），**不下载插件本体**
- 提供**搜索栏** + **标签筛选** + **分类筛选**

## 目录结构

```
dsh-plugin-hub/
├── index.html                 # 站点入口
├── assets/
│   ├── style.css              # 样式
│   └── app.js                 # 交互（搜索/筛选/排序/渲染）
├── data/
│   ├── plugins.json           # ★ 核心数据（手改这里即可增删插件/改点评/改标签）
│   └── plugins.bundle.js      # 由 build 自动生成，网站实际读取，勿手改
├── scripts/
│   ├── build.mjs              # 把 plugins.json 打包成 plugins.bundle.js
│   └── sync-stars.mjs         # 拉取 GitHub 实时 star 数并回写数据
├── .github/workflows/
│   └── daily-sync.yml         # 每天自动同步一次（部署到 GitHub 后生效）
└── package.json
```

## 本地预览

```bash
# 1. 生成 bundle
npm run build

# 2. 用任意静态服务器打开（直接双击 index.html 也可以，数据已内嵌）
npx serve .
```

## 每日更新（一天一更新）

**方式 A：GitHub Actions（推荐，全自动）**
把本目录推到一个 GitHub 仓库，`.github/workflows/daily-sync.yml` 会在每天 UTC 00:00 自动运行，
拉取每个插件的实时 star 数并提交回仓库。无需本地定时任务。

**方式 B：本地手动 / 定时**
```bash
# 无 token 时 GitHub API 限 60 次/小时；建议配一个 token
GITHUB_TOKEN=你的token npm run sync
```
Windows 可用「任务计划程序」每天运行一次 `npm run sync`。

## 如何新增 / 修改插件

编辑 `data/plugins.json`，在 `plugins` 数组里加一条：

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "repo": "owner/repo",
  "category": "vision",
  "tags": ["视觉", "OCR"],
  "description": "一句话功能简介",
  "summary": "AI 点评：它好在哪、适合谁",
  "stars": 0,
  "matchScore": 80,
  "mustInstall": false
}
```

- `tags` 随意写，站点会自动把它们收集成可筛选的标签（**动态标签**）。
- `mustInstall: true` 会进入「新手必装」板块，并可加 `mustInstallReason` 说明理由。
- `matchScore`（0–100）是能力匹配度：插件核心能力的完整度 + 易用性 + 对 DSH 的适配度，由策展评估。
- 改完运行 `npm run build` 重新生成 bundle。

## 部署到 GitHub Pages

在仓库 Settings → Pages 里把 Source 选为分支根目录（或 `/root`）即可，静态文件零构建可直接托管。
每日同步工作流会自动更新 `data/` 下的数据，Pages 随之更新。

## 排序说明

综合排序 = ⭐ Star（对数归一化）占 60% + 🎯 能力匹配度占 40%。
搜索或勾选标签时，在命中结果内保持同一排序。

## ⚠️ 免责声明

安装任何第三方 DSH 插件都会在本机以你的权限执行其代码。本站只提供下载地址与功能评价，
**不构成安全审查**。安装前请自行审阅插件源码，尤其是涉及凭据、网络、文件系统的插件。
