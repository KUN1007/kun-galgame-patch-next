# API 端点映射

## 路由约定变更

| 维度 | Next.js API Routes（当前） | Go Fiber（目标） |
|------|--------------------------|-----------------|
| 路由定义 | 文件 `route.ts` + export GET/POST/PUT/DELETE | `router.Get("/path", handler)` |
| 路径参数 | 查询参数 `?patchId=1` | RESTful `:id` → `c.Params("id")` |
| 查询参数 | `kunParseGetQuery(req, schema)` | `utils.ParseQueryAndValidate(c, &dto)` |
| 请求体 | `kunParsePostBody(req, schema)` | `utils.ParseAndValidate(c, &dto)` |
| 表单数据 | `kunParseFormData(req, schema)` | `c.FormFile("field")` + 手动解析 |
| 错误返回 | `NextResponse.json("错误信息")` | `response.Error(c, errors.ErrXxx())` |
| 成功返回 | `NextResponse.json(data)` | `response.OK(c, data)` |
| 认证检查 | `verifyHeaderCookie(req)` | `middleware.Auth` 中间件 |

## 响应格式变更

当前端点直接返回原始数据：
```json
[{ "id": 1, "name": "..." }]
```

Go 端统一包裹为：
```json
{
  "code": 0,
  "message": "OK",
  "data": [{ "id": 1, "name": "..." }]
}
```

错误响应：
```json
{
  "code": 40100,
  "message": "未登录",
  "data": null
}
```

## 完整端点清单

### auth 模块

#### 移除（由 OAuth 替代）

| 当前端点 | 方法 | 说明 |
|---------|------|------|
| `/api/auth/login` | POST | 密码登录 |
| `/api/auth/register` | POST | 注册 |
| `/api/auth/send-register-code` | POST | 注册验证码 |
| `/api/auth/captcha` | POST | CAPTCHA 生成/验证 |

#### 新增

| Go 端点 | 方法 | 说明 |
|---------|------|------|
| `/api/auth/oauth/callback` | POST | OAuth 回调（code + code_verifier） |
| `/api/auth/logout` | POST | 登出（清 Session + 吊销 Token） |
| `/api/auth/me` | GET | 获取当前用户（替代 GET /user/status） |

#### 保留

| 当前端点 | Go 端点 | 方法 | 说明 |
|---------|---------|------|------|
| `/api/forgot/one` | `/api/auth/forgot/send-code` | POST | 忘记密码发验证码 |
| `/api/forgot/two` | `/api/auth/forgot/reset` | POST | 验证码重置密码 |

---

### patch 模块（补丁核心）

#### 补丁 CRUD

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| `/api/edit` | `/api/patch` | POST | 必须 | 创建补丁（FormData：banner + 字段） |
| `/api/edit` | `/api/patch/:id` | PUT | 必须 | 更新补丁（仅创建者或 role>=3） |
| `/api/patch?patchId=` | `/api/patch/:id` | GET | 可选 | 获取补丁头部信息 |
| `/api/patch/detail?patchId=` | `/api/patch/:id/detail` | GET | 可选 | 获取补丁完整详情 |
| `/api/patch?patchId=` | `/api/patch/:id` | DELETE | 必须 | 删除补丁（创建者或 role>=4） |
| `/api/edit/duplicate?vndbId=` | `/api/patch/duplicate` | GET | 必须 | 检查 VNDB ID 是否已存在 |

#### 补丁评论

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| `/api/patch/comment?patchId=&page=&limit=` | `/api/patch/:id/comment` | GET | 可选 | 获取评论列表（分页） |
| `/api/patch/comment` | `/api/patch/:id/comment` | POST | 必须 | 发表评论（含 @提及检测） |
| `/api/patch/comment` | `/api/patch/comment/:commentId` | PUT | 必须 | 编辑评论（仅作者） |
| `/api/patch/comment?commentId=` | `/api/patch/comment/:commentId` | DELETE | 必须 | 删除评论（作者或管理员） |
| `/api/patch/comment/like` | `/api/patch/comment/:commentId/like` | PUT | 必须 | 切换评论点赞 |
| `/api/patch/comment/markdown?commentId=` | `/api/patch/comment/:commentId/markdown` | GET | 无 | 获取评论原始 Markdown |

#### 补丁资源

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| `/api/patch/resource?patchId=` | `/api/patch/:id/resource` | GET | 可选 | 获取资源列表（含点赞状态） |
| `/api/patch/resource` | `/api/patch/:id/resource` | POST | 必须 | 创建资源（S3 上传或外部链接） |
| `/api/patch/resource` | `/api/patch/resource/:resourceId` | PUT | 必须 | 更新资源（仅创建者） |
| `/api/patch/resource?resourceId=` | `/api/patch/resource/:resourceId` | DELETE | 必须 | 删除资源（仅创建者） |
| `/api/patch/resource/like` | `/api/patch/resource/:resourceId/like` | PUT | 必须 | 切换资源点赞 |
| `/api/patch/resource/disable?resourceId=` | `/api/patch/resource/:resourceId/disable` | PUT | 必须 | 切换资源可用状态 |
| `/api/patch/resource/download` | `/api/patch/resource/:resourceId/download` | PUT | 无 | 增加下载计数 |

#### 其他补丁端点

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| `/api/patch/like` | `/api/patch/:id/favorite` | PUT | 必须 | 切换收藏 |
| `/api/patch/views` | `/api/patch/:id/view` | PUT | 无 | 增加浏览量 |
| `/api/patch/contributor?patchId=` | `/api/patch/:id/contributor` | GET | 无 | 获取贡献者列表 |
| `/api/patch/banner` | `/api/patch/:id/banner` | POST | 必须 | 上传补丁横幅 |

#### 分块上传

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| `/api/upload/resource` | `/api/upload/chunk` | POST | 必须 | 上传单个分块 |
| - | `/api/upload/complete` | POST | 必须 | 合并分块（可合入上面的逻辑） |

---

### user 模块

#### 用户状态

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| GET `/api/user/status` | GET `/api/auth/me` | GET | 必须 | 获取当前用户状态（合入 auth） |
| POST `/api/user/status/logout` | POST `/api/auth/logout` | POST | 必须 | 登出（合入 auth） |
| GET `/api/user/status/info?id=` | GET `/api/user/:uid` | GET | 可选 | 获取用户公开信息 |
| POST `/api/user/status/check-in` | POST `/api/user/check-in` | POST | 必须 | 每日签到 |

#### 用户资料

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| GET `/api/user/profile/galgame?uid=&page=` | GET `/api/user/:uid/patch` | GET | 无 | 用户创建的补丁 |
| GET `/api/user/profile/resource?uid=&page=` | GET `/api/user/:uid/resource` | GET | 无 | 用户上传的资源 |
| GET `/api/user/profile/favorite?uid=&page=` | GET `/api/user/:uid/favorite` | GET | 无 | 用户收藏的补丁 |
| GET `/api/user/profile/comment?uid=&page=` | GET `/api/user/:uid/comment` | GET | 无 | 用户的评论 |
| GET `/api/user/profile/contribute?uid=&page=` | GET `/api/user/:uid/contribute` | GET | 无 | 用户的贡献 |
| GET `/api/user/profile/floating?uid=` | GET `/api/user/:uid/floating` | GET | 无 | 悬浮卡片信息 |

#### 用户设置

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| POST `/api/user/setting/username` | PUT `/api/user/username` | PUT | 必须 | 修改用户名（-30 萌萌点） |
| POST `/api/user/setting/avatar` | PUT `/api/user/avatar` | PUT | 必须 | 上传头像（256x256 + 100x100） |
| POST `/api/user/setting/bio` | PUT `/api/user/bio` | PUT | 必须 | 修改简介 |
| POST `/api/user/setting/password` | PUT `/api/user/password` | PUT | 必须 | 修改密码（需旧密码验证） |
| POST `/api/user/setting/email` | PUT `/api/user/email` | PUT | 必须 | 修改邮箱（需验证码） |
| POST `/api/user/setting/send-reset-email-code` | POST `/api/auth/email/send-code` | POST | 必须 | 发送邮箱修改验证码 |

#### 关注系统

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| POST `/api/user/follow/follow` | PUT `/api/user/:uid/follow` | PUT | 必须 | 关注用户 |
| POST `/api/user/follow/unfollow` | DELETE `/api/user/:uid/follow` | DELETE | 必须 | 取消关注 |
| GET `/api/user/follow/follower?uid=` | GET `/api/user/:uid/follower` | GET | 可选 | 粉丝列表 |
| GET `/api/user/follow/following?uid=` | GET `/api/user/:uid/following` | GET | 可选 | 关注列表 |

#### 其他

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| POST `/api/user/image` | POST `/api/user/image` | POST | 必须 | 上传个人页图片 |
| GET `/api/user/mention/search?query=` | GET `/api/user/search` | GET | 必须 | @提及搜索 |

---

### message 模块

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| GET `/api/message?type=&page=&limit=` | GET `/api/message` | GET | 必须 | 获取消息列表 |
| GET `/api/message/all?type=&page=` | GET `/api/message/all` | GET | 必须 | 获取所有消息 |
| GET `/api/message/unread` | GET `/api/message/unread` | GET | 必须 | 获取未读消息类型 |
| POST `/api/message` | POST `/api/message` | POST | 必须 | 创建消息 |
| PUT `/api/message/read` | PUT `/api/message/read` | PUT | 必须 | 标记已读 |

消息类型枚举：`mention`, `comment`, `likeComment`, `favorite`, `likeResource`, `patchResourceCreate`, `patchResourceUpdate`, `follow`, `apply`

---

### admin 模块

#### 评论管理

| 当前端点 | Go 端点 | 方法 | 角色 | 说明 |
|---------|---------|------|------|------|
| GET `/api/admin/comment` | GET `/api/admin/comment` | GET | >=3 | 评论列表 |
| PUT `/api/admin/comment` | PUT `/api/admin/comment/:id` | PUT | >=3 | 编辑评论 |
| DELETE `/api/admin/comment?commentId=` | DELETE `/api/admin/comment/:id` | DELETE | >=3 | 删除评论 |

#### 资源管理

| 当前端点 | Go 端点 | 方法 | 角色 | 说明 |
|---------|---------|------|------|------|
| GET `/api/admin/resource` | GET `/api/admin/resource` | GET | >=3 | 资源列表 |
| PUT `/api/admin/resource` | PUT `/api/admin/resource/:id` | PUT | >=3 | 编辑资源 |
| DELETE `/api/admin/resource?resourceId=` | DELETE `/api/admin/resource/:id` | DELETE | >=3 | 删除资源 |

#### 用户管理

| 当前端点 | Go 端点 | 方法 | 角色 | 说明 |
|---------|---------|------|------|------|
| GET `/api/admin/user` | GET `/api/admin/user` | GET | >=3 | 用户列表 |
| PUT `/api/admin/user` | PUT `/api/admin/user/:uid` | PUT | >=3 | 编辑用户 |
| DELETE `/api/admin/user?uid=` | DELETE `/api/admin/user/:uid` | DELETE | >=4 | 删除用户（永封） |

#### 创作者审批

| 当前端点 | Go 端点 | 方法 | 角色 | 说明 |
|---------|---------|------|------|------|
| GET `/api/admin/creator` | GET `/api/admin/creator` | GET | >=3 | 申请列表 |
| PUT `/api/admin/creator/approve` | PUT `/api/admin/creator/:messageId/approve` | PUT | >=3 | 批准 |
| PUT `/api/admin/creator/decline` | PUT `/api/admin/creator/:messageId/decline` | PUT | >=3 | 拒绝 |

#### 设置

| 当前端点 | Go 端点 | 方法 | 角色 | 说明 |
|---------|---------|------|------|------|
| GET `/api/admin/setting/comment` | GET `/api/admin/setting/comment-verify` | GET | >=3 | 评论验证状态 |
| PUT `/api/admin/setting/comment` | PUT `/api/admin/setting/comment-verify` | PUT | >=3 | 切换评论验证 |
| GET `/api/admin/setting/creator` | GET `/api/admin/setting/creator-only` | GET | >=3 | 仅创作者状态 |
| PUT `/api/admin/setting/creator` | PUT `/api/admin/setting/creator-only` | PUT | >=3 | 切换仅创作者 |
| GET `/api/admin/setting/register` | GET `/api/admin/setting/register` | GET | >=3 | 注册禁用状态 |
| PUT `/api/admin/setting/register` | PUT `/api/admin/setting/register` | PUT | >=3 | 切换注册禁用 |

#### 统计 + 日志

| 当前端点 | Go 端点 | 方法 | 角色 | 说明 |
|---------|---------|------|------|------|
| GET `/api/admin/stats?days=` | GET `/api/admin/stats` | GET | >=3 | 概览统计 |
| GET `/api/admin/stats/sum` | GET `/api/admin/stats/sum` | GET | >=3 | 总计统计 |
| GET `/api/admin/log` | GET `/api/admin/log` | GET | >=3 | 管理日志 |

---

### metadata 模块

#### 标签

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| GET `/api/tag?page=&limit=` | GET `/api/tag` | GET | 无 | 标签列表 |
| GET `/api/tag/all` | GET `/api/tag/all` | GET | 无 | 全部标签 |
| GET `/api/tag?tagId=` | GET `/api/tag/:id` | GET | 无 | 标签详情 |
| POST `/api/tag` | POST `/api/tag` | POST | 必须 | 创建标签 |
| GET `/api/tag/galgame?tagId=&page=` | GET `/api/tag/:id/patch` | GET | 可选 | 标签下的补丁 |
| POST `/api/tag/search` | POST `/api/tag/search` | POST | 无 | 搜索标签 |

#### ~~角色~~（已废弃，D8）

> **不迁移到 Go**。前端改为从 Galgame Wiki Service 读取角色数据。
>
> - ~~GET `/api/character?page=&limit=` → GET `/api/character`~~
> - ~~GET `/api/character?characterId=` → GET `/api/character/:id`~~
> - ~~POST `/api/character/search`~~

#### 公司

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| GET `/api/company?page=&limit=` | GET `/api/company` | GET | 无 | 公司列表 |
| GET `/api/company?companyId=` | GET `/api/company/:id` | GET | 无 | 公司详情 |
| POST `/api/company` | POST `/api/company` | POST | 必须 | 创建公司 |
| GET `/api/company/galgame?companyId=&page=` | GET `/api/company/:id/patch` | GET | 可选 | 公司下的补丁 |
| POST `/api/company/search` | POST `/api/company/search` | POST | 无 | 搜索公司 |

#### ~~人物~~（已废弃，D8）

> **不迁移到 Go**。前端改为从 Galgame Wiki Service 读取人物/声优数据。
>
> - ~~GET `/api/person?page=&limit=`~~、~~GET `/api/person/:id`~~、~~POST `/api/person/search`~~

#### ~~发售日历~~（已废弃，D8）

> **不迁移到 Go**。前端改为从 Galgame Wiki Service 查询月度发售列表。
>
> - ~~GET `/api/release?year=&month=`~~

---

### common 模块

#### 首页

| 当前端点 | Go 端点 | 方法 | 说明 |
|---------|---------|------|------|
| GET `/api/home` | GET `/api/home` | GET | 首页数据（最新补丁+资源+评论） |
| GET `/api/home/random` | GET `/api/home/random` | GET | 随机补丁 ID |

#### 搜索

| 当前端点 | Go 端点 | 方法 | 说明 |
|---------|---------|------|------|
| POST `/api/search` | POST `/api/search` | POST | 全文搜索（→ Meilisearch） |

#### 全局评论

| 当前端点 | Go 端点 | 方法 | 说明 |
|---------|---------|------|------|
| GET `/api/comment` | GET `/api/comment` | GET | 全站评论列表（排序+分页） |

#### 全局资源

| 当前端点 | Go 端点 | 方法 | 说明 |
|---------|---------|------|------|
| GET `/api/resource` | GET `/api/resource` | GET | 全站资源列表 |
| GET `/api/resource/detail?resourceId=` | GET `/api/resource/:id` | GET | 资源详情（含推荐） |

#### Galgame 列表

| 当前端点 | Go 端点 | 方法 | 说明 |
|---------|---------|------|------|
| GET `/api/galgame` | GET `/api/galgame` | GET | Galgame 列表（类型+排序+分页+年月过滤） |

#### 创作者申请

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| POST `/api/apply` | POST `/api/apply` | POST | 必须 | 申请创作者（需 >= 3 个资源） |
| GET `/api/apply/status` | GET `/api/apply/status` | GET | 必须 | 申请状态 |

#### 外部 API

| 当前端点 | Go 端点 | 方法 | 说明 |
|---------|---------|------|------|
| GET `/api/hikari?vndb_id=` | GET `/api/hikari` | GET | Hikari 外部查询（CORS 白名单） |
| GET `/api/moyu/patch/has-patch` | GET `/api/moyu/patch/has-patch` | GET | 有资源的 VNDB ID 列表 |

---

### chat 模块（REST 部分）

| 当前端点 | Go 端点 | 方法 | 认证 | 说明 |
|---------|---------|------|------|------|
| GET `/api/chat-room` | GET `/api/chat/room` | GET | 必须 | 聊天室列表 |
| POST `/api/chat-room` | POST `/api/chat/room` | POST | >=4 | 创建群聊 |
| POST `/api/chat-room/join` | POST `/api/chat/room/join` | POST | 必须 | 加入群聊 |
| GET `/api/chat-room/message?link=&cursor=&limit=` | GET `/api/chat/room/:link/message` | GET | 必须 | 获取聊天记录 |

WebSocket 端点（Socket.IO 或原生 WS）在 `06-infrastructure-migration.md` 中描述。

---

## 端点总计

| 模块 | 端点数 |
|------|--------|
| auth | 5 |
| patch（CRUD + 评论 + 资源 + 上传） | 22 |
| user（状态 + 资料 + 设置 + 关注） | 20 |
| message | 5 |
| admin（评论 + 资源 + 用户 + 审批 + 设置 + 统计） | 18 |
| metadata（tag + company，**不含 char/person/release**） | 11 |
| common（首页 + 搜索 + 评论 + 资源 + galgame + 申请 + 外部） | 10 |
| chat（REST） | 4 |
| **合计** | **~95** |

> Galgame 元数据（character / person / release）不统计在内，由 Galgame Wiki Service 独立提供。
