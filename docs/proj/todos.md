# 迁移 Todo 清单（Next.js → Go Fiber）

> 最后更新：2026-04-21
> 端点实现覆盖度：**约 75%**（按 D8 决策剔除 Wiki 化元数据后约 87%）
> 参考：`docs/proj/next-fiber/03-api-endpoint-mapping.md`、`09-risks-and-decisions.md` D8

---

## 🔴 P0 — 核心缺失，阻塞主流程

- [ ] **`POST /api/patch`** — 创建补丁
  - 对应原端点：`apps/next-api/edit/create.ts` + `edit/route.ts`
  - Go 端状态：`internal/patch/handler/handler.go` 无 `CreatePatch`；`router.go` 未注册
  - 需包含：FormData 解析（banner 图片 + 字段）、VNDB 去重检查、`+3 moemoepoint +1 daily_image_count`、创建 `patch_alias` 批量、`contributor` 关系
  - 依赖：`POST /api/patch/:id/banner` 子逻辑（或合并实现）

- [ ] **`POST /api/patch/:id/banner`** — 上传补丁横幅
  - 对应原端点：`apps/next-api/patch/banner/route.ts`
  - 需包含：S3 上传 + 图片压缩（WebP）+ 原图/缩略图两份
  - 依赖：`infrastructure/storage` 已有 S3 client

- [ ] **`POST /api/upload/chunk` + `/api/upload/complete`** — 分块上传
  - 对应原端点：`apps/next-api/upload/resource/route.ts`
  - Go 端状态：`internal/common/upload/` **空目录**
  - 需包含：BLAKE3 哈希、Redis 缓存状态、每日限额、临时目录清理、断点续传
  - 风险：R3（见 09-risks-and-decisions.md）

## 🟡 P1 — 重要缺失

- [ ] **`POST /api/search`** — 全文搜索
  - 对应原端点：`apps/next-api/search/route.ts`
  - Go 端状态：`internal/common/search/`、`infrastructure/search/` **都是空目录**
  - 需包含：Meilisearch 接入、索引初始化、同步逻辑

- [ ] **`POST /api/user/image`** — 个人页内容图片上传
  - 对应原端点：`apps/next-api/user/image/route.ts`

- [ ] **`PUT /api/user/avatar`** — 头像上传
  - 对应原端点：`apps/next-api/user/setting/avatar/route.ts`（POST）
  - 需生成 256×256 + 100×100 两张

## 🟠 P2 — 聊天系统

- [ ] **聊天 REST 四个端点**（`internal/chat/handler/` 目前全空）
  - [ ] `GET /api/chat/room` — 聊天室列表（原 `/chat-room`）
  - [ ] `POST /api/chat/room` — 创建群聊（role ≥ 4，原 `/chat-room`）
  - [ ] `POST /api/chat/room/join` — 加入群聊（原 `/chat-room/join`）
  - [ ] `GET /api/chat/room/:link/message` — 聊天记录（原 `/chat-room/message`）
- [ ] **WebSocket** — 见 `docs/proj/next-fiber/06-infrastructure-migration.md`
  - 5 个事件：message / reaction / seen / typing / roomStatus

## 🧹 D8 清理 — 删除废弃的 Wiki 化代码

先执行 SQL 迁移 `apps/api/migrations/001_drop_wiki_managed_tables.up.sql`，再做代码清理：

- [ ] **Prisma schema 删除**（`apps/next-web/prisma/schema/`）
  - [ ] `patch_char.prisma`
  - [ ] `patch_person.prisma`
  - [ ] `patch_release.prisma`
  - [ ] `patch_media.prisma`
  - [ ] `patch.prisma` 内的 `cover / screenshot / char_rel / person_rel / release` 关系字段
- [ ] **Go 模型删除**
  - [ ] `internal/patch/model/model.go:153-191` 的 `PatchCover`、`PatchScreenshot` 结构体
  - [ ] `internal/metadata/model/model.go` 中的 `PatchChar / PatchPerson / PatchRelease` 及所有 alias/relation
- [ ] **Go repository/service/handler 删除**
  - [ ] `internal/metadata/repository/repository.go:76-101`（Characters）、`159-196`（Persons、Releases）
  - [ ] `internal/metadata/service/service.go` 中 `GetCharacters / GetCharByID / SearchCharacters / GetPersons / GetPersonByID / SearchPersons / GetReleasesByMonth`
  - [ ] `internal/metadata/handler/handler.go` 中对应 handler 方法（约 7 个）
- [ ] **路由删除**（`internal/app/router.go:131-151`）
  - [ ] `charRoutes` 全组
  - [ ] `personRoutes` 全组
  - [ ] `api.Get("/release", ...)`
- [ ] **前端替代**
  - [ ] 补丁详情页的角色/截图/封面/发售信息改为向 Wiki Service 查询
  - [ ] 封装 `apps/web/app/composables/useGalgameWiki.ts` 作为网关

## 🟢 基础设施 / 健壮性（较早会话已列）

- [x] **`cmd/migrate/`** 迁移执行器（2026-04-21）：`make migrate-up` / `make migrate-down` / `go run ./cmd/migrate -only=001 -yes`；`_migrations` 表记录已应用文件
- [ ] **`infrastructure/markdown/`** 接入 goldmark + 自定义扩展（目前空）
- [ ] **`infrastructure/search/`** Meilisearch client（与 P1 搜索端点一起做）
- [ ] **`internal/constants/`** 业务常量迁移（目前空）
- [ ] **`middleware/ratelimit.go` 接入路由**
  - [ ] `POST /user/check-in` (1/24h)
  - [ ] `PUT /user/username` (3/h)
  - [ ] `PUT /user/email` (3/h)
  - [ ] 头像上传 (5/h)
- [ ] **Cron 优雅关停**：`cron.Start(db)` → `Start(db, rdb) func()`，`cmd/server/main.go` 接收 stop
- [ ] **`cmd/server/main.go`**：Listen 放主线程、signal 放 goroutine；关停时关 DB/Redis/cron
- [ ] **`PaginatedResponse`**：`{code,message,data,total}` → `{code,message,data:{items,total}}`（与计划和 kungal 一致）
- [ ] **OAuth cookie**：根据 `cfg.Server.Mode` 动态设置 Secure/SameSite
- [ ] **OAuth 客户端抽离**：把 `middleware/auth.go` 里的 net/http 刷新逻辑挪到 `internal/user/oauth/client.go`
- [ ] **`globalErrorHandler`**：日志补 HTTP method

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
