# 风险与决策记录

## 关键决策

### D1: 响应格式统一为 `{code, message, data}`

**决定**：Go 端统一使用 `{code, message, data}` 包裹响应。

**原因**：
- 与 KUN OAuth 系统响应格式一致
- 错误码（205/233）通过 `code` 字段传递，不再依赖 HTTP status body 嵌套
- 前端 `responseHandler.ts` 只需改一处解析逻辑

**影响**：前端所有 `useFetch` 数据访问需要适配。

### D2: text[] 字段处理策略

**决定**：
- `topic.tag`、`galgame_resource.provider` → 关联表（需要查询过滤）
- `galgame_engine.alias`、`galgame_toolset.homepage`、`galgame_website.domain` 等 → jsonb（纯展示）

**原因**：text[] 是 PostgreSQL 私有类型，GORM 支持不佳，且无法建外键约束。

### D3: 搜索迁移到 Meilisearch

**决定**：不在 Go 端重写复杂 SQL 搜索，直接接入 Meilisearch。

**原因**：当前搜索用 ILIKE + hasSome 全表扫描，数据量增长后不可持续。Meilisearch 原生支持中日文分词、typo tolerance。

### D4: WebSocket 暂用 go-socket.io

**决定**：初期使用 go-socket.io 保持前端兼容，后续视情况迁移到原生 WebSocket。

### D5: Session 而非 OAuth Token 直接验证

**决定**：Go 后端自建 Redis Session，不每次请求验证 OAuth access token。

**原因**：OAuth access token 15 分钟过期，每次请求都验证会产生大量对 OAuth 服务器的请求。自建 Session（7 天 TTL）减少对外依赖，OAuth token 仅在 Session 内部维护和刷新。

### D6: 计数缓存字段

**决定**：在高频访问表添加冗余 `*_count` 字段。

**原因**：消除 `_count` 子查询，列表页性能提升显著。代价是事务中需同步维护计数，但这是可控的。

## 风险清单

### R1: 数据库兼容性（中等风险）

**风险**：GORM 和 Prisma 同时操作同一数据库，可能产生冲突。

**缓解**：
- 迁移期间 Nitro 和 Go 不同时写同一张表
- 新增列/表通过独立 SQL migration 管理
- GORM 设置 `SkipDefaultTransaction: true` 避免额外事务开销
- 不使用 GORM AutoMigrate 操作现有表

### R2: text[] → 关联表/jsonb 数据迁移（中等风险）

**风险**：text[] 到关联表的迁移涉及数据转换，可能丢失数据或产生重复。

**缓解**：
- 迁移 SQL 使用 `unnest()` + `ON CONFLICT DO NOTHING`
- 在测试环境先跑迁移，对比数据量
- 保留原 text[] 列一段时间，确认无误后再 DROP

### R3: Markdown 渲染不一致（高风险）

**风险**：goldmark 的渲染结果可能和 remark/rehype 不完全一致，导致已有内容显示异常。

**缓解**：
- 编写对比测试：收集 100 条真实内容，分别用两套系统渲染，diff 对比
- 6 个自定义 rehype 插件逐个移植并测试
- spoiler 和 video 后处理用正则，逻辑相同
- 如果差异大，可以考虑 Go 端调用 Node 子进程渲染（过渡方案）

### R4: SSR 请求延迟增加（低风险）

**风险**：Nitro 内部调用变为网络请求，SSR 首屏时间增加。

**缓解**：
- Go 和 Nuxt 部署在同一机器，走 127.0.0.1
- 高频页面（首页、galgame 列表）加 Redis 缓存
- 非关键数据改为 CSR 懒加载

### R5: 前端改动范围（中等风险）

**风险**：响应格式变更导致大量前端代码需要修改。

**缓解**：
- 封装一个统一的 fetch wrapper，在内部处理 `{code, data}` 解包
- 分模块逐步迁移，用 Nginx 路由分流（已完成的模块指向 Go，其余指向 Nitro）

### R6: 老用户 OAuth 迁移（低风险）

**风险**：老用户首次 OAuth 登录时邮箱不匹配（已改邮箱、多邮箱等）。

**缓解**：
- 邮箱匹配自动关联
- 不匹配时提供手动关联流程（输入旧密码验证身份）
- 保留旧密码一段时间用于验证

## 迁移检查清单

### Phase 1 上线前
- [ ] OAuth 回调流程端到端测试
- [ ] 老用户邮箱关联测试
- [ ] Session 创建/刷新/过期测试
- [ ] 前端登录/登出流程测试
- [ ] 错误码 205/233 前端处理验证

### Phase 2 上线前
- [ ] 所有 galgame CRUD 端点对照测试
- [ ] 计数字段初始化 SQL 执行
- [ ] text[] 迁移 SQL 执行（provider → 关联表）
- [ ] Markdown 渲染对比测试
- [ ] Meilisearch 索引初始化

### Phase 3 上线前
- [ ] 所有 topic CRUD 端点对照测试
- [ ] topic.tag text[] 迁移
- [ ] 投票功能测试

### Phase 4 上线前
- [ ] 消息系统 + WebSocket 端到端测试
- [ ] 工具集文件上传流程测试
- [ ] 管理后台权限测试

### Phase 5 上线前
- [ ] 定时任务执行验证（每日重置、每小时清理）
- [ ] RSS 输出格式验证
- [ ] CDN 缓存清除验证
- [ ] 全量负载测试
- [ ] 移除 Nitro 后端代码
