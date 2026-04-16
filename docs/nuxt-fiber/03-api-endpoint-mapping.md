# API 端点映射

## 路由约定变更

| 维度 | Nitro | Go Fiber |
|------|-------|----------|
| 路由定义 | 文件名 `index.get.ts` | `router.Get("/path", handler)` |
| 路径参数 | `[gid]` → `event.context.params.gid` | `:gid` → `c.Params("gid")` |
| 查询参数 | `kunParseGetQuery(event, schema)` | `utils.ParseQueryAndValidate(c, &dto)` |
| 请求体 | `kunParsePostBody(event, schema)` | `utils.ParseAndValidate(c, &dto)` |
| 错误返回 | `kunError(event, msg, 205)` | `response.Error(c, errors.ErrAuthExpired())` |
| 成功返回 | `return data` | `response.OK(c, data)` |
| 认证检查 | `getCookieTokenInfo(event)` | `middleware.MustGetUser(c)` |

## 响应格式变更

当前 Nitro 端点直接返回数据（无包裹）：
```json
[{ "id": 1, "name": "..." }]
```

Go 端统一为：
```json
{
  "code": 0,
  "message": "成功",
  "data": [{ "id": 1, "name": "..." }]
}
```

前端 `responseHandler.ts` 需适配新格式。

## 完整端点清单

### auth（4 个端点 → 3 个）

| 当前 | Go 目标 | 说明 |
|------|---------|------|
| POST /api/auth/login | 移除 | 改为 OAuth |
| POST /api/auth/register | 移除 | 改为 OAuth |
| POST /api/auth/email/send-code | POST /api/auth/email/send-code | 保留（邮件验证码） |
| POST /api/auth/email/verify | POST /api/auth/email/verify | 保留（验证码校验） |
| - | POST /api/auth/oauth/callback | 新增（OAuth 回调） |
| - | POST /api/auth/logout | 新增（清除 Session） |
| - | GET /api/auth/me | 新增（获取当前用户） |

### user（20 个端点）

| 当前 | Go 目标 |
|------|---------|
| GET /api/user/:uid | GET /api/user/:uid |
| GET /api/user/:uid/galgames | GET /api/user/:uid/galgames |
| GET /api/user/:uid/topics | GET /api/user/:uid/topics |
| GET /api/user/:uid/replies | GET /api/user/:uid/replies |
| GET /api/user/:uid/comments | GET /api/user/:uid/comments |
| GET /api/user/:uid/followers | GET /api/user/:uid/followers |
| GET /api/user/:uid/following | GET /api/user/:uid/following |
| PUT /api/user/:uid/avatar | PUT /api/user/:uid/avatar |
| PUT /api/user/:uid/bio | PUT /api/user/:uid/bio |
| PUT /api/user/:uid/follow | PUT /api/user/:uid/follow |
| PUT /api/user/email | PUT /api/user/email |
| PUT /api/user/password | 移除（OAuth 管理） |
| POST /api/user/check-in | POST /api/user/check-in |
| DELETE /api/user/:uid | DELETE /api/user/:uid |
| ... | ... |

### galgame（27 个端点）

| HTTP | 路径 | 说明 |
|------|------|------|
| GET | /api/galgame | 列表（分页+筛选） |
| GET | /api/galgame/:gid | 详情 |
| POST | /api/galgame | 创建 |
| PUT | /api/galgame/:gid | 更新 |
| PUT | /api/galgame/:gid/like | 点赞/取消 |
| PUT | /api/galgame/:gid/favorite | 收藏/取消 |
| GET | /api/galgame/:gid/comment | 评论列表 |
| POST | /api/galgame/:gid/comment | 发表评论 |
| PUT | /api/galgame/:gid/comment/like | 评论点赞 |
| DELETE | /api/galgame/:gid/comment | 删除评论 |
| GET | /api/galgame/:gid/resource | 资源列表 |
| POST | /api/galgame/:gid/resource | 添加资源 |
| PUT | /api/galgame/:gid/resource | 编辑资源 |
| PUT | /api/galgame/:gid/resource/like | 资源点赞 |
| GET | /api/galgame/:gid/pr | PR 列表 |
| POST | /api/galgame/:gid/pr | 提交 PR |
| PUT | /api/galgame/:gid/pr/merge | 合并 PR |
| PUT | /api/galgame/:gid/pr/decline | 拒绝 PR |
| GET | /api/galgame/:gid/history | 编辑历史 |
| GET | /api/galgame/:gid/link | 外部链接 |
| POST | /api/galgame/:gid/link | 添加链接 |
| DELETE | /api/galgame/:gid/link | 删除链接 |
| PUT | /api/galgame/:gid/contributor | 贡献者 |
| ... | ... | ... |

### topic（27 个端点）

| HTTP | 路径 | 说明 |
|------|------|------|
| GET | /api/topic | 列表 |
| GET | /api/topic/:tid | 详情 |
| POST | /api/topic | 创建话题 |
| PUT | /api/topic/:tid | 编辑话题 |
| DELETE | /api/topic/:tid | 删除话题 |
| PUT | /api/topic/:tid/like | 点赞 |
| PUT | /api/topic/:tid/dislike | 踩 |
| PUT | /api/topic/:tid/upvote | 推话题 |
| PUT | /api/topic/:tid/favorite | 收藏 |
| PUT | /api/topic/:tid/status | 修改状态 |
| GET | /api/topic/:tid/reply | 回复列表 |
| POST | /api/topic/:tid/reply | 发表回复 |
| PUT | /api/topic/:tid/reply | 编辑回复 |
| DELETE | /api/topic/:tid/reply | 删除回复 |
| PUT | /api/topic/:tid/reply/like | 回复点赞 |
| PUT | /api/topic/:tid/reply/dislike | 回复踩 |
| PUT | /api/topic/:tid/best-answer | 设置最佳回答 |
| PUT | /api/topic/:tid/pin-reply | 置顶回复 |
| POST | /api/topic/:tid/comment | 发表评论 |
| PUT | /api/topic/:tid/comment/like | 评论点赞 |
| DELETE | /api/topic/:tid/comment | 删除评论 |
| POST | /api/topic/:tid/poll | 创建投票 |
| PUT | /api/topic/:tid/poll/vote | 投票 |
| GET | /api/topic/:tid/poll | 获取投票 |
| ... | ... | ... |

### 其他模块

| 模块 | 端点数 | 说明 |
|------|--------|------|
| galgame-rating | 9 | 评分 CRUD + 评论 |
| galgame-series | 7 | 系列管理 |
| galgame-tag | 5 | 标签搜索/管理 |
| galgame-engine | 3 | 引擎搜索/管理 |
| galgame-official | 4 | 开发商搜索/管理 |
| galgame-resource | 4 | 资源浏览 |
| toolset | 19 | 工具集完整 CRUD |
| website | 10 | 网站收录 CRUD |
| website-category | 2 | 网站分类 |
| website-tag | 5 | 网站标签 |
| message | 8 | 通知消息 |
| doc | 13 | 文档系统 CRUD |
| admin | 6 | 管理后台 |
| ranking | 3 | 排行榜 |
| search | 1 | 搜索（改为 Meilisearch） |
| home | 1 | 首页数据聚合 |
| activity | 2 | 活动流 |
| section | 1 | 板块 |
| category | 1 | 分类 |
| report | 1 | 举报 |
| rss | 2 | RSS 订阅 |
| unmoe | 1 | Unmoe 翻译器 |
| update | 6 | 更新日志 |
| image | 1 | 图片上传 |
| resource | 1 | 资源首页 |
