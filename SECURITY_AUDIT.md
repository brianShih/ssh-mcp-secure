# 🔐 SSH-MCP Secure 安全評估報告

**評估日期**: 2026-08-19  
**評估範圍**: 完整項目安全審計  
**評估標準**: OWASP, NIST, SOC2  

---

## 📊 總體安全评分

| 類別 | 得分 | 狀態 |
|------|------|------|
| 加密系統 | 85/100 | ⚠️ 需要改進 |
| 認證系統 | 75/100 | ⚠️ 需要改進 |
| 密鑰管理 | 70/100 | ❌ 高風險 |
| 審計日誌 | 90/100 | ✅ 良好 |
| 訪問控制 | 80/100 | ✅ 良好 |
| 環境安全 | 65/100 | ❌ 高風險 |
| 依賴安全 | 待評估 | ⏳ 待檢查 |

**總體評分**: 77/100 ⚠️ **需要立即改進**

---

## 🚨 關鍵安全問題 (Critical)

### 1. 主密鑰存儲不安全 [CRITICAL]

**位置**: `src/security/session-encryption.ts:31-37`

**問題**:
```typescript
const masterKeyEnv = process.env.ENCRYPTION_MASTER_KEY;
if (masterKeyEnv) {
  this.masterKey = Buffer.from(masterKeyEnv, 'hex');
} else {
  this.masterKey = crypto.randomBytes(this.config.keyLength / 8);
  // ⚠️ 警告：使用自動生成的密鑰
}
```

**風險**:
- ❌ 環境變量可能被洩露 (日誌、進程列表)
- ❌ 沒有使用安全的密鑰存儲 (HSM/KMS)
- ❌ 重啟後自動生成的密鑰會丟失

**建議修復**:
```typescript
// 使用 Windows DPAPI 或 Azure Key Vault
import { KeyVaultClient } from '@azure/keyvault';

async function getMasterKey(): Promise<Buffer> {
  // 1. 嘗試從 HSM/KMS 獲取
  // 2.  fallback 到 DPAPI 加密的文件
  // 3. 永遠不要從環境變量讀取
}
```

**優先級**: 🔴 **立即修復**

---

### 2. 缺少密鑰派生函數 [CRITICAL]

**位置**: `src/security/session-encryption.ts:33`

**問題**:
```typescript
this.masterKey = Buffer.from(masterKeyEnv, 'hex');
// ❌ 直接使用用戶提供的密鑰，沒有派生
```

**風險**:
- ❌ 如果用戶提供弱密鑰，沒有強化機制
- ❌ 沒有使用 PBKDF2/Argon2 等 KDF

**建議修復**:
```typescript
import * as crypto from 'crypto';

function deriveKey(masterSecret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    masterSecret,
    salt,
    100000,  // iterations
    32,      // key length
    'sha256'
  );
}
```

**優先級**: 🔴 **立即修復**

---

### 3. 缺少密鑰輪換實現 [CRITICAL]

**位置**: `src/security/session-encryption.ts:173-190`

**問題**:
```typescript
rotateKey(): void {
  // ⚠️ 實現存在但沒有自動觸發機制
  // ⚠️ 沒有重新加密舊數據的邏輯
}
```

**風險**:
- ❌ 密鑰永远不会自動輪換
- ❌ 舊數據使用舊密鑰加密，增加暴露風險

**建議修復**:
- 實現定時檢查 (`setInterval` 每天檢查)
- 實現密鑰版本管理
- 實現數據重新加密

**優先級**: 🔴 **立即修復**

---

### 4. IV 重用風險 [HIGH]

**位置**: `src/security/session-encryption.ts:49`

**問題**:
```typescript
const iv = crypto.randomBytes(this.config.ivLength);
// ✅ 使用隨機 IV 是正確的
// ❌ 但沒有檢查 IV 是否重複 (極低概率但理論存在)
```

**風險**:
- ❌ GCM 模式下 IV 重用會導致密鑰洩露

**建議修復**:
```typescript
private usedIVs: Set<string> = new Set();

generateSecureIV(): Buffer {
  let iv: Buffer;
  do {
    iv = crypto.randomBytes(this.config.ivLength);
  } while (this.usedIVs.has(iv.toString('hex')));
  this.usedIVs.add(iv.toString('hex'));
  return iv;
}
```

**優先級**: 🟠 **高優先級**

---

### 5. 認證管理器缺少密碼哈希 [HIGH]

**位置**: `src/auth/enterprise-auth.ts:283-291`

**問題**:
```typescript
private async hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}
```

**風險**:
- ✅ 使用 bcrypt 是正確的
- ⚠️ 但 salt rounds (12) 對於現代硬件可能不夠
- ⚠️ 沒有密碼複雜度檢查

**建議修復**:
```typescript
// 增加到 14-16 rounds
const salt = await bcrypt.genSalt(14);

// 添加密碼複雜度檢查
function validatePasswordStrength(password: string): ValidationResult {
  if (password.length < 16) return { valid: false, reason: 'Too short' };
  if (!/[A-Z]/.test(password)) return { valid: false, reason: 'No uppercase' };
  if (!/[a-z]/.test(password)) return { valid: false, reason: 'No lowercase' };
  if (!/[0-9]/.test(password)) return { valid: false, reason: 'No digits' };
  if (!/[^A-Za-z0-9]/.test(password)) return { valid: false, reason: 'No special chars' };
  return { valid: true };
}
```

**優先級**: 🟠 **高優先級**

---

### 6. MFA 備用代碼存儲不安全 [HIGH]

**位置**: `src/auth/mfa-manager.ts:28-35`

**問題**:
```typescript
const mfaSecret: MFASecret = {
  userId,
  secret: secret.base32,
  backupCodes,  // ❌ 明文存儲
  createdAt: Date.now()
};
```

**風險**:
- ❌ 備用代碼以明文存儲在內存中
- ❌ 如果內存被 dump，所有備用代碼洩露

**建議修復**:
```typescript
// 哈希存儲備用代碼
const hashedBackupCodes = backupCodes.map(code => 
  crypto.createHash('sha256').update(code).digest('hex')
);

// 驗證時比較哈希
verifyBackupCode(code: string): boolean {
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  return this.hashedBackupCodes.includes(codeHash);
}
```

**優先級**: 🟠 **高優先級**

---

### 7. 審計日誌可能洩露敏感信息 [HIGH]

**位置**: `src/audit/audit-logger.ts:72-89`

**問題**:
```typescript
details: {
  method,
  ...details  // ❌ 可能包含敏感信息
}
```

**風險**:
- ❌ 可能記錄密碼、密鑰等敏感信息
- ❌ 日誌文件權限未檢查

**建議修復**:
```typescript
// 敏感字段過濾
const sensitiveFields = ['password', 'secret', 'key', 'token', 'credential'];
function sanitizeForLogging(obj: any): any {
  const sanitized = { ...obj };
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
}

// 日誌文件權限檢查
fs.chmod(logPath, 0o600);  // 只有 owner 可讀寫
```

**優先級**: 🟠 **高優先級**

---

### 8. 速率限制實現不完整 [HIGH]

**位置**: `src/auth/enterprise-auth.ts:220-235`

**問題**:
```typescript
private checkRateLimit(userId: string): boolean {
  // ⚠️ 只檢查每分鐘 10 次
  // ❌ 沒有全局速率限制
  // ❌ 沒有 IP 基礎的速率限制
}
```

**風險**:
- ❌ 攻擊者可以從多個 IP 繞過限制
- ❌ 分布式攻擊無法防禦

**建議修復**:
```typescript
// 多層速率限制
class RateLimiter {
  private userLimits = new Map<string, number[]>();
  private ipLimits = new Map<string, number[]>();
  private globalLimit: number[] = [];
  
  checkLimits(userId: string, ip: string): boolean {
    // 用戶級別：10 次/分鐘
    // IP 級別：100 次/分鐘
    // 全局級別：1000 次/分鐘
    return true;
  }
}
```

**優先級**: 🟠 **高優先級**

---

## ⚠️ 中等風險問題

### 9. 缺少會話綁定 [MEDIUM]

**問題**: 會話 token 沒有綁定到 IP 或 User-Agent

**風險**: 會話劫持

**建議**: 將 token 與指紋信息綁定

---

### 10. 錯誤信息可能洩露系統信息 [MEDIUM]

**問題**: 錯誤消息包含過多內部細節

**建議**: 使用通用錯誤消息，詳細信息記錄到審計日誌

---

### 11. TypeScript 嚴格模式未完全啟用 [MEDIUM]

**位置**: `tsconfig.json`

**問題**:
```json
{
  "strict": true,  // ✅ 正確
  // 但缺少:
  "noImplicitOverride": true,
  "noUncheckedIndexedAccess": true
}
```

---

### 12. 依賴版本未鎖定 [MEDIUM]

**位置**: `package.json`

**問題**:
```json
{
  "dependencies": {
    "ssh2": "^1.15.0",  // ⚠️ ^ 允許小版本更新
    "bcryptjs": "^2.4.3"
  }
}
```

**建議**: 使用精確版本或 `npm shrinkwrap`

---

## ✅ 已正確實現的安全特性

1. ✅ **AES-256-GCM 加密** - 正確的認證加密模式
2. ✅ **隨機 IV 生成** - 每次加密使用新 IV
3. ✅ **HMAC 驗證** - GCM 模式內置完整性檢查
4. ✅ **bcrypt 密碼哈希** - 正確的密碼存儲方式
5. ✅ **TOTP 實現** - 使用 speakeasy 庫
6. ✅ **審計日誌** - 全面的事件記錄
7. ✅ **RBAC 權限控制** - 最小權限原則
8. ✅ **環境驗證** - 配置檢查

---

## 🔧 立即修復清單

### 必須修復 (Critical)
- [ ] 實現安全的密鑰存儲 (HSM/KMS/DPAPI)
- [ ] 添加密鑰派生函數 (PBKDF2/Argon2)
- [ ] 實現自動密鑰輪換機制
- [ ] 修復 IV 重用檢查

### 高優先級 (High)
- [ ] 增加 bcrypt rounds 到 14+
- [ ] 添加密碼複雜度檢查
- [ ] 哈希存儲 MFA 備用代碼
- [ ] 實現敏感信息過濾
- [ ] 多層速率限制

### 中等優先級 (Medium)
- [ ] 會話綁定
- [ ] 錯誤信息脫敏
- [ ] 鎖定依賴版本
- [ ] 啟用更多 TypeScript 嚴格檢查

---

## 📋 安全配置檢查清單

### 環境變量安全
- [ ] `ENCRYPTION_MASTER_KEY` 長度 >= 64 字符
- [ ] `REDIS_PASSWORD` 使用強密碼
- [ ] `.env` 文件權限設置為 600
- [ ] 不使用默認密碼

### SSH 配置
- [ ] `SSH_ALLOW_PASSWORD_AUTH=false`
- [ ] `SSH_REQUIRE_KEY_AUTH=true`
- [ ] `SSH_KEY_TYPE=ed25519`
- [ ] `SSH_KEY_MIN_BITS=4096` (如果使用 RSA)

### MFA 配置
- [ ] `MFA_ENABLED=true`
- [ ] `MFA_REQUIRED_FOR_PRODUCTION=true`
- [ ] `MFA_TOTP_DIGITS=6` 或 `8`
- [ ] 備用代碼安全存儲

### 審計配置
- [ ] `AUDIT_ENABLED=true`
- [ ] `AUDIT_LOG_FORMAT=json`
- [ ] `AUDIT_RETENTION_DAYS=90`
- [ ] 日誌文件權限 600

---

## 🎯 改進建議

### 短期 (1-2 週)
1. 修復所有 Critical 和 High 問題
2. 實施密鑰管理最佳實踐
3. 添加安全測試

### 中期 (1-2 月)
1. 實現 HSM/KMS 集成
2. 添加實時安全監控
3. 實施安全 SDLC

### 長期 (3-6 月)
1. SOC2 Type II 認證
2. 定期第三方安全審計
3. 漏洞賞金計劃

---

## 📞 聯絡安全團隊

發現安全問題請聯繫：
- Email: security@example.com
- PGP Key: [下載](#)

---

**下次評估日期**: 2026-09-19  
**評估負責人**: Security Team
