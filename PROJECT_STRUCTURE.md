# SSH-MCP Secure - 項目結構與使用指南

## 📁 項目結構

```
ssh-mcp-secure/
├── src/                          # 源代碼目錄
│   ├── index.ts                  # 主入口文件
│   ├── types.ts                  # TypeScript 類型定義
│   │
│   ├── security/                 # 安全模塊
│   │   ├── session-encryption.ts # 會話加密管理器 (AES-256-GCM)
│   │   └── credential-protection.ts # 憑證保護管理器
│   │
│   ├── auth/                     # 認證模塊
│   │   ├── enterprise-auth.ts    # 企業級認證管理器
│   │   └── mfa-manager.ts        # 多因素認證管理器 (TOTP)
│   │
│   ├── audit/                    # 審計模塊
│   │   └── audit-logger.ts       # 審計日誌記錄器
│   │
│   ├── config/                   # 配置模塊
│   │   └── environment-validator.ts # 環境變量驗證器
│   │
│   ├── errors/                   # 錯誤處理
│   │   └── ssh-errors.ts         # SSH 錯誤類型和處理器
│   │
│   ├── tools/                    # MCP 工具
│   │   └── smart-file-editor.ts  # 智能文件編輯器
│   │
│   ├── ai/                       # AI 智能模塊
│   │   ├── context7-integration.ts # Context7 文檔集成
│   │   ├── github-intelligence.ts # GitHub 智能
│   │   └── memory-orchestrator.ts # 記憶協調器
│   │
│   ├── resilience/               # 彈性模塊
│   │   └── circuit-breaker-manager.ts # 電路斷路器管理器
│   │
│   ├── monitoring/               # 監控模塊
│   │   └── error-monitor.ts      # 錯誤監控器
│   │
│   ├── compliance/               # 合規模塊
│   │   └── enterprise-compliance.ts # 企業合規管理器
│   │
│   ├── cache/                    # 緩存模塊
│   │   └── redis-cache-manager.ts # Redis 緩存管理器
│   │
│   ├── pool/                     # 連接池
│   │   └── adaptive-connection-pool.ts # 自適應連接池
│   │
│   ├── prompts/                  # MCP 提示模板
│   │   ├── mcp-orchestration.ts
│   │   └── ml-mcp-integration.ts
│   │
│   ├── backup/                   # 備份模塊
│   │   └── intelligent-backup-manager.ts
│   │
│   └── agentic/                  # Agentic 工作流
│       └── orchestrator.ts
│
├── scripts/                      # 腳本目錄
│   ├── install.sh                # 安裝腳本
│   ├── deploy.sh                 # 部署腳本
│   └── secure-start.sh           # 安全啟動腳本
│
├── monitoring/                   # 監控配置
│   ├── prometheus.yml            # Prometheus 配置
│   ├── grafana-dashboard.json    # Grafana 儀表板
│   └── alert_rules.yml           # 警報規則
│
├── k8s/                          # Kubernetes 配置
│   ├── namespace.yaml
│   ├── ssh-mcp-deployment.yaml
│   ├── configmap.yaml
│   └── service.yaml
│
├── tests/                        # 測試目錄
│   ├── security/                 # 安全測試
│   ├── auth/                     # 認證測試
│   └── integration/              # 集成測試
│
├── docs/                         # 文檔目錄
│   ├── api.md                    # API 文檔
│   ├── security.md               # 安全指南
│   └── compliance.md             # 合規指南
│
├── .env.example                  # 環境變量範例
├── .gitignore                    # Git 忽略文件
├── package.json                  # Node.js 配置
├── tsconfig.json                 # TypeScript 配置
├── README.md                     # 項目說明
├── SECURITY.md                   # 安全政策
└── CONTRIBUTING.md               # 貢獻指南
```

## 🔐 核心安全特性

### 1. 加密層 (SessionEncryptionManager)

```typescript
// AES-256-GCM 加密
const encryption = createEncryptionManager({
  algorithm: 'AES-256-GCM',
  keyLength: 256,
  keyRotationDays: 90
});

const encrypted = encryption.encrypt('sensitive data');
const decrypted = encryption.decrypt(encrypted);
```

**特點：**
- AES-256-GCM 認證加密
- 自動密鑰輪換 (90 天)
- 安全的 IV 生成
- HMAC 驗證

### 2. 認證層 (EnterpriseAuthManager)

```typescript
// SSH 密鑰認證
const authResult = await authManager.authenticateWithKey(
  userId,
  publicKey,
  signature,
  context
);

// MFA 驗證
const mfaResult = await authManager.verifyMFA(
  userId,
  sessionId,
  totpCode
);
```

**特點：**
- SSH 密鑰認證 (ED25519/RSA-4096)
- 多因素認證 (TOTP + 備用代碼)
- 速率限制
- 賬戶鎖定保護

### 3. 審計層 (AuditLogger)

```typescript
// 記錄認證事件
await auditLogger.logAuthentication(
  true, // success
  userId,
  'key',
  { sessionId, ipAddress }
);

// 記錄命令執行
await auditLogger.logCommandExecution(
  sessionId,
  'ls -la',
  'success'
);
```

**特點：**
- JSON 結構化日誌
- 異步文件寫入
- 日誌輪轉
- 合規報告导出

### 4. 合規層 (EnterpriseComplianceManager)

```typescript
// 生成 SOC2 合規報告
const report = await complianceManager.generateReport({
  framework: 'soc2',
  startDate: '2024-01-01',
  endDate: '2024-12-31'
});
```

**支持框架：**
- SOC2 Type II
- GDPR
- NIST CSF
- HIPAA
- PCI-DSS
- ISO 27001

## 🚀 使用流程

### 安裝

```bash
# 1. Clone 項目
git clone <repository-url>
cd ssh-mcp-secure

# 2. 運行安裝腳本
bash scripts/install.sh

# 3. 配置環境
cp .env.example .env
# 編輯 .env 文件
```

### 配置

```bash
# .env 文件配置範例

# 服務器配置
MY_SERVER_HOST=example.com
MY_SERVER_PORT=22
MY_SERVER_USERNAME=myuser
MY_SERVER_PRIVATE_KEY_PATH=/path/to/key
MY_SERVER_DEFAULT_DIR=/home/myuser

# 安全設置
SSH_ALLOW_PASSWORD_AUTH=false
SSH_REQUIRE_KEY_AUTH=true
MFA_ENABLED=true
MFA_REQUIRED_FOR_PRODUCTION=true

# 加密設置
ENCRYPTION_ALGORITHM=AES-256-GCM
ENCRYPTION_MASTER_KEY=<64-char-hex-key>
ENCRYPTION_KEY_ROTATION_DAYS=90

# 審計設置
AUDIT_ENABLED=true
AUDIT_LOG_PATH=/var/log/ssh-mcp/audit.log
AUDIT_RETENTION_DAYS=90
```

### 啟動

```bash
# 開發模式
npm run dev

# 生產模式
npm start

# 構建
npm run build
```

### 連接服務器

```javascript
// 通過 MCP 客戶端連接
const session = await secureConnect({
  serverName: "my-server",
  requireMFA: true
});

// 執行命令
const result = await secureExecute({
  sessionId: session.sessionId,
  command: "docker ps"
});

console.log(result.stdout);
```

## 📊 監控儀表板

### Prometheus 指標

訪問 `http://localhost:9090` 查看 Prometheus。

關鍵指標：
- `ssh_connections_active` - 活動連接數
- `ssh_commands_total` - 命令執行總數
- `ssh_errors_total` - 錯誤總數
- `auth_failures_total` - 認證失敗總數
- `mfa_verifications_total` - MFA 驗證總數
- `cache_hit_rate` - 緩存命中率

### Grafana 儀表板

訪問 `http://localhost:3000` 查看 Grafana。

預設儀表板：
- SSH 連接監控
- 認證統計
- 性能指標
- 安全事件

## 🔍 安全審計

### 運行安全審計

```bash
# NPM 審計
npm run security:audit

# Snyk 安全檢查
npm run security:check
```

### 安全檢查清單

部署前檢查：

- [ ] 設置 `SSH_ALLOW_PASSWORD_AUTH=false`
- [ ] 設置 `SSH_REQUIRE_KEY_AUTH=true`
- [ ] 生成並配置 SSH 密鑰
- [ ] 設置強加密主密鑰
- [ ] 啟用 MFA
- [ ] 配置審計日誌路徑
- [ ] 設置日誌級別為 info 或 warn
- [ ] 禁用 DEBUG_MODE
- [ ] 審查 RBAC 權限
- [ ] 啟用備份加密
- [ ] 配置監控和警報

## 🧪 測試

```bash
# 運行所有測試
npm test

# 運行覆蓋率測試
npm run test:coverage

# 運行安全測試
npm run test:security
```

## 📝 最佳實踐

### 1. 環境變量安全

```bash
# 永遠不要提交 .env 文件
echo ".env*" >> .gitignore

# 使用強密鑰
export ENCRYPTION_MASTER_KEY=$(openssl rand -hex 32)

# 限制文件權限
chmod 600 .env
```

### 2. SSH 密鑰管理

```bash
# 生成 ED25519 密鑰
ssh-keygen -t ed25519 -a 100 -C "your_email@example.com"

# 設置正確權限
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub

# 複製到服務器
ssh-copy-id -i ~/.ssh/id_ed25519 user@server
```

### 3. MFA 配置

```bash
# 首次連接時掃描 QR 碼
# 使用 Google Authenticator 或 Authy
# 保存備用代碼在安全位置
```

### 4. 日誌管理

```bash
# 定期導出審計日誌
aws s3 cp /var/log/ssh-mcp/audit.log.gz s3://logs-bucket/

# 清理舊日誌
find /var/log/ssh-mcp -name "*.gz" -mtime +90 -delete
```

## 🆘 故障排除

### 常見問題

**問題 1: 連接失敗**
```bash
# 檢查服務器配置
npm run validate:env

# 檢查 SSH 密鑰權限
ls -la ~/.ssh/id_ed25519
# 應該是 600
```

**問題 2: MFA 驗證失敗**
```bash
# 檢查系統時間是否同步
date
# 使用 NTP 同步時間
sudo ntpdate -s time.nist.gov
```

**問題 3: 審計日誌無法寫入**
```bash
# 檢查目錄權限
ls -la /var/log/ssh-mcp/
# 應該是可寫入的
sudo chown -R $USER:$USER /var/log/ssh-mcp
```

## 📞 支持

- 文檔：README.md
- 安全政策：SECURITY.md
- API 文檔：docs/api.md
- 問題報告：GitHub Issues

## 📄 許可證

MIT License - 查看 LICENSE 文件
