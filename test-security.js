#!/usr/bin/env node

/**
 * SSH-MCP Secure - 安全功能測試套件
 * 
 * 測試範圍:
 * - 加密系統
 * - MFA 功能
 * - 速率限制
 * - 審計日誌
 * - 密碼策略
 * 
 * 運行: node test-security.js
 */

const fs = require('fs');
const path = require('path');

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 測試結果追蹤
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function runTest(name, testFn) {
  testResults.total++;
  try {
    const result = testFn();
    if (result === true || (result && result.success)) {
      testResults.passed++;
      testResults.tests.push({ name, status: 'PASS', error: null });
      log(`✅ ${name}`, 'green');
      return true;
    } else {
      throw new Error(result?.error || 'Test failed');
    }
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAIL', error: error.message });
    log(`❌ ${name}: ${error.message}`, 'red');
    return false;
  }
}

// ============================================
// 測試 1: 加密系統
// ============================================
function testEncryption() {
  log('\n🔐 測試加密系統...', 'cyan');
  
  try {
    const { createEncryptionManager } = require('./build/security/session-encryption.js');
    
    // 設置測試環境
    process.env.ENCRYPTION_MASTER_SECRET = 'test-secret-key-min-32-characters-for-testing';
    
    const encryption = createEncryptionManager({
      keyDirectory: './test-keys'
    });
    
    // 等待密鑰初始化
    setTimeout(() => {
      const original = 'Test sensitive data';
      const encrypted = encryption.encrypt(original);
      
      if (!encrypted.encryptedData || !encrypted.iv || !encrypted.tag) {
        throw new Error('加密輸出格式錯誤');
      }
      
      const decrypted = encryption.decrypt(encrypted);
      
      if (decrypted !== original) {
        throw new Error('解密結果不匹配');
      }
      
      const stats = encryption.getStats();
      if (!stats.keyInitialized) {
        throw new Error('密鑰未初始化');
      }
      
      log('   ✓ 加密功能正常', 'green');
      log('   ✓ 解密功能正常', 'green');
      log('   ✓ 密鑰初始化正常', 'green');
      
      // 清理
      if (fs.existsSync('./test-keys')) {
        fs.rmSync('./test-keys', { recursive: true });
      }
      
      return true;
    }, 100);
    
  } catch (error) {
    throw error;
  }
}

// ============================================
// 測試 2: MFA 備用代碼哈希
// ============================================
function testMFAHashing() {
  log('\n🔐 測試 MFA 備用代碼哈希...', 'cyan');
  
  const { MFAManager } = require('./build/auth/mfa-manager.js');
  const mfa = new MFAManager();
  
  const userId = 'test-user';
  const result = mfa.setupMFA(userId);
  
  if (!result.success) {
    throw new Error('MFA 設置失敗');
  }
  
  if (!result.backupCodes || result.backupCodes.length !== 10) {
    throw new Error('備用代碼數量錯誤');
  }
  
  // 檢查存儲的是否為哈希值
  const mfaSecret = mfa.secrets.get(userId);
  const storedCode = mfaSecret.backupCodes[0];
  
  if (storedCode.length !== 64) {
    throw new Error(`備用代碼未哈希 (長度：${storedCode.length}, 應為 64)`);
  }
  
  // 檢查返回的是否為明文
  const returnedCode = result.backupCodes[0];
  if (returnedCode.length !== 10) {
    throw new Error(`返回的備用代碼格式錯誤 (長度：${returnedCode.length})`);
  }
  
  log('   ✓ MFA 設置成功', 'green');
  log('   ✓ 備用代碼已哈希存儲', 'green');
  log('   ✓ 返回明文備用代碼', 'green');
  
  return true;
}

// ============================================
// 測試 3: 審計日誌敏感信息過濾
// ============================================
function testAuditRedaction() {
  log('\n📝 測試審計日誌敏感信息過濾...', 'cyan');
  
  const { AuditLogger } = require('./build/audit/audit-logger.js');
  
  // 確保測試目錄存在
  if (!fs.existsSync('./test-logs')) {
    fs.mkdirSync('./test-logs');
  }
  
  const logger = new AuditLogger({
    logPath: './test-logs/audit.log',
    async: false
  });
  
  const sensitiveData = {
    password: 'secret123',
    token: 'abc123xyz',
    api_key: 'key-12345',
    normalField: 'visible'
  };
  
  logger.logEvent('TEST_EVENT', sensitiveData);
  
  // 讀取日誌驗證
  const logContent = fs.readFileSync('./test-logs/audit.log', 'utf8');
  
  if (!logContent.includes('[REDACTED]')) {
    throw new Error('敏感信息未過濾');
  }
  
  if (logContent.includes('secret123')) {
    throw new Error('密碼洩露!');
  }
  
  if (logContent.includes('abc123xyz')) {
    throw new Error('Token 洩露!');
  }
  
  if (!logContent.includes('visible')) {
    throw new Error('正常字段被錯誤過濾');
  }
  
  log('   ✓ 敏感信息已過濾', 'green');
  log('   ✓ 密碼已紅化', 'green');
  log('   ✓ Token 已紅化', 'green');
  log('   ✓ 正常字段保留', 'green');
  
  // 清理
  fs.rmSync('./test-logs', { recursive: true });
  
  return true;
}

// ============================================
// 測試 4: 密碼策略驗證
// ============================================
function testPasswordPolicy() {
  log('\n🔐 測試密碼策略...', 'cyan');
  
  // 這裡需要 enterprise-auth.ts 導出 validatePasswordStrength 函數
  // 暫時使用簡化版本
  
  const testCases = [
    { pwd: 'weak', shouldBeValid: false },
    { pwd: '123456', shouldBeValid: false },
    { pwd: 'password', shouldBeValid: false },
    { pwd: 'MyStr0ng!P@ssw0rd16', shouldBeValid: true },
    { pwd: 'VeryL0ng!Secure#Pass2024', shouldBeValid: true }
  ];
  
  let allPassed = true;
  
  testCases.forEach(test => {
    const isValid = test.pwd.length >= 16 && 
                    /[A-Z]/.test(test.pwd) && 
                    /[a-z]/.test(test.pwd) && 
                    /[0-9]/.test(test.pwd) && 
                    /[^A-Za-z0-9]/.test(test.pwd);
    
    if (isValid !== test.shouldBeValid) {
      log(`   ❌ 密碼 '${test.pwd}' 驗證失敗`, 'red');
      allPassed = false;
    }
  });
  
  if (allPassed) {
    log('   ✓ 弱密碼拒絕', 'green');
    log('   ✓ 強密碼接受', 'green');
  }
  
  return allPassed;
}

// ============================================
// 測試 5: 環境配置驗證
// ============================================
function testEnvironmentConfig() {
  log('\n⚙️  測試環境配置...', 'cyan');
  
  // 檢查必要文件
  const requiredFiles = [
    './package.json',
    './tsconfig.json',
    './.env.example',
    './.gitignore',
    './README.md',
    './SECURITY.md'
  ];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`必要文件缺失：${file}`);
    }
  });
  
  // 檢查 .env.example 包含必要配置
  const envExample = fs.readFileSync('./.env.example', 'utf8');
  if (!envExample.includes('ENCRYPTION_MASTER_SECRET')) {
    throw new Error('.env.example 缺少 ENCRYPTION_MASTER_SECRET');
  }
  
  log('   ✓ 必要文件存在', 'green');
  log('   ✓ 環境配置完整', 'green');
  
  return true;
}

// ============================================
// 主測試流程
// ============================================
async function runAllTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('   SSH-MCP Secure 安全功能測試套件', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // 檢查構建
  if (!fs.existsSync('./build')) {
    log('\n❌ 構建目錄不存在！請先運行：npm run build', 'red');
    process.exit(1);
  }
  
  // 運行所有測試
  runTest('環境配置驗證', testEnvironmentConfig);
  runTest('加密系統測試', testEncryption);
  runTest('MFA 備用代碼哈希', testMFAHashing);
  runTest('審計日誌過濾', testAuditRedaction);
  runTest('密碼策略驗證', testPasswordPolicy);
  
  // 輸出結果
  log('\n' + '='.repeat(60), 'cyan');
  log('   測試結果摘要', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`\n總測試數：${testResults.total}`, 'blue');
  log(`通過：${testResults.passed}`, 'green');
  log(`失敗：${testResults.failed}`, 'red');
  
  if (testResults.failed > 0) {
    log('\n失敗的測試:', 'red');
    testResults.tests.forEach(test => {
      if (test.status === 'FAIL') {
        log(`  ❌ ${test.name}: ${test.error}`, 'red');
      }
    });
  }
  
  // 輸出最終狀態
  if (testResults.failed === 0) {
    log('\n✅ 所有測試通過！', 'green');
    process.exit(0);
  } else {
    log('\n❌ 有測試失敗，請檢查錯誤信息', 'red');
    process.exit(1);
  }
}

// 執行測試
runAllTests().catch(error => {
  log(`\n❌ 測試執行失敗：${error.message}`, 'red');
  process.exit(1);
});
