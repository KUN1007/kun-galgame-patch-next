# Galgame Wiki API 参考

基础路径：`/api`

| 环境 | Base URL |
|------|----------|
| 开发 | `http://127.0.0.1:9280/api` |
| 生产 | `https://galgame.kungal.com/api` |

## 响应格式

```json
{
  "code": 0,
  "message": "成功",
  "data": { ... }
}
```

分页响应的 `data` 结构：

```json
{
  "items": [...],
  "total": 42
}
```

## 认证

- **读操作（GET）**：无需认证
- **写操作（POST/PUT/DELETE）**：需要 OAuth Bearer Token

```
Authorization: Bearer <access_token>
```

access_token 由 KUN OAuth 系统签发，JWT claims 中包含 `uid`（integer user ID）和 `roles`。

---

## Galgame 核心 CRUD

### GET /galgame

列表（分页 + 搜索 + 排序）。

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | int | 否 | 1 | 页码 |
| limit | int | 否 | 24 | 每页数量 (1-50) |
| sort_field | string | 否 | created | 排序字段: `created`, `updated`, `view`, `resource_update_time` |
| sort_order | string | 否 | desc | 排序方向: `asc`, `desc` |
| search | string | 否 | | 搜索关键词（匹配四语言名称） |

**成功响应**：

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "items": [
      {
        "id": 1,
        "vndb_id": "v12345",
        "name_en_us": "Title",
        "name_ja_jp": "タイトル",
        "name_zh_cn": "标题",
        "name_zh_tw": "標題",
        "banner": "https://...",
        "content_limit": "sfw",
        "view": 100,
        "created": "2026-01-01T00:00:00Z",
        "tag": [...],
        "official": [...]
      }
    ],
    "total": 42
  }
}
```

---

### GET /galgame/batch

批量获取 galgame 轻量信息（跨服务展示用，不加载关联数据）。

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | int[] | 是 | galgame ID 数组，最多 100 个 |

**请求示例**：`GET /galgame/batch?ids=1,2,3`

**成功响应**：

```json
{
  "code": 0,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "vndb_id": "v12345",
      "name_en_us": "Title",
      "name_ja_jp": "タイトル",
      "name_zh_cn": "标题",
      "name_zh_tw": "標題",
      "banner": "https://image.kungal.com/...",
      "content_limit": "sfw",
      "user_id": 1,
      "resource_update_time": "2026-01-01T00:00:00Z",
      "original_language": "ja-jp",
      "age_limit": "all"
    }
  ]
}
```

不存在或已封禁的 ID 会被过滤，不会报错。返回数组长度可能小于请求的 ID 数量。

---

### GET /galgame/user/:uid/stats

获取用户的 Galgame 统计数据。

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| uid | int | 用户 ID |

**成功响应**：

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "galgame_created": 10,
    "galgame_created_today": 1,
    "galgame_contributed": 15,
    "revision_count": 42,
    "pr_submitted": 5,
    "pr_merged": 3,
    "pr_declined": 1,
    "pr_pending": 1
  }
}
```

| 字段 | 说明 |
|------|------|
| galgame_created | 用户创建的 galgame 总数（不含被封禁的） |
| galgame_created_today | 用户今日创建的 galgame 数量 |
| galgame_contributed | 用户参与贡献的 galgame 数量（含创建和编辑） |
| revision_count | 用户产生的版本记录总数 |
| pr_submitted | 用户提交的 PR 总数 |
| pr_merged | 已合并的 PR 数量 |
| pr_declined | 已拒绝的 PR 数量 |
| pr_pending | 待处理的 PR 数量 |

用户不存在时返回全零数据，不报错。

---

### GET /galgame/check

检查 VNDB ID 是否已存在。

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| vndb_id | string | 是 | VNDB ID (如 `v12345`) |

**成功响应**：

```json
{
  "code": 0,
  "data": {
    "exists": true,
    "galgame_id": 1
  }
}
```

---

### GET /galgame/:gid

获取详情（含全部关联数据 + 用户信息）。

**成功响应**：

```json
{
  "code": 0,
  "data": {
    "galgame": {
      "id": 1,
      "vndb_id": "v12345",
      "name_en_us": "...",
      "name_ja_jp": "...",
      "name_zh_cn": "...",
      "name_zh_tw": "...",
      "banner": "...",
      "intro_en_us": "...",
      "intro_ja_jp": "...",
      "intro_zh_cn": "...",
      "intro_zh_tw": "...",
      "content_limit": "sfw",
      "original_language": "ja-jp",
      "age_limit": "r18",
      "view": 100,
      "user_id": 1,
      "series_id": null,
      "alias": [{"id": 1, "name": "别名"}],
      "tag": [{"galgame_id": 1, "tag_id": 2, "spoiler_level": 0, "tag": {"id": 2, "name": "RPG"}}],
      "official": [{"galgame_id": 1, "official_id": 3, "official": {"id": 3, "name": "开发商"}}],
      "engine": [...],
      "link": [{"id": 1, "name": "VNDB", "link": "https://vndb.org/v12345"}],
      "contributor": [{"id": 1, "user_id": 1}],
      "created": "...",
      "updated": "..."
    },
    "users": {
      "1": {"id": 1, "name": "KUN", "avatar": "https://..."}
    }
  }
}
```

`users` 是一个 user_id → 用户信息的 map，包含 galgame 创建者和所有贡献者的信息。

---

### POST /galgame

创建 Galgame。**需要认证**。

创建时自动：创建 revision 1、添加创建者为贡献者、添加 VNDB 链接。

**请求体**：

```json
{
  "vndb_id": "v12345",
  "name_en_us": "Title",
  "name_ja_jp": "タイトル",
  "name_zh_cn": "标题",
  "name_zh_tw": "標題",
  "banner": "https://...",
  "intro_en_us": "...",
  "intro_ja_jp": "...",
  "intro_zh_cn": "...",
  "intro_zh_tw": "...",
  "content_limit": "sfw",
  "original_language": "ja-jp",
  "age_limit": "r18",
  "series_id": null,
  "aliases": "别名1,别名2",
  "tag_ids": [1, 2, 3],
  "official_ids": [1],
  "engine_ids": [1]
}
```

| 字段 | 必填 | 说明 |
|------|------|------|
| vndb_id | 是 | 格式 `v\d+`，必须唯一 |
| aliases | 否 | 逗号分隔的别名字符串 |
| tag_ids | 否 | 标签 ID 数组 |
| official_ids | 否 | 开发商 ID 数组 |
| engine_ids | 否 | 引擎 ID 数组 |
| content_limit | 否 | `sfw` (默认) 或 `nsfw` |
| age_limit | 否 | `r18` (默认) 或 `all` |

---

### PUT /galgame/:gid

更新 Galgame。**需要认证**。仅创建者或 admin 可操作。

每次更新自动创建新 revision。

**请求体**（所有字段可选）：

```json
{
  "name_zh_cn": "新标题",
  "intro_zh_cn": "新简介",
  "is_minor": false
}
```

`is_minor` 为 `true` 时标记为小修改，在版本历史中可被过滤。

---

## 版本历史 (Wiki)

每次编辑（创建、更新、PR 合并、回滚）都会创建一个 revision，存储 galgame 的完整状态快照。

### GET /galgame/:gid/revisions

版本列表。

**查询参数**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| limit | int | 20 | 每页数量 |
| include_minor | bool | false | 是否包含小修改 |

**成功响应**：

```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": 3,
        "galgame_id": 1,
        "revision": 3,
        "user_id": 2,
        "action": "merged",
        "note": "更新简介",
        "is_minor": false,
        "reverted_to": null,
        "created": "2026-01-03T00:00:00Z"
      },
      {
        "id": 2,
        "revision": 2,
        "action": "updated",
        "note": "",
        "is_minor": true
      },
      {
        "id": 1,
        "revision": 1,
        "action": "created",
        "note": ""
      }
    ],
    "total": 3
  }
}
```

`action` 取值：`created`, `updated`, `merged`, `reverted`, `declined`

---

### GET /galgame/:gid/revisions/:rev

查看特定版本的完整快照。

**成功响应**：

```json
{
  "code": 0,
  "data": {
    "id": 1,
    "galgame_id": 1,
    "revision": 1,
    "user_id": 1,
    "action": "created",
    "snapshot": {
      "vndb_id": "v12345",
      "name_zh_cn": "标题",
      "aliases": ["别名1"],
      "tag_ids": [1, 2],
      "official_ids": [1],
      "engine_ids": [],
      "links": [{"name": "VNDB", "link": "https://vndb.org/v12345"}]
    },
    "created": "..."
  }
}
```

---

### GET /galgame/:gid/revisions/:rev/diff

计算该版本与前一版本的差异（实时计算，不存储）。

**成功响应**：

```json
{
  "code": 0,
  "data": {
    "changed_keys": {
      "name_zh_cn": true,
      "tag_ids": true
    },
    "old": {
      "name_zh_cn": "旧标题",
      "tag_ids": [1, 2]
    },
    "new": {
      "name_zh_cn": "新标题",
      "tag_ids": [1, 2, 3]
    }
  }
}
```

`old` 和 `new` 是完整的 snapshot 对象，前端可以只展示 `changed_keys` 中标记的字段。对于大文本字段（intro_*），前端可以用 diff 库展示行级差异。

---

### POST /galgame/:gid/revert

回滚到指定版本。**需要认证**。仅创建者或 admin 可操作。

回滚会创建一个新 revision（action=reverted），不会删除历史记录。

**请求体**：

```json
{
  "revision": 1
}
```

---

## PR (编辑请求)

非创建者/非 admin 通过 PR 提交编辑。PR 支持字段级自动 rebase。

### GET /galgame/:gid/prs

PR 列表。

**查询参数**：

| 参数 | 类型 | 默认值 |
|------|------|--------|
| page | int | 1 |
| limit | int | 20 |

---

### GET /galgame/:gid/prs/:id

PR 详情，包含与 base revision 的差异。

**成功响应**：

```json
{
  "code": 0,
  "data": {
    "pr": {
      "id": 1,
      "galgame_id": 1,
      "user_id": 2,
      "status": 0,
      "note": "修改标题",
      "base_revision": 1,
      "snapshot": { ... },
      "completed_by": null,
      "revision_id": null,
      "created": "..."
    },
    "changed_keys": {
      "name_zh_cn": true
    }
  }
}
```

`status`：`0` = pending, `1` = merged, `2` = declined

---

### POST /galgame/:gid/prs

提交 PR。**需要认证**。

提交时只需提供要修改的字段，未提供的字段保持当前值。

**请求体**：

```json
{
  "name_zh_cn": "新标题",
  "tag_ids": [1, 2, 3],
  "note": "修改标题和标签"
}
```

支持的字段与创建/更新 galgame 相同，另外支持：

| 字段 | 类型 | 说明 |
|------|------|------|
| aliases | string[] | 别名数组（替换全部） |
| tag_ids | int[] | 标签 ID 数组（替换全部） |
| official_ids | int[] | 开发商 ID 数组（替换全部） |
| engine_ids | int[] | 引擎 ID 数组（替换全部） |
| links | object[] | 链接数组 `[{name, link}]`（替换全部） |
| note | string | PR 说明 |

---

### PUT /galgame/:gid/prs/:id/merge

合并 PR。**需要认证**。仅 galgame 创建者或 admin 可操作。

合并时如果 PR 的 base_revision 落后于最新版本，系统会自动检查字段冲突：
- **无冲突**：自动 rebase（PR 的改动应用到最新版本上）
- **有冲突**：返回错误，列出冲突字段名

**冲突响应示例**：

```json
{
  "code": 10,
  "message": "字段冲突: name_zh_cn 已被其他编辑修改，请基于最新版本重新提交"
}
```

---

### PUT /galgame/:gid/prs/:id/decline

拒绝 PR。**需要认证**。仅 galgame 创建者或 admin 可操作。

---

## 链接

### GET /galgame/:gid/links

链接列表。

### POST /galgame/:gid/links

添加链接。**需要认证**。自动创建 revision。

```json
{
  "name": "官网",
  "link": "https://example.com"
}
```

### DELETE /galgame/:gid/links

删除链接。**需要认证**。自动创建 revision。

```json
{
  "id": 1
}
```

---

## 别名

### GET /galgame/:gid/aliases

别名列表。

### POST /galgame/:gid/aliases

添加别名。**需要认证**。自动创建 revision。

```json
{
  "name": "新别名"
}
```

### DELETE /galgame/:gid/aliases

删除别名。**需要认证**。自动创建 revision。

```json
{
  "id": 1
}
```

---

## 贡献者

### GET /galgame/:gid/contributors

贡献者列表（含用户信息）。

**成功响应**：

```json
{
  "code": 0,
  "data": [
    {
      "id": 1,
      "galgame_id": 1,
      "user_id": 1,
      "created": "...",
      "user": {
        "id": 1,
        "name": "KUN",
        "avatar": "https://..."
      }
    }
  ]
}
```

### DELETE /galgame/:gid/contributors/:uid

删除贡献者。**需要认证**。仅 galgame 创建者或 admin 可操作。

---

## 标签 (Tag)

### GET /tag

标签列表（分页，按关联 galgame 数量排序）。

**查询参数**：`page`, `limit`

### GET /tag/search

搜索标签。**由 Meilisearch 驱动**，替代原 DB LIKE 实现。详见 [搜索 (Search)](#搜索-search) 章节。

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| q | string | `""` | 搜索词；空时按 `galgame_count` 倒序返回热门 tag |
| category | string | — | `content` / `sexual` / `technical` |
| limit | int | 50 | max 100 |

**响应**：
```json
{
  "items": [
    { "id": 45, "name": "校园", "aliases": ["学园"], "category": "content", "galgame_count": 850 }
  ],
  "total": 1,
  "processing_time_ms": 4
}
```

### GET /tag/multi?tag_ids=1,2,3

多标签筛选，返回同时拥有所有指定标签的 galgame。

**查询参数**：`page`, `limit`, `tag_ids`（数组）

### GET /tag/:name

标签详情 + 关联的 galgame 列表。

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tag_id | int | 是 | tag 主键 |
| page | int | 否 | 页码 |
| limit | int | 否 | 每页数量 |
| sort_field | string | 否 | `created` / `resource_update_time` / `view` |
| sort_order | string | 否 | `asc` / `desc` |
| content_limit | string | 否 | `sfw` / `nsfw` —— 仅返回对应分级 galgame，`total` 同步反映过滤后数量 |

### PUT /tag

更新标签。**需要认证（admin/moderator）**。

```json
{
  "tag_id": 1,
  "name": "新名称",
  "category": "content",
  "description": "描述",
  "alias": ["别名1", "别名2"]
}
```

事务内替换全部别名。

---

## 开发商 (Official)

### GET /official

开发商列表。**查询参数**：`page`, `limit`

### GET /official/search

搜索会社。**由 Meilisearch 驱动**，详见 [搜索 (Search)](#搜索-search)。

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| q | string | `""` | 搜索词；空时按 `galgame_count` 倒序 |
| category | string | — | `company` / `individual` / `amateur` |
| lang | string | — | 按主语言过滤（`ja`, `en`, `zh-Hans` 等） |
| limit | int | 50 | max 100 |

### GET /official/:name

详情 + 关联 galgame。

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| official_id | int | 是 | official 主键 |
| page | int | 否 | 页码 |
| limit | int | 否 | 每页数量 |
| sort_field | string | 否 | `created` / `resource_update_time` / `view` |
| sort_order | string | 否 | `asc` / `desc` |
| content_limit | string | 否 | `sfw` / `nsfw`，只返回对应分级 galgame，`total` 同步反映过滤后数量 |

### PUT /official

更新。**需要认证（admin/moderator）**。

```json
{
  "official_id": 1,
  "name": "新名称",
  "link": "https://...",
  "category": "company",
  "lang": "ja",
  "description": "描述",
  "alias": ["别名1"]
}
```

---

## 引擎 (Engine)

### GET /engine

全量列表（数据量小，不分页）。

### GET /engine/:name

详情 + 关联 galgame。

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| engine_id | int | 是 | engine 主键 |
| page | int | 否 | 页码 |
| limit | int | 否 | 每页数量 |
| content_limit | string | 否 | `sfw` / `nsfw`，只返回对应分级 galgame，`total` 同步反映过滤后数量 |

### PUT /engine

更新。**需要认证（admin/moderator）**。

```json
{
  "engine_id": 1,
  "name": "新名称",
  "description": "描述",
  "alias": ["别名1"]
}
```

引擎的 `alias` 以 JSONB 数组存储（与 tag/official 的关联表不同）。

---

## 系列 (Series)

### GET /series

系列列表（含前 5 个 galgame 预览）。**查询参数**：`page`, `limit`

### GET /series/search?keywords=xxx

搜索 galgame（按名称、VNDB ID、标签、别名），用于系列分配。

返回最多 20 条。

### GET /series/:id

系列详情 + 全部 galgame。

### POST /series

创建系列。**需要认证**。

```json
{
  "name": "系列名",
  "description": "描述",
  "galgame_ids": [1, 2, 3]
}
```

### POST /series/modal

按 ID 批量获取 galgame（模态框用）。**需要认证**。

```json
{
  "ids": [1, 2, 3]
}
```

返回结果按输入 ID 顺序排列。

### PUT /series/:id

更新系列。**需要认证**。

```json
{
  "name": "新名称",
  "galgame_ids": [1, 2, 4]
}
```

`galgame_ids` 会**替换**系列中的所有 galgame。

### DELETE /series/:id

删除系列。**需要认证（admin/moderator）**。关联的 galgame 的 `series_id` 会被置为 `null`。

---

## 搜索 (Search)

由 **Meilisearch** 驱动的搜索，对应 3 个 index：

| Index uid | 对应实体 | 文档数级别 |
|-----------|---------|-----------|
| `galgames` | Galgame | ~60k |
| `galgame_tags` | Tag | ~3k |
| `galgame_officials` | Official | ~22k |

`/tag/search` 和 `/official/search` 也走这套 —— 本节的能力（typo 容错、高亮、facet 聚合、CJK 分词）对它们同样适用。

**共同特性**：
- CJK 分词由 Meilisearch Charabia 原生支持（中/日/英/繁中混合友好）
- Typo 容错：4 字以上 1 个 typo，8 字以上 2 个 typo；`vndb_id` 禁用 typo（必须精确）
- 响应时间通常 <20ms
- 所有 GET，**无需认证**

### GET /galgame/search

Galgame 全文搜索 + 多条件过滤。

**查询参数**：

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| q | string | `""` | 搜索词；空时仅按 filter 返回 |
| status | int (csv) | — | 不传即不过滤；可传 `0` / `0,1,2` 等 |
| content_limit | `sfw` \| `nsfw` | — | 可选 |
| age_limit | `all` \| `r18` | — | 可选 |
| original_language | string (csv) | — | `ja-jp,en-us` 等；逗号分隔 OR |
| tag_ids | int (csv) | — | AND：galgame 必须同时命中所有 tag |
| official_ids | int (csv) | — | 同上 |
| engine_ids | int (csv) | — | 同上 |
| series_id | int | — | 精确 |
| released_from | int | — | 年（含）|
| released_to | int | — | 年（含）|
| include_intro | bool | `false` | `true` 时把 `intro_*` 四语言简介也纳入搜索 |
| sort | string | `relevance` | `relevance` / `released_desc` / `released_asc` / `view` / `updated` |
| page | int | 1 | 1-based |
| limit | int | 24 | max 100 |
| facets | bool | `true` | 是否返回 facet 聚合（`age_limit`, `original_language`）|
| highlight | bool | `true` | 是否返回高亮片段 |

**响应示例**：

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "items": [
      {
        "id": 1142,
        "vndb_id": "v30132",
        "name_zh_cn": "...",
        "name_ja_jp": "...",
        "name_en_us": "Fate/Empire of Dirt",
        "banner": "https://...",
        "status": 0,
        "content_limit": "sfw",
        "age_limit": "r18",
        "original_language": "ja-jp",
        "released": "2020-05",
        "tag_ids": [1, 2, 5],
        "official_ids": [7],
        "_formatted": {
          "name_en_us": "<mark>Fate</mark>/Empire of Dirt"
        }
      }
    ],
    "total": 182,
    "facets": {
      "age_limit": {"all": 1, "r18": 181},
      "original_language": {"ja-jp": 61, "en-us": 101, "zh-cn": 7}
    },
    "processing_time_ms": 2
  }
}
```

**行为说明**：
- `tag_ids / official_ids / engine_ids`：多值 **AND**（必须同时命中）
- `status / original_language`：多值 **OR**
- `q` 空 + 无 `sort`：返回 `updated_ts` 倒序的近期条目
- `q` 非空 + 无 `sort`：按相关度排序，相同分时 `view` 倒序
- `include_intro=true` 会把简介纳入搜索，召回扩大但可能引入噪声（简介里随口提到某个词的 VN 也会被命中）
- highlight 片段字段包含 `_formatted`，仅在命中的字段上出现

### GET /tag/search

见上方 [标签 (Tag)](#标签-tag) 章节的 `/tag/search`。

### GET /official/search

见上方 [开发商 (Official)](#开发商-official) 章节的 `/official/search`。

---

## 管理统计 (Admin)

### GET /admin/stats

Wiki 管理统计接口，返回各实体的总量和每日新增计数。

**查询参数**：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| days | int | 否 | 30 | 查询最近 N 天 (1-365) |

**成功响应**：

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "totals": {
      "galgame_tag": 1234,
      "galgame_official": 567,
      "galgame_engine": 89,
      "galgame_series": 234,
      "galgame_link": 4567,
      "galgame_pr": 123,
      "galgame_revision": 890
    },
    "daily": [
      {
        "date": "2026-04-10",
        "galgame_tag": 3,
        "galgame_official": 1,
        "galgame_engine": 0,
        "galgame_series": 2,
        "galgame_link": 15,
        "galgame_pr": 4,
        "galgame_revision": 12
      }
    ]
  }
}
```

| 字段 | 说明 |
|------|------|
| totals | 各表全量 COUNT |
| daily | 按日期升序排列，每天一行，没有数据的日期不返回 |
| date | 格式 YYYY-MM-DD，与 `date_trunc('day', created)::date::text` 一致 |

统计的 7 个维度：

| 字段 key | 对应表 |
|----------|--------|
| galgame_tag | galgame_tag |
| galgame_official | galgame_official |
| galgame_engine | galgame_engine |
| galgame_series | galgame_series |
| galgame_link | galgame_link |
| galgame_pr | galgame_pr |
| galgame_revision | galgame_revision |

### GET /admin/galgame

管理视角的 galgame 列表（**可跨 status 查询**，区别于公开的 `/galgame` 只返回 `status=0`）。**需要认证**。

**查询参数**：

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| status | int | — | 不传即不过滤；可传 `0`（已发布）/ `1`（封禁）/ `2`（草稿）|
| search | string | — | ILIKE 匹配 vndb_id + 4 语言 name |
| page | int | 1 | |
| limit | int | 20 | max 100 |

**响应**：`{ items: [...galgame], total: int }`

### GET /admin/galgame/:gid

管理视角的 galgame 详情（任意 status，preload 全部关联）。**需要认证**。返回 `Galgame` 对象含 `Alias`, `Tag.Tag`, `Official.Official`, `Engine.Engine`, `Series`。

### PUT /admin/galgame/:gid/status

修改 galgame 状态（发布 / 封禁 / 撤回草稿）。**需要认证**。

**请求体**：

```json
{ "status": 0 }   // 0 已发布 | 1 封禁 | 2 草稿
```

---

## 错误码

### Galgame (20xxx)

| Code | 消息 | 说明 |
|------|------|------|
| 20001 | Galgame 不存在 | ID 不存在或已被封禁 |
| 20002 | Galgame 已存在 | — |
| 20003 | 无效的 VNDB ID | 格式不匹配 `v\d+` |
| 20004 | 该 VNDB ID 的 Galgame 已存在 | VNDB ID 重复 |
| 20005 | 无权操作此 Galgame | 非创建者且非 admin |

### 通用

| Code | 消息 |
|------|------|
| 1 | 请求格式错误 |
| 2 | 无效的 ID |
| 4 | 资源不存在 |
| 5 | 访问被拒绝 |
| 7 | 参数验证失败 |
| 10 | 操作失败 |
| 10001 | 未授权 |
| 10002 | 无效的令牌 |
| 10003 | 令牌已过期 |

---

## 端点总览

| 模块 | 方法 | 路径 | 认证 | 数量 |
|------|------|------|------|------|
| **Galgame** | GET | `/galgame`, `/galgame/search`, `/galgame/batch`, `/galgame/check`, `/galgame/user/:uid/stats`, `/galgame/:gid` | 公开 | 6 |
| | POST/PUT | `/galgame`, `/galgame/:gid` | Bearer | 2 |
| **Revision** | GET | `/galgame/:gid/revisions`, `.../:rev`, `.../:rev/diff` | 公开 | 3 |
| | POST | `/galgame/:gid/revert` | Bearer | 1 |
| **PR** | GET | `/galgame/:gid/prs`, `.../:id` | 公开 | 2 |
| | POST/PUT | `/galgame/:gid/prs`, `.../merge`, `.../decline` | Bearer | 3 |
| **Link** | GET/POST/DELETE | `/galgame/:gid/links` | 读公开，写Bearer | 3 |
| **Alias** | GET/POST/DELETE | `/galgame/:gid/aliases` | 读公开，写Bearer | 3 |
| **Contributor** | GET/DELETE | `/galgame/:gid/contributors` | 读公开，删Bearer | 2 |
| **Tag** | GET | `/tag`, `/tag/search` (MS), `/tag/multi`, `/tag/:name` | 公开 | 4 |
| | PUT | `/tag` | admin/mod | 1 |
| **Official** | GET | `/official`, `/official/search` (MS), `/official/:name` | 公开 | 3 |
| | PUT | `/official` | admin/mod | 1 |
| **Engine** | GET | `/engine`, `/engine/:name` | 公开 | 2 |
| | PUT | `/engine` | admin/mod | 1 |
| **Series** | GET | `/series`, `/series/search`, `/series/:id` | 公开 | 3 |
| | POST/PUT/DELETE | `/series`, `/series/modal`, `/series/:id` | Bearer/admin | 4 |
| **Admin** | GET | `/admin/stats`, `/admin/galgame`, `/admin/galgame/:gid` | Bearer | 3 |
| | PUT | `/admin/galgame/:gid/status` | Bearer | 1 |
| | | | **总计** | **54** |

> **标注 (MS) = Meilisearch 驱动**；其余 search 端点（如 `/series/search`）仍基于 Postgres。

---

## 附录：Meilisearch 运维

- **部署**：生产环境运行一个 Meilisearch 实例，通过 `KUN_MEILISEARCH_HOST` 注入到 wiki 服务
- **Index 前缀**：生产无前缀（`galgames` / `galgame_tags` / `galgame_officials`）；开发/测试可设 `KUN_MEILISEARCH_INDEX_PREFIX=dev_` 避免污染
- **启动自愈**：wiki 服务 `cmd/galgame` 启动时自动 `EnsureIndexes`（创建 index + patch settings），不推送文档
- **写入同步**：创建/编辑 galgame、tag、official 时走 write-through goroutine 更新索引；失败只 log，由下方重建兜底
- **全量重建**：`go run ./cmd/reindex-search [--index=galgames,tags,officials] [--batch=1000]`
  - 首次部署必跑
  - `sync-vndb` / `migrate-*` / 批量脚本后必跑（这些脚本不走 write-through）
  - 建议每周低峰期 cron 跑一次对抗漂移
- **索引 settings 变更**：改 `internal/platform/galgame/search/settings.go` 重启服务即生效；若影响已有文档解析，再跑一次 `reindex-search`
