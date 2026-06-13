#!/usr/bin/env node
/**
 * GitHub REST API Push — pushes all git-tracked files via Git Data API
 * No git credentials needed, only a GitHub Personal Access Token.
 * 
 * Usage: GITHUB_TOKEN=ghp_xxx node scripts/github-push.mjs
 */
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve, join } from 'path';

const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'panaifun777-lab';
const REPO = 'Piaoshu-Avatar';
const API = 'https://api.github.com';

if (!TOKEN) {
  console.log('❌ 需要 GITHUB_TOKEN 环境变量');
  console.log('');
  console.log('创建步骤:');
  console.log('  1. https://github.com/settings/tokens/new');
  console.log('  2. 勾选 repo (full control of private repositories)');
  console.log('  3. 生成 token');
  console.log('  4. GITHUB_TOKEN=ghp_xxx node scripts/github-push.mjs');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function gh(method, path, body = null) {
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  const root = '/home/z/my-project';
  
  console.log('🧬 Piaoshu Avatar → GitHub Push');
  console.log(`📦 ${OWNER}/${REPO}\n`);

  // 1. Ensure repo exists
  try {
    await gh('GET', `/repos/${OWNER}/${REPO}`);
    console.log('✅ 仓库已存在');
  } catch {
    console.log('📦 创建仓库...');
    await gh('POST', '/user/repos', {
      name: REPO,
      description: 'Web4.0 AI原生创业操作系统 - 飘叔分身/认知引擎/可信证据链/流体协作/虚实共生沙盒',
      private: false,
      auto_init: false,
    });
    console.log('✅ 仓库创建成功');
  }

  // 2. Get latest commit on main (or create initial)
  let latestCommitSha;
  try {
    const ref = await gh('GET', `/repos/${OWNER}/${REPO}/git/ref/heads/main`);
    latestCommitSha = ref.object.sha;
    console.log(`📌 当前 main 分支: ${latestCommitSha.slice(0,7)}`);
  } catch {
    // Create initial commit with .gitkeep
    console.log('📝 创建初始提交...');
    const tree = await gh('POST', `/repos/${OWNER}/${REPO}/git/trees`, {
      tree: [{ path: '.gitkeep', mode: '100644', type: 'blob', content: '' }],
    });
    const commit = await gh('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
      message: 'Initial commit',
      tree: tree.sha,
    });
    await gh('POST', `/repos/${OWNER}/${REPO}/git/refs`, {
      ref: 'refs/heads/main',
      sha: commit.sha,
    });
    latestCommitSha = commit.sha;
    console.log(`✅ 初始提交: ${commit.sha.slice(0,7)}`);
  }

  // 3. Get list of tracked files
  const filesStr = execSync('git ls-files', { cwd: root }).toString().trim();
  const files = filesStr.split('\n').filter(Boolean);
  console.log(`📄 待上传文件: ${files.length} 个`);

  // 4. Create blobs for all files
  console.log('⬆️ 上传文件...');
  const treeItems = [];
  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    try {
      const content = readFileSync(resolve(root, filePath));
      const base64 = content.toString('base64');
      const blob = await gh('POST', `/repos/${OWNER}/${REPO}/git/blobs`, {
        content: base64,
        encoding: 'base64',
      });
      treeItems.push({
        path: filePath,
        mode: '100644',
        type: 'blob',
        sha: blob.sha,
      });
      if ((i + 1) % 20 === 0) process.stdout.write(`  ${i + 1}/${files.length}...\n`);
    } catch (e) {
      console.warn(`  ⚠️ 跳过: ${filePath} (${e.message})`);
    }
  }
  console.log(`  ✅ ${treeItems.length} 个文件已上传`);

  // 5. Create tree
  console.log('🌳 创建目录树...');
  const tree = await gh('POST', `/repos/${OWNER}/${REPO}/git/trees`, {
    base_tree: latestCommitSha,
    tree: treeItems,
  });

  // 6. Create commit
  console.log('📦 创建提交...');
  const commit = await gh('POST', `/repos/${OWNER}/${REPO}/git/commits`, {
    message: 'feat: Piaoshu Avatar OS — Web4.0 AI原生创业操作系统\n\n🧠 认知分片引擎 | 🪞 分身系统 | ⛓️ 可信证据链\n🌊 流体协作 | 🎮 虚实共生沙盒 | 📊 72 API端点',
    tree: tree.sha,
    parents: [latestCommitSha],
  });

  // 7. Update ref
  console.log('🚀 推送到 main...');
  await gh('PATCH', `/repos/${OWNER}/${REPO}/git/refs/heads/main`, {
    sha: commit.sha,
    force: true,
  });

  console.log(`\n✅ 上传完成！`);
  console.log(`🔗 https://github.com/${OWNER}/${REPO}`);
  console.log(`📝 提交: ${commit.sha.slice(0,7)}`);
}

main().catch(e => {
  console.error('❌ 推送失败:', e.message);
  process.exit(1);
});
