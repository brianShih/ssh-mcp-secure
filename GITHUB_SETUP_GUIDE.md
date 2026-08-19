# 🚀 SSH-MCP Secure - GitHub 倉庫設置指南

## 方法一：使用 GitHub 網頁界面（推薦）

### 步驟 1: 創建私有倉庫

1. 訪問 [GitHub.com](https://github.com)
2. 點擊右上角的 **+** → **New repository**
3. 填寫倉庫信息：
   - **Repository name**: `ssh-mcp-secure`
   - **Description**: `高安全性 SSH MCP 服務器 - Enterprise-grade SSH management with AI intelligence and military-grade security`
   - **Visibility**: 🔒 **Private** (選擇 Private)
   - **Initialize this repository with**: ❌ **不要勾選** (保持空白)

4. 點擊 **Create repository**

### 步驟 2: 推送現有代碼到 GitHub

打開終端機（PowerShell 或 Git Bash），執行以下命令：

```bash
# 進入項目目錄
cd C:/Users/brian/Projects/ssh-mcp-secure

# 初始化 Git（如果還未初始化）
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: SSH-MCP Secure v1.0.0 with enterprise security features

Features:
- AES-256-GCM encryption with PBKDF2 key derivation
- Multi-factor authentication (MFA) with hashed backup codes
- Multi-layer rate limiting
- Comprehensive audit logging with sensitive data redaction
- Automatic key rotation
- RBAC with least privilege
- SOC2/GDPR/NIST compliance ready

Security fixes applied:
- Secure key storage (FileKeyStorage)
- IV reuse prevention
- Password strength validation
- Multi-layer rate limiting (user/IP/global)
- Sensitive data redaction in logs"

# 添加遠程倉庫（替換 YOUR_USERNAME 為你的 GitHub 用戶名）
git remote add origin https://github.com/YOUR_USERNAME/ssh-mcp-secure.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 步驟 3: 驗證推送

1. 刷新 GitHub 倉庫頁面
2. 確認所有文件已上傳
3. 檢查文件結構是否完整

---

## 方法二：使用 GitHub CLI（如果你安裝了 gh）

### 安裝 GitHub CLI

```powershell
# Windows PowerShell (管理員)
winget install --id GitHub.cli
```

### 創建私有倉庫並推送

```bash
# 進入項目目錄
cd C:/Users/brian/Projects/ssh-mcp-secure

# 登錄 GitHub
gh auth login

# 創建私有倉庫
gh repo create ssh-mcp-secure --private --source=. --remote=origin --push

# 或者手動步驟：
# git init
# git add .
# git commit -m "Initial commit"
# gh repo create ssh-mcp-secure --private
# git push -u origin main
```

---

## 🔒 安全注意事項

### 1. 絕對不要提交的敏感文件

項目已包含完整的 `.gitignore`，但請再次確認以下文件**沒有**被提交：

- ❌ `.env` 文件（包含密碼和密鑰）
- ❌ `ENCRYPTION_MASTER_SECRET` 或任何密鑰
- ❌ SSH 私鑰文件
- ❌ 個人訪問令牌
- ❌ 數據庫密碼

### 2. 檢查已提交的文件

在推送之前，檢查將要提交的文件：

```bash
# 查看將要提交的文件
git status

# 查看具體變更
git diff --cached

# 如果看到敏感文件，取消添加
git reset HEAD .env
git checkout -- .env
```

### 3. 驗證 .gitignore

確保 `.gitignore` 包含以下內容：

```gitignore
# 環境變量
.env
.env.local
.env.production
*.env

# 密鑰和證書
*.key
*.pem
*.pub
id_rsa*
known_hosts

# 日誌文件
*.log
logs/

# 依賴
node_modules/

# 構建輸出
build/
dist/
```

---

## 📋 推送後的 GitHub 倉庫設置

### 1. 保護主分支

1. 進入倉庫 **Settings** → **Branches**
2. 點擊 **Add branch protection rule**
3. Branch name pattern: `main`
4. 勾選：
   - ✅ **Require a pull request before merging**
   - ✅ **Require approvals** (至少 1 人)
   - ✅ **Dismiss stale pull request approvals**
   - ✅ **Require status checks to pass before merging**
5. 點擊 **Create**

### 2. 啟用依賴圖譜和 Dependabot

1. 進入倉庫 **Settings** → **Code security and analysis**
2. 啟用：
   - ✅ **Dependency graph**
   - ✅ **Dependabot alerts**
   - ✅ **Dependabot security updates**

### 3. 添加倉庫描述和標籤

在倉庫主頁添加：
- **Description**: `高安全性 SSH MCP 服務器 | Enterprise SSH Management | AES-256-GCM | MFA | SOC2 Ready`
- **Website**: （如有）
- **Topics**: `ssh`, `mcp`, `security`, `enterprise`, `typescript`, `aes-encryption`, `mfa`, `audit-logging`

### 4. 添加 LICENSE

如果還未添加，在 GitHub 上：
1. 點擊 **Add file** → **Create new file**
2. 文件名：`LICENSE`
3. 點擊 **Choose a license template**
4. 選擇 **MIT License**
5. 填寫你的姓名
6. 點擊 **Commit changes**

---

## 🔄 後續推送代碼

### 日常開發推送

```bash
# 提交變更
git add .
git commit -m "feat: 添加新功能"

# 推送到 GitHub
git push origin main

# 或者使用帶描述的提交
git commit -m "fix: 修復加密模塊的 IV 重用問題

- 實現 IV 重用檢查
- 添加自動輪換機制
- 防止內存耗盡

Fixes: #123"
```

### 使用分支開發新功能

```bash
# 創建新分支
git checkout -b feature/new-auth-system

# 開發和提交
git add .
git commit -m "feat: 實現新的認證系統"

# 推送到遠程分支
git push -u origin feature/new-auth-system

# 然後在 GitHub 上創建 Pull Request
```

---

## 🛡️ 私有倉庫安全最佳實踐

### 1. 協作者管理

- 只邀請必要的人員
- 使用最小權限原則
- 定期審查協作者列表

### 2. 訪問令牌

- 使用細粒度的 Personal Access Tokens
- 定期輪換令牌
- 不要將令牌提交到代碼庫

### 3. Webhooks 和集成

- 審查所有已安裝的 GitHub Apps
- 限制 Webhook 權限
- 使用 webhook 密鑰

### 4. 審計日誌

- 啟用組織審計日誌（如果使用組織）
- 定期審查安全事件
- 設置異常警報

---

## 📊 倉庫統計（可選）

在 README 中添加徽章：

```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Security: SOC2](https://img.shields.io/badge/Security-SOC2%20Ready-green.svg)](https://www.aicpa.org/soc2)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Private Repository](https://img.shields.io/badge/Visibility-Private-red.svg)]()
```

---

## ❓ 常見問題

### Q: 推送時提示認證失敗？
A: 使用 Personal Access Token 代替密碼：
1. GitHub Settings → Developer settings → Personal access tokens
2. 生成新令牌（選擇 repo 權限）
3. 使用令牌作為密碼

### Q: 如何將現有倉庫從公開轉為私有？
A: Settings → Danger zone → Change visibility → Make private

### Q: 如何確保敏感文件沒有被提交？
A: 使用 `git log -p --all -- .env` 檢查歷史記錄，如有洩露立即：
1. 撤銷洩露的密鑰
2. 使用 BFG Repo-Cleaner 清理歷史
3. 強制推送清理後的歷史

---

## 📞 需要幫助？

- GitHub 文檔：https://docs.github.com/
- Git 命令參考：https://git-scm.com/docs
- 安全最佳實踐：https://docs.github.com/en/code-security

---

**創建日期**: 2026-08-19  
**倉庫名稱**: ssh-mcp-secure  
**可見性**: 🔒 Private
