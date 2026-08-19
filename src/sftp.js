#!/usr/bin/env node

/**
 * SSH 文件傳輸工具
 * 支持文件上傳、下載、列表
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
const action = args[0]; // upload, download, list
const localPath = args[1];
const remotePath = args[2];

if (!action) {
  console.log('='.repeat(70));
  console.log('   SSH 文件傳輸工具');
  console.log('='.repeat(70));
  console.log();
  console.log('用法:');
  console.log('  node src/sftp.js upload <本地路徑> <遠程路徑>');
  console.log('  node src/sftp.js download <遠程路徑> <本地路徑>');
  console.log('  node src/sftp.js list <遠程目錄>');
  console.log();
  console.log('範例:');
  console.log('  node src/sftp.js upload ./test.txt /home/brian/test.txt');
  console.log('  node src/sftp.js download /home/brian/test.txt ./test.txt');
  console.log('  node src/sftp.js list /home/brian/Projects');
  console.log();
  process.exit(0);
}

const host = process.env.SERV02_HOST || '192.168.68.64';
const port = parseInt(process.env.SERV02_PORT || '22');
const username = process.env.SERV02_USERNAME || 'brian';
const password = process.env.SERV02_PASSWORD || '';
const privateKeyPath = process.env.SERV02_PRIVATE_KEY_PATH || '';

console.log('='.repeat(70));
console.log('   SSH 文件傳輸工具');
console.log('='.repeat(70));
console.log();
console.log(`操作：${action}`);
console.log(`服務器：${host}:${port}`);
console.log(`用戶：${username}`);
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

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH 連接成功');
  console.log();
  
  conn.sftp((err, sftp) => {
    if (err) {
      console.log('❌ SFTP 初始化失敗:', err.message);
      conn.end();
      return;
    }
    
    console.log('✅ SFTP 會話已建立');
    console.log();
    
    switch (action) {
      case 'list':
        listDirectory(sftp, localPath || '/home/brian/Projects');
        break;
      
      case 'upload':
        if (!localPath || !remotePath) {
          console.log('❌ 錯誤：需要指定本地路徑和遠程路徑');
          console.log('用法：node src/sftp.js upload <本地路徑> <遠程路徑>');
          conn.end();
          return;
        }
        uploadFile(sftp, localPath, remotePath);
        break;
      
      case 'download':
        if (!localPath || !remotePath) {
          console.log('❌ 錯誤：需要指定遠程路徑和本地路徑');
          console.log('用法：node src/sftp.js download <遠程路徑> <本地路徑>');
          conn.end();
          return;
        }
        downloadFile(sftp, localPath, remotePath);
        break;
      
      default:
        console.log('❌ 未知操作:', action);
        console.log('支持的操作：upload, download, list');
        conn.end();
    }
  });
});

conn.on('error', (err) => {
  console.log('❌ SSH 連接失敗:', err.message);
  process.exit(1);
});

conn.connect(connConfig);

// 列出目錄
function listDirectory(sftp, remoteDir) {
  console.log(`正在列出目錄：${remoteDir}`);
  console.log();
  
  sftp.readdir(remoteDir, (err, list) => {
    if (err) {
      console.log('❌ 讀取目錄失敗:', err.message);
      conn.end();
      return;
    }
    
    console.log('='.repeat(70));
    console.log(`   📁 ${remoteDir} 目錄內容`);
    console.log('='.repeat(70));
    console.log();
    
    const folders = [];
    const files = [];
    
    list.forEach(item => {
      if (item.attrs.isDirectory()) {
        folders.push(item);
      } else {
        files.push(item);
      }
    });
    
    if (folders.length > 0) {
      console.log(`📂 資料夾 (${folders.length} 個):`);
      console.log('-'.repeat(70));
      folders.forEach(folder => {
        console.log(`  📁 ${folder.filename}`);
        console.log(`     大小：${folder.attrs.size} bytes | 修改時間：${new Date(folder.attrs.mtime * 1000).toLocaleString()}`);
      });
      console.log();
    }
    
    if (files.length > 0) {
      console.log(`📄 文件 (${files.length} 個):`);
      console.log('-'.repeat(70));
      files.forEach(file => {
        console.log(`  📄 ${file.filename}`);
        console.log(`     大小：${file.attrs.size} bytes | 修改時間：${new Date(file.attrs.mtime * 1000).toLocaleString()}`);
      });
      console.log();
    }
    
    console.log('='.repeat(70));
    console.log('   ✅ 列出完成！');
    console.log('='.repeat(70));
    
    conn.end();
  });
}

// 上傳文件
function uploadFile(sftp, local, remote) {
  const absLocal = path.resolve(local);
  
  if (!fs.existsSync(absLocal)) {
    console.log('❌ 本地文件不存在:', absLocal);
    conn.end();
    return;
  }
  
  const stats = fs.statSync(absLocal);
  
  console.log(`正在上傳:`);
  console.log(`  本地：${absLocal} (${stats.size} bytes)`);
  console.log(`  遠程：${remote}`);
  console.log();
  
  sftp.fastPut(absLocal, remote, (err) => {
    if (err) {
      console.log('❌ 上傳失敗:', err.message);
      conn.end();
      return;
    }
    
    console.log('✅ 上傳成功！');
    console.log();
    console.log(`  本地：${absLocal}`);
    console.log(`  遠程：${remote}`);
    console.log(`  大小：${stats.size} bytes`);
    console.log();
    console.log('='.repeat(70));
    console.log('   ✅ 文件傳輸完成！');
    console.log('='.repeat(70));
    
    conn.end();
  });
}

// 下載文件
function downloadFile(sftp, remote, local) {
  const absLocal = path.resolve(local);
  
  console.log(`正在下載:`);
  console.log(`  遠程：${remote}`);
  console.log(`  本地：${absLocal}`);
  console.log();
  
  sftp.fastGet(remote, absLocal, (err) => {
    if (err) {
      console.log('❌ 下載失敗:', err.message);
      conn.end();
      return;
    }
    
    const stats = fs.statSync(absLocal);
    
    console.log('✅ 下載成功！');
    console.log();
    console.log(`  遠程：${remote}`);
    console.log(`  本地：${absLocal}`);
    console.log(`  大小：${stats.size} bytes`);
    console.log();
    console.log('='.repeat(70));
    console.log('   ✅ 文件傳輸完成！');
    console.log('='.repeat(70));
    
    conn.end();
  });
}
