#!/bin/bash

# SSH-MCP Secure - Installation Script
# 高安全性 SSH MCP 服務器安裝腳本

set -e

echo "🔐 SSH-MCP Secure Installation Script"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "📋 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher (current: $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) installed${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v) installed${NC}"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Build project
echo "🔨 Building project..."
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo ""

# Setup environment file
echo "⚙️  Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file from .env.example${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit .env and configure your settings${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
fi
echo ""

# Generate SSH key (optional)
echo "🔑 SSH Key Setup"
read -p "Generate new SSH key pair? (recommended) [y/N]: " generate_key
if [[ $generate_key =~ ^[Yy]$ ]]; then
    read -p "Enter email for SSH key: " email
    ssh-keygen -t ed25519 -a 100 -C "$email" -f ~/.ssh/id_ed25519_ssh_mcp
    chmod 600 ~/.ssh/id_ed25519_ssh_mcp
    chmod 644 ~/.ssh/id_ed25519_ssh_mcp.pub
    echo -e "${GREEN}✅ SSH key generated${NC}"
    echo -e "${YELLOW}📝 Public key: ~/.ssh/id_ed25519_ssh_mcp.pub${NC}"
fi
echo ""

# Create log directory
echo "📁 Creating log directories..."
mkdir -p /var/log/ssh-mcp 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Cannot create /var/log/ssh-mcp (permission denied)${NC}"
    echo -e "${YELLOW}   You may need to run: sudo mkdir -p /var/log/ssh-mcp${NC}"
}
echo -e "${GREEN}✅ Log directories created${NC}"
echo ""

# Security checklist
echo "🔒 Security Checklist"
echo "===================="
echo ""
echo "Before deploying to production, ensure:"
echo "  ☐ Set SSH_ALLOW_PASSWORD_AUTH=false"
echo "  ☐ Set SSH_REQUIRE_KEY_AUTH=true"
echo "  ☐ Generate and configure SSH keys"
echo "  ☐ Set strong ENCRYPTION_MASTER_KEY"
echo "  ☐ Enable MFA (MFA_ENABLED=true)"
echo "  ☐ Set MFA_REQUIRED_FOR_PRODUCTION=true"
echo "  ☐ Configure audit logging paths"
echo "  ☐ Set LOG_LEVEL=info or warn"
echo "  ☐ Disable DEBUG_MODE"
echo "  ☐ Review RBAC permissions"
echo "  ☐ Enable backup encryption"
echo "  ☐ Configure monitoring and alerting"
echo ""

# Run security audit
echo "🔍 Running security audit..."
npm run security:audit
echo ""

echo "======================================"
echo -e "${GREEN}✅ Installation complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Copy your SSH public key to target servers"
echo "3. Test connection: npm start"
echo "4. Review security checklist above"
echo ""
echo "Documentation: README.md"
echo "Security policy: SECURITY.md"
echo ""
