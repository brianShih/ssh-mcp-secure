# 🚀 SSH-MCP Stage 2 Practical Features Guide

**Update Date**: 2026-08-19  
**Status**: ✅ Completed

---

## 📦 Implemented Features

### ✅ Feature 1: File Upload/Download (SFTP)

**Command**: `npm run sftp`

#### Usage

```bash
# List remote directory
npm run sftp list /home/brian/Projects

# Upload file
npm run sftp upload ./local.txt /home/brian/remote.txt

# Download file
npm run sftp download /home/brian/remote.txt ./local.txt
```

#### Examples

```bash
# View Projects directory
node src/sftp.js list /home/brian/Projects

# Upload config file
node src/sftp.js upload ./config.json /home/brian/config.json

# Download log file
node src/sftp.js download /home/brian/app.log ./app.log
```

---

### ✅ Feature 2: Batch Command Execution + Session History

**Command**: `npm run batch`

#### Usage

```bash
# Use default command list
npm run batch

# Use custom commands file
npm run batch commands.txt

# Specify output file
npm run batch commands.txt output.json
```

#### Commands File Format

Create `commands.txt`:

```bash
# System information
uname -a
whoami
pwd

# Disk space
df -h

# Memory usage
free -m

# Uptime
uptime

# Process list
ps aux | head -20
```

#### Output Example

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

### ✅ Feature 3: Web UI

**Command**: `npm run web`

#### Start Web Server

```bash
npm run web
```

#### Access

Open browser and visit: http://localhost:3000

#### Features

- ✅ View SSH connection status
- ✅ Execute remote commands
- ✅ View command history
- ✅ Real-time output display
- ✅ Error notifications

#### UI Features

- 🎨 Beautiful gradient design
- 📊 Real-time connection status
- ⚡ Fast command execution
- 📜 Command history log

---

### ✅ Feature 4: Directory Scanning

**Command**: `npm run scan`

#### Usage

```bash
# Scan default directory
npm run scan

# Scan specific directory
npm run scan /home/brian/Projects

# Scan other directory
npm run scan /var/log
```

#### Output Content

- 📁 Folder list (name, size, modification time)
- 📄 File list (name, size, modification time)
- 📊 Statistics (folder count, file count)
- 🔍 Detailed scan for each folder (file count, subfolder count)

---

## 🎯 Use Cases

### Use Case 1: Deploy Project

```bash
# 1. Upload project files
npm run sftp upload ./my-app.zip /home/brian/my-app.zip

# 2. SSH connect and extract
node src/core.js  # Modify command to: unzip /home/brian/my-app.zip

# 3. Verify deployment
npm run sftp list /home/brian/my-app
```

### Use Case 2: Batch Collect System Information

```bash
# Create commands file
cat > sysinfo.txt << EOF
uname -a
cat /etc/os-release
df -h
free -m
uptime
who
EOF

# Execute batch commands
npm run batch sysinfo.txt sysinfo.json
```

### Use Case 3: Daily Monitoring

```bash
# Start Web UI
npm run web

# Execute monitoring commands in browser
# - ps aux
# - top -b -n 1
# - netstat -tuln
# - df -h
```

### Use Case 4: Log Analysis

```bash
# Download log file
npm run sftp download /var/log/app.log ./app.log

# Analyze locally
# Or use Web UI to view remotely
```

---

## 📋 Quick Reference

| Feature | Command | Description |
|---------|---------|-------------|
| SSH Connect | `npm start` | Basic SSH connection test |
| File Upload | `npm run sftp upload <local> <remote>` | Upload file to server |
| File Download | `npm run sftp download <remote> <local>` | Download file from server |
| Directory List | `npm run sftp list <directory>` | List remote directory content |
| Batch Execute | `npm run batch [file] [output]` | Execute batch commands |
| Web UI | `npm run web` | Start web interface |
| Directory Scan | `npm run scan <directory>` | Scan directory structure |

---

## 🔧 Configuration

### Environment Variables (.env)

```ini
# SSH Configuration
SERV02_HOST=192.168.68.64
SERV02_PORT=22
SERV02_USERNAME=brian
SERV02_PASSWORD=***
# Or
SERV02_PRIVATE_KEY_PATH=C:/Users/brian/.ssh/id_ed25519

# Web UI Configuration
WEB_PORT=3000
```

---

## 💡 Best Practices

### 1. Use SSH Key Authentication

```bash
# Generate key
ssh-keygen -t ed25519

# Copy to server
ssh-copy-id brian@192.168.68.64

# Configure in .env
SERV02_PRIVATE_KEY_PATH=C:/Users/brian/.ssh/id_ed25519
```

### 2. Create Common Command Templates

```bash
# commands-deploy.txt
cd /home/brian/my-app
git pull
npm install
npm run build
pm2 restart my-app

# Execute
npm run batch commands-deploy.txt deploy-log.json
```

### 3. Regular Backups

```bash
# Create backup script
cat > backup.sh << EOF
tar -czf /home/brian/backup-\$(date +%Y%m%d).tar.gz /home/brian/Projects
EOF

# Upload and execute
npm run sftp upload backup.sh /home/brian/backup.sh
node src/core.js  # Execute: bash /home/brian/backup.sh
npm run sftp download /home/brian/backup-*.tar.gz ./
```

---

## 🎊 Completion Checklist

- [x] File upload/download
- [x] Batch command execution
- [x] Session history logging
- [x] Web UI interface
- [x] Directory scanning tool

**All Stage 2 features completed!** 🚀

---

## 📞 Need Help?

If you encounter issues:

1. Check .env configuration is correct
2. Verify SSH connection works
3. Review error messages
4. Refer to example commands

**Happy using!** 🎉
