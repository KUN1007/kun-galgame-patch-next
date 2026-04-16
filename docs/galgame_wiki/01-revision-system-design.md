# Galgame Wiki 版本系统设计

> 2026-04-12 — 基于快照的 wiki 版本控制系统

## 1. 设计目标

- 任何编辑都有记录，可追溯到具体操作人和操作内容
- 可以回滚到任意历史版本
- PR 系统支持字段级自动 rebase，减少不必要的冲突
- 老数据平滑迁移，不丢失编辑者信息

## 2. 核心概念

### Revision（版本）

每次对 galgame 元数据的修改都会创建一个 revision。revision 存储该 galgame 在该时间点的**完整状态快照**（snapshot），而非增量 diff。

- 回滚 = 读取旧 revision 的 snapshot，应用到当前状态，创建一个新 revision
- Diff = 需要时从相邻两个 snapshot 实时计算，不持久化存储

### PR（编辑请求）

非创建者/非管理员的编辑通过 PR 提交。PR 记录基于哪个 revision 创建（`base_revision`），以及合并后的预期状态（`snapshot`）。

合并时如果 base_revision 不是最新的，系统会尝试字段级自动 rebase。只有真正冲突的字段才需要人工处理。

## 3. 数据库表设计

### galgame_revision

替代原 `galgame_history` 表。

```sql
CREATE TABLE galgame_revision (
    id              SERIAL PRIMARY KEY,
    galgame_id      INT NOT NULL REFERENCES galgame(id) ON DELETE CASCADE,
    revision        INT NOT NULL,           -- 每个 galgame 内的递增序号 (1, 2, 3...)
    user_id         INT NOT NULL,           -- 操作人
    action          VARCHAR(20) NOT NULL
                    CHECK (action IN ('created', 'updated', 'merged', 'reverted', 'declined')),
    note            TEXT DEFAULT '',         -- 编辑摘要
    snapshot        JSONB NOT NULL,         -- 该版本的完整状态
    is_minor        BOOLEAN DEFAULT FALSE,  -- 小修改标记（修错别字等）
    reverted_to     INT,                    -- 回滚操作指向的目标 revision 号
    created         TIMESTAMP DEFAULT NOW(),

    UNIQUE(galgame_id, revision)
);

CREATE INDEX idx_galgame_revision_galgame ON galgame_revision(galgame_id, revision DESC);
```

### galgame_pr（改造）

替代原 `galgame_pr` 表的 `old_data/new_data/index` 字段。

```sql
CREATE TABLE galgame_pr (
    id              SERIAL PRIMARY KEY,
    galgame_id      INT NOT NULL REFERENCES galgame(id) ON DELETE CASCADE,
    user_id         INT NOT NULL,           -- 提交者
    status          INT DEFAULT 0
                    CHECK (status IN (0, 1, 2)),  -- 0=pending, 1=merged, 2=declined
    note            TEXT DEFAULT '',         -- PR 说明
    base_revision   INT NOT NULL,           -- 基于哪个 revision 创建
    snapshot        JSONB NOT NULL,         -- 合并后的预期完整状态
    completed_by    INT,                    -- 处理人（合并/拒绝）
    completed_time  TIMESTAMP,
    revision_id     INT REFERENCES galgame_revision(id),  -- 合并后关联的 revision
    created         TIMESTAMP DEFAULT NOW(),
    updated         TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_galgame_pr_galgame ON galgame_pr(galgame_id, status);
```

### 删除的表

- `galgame_history` — 被 `galgame_revision` 完全替代

### 保留不变的表

- `galgame_contributor` — 贡献者记录，PR 合并时更新

## 4. Snapshot 格式

每个 revision 的 `snapshot` 字段存储 galgame 的完整可编辑状态：

```json
{
  "vndb_id": "v12345",
  "name_en_us": "Title",
  "name_ja_jp": "タイトル",
  "name_zh_cn": "标题",
  "name_zh_tw": "標題",
  "banner": "https://cdn.example.com/galgame/123/banner.webp",
  "intro_en_us": "English introduction...",
  "intro_ja_jp": "日本語の紹介...",
  "intro_zh_cn": "中文简介...",
  "intro_zh_tw": "中文簡介...",
  "content_limit": "sfw",
  "original_language": "ja-jp",
  "age_limit": "r18",
  "series_id": null,
  "aliases": ["别名1", "别名2"],
  "tag_ids": [1, 2, 3],
  "official_ids": [1, 2],
  "engine_ids": [1],
  "links": [
    {"name": "VNDB", "link": "https://vndb.org/v12345"},
    {"name": "官网", "link": "https://example.com"}
  ]
}
```

说明：
- 只包含**可编辑字段**，不包含 `id`、`user_id`、`view`、`created`、`updated`、`status` 等系统字段
- `aliases`、`links` 存值数组（不存 ID，因为回滚时会重建）
- `tag_ids`、`official_ids`、`engine_ids` 存 ID 数组（这些是已有实体的引用）
- 大文本字段（intro_*）完整存储，galgame 元数据通常只有几 KB

## 5. Diff 计算

**不持久化存储 diff**，需要时从相邻两个 snapshot 实时计算。

### 计算逻辑

```go
func ComputeDiff(oldSnapshot, newSnapshot map[string]any) map[string]any {
    diff := map[string]any{}

    for key, newVal := range newSnapshot {
        oldVal, exists := oldSnapshot[key]
        if !exists || !reflect.DeepEqual(oldVal, newVal) {
            switch key {
            case "intro_en_us", "intro_ja_jp", "intro_zh_cn", "intro_zh_tw":
                // 大文本只标记是否变化，不存全文 diff
                diff[key] = map[string]any{"changed": true}
            case "aliases", "links":
                // 数组类型：计算 added/removed
                diff[key] = computeArrayDiff(oldVal, newVal)
            case "tag_ids", "official_ids", "engine_ids":
                // ID 数组：计算 added/removed
                diff[key] = computeIDArrayDiff(oldVal, newVal)
            default:
                // 标量字段：记录 old/new
                diff[key] = map[string]any{"old": oldVal, "new": newVal}
            }
        }
    }

    return diff
}
```

### Diff 输出示例

```json
{
  "name_zh_cn": {"old": "旧标题", "new": "新标题"},
  "tags": {"added": [4, 5], "removed": [2]},
  "aliases": {"added": ["新别名"], "removed": ["旧别名"]},
  "intro_zh_cn": {"changed": true}
}
```

前端对于 `changed: true` 的大文本字段，可以用 diff 库（如 diff-match-patch）展示行级差异。

## 6. 操作流程

### 6.1 创建 Galgame

```
1. 创建 galgame 主记录 + 关联表（事务内）
2. 拍快照 → snapshot
3. 创建 galgame_revision (revision=1, action='created', snapshot)
4. 添加创建者为 contributor
```

### 6.2 直接编辑（创建者 or admin）

```
事务内：
1. SELECT MAX(revision) + 1 FROM galgame_revision
   WHERE galgame_id = ? FOR UPDATE  → new_revision
2. 拍当前快照 → old_snapshot
3. 应用变更到 galgame 表 + 关联表
4. 拍新快照 → new_snapshot
5. 创建 galgame_revision (
     revision=new_revision,
     action='updated',
     snapshot=new_snapshot,
     is_minor=req.is_minor
   )
6. 更新 contributor 列表
```

### 6.3 提交 PR

```
1. 读取当前最新 revision 号 → base_revision
2. 读取当前快照 → current_snapshot
3. 将 PR 的变更应用到 current_snapshot → proposed_snapshot
4. 创建 galgame_pr (
     base_revision=base_revision,
     snapshot=proposed_snapshot,
     note=说明
   )
5. 创建消息通知 galgame 创建者 (type='requested')
```

### 6.4 合并 PR

```
事务内：
1. 检查 PR 状态 = 0 (pending)，WHERE status = 0 原子更新
2. 获取当前最新 revision 号 → latest_revision (FOR UPDATE)
3. 如果 pr.base_revision == latest_revision:
     → 直接合并，使用 pr.snapshot
4. 如果 pr.base_revision < latest_revision:
     → 尝试自动 rebase（见 6.5）
5. 应用 snapshot 到 galgame 表 + 关联表（清空旧关联，按 snapshot 重建）
6. 创建 galgame_revision (
     revision=latest_revision+1,
     action='merged',
     snapshot=最终snapshot
   )
7. 更新 galgame_pr (status=1, revision_id=新revision.id, completed_by, completed_time)
8. 添加 PR 提交者为 contributor
9. 创建消息通知 PR 提交者 (type='merged')
```

### 6.5 PR 自动 Rebase

当 PR 的 base_revision 不是最新版本时：

```
1. 获取 base_revision 的 snapshot → base_snapshot
2. 获取 latest_revision 的 snapshot → current_snapshot
3. 计算 pr_changed_keys = diff(base_snapshot, pr.snapshot) 涉及的字段集合
4. 计算 other_changed_keys = diff(base_snapshot, current_snapshot) 涉及的字段集合
5. 如果 pr_changed_keys ∩ other_changed_keys = ∅:
     → 无冲突，将 PR 的变更应用到 current_snapshot → rebased_snapshot
     → 使用 rebased_snapshot 继续合并
6. 如果有交集:
     → 返回冲突错误，列出冲突字段
     → PR 提交者需要基于最新版本重新提交
```

字段级 rebase 示例：
- PR 改了 `name_zh_cn`，同时有人改了 `tag_ids` → 无冲突，自动合并
- PR 改了 `name_zh_cn`，同时有人也改了 `name_zh_cn` → 冲突，需手动处理

### 6.6 拒绝 PR

```
事务内：
1. 原子更新 galgame_pr SET status=2 WHERE id=? AND status=0
2. 如果 RowsAffected=0 → PR 已被处理
3. 创建消息通知 PR 提交者 (type='declined')
```

### 6.7 回滚

```
事务内：
1. 读取目标 revision N 的 snapshot
2. 获取当前最新 revision 号 → latest (FOR UPDATE)
3. 应用 snapshot 到 galgame 表 + 关联表（清空 + 重建）
4. 创建 galgame_revision (
     revision=latest+1,
     action='reverted',
     snapshot=revision_N.snapshot,
     reverted_to=N
   )
```

## 7. 应用 Snapshot 到数据库

snapshot 应用是多个操作的核心（合并 PR、回滚），统一抽成一个函数：

```go
// ApplySnapshot 将 snapshot 应用到 galgame 表和关联表
// 策略：字段直接更新，关联表清空后重建
func (s *GalgameService) ApplySnapshot(tx *gorm.DB, galgameID int, snapshot Snapshot) error {
    // 1. 更新 galgame 主记录字段
    updates := map[string]any{
        "vndb_id":           snapshot.VNDBID,
        "name_en_us":        snapshot.NameEnUS,
        "name_ja_jp":        snapshot.NameJaJP,
        // ... 所有标量字段
    }
    if err := tx.Model(&Galgame{}).Where("id = ?", galgameID).Updates(updates).Error; err != nil {
        return err
    }

    // 2. 重建 aliases（清空 + 插入）
    tx.Where("galgame_id = ?", galgameID).Delete(&GalgameAlias{})
    for _, name := range snapshot.Aliases {
        tx.Create(&GalgameAlias{GalgameID: galgameID, Name: name})
    }

    // 3. 重建 tag 关联
    tx.Where("galgame_id = ?", galgameID).Delete(&GalgameTagRelation{})
    for _, tagID := range snapshot.TagIDs {
        tx.Create(&GalgameTagRelation{GalgameID: galgameID, TagID: tagID})
    }

    // 4. 重建 official 关联
    tx.Where("galgame_id = ?", galgameID).Delete(&GalgameOfficialRelation{})
    for _, officialID := range snapshot.OfficialIDs {
        tx.Create(&GalgameOfficialRelation{GalgameID: galgameID, OfficialID: officialID})
    }

    // 5. 重建 engine 关联
    tx.Where("galgame_id = ?", galgameID).Delete(&GalgameEngineRelation{})
    for _, engineID := range snapshot.EngineIDs {
        tx.Create(&GalgameEngineRelation{GalgameID: galgameID, EngineID: engineID})
    }

    // 6. 重建 links
    tx.Where("galgame_id = ?", galgameID).Delete(&GalgameLink{})
    for _, link := range snapshot.Links {
        tx.Create(&GalgameLink{GalgameID: galgameID, Name: link.Name, Link: link.Link, UserID: ???})
    }
    // 注意：link 的 user_id 在回滚时用执行回滚的用户，不用原始用户

    return nil
}
```

## 8. Revision 序号并发安全

revision 是每个 galgame 内递增的序号。必须在事务内用行锁获取：

```go
func nextRevision(tx *gorm.DB, galgameID int) (int, error) {
    var maxRevision int
    err := tx.Model(&GalgameRevision{}).
        Where("galgame_id = ?", galgameID).
        Select("COALESCE(MAX(revision), 0)").
        Scan(&maxRevision).Error
    if err != nil {
        return 0, err
    }
    return maxRevision + 1, nil
}
```

配合 `galgame_revision` 表的 `UNIQUE(galgame_id, revision)` 约束，即使并发也能保证唯一。

## 9. API 端点

### 版本历史

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/galgame/:gid/revisions` | 公开 | 版本列表（分页，可过滤 is_minor） |
| GET | `/api/galgame/:gid/revisions/:rev` | 公开 | 查看特定版本的 snapshot |
| GET | `/api/galgame/:gid/revisions/:rev/diff` | 公开 | 查看与上一版本的 diff（实时计算） |
| POST | `/api/galgame/:gid/revert` | Bearer | 回滚到指定版本 (admin/创建者) |

### PR

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/galgame/:gid/prs` | 公开 | PR 列表 |
| GET | `/api/galgame/:gid/prs/:id` | 公开 | PR 详情（含 diff） |
| POST | `/api/galgame/:gid/prs` | Bearer | 提交 PR |
| PUT | `/api/galgame/:gid/prs/:id/merge` | Bearer | 合并 PR (创建者/admin) |
| PUT | `/api/galgame/:gid/prs/:id/decline` | Bearer | 拒绝 PR (创建者/admin) |

## 10. GORM 模型变更

### 新增：GalgameRevision

```go
type GalgameRevision struct {
    ID         int             `gorm:"primaryKey;autoIncrement" json:"id"`
    GalgameID  int             `gorm:"not null;uniqueIndex:idx_galgame_revision" json:"galgame_id"`
    Revision   int             `gorm:"not null;uniqueIndex:idx_galgame_revision" json:"revision"`
    UserID     int             `gorm:"not null;index" json:"user_id"`
    Action     string          `gorm:"size:20;not null" json:"action"`
    Note       string          `gorm:"type:text;default:''" json:"note"`
    Snapshot   datatypes.JSON  `gorm:"type:jsonb;not null" json:"snapshot"`
    IsMinor    bool            `gorm:"default:false" json:"is_minor"`
    RevertedTo *int            `json:"reverted_to,omitempty"`
    Created    time.Time       `gorm:"autoCreateTime" json:"created"`
}
```

### 改造：GalgamePR

```go
type GalgamePR struct {
    ID            int             `gorm:"primaryKey;autoIncrement" json:"id"`
    GalgameID     int             `gorm:"not null;index" json:"galgame_id"`
    UserID        int             `gorm:"not null;index" json:"user_id"`
    Status        int             `gorm:"default:0" json:"status"`
    Note          string          `gorm:"type:text;default:''" json:"note"`
    BaseRevision  int             `gorm:"not null" json:"base_revision"`
    Snapshot      datatypes.JSON  `gorm:"type:jsonb;not null" json:"snapshot"`
    CompletedBy   *int            `json:"completed_by,omitempty"`
    CompletedTime *time.Time      `json:"completed_time,omitempty"`
    RevisionID    *int            `json:"revision_id,omitempty"`
    Created       time.Time       `gorm:"autoCreateTime" json:"created"`
    Updated       time.Time       `gorm:"autoUpdateTime" json:"updated"`
}
```

### 删除：GalgameHistory

`galgame_history` 表在迁移后删除（保留 3 个月只读归档）。

## 11. Snapshot Go 类型

```go
// Snapshot 表示 galgame 在某个版本的完整可编辑状态
type Snapshot struct {
    VNDBID           string          `json:"vndb_id"`
    NameEnUS         string          `json:"name_en_us"`
    NameJaJP         string          `json:"name_ja_jp"`
    NameZhCN         string          `json:"name_zh_cn"`
    NameZhTW         string          `json:"name_zh_tw"`
    Banner           string          `json:"banner"`
    IntroEnUS        string          `json:"intro_en_us"`
    IntroJaJP        string          `json:"intro_ja_jp"`
    IntroZhCN        string          `json:"intro_zh_cn"`
    IntroZhTW        string          `json:"intro_zh_tw"`
    ContentLimit     string          `json:"content_limit"`
    OriginalLanguage string          `json:"original_language"`
    AgeLimit         string          `json:"age_limit"`
    SeriesID         *int            `json:"series_id"`
    Aliases          []string        `json:"aliases"`
    TagIDs           []int           `json:"tag_ids"`
    OfficialIDs      []int           `json:"official_ids"`
    EngineIDs        []int           `json:"engine_ids"`
    Links            []SnapshotLink  `json:"links"`
}

type SnapshotLink struct {
    Name string `json:"name"`
    Link string `json:"link"`
}
```

## 12. 迁移策略

### 老数据处理

对每个现有 galgame，从当前数据库状态构建 snapshot，创建 revision 1：

```sql
-- 伪代码，实际用 Go 脚本实现
FOR EACH galgame IN (SELECT * FROM galgame):
    snapshot = {
        vndb_id: galgame.vndb_id,
        name_*: galgame.name_*,
        intro_*: galgame.intro_*,
        ...,
        aliases: SELECT name FROM galgame_alias WHERE galgame_id = galgame.id,
        tag_ids: SELECT tag_id FROM galgame_tag_relation WHERE galgame_id = galgame.id,
        official_ids: SELECT official_id FROM galgame_official_relation WHERE galgame_id = galgame.id,
        engine_ids: SELECT engine_id FROM galgame_engine_relation WHERE galgame_id = galgame.id,
        links: SELECT name, link FROM galgame_link WHERE galgame_id = galgame.id
    }

    INSERT INTO galgame_revision (
        galgame_id, revision, user_id, action, note, snapshot
    ) VALUES (
        galgame.id, 1, galgame.user_id, 'created',
        '初始版本（从历史数据迁移）', snapshot
    )
```

### 老 galgame_history 数据

不迁移具体内容到 revision 系统（因为没有 snapshot 可用）。保留原表 3 个月后删除。

### 老 galgame_pr 数据

已有的 PR（无论状态）不迁移到新格式。保留原表 3 个月后删除。新 PR 使用新系统。

## 13. 实施顺序

1. **模型变更**：创建 `GalgameRevision`，改造 `GalgamePR`，保留 `GalgameHistory`（暂不删除）
2. **迁移**：运行 `migrate-galgame` 创建新表
3. **核心函数**：实现 `TakeSnapshot`、`ApplySnapshot`、`ComputeDiff`、`nextRevision`
4. **改造 Create**：创建 galgame 时同时创建 revision 1
5. **改造 Update**：直接编辑时创建新 revision
6. **实现 PR 端点**：提交、合并（含自动 rebase）、拒绝
7. **实现 Revision 端点**：历史列表、查看版本、diff、回滚
8. **数据迁移脚本**：为现有 galgame 创建 revision 1
9. **删除 GalgameHistory**：确认新系统稳定后
