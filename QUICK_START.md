# 🚀 SSH-MCP Quick Start Guide

**Get started in 5 minutes!**

---

## ⚡ Quick Install

```bash
# Clone repository
git clone https://github.com/brianShih/ssh-mcp-secure.git
cd ssh-mcp-secure

# Install dependencies (only 2 packages!)
npm install

# Configure environment
cp .env.example .env
```

---

## ⚙️ Configuration

Edit `.env` file with your SSH server details:

```ini
# SSH Server
SERV02_HOST=192.168.68.64
SERV02_PORT=22
SERV02_USERNAME=your_username
SERV02_PASSWORD=your_password

# Or use SSH key (recommended)
# SERV02_PRIVATE_KEY_PATH=C:/Users/yourname/.ssh/id_ed25519
```

---

## 🎯 First Steps

### 1. Test SSH Connection

```bash
npm start
```

**Expected Output:**
```
======================================================================
   SSH-MCP Core
======================================================================

Configuration:
  Host: 192.168.68.64
  Port: 22
  User: brian
  Auth: Password

Connecting to SSH...

✅ SSH connection successful!

System Information:
  Linux serv02 6.12.63+deb13-amd64 ...

Current User: brian
Current Directory: /home/brian

======================================================================
   ✅ All tests passed!
======================================================================
```

### 2. Scan Remote Directory

```bash
npm run scan /home/brian/Projects
```

**Output:**
```
📂 Folders (8):
  📁 orch (156 files)
  📁 ytstudio-browser-mcp (178 files)
  📁 ytstudio-ui-watcher (3640 files)
  ...

📊 Statistics:
  Folders: 8
  Files: 2
  Total: 10 items
```

### 3. Upload/Download Files

```bash
# List directory
npm run sftp list /home/brian/Projects

# Upload file
npm run sftp upload ./config.json /home/brian/config.json

# Download file
npm run sftp download /home/brian/app.log ./app.log
```

### 4. Execute Batch Commands

```bash
# Create commands file
echo "uname -a" > commands.txt
echo "whoami" >> commands.txt
echo "df -h" >> commands.txt

# Execute
npm run batch commands.txt output.json
```

**Output:** JSON file with results

### 5. Launch Web UI

```bash
npm run web
```

**Access:** http://localhost:3000

**Features:**
- 🎨 Beautiful UI
- 📊 Real-time status
- ⚡ Execute commands
- 📜 Command history

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm start` | Test SSH connection |
| `npm run scan <dir>` | Scan remote directory |
| `npm run sftp list <dir>` | List files via SFTP |
| `npm run sftp upload <local> <remote>` | Upload file |
| `npm run sftp download <remote> <local>` | Download file |
| `npm run batch [file]` | Execute batch commands |
| `npm run web` | Start web interface |

---

## 🔧 Troubleshooting

### Error: Missing configuration

**Solution:** Edit `.env` and fill in `SERV02_HOST` and `SERV02_USERNAME`

### Error: SSH connection failed

**Solutions:**
1. Check host is correct: `ping serv02`
2. Verify username/password
3. Ensure SSH service is running (port 22)
4. Check firewall settings

### Error: File not found

**Solution:** Verify file path exists

---

## 📚 Next Steps

- 📖 Read [STAGE2_GUIDE.md](./STAGE2_GUIDE.md) for detailed usage
- 🔐 Review [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for security features
- 🤝 Check [README.md](./README.md) for full documentation

---

## ✅ Success Checklist

- [ ] Installed dependencies
- [ ] Configured `.env` file
- [ ] Tested SSH connection
- [ ] Scanned a directory
- [ ] Uploaded/downloaded a file
- [ ] Executed batch commands
- [ ] Launched Web UI

**You're ready to go!** 🚀

---

**Need help?** [Open an issue](https://github.com/brianShih/ssh-mcp-secure/issues)
