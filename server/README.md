# 照片服务说明

这个目录是“黄昏投稿”和“用户照片档案”的轻量服务端。

它只处理照片元数据，不处理音乐、音频或语音合成，也不保存真实密钥。

## 当前功能

- 健康检查
- 用户照片列表
- 用户照片注册
- 用户照片软删除
- 本地数据库持久化
- 单个访问地址的投稿频率限制

## 本地启动

安装依赖：

```bash
npm install
```

启动服务：

```bash
npm start
```

默认地址：

```bash
http://127.0.0.1:3008
```

## 环境变量

可以参考 `server/.env.example`。

常用字段：

- `HOST`：监听地址，默认 `127.0.0.1`
- `PORT`：监听端口，默认 `3008`
- `DB_PATH`：数据库路径，默认 `server/data.db`
- `CORS_ORIGIN`：允许的前端来源，默认 `*`
- `IP_SUBMIT_LIMIT`：单个访问地址每天可投稿数量，默认 `50`

本地 `.env` 不提交到仓库。

## 接口

### 健康检查

```http
GET /healthz
```

返回服务状态和当前照片数量。

### 获取照片

```http
GET /api/photos
```

返回尚未软删除的用户投稿照片。

### 注册照片

```http
POST /api/photos
```

请求体示例：

```json
{
  "id": "usr_example",
  "url": "https://example.com/photo.jpg",
  "city": "杭州",
  "city_zh": "杭州",
  "country": "中国",
  "lat": 30.2741,
  "lng": 120.1551,
  "description": "这里是我的黄昏。",
  "signature": "匿名"
}
```

当前版本接受以 `http` 或 `https` 开头的图片链接。后续如果接入对象存储预签名上传，会在照片服务里继续扩展。

### 软删除照片

```http
DELETE /api/photos/:id
```

不会物理删除记录，只写入删除时间。

## 不进入仓库的文件

- `server/data.db`
- `server/data.db-shm`
- `server/data.db-wal`
- `server/.env`
- 任何真实密钥

这些文件已经写入 `.gitignore`。

## 检查命令

在 `server/` 目录中检查：

```bash
npm run check
```

从仓库根目录检查：

```bash
node --check server/server.mjs
```
