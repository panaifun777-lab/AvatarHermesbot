#!/bin/bash
# Piaoshu Avatar GitHub Upload Script
# Usage: GITHUB_TOKEN=your_token_here bash scripts/github-upload.sh

set -e

TOKEN="${GITHUB_TOKEN:-}"
REPO="panaifun777-lab/Piaoshu-Avatar"
BRANCH="main"

if [ -z "$TOKEN" ]; then
  echo "❌ 需要提供 GitHub Personal Access Token"
  echo ""
  echo "使用方法:"
  echo "  GITHUB_TOKEN=ghp_xxxxx bash scripts/github-upload.sh"
  echo ""
  echo "创建 Token 步骤:"
  echo "  1. 访问 https://github.com/settings/tokens"
  echo "  2. 点击 'Generate new token (classic)'"
  echo "  3. 勾选 repo 权限 (full control)"
  echo "  4. 生成并复制 token"
  exit 1
fi

echo "🔐 使用 GitHub Token 认证..."
cd /home/z/my-project

# Set up credentials
git remote set-url origin "https://panaifun777-lab:${TOKEN}@github.com/${REPO}.git"

# Check if repo exists, create if not
REPO_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token ${TOKEN}" \
  "https://api.github.com/repos/${REPO}")

if [ "$REPO_CHECK" = "404" ]; then
  echo "📦 创建仓库 ${REPO}..."
  curl -s -X POST \
    -H "Authorization: token ${TOKEN}" \
    -H "Content-Type: application/json" \
    "https://api.github.com/user/repos" \
    -d "{\"name\":\"Piaoshu-Avatar\",\"description\":\"Web4.0 AI原生创业操作系统 - 飘叔分身/认知引擎/可信证据链/流体协作/虚实共生沙盒\",\"private\":false}" > /dev/null
  echo "✅ 仓库创建成功"
elif [ "$REPO_CHECK" = "200" ]; then
  echo "✅ 仓库已存在"
else
  echo "⚠️  仓库检查返回状态码: ${REPO_CHECK}"
fi

# Force push main branch
echo "🚀 推送代码到 GitHub..."
git push -u origin HEAD:${BRANCH} --force

echo ""
echo "✅ 上传完成！"
echo "🔗 https://github.com/${REPO}"
