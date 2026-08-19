# 🔐 SSH-MCP Secure

**高安全性 SSH MCP 服務器** - Enterprise-grade SSH management with AI intelligence and military-grade security

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue.svg)](https://modelcontextprotocol.io)
[![Security: SOC2](https://img.shields.io/badge/Security-SOC2%20Compliant-green.svg)](https://www.aicpa.org/soc2)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-brightgreen.svg)](https://nodejs.org/)

## 🌟 核心特性

### 🔒 企業級安全
- **AES-256-GCM 加密** - 軍事級加密保護所有憑證
- **多因素認證 (MFA)** - TOTP + 備用代碼支持
- **SSH 密鑰認證** - 支持 ED25519 和 RSA-4096
- **基於角色的訪問控制 (RBAC)** - 細粒度權限管理
- **電路斷路器保護** - 8 個彈性電路保護關鍵服務
- **全面審計日誌** - 完整的合規報告

### 🤖 AI 智能
- **上下文感知協助** - 基於當前上下文的實時命令建議
- **技術棧檢測** - 自動項目堆疊識別和推薦
- **模式識別** - ML 驅動的命令歷史學習
- **GitHub 智能** - 社區模式挖掘和最佳實踐發現
- **預測性操作** - 使用趨勢分析預測問題

### 📊 監控與合規
- **Prometheus 指標** - 實時性能監控
- **Grafana 儀表板** - 可視化系統健康
- **合規框架** - SOC2, GDPR, NIST, HIPAA, PCI-DSS, ISO 27001
- **錯誤分析** - 智能錯誤診斷
- **警報管理** - 主動警報和自動修復

## 📋 目錄

- [安裝](#安裝)
- [快速開始](#快速開始)
- [配置](#配置)
- [安全特性](#安全特性)
- [API 參考](#api 參考)
- [合規](#合規)
- [貢獻](#貢獻)
- [許可證](#許可證)

## 🛠️ 安裝

### 先決條件

- Node.js 18+ 和 npm/yarn
- Claude Code CLI (可選，用於 MCP 集成)
- SSH 訪問目標服務器
- Git

### 安裝步驟

```bash
# Clone 倉庫
git clone https://github.com/your-org/ssh-mcp-secure.git
cd ssh-mcp-secure

# 安裝依賴
npm install

# 構建項目
npm run build

# 配置環境變量
cp .env.example .env
# 編輯 .env 文件填入實際配置

# 測試安裝
npm run security:audit
```

## 🚀 快速開始

### 1. 配置服務器憑證

創建 `.env` 文件：

```bash
# 服務器配置
MY_SERVER_HOST=example.com
MY_SERVER_PORT=22
MY_SERVER_USERNAME=myuser
MY_SERVER_PRIVATE_KEY_PATH=/path/to/private_key
MY_SERVER_DEFAULT_DIR=/home/myuser
MY_SERVER_DESCRIPTION=Production Server

# 安全設置
SSH_ALLOW_PASSWORD_AUTH=false
SSH_REQUIRE_KEY_AUTH=true
SSH_MAX_AUTH_RETRIES=3
SSH_LOCKOUT_DURATION=300

# MFA 設置
MFA_ENABLED=true
MFA_REQUIRED_FOR_PRODUCTION=true

# 加密設置
ENCRYPTION_ALGORITHM=AES-256-GCM
ENCRYPTION_KEY_ROTATION_DAYS=90

# 審計日誌
AUDIT_ENABLED=true
AUDIT_LOG_PATH=/var/log/ssh-mcp/audit.log
```

### 2. 生成 SSH 密鑰

```bash
# 生成 ED25519 密鑰 (推薦)
ssh-keygen -t ed25519 -a 100 -C "your_email@example.com"

# 或生成 RSA-4096 密鑰
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 設置正確的權限
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

### 3. 配置 MFA

首次連接時，系統會自動生成 MFA 設置：

```bash
# 啟動服務器
npm start

# 掃描 QR 碼配置 TOTP
# 使用 Google Authenticator 或 Authy
```

### 4. 連接並執行

```javascript
// 安全連接
const session = await secureConnect({
  serverName: "my-server",
  requireMFA: true
});

// 執行命令
const result = await secureExecute({
  sessionId: session.sessionId,
  command: "ls -la"
});

console.log(result.stdout);
```

## ⚙️ 配置

### 環境變量

#### 服務器配置

```bash
# 命名規範：SERVERNAME_PROPERTY
SERVERNAME_HOST=hostname.com
SERVERNAME_PORT=22
SERVERNAME_USERNAME=username
SERVERNAME_PASSWORD=password        # 可選 (不推薦)
SERVERNAME_PRIVATE_KEY_PATH=/path   # 推薦
SERVERNAME_PASSPHRASE=passphrase    # 可選 (加密密鑰)
SERVERNAME_DEFAULT_DIR=/home/user   # 可選
SERVERNAME_DESCRIPTION=Description   # 可選
```

#### 安全設置

```bash
# 認證安全
SSH_ALLOW_PASSWORD_AUTH=false      # 生產環境禁用密碼
SSH_REQUIRE_KEY_AUTH=true          # 要求密鑰認證
SSH_MAX_AUTH_RETRIES=3             # 最大認證嘗試
SSH_LOCKOUT_DURATION=300           # 鎖定時長 (秒)

# SSH 密鑰安全
SSH_KEY_TYPE=ed25519               # 推薦：ed25519
SSH_KEY_MIN_BITS=4096              # 最小 RSA 密鑰位數
SSH_KEY_PASSPHRASE_REQUIRED=true   # 要求密鑰短語

# 連接安全
SSH_MAX_RETRIES=3
SSH_RETRY_DELAY=2000
SSH_CONNECTION_TIMEOUT=20000
SSH_STRICT_HOST_KEY_CHECKING=true
```

#### MFA 設置

```bash
MFA_ENABLED=true
MFA_REQUIRED_FOR_PRODUCTION=true
MFA_TOTP_ISSUER=SSH-MCP-Secure
MFA_TOTP_DIGITS=6
MFA_TOTP_PERIOD=30
MFA_BACKUP_CODES_COUNT=10
```

#### 加密設置

```bash
ENCRYPTION_ALGORITHM=AES-256-GCM
ENCRYPTION_KEY_LENGTH=256
ENCRYPTION_KEY_ROTATION_DAYS=90
ENCRYPTION_MASTER_KEY=<your-64-char-hex-key>
```

#### 審計日誌

```bash
AUDIT_ENABLED=true
AUDIT_LOG_PATH=/var/log/ssh-mcp/audit.log
AUDIT_RETENTION_DAYS=90
AUDIT_LOG_FORMAT=json
AUDIT_AUTH_EVENTS=true
AUDIT_COMMAND_EXECUTION=true
AUDIT_FILE_OPERATIONS=true
```

## 🔒 安全特性

### 1. 加密

- **AES-256-GCM** 加密所有憑證
- **TLS 1.3** 用於外部通信
- **SSH Protocol 2** 用於所有 SSH 連接
- **密鑰輪換** 每 90 天自動輪換

### 2. 認證

- **多因素認證 (MFA)** - TOTP + 備用代碼
- **SSH 密鑰認證** - ED25519/RSA-4096
- **密碼認證** - 可選 (生產環境建議禁用)
- **會話超時** - 1 小時自動過期

### 3. 訪問控制

- **基於角色的訪問控制 (RBAC)**
  - `admin` - 完全訪問
  - `operator` - 操作權限
  - `developer` - 開發權限
  - `viewer` - 只讀權限

- **最小權限原則** - 默認拒絕所有訪問
- **審計所有權限檢查** - 完整審計跟蹤

### 4. 審計與合規

- **全面審計日誌**
  - 所有認證事件
  - 所有命令執行
  - 所有文件操作
  - 所有會話事件
  - 所有權限變更
  - 所有憑證訪問

- **合規框架支持**
  - SOC2 Type II
  - GDPR
  - NIST Cybersecurity Framework
  - HIPAA (可配置)
  - PCI-DSS (可配置)
  - ISO 27001 (可配置)

### 5. 彈性保護

- **電路斷路器** - 保護關鍵服務
  - SSH 連接
  - Redis 緩存
  - 認證服務
  - MFA 驗證
  - 加密服務

- **自動重試** - 指數退避
- **健康檢查** - 連接池健康監控

## 📊 監控

### Prometheus 指標

```prometheus
# SSH 連接
ssh_connections_active
ssh_commands_total
ssh_errors_total
ssh_command_duration_seconds

# 認證
auth_failures_total
mfa_verifications_total

# 緩存
cache_hits_total
cache_misses_total
cache_hit_rate

# 電路斷路器
circuit_breaker_trips_total
circuit_breaker_state
```

### Grafana 儀表板

訪問 `http://localhost:3000` 查看 Grafana 儀表板。

### 警報

配置警報通知：

```bash
ALERTING_ENABLED=true
ALERT_EMAIL=admin@example.com
ALERT_WEBHOOK_URL=https://hooks.slack.com/xxx
ALERT_THRESHOLD_CRITICAL=5
ALERT_THRESHOLD_WARNING=10
```

## 🔍 安全最佳實踐

### 1. 環境變量

```bash
# 永遠不要提交 .env 文件
echo ".env*" >> .gitignore

# 使用強密碼
export ENCRYPTION_MASTER_KEY=$(openssl rand -hex 32)

# 限制文件權限
chmod 600 .env
```

### 2. SSH 密鑰

```bash
# 生成安全密鑰
ssh-keygen -t ed25519 -a 100

# 設置正確權限
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

### 3. 憑證管理

- 使用憑證輪換 (90 天默認)
- 為生產環境啟用 MFA
- 定期審計憑證訪問
- 每個環境使用獨立憑證

### 4. 網絡安全

- 盡可能白名單 IP 地址
- 對敏感服務器使用跳板機
- 啟用 SSH 速率限制
- 監控可疑活動

## 📚 API 參考

### 連接管理

```typescript
// 安全連接到預定義服務器
secureConnect(params: {
  serverName: string
  requireMFA?: boolean
}): Promise<{
  sessionId: string
  sessionToken: string
  expiresAt: number
  mfaVerified: boolean
}>

// 列出配置的服務器
listPredefinedServers(): Promise<Record<string, ServerInfo>>
```

### 命令執行

```typescript
// 執行遠程命令
secureExecute(params: {
  sessionId: string
  command: string
  timeout?: number
}): Promise<{
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
  audited: true
}>
```

### 文件操作

```typescript
// 智能文件編輯
smartFileEdit(params: {
  sessionId: string
  filePath: string
  operations: EditOperation[]
  strategy?: EditStrategy
}): Promise<EditResult>
```

### 合規報告

```typescript
// 生成合規報告
generateComplianceReport(params: {
  framework: 'soc2' | 'gdpr' | 'nist'
  startDate: string
  endDate: string
}): Promise<ComplianceReport>
```

## 🤝 貢獻

我們歡迎貢獻！請查看我們的 [貢獻指南](CONTRIBUTING.md)。

### 開發設置

```bash
# Clone 和安裝
git clone https://github.com/your-org/ssh-mcp-secure.git
cd ssh-mcp-secure
npm install

# 運行測試
npm test

# 構建
npm run build

# 監聽模式
npm run watch

# 代碼檢查
npm run lint

# 安全審計
npm run security:audit
```

## 📄 許可證

MIT License - 查看 [LICENSE](LICENSE) 文件

## 📞 聯繫

- 安全問題：security@example.com
- 一般支持：support@example.com
- 文檔：https://github.com/your-org/ssh-mcp-secure/wiki

---

**記住**：安全是每個人的責任。如有疑問，請詢問！

## 🔐 安全檢查清單

部署前：

- [ ] 配置完整的 `.gitignore`
- [ ] 設置憑證輪換計劃
- [ ] 為生產訪問啟用 MFA
- [ ] 配置合規監控
- [ ] 定期審查審計日誌
- [ ] 設置 ENCRYPTION_MASTER_KEY
- [ ] 禁用密碼認證
- [ ] 配置防火牆規則
- [ ] 設置監控和警報
- [ ] 文檔化緊急程序
