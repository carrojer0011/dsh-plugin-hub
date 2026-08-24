# 部署到 GitHub（每日更新 + Pages）

把 DSH 插件库推到 GitHub，即可获得两样东西：

1. **在线可访问的网站**（GitHub Pages，免服务器）
2. **每天自动更新的 star 数**（GitHub Actions 定时任务）

> 你本机已安装 Git（v2.53.0），无需再装，只需一个 GitHub 账号。

## 第 1 步：本地初始化并提交

在项目目录打开终端（PowerShell 或 CMD）：

```bash
cd C:\Users\25420\Documents\dsh-plugin-hub
git init
git add .
git commit -m "init: DSH 插件库"
```

## 第 2 步：在 GitHub 新建仓库

1. 登录 github.com → 右上角 **+** → **New repository**
2. Repository name 填：`dsh-plugin-hub`
3. 选 **Public**（公开；Pages 对公开仓库免费）
4. **不要**勾选 “Add a README”（本地已有文件，避免冲突）
5. 点 **Create repository**

## 第 3 步：关联远程并推送

```bash
git branch -M main
git remote add origin https://github.com/你的用户名/dsh-plugin-hub.git
git push -u origin main
```

（把「你的用户名」替换成你的 GitHub 用户名）

## 第 4 步：确认每日更新工作流已就绪

1. 打开仓库页面 → 顶部 **Actions** 标签
2. 左侧应能看到 **daily-sync** 工作流
3. 点进去 → 右侧 **Run workflow** → **Run workflow**，手动跑一次验证
4. 看到绿色 ✓ 即表示 star 同步成功；之后每天自动跑一次（UTC 00:00 = 北京时间早 8 点）

## 第 5 步：开启 Pages（网站上线）

1. 仓库 → **Settings** → 左侧 **Pages**
2. **Build and deployment** → Source 选 **Deploy from a branch**
3. Branch 选 **main**，目录选 **/ (root)**，点 **Save**
4. 约 1 分钟后，访问：

```text
https://你的用户名.github.io/dsh-plugin-hub/
```

## 第 6 步：验证

- 打开上面的网址，能看到页面即为成功
- 点任意插件卡片能进详情页
- 之后每天看，star 数会随同步自动变化（无需再手动操作）

## 每日更新是怎么跑的

`.github/workflows/daily-sync.yml` 里的 cron `0 0 * * *` 每天触发一次：
拉取 81 个插件的实时 star → 写回 `data/plugins.json` → 重新生成 bundle → 自动 commit + push。
Pages 检测到 push 后会自动重新部署，因此线上 star 数每天自动刷新。

## 常见问题

- **Actions 里看不到 daily-sync？** 确认工作流文件在 main 分支，且仓库没禁用 Actions（Settings → Actions → General → Allow all）。
- **Pages 打不开 / 404？** 确认第 5 步 Source 与分支选对，等 1–2 分钟。
- **想改网站内容？** 改 `data/plugins.json` 后运行 `npm run build` 再 push；或直接让我来改。
- **想改更新时间？** 改 `.github/workflows/daily-sync.yml` 里的 cron 表达式。
