#!/usr/bin/env bash
# 在线部署 last-evenings-on-earth：
#   本机构建 dist → 推 dist + server.mjs 到服务器 → 装原生依赖 → pm2 拉起 → 自测。
#
# 隔离原则：独立目录 / 独立端口 3010 / 独立 pm2 进程，
# 绝不触碰服务器上已有的其它应用（pocket-earth、sunset-radio 等各在自己的 /root/<名字>/ 目录）。
#
# 用法：
#   PEM=/path/to/key.pem REMOTE=root@<server-ip> ./deploy/online/deploy.sh
#
# 可选环境变量：
#   APP_DIR   远程目录    （默认 /root/last-night-on-earth）
#   APP_NAME  pm2 进程名   （默认 last-night-on-earth）
#   PORT      node 内网端口（默认 3010）
#
# 首次部署还需手动做两件 deploy.sh 不碰的事（见 README）：
#   ① 放置 nginx 配置 nginx-last-night-on-earth.conf
#   ② certbot 签发/确认 HTTPS 证书
set -euo pipefail

PEM="${PEM:?请设置 PEM=部署私钥路径}"
REMOTE="${REMOTE:?请设置 REMOTE=root@服务器IP}"
APP_DIR="${APP_DIR:-/root/last-night-on-earth}"
APP_NAME="${APP_NAME:-last-night-on-earth}"
PORT="${PORT:-3010}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SSH=(ssh -i "$PEM" -o StrictHostKeyChecking=no)
RSH="ssh -i $PEM -o StrictHostKeyChecking=no"

chmod 600 "$PEM"
cd "$ROOT"

echo "==> [1/5] 本机构建 dist（生产构建；VITE_API_BASE 应指向同源 /api）..."
npm run build

echo "==> [2/5] 推送 dist + server.mjs + package.json 到 $REMOTE:$APP_DIR ..."
"${SSH[@]}" "$REMOTE" "mkdir -p $APP_DIR/dist"
rsync -az --delete -e "$RSH" dist/ "$REMOTE:$APP_DIR/dist/"
rsync -az          -e "$RSH" server/server.mjs server/package.json "$REMOTE:$APP_DIR/"

echo "==> [3/5] 服务器安装原生依赖（better-sqlite3 需在 Linux 现场编译）..."
"${SSH[@]}" "$REMOTE" "cd $APP_DIR && npm install --omit=dev"

echo "==> [4/5] 检查 .env（不存在则按默认值生成；本服务无需密钥）..."
"${SSH[@]}" "$REMOTE" "[ -f $APP_DIR/.env ] && echo '已存在 .env，跳过' || { printf 'PORT=%s\nHOST=127.0.0.1\nDB_PATH=%s/data.db\nCORS_ORIGIN=*\nIP_SUBMIT_LIMIT=50\n' '$PORT' '$APP_DIR' > $APP_DIR/.env && echo '已生成默认 .env'; }"

echo "==> [5/5] pm2 拉起/重启 + 持久化 ..."
"${SSH[@]}" "$REMOTE" "cd $APP_DIR && (pm2 restart $APP_NAME || pm2 start server.mjs --name $APP_NAME) && pm2 save"

echo "==> 远程自测 /healthz ..."
"${SSH[@]}" "$REMOTE" "sleep 1; curl -s http://127.0.0.1:$PORT/healthz && echo"
echo ""
echo "✅ 部署完成。若 nginx + 证书已就绪，访问 https://lastnightonearth.throughtheglass.art 即可。"
