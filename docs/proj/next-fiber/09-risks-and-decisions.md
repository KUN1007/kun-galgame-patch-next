# 风险与决策记录

## 关键决策

### D1: 复用 kungal 项目架构

**决定**：复用 kungal 的模块化架构（dto/handler/model/repository/service 五层分离），共享 `pkg/` 和 `internal/infrastructure/`。

**原因**：
- kungal 已在生产环境验证
- 两个项目由同一人维护，统一架构降低心智负担
- `infrastructure/`（Redis/S3/Mail/Search）逻辑通用

**影响**：需要从 kungal 仓库拷贝基础代码，后续考虑抽取为共享库。

### D2: 响应格式统一为 `{code, message, data}`

**决定**：Go 端统一使用 `{code, message, data}` 包裹响应。

**原因**：
- 与 KUN OAuth 系统响应格式一致
- 与 kungal 后端响应格式一致
- 错误码通过 `code` 字段传递，语义清晰
- 前端只需改一处响应解析逻辑

**影响**：前端所有 API 调用需要适配新格式。通过封装 `kunFetch` 降低改动量。

### D3: jsonb 存储 String[] 字段

**决定**：所有原 `text[]` 字段统一改为 `jsonb`，不再使用关联表。

**原因**：
- GORM 不原生支持 PostgreSQL `text[]`
- 本项目的数组字段（type/language/platform 等）数据量小、无需建索引
- jsonb 支持 `@>` 操作符做包含查询，满足筛选需求
- 已在 Prisma schema 中完成迁移，验证无问题

### D4: Meilisearch 替代数据库搜索

**决定**：搜索功能从 Prisma ILIKE 迁移到 Meilisearch。

**原因**：
- 当前搜索用多字段 ILIKE + 内存去重，全表扫描性能差
- Meilisearch 原生支持中日文分词和 typo tolerance
- 与 kungal 共用同一个 Meilisearch 实例

### D5: 初期 WebSocket 使用 go-socket.io

**决定**：初期使用 `go-socket.io` 保持前端 socket.io-client 兼容，后续视情况迁移到原生 Fiber WebSocket。

**原因**：
- 前端聊天代码使用 socket.io-client 事件模型
- go-socket.io 可以直接兼容，减少前端改动
- 如果 go-socket.io 性能或兼容性不满意，再迁移到原生 WS

### D6: Session 而非 OAuth Token 直接验证

**决定**：Go 后端自建 Redis Session，不每次请求验证 OAuth access token。

**原因**：
- OAuth access token 15 分钟过期，频繁验证产生大量外部请求
- Session 7 天 TTL，减少对 OAuth 服务器依赖
- OAuth token 在 Session 内部维护，需要时才刷新

### D7: 反范式化计数字段

**决定**：在 user/patch/patch_comment/patch_resource 表添加冗余 `*_count` 字段。

**原因**：
- 消除列表页的 `_count` 子查询
- GORM 不支持 Prisma 的 `_count` 语法糖
- 代价是事务中需同步维护计数，但这在 kungal 中已验证可控

### D9: 移除 Socket.IO，聊天改为 REST 轮询（2026-04-21 新增）

**决定**：废弃 `apps/next-socket/` 和 go-socket.io。聊天消息的读写全部走 GET/POST，不再提供实时推送。前端通过定时轮询拉取新消息。

**原因**：
- 运维开销：独立 Socket.IO 服务需要单独进程、Sticky Session、ping/pong，长尾 bug 多
- 当前站点聊天量不大，轮询开销可接受
- 简化前后端部署拓扑，Go Fiber 单服务即可
- 取消 R5 中「socket 事件协议对齐」风险

**行为变更**：
- 直接**删除**：`typing` 指示器、`roomStatus` 在线状态、实时推送
- 保留并 REST 化：消息 CRUD、表情回应（`chat_message_reaction`）、已读标记（`chat_message_seen`）、编辑历史（`chat_message_edit_history`）
- **不同步老消息的编辑和删除**：轮询只拉 `id > lastMsgId` 的**新消息**，老消息的编辑、删除、表情增减只在用户**手动刷新页面**时可见（用户 Q11 = C）

**REST 端点清单**：
- `GET    /api/chat/room`
- `POST   /api/chat/room`（role ≥ 4）
- `POST   /api/chat/room/join`
- `GET    /api/chat/room/:link/message?after=&limit=`
- `POST   /api/chat/room/:link/message`
- `PUT    /api/chat/message/:id`
- `DELETE /api/chat/message/:id`（软删，`status=DELETED`）
- `POST   /api/chat/message/:id/reaction`（toggle）
- `PUT    /api/chat/room/:link/seen`

**轮询约定**：聊天室激活时每 **3s** 拉 `?after=lastMsgId`；`/unread` 每 **30s** 拉。

**影响**：
- `apps/next-socket/` 整个目录迁移完成后删除
- `06-infrastructure-migration.md` 中 WebSocket 章节废弃
- `00-overview.md` 的 WebSocket 行 → 0 个

**取舍**：前端从"实时"降级到"刷新查看"。若将来需要实时，可在 Fiber 单服务内用原生 WebSocket 重建，无需恢复 socket.io。

### D10: 文件上传去哈希化 + 直传 S3 + minio-go（2026-04-21 新增）

**核心决定**：
- 服务端**不再计算** BLAKE3 hash
- 前端**直传 S3**（presigned URL 模式），服务端不中转文件字节
- SDK 从 `aws-sdk-go-v2` **全部换成** `minio-go`（删除现有 `internal/infrastructure/storage/s3.go` 重写）
- 小文件 (≤ 200 MB) 用 `PresignedPutObject`；大文件 (> 200 MB, ≤ 1 GB) 用 multipart presigned URL
- 存储路径格式与老代码 `apps/next-api/patch/resource/_helper.ts:16` 完全一致

**Schema 变更**（见 `apps/api/migrations/002_patch_resource_s3_key.up.sql`）：
```sql
-- 1. 老 hash 列改名 blake3，存量 BLAKE3 值保留
ALTER TABLE patch_resource RENAME COLUMN hash TO blake3;

-- 2. 新增 s3_key 列，存完整 S3 对象键
ALTER TABLE patch_resource ADD COLUMN s3_key VARCHAR(2048) NOT NULL DEFAULT '';

-- 3. 存量迁移：从 content URL 里剥出 key
UPDATE patch_resource
SET s3_key = REGEXP_REPLACE(content, '^https?://[^/]+/[^/]+/', '')
WHERE storage <> 'user' AND content ~ '^https?://[^/]+/[^/]+/.+';
```

迁移后：
- **老数据**：`blake3 = <原 BLAKE3 hex>`，`s3_key = patch/{id}/{blake3}/{fileName}`，S3 路径和下载链接完全不变
- **新上传**：`blake3 = ""`，`s3_key = patch/{id}/{random64}/{fileName}`，其中 `random64 = [A-Za-z0-9]{64}`（`crypto/rand` 生成）
- 所有 delete/head 操作直接读 `s3_key`，不再拼路径

`s3_key` 存**完整 S3 对象键**（已确认）。delete/head 直接用 `s3_key`，不再在应用层拼路径。

**上传流程**（前端直传，方案 b）：

```
小文件 (≤ 200 MB) — PresignedPutObject
─────────────────────────────────────
① 前端 POST /api/upload/small/init { patchId, fileName, fileSize }
   → 服务端校验 role/限额/扩展名 → 生成 s3_key + presigned PUT URL（有效 2h）→ 返回 { s3_key, upload_url }
② 前端 PUT upload_url （body 为文件）→ S3
③ 前端 POST /api/upload/small/complete { s3_key, declaredSize }
   → 服务端 HeadObject 取实际 size → 校验（≤ 1GB + 限额 + 与 declared 一致）
   → 通过：累加 daily_upload_size，返回 { s3_key, size }
   → 失败：DeleteObject 清掉，返回错误

大文件 (> 200 MB) — Multipart presigned
──────────────────────────────────────
① 前端 POST /api/upload/multipart/init { patchId, fileName, fileSize, partCount }
   → 服务端 CreateMultipartUpload + 为每个 part 生成 PresignedUploadPart URL（有效 4h）
   → 返回 { s3_key, upload_id, part_urls: [...] }
② 前端逐 part PUT（可并发）→ 收集 ETag
③ 前端 POST /api/upload/multipart/complete { s3_key, upload_id, parts: [{ partNumber, etag }] }
   → 服务端 CompleteMultipartUpload → HeadObject 验 size
   → 通过 / 失败同小文件流程
④ 前端 POST /api/upload/multipart/abort { s3_key, upload_id }（用户主动取消）
```

**孤儿清理 — 方案 B（Go cron）**：
- 新增 cron 任务 `cleanupAbortedMultiparts`，每 **6h** 跑一次
- `ListMultipartUploads` → 过滤 `Initiated > 24h` 的 → 批量 `AbortMultipartUpload`

**每日限额实施**：
- init 阶段：不预扣（用户 Q6 = 不关心带宽）
- complete 阶段：用 HeadObject 返回的实际 size 扣减 `daily_upload_size`
- 每日 100 MB（普通）/ 5 GB（创作者）超限 → Head 后删除文件 + 拒绝

**客户端 Q4 生成**：`crypto/rand` 读 48 字节 → base64 → 取前 64 字符并过滤为 `[A-Za-z0-9]`

**路径规则（沿用老代码）**：
- 补丁资源：`patch/{patchId}/{s3KeySegment}/{fileName}`
- 补丁横幅：`patch/{patchId}/banner.webp`（见 `apps/next-api/utils/uploadPatchBanner.ts`）
- 用户头像：按原 `apps/next-api/user/setting/_upload.ts` 的路径
- 用户图片：按原 `apps/next-api/user/image/_upload.ts` 的路径
- 聊天附件：按原聊天代码的路径（Q12 确认：照搬原路径）

> 实现时需实际查阅以上 TS 文件确认精确路径串。

**影响**：
- `internal/infrastructure/storage/s3.go` **完全重写**，用 `github.com/minio/minio-go/v7`
- `aws-sdk-go-v2` 相关依赖从 `go.mod` 移除
- `internal/common/upload/` 从空目录实现为 4-5 个 handler（init/complete/abort × small/multipart）
- cron 新增 `cleanupAbortedMultiparts` 任务
- 前端上传组件重写：小文件单 PUT；大文件并发多 PUT + ETag 收集
- 风险 R3 降为低

**presigned URL 有效期**：PutObject 2h，multipart part 4h

### D8: Galgame 元数据外移到 Wiki Service（2026-04-21 新增）

**决定**：`patch_char` / `patch_person` / `patch_release` / `patch_media`（cover + screenshot）所有 Prisma 模型及对应 Go 模型、repository、handler **全部废弃**。Galgame 的角色、声优、发售信息、封面、截图统一由独立的 Galgame Wiki Service 管理，本项目通过 `patch.vndb_id` 外键 + `GalgameClient` HTTP 调用获取。

**原因**：
- 与 kungal 项目共用同一套 Galgame 元数据，避免多处维护
- VNDB 同步逻辑原本复杂（见 R6），统一到 Wiki Service 后本项目只需关心「补丁-VNDB ID」绑定
- Galgame Wiki 有自己的 revision/PR 审阅机制（`docs/galgame_wiki/01-revision-system-design.md`），比本地字段级更新更完善

**影响**：
- Next.js 端点 `/api/character`、`/api/person`、`/api/release` 不迁移到 Go
- Next.js 端点 `/api/edit/sync/*`（VNDB 同步）在 Go 端只保留 tag/company 同步
- 前端补丁详情页的角色/截图/封面/发售信息改为从 Wiki Service 拉取
- 原 `apps/api/internal/patch/model/model.go` 中 `PatchCover`、`PatchScreenshot` 结构体删除
- 相关风险 R6（VNDB 同步复杂度）大幅降低

**关联文档**：
- `docs/galgame_wiki/integration-guide.md` — `GalgameClient` 封装与认证透传
- `docs/galgame_wiki/api-reference.md` — Wiki Service 端点清单

---

## 风险清单

### R1: Markdown 渲染不一致（高风险）

**风险**：goldmark 与 remark/rehype 渲染结果不完全一致，已有评论和聊天消息显示异常。

**影响范围**：所有已有评论（patch_comment.content）和聊天消息（chat_message.content）

**缓解措施**：
1. 收集 100+ 条真实评论和聊天消息
2. 分别用两套系统渲染，diff 对比
3. 逐项修复差异（GFM 表格、自动链接、HTML 标签处理）
4. 如果差异不可接受，过渡期可在 Go 端调用 Node 子进程渲染
5. 从 kungal 项目获取已调优的 goldmark 配置

### R2: 数据库双写期兼容性（中等风险）

**风险**：迁移期间 Next.js API Routes 和 Go Fiber 同时操作同一数据库。

**缓解措施**：
- 使用 Nginx 路由分流，确保同一端点只由一侧处理
- 新增列/表通过独立 SQL migration 管理
- GORM 设置 `SkipDefaultTransaction: true`
- 不使用 GORM AutoMigrate 操作现有表
- 共享的计数字段在两侧使用相同的原子操作（`UPDATE ... SET count = count + 1`）

### R3: 分块上传系统重建（中等风险）

**风险**：分块上传涉及文件流处理、临时目录管理、BLAKE3 哈希、Redis 缓存、每日限额，逻辑复杂且需要保证数据完整性。

**缓解措施**：
1. 先实现非分块的简单上传（外部链接类型）
2. 再实现分块上传，逐个环节测试
3. 使用相同的 Redis Key 格式，确保兼容
4. 编写针对性测试：大文件、断点续传、并发上传

### R4: SSR 请求延迟（低风险）

**风险**：Next.js SSR 从内部调用变为网络请求（→ Go 后端），首屏时间增加。

**缓解措施**：
- Go 和 Next.js 部署在同一机器，走 127.0.0.1
- 高频页面（首页、Galgame 列表）加 Redis 缓存
- 非关键数据改为 CSR 懒加载
- Go Fiber 本身的吞吐量远高于 Next.js API Routes

### R5: 前端改动范围（中等风险）

**风险**：响应格式变更 + 认证方式变更导致大量前端代码需要修改。

**缓解措施**：
- 封装 `kunFetch` 统一处理响应解包和错误处理
- 分模块逐步迁移，每次只切一个模块到 Go
- 每个模块切换后进行完整的端到端测试

### R6: VNDB 同步逻辑复杂度（已降级，低风险）

> **更新（2026-04-21）**：因 D8 决策，cover/screenshot/char/person/release 五类元数据不再在本项目落盘，Go 端只同步 tag/company 两类。该风险大幅降低。

**残余风险**：tag/company 的同步依然需要清理旧关系 + 重新导入，事务一致性要保证。

**缓解措施**：
1. 优先迁移补丁 CRUD 的核心路径（不含同步）
2. tag/company 同步作为独立 service 实现
3. 同步失败不影响补丁创建（补丁已有 vndb_id，可通过 Wiki Service 兜底展示）

---

## 迁移检查清单

### Phase 1 上线前（基础设施 + OAuth 认证）

- [ ] Go Fiber 项目骨架搭建完成
- [ ] 从 kungal 复用 pkg/ 和 infrastructure/
- [ ] PostgreSQL + Redis + S3 连接测试通过
- [ ] OAuth 回调流程端到端测试
- [ ] 老用户邮箱关联测试
- [ ] Session 创建 / 过期 / 刷新测试
- [ ] 前端登录/登出流程测试
- [ ] `kunFetch` 响应处理验证
- [ ] Nginx 路由分流配置

### Phase 2 上线前（补丁核心）

- [ ] 补丁 CRUD 全部端点对照测试
- [ ] 评论创建/删除/点赞 + 萌萌点变化验证
- [ ] 资源创建/更新/删除 + S3 文件操作验证
- [ ] 分块上传完整流程测试
- [ ] VNDB 同步逻辑验证
- [ ] Banner 上传 + 图片压缩验证
- [ ] 补丁聚合字段（type/language/platform）更新验证
- [ ] 消息通知触发验证（收藏/点赞/评论/@提及）
- [ ] NSFW 过滤验证
- [ ] Meilisearch 索引初始化和同步

### Phase 3 上线前（用户模块）

- [ ] 用户资料（6 个 profile 端点）对照测试
- [ ] 用户设置（头像/用户名/简介/邮箱/密码）测试
- [ ] 关注/取消关注 + 计数字段验证
- [ ] 签到 + 随机萌萌点验证
- [ ] 每日限额（图片/上传）验证

### Phase 4 上线前（辅助模块）

- [ ] 消息列表/已读/未读 测试
- [ ] 管理后台全部功能测试
- [ ] 管理员设置（评论验证/创作者/注册）测试
- [ ] 创作者申请/审批流程测试
- [ ] 标签/角色/公司/人物 CRUD 测试
- [ ] 搜索功能验证（Meilisearch）
- [ ] 首页数据聚合验证
- [ ] 外部 API（Hikari/Moyu）CORS + 限流测试

### Phase 5 上线前（实时系统 + 收尾）

- [ ] WebSocket 聊天完整流程测试
- [ ] 消息发送/编辑/删除/已读/表情回应
- [ ] 定时任务执行验证（每日重置、每小时清理）
- [ ] 全局评论列表 + 全局资源列表
- [ ] 发售日历
- [ ] 负载测试
- [ ] 移除 Next.js API Routes 代码
- [ ] 清理 Redis 中的旧 JWT Key
