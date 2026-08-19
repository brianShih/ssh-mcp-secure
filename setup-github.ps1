# SSH-MCP Secure - GitHub 倉庫設置腳本 (PowerShell)
# ============================================================
# 此腳本將幫助你：
# 1. 初始化 Git 倉庫
# 2. 添加所有文件
# 3. 創建初始提交
# 4. 準備推送到 GitHub
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   SSH-MCP Secure - GitHub 倉庫設置" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 檢查是否在正確的目錄
if (-not (Test-Path "src\index.ts")) {
    Write-Host "[錯誤] 請在項目根目錄運行此腳本" -ForegroundColor Red
    Write-Host "當前目錄應包含 src\index.ts" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "[1/6] 檢查 Git 是否安裝..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "[✓] Git 已安裝：$gitVersion" -ForegroundColor Green
} catch {
    Write-Host "[錯誤] Git 未安裝！" -ForegroundColor Red
    Write-Host "請從 https://git-scm.com/ 下載並安裝 Git" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "[2/6] 初始化 Git 倉庫..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "[提示] Git 倉庫已存在，跳過初始化" -ForegroundColor Yellow
} else {
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[錯誤] Git 初始化失敗" -ForegroundColor Red
        pause
        exit 1
    }
    Write-Host "[✓] Git 倉庫初始化成功" -ForegroundColor Green
}

Write-Host ""
Write-Host "[3/6] 添加所有文件到暫存區..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "[錯誤] 文件添加失敗" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[✓] 文件添加完成" -ForegroundColor Green

Write-Host ""
Write-Host "[4/6] 檢查將要提交的文件..." -ForegroundColor Yellow
Write-Host "以下文件將被提交：" -ForegroundColor Cyan
Write-Host "------------------------------------------------------------" -ForegroundColor Gray
git status --short
Write-Host "------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

Write-Host "[5/6] 檢查敏感文件..." -ForegroundColor Yellow
$hasSensitive = $false

if (Test-Path ".env") {
    Write-Host "[警告] 發現 .env 文件！這個文件不應該被提交。" -ForegroundColor Red
    Write-Host "       已自動從暫存區移除" -ForegroundColor Yellow
    git reset HEAD .env
    $hasSensitive = $true
}

if (Test-Path "node_modules") {
    Write-Host "[警告] 發現 node_modules 目錄！這個目錄不應該被提交。" -ForegroundColor Red
    Write-Host "       已自動從暫存區移除" -ForegroundColor Yellow
    git reset HEAD node_modules
    $hasSensitive = $true
}

if ($hasSensitive) {
    Write-Host ""
    Write-Host "[提示] 請確保不要將敏感文件提交到 GitHub" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "[6/6] 創建初始提交..." -ForegroundColor Yellow
$commitMessage = @"
Initial commit: SSH-MCP Secure v1.0.0 with enterprise security features

Features:
- AES-256-GCM encryption with PBKDF2 key derivation
- Multi-factor authentication (MFA) with hashed backup codes
- Multi-layer rate limiting (user/IP/global)
- Comprehensive audit logging with sensitive data redaction
- Automatic key rotation (90 days)
- RBAC with least privilege
- SOC2/GDPR/NIST compliance ready

Security fixes applied:
- Secure key storage (FileKeyStorage with 0o600 permissions)
- PBKDF2 key derivation (100,000 iterations)
- IV reuse prevention with automatic rotation
- MFA backup codes hashed with SHA-256
- Sensitive data redaction in audit logs (25+ patterns)
- Password strength validation (min 16 chars)
- Multi-layer rate limiting with exponential backoff

Documentation:
- README.md - Complete project documentation (Traditional Chinese)
- SECURITY.md - Security policy and best practices
- SECURITY_AUDIT.md - Security audit report
- SECURITY_FIX_REPORT.md - Security fixes documentation
- PROJECT_STRUCTURE.md - Project structure guide
- QUICKSTART.md - Quick start guide
- GITHUB_SETUP_GUIDE.md - GitHub repository setup guide
"@

git commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "[錯誤] 提交失敗" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[✓] 初始提交成功" -ForegroundColor Green

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   設置完成！" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步：推送到 GitHub" -ForegroundColor Yellow
Write-Host ""
Write-Host "方法一：使用 GitHub 網頁界面" -ForegroundColor Cyan
Write-Host "  1. 訪問 https://github.com/new" -ForegroundColor White
Write-Host "  2. 創建名為 ssh-mcp-secure 的私有倉庫" -ForegroundColor White
Write-Host "  3. 執行以下命令（替換 YOUR_USERNAME 為你的 GitHub 用戶名）：" -ForegroundColor White
Write-Host ""
Write-Host "     git remote add origin https://github.com/YOUR_USERNAME/ssh-mcp-secure.git" -ForegroundColor Gray
Write-Host "     git branch -M main" -ForegroundColor Gray
Write-Host "     git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "方法二：使用 GitHub CLI（如果已安裝）" -ForegroundColor Cyan
Write-Host "  1. 執行：gh auth login" -ForegroundColor White
Write-Host "  2. 執行：gh repo create ssh-mcp-secure --private --source=. --remote=origin --push" -ForegroundColor White
Write-Host ""
Write-Host "詳細指南請查看：GITHUB_SETUP_GUIDE.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
pause
