# 🧪 SSH-MCP Secure 測試驗證指南

**測試版本**: 1.0.0  
**測試日期**: 2026-08-19  
**測試範圍**: 安全功能 + 核心功能

---

## 📋 測試清單

### 階段一：環境準備 (5 分鐘)
- [ ] 安裝 Node.js 18+
- [ ] 安裝依賴
- [ ] 配置環境變量
- [ ] 構建項目

### 階段二：安全功能測試 (15 分鐘)
- [ ] 加密系統測試
- [ ] MFA 功能測試
- [ ] 速率限制測試
- [ ] 審計日誌測試
- [ ] 密碼策略測試

### 階段三：核心功能測試 (10 分鐘)
- [ ] 服務器啟動測試
- [ ] 會話管理測試
- [ ] 命令執行測試
- [ ] RBAC 權限測試

### 階段四：集成測試 (10 分鐘)
- [ ] 完整工作流程測試
- [ ] 錯誤處理測試
- [ ] 性能測試

---

## 🔧 階段一：環境準備

### 步驟 1: 檢查 Node.js

```bash
node --version
# 應該顯示：v18.x.x 或更高
```

### 步驟 2: 安裝依賴

```bash
cd C:/Users/brian/Projects/ssh-mcp-secure
npm install
```

**預期結果**:
- ✅ 所有依賴安裝成功
- ✅ 無錯誤信息
- ✅ node_modules 目錄創建

### 步驟 3: 配置環境變量

創建 `.env` 文件：

```bash
# 測試環境配置
ENCRYPTION_MASTER_SECRET=test-secret-key-min-32-characters-for-testing
SERVER_ENV=development
LOG_LEVEL=debug
MFA_ENABLED=true
AUDIT_ENABLED=true
SSH_ALLOW_PASSWORD_AUTH=false
SSH_REQUIRE_KEY_AUTH=true
```

### 步驟 4: 構建項目

```bash
npm run build
```

**預期結果**:
- ✅ TypeScript 編譯成功
- ✅ build 目錄創建
- ✅ index.js 生成

---

## 🔐 階段二：安全功能測試

### 測試 1: 加密系統驗證

**測試文件**: `src/security/session-encryption.ts`

```bash
# 創建測試腳本
node -e "
const { createEncryptionManager } = require('./build/security/session-encryption.js');

console.log('🔐 測試加密系統...');

try {
  const encryption = createEncryptionManager({
    keyDirectory: './test-keys'
  });
  
  // 測試加密
  const original = 'Test sensitive data';
  const encrypted = encryption.encrypt(original);
  console.log('✅ 加密成功');
  
  // 測試解密
  const decrypted = encryption.decrypt(encrypted);
  console.log('✅ 解密成功');
  
  // 驗證
  if (decrypted === original) {
    console.log('✅ 加密/解密驗證通過');
  } else {
    console.log('❌ 加密/解密驗證失敗');
  }
  
  // 測試統計
  const stats = encryption.getStats();
  console.log('📊 加密統計:', stats);
  
} catch (error) {
  console.log('❌ 加密系統測試失敗:', error.message);
}
"
```

**預期輸出**:
```
🔐 測試加密系統...
✅ Master key loaded from secure storage
✅ 加密成功
✅ 解密成功
✅ 加密/解密驗證通過
📊 加密統計: { keyInitialized: true, ... }
```

---

### 測試 2: MFA 功能驗證

**測試文件**: `src/auth/mfa-manager.ts`

```bash
node -e "
const { MFAManager } = require('./build/auth/mfa-manager.js');

console.log('🔐 測試 MFA 系統...');

const mfa = new MFAManager();

// 測試設置 MFA
const userId = 'test-user';
mfa.setupMFA(userId).then(result => {
  if (result.success) {
    console.log('✅ MFA 設置成功');
    console.log('   備用代碼數量:', result.backupCodes?.length);
    
    // 測試備用代碼是否哈希存儲
    const mfaSecret = mfa.secrets.get(userId);
    console.log('   備用代碼已哈希:', mfaSecret.backupCodes[0].length === 64);
    
    // 測試 TOTP 驗證（需要真實 TOTP 碼）
    console.log('⚠️  手動 TOTP 驗證需要真實的 TOTP 碼');
    
  } else {
    console.log('❌ MFA 設置失敗:', result.error);
  }
});
"
```

**預期輸出**:
```
🔐 測試 MFA 系統...
🔐 MFA Manager initialized
✅ MFA 設置成功
   備用代碼數量：10
   備用代碼已哈希：true (64 字符 SHA-256)
```

---

### 測試 3: 速率限制驗證

**測試文件**: `src/auth/enterprise-auth.ts`

```bash
node -e "
const { EnterpriseAuthManager } = require('./build/auth/enterprise-auth.js');
const { MFAManager } = require('./build/auth/mfa-manager.js');

console.log('🔐 測試速率限制...');

const mfa = new MFAManager();
const auth = new EnterpriseAuthManager(mfa);

// 模擬多次失敗嘗試
const userId = 'rate-limit-test';
const ip = '192.168.1.1';

async function testRateLimit() {
  console.log('模擬 10 次連續認證嘗試...');
  
  for (let i = 1; i <= 10; i++) {
    const result = await auth.authenticateWithKey(
      userId,
      'invalid-key',
      'invalid-signature',
      { ipAddress: ip }
    );
    
    if (i <= 5) {
      console.log(\`   嘗試 \${i}: \${result.success ? '✅' : '❌'}\`);
    } else {
      console.log(\`   嘗試 \${i}: \${result.error?.includes('rate') ? '🔒 速率限制觸發' : '❌'}\`);
    }
  }
  
  console.log('✅ 速率限制測試完成');
}

testRateLimit();
"
```

**預期輸出**:
```
🔐 測試速率限制...
🔐 Enterprise Authentication Manager initialized
模擬 10 次連續認證嘗試...
   嘗試 1: ❌
   嘗試 2: ❌
   嘗試 3: ❌
   嘗試 4: ❌
   嘗試 5: ❌
   嘗試 6: 🔒 速率限制觸發
   嘗試 7: 🔒 速率限制觸發
   ...
✅ 速率限制測試完成
```

---

### 測試 4: 審計日誌驗證

**測試文件**: `src/audit/audit-logger.ts`

```bash
node -e "
const { AuditLogger } = require('./build/audit/audit-logger.js');

console.log('📝 測試審計日誌...');

const logger = new AuditLogger({
  logPath: './test-logs/audit.log',
  async: false
});

// 測試敏感信息過濾
const sensitiveData = {
  password: 'secret123',
  token: 'abc123xyz',
  normalField: 'visible'
};

logger.logEvent('TEST_EVENT', sensitiveData).then(() => {
  console.log('✅ 審計日誌寫入成功');
  
  // 讀取日誌驗證過濾
  const fs = require('fs');
  const logContent = fs.readFileSync('./test-logs/audit.log', 'utf8');
  
  if (logContent.includes('[REDACTED]')) {
    console.log('✅ 敏感信息已過濾');
  } else {
    console.log('❌ 敏感信息未過濾');
  }
  
  if (!logContent.includes('secret123')) {
    console.log('✅ 密碼已紅化');
  } else {
    console.log('❌ 密碼洩露!');
  }
  
  console.log('📄 日誌內容預覽:');
  console.log(logContent.substring(0, 200));
});
"
```

**預期輸出**:
```
📝 測試審計日誌...
📝 Audit Logger initialized
✅ 審計日誌寫入成功
✅ 敏感信息已過濾
✅ 密碼已紅化
📄 日誌內容預覽:
{"id":"audit_...","eventType":"TEST_EVENT","details":{"password":"[REDACTED]","token":"[REDACTED]","normalField":"visible"}}
```

---

### 測試 5: 密碼策略驗證

**測試文件**: `src/auth/enterprise-auth.ts`

```bash
node -e "
console.log('🔐 測試密碼策略...');

const testPasswords = [
  { pwd: 'weak', expected: 'weak' },
  { pwd: 'Password123', expected: 'medium' },
  { pwd: 'MyStr0ng!P@ssw0rd', expected: 'strong' },
  { pwd: 'VeryL0ng!Secure#Pass2024', expected: 'very_strong' },
  { pwd: '123456', expected: 'weak' },
  { pwd: 'password', expected: 'weak' }
];

// 導入驗證函數（需要從構建的文件中導出）
// 這裡是示例，實際需要修改 enterprise-auth.ts 導出 validatePasswordStrength

testPasswords.forEach(test => {
  const pwd = test.pwd;
  const score = evaluatePassword(pwd);  // 需要實現這個函數
  console.log(\`   '\${pwd}': \${score.strength} \${score.valid ? '✅' : '❌'}\`);
});

function evaluatePassword(pwd) {
  // 簡化版本
  if (pwd.length < 16) return { valid: false, strength: 'weak' };
  if (pwd.length >= 20 && /[^A-Za-z0-9]/.test(pwd)) {
    return { valid: true, strength: 'very_strong' };
  }
  return { valid: true, strength: 'strong' };
}

console.log('✅ 密碼策略測試完成');
"
```

---

## ⚙️ 階段三：核心功能測試

### 測試 6: 服務器啟動測試

```bash
# 啟動服務器（測試模式）
npm start

# 應該看到:
# ✅ SSH-MCP Secure Server initialized
# 🔐 Security Mode: DEVELOPMENT
# 🔑 MFA Enabled: true
# 🔒 Encryption: AES-256-GCM
# 📝 Audit Logging enabled
# 🚀 SSH-MCP Secure Server running on stdio
```

---

### 測試 7: 會話管理測試

（需要服務器運行中）

```bash
# 通過 MCP 客戶端測試
# 測試會話創建、列出、關閉
```

---

## 📊 測試報告模板

### 測試結果摘要

| 測試項目 | 狀態 | 備註 |
|---------|------|------|
| 環境準備 | ⏳ 待測試 | |
| 加密系統 | ⏳ 待測試 | |
| MFA 功能 | ⏳ 待測試 | |
| 速率限制 | ⏳ 待測試 | |
| 審計日誌 | ⏳ 待測試 | |
| 密碼策略 | ⏳ 待測試 | |
| 服務器啟動 | ⏳ 待測試 | |
| 會話管理 | ⏳ 待測試 | |

### 問題追蹤

| 問題 ID | 嚴重性 | 描述 | 狀態 |
|--------|--------|------|------|
| - | - | - | - |

---

## 🚀 運行完整測試套件

```bash
# 一鍵運行所有測試
npm test

# 運行安全測試
npm run test:security

# 運行覆蓋率測試
npm run test:coverage
```

---

## ✅ 驗收標準

### 必須通過 (Critical)
- [ ] 加密/解密功能正常
- [ ] MFA 備用代碼哈希存儲
- [ ] 速率限制生效
- [ ] 審計日誌過濾敏感信息
- [ ] 服務器正常啟動

### 應該通過 (High)
- [ ] 密碼策略驗證正確
- [ ] RBAC 權限控制正常
- [ ] 會話管理正常
- [ ] 錯誤處理恰當

### 建議通過 (Medium)
- [ ] 性能指標達標
- [ ] 日誌輪轉正常
- [ ] 密鑰輪轉正常

---

**測試完成後填寫測試報告並提交！**
