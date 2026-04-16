# 后端迁移总览：Nuxt Nitro → Go Fiber + GORM

## 迁移动机

Nuxt 4 自带的 Nitro 服务端已无法支撑当前站点流量。后端将使用 Go Fiber + GORM 重写，前端保持 Nuxt 4 (apps/web)，后端代码位于 apps/api。

## 数字概览

| 维度 | 数量 |
|------|------|
| API 端点 | **194**（GET 98, POST 28, PUT 49, DELETE 19） |
| Prisma 模型 | **75** |
| 服务端工具函数 | **35 个文件** |
| WebSocket 处理 | **5 个文件** |
| 定时任务 | **2**（每日重置、每小时清理） |
| Zod 验证 Schema | **27 个文件** |
| 业务模块 | **29 个 API 子目录** |

## 技术栈映射

| 层 | Nitro (当前) | Go Fiber (目标) |
|----|-------------|----------------|
| HTTP 框架 | Nitro (defineEventHandler) | Fiber v2 |
| ORM | Prisma 7 | GORM |
| 验证 | Zod | go-playground/validator |
| 缓存 | unstorage + redis driver | go-redis/v9 |
| 认证 | 自签 JWT 双 Token | KUN OAuth + Redis Session |
| WebSocket | Socket.IO | Fiber WebSocket / go-socket.io |
| 定时任务 | Nitro scheduledTasks | robfig/cron |
| Markdown | remark/rehype + 6 自定义插件 | goldmark + 自定义扩展 |
| 邮件 | Nodemailer | net/smtp |
| S3 | @aws-sdk/client-s3 | aws-sdk-go-v2 |
| CDN 缓存清除 | Cloudflare API (fetch) | Cloudflare API (net/http) |
| 搜索 | Prisma ILIKE + hasSome | Meilisearch |
| 日志 | console | log/slog |

## 迁移分阶段计划

| 阶段 | 内容 | 端点数 | 前置条件 |
|------|------|--------|---------|
| Phase 1 | 基础设施 + OAuth 认证 | ~10 | 无 |
| Phase 2 | Galgame 核心 | ~55 | Phase 1 |
| Phase 3 | 论坛 (Topic) | ~35 | Phase 1 |
| Phase 4 | 辅助模块 (消息/工具集/网站/文档/管理等) | ~80 | Phase 1 |
| Phase 5 | 基础设施收尾 (定时任务/RSS/搜索等) | ~15 | Phase 2-4 |

## 目录结构

```
apps/api/
├── cmd/
│   ├── server/main.go
│   └── migrate/main.go
├── internal/
│   ├── app/                 # 应用初始化 + 路由注册
│   ├── infrastructure/      # 数据库/Redis/S3/邮件/搜索
│   ├── middleware/           # 认证/角色/CORS
│   ├── user/                # 用户 + OAuth
│   ├── galgame/             # Galgame 核心
│   ├── topic/               # 论坛话题
│   ├── message/             # 消息 + 聊天
│   ├── website/             # 网站收录
│   ├── toolset/             # 工具集
│   ├── doc/                 # 文档系统
│   ├── admin/               # 管理后台
│   └── common/              # 搜索/排行/RSS/举报/上传
├── pkg/
│   ├── config/              # 环境变量
│   ├── errors/              # 统一错误 (205/233)
│   ├── logger/              # slog 日志
│   ├── response/            # 统一响应 {code, message, data}
│   └── utils/               # 验证/分页
└── migrations/              # SQL 迁移文件
```

每个业务模块内部分层：`model → dto → repository → service → handler`
