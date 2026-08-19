#!/usr/bin/env bash

# ==============================================================================
# ⚡ lithium-kb — Universal Interactive Uninstaller
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "================================================================="
echo "        ⚡ lithium-kb — Uninstaller & Cleanup Wizard           "
echo "================================================================="
echo -e "${NC}"

echo "Choose an uninstallation mode:"
echo ""
echo -e "  ${BOLD}[1] Standard Clean${NC} (Recommended)"
echo "      • Removes MCP servers from all IDEs (Cursor, Claude, Zed, Windsurf, Cline, Roo Code)"
echo "      • Removes global agent skills (~/.agents/skills/lithium-kb)"
echo "      • Keeps project knowledge files (.lithium-kb/ & PROJECT_KB.md) intact"
echo ""
echo -e "  ${BOLD}[2] Total Purge${NC}"
echo "      • All actions from [1]"
echo "      • Deletes project knowledge base (.lithium-kb/, .agent-kb/, PROJECT_KB.md)"
echo "      • Deletes generated rule files (.agentrules, .cursorrules, CLAUDE.md, .windsurfrules)"
echo ""
echo -e "  ${BOLD}[3] Full System Removal${NC}"
echo "      • All actions from [2] (Total Purge)"
echo "      • Uninstalls global npm package (@liulinnuha/lithium-kb)"
echo ""
echo -e "  ${BOLD}[4] Cancel & Exit${NC}"
echo ""

read -rp "Enter choice [1-4]: " CHOICE

case "$CHOICE" in
  1)
    echo -e "\n${BLUE}ℹ Running Standard Clean...${NC}"
    npx -y @liulinnuha/lithium-kb@latest uninstall
    echo -e "\n${GREEN}✔ Standard cleanup complete!${NC}"
    ;;
  2)
    echo -e "\n${YELLOW}⚠ Running Total Purge...${NC}"
    npx -y @liulinnuha/lithium-kb@latest uninstall --purge
    echo -e "\n${GREEN}✔ Total purge complete! All project files and MCP configs removed.${NC}"
    ;;
  3)
    echo -e "\n${RED}⚠ Running Full System Removal...${NC}"
    npx -y @liulinnuha/lithium-kb@latest uninstall --purge
    echo -e "\n${BLUE}ℹ Removing global npm package (@liulinnuha/lithium-kb)...${NC}"
    npm uninstall -g @liulinnuha/lithium-kb || true
    echo -e "\n${GREEN}✔ Complete system removal finished!${NC}"
    ;;
  4|*)
    echo -e "\n${YELLOW}Uninstallation cancelled.${NC}"
    exit 0
    ;;
esac
