# 🚀 SSH-MCP Secure - 快速啟動指南

## 1 分鐘快速開始

### 步驟 1: 安裝依賴

```bash
cd C:/Users/brian/Projects/ssh-mcp-secure
npm install
```

### 步驟 2: 配置環境

```bash
# 複製環境範例
copy .env.example .env

# 編輯 .env 文件，填入您的配置
notepad .env
```

### 步驟 3: 生成 SSH 密鑰

```bash
# Windows PowerShell
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 步驟 4: 構建項目

```bash
npm run build
```

### 步驟 5: 啟動服務器

```bash
npm start
```

## 配置範例

### .env 文件範例

```ini
# 服務器配置
MY_SERVER_HOST=example.com
MY_SERVER_PORT=22
MY_SERVER_USERNAME=myuser
MY_SERVER_PRIVATE_KEY_PATH=C:/Users/brian/.ssh/id_ed25519
MY_SERVER_DEFAULT_DIR=/home/myuser
MY_SERVER_DESCRIPTION=My Production Server

# 安全設置
SSH_ALLOW_PASSWORD_AUTH=false
SSH_REQUIRE_KEY_AUTH=true
SSH_MAX_AUTH_RETRIES=3
SSH_LOCKOUT_DURATION=300

# MFA 設置
MFA_ENABLED=true
MFA_REQUIRED_FOR_PRODUCTION=true
MFA_TOTP_ISSUER=SSH-MCP-Secure

# 加密設置
ENCRYPTION_ALGORITHM=AES-256-GCM
ENCRYPTION_MASTER_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
ENCRYPTION_KEY_ROTATION_DAYS=90

# 審計設置
AUDIT_ENABLED=true
AUDIT_LOG_PATH=C:/Users/brian/AppData/Local/ssh-mcp/audit.log
AUDIT_RETENTION_DAYS=90
AUDIT_LOG_FORMAT=json

# 日誌設置
LOG_LEVEL=info
LOG_FILE_PATH=C:/Users/brian/AppData/Local/ssh-mcp/ssh-mcp.log

# 服務器設置
SERVER_ENV=production
SERVER_PORT=3001
```

## 測試連接

### 使用 Claude Code

```bash
# 添加 MCP 服務器
claude mcp add ssh-mcp-secure

# 配置
claude mcp configure ssh-mcp-secure --env MY_SERVER_HOST=example.com
```

### 使用 Cursor

在 `~/.cursor/settings.json` 中添加：

```json
{
  "mcp.servers": {
    "ssh-mcp-secure": {
      "command": "node",
      "args": ["C:/Users/brian/Projects/ssh-mcp-secure/build/index.js"],
      "env": {
        "MY_SERVER_HOST": "example.com",
        "MY_SERVER_USERNAME": "myuser"
      }
    }
  }
}
```

## 驗證安裝

```bash
# 運行環境驗證
node build/validate.js

# 運行安全審計
npm run security:audit

# 檢查配置
npm run validate:env
```

## 下一步

1. ✅ 閱讀 README.md 了解完整功能
2. ✅ 閱讀 SECURITY.md 了解安全最佳實踐
3. ✅ 閱讀 PROJECT_STRUCTURE.md 了解項目結構
4. ✅ 配置監控和警報
5. ✅ 設置備份策略

## 常見問題

### Q: 無法找到模塊？
A: 確保已運行 `npm install`

### Q: 構建失敗？
A: 確保 Node.js 版本 >= 18

### Q: 連接被拒絕？
A: 檢查防火牆設置和服務器配置

### Q: MFA 驗證失敗？
A: 確保系統時間同步

## 獲取幫助

- 查看文檔：README.md
- 查看安全指南：SECURITY.md
- 查看項目結構：PROJECT_STRUCTURE.md
- 提交問題：GitHub Issues
