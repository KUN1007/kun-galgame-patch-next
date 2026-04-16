# 后端迁移总览：Next.js API Routes → Go Fiber + GORM

## 迁移动机

当前 MoYu Patch 站点后端运行在 Next.js App Router API Routes（`apps/next-server/`）中，存在以下问题：

- Next.js API Routes 的冷启动和并发处理能力不足
- 与前端耦合部署，无法独立扩缩容
- Prisma ORM 在高并发下的连接池管理复杂
- 需要与 KUN OAuth 统一认证系统对接
- 需要与 kungal 社区论坛共享架构模式，降低维护成本

后端将使用 Go Fiber + GORM 重写，复用 kungal 项目已验证的模块化架构。前端保持 Next.js（`apps/web`），后端代码位于 `apps/api`。

## 数字概览

| 维度 | 数量 |
|------|------|
| API 端点 | **67 个路由文件**（GET/POST/PUT/DELETE 约 100+ 端点） |
| Prisma 模型 | **30**（14 个 schema 文件） |
| 服务端工具函数 | **12 个文件**（`apps/next-server/utils/`） |
| WebSocket 事件处理 | **5 个**（message/reaction/seen/typing/roomStatus） |
| 定时任务 | **2 个**（每日重置、每小时清理） |
| Zod 验证 Schema | **17 个文件**（`apps/web/validations/`） |
| 业务模块 | **23 个 API 子目录** |

## 技术栈映射

| 层 | Next.js API Routes（当前） | Go Fiber（目标） |
|----|--------------------------|-----------------|
| HTTP 框架 | Next.js App Router (`NextRequest/NextResponse`) | Fiber v2 |
| ORM | Prisma 6 | GORM |
| 验证 | Zod | go-playground/validator |
| 缓存 | ioredis | go-redis/v9 |
| 认证 | 自签 JWT 单 Token（30d） | KUN OAuth + Redis Session |
| WebSocket | Socket.IO（独立 Express 服务器） | Fiber WebSocket / go-socket.io |
| 定时任务 | node-cron | robfig/cron |
| Markdown | remark/rehype（unified 生态） | goldmark + 自定义扩展 |
| 邮件 | Nodemailer / Resend | net/smtp |
| S3 | @aws-sdk/client-s3 | aws-sdk-go-v2 |
| 密码哈希 | @noble/hashes（Argon2id） | golang.org/x/crypto/argon2 |
| 文件哈希 | BLAKE3（@noble/hashes） | lukechampine.com/blake3 |
| 搜索 | Prisma ILIKE + 内存去重 | Meilisearch |
| 日志 | console | log/slog |

## 迁移分阶段计划

| 阶段 | 内容 | 端点数 | 前置条件 |
|------|------|--------|---------|
| Phase 1 | 基础设施 + OAuth 认证 | ~8 | 无 |
| Phase 2 | 补丁核心（CRUD + 评论 + 资源） | ~30 | Phase 1 |
| Phase 3 | 用户模块（资料/设置/关注/签到） | ~25 | Phase 1 |
| Phase 4 | 辅助模块（消息/管理/元数据/搜索/首页） | ~35 | Phase 1 |
| Phase 5 | 实时系统 + 基础设施收尾 | ~10 | Phase 2-4 |

## 目录结构（复用 kungal 架构）

```
apps/api/
├── cmd/
│   ├── server/main.go              # 应用入口
│   └── migrate/main.go             # 数据库迁移工具
├── internal/
│   ├── app/                        # 应用初始化 + 路由注册
│   │   ├── app.go
│   │   └── router.go
│   ├── auth/                       # 认证模块
│   │   ├── dto/
│   │   ├── handler/
│   │   ├── model/
│   │   ├── repository/
│   │   └── service/
│   ├── patch/                      # 补丁核心模块（含评论、资源）
│   │   ├── dto/
│   │   ├── handler/
│   │   ├── model/
│   │   ├── repository/
│   │   └── service/
│   ├── user/                       # 用户模块（资料/设置/关注）
│   │   ├── dto/
│   │   ├── handler/
│   │   ├── model/
│   │   ├── repository/
│   │   └── service/
│   ├── message/                    # 消息通知模块
│   │   ├── dto/
│   │   ├── handler/
│   │   ├── model/
│   │   ├── repository/
│   │   └── service/
│   ├── admin/                      # 管理后台模块
│   │   ├── dto/
│   │   ├── handler/
│   │   ├── model/
│   │   ├── repository/
│   │   └── service/
│   ├── metadata/                   # 元数据模块（tag/char/company/person/release）
│   │   ├── dto/
│   │   ├── handler/
│   │   ├── model/
│   │   ├── repository/
│   │   └── service/
│   ├── common/                     # 公共端点（首页/搜索/上传/申请/外部API）
│   │   ├── home.go
│   │   ├── search/
│   │   ├── upload/
│   │   ├── apply/
│   │   └── hikari/
│   ├── chat/                       # 聊天模块（WebSocket）
│   │   ├── dto/
│   │   ├── handler/
│   │   ├── model/
│   │   ├── repository/
│   │   └── service/
│   ├── infrastructure/             # 基础设施（复用 kungal）
│   │   ├── cache/                  # Redis
│   │   ├── cron/                   # 定时任务
│   │   ├── database/              # GORM + PostgreSQL
│   │   ├── mail/                   # SMTP 邮件
│   │   ├── markdown/              # goldmark 渲染
│   │   ├── search/                # Meilisearch
│   │   └── storage/               # S3 上传
│   ├── middleware/                 # 中间件（复用 kungal）
│   │   ├── auth.go
│   │   ├── cors.go
│   │   ├── ratelimit.go
│   │   └── role.go
│   └── constants/                 # 业务常量
├── pkg/                           # 公共工具包（复用 kungal）
│   ├── config/config.go           # 环境变量配置
│   ├── errors/errors.go           # 统一错误码
│   ├── logger/logger.go           # slog 日志
│   ├── response/response.go       # 统一响应 {code, message, data}
│   └── utils/
│       ├── pagination.go          # 分页工具
│       └── validate.go            # 请求校验
├── migrations/                    # SQL 迁移文件
├── go.mod
├── go.sum
├── Makefile
└── .air.toml                      # 热重载配置
```

每个业务模块内部分层：`model → dto → repository → service → handler`

## 模块对应关系

| Go 模块 | 对应的 next-server 目录 | 说明 |
|---------|------------------------|------|
| `auth/` | `auth/` + `forgot/` | OAuth 回调、验证码、密码重置 |
| `patch/` | `patch/` + `edit/` + `upload/resource/` | 补丁 CRUD、评论、资源、分块上传 |
| `user/` | `user/` | 资料、设置、关注、签到、头像 |
| `message/` | `message/` | 通知消息 CRUD |
| `admin/` | `admin/` + `apply/` | 管理后台、创作者审批 |
| `metadata/` | `tag/` + `character/` + `company/` + `person/` + `release/` | 元数据查询/搜索 |
| `chat/` | `chat-room/` + WebSocket 事件 | 聊天室 + 实时消息 |
| `common/` | `home/` + `search/` + `comment/` + `resource/` + `galgame/` + `hikari/` + `moyu/` | 公共端点 |
