#!/usr/bin/env node

/**
 * SSH 批量命令執行工具
 * 支持批量執行命令、會話歷史記錄
 */

import { Client } from 'ssh2';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加載環境變量
config();

// 命令行參數
const args = process.argv.slice(2);
const commandsFile = args[0] || 'commands.txt';
const outputFile = args[1] || 'output.json';

console.log('='.repeat(70));
console.log('   SSH 批量命令執行工具');
console.log('='.repeat(70));
console.log();
console.log(`命令文件：${commandsFile}`);
console.log(`輸出文件：${outputFile}`);
console.log();

// 會話歷史
const sessionHistory = {
  startTime: new Date().toISOString(),
  host: process.env.SERV02_HOST || '192.168.68.64',
  username: process.env.SERV02_USERNAME || 'brian',
  commands: [],
  summary: {
    total: 0,
    success: 0,
    failed: 0
  }
};

// 讀取命令文件
let commands = [];
if (fs.existsSync(commandsFile)) {
  const content = fs.readFileSync(commandsFile, 'utf8');
  commands = content.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
  
  console.log(`✅ 已加載 ${commands.length} 個命令`);
  console.log();
} else {
  console.log('⚠️  命令文件不存在，使用默認命令列表');
  console.log();
  
  // 默認命令
  commands = [
    'uname -a',
    'whoami',
    'pwd',
    'ls -la',
    'df -h',
    'free -m',
    'uptime',
    'who',
    'ps aux | head -20',
    'netstat -tuln | head -20'
  ];
  
  console.log('默認命令列表:');
  commands.forEach((cmd, i) => {
    console.log(`  ${i + 1}. ${cmd}`);
  });
  console.log();
}

const host = process.env.SERV02_HOST || '192.168.68.64';
const port = parseInt(process.env.SERV02_PORT || '22');
const username = process.env.SERV02_USERNAME || 'brian';
const password = process.env.SERV02_PASSWORD || '';
const privateKeyPath = process.env.SERV02_PRIVATE_KEY_PATH || '';

// 準備連接配置
const connConfig = {
  host: host,
  port: port,
  username: username,
  readyTimeout: 10000,
};

if (password) {
  connConfig.password = password;
} else if (privateKeyPath && fs.existsSync(privateKeyPath)) {
  connConfig.privateKey = fs.readFileSync(privateKeyPath, 'utf8');
}

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH 連接成功');
  console.log();
  console.log('開始執行批量命令...');
  console.log();
  
  sessionHistory.host = `${host}:${port}`;
  sessionHistory.username = username;
  
  // 執行所有命令
  executeCommands(conn, commands, 0);
});

conn.on('error', (err) => {
  console.log('❌ SSH 連接失敗:', err.message);
  process.exit(1);
});

conn.connect(connConfig);

// 遞歸執行命令
function executeCommands(conn, commands, index) {
  if (index >= commands.length) {
    // 所有命令執行完畢
    finishSession();
    return;
  }
  
  const command = commands[index];
  console.log(`[${index + 1}/${commands.length}] 執行：${command}`);
  
  const startTime = Date.now();
  
  conn.exec(command, (err, stream) => {
    if (err) {
      console.log(`  ❌ 錯誤：${err.message}`);
      sessionHistory.commands.push({
        command: command,
        success: false,
        error: err.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
      sessionHistory.summary.failed++;
      
      index++;
      executeCommands(conn, commands, index);
      return;
    }
    
    let output = '';
    let errorOutput = '';
    
    stream.on('close', (code) => {
      const duration = Date.now() - startTime;
      const success = code === 0;
      
      if (success) {
        console.log(`  ✅ 成功 (${duration}ms)`);
        sessionHistory.summary.success++;
      } else {
        console.log(`  ⚠️  退出碼：${code} (${duration}ms)`);
        sessionHistory.summary.failed++;
      }
      
      // 顯示部分輸出
      const lines = output.trim().split('\n');
      if (lines.length <= 10) {
        lines.forEach(line => {
          console.log(`     ${line}`);
        });
      } else {
        lines.slice(0, 5).forEach(line => {
          console.log(`     ${line}`);
        });
        console.log(`     ... (${lines.length - 10} 行省略)`);
        lines.slice(-5).forEach(line => {
          console.log(`     ${line}`);
        });
      }
      console.log();
      
      sessionHistory.commands.push({
        command: command,
        success: success,
        exitCode: code,
        output: output.trim(),
        error: errorOutput.trim(),
        duration: duration,
        timestamp: new Date().toISOString()
      });
      
      index++;
      executeCommands(conn, commands, index);
    });
    
    stream.on('data', (data) => {
      output += data.toString();
    });
    
    stream.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
  });
}

// 結束會話
function finishSession() {
  sessionHistory.endTime = new Date().toISOString();
  sessionHistory.summary.total = sessionHistory.commands.length;
  
  const totalDuration = sessionHistory.commands.reduce((sum, cmd) => sum + cmd.duration, 0);
  sessionHistory.totalDuration = totalDuration;
  
  console.log('='.repeat(70));
  console.log('   📊 執行總結');
  console.log('='.repeat(70));
  console.log();
  console.log(`  總命令數：${sessionHistory.summary.total}`);
  console.log(`  成功：${sessionHistory.summary.success}`);
  console.log(`  失敗：${sessionHistory.summary.failed}`);
  console.log(`  總耗時：${totalDuration}ms (${(totalDuration/1000).toFixed(2)}秒)`);
  console.log(`  平均每個命令：${(totalDuration/sessionHistory.summary.total).toFixed(0)}ms`);
  console.log();
  
  // 保存會話歷史
  const absOutputFile = path.resolve(outputFile);
  fs.writeFileSync(absOutputFile, JSON.stringify(sessionHistory, null, 2), 'utf8');
  
  console.log(`✅ 會話歷史已保存到：${absOutputFile}`);
  console.log();
  console.log('='.repeat(70));
  console.log('   ✅ 批量執行完成！');
  console.log('='.repeat(70));
  
  conn.end();
}
