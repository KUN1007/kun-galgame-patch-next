# 数据库 Schema 变更

## 原则

- 共用现有 PostgreSQL 数据库，不改现有表名和列名
- GORM 通过 `TableName()` 和 `column:` tag 适配现有表结构
- 新增表通过 Go migration 管理，不使用 GORM AutoMigrate（生产环境）
- 初始迁移从现有 pg_dump 生成

## 新增表

### oauth_account（OAuth 关联）

```sql
CREATE TABLE oauth_account (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  provider   VARCHAR(50) NOT NULL DEFAULT 'kun-oauth',
  sub        VARCHAR(255) NOT NULL UNIQUE,
  created    TIMESTAMP DEFAULT NOW(),
  updated    TIMESTAMP DEFAULT NOW()
);
```

### galgame_resource_provider（替代 provider text[]）

```sql
CREATE TABLE galgame_resource_provider (
  id          SERIAL PRIMARY KEY,
  resource_id INT NOT NULL REFERENCES galgame_resource(id) ON DELETE CASCADE,
  name        VARCHAR(255) NOT NULL,
  created     TIMESTAMP DEFAULT NOW(),
  updated     TIMESTAMP DEFAULT NOW(),
  UNIQUE (resource_id, name)
);
```

数据迁移：
```sql
INSERT INTO galgame_resource_provider (resource_id, name, created, updated)
SELECT id, unnest(provider), created, updated
FROM galgame_resource
WHERE array_length(provider, 1) > 0;
```

### topic_tag + topic_tag_relation（替代 topic.tag text[]）

```sql
CREATE TABLE topic_tag (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created TIMESTAMP DEFAULT NOW(),
  updated TIMESTAMP DEFAULT NOW()
);

CREATE TABLE topic_tag_relation (
  topic_id INT NOT NULL REFERENCES topic(id) ON DELETE CASCADE,
  tag_id   INT NOT NULL REFERENCES topic_tag(id) ON DELETE CASCADE,
  created  TIMESTAMP DEFAULT NOW(),
  updated  TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (topic_id, tag_id)
);
```

数据迁移：
```sql
-- 1. 提取去重标签
INSERT INTO topic_tag (name)
SELECT DISTINCT unnest(tag) FROM topic
WHERE array_length(tag, 1) > 0
ON CONFLICT DO NOTHING;

-- 2. 建立关联
INSERT INTO topic_tag_relation (topic_id, tag_id)
SELECT t.id, tt.id
FROM topic t, unnest(t.tag) AS tag_name
JOIN topic_tag tt ON tt.name = tag_name;
```

## 现有表新增列

### 计数缓存字段

以下表新增冗余计数列，用事务维护，消除 `_count` 子查询：

```sql
-- galgame
ALTER TABLE galgame ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;
ALTER TABLE galgame ADD COLUMN IF NOT EXISTS favorite_count INT DEFAULT 0;
ALTER TABLE galgame ADD COLUMN IF NOT EXISTS resource_count INT DEFAULT 0;
ALTER TABLE galgame ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;
ALTER TABLE galgame ADD COLUMN IF NOT EXISTS contributor_count INT DEFAULT 0;
ALTER TABLE galgame ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0;

-- topic
ALTER TABLE topic ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;
ALTER TABLE topic ADD COLUMN IF NOT EXISTS dislike_count INT DEFAULT 0;
ALTER TABLE topic ADD COLUMN IF NOT EXISTS reply_count INT DEFAULT 0;
ALTER TABLE topic ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;
ALTER TABLE topic ADD COLUMN IF NOT EXISTS favorite_count INT DEFAULT 0;
ALTER TABLE topic ADD COLUMN IF NOT EXISTS upvote_count INT DEFAULT 0;

-- topic_reply
ALTER TABLE topic_reply ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;
ALTER TABLE topic_reply ADD COLUMN IF NOT EXISTS dislike_count INT DEFAULT 0;
ALTER TABLE topic_reply ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;

-- galgame_resource
ALTER TABLE galgame_resource ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;

-- galgame_comment
ALTER TABLE galgame_comment ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;

-- galgame_rating
ALTER TABLE galgame_rating ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;
ALTER TABLE galgame_rating ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;

-- galgame_website
ALTER TABLE galgame_website ADD COLUMN IF NOT EXISTS like_count INT DEFAULT 0;
ALTER TABLE galgame_website ADD COLUMN IF NOT EXISTS favorite_count INT DEFAULT 0;
ALTER TABLE galgame_website ADD COLUMN IF NOT EXISTS comment_count INT DEFAULT 0;

-- topic_poll_option
ALTER TABLE topic_poll_option ADD COLUMN IF NOT EXISTS vote_count INT DEFAULT 0;
```

初始化计数（一次性运行）：
```sql
UPDATE galgame g SET
  like_count = (SELECT COUNT(*) FROM galgame_like WHERE galgame_id = g.id),
  favorite_count = (SELECT COUNT(*) FROM galgame_favorite WHERE galgame_id = g.id),
  resource_count = (SELECT COUNT(*) FROM galgame_resource WHERE galgame_id = g.id),
  comment_count = (SELECT COUNT(*) FROM galgame_comment WHERE galgame_id = g.id),
  contributor_count = (SELECT COUNT(*) FROM galgame_contributor WHERE galgame_id = g.id),
  rating_count = (SELECT COUNT(*) FROM galgame_rating WHERE galgame_id = g.id);

-- topic, topic_reply 等同理
```

## text[] → jsonb 字段变更

以下字段数据量极小（纯展示），从 `text[]` 改为 `jsonb`：

```sql
-- galgame_engine.alias
ALTER TABLE galgame_engine
  ALTER COLUMN alias TYPE jsonb USING to_jsonb(alias);

-- galgame_rating.galgame_type
ALTER TABLE galgame_rating
  ALTER COLUMN galgame_type TYPE jsonb USING to_jsonb(galgame_type);

-- galgame_toolset.homepage
ALTER TABLE galgame_toolset
  ALTER COLUMN homepage TYPE jsonb USING to_jsonb(homepage);

-- galgame_toolset_category.alias
ALTER TABLE galgame_toolset_category
  ALTER COLUMN alias TYPE jsonb USING to_jsonb(alias);

-- galgame_website.domain
ALTER TABLE galgame_website
  ALTER COLUMN domain TYPE jsonb USING to_jsonb(domain);
```

Go 端使用 `json.RawMessage` 映射。

## 不需要变更的部分

- 所有表名、列名保持不变
- 所有外键约束和级联策略保持不变
- 复合主键保持不变
- 时间戳字段名保持 `created` / `updated`
- `user.password` 保留（OAuth 用户该字段为空字符串）
