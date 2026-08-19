#!/usr/bin/env node

/**
 * SSH 目錄掃描工具
 * 掃描指定目錄下的所有資料夾
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

console.log('='.repeat(70));
console.log('   SSH 目錄掃描工具');
console.log('='.repeat(70));
console.log();

// 獲取配置
const host = process.env.SERV02_HOST || '192.168.68.64';
const port = parseInt(process.env.SERV02_PORT || '22');
const username = process.env.SERV02_USERNAME || 'brian';
const password = process.env.SERV02_PASSWORD || '';
const privateKeyPath = process.env.SERV02_PRIVATE_KEY_PATH || '';

// 要掃描的目錄
const targetDir = process.argv[2] || '/home/brian/Projects';

console.log('掃描目標:');
console.log(`  服務器：${host}`);
console.log(`  目錄：${targetDir}`);
console.log();

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

console.log('正在連接 SSH...');
console.log();

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH 連接成功');
  console.log();
  
  // 掃描目錄
  console.log(`正在掃描 ${targetDir}...`);
  console.log();
  
  conn.exec(`ls -la ${targetDir}`, (err, stream) => {
    if (err) {
      console.log('❌ 掃描失敗:', err.message);
      conn.end();
      return;
    }
    
    let output = '';
    let errorOutput = '';
    
    stream.on('close', (code) => {
      if (code !== 0) {
        console.log('❌ 命令執行失敗，退出碼:', code);
        if (errorOutput) {
          console.log('錯誤:', errorOutput);
        }
        conn.end();
        return;
      }
      
      // 解析輸出
      const lines = output.trim().split('\n');
      
      console.log('='.repeat(70));
      console.log(`   📁 ${targetDir} 目錄內容`);
      console.log('='.repeat(70));
      console.log();
      
      const folders = [];
      const files = [];
      
      lines.forEach((line, index) => {
        if (index === 0) return; // 跳過總計行
        
        const parts = line.trim().split(/\s+/);
        if (parts.length < 9) return;
        
        const type = parts[0][0];
        const name = parts.slice(8).join(' ');
        const size = parts[4];
        const date = parts.slice(5, 8).join(' ');
        
        if (type === 'd') {
          folders.push({ name, size, date });
        } else if (type === '-') {
          files.push({ name, size, date });
        }
      });
      
      // 顯示資料夾
      if (folders.length > 0) {
        console.log(`📂 資料夾 (${folders.length} 個):`);
        console.log('-'.repeat(70));
        folders.forEach(folder => {
          console.log(`  📁 ${folder.name}`);
          console.log(`     大小：${folder.size} bytes | 修改時間：${folder.date}`);
        });
        console.log();
      }
      
      // 顯示文件
      if (files.length > 0) {
        console.log(`📄 文件 (${files.length} 個):`);
        console.log('-'.repeat(70));
        files.forEach(file => {
          console.log(`  📄 ${file.name}`);
          console.log(`     大小：${file.size} bytes | 修改時間：${file.date}`);
        });
        console.log();
      }
      
      // 統計
      console.log('='.repeat(70));
      console.log('   📊 統計');
      console.log('='.repeat(70));
      console.log(`  資料夾數量：${folders.length}`);
      console.log(`  文件數量：${files.length}`);
      console.log(`  總計：${folders.length + files.length} 個項目`);
      console.log();
      
      // 掃描每個資料夾的內容（可選）
      if (folders.length > 0) {
        console.log('='.repeat(70));
        console.log('   🔍 詳細掃描每個資料夾');
        console.log('='.repeat(70));
        console.log();
        
        let completed = 0;
        
        folders.forEach((folder, index) => {
          const folderPath = `${targetDir}/${folder.name}`;
          
          conn.exec(`find ${folderPath} -maxdepth 2 -type f | wc -l`, (err, stream) => {
            if (err) {
              console.log(`  ❌ ${folder.name}: 無法掃描`);
              completed++;
              if (completed === folders.length) {
                conn.end();
              }
              return;
            }
            
            let count = '';
            stream.on('close', () => {
              const fileCount = count.trim() || '0';
              console.log(`  📁 ${folder.name}/`);
              console.log(`     文件數量：${fileCount}`);
              
              // 掃描子資料夾
              conn.exec(`find ${folderPath} -maxdepth 2 -type d | wc -l`, (err, stream) => {
                if (!err) {
                  let dirCount = '';
                  stream.on('close', () => {
                    const subfolderCount = dirCount.trim() || '0';
                    console.log(`     子資料夾數量：${subfolderCount}`);
                    console.log();
                    
                    completed++;
                    if (completed === folders.length) {
                      console.log('='.repeat(70));
                      console.log('   ✅ 掃描完成！');
                      console.log('='.repeat(70));
                      conn.end();
                    }
                  });
                  stream.on('data', (data) => {
                    dirCount += data.toString();
                  });
                }
              });
            });
            
            stream.on('data', (data) => {
              count += data.toString();
            });
          });
        });
      } else {
        conn.end();
      }
    });
    
    stream.on('data', (data) => {
      output += data.toString();
    });
    
    stream.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
  });
});

conn.on('error', (err) => {
  console.log('❌ SSH 連接失敗:', err.message);
  process.exit(1);
});

conn.connect(connConfig);
