# 🚀 快速創建 GitHub 私有倉庫 - 3 分鐘完成

## 📋 準備工作

確保你已安裝：
- ✅ Git（從 https://git-scm.com/ 下載）
- ✅ GitHub 帳號（https://github.com/signup）

---

## ⚡ 快速步驟（選擇一種方法）

### 方法 A：使用自動化腳本（最簡單）⭐

#### Windows 用戶：

1. **雙擊運行腳本**：
   ```
   C:/Users/brian/Projects/ssh-mcp-secure/setup-github.bat
   ```
   或右鍵點擊選擇「以 PowerShell 運行」：
   ```
   setup-github.ps1
   ```

2. **腳本會自動**：
   - ✅ 初始化 Git 倉庫
   - ✅ 添加所有文件
   - ✅ 檢查敏感文件
   - ✅ 創建初始提交

3. **然後按照提示**：
   - 訪問 https://github.com/new
   - 創建私有倉庫 `ssh-mcp-secure`
   - 執行推送命令

---

### 方法 B：手動步驟（完全控制）

#### 步驟 1: 創建 GitHub 倉庫（2 分鐘）

1. 訪問 https://github.com/new
2. 填寫信息：
   - **Repository name**: `ssh-mcp-secure`
   - **Description**: `高安全性 SSH MCP 服務器 | Enterprise SSH Management | AES-256-GCM | MFA`
   - **Visibility**: 🔒 **Private**（重要！）
   - **Initialize**: ❌ **不要勾選**
3. 點擊 **Create repository**

#### 步驟 2: 推送代碼（1 分鐘）

打開 PowerShell 或 Git Bash，執行：

```bash
# 進入項目目錄
cd C:\Users\brian\Projects\ssh-mcp-secure

# 初始化 Git
git init

# 添加文件
git add .

# 提交
git commit -m "Initial commit: SSH-MCP Secure v1.0.0"

# 添加遠程倉庫（替換 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/ssh-mcp-secure.git

# 設置主分支
git branch -M main

# 推送到 GitHub
git push -u origin main
```

---

## 🔐 安全檢查清單

推送前確認：

- [ ] ❌ **沒有** `.env` 文件
- [ ] ❌ **沒有** `node_modules` 目錄
- [ ] ❌ **沒有** SSH 私鑰
- [ ] ❌ **沒有** 密碼或密鑰
- [ ] ✅ `.gitignore` 已正確配置

運行安全检查：

```bash
# 檢查將要提交的文件
git status

# 確保沒有敏感文件
git log --all --full-history -- ".env"
```

---

## ✅ 驗證推送成功

1. 刷新 GitHub 倉庫頁面
2. 確認看到以下文件：
   - ✅ `src/` 目錄
   - ✅ `README.md`
   - ✅ `package.json`
   - ✅ `.gitignore`
   - ✅ 所有文檔文件

3. 檢查文件數量（應該有 15+ 文件）

---

## 🔒 倉庫設置（推送後）

### 1. 保護主分支（30 秒）

1. 進入 **Settings** → **Branches**
2. **Add branch protection rule**
3. Branch name: `main`
4. 勾選：
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
5. **Create**

### 2. 啟用安全功能（1 分鐘）

1. 進入 **Settings** → **Code security and analysis**
2. 啟用：
   - ✅ Dependency graph
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates

### 3. 添加標籤（30 秒）

在倉庫主頁右側添加 topics：
```
ssh mcp security enterprise typescript aes-encryption mfa audit-logging
```

---

## 📱 使用 Personal Access Token

如果推送時需要認證：

### 創建令牌（2 分鐘）

1. 訪問 https://github.com/settings/tokens
2. **Generate new token (classic)**
3. 填寫：
   - **Note**: `SSH-MCP Secure CLI`
   - **Expiration**: `90 days` 或更長
   - **Scopes**: 勾選 `repo`（全選）
4. **Generate token**
5. **複製令牌**（只顯示一次！）

### 使用令牌推送

```bash
git push -u origin main
# 用戶名：你的 GitHub 用戶名
# 密碼：粘貼剛複製的令牌
```

---

## 🎯 完成後檢查

- [ ] 倉庫已創建且為私有
- [ ] 所有代碼已推送
- [ ] 主分支已保護
- [ ] Dependabot 已啟用
- [ ] 沒有敏感文件洩露

---

## 📚 相關文檔

- `GITHUB_SETUP_GUIDE.md` - 詳細設置指南
- `SECURITY_AUDIT.md` - 安全審計報告
- `README.md` - 項目說明

---

## ❓ 需要幫助？

### 問題：推送失敗
**解決**: 檢查網絡連接，確認 GitHub 帳號已登錄

### 問題：認證失敗
**解決**: 使用 Personal Access Token 代替密碼

### 問題：敏感文件已提交
**解決**: 
1. 立即撤銷洩露的密鑰
2. 使用 BFG Repo-Cleaner 清理歷史
3. 強制推送

---

## 🎉 完成！

你的 SSH-MCP Secure 項目現在已經安全地存儲在 GitHub 私有倉庫中！

**下一步**:
- 邀請協作者（可選）
- 設置 CI/CD（可選）
- 開始開發新功能

---

**創建日期**: 2026-08-19  
**預計時間**: 3-5 分鐘  
**難度**: ⭐☆☆☆☆（簡單）
