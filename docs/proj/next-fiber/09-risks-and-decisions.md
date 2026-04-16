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

### R6: VNDB 同步逻辑复杂度（中等风险）

**风险**：`edit/sync/` 中的 VNDB 同步涉及 7 种数据类型的清理和重建，关系复杂。

**缓解措施**：
1. 优先迁移补丁 CRUD 的核心路径（不含同步）
2. VNDB 同步作为独立 service 实现，逐个数据类型迁移和测试
3. 同步失败不影响补丁创建（降级为无元数据状态）

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
