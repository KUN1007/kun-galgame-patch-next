# Moyu → Galgame Wiki 数据迁移设计

> 2026-04-13

## 1. 迁移范围

### 迁移的表

| moyu 源表 | wiki 目标表 | 策略 |
|---|---|---|
| `patch` | `galgame` | vndb_id 去重：重复的保留 kungal 数据，仅补 `bid`/`released` |
| `patch_alias` | `galgame_alias` | 直接迁移（patch_id 重映射后） |
| `patch_link` | `galgame_link` | user_id 填 patch 创建者 |
| `patch_tag` (provider='vndb') | `galgame_tag` | 按 name 合并去重，name_en_us 作 galgame_tag_alias |
| `patch_tag_relation` | `galgame_tag_relation` | tag_id + galgame_id 双重重映射 |

### 不迁移的表

| 表 | 原因 |
|---|---|
| `patch_company` / `patch_company_relation` | 数据质量差 |
| `patch_cover` / `patch_screenshot` | 留 moyu 本地，后续废弃 |
| `patch_char` 相关 (4 张表) | 留 moyu 本地，后续废弃 |
| `patch_person` 相关 (3 张表) | 留 moyu 本地，后续废弃 |
| `patch_release` | 可通过 vndb_id 从 VNDB API 获取 |
| `patch_resource` / `patch_comment` | moyu 站点交互数据，不属于 wiki |

## 2. Wiki 表结构变更

### galgame 表新增字段

```sql
ALTER TABLE galgame ADD COLUMN bid INT UNIQUE;           -- Bangumi Subject ID
ALTER TABLE galgame ADD COLUMN released VARCHAR(107) DEFAULT 'unknown';  -- 发行日期
```

两个字段都可选（bid 为 nullable，released 有默认值），不影响现有 kungal 数据。

## 3. Galgame ID 分配与去重

### vndb_id 去重规则

```
对于 moyu 的每个 patch:
1. 如果 patch.vndb_id 已存在于 wiki 的 galgame 表中:
   → 不创建新 galgame
   → 仅补充 bid 和 released（如果 wiki 中为空）
   → 记录 patch.id → 已有 galgame.id 的映射（用于关联表迁移）

2. 如果 patch.vndb_id 不存在于 wiki 中（或为 NULL）:
   → 创建新 galgame，ID 从 kungal max_id + 1 开始
   → 记录 patch.id → 新 galgame.id 的映射
```

### moyu patch_id 重映射

迁移完成后，moyu 库中所有引用 `patch_id` 的表需要做 remap，使其指向 wiki 中的 galgame.id。

**需要 remap 的 moyu 表和列：**

```
patch.id
patch_alias.patch_id
patch_link.patch_id
patch_tag_relation.patch_id
patch_company_relation.patch_id
patch_cover.patch_id
patch_screenshot.patch_id
patch_resource.patch_id
patch_comment.patch_id
patch_char_relation.patch_id
patch_person_relation.patch_id
patch_release.patch_id
user_patch_favorite_relation.patch_id
user_patch_contribute_relation.patch_id
```

## 4. Tag 合并策略

```
对于 moyu 的每个 patch_tag（provider='vndb'）:
1. 在 wiki 的 galgame_tag 中按 name 查找:
   → 找到: 使用已有 tag.id，记录 patch_tag.id → galgame_tag.id 映射
   → 未找到: 创建新 galgame_tag（category 从 patch_tag.category 获取），记录映射

2. 如果 patch_tag.name_en_us 非空且与 name 不同:
   → 在 galgame_tag_alias 中创建别名（如果不重复）

3. patch_tag 的 introduction、count、alias(JSONB) 等字段全部忽略
```

## 5. 字段映射

### patch → galgame

| moyu patch | wiki galgame | 说明 |
|---|---|---|
| id | — | 不直接使用，通过映射分配新 ID |
| vndb_id | vndb_id | 去重主键 |
| bid | bid | **新字段** |
| name_en_us | name_en_us | |
| name_zh_cn | name_zh_cn | |
| name_zh_cn | name_zh_tw | moyu 无 zh_tw，用 zh_cn 填充 |
| name_ja_jp | name_ja_jp | |
| banner | banner | |
| introduction_zh_cn | intro_zh_cn | 字段名不同 |
| introduction_ja_jp | intro_ja_jp | |
| introduction_en_us | intro_en_us | |
| — | intro_zh_tw | 用 introduction_zh_cn 填充 |
| released | released | **新字段** |
| content_limit | content_limit | |
| status | status | |
| view | view | |
| resource_update_time | resource_update_time | |
| user_id | user_id | 已经过 user migration remap |
| — | series_id | NULL |
| — | original_language | 默认 'ja-jp' |
| — | age_limit | 默认 'r18' |

**不迁移的 patch 字段：** `download`、`type`、`language`、`engine`、`platform`（均为聚合/JSONB），`favorite_count`、`contribute_count`、`comment_count`、`resource_count`（各站自维护）。

### patch_link → galgame_link

| moyu | wiki | 说明 |
|---|---|---|
| patch_id | galgame_id | 通过映射转换 |
| name | name | |
| url | link | 字段名不同 |
| — | user_id | 填 patch.user_id（创建者） |

## 6. 执行顺序

```
1. ALTER galgame 表：添加 bid、released 字段
2. 读取 moyu patch 数据
3. 读取 wiki 已有 galgame（建 vndb_id → id 映射）
4. 去重 + 分配新 ID → 构建 patch.id → galgame.id 映射
5. 插入新 galgame（仅 vndb_id 不重复的）
6. 补充已有 galgame 的 bid/released
7. 迁移 patch_alias → galgame_alias
8. 迁移 patch_link → galgame_link
9. 合并 patch_tag → galgame_tag（按 name 去重）
10. 迁移 patch_tag_relation → galgame_tag_relation（双重 ID 重映射）
11. 为新 galgame 创建 revision 1
12. 重置 wiki 序列
13. remap moyu 库的 patch_id（使用 patch.id → galgame.id 映射）
