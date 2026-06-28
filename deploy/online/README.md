# 在线部署（线上 demo）

把「地球上最后的夜晚」部署成公网可访问的站点。

```
浏览器 ─https─▶ nginx :443 ─┬─ /        静态托管 dist/（SPA，未命中回退 index.html）
       （Certbot 证书）       └─ /api/*  反代 → node server.mjs :3010（照片元数据服务）
               :80 → 301 https
```

## 隔离原则

服务器是多项目共用的（pocket-earth、sunset-radio 等都在上面）。本项目与它们**完全隔离、互不影响**：

| 维度    | 取值                              |
| ------- | --------------------------------- |
| 目录    | `/root/last-night-on-earth/`      |
| 内网端口 | **3010**（避开已占用的 3005–3009） |
| pm2 名  | `last-night-on-earth`             |
| nginx   | 独立 `server_name`，单独一个 conf 文件 |

每个项目各住自己的 `/root/<名字>/` 目录、各占一个端口、各是一个 pm2 进程；改本项目不会动到别的项目。nginx 只新增一个 server 块 + 优雅 `reload`，不打断其它站点。

## 两类变量：构建期 vs 运行期

- **构建期（前端，随 `dist` 打包）** — 见根目录 `.env.example`：`VITE_API_BASE` 生产应指向同源 `/api`；OSS 是可选项，缺省时前端用本地兜底。
- **运行期（后端，服务端读）** — 见 `server/.env.example`：`PORT` / `HOST` / `DB_PATH` / `CORS_ORIGIN` / `IP_SUBMIT_LIMIT`。**本服务只存照片元数据，不保存任何密钥。**

服务器 `.env` 放在与 `server.mjs` 同目录（`/root/last-night-on-earth/.env`）：

```
PORT=3010
HOST=127.0.0.1
DB_PATH=/root/last-night-on-earth/data.db
CORS_ORIGIN=*
IP_SUBMIT_LIMIT=50
```

---

## 部署步骤（手动逐步版）

> 一键脚本见文末「一键部署」；以下是脚本背后的每一步，便于排查与首次搭建。

### 1. 本机构建 dist

```bash
npm install
npm run build          # 产出 dist/，生产构建 VITE_API_BASE 指向同源 /api
```

### 2. 备份服务器旧目录（可回滚，不硬删）

```bash
ssh -i <key.pem> root@<server-ip> \
  'mv /root/last-night-on-earth /root/last-night-on-earth.bak-$(date +%Y%m%d) 2>/dev/null; mkdir -p /root/last-night-on-earth/dist'
```

### 3. 上传 dist + 后端

```bash
RSH="ssh -i <key.pem> -o StrictHostKeyChecking=no"
rsync -az --delete -e "$RSH" dist/ root@<server-ip>:/root/last-night-on-earth/dist/
rsync -az          -e "$RSH" server/server.mjs server/package.json root@<server-ip>:/root/last-night-on-earth/
```

### 4. 服务器安装原生依赖

`better-sqlite3` 是原生模块，Mac 上的 `node_modules` 不能直接拷到 Linux，必须在服务器现场编译：

```bash
ssh -i <key.pem> root@<server-ip> 'cd /root/last-night-on-earth && npm install --omit=dev'
```

### 5. 配置 `.env`

把上面「服务器 `.env`」那段写入 `/root/last-night-on-earth/.env`（数据库表由 `server.mjs` 首次启动时 `CREATE TABLE IF NOT EXISTS` 自动建，空库即可）。

### 6. pm2 托管

```bash
ssh -i <key.pem> root@<server-ip> \
  'cd /root/last-night-on-earth && pm2 start server.mjs --name last-night-on-earth && pm2 save'
```

### 7. nginx 反代 + 证书

```bash
# 把 nginx-last-night-on-earth.conf 放到 /etc/nginx/conf.d/
nginx -t && nginx -s reload

# 首次签 HTTPS（certbot 会把 conf 改写成 443 + 80→443 跳转）：
certbot --nginx -d lastnightonearth.throughtheglass.art --non-interactive --agree-tos --redirect
# 续期由 certbot 定时任务自动完成
```

### 8. 验证

```bash
curl -s https://lastnightonearth.throughtheglass.art/healthz          # 后端存活 + 当前照片数
curl -sI https://lastnightonearth.throughtheglass.art | head -1       # 200 OK（静态前端）
# 证书 CN 应为本域名：
echo | openssl s_client -connect lastnightonearth.throughtheglass.art:443 \
  -servername lastnightonearth.throughtheglass.art 2>/dev/null | openssl x509 -noout -subject
```

---

## 一键部署

```bash
PEM=/path/to/key.pem REMOTE=root@<server-ip> ./deploy/online/deploy.sh
```

脚本执行步骤 1、3–6 + 自测；**步骤 2（备份）、7（nginx/证书）首次需手动**，脚本不碰它们，也不动服务器上其它应用。

## pm2 管理

```bash
pm2 status                        # 看所有进程
pm2 logs last-night-on-earth      # 看日志
pm2 restart last-night-on-earth   # 换 dist / 改 .env 后重启
```

## 故障排查

- **浏览器报 `NET::ERR_CERT_COMMON_NAME_INVALID`** — 多半是本域名的 nginx server 块丢了，nginx 回退到别的站点的证书导致 CN 对不上。回到步骤 7 重新放置 conf 并 `reload`；证书本身仍在 `/etc/letsencrypt/live/lastnightonearth.throughtheglass.art/` 即可复用。
- **`/api/*` 502** — node 没起或端口不对。`pm2 status` 看进程，确认 `.env` 的 `PORT` 与 nginx `proxy_pass` 一致（均 3010）。
- **`npm install` 报 better-sqlite3 编译失败** — 服务器缺编译链，装 `python3` / `make` / `gcc-c++` 后重试。
