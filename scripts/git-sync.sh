#!/bin/bash
# =============================================================================
# Piaoshu Avatar OS - Git Auto-Sync Script
# =============================================================================
# Usage:
#   ./scripts/git-sync.sh                    # One-time sync
#   ./scripts/git-sync.sh --watch            # Watch mode (sync on file changes)
#   ./scripts/git-sync.sh --interval 60      # Interval mode (sync every 60 seconds)
#
# Authentication Setup (required before first push):
#   Option A - HTTPS with Personal Access Token:
#     1. Generate a GitHub PAT at: https://github.com/settings/tokens
#     2. Set remote URL with token:
#        git remote set-url origin https://<TOKEN>@github.com/panaifun777-lab/Piaoshu-Avatar.git
#     3. Or use credential store:
#        git config credential.helper store
#        # Then push once and enter credentials when prompted
#
#   Option B - SSH Key:
#     1. Generate SSH key: ssh-keygen -t ed25519 -C "your@email.com"
#     2. Add public key to GitHub: https://github.com/settings/keys
#     3. Set remote URL: git remote set-url origin git@github.com:panaifun777-lab/Piaoshu-Avatar.git
#
#   Option C - GitHub CLI:
#     1. Install: https://cli.github.com/
#     2. Authenticate: gh auth login
#     3. Push normally: git push origin main
# =============================================================================

set -euo pipefail

# Configuration
PROJECT_DIR="/home/z/my-project"
REMOTE="origin"
BRANCH="main"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

cd "$PROJECT_DIR" || { log_error "Cannot cd to $PROJECT_DIR"; exit 1; }

check_git() {
    if ! git rev-parse --is-inside-work-tree &>/dev/null; then
        log_error "Not a git repository"; exit 1
    fi
    if ! git remote get-url "$REMOTE" &>/dev/null; then
        log_error "Remote '$REMOTE' not configured"; exit 1
    fi
}

do_sync() {
    local sync_timestamp="$1"
    if [[ -z $(git status --porcelain 2>/dev/null) ]]; then
        log_info "No changes to sync at $sync_timestamp"; return 0
    fi
    log_info "Changes detected at $sync_timestamp"
    git add -A
    if git diff --cached --quiet 2>/dev/null; then
        log_info "No staged changes to commit"; return 0
    fi
    git commit -m "auto-sync: ${sync_timestamp}"
    log_info "Pushing to $REMOTE/$BRANCH..."
    if git push "$REMOTE" "$BRANCH" 2>&1; then
        log_success "Sync completed successfully at $sync_timestamp"
    else
        log_error "Push failed. See script header for auth setup."
        return 1
    fi
}

watch_mode() {
    if ! command -v inotifywait &>/dev/null; then
        log_error "inotifywait not found. Falling back to interval mode (5s)..."
        interval_mode 5; return
    fi
    log_info "Starting watch mode... (Ctrl+C to stop)"
    while true; do
        inotifywait -r -e modify,create,delete,move \
            --exclude '\.git|node_modules|\.next' \
            "$PROJECT_DIR" --quiet 2>/dev/null || true
        sleep 3
        do_sync "$(date +"%Y-%m-%d %H:%M:%S")"
    done
}

interval_mode() {
    local interval_sec="${1:-30}"
    log_info "Starting interval mode (every ${interval_sec}s)... (Ctrl+C to stop)"
    while true; do
        do_sync "$(date +"%Y-%m-%d %H:%M:%S")"
        sleep "$interval_sec"
    done
}

main() {
    check_git
    case "${1:-}" in
        --watch|-w) watch_mode ;;
        --interval|-i) interval_mode "${2:-30}" ;;
        --help|-h)
            echo "Piaoshu Avatar OS - Git Auto-Sync"
            echo "Usage: $0 [OPTIONS]"
            echo "  (no option)     One-time sync"
            echo "  --watch, -w     Watch for file changes and auto-sync"
            echo "  --interval, -i  Sync at regular intervals (default: 30s)"
            echo "  --help, -h      Show this help message"
            ;;
        *) do_sync "$TIMESTAMP" ;;
    esac
}

main "$@"
