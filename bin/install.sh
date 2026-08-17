#!/usr/bin/env bash

# ==============================================================================
# ⚡ lithium-kb — Universal Interactive Installer
# ==============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "================================================================="
echo "        ⚡ lithium-kb — Installer & Setup Wizard                "
echo "================================================================="
echo -e "${NC}"

echo "Choose an installation option:"
echo ""
echo -e "  ${BOLD}[1] Initialize in Current Project Workspace${NC} (Recommended)"
echo "      • Creates .lithium-kb/ {architecture,debug,tasks,features}"
echo "      • Creates PROJECT_KB.md and multi-agent rule files"
echo "      • Auto-configures MCP for Cursor, Claude, Zed, Windsurf, Cline"
echo "      • Installs Pi Agent skill (~/.agents/skills/lithium-kb)"
echo ""
echo -e "  ${BOLD}[2] Global CLI Installation${NC}"
echo "      • Installs @liulinnuha/lithium-kb globally (npm install -g)"
echo "      • Enables 'lithium-kb' command system-wide"
echo "      • Also initializes current project workspace"
echo ""
echo -e "  ${BOLD}[3] Start Web UI immediately${NC}"
echo "      • Launches Neural Network Graph UI at http://localhost:3030"
echo ""
echo -e "  ${BOLD}[4] Cancel & Exit${NC}"
echo ""

read -rp "Enter choice [1-4]: " CHOICE

case "$CHOICE" in
  1)
    echo -e "\n${BLUE}ℹ Initializing lithium-kb in current directory...${NC}"
    npx -y @liulinnuha/lithium-kb@latest init
    echo -e "\n${GREEN}✔ Project setup complete!${NC}"
    ;;
  2)
    echo -e "\n${BLUE}ℹ Installing lithium-kb globally via npm...${NC}"
    npm install -g @liulinnuha/lithium-kb@latest
    echo -e "\n${BLUE}ℹ Initializing current project workspace...${NC}"
    lithium-kb init
    echo -e "\n${GREEN}✔ Global installation & project initialization complete!${NC}"
    ;;
  3)
    echo -e "\n${BLUE}ℹ Starting Neural Network Graph UI...${NC}"
    npx -y @liulinnuha/lithium-kb@latest --ui
    ;;
  4|*)
    echo -e "\n${YELLOW}Installation cancelled.${NC}"
    exit 0
    ;;
esac
