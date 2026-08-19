# 🚀 SSH-MCP 階段 2 實用功能使用指南

**更新日期**: 2026-08-19  
**狀態**: ✅ 已完成

---

## 📦 已實現的功能

### ✅ 功能 1: 文件上傳/下載 (SFTP)

**命令**: `npm run sftp`

#### 用法

```bash
# 列出遠程目錄
npm run sftp list /home/brian/Projects

# 上傳文件
npm run sftp upload ./local.txt /home/brian/remote.txt

# 下載文件
npm run sftp download /home/brian/remote.txt ./local.txt
```

#### 範例

```bash
# 查看 Projects 目錄
node src/sftp.js list /home/brian/Projects

# 上傳配置文件
node src/sftp.js upload ./config.json /home/brian/config.json

# 下載日誌文件
node src/sftp.js download /home/brian/app.log ./app.log
```

---

### ✅ 功能 2: 批量命令執行 + 會話歷史

**命令**: `npm run batch`

#### 用法

```bash
# 使用默認命令列表
npm run batch

# 使用自定義命令文件
npm run batch commands.txt

# 指定輸出文件
npm run batch commands.txt output.json
```

#### 命令文件格式

創建 `commands.txt`:

```bash
# 系統信息
uname -a
whoami
pwd

# 磁盤空間
df -h

# 內存使用
free -m

# 運行時間
uptime

# 進程列表
ps aux | head -20
```

#### 輸出範例

```json
{
  "startTime": "2026-08-19T10:00:00.000Z",
  "host": "192.168.68.64:22",
  "username": "brian",
  "commands": [
    {
      "command": "uname -a",
      "success": true,
      "exitCode": 0,
      "output": "Linux serv02 6.12.63...",
      "duration": 150,
      "timestamp": "2026-08-19T10:00:01.000Z"
    }
  ],
  "summary": {
    "total": 10,
    "success": 10,
    "failed": 0
  }
}
```

---

### ✅ 功能 3: Web UI

**命令**: `npm run web`

#### 啟動 Web 服務器

```bash
npm run web
```

#### 訪問

打開瀏覽器訪問：http://localhost:3000

#### 功能

- ✅ 查看 SSH 連接狀態
- ✅ 執行遠程命令
- ✅ 查看命令歷史
- ✅ 實時輸出顯示
- ✅ 錯誤提示

#### 界面特點

- 🎨 美觀的漸變色界面
- 📊 實時連接狀態顯示
- 📜 命令歷史記錄
- ⚡ 快速命令執行
- 📱 響應式設計

---

### ✅ 功能 4: 目錄掃描

**命令**: `npm run scan`

#### 用法

```bash
# 掃描默認目錄
npm run scan

# 掃描指定目錄
npm run scan /home/brian/Projects

# 掃描其他目錄
npm run scan /var/log
```

#### 輸出內容

- 📁 資料夾列表（名稱、大小、修改時間）
- 📄 文件列表（名稱、大小、修改時間）
- 📊 統計信息（資料夾數、文件數）
- 🔍 每個資料夾的詳細掃描（文件數、子資料夾數）

---

## 🎯 使用場景

### 場景 1: 部署項目

```bash
# 1. 上傳項目文件
npm run sftp upload ./my-app.zip /home/brian/my-app.zip

# 2. SSH 連接解壓
node src/core.js  # 修改命令為：unzip /home/brian/my-app.zip

# 3. 驗證部署
npm run sftp list /home/brian/my-app
```

### 場景 2: 批量收集系統信息

```bash
# 創建命令文件
cat > sysinfo.txt << EOF
uname -a
cat /etc/os-release
df -h
free -m
uptime
who
EOF

# 執行批量命令
npm run batch sysinfo.txt sysinfo.json
```

### 場景 3: 日常監控

```bash
# 啟動 Web UI
npm run web

# 在瀏覽器中執行監控命令
# - ps aux
# - top -b -n 1
# - netstat -tuln
# - df -h
```

### 場景 4: 日誌分析

```bash
# 下載日誌文件
npm run sftp download /var/log/app.log ./app.log

# 本地分析
# 或使用 Web UI 遠程查看
```

---

## 📋 快速參考

| 功能 | 命令 | 說明 |
|------|------|------|
| SSH 連接 | `npm start` | 基礎 SSH 連接測試 |
| 文件上傳 | `npm run sftp upload <本地> <遠程>` | 上傳文件到服務器 |
| 文件下載 | `npm run sftp download <遠程> <本地>` | 從服務器下載文件 |
| 目錄列表 | `npm run sftp list <目錄>` | 列出遠程目錄內容 |
| 批量執行 | `npm run batch [文件] [輸出]` | 批量執行命令 |
| Web UI | `npm run web` | 啟動 Web 界面 |
| 目錄掃描 | `npm run scan <目錄>` | 掃描目錄結構 |

---

## 🔧 配置

### 環境變量 (.env)

```ini
# SSH 配置
SERV02_HOST=192.168.68.64
SERV02_PORT=22
SERV02_USERNAME=brian
SERV02_PASSWORD=***
# 或
SERV02_PRIVATE_KEY_PATH=C:/Use...5519

# Web UI 配置
WEB_PORT=3000
```

---

## 💡 最佳實踐

### 1. 使用 SSH 密鑰認證

```bash
# 生成密鑰
ssh-keygen -t ed25519

# 複製到服務器
ssh-copy-id brian@192.168.68.64

# 在 .env 中配置
SERV02_PRIVATE_KEY_PATH=C:/Use...5519
```

### 2. 創建常用命令模板

```bash
# commands-deploy.txt
cd /home/brian/my-app
git pull
npm install
npm run build
pm2 restart my-app

# 執行
npm run batch commands-deploy.txt deploy-log.json
```

### 3. 定期備份

```bash
# 創建備份腳本
cat > backup.sh << EOF
tar -czf /home/brian/backup-\$(date +%Y%m%d).tar.gz /home/brian/Projects
EOF

# 上傳並執行
npm run sftp upload backup.sh /home/brian/backup.sh
node src/core.js  # 執行：bash /home/brian/backup.sh
npm run sftp download /home/brian/backup-*.tar.gz ./
```

---

## 🎊 完成清單

- [x] 文件上傳/下載
- [x] 批量命令執行
- [x] 會話歷史記錄
- [x] Web UI 界面
- [x] 目錄掃描工具

**所有階段 2 功能已完成！** 🚀

---

## 📞 需要幫助？

如果遇到問題：

1. 檢查 .env 配置是否正確
2. 確認 SSH 連接是否正常
3. 查看錯誤信息
4. 參考範例命令

**祝你使用愉快！** 🎉
