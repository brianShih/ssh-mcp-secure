@echo off
REM ============================================================
REM SSH-MCP Secure - GitHub 倉庫設置腳本 (Windows)
REM ============================================================
REM 此腳本將幫助你：
REM 1. 初始化 Git 倉庫
REM 2. 添加所有文件
REM 3. 創建初始提交
REM 4. 準備推送到 GitHub
REM ============================================================

echo ============================================================
echo    SSH-MCP Secure - GitHub 倉庫設置
echo ============================================================
echo.

REM 檢查是否在正確的目錄
if not exist "src\index.ts" (
    echo [錯誤] 請在項目根目錄運行此腳本
    echo 當前目錄應包含 src\index.ts
    pause
    exit /b 1
)

echo [1/6] 檢查 Git 是否安裝...
git --version >nul 2>&1
if errorlevel 1 (
    echo [錯誤] Git 未安裝！
    echo 請從 https://git-scm.com/ 下載並安裝 Git
    pause
    exit /b 1
)
echo [✓] Git 已安裝

echo.
echo [2/6] 初始化 Git 倉庫...
if exist ".git" (
    echo [提示] Git 倉庫已存在，跳過初始化
) else (
    git init
    if errorlevel 1 (
        echo [錯誤] Git 初始化失敗
        pause
        exit /b 1
    )
    echo [✓] Git 倉庫初始化成功
)

echo.
echo [3/6] 添加所有文件到暫存區...
git add .
if errorlevel 1 (
    echo [錯誤] 文件添加失敗
    pause
    exit /b 1
)
echo [✓] 文件添加完成

echo.
echo [4/6] 檢查將要提交的文件...
echo 以下文件將被提交：
echo ------------------------------------------------------------
git status --short
echo ------------------------------------------------------------
echo.

REM 檢查是否有敏感文件
echo [5/6] 檢查敏感文件...
set HAS_SENSITIVE=0

if exist ".env" (
    echo [警告] 發現 .env 文件！這個文件不應該被提交。
    echo       已自動從暫存區移除
    git reset HEAD .env
    set HAS_SENSITIVE=1
)

if exist "node_modules" (
    echo [警告] 發現 node_modules 目錄！這個目錄不應該被提交。
    echo       已自動從暫存區移除
    git reset HEAD node_modules
    set HAS_SENSITIVE=1
)

if %HAS_SENSITIVE% EQU 1 (
    echo.
    echo [提示] 請確保不要將敏感文件提交到 GitHub
    echo.
)

echo [6/6] 創建初始提交...
git commit -m "Initial commit: SSH-MCP Secure v1.0.0 with enterprise security features

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
- GITHUB_SETUP_GUIDE.md - GitHub repository setup guide"

if errorlevel 1 (
    echo [錯誤] 提交失敗
    pause
    exit /b 1
)
echo [✓] 初始提交成功

echo.
echo ============================================================
echo    設置完成！
echo ============================================================
echo.
echo 下一步：推送到 GitHub
echo.
echo 方法一：使用 GitHub 網頁界面
echo   1. 訪問 https://github.com/new
echo   2. 創建名為 ssh-mcp-secure 的私有倉庫
echo   3. 執行以下命令：
echo.
echo      git remote add origin https://github.com/YOUR_USERNAME/ssh-mcp-secure.git
echo      git branch -M main
echo      git push -u origin main
echo.
echo 方法二：使用 GitHub CLI（如果已安裝）
echo   1. 執行：gh auth login
echo   2. 執行：gh repo create ssh-mcp-secure --private --source=. --remote=origin --push
echo.
echo 詳細指南請查看：GITHUB_SETUP_GUIDE.md
echo.
echo ============================================================
pause
