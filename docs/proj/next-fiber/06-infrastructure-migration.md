# 基础设施迁移

## 1. Redis

### 当前使用

库：`ioredis`（`apps/web/lib/redis.ts`）

| 用途 | Key 格式 | TTL | 说明 |
|------|---------|-----|------|
| JWT Token | `access:token:{uid}` | 30 天 | 存储有效 Token |
| 邮箱验证码 | `verificationCode:{email}` | 10 分钟 | 注册/修改邮箱/忘记密码 |
| CAPTCHA 会话 | `captcha:{sessionId}` | 5 分钟 | 图片选择验证 |
| 上传缓存 | `upload:{fileId}` | 24 小时 | 分块上传元数据 |
| 管理员设置 | `admin:enable_comment_verify` | 无过期 | 评论验证开关 |
| 管理员设置 | `admin:enable_only_creator_create` | 无过期 | 仅创作者开关 |
| 管理员设置 | `admin:disable_register` | 无过期 | 禁止注册开关 |
| 封禁邮箱 | `ban:email:{email}` | 无过期 | 永久封禁 |
| 封禁 IP | `ban:ip:{ip}` | 无过期 | 永久封禁 |
| 验证码限流 | `sendCode:email:{email}` | 60 秒 | 防重复发送 |
| 验证码限流 | `sendCode:ip:{ip}` | 60 秒 | 防 IP 刷发 |

### 目标方案

库：`go-redis/v9`

Key 格式变更（OAuth 相关）：

| 用途 | Key 格式 | TTL | 说明 |
|------|---------|-----|------|
| Session | `session:{64位hex}` | 7 天 | 替代 JWT Token |
| OAuth PKCE | `pkce:{state}` | 10 分钟 | code_verifier 临时存储 |

其余 Key 保持不变。从 kungal 项目复用 `internal/infrastructure/cache/` 封装。

### 迁移要点

- 迁移期间 JWT 和 Session 共存：Next.js 端继续读 `access:token:{uid}`，Go 端写 `session:{id}`
- 切换完成后清除所有 `access:token:*` Key

---

## 2. S3 存储

### 当前使用

库：`@aws-sdk/client-s3`

| 操作 | 路径 | 说明 |
|------|------|------|
| 补丁横幅 | `patch/banner/{patchId}/banner.avif` | 1920x1080 + 460x259 缩略图 |
| 用户头像 | `patch/avatar/user_{uid}.avif` | 256x256 + 100x100 mini |
| 用户图片 | `patch/image/{uid}/{filename}.avif` | 1920x1080 |
| 补丁资源 | `patch/resource/{filename}` | 原始文件 |

图片处理：
- 使用 `sharp` 库（通过 import）
- 横幅：AVIF 格式，quality=60，max 1.007MB
- 头像：AVIF 格式，256x256 主图 + 100x100 缩略图
- 用户图片：AVIF 格式，quality=30

### 目标方案

库：`aws-sdk-go-v2`

图片处理替代：
- `github.com/disintegration/imaging`（缩放裁剪）
- `github.com/gen2brain/avif`（AVIF 编码）
- 或使用 `vips` CGO 绑定（`github.com/davidbyttow/govips`）获得更好性能

从 kungal 项目复用 `internal/infrastructure/storage/` 封装。

---

## 3. 邮件发送

### 当前使用

库：`nodemailer`（SMTP）或 `Resend API`（可配置）

场景：
- 注册验证码
- 忘记密码验证码
- 修改邮箱验证码

配置通过环境变量控制使用 SMTP 或 Resend。

### 目标方案

库：`net/smtp` 或 `github.com/resend/resend-go`

从 kungal 项目复用 `internal/infrastructure/mail/` 封装。

---

## 4. Markdown 渲染

### 当前使用

库：`remark/rehype`（unified 生态）

流程：`markdown → remark-parse → remark-gfm → rehype → rehype-sanitize → rehype-stringify → HTML`

使用场景：
- 评论内容渲染（`patch/comment/get.ts`）
- 聊天消息渲染（`socket/event/chatMessage.ts`）
- 评论列表预览（`comment/route.ts` 截取 233 字符纯文本）

### 目标方案

库：`github.com/yuin/goldmark` + 扩展

```go
import (
    "github.com/yuin/goldmark"
    "github.com/yuin/goldmark/extension"
)

md := goldmark.New(
    goldmark.WithExtensions(extension.GFM),  // GitHub Flavored Markdown
    // 添加自定义扩展...
)

var buf bytes.Buffer
md.Convert(source, &buf)
```

从 kungal 项目复用 `internal/infrastructure/markdown/` 封装。

### 风险

**Markdown 渲染一致性是高风险项**。需要：
1. 收集 100 条真实评论 + 聊天消息
2. 分别用 remark/rehype 和 goldmark 渲染
3. diff 对比输出差异
4. 重点关注 GFM 表格、自动链接、HTML 标签过滤的差异

---

## 5. 定时任务

### 当前使用

库：`node-cron`（通过 `instrumentation.ts` 启动）

| Cron 表达式 | 任务 | 说明 |
|------------|------|------|
| `0 0 * * *` | `resetDailyTask` | 每日午夜重置 `daily_image_count`, `daily_check_in`, `daily_upload_size` |
| `0 * * * *` | `setCleanupTask` | 每小时清理 `uploads/` 目录下超过 1 天的临时文件 |

### 目标方案

库：`github.com/robfig/cron/v3`

```go
c := cron.New()
c.AddFunc("0 0 * * *", func() {
    db.Model(&model.User{}).Updates(map[string]interface{}{
        "daily_image_count": 0,
        "daily_check_in":    0,
        "daily_upload_size": 0,
    })
})
c.AddFunc("0 * * * *", func() {
    cleanupTempUploads(uploadsDir, 24*time.Hour)
})
c.Start()
```

从 kungal 项目复用 `internal/infrastructure/cron/` 封装。

---

## 6. WebSocket（聊天系统）

### 当前使用

库：`socket.io`（服务端）+ `socket.io-client`（客户端）

架构：独立 Express 服务器（`apps/web/server.ts`），路径 `/ws`

事件清单：

| 事件 | 方向 | 说明 |
|------|------|------|
| `SEND_MESSAGE` | C→S | 发送消息（含 markdown→HTML 转换） |
| `RECEIVE_MESSAGE` | S→C | 接收新消息 |
| `DELETE_MESSAGE` | C→S | 删除消息 |
| `EDIT_MESSAGE` | C→S | 编辑消息（保存编辑历史） |
| `MESSAGE_SEEN` | C→S | 标记消息已读 |
| `USER_TYPING` | C→S→C | 打字指示器 |
| `TOGGLE_REACTION` | C→S | 切换表情回应 |
| `REACTION_UPDATED` | S→C | 回应状态更新 |
| `ROOM_STATUS_UPDATE` | S→C | 房间在线状态 |

连接认证：
- 客户端通过 query 参数传递 `id`（用户 ID）
- 服务端查询数据库验证用户存在
- 自动加入用户所属的所有聊天室

### 目标方案

**方案 A：go-socket.io（推荐初期）**
- 保持前端 socket.io-client 不变
- 服务端使用 `github.com/googollee/go-socket.io`

**方案 B：Fiber WebSocket（长期目标）**
- 使用 Fiber 内置 WebSocket
- 前端从 socket.io-client 迁移到原生 WebSocket

初期选择方案 A，降低前端改动量。

### 认证变更

- 当前：query 参数 `?id={uid}` + 数据库查询验证
- 目标：Cookie `kun_session` + Redis Session 验证

```go
// WebSocket 连接时从 Cookie 获取 Session
func wsAuthMiddleware(s socketio.Conn) error {
    cookie := s.RemoteHeader().Get("Cookie")
    sessionID := extractSessionID(cookie)
    session, err := rdb.Get(ctx, "session:"+sessionID).Result()
    if err != nil {
        return errors.New("unauthorized")
    }
    // 将用户信息附加到连接上下文
    s.SetContext(session)
    return nil
}
```

---

## 7. 搜索

### 当前使用

纯数据库搜索：

```typescript
// 搜索补丁：ILIKE 多字段匹配 + 内存去重
const results = await Promise.all(
  queries.map(q => prisma.patch.findMany({
    where: {
      OR: [
        { name_zh_cn: { contains: q, mode: 'insensitive' } },
        { name_ja_jp: { contains: q, mode: 'insensitive' } },
        { name_en_us: { contains: q, mode: 'insensitive' } },
        { vndb_id: { equals: q, mode: 'insensitive' } },
        // ... introduction, alias, tag 可选
      ]
    }
  }))
)
// 手动去重合并
```

问题：
- 全表扫描，无索引优化
- 多 query 并行查询 + 内存去重效率低
- 不支持中日文分词
- 不支持模糊匹配

### 目标方案

库：`Meilisearch`

```go
client := meilisearch.New("http://127.0.0.1:7700", meilisearch.WithAPIKey("key"))

// 索引初始化
index := client.Index("patches")
index.UpdateSettings(&meilisearch.Settings{
    SearchableAttributes: []string{"name_zh_cn", "name_ja_jp", "name_en_us", "vndb_id", "alias"},
    FilterableAttributes: []string{"content_limit", "type"},
})

// 搜索
results, _ := index.Search(query, &meilisearch.SearchRequest{
    Limit:  int64(limit),
    Offset: int64((page - 1) * limit),
    Filter: "content_limit != nsfw",
})
```

从 kungal 项目复用 `internal/infrastructure/search/` 封装。

### 数据同步

- 补丁创建/更新/删除时，同步更新 Meilisearch 索引
- 初次部署时，全量导入所有补丁数据

---

## 8. 文件分块上传

### 当前使用

```
POST /api/upload/resource
├── 接收 FormData: chunk (Blob) + metadata (JSON)
├── metadata: { fileId, fileName, chunkIndex, totalChunks, fileSize }
├── 校验：扩展名白名单、最大 1GB、每日上传限额
├── 分块存储到临时目录
├── 最后一块时：合并分块 → 计算 BLAKE3 hash → 存储元数据到 Redis
└── 返回 { fileId, hash, fileName } 供后续创建资源使用
```

每日上传限额：
- 普通用户/创作者：由 `daily_upload_size` + `KUN_PATCH_USER_DAILY_UPLOAD_SIZE` 控制
- 不同角色限额不同（代码中根据 `role` 判断）

### 目标方案

在 Go 端实现相同的分块上传流程：

```go
// POST /api/upload/chunk
func HandleChunkUpload(c *fiber.Ctx) error {
    chunk, _ := c.FormFile("chunk")
    metadata := new(ChunkMetadata)
    c.BodyParser(metadata)

    // 验证扩展名、大小、每日限额
    // 写入临时目录
    // 如果是最后一块：合并 → BLAKE3 hash → 存 Redis
}
```

BLAKE3 哈希库：`lukechampine.com/blake3`

---

## 9. NSFW 内容过滤

### 当前实现

通过请求头 `x-nsfw-header` 传递用户的 NSFW 设置：

```typescript
const nsfwHeader = getRequestHeader(req, 'x-nsfw-header')
const nsfwValue = JSON.parse(nsfwHeader || '{}')
// { showNSFW: boolean }
```

NSFW 过滤逻辑：
- `content_limit` 字段值为 `'sfw'` 或 `'nsfw'`
- 不显示 NSFW 时：`WHERE content_limit = 'sfw'`
- 标签过滤：隐藏 `category = 'sexual'` 的标签

### 目标方案

```go
func getNSFWFilter(c *fiber.Ctx) string {
    nsfw := c.Get("x-nsfw-header", "{}")
    var opt struct{ ShowNSFW bool `json:"showNSFW"` }
    json.Unmarshal([]byte(nsfw), &opt)
    if !opt.ShowNSFW {
        return "sfw"
    }
    return "" // 不过滤
}
```

---

## 10. 外部 API 集成

### Hikari API

```
GET /api/hikari?vndb_id=v12345
```

CORS 白名单域名：Hikarinagi, Shionlib, TouchGal 等。限流：10000 次/分钟/IP+Origin。

返回补丁信息 + 资源列表（不含下载链接）。Go 端直接实现，逻辑简单。

### Moyu API

```
GET /api/moyu/patch/has-patch
```

CORS 白名单：TouchGal 域名。限流：10 次/小时/IP。

返回所有有资源的 VNDB ID 列表。Go 端直接查询数据库。

### VNDB 同步

当前 `edit/sync/` 中有与 VNDB API 的同步逻辑（封面、角色、人物、发售信息等）。这部分逻辑在补丁创建时触发，需要在 Go 端重新实现 VNDB API 客户端。

---

## 11. 环境变量

### 需要保留的变量

| 变量 | 说明 |
|------|------|
| `KUN_DATABASE_URL` | PostgreSQL 连接串 |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis 连接 |
| `KUN_VISUAL_NOVEL_S3_STORAGE_*` | S3 存储配置 |
| `KUN_VISUAL_NOVEL_EMAIL_*` | 邮件发送配置 |

### 新增的变量

| 变量 | 说明 |
|------|------|
| `OAUTH_CLIENT_ID` | KUN OAuth 客户端 ID |
| `OAUTH_CLIENT_SECRET` | KUN OAuth 客户端密钥 |
| `OAUTH_REDIRECT_URI` | OAuth 回调地址 |
| `OAUTH_BASE_URL` | OAuth 服务器地址 |
| `MEILISEARCH_HOST` | Meilisearch 地址 |
| `MEILISEARCH_API_KEY` | Meilisearch API Key |
| `SERVER_PORT` | Go 服务监听端口（默认 1007） |
| `SESSION_SECRET` | Session ID 生成密钥 |

### 移除的变量

| 变量 | 说明 |
|------|------|
| `JWT_ISS` / `JWT_AUD` / `JWT_SECRET` | JWT 配置（改为 Session） |
