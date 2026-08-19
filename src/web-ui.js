#!/usr/bin/env node

/**
 * SSH-MCP Web UI
 * 簡單的 Web 界面，用於 SSH 連接和命令執行
 */

import http from 'http';
import { Client } from 'ssh2';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加載環境變量
config();

const PORT = process.env.WEB_PORT || 3000;
const host = process.env.SERV02_HOST || '192.168.68.64';
const port = parseInt(process.env.SERV02_PORT || '22');
const username = process.env.SERV02_USERNAME || 'brian';
const password = process.env.SERV02_PASSWORD || '';
const privateKeyPath = process.env.SERV02_PRIVATE_KEY_PATH || '';

let sshConn = null;

console.log('='.repeat(70));
console.log('   SSH-MCP Web UI');
console.log('='.repeat(70));
console.log();
console.log(`服務器：http://localhost:${PORT}`);
console.log(`SSH 目標：${host}:${port} (${username})`);
console.log();
console.log('正在啟動 Web 服務器...');
console.log();

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 路由
  if (req.method === 'GET' && req.url === '/') {
    // 主頁面
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getHTML());
  } else if (req.method === 'GET' && req.url === '/status') {
    // 連接狀態
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      connected: sshConn !== null && sshConn._sock && sshConn._sock.readable,
      host: host,
      port: port,
      username: username
    }));
  } else if (req.method === 'POST' && req.url === '/execute') {
    // 執行命令
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { command } = JSON.parse(body);
        
        if (!command) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少 command 參數' }));
          return;
        }
        
        const result = await executeCommand(command);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (req.method === 'POST' && req.url === '/connect') {
    // 建立 SSH 連接
    try {
      await connectSSH();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'SSH 連接成功' }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  } else if (req.method === 'POST' && req.url === '/disconnect') {
    // 斷開 SSH 連接
    if (sshConn) {
      sshConn.end();
      sshConn = null;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: '已斷開連接' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log('✅ Web 服務器已啟動');
  console.log();
  console.log('訪問地址:');
  console.log(`  http://localhost:${PORT}`);
  console.log(`  http://127.0.0.1:${PORT}`);
  console.log();
  console.log('功能:');
  console.log('  - 查看 SSH 連接狀態');
  console.log('  - 執行遠程命令');
  console.log('  - 查看命令歷史');
  console.log();
  console.log('按 Ctrl+C 停止服務器');
  console.log('='.repeat(70));
});

// 連接 SSH
function connectSSH() {
  return new Promise((resolve, reject) => {
    if (sshConn) {
      resolve();
      return;
    }
    
    const conn = new Client();
    
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
    
    conn.on('ready', () => {
      sshConn = conn;
      resolve();
    });
    
    conn.on('error', (err) => {
      reject(err);
    });
    
    conn.connect(connConfig);
  });
}

// 執行命令
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    if (!sshConn) {
      reject(new Error('SSH 未連接'));
      return;
    }
    
    const startTime = Date.now();
    
    sshConn.exec(command, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }
      
      let output = '';
      let errorOutput = '';
      
      stream.on('close', (code) => {
        resolve({
          command: command,
          success: code === 0,
          exitCode: code,
          output: output.trim(),
          error: errorOutput.trim(),
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString()
        });
      });
      
      stream.on('data', (data) => {
        output += data.toString();
      });
      
      stream.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
    });
  });
}

// HTML 頁面
function getHTML() {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SSH-MCP Web UI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    h1 {
      color: #667eea;
      margin-bottom: 10px;
    }
    .status {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 0.9em;
      margin-bottom: 20px;
    }
    .status.connected { background: #4CAF50; color: white; }
    .status.disconnected { background: #f44336; color: white; }
    .input-group {
      margin: 20px 0;
      display: flex;
      gap: 10px;
    }
    input[type="text"] {
      flex: 1;
      padding: 15px;
      border: 2px solid #ddd;
      border-radius: 10px;
      font-size: 1em;
      transition: border-color 0.3s;
    }
    input[type="text"]:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      padding: 15px 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1em;
      cursor: pointer;
      transition: transform 0.2s;
    }
    button:hover {
      transform: scale(1.05);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .output {
      background: #f5f5f5;
      border-left: 4px solid #667eea;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 500px;
      overflow-y: auto;
    }
    .output.error {
      border-left-color: #f44336;
      background: #ffebee;
    }
    .history {
      margin-top: 30px;
    }
    .history-item {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 10px;
      margin: 10px 0;
      border-left: 3px solid #ddd;
    }
    .history-item.success { border-left-color: #4CAF50; }
    .history-item.error { border-left-color: #f44336; }
    .meta {
      font-size: 0.85em;
      color: #666;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔌 SSH-MCP Web UI</h1>
    <div id="status" class="status disconnected">檢查連接狀態...</div>
    
    <div class="input-group">
      <input type="text" id="command" placeholder="輸入 SSH 命令..." value="ls -la /home/brian/Projects">
      <button onclick="executeCommand()" id="execBtn">執行</button>
      <button onclick="connectSSH()" id="connectBtn">連接 SSH</button>
      <button onclick="disconnectSSH()" id="disconnectBtn" disabled>斷開</button>
    </div>
    
    <div id="output" class="output" style="display: none;"></div>
    
    <div class="history">
      <h2>📜 命令歷史</h2>
      <div id="historyList"></div>
    </div>
  </div>
  
  <script>
    const history = [];
    
    async function checkStatus() {
      try {
        const res = await fetch('/status');
        const data = await res.json();
        updateStatus(data.connected);
      } catch (err) {
        updateStatus(false);
      }
    }
    
    function updateStatus(connected) {
      const statusEl = document.getElementById('status');
      const connectBtn = document.getElementById('connectBtn');
      const disconnectBtn = document.getElementById('disconnectBtn');
      const execBtn = document.getElementById('execBtn');
      
      if (connected) {
        statusEl.className = 'status connected';
        statusEl.textContent = '✅ SSH 已連接';
        connectBtn.disabled = true;
        disconnectBtn.disabled = false;
        execBtn.disabled = false;
      } else {
        statusEl.className = 'status disconnected';
        statusEl.textContent = '❌ SSH 未連接';
        connectBtn.disabled = false;
        disconnectBtn.disabled = true;
        execBtn.disabled = true;
      }
    }
    
    async function connectSSH() {
      try {
        const res = await fetch('/connect', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          checkStatus();
          showOutput('✅ SSH 連接成功！', false);
        } else {
          showOutput('❌ 連接失敗：' + data.error, true);
        }
      } catch (err) {
        showOutput('❌ 錯誤：' + err.message, true);
      }
    }
    
    async function disconnectSSH() {
      try {
        const res = await fetch('/disconnect', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          checkStatus();
          showOutput('✅ 已斷開連接', false);
        }
      } catch (err) {
        showOutput('❌ 錯誤：' + err.message, true);
      }
    }
    
    async function executeCommand() {
      const command = document.getElementById('command').value.trim();
      if (!command) {
        alert('請輸入命令');
        return;
      }
      
      try {
        const res = await fetch('/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command })
        });
        const data = await res.json();
        
        if (data.error) {
          showOutput('❌ 錯誤：' + data.error, true);
        } else {
          showOutput(data.output || '(無輸出)', !data.success);
          addToHistory(data);
        }
      } catch (err) {
        showOutput('❌ 錯誤：' + err.message, true);
      }
    }
    
    function showOutput(text, isError) {
      const outputEl = document.getElementById('output');
      outputEl.style.display = 'block';
      outputEl.className = 'output' + (isError ? ' error' : '');
      outputEl.textContent = text;
    }
    
    function addToHistory(item) {
      history.unshift(item);
      if (history.length > 10) history.pop();
      
      const historyEl = document.getElementById('historyList');
      historyEl.innerHTML = history.map(item => \`
        <div class="history-item \${item.success ? 'success' : 'error'}">
          <strong>\${item.command}</strong>
          <div class="meta">
            \${item.success ? '✅' : '❌'} 
            退出碼：\${item.exitCode} | 
            耗時：\${item.duration}ms | 
            \${new Date(item.timestamp).toLocaleString()}
          </div>
        </div>
      \`).join('');
    }
    
    // 頁面加載時檢查狀態
    checkStatus();
    setInterval(checkStatus, 5000);
    
    // Enter 鍵執行
    document.getElementById('command').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') executeCommand();
    });
  </script>
</body>
</html>`;
}
