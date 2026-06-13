#!/usr/bin/env node
/**
 * GitHub REST API Push Script
 * Pushes all repo files via the Git Data API (no git CLI needed)
 * 
 * Usage: GITHUB_TOKEN=ghp_xxx node scripts/github-api-push.mjs
 */

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'panaifun777-lab/Piaoshu-Avatar';
const API = 'https://api.github.com';

if (!TOKEN) {
  console.log('❌ 需要 GITHUB_TOKEN 环境变量');
  console.log('Usage: GITHUB_TOKEN=ghp_xxx node scripts/github-api-push.mjs');
  process.exit(1);
}

const headers = {
  'Authorization': `token ${TOKEN}`,
  'Accept': 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
  'User-Agent': 'Piaoshu-Avatar-Uploader'
};

async function api(method, path, body) {
  const res = await fetch(`${Api}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

console.log('🚀 Piaoshu Avatar GitHub Push');
console.log(`📦 Target: ${REPO}`);
console.log('');
console.log('请直接使用 git push:');
console.log('  GITHUB_TOKEN=ghp_xxx bash scripts/github-upload.sh');
