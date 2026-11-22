// 把 dist/ 发布到 GitHub Pages（本仓库的 gh-pages 分支）。
// 用法：npm run deploy   （会先重新构建，再推送；需要本机已登录 GitHub）
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (cmd) => execSync(cmd, { cwd: root }).toString().trim();
const remote = out('git remote get-url origin');
const name = out('git log -1 --format=%an');
const email = out('git log -1 --format=%ae');
const dist = path.join(root, 'dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('没有找到 dist/index.html，请先运行 npm run build');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hello-ai-pages-'));
try {
  fs.cpSync(dist, tmp, { recursive: true });
  fs.writeFileSync(path.join(tmp, '.nojekyll'), ''); // 告诉 GitHub Pages 不要用 Jekyll 处理
  const run = (cmd) => execSync(cmd, { cwd: tmp, stdio: 'inherit' });
  run('git init -q -b gh-pages');
  run('git add -A');
  run(`git -c user.name="${name}" -c user.email="${email}" commit -q -m "Deploy site"`);
  run(`git push -f "${remote}" gh-pages`);
  console.log('已发布到 gh-pages 分支，稍等一两分钟后线上生效。');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
