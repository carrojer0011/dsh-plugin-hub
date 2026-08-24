# DSH 插件库 自动同步脚本
# 作用：检测线上每日同步是否有新提交，有则自动 pull 到本地
# 用法：由 Windows 任务计划程序定时运行（建议每小时一次）

$dir = Split-Path -Parent $PSScriptRoot
$log = Join-Path $dir "scripts\auto-sync.log"
Set-Location $dir

function Log($msg) {
  $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
  Write-Output $line
  try { Add-Content -Path $log -Value $line } catch {}
}

# 1. 拉取远程最新（fetch 不改变本地工作区）
git fetch origin main 2>$null
if ($LASTEXITCODE -ne 0) {
  Log "fetch 失败（代理未开或网络异常）"
  exit
}

# 2. 比较本地与线上
$local  = (git rev-parse HEAD 2>$null).Trim()
$remote = (git rev-parse origin/main 2>$null).Trim()

if (-not $local -or -not $remote) {
  Log "无法读取提交，跳过"
  exit
}

if ($local -eq $remote) {
  Log "已是最新，无需更新"
  exit
}

# 3. 有新提交，尝试快进合并（--ff-only 只做快进，避免冲突/合并提交）
git pull --ff-only origin main 2>$null
if ($LASTEXITCODE -eq 0) {
  Log "已同步线上最新数据"
} else {
  Log "自动合并失败（本地有未提交改动或分叉），请手动 git pull"
}
