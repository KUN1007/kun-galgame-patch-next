# Galgame Wiki 数据分离

## 背景

Galgame Wiki 服务现在统一管理所有 galgame 元数据，包括：

- 名称（四语言：en-us、ja-jp、zh-cn、zh-tw）
- 简介（四语言）
- 标签、标签别名、标签关联
- 官方信息、官方别名、官方关联
- 引擎、引擎关联
- 系列
- 外部链接
- PR（修改请求）
- 历史记录
- 贡献者

本地 kungalgame 数据库只需保留**站点交互数据**：点赞数、收藏数、评论数、评分数、资源数、贡献者数、浏览量等。

## 变更内容

### 1. galgame 表瘦身

galgame 表移除所有元数据列，只保留 ID、计数列和时间戳：

**移除的列：**

| 列名 | 说明 |
|------|------|
| `name_en_us` | 英文名称 |
| `name_ja_jp` | 日文名称 |
| `name_zh_cn` | 简体中文名称 |
| `name_zh_tw` | 繁体中文名称 |
| `banner` | 横幅图片 |
| `intro_en_us` | 英文简介 |
| `intro_ja_jp` | 日文简介 |
| `intro_zh_cn` | 简体中文简介 |
| `intro_zh_tw` | 繁体中文简介 |
| `vndb_id` | VNDB 外部 ID |
| `content_limit` | 内容限制 |
| `original_language` | 原始语言 |
| `age_limit` | 年龄限制 |
| `series_id` | 系列 ID |
| `resource_update_time` | 资源更新时间 |
| `user_id` | 创建者用户 ID |
| `status` | 状态 |

**保留的列：**

| 列名 | 说明 |
|------|------|
| `id` | 主键 |
| `view` | 浏览量 |
| `like_count` | 点赞数 |
| `favorite_count` | 收藏数 |
| `resource_count` | 资源数 |
| `comment_count` | 评论数 |
| `contributor_count` | 贡献者数 |
| `rating_count` | 评分数 |
| `created` | 创建时间 |
| `updated` | 更新时间 |

### 2. 删除 14 张 Wiki 管理的表

以下表的数据已迁移至 Wiki 服务，从本地数据库中删除：

| 表名 | 说明 |
|------|------|
| `galgame_alias` | Galgame 别名 |
| `galgame_tag` | Galgame 标签 |
| `galgame_tag_alias` | 标签别名 |
| `galgame_tag_relation` | 标签关联 |
| `galgame_official` | 官方信息 |
| `galgame_official_alias` | 官方别名 |
| `galgame_official_relation` | 官方关联 |
| `galgame_engine` | 引擎 |
| `galgame_engine_relation` | 引擎关联 |
| `galgame_series` | 系列 |
| `galgame_link` | 外部链接 |
| `galgame_pr` | 修改请求 |
| `galgame_history` | 历史记录 |
| `galgame_contributor` | 贡献者 |

### 3. GalgameStats 模型移除

`GalgameStats` 模型已移除，计数列直接存储在 `galgame` 表上（`like_count`、`favorite_count` 等），无需单独的统计表。

## 数据获取方式变更

### Wiki 批量 API

Go API 通过 Wiki 服务的批量接口获取 galgame 元数据：

```
GET /galgame/batch?ids=1,2,3
```

返回多个 galgame 的完整元数据（名称、简介、标签、官方信息等），用于列表页、详情页、排行页、首页展示。

### 数据流

```
前端 → Go API → 本地 DB（交互数据） + Wiki API（元数据） → 合并响应 → 前端
```

- **列表/排行页**：先从本地 DB 查询 ID 列表和计数，再批量调用 Wiki API 获取元数据
- **详情页**：并行请求本地交互数据和 Wiki 元数据，合并后返回
- **首页**：从本地 DB 获取热门/最新 ID，批量获取 Wiki 元数据

## 迁移

对应迁移文件：`apps/api/migrations/005_cleanup_wiki_managed_data.up.sql`

此迁移为**不可逆操作**，执行前需确认 Wiki 服务已完成数据导入。
