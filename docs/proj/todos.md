# 迁移 Todo 清单（Next.js → Go Fiber）

> 最后更新：2026-04-21
> 端点实现覆盖度：**约 75%**（按 D8 决策剔除 Wiki 化元数据后约 87%）
> 参考：`docs/proj/next-fiber/03-api-endpoint-mapping.md`、`09-risks-and-decisions.md` D8

---

## 🔴 P0 — 核心缺失，阻塞主流程

- [x] **`POST /api/patch`** — 创建补丁（2026-04-21）
  - multipart/form-data：`banner` 文件 + `data` JSON
  - 服务端 resize → JPEG q85 → PutObject 到 `patch/{id}/banner/banner.jpg`
  - 事务：创建 patch + 上传 banner + alias + +3 moemoepoint + +1 daily_image_count + contribute relation
  - VNDB 去重、creator-only 检查、非创作者强制 VNDB ID 正则
  - 按 D8 跳过 VNDB 同步步骤

- [x] **`POST /api/patch/:id/banner`** — 更新补丁横幅（2026-04-21）
  - 仅创建者或 role >= 3 可操作
  - 同样的 resize + PutObject 流程

- [x] **资源上传端点**（按 D10：minio-go + presigned URL 直传；2026-04-21 完成）
  - [x] `internal/infrastructure/storage/s3.go` 重写完成（minio-go v7，aws-sdk-go-v2 彻底移除）
  - [x] migration `002_patch_resource_s3_key`：`hash` → `blake3`，新增 `s3_key`，backfill
  - [x] `model.PatchResource`、DTO、handler、service 字段对齐
  - [x] `POST /api/upload/small/init`（签 PresignedPutObject URL）
  - [x] `POST /api/upload/small/complete`（HeadObject 验 size + 扣限额）
  - [x] `POST /api/upload/multipart/init`（NewMultipartUpload + 签每个 part URL）
  - [x] `POST /api/upload/multipart/complete`（CompleteMultipartUpload + HeadObject + 扣限额）
  - [x] `POST /api/upload/multipart/abort`（用户主动取消）
  - [x] `cron`：`cleanupAbortedMultiparts` 每 6h 清理 >24h 未完成 multipart
  - [x] `crypto/rand` → 64 字符 `[A-Za-z0-9]` 的 `s3_key` 段生成器 + `sanitizeFileName`
  - [x] `internal/constants/upload.go` 常量集中（阈值、限额、TTL、扩展名）
  - [ ] 前端上传组件重写：小文件单 PUT；大文件并发 part PUT + ETag 收集

## 🟡 P1 — 重要缺失

- [x] **`POST /api/search`** — 全文搜索（D11，2026-04-21）
  - 委托 Galgame Wiki `/galgame/search` + 本地 JOIN patch by vndb_id
  - 本地 Meilisearch 完全移除（`infrastructure/search/` 删除，`meilisearch-go` 依赖去掉）
  - 返回 `{code, message, data: {items, total}}`，每条含 Wiki 的 galgame 字段 + `has_patch` + 本站 `patch` 对象（如有）
  - 新增 `internal/galgame/client/client.go` 作为 Wiki Service 的共享 HTTP client

- [x] **`POST /api/user/image`** — 个人页内容图片上传（2026-04-21）
  - 路径 `user_{uid}/image/{uid}-{unix_ms}.jpg`，1920×1080 JPEG q=50
  - 受 `daily_image_count` 限制（20/天）

- [x] **`PUT /api/user/avatar`** — 头像上传（2026-04-21）
  - 路径 `user/avatar/user_{uid}/avatar.jpg` + `avatar-mini.jpg`
  - 256×256 + 100×100 两张 JPEG q=85

## 🟠 P2 — 聊天系统（按 D9 改 REST，无实时）（2026-04-21 完成）

- [x] `GET  /api/chat/room` — 聊天室列表
- [x] `POST /api/chat/room` — 创建群聊（role ≥ 4）
- [x] `POST /api/chat/room/join` — 加入群聊
- [x] `GET  /api/chat/room/:link/message?after=&limit=` — 轮询（只拉新消息）
- [x] `POST /api/chat/room/:link/message` — 发送消息
- [x] `PUT  /api/chat/message/:id` — 编辑（写 `chat_message_edit_history`）
- [x] `DELETE /api/chat/message/:id` — 软删（status=DELETED）
- [x] `POST /api/chat/message/:id/reaction` — 表情回应（toggle）
- [x] `PUT  /api/chat/room/:link/seen` — 批量已读
- [ ] `apps/next-socket/` 迁完后整个目录删除（等前端切过来再删）

**不做**：typing 指示、在线状态、实时推送。编辑/删除/表情变化**不经过轮询同步**，只在用户手动刷新页面时看到（Q11 = C）。

## 🧹 D8 清理 — 删除废弃的 Wiki 化代码

先执行 SQL 迁移 `apps/api/migrations/001_drop_wiki_managed_tables.up.sql`（`make migrate-up` 或 `go run ./cmd/migrate -only=001`），再做代码清理：

- [x] **Prisma schema 删除**（`apps/next-web/prisma/schema/`，2026-04-21）
  - [x] `patch_char.prisma` / `patch_person.prisma` / `patch_release.prisma` / `patch_media.prisma`
  - [x] `patch.prisma` 内的 `cover / screenshot / char_rel / person_rel / release` 关系字段
- [x] **Go 模型删除**（2026-04-21）
  - [x] `internal/patch/model/model.go` 的 `PatchCover`、`PatchScreenshot` + 其 Preload 字段
  - [x] `internal/metadata/model/model.go` 中的 `PatchChar / PatchPerson / PatchRelease` 及 alias
- [x] **Go repository/service/handler 删除**（2026-04-21）
  - [x] `internal/metadata/repository/repository.go` 的 Characters/Persons/Releases 块
  - [x] `internal/metadata/service/service.go` 对应方法
  - [x] `internal/metadata/handler/handler.go` 对应 7 个方法
  - [x] `internal/patch/repository/repository.go`、`internal/common/handler.go` 的 `Preload("Covers"/"Screenshots")`
- [x] **路由删除**（`internal/app/router.go`，2026-04-21）
  - [x] `charRoutes` / `personRoutes` / `GET /release`
- [ ] **前端替代**
  - [ ] 补丁详情页的角色/截图/封面/发售信息改为向 Wiki Service 查询
  - [ ] 封装 `apps/web/app/composables/useGalgameWiki.ts` 作为网关
- [ ] **运行 SQL 迁移** `make migrate-up`（先 `pg_dump` 备份 5 张表）

## 🟢 基础设施 / 健壮性（较早会话已列）

- [x] **`cmd/migrate/`** 迁移执行器（2026-04-21）：`make migrate-up` / `make migrate-down` / `go run ./cmd/migrate -only=001 -yes`；`_migrations` 表记录已应用文件
- [x] **`infrastructure/markdown/`** goldmark + GFM 扩展（2026-04-21）— `Render / MustRender` API
- [x] ~~`infrastructure/search/`~~ — D11 委托 Wiki 后已删除
- [x] **`internal/constants/`** 业务常量（2026-04-21 补了上传相关；其他后续随模块补）
- [x] **`middleware/ratelimit.go` 接入路由**（2026-04-21）
  - [x] `POST /user/check-in` (1/24h)
  - [x] `PUT /user/username` (3/h)
  - [x] `PUT /user/email` (3/h)
  - [x] `PUT /user/avatar` (5/h)
  - [x] `POST /auth/forgot/send-code` (3/h)
  - [x] `POST /auth/email/send-code` (3/h)
- [x] **Cron 优雅关停**（2026-04-21）：`cron.Start(db, s3) func()`，`app.CronStop` + `cmd/server/main.go` 接收 stop
- [ ] **`cmd/server/main.go`**：Listen 放主线程、signal 放 goroutine；关停时关 DB/Redis/cron
- [ ] **`PaginatedResponse`**：`{code,message,data,total}` → `{code,message,data:{items,total}}`（与计划和 kungal 一致）
- [x] **OAuth cookie**（2026-04-21）：`middleware.SecureCookies` 按 `cfg.Server.Mode` 在 app 启动时设置
- [ ] **OAuth 客户端抽离**：把 `middleware/auth.go` 里的 net/http 刷新逻辑挪到 `internal/user/oauth/client.go`
- [x] **`globalErrorHandler`**（2026-04-21）：日志补 HTTP method

## 🔎 待确认

- [ ] `GET /api/admin/galgame` — 很可能服务于已废弃元数据，确认后决定删除/改造
- [ ] `GET /api/message/all` 是否真的需要（与 `GET /api/message` 似乎只差排序），能合则合
- [ ] 错误码方案：保留 HTTP-status-like `40100/40300` 还是对齐 kungal 的 `205/233`？前端 `useApi.ts` 用 HTTP `statusCode`，两种都兼容

## ✅ 已完成（记录）

- OAuth 回调 + Session
- 忘记密码、邮箱验证码
- 补丁 CRUD（除 POST 创建）、评论、资源、收藏/点赞/浏览/贡献者
- 用户资料、设置（除头像/图片）、关注系统、签到
- 消息通知（除 `/all`）
- 管理后台全部
- 标签 + 公司元数据（本地）
- 首页、全局评论/资源、Galgame 列表、Hikari、Moyu、创作者申请
