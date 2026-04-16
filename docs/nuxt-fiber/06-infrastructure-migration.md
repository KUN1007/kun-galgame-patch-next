# 基础设施迁移

## 1. Redis

### 当前
- unstorage redis driver，通过 `useStorage('redis')` 访问
- 用途：JWT Refresh Token 存储、邮件验证码、上传 salt 缓存、工具集临时资源

### 目标
- go-redis/v9，直接 `rdb.Get/Set/Del`
- 用途：Session 存储、邮件验证码、上传缓存、工具集临时资源

### Key 映射

| 当前 Key | 目标 Key | 说明 |
|---------|---------|------|
| `refreshToken:{uid}` | `session:{token}` | 认证方式变更 |
| `email:code:{email}` | `email:code:{email}` | 不变 |
| `email:limit:{email}` | `email:limit:{email}` | 不变（30s 频率限制） |
| `email:ip:{ip}` | `email:ip:{ip}` | 不变 |
| `toolset:resource:{salt}` | `toolset:resource:{salt}` | 不变 |

## 2. S3 图片上传

### 当前
- `@aws-sdk/client-s3`
- `lib/s3/uploadImageToS3.ts`
- 两套 S3（图床 + 文件存储），仅图床需迁移

### 目标
- `aws-sdk-go-v2/service/s3`
- `internal/infrastructure/storage/s3.go`（已完成骨架）
- 仅对接图床 S3，文件存储 S3 由其他服务处理

### 上传限制逻辑
- `canUserUpload()` → 检查 `daily_image_count` / `daily_toolset_upload_count`
- `checkBufferSize()` → 文件大小校验
- Go 端在 handler 层实现相同逻辑

## 3. 邮件发送

### 当前
- Nodemailer SMTP
- 验证码邮件（注册、忘记密码、修改邮箱）
- 30 秒频率限制（Redis）
- 7 位随机验证码 + 32 字节 salt
- 10 分钟 TTL

### 目标
- `net/smtp` + `internal/infrastructure/mail/mail.go`（已完成骨架）
- 注册/忘记密码通过 OAuth 处理，可能只保留修改邮箱的验证码
- 频率限制逻辑不变

## 4. CDN 缓存清除

### 当前
```typescript
// purgeCache.ts
// 清除 Cloudflare 缓存：galgameBanner (banner + mini)、userAvatar (avatar + 100px)
fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ files: urls })
})
```

### 目标
```go
// internal/common/upload/purge_cache.go
func PurgeCache(urls []string) error {
    // 同样的 Cloudflare API，用 net/http 调用
}
```

## 5. Markdown 渲染

### 当前插件链
```
remark-parse → remark-gfm → remark-frontmatter → remark-math
→ remark-rehype
→ rehype-sanitize → rehype-slug → rehype-prism → rehype-katex
→ rehypeKunLazyImage → rehypeKunCodeBlockWrapper → rehypeKunH1ToH2
→ rehypeKunTableWrapper → rehypeKunInsertWbr → rehypeKunVideo
→ rehype-stringify
→ 后处理：spoiler 文本 (||text||) + 视频链接 (kv:<url>)
```

### 目标
```
goldmark + extensions (GFM, math/KaTeX, syntax highlighting)
+ 自定义 AST walker：
  - lazy image loading (添加 loading="lazy")
  - code block wrapper (包裹 <pre> 标签)
  - h1 → h2 (降级标题)
  - table wrapper (响应式包裹)
  - wbr insertion (长文本断行)
  - video embed (kv:<url> → <video>)
+ 后处理：spoiler 正则替换
```

goldmark 扩展需要逐个重写，确保渲染结果与当前一致。建议编写对比测试：相同输入 markdown，对比 HTML 输出。

## 6. 定时任务

### 当前（Nitro scheduledTasks）

**reset-daily（每日 0:00）**：
```typescript
await prisma.user.updateMany({
    where: { OR: [
        { daily_check_in: { not: 0 } },
        { daily_image_count: { not: 0 } },
        { daily_toolset_upload_count: { not: 0 } }
    ]},
    data: { daily_check_in: 0, daily_image_count: 0, daily_toolset_upload_count: 0 }
})
```

**cleanup-toolset-resource（每小时）**：
```typescript
// 从 Redis 获取所有 toolset:resource 键
// 删除 S3 对象 + 清除 Redis 缓存
```

### 目标（robfig/cron）

```go
c := cron.New()
c.AddFunc("0 0 * * *", resetDaily)         // 每日重置
c.AddFunc("0 * * * *", cleanupToolset)      // 每小时清理
c.Start()
```

## 7. WebSocket（聊天系统）

### 当前
- Socket.IO 服务端 + JWT 认证中间件
- 事件：`private:join`、`message:sending`、`message:recall`、`private:leave`
- 房间制：`generateRoomId(uid1, uid2)` 生成唯一房间名
- 消息验证：UID 存在、非自发、长度 ≤1007
- 消息持久化到 `chat_message` 表

### 目标选项

**选项 A（推荐）：go-socket.io** — 前端不改
- 前端继续用 `socket.io-client`
- Go 端用 `googollee/go-socket.io`
- 优点：前端零改动
- 缺点：go-socket.io 维护不活跃

**选项 B：Fiber WebSocket** — 前端需改
- Go 端用 Fiber 内置 WebSocket
- 前端从 `socket.io-client` 改为原生 WebSocket
- 自定义 JSON 消息协议
- 优点：更轻量，无第三方依赖
- 缺点：前端需要改

建议先用选项 A 快速迁移，后续有需要再换。

## 8. 搜索

### 当前
- 数据库 ILIKE + hasSome 全表扫描
- 搜索 topic（title + content + tag）、galgame（四语言名称 + alias + tag）、user（name）

### 目标
- Meilisearch 独立服务
- Go 端在写入时异步同步索引
- 索引：galgame（id, name_*, alias, tag）、topic（id, title, content, tag）、user（id, name）
- 搜索请求直接转发 Meilisearch，不走数据库
