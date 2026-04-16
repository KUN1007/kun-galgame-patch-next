# 数据模型映射：Prisma → GORM

## 映射规则

| Prisma | GORM | 说明 |
|--------|------|------|
| `@id @default(autoincrement())` | `gorm:"primaryKey;autoIncrement"` | |
| `@unique` | `gorm:"uniqueIndex"` | |
| `@@unique([a, b])` | `gorm:"uniqueIndex:idx_name"` 两字段 | |
| `@@id([a, b])` | `gorm:"primaryKey"` 两字段 | |
| `@default(now())` | `gorm:"autoCreateTime"` 或 `gorm:"column:created"` | |
| `@updatedAt` | `gorm:"autoUpdateTime"` 或 `gorm:"column:updated"` | |
| `@db.VarChar(N)` | `gorm:"type:varchar(N)"` 或 `gorm:"size:N"` | |
| `@db.Text` | `gorm:"type:text"` | |
| `Int?` | `*int` | |
| `DateTime?` | `*time.Time` | |
| `String[]` | `json.RawMessage` (jsonb) 或关联表 | 见下文 |
| `Json?` | `json.RawMessage` | |
| `onDelete: Cascade` | `gorm:"constraint:OnDelete:CASCADE"` | |
| `onDelete: SetNull` | `gorm:"constraint:OnDelete:SET NULL"` | |
| model 名 `snake_case` | struct 名 `PascalCase`，`TableName()` 返回原名 | |

## 按模块模型清单

### user 模块（5 个模型）

| Go Struct | 表名 | 状态 |
|-----------|------|------|
| `User` | user | 已完成 |
| `OAuthAccount` | oauth_account | 已完成（新增表） |
| `UserFollow` | user_follow | 已完成 |
| `UserFriend` | user_friend | 已完成 |
| `UserBrief` | user（投影） | 已完成 |

### galgame 模块（26 个模型）

| Go Struct | 表名 | 变更 |
|-----------|------|------|
| `Galgame` | galgame | 新增 6 个 *_count 列 |
| `GalgameSeries` | galgame_series | 无 |
| `GalgameAlias` | galgame_alias | 无 |
| `GalgameLike` | galgame_like | 无 |
| `GalgameFavorite` | galgame_favorite | 无 |
| `GalgameContributor` | galgame_contributor | 无 |
| `GalgameTag` | galgame_tag | 无 |
| `GalgameTagAlias` | galgame_tag_alias | 无 |
| `GalgameOfficial` | galgame_official | 无 |
| `GalgameOfficialAlias` | galgame_official_alias | 无 |
| `GalgameEngine` | galgame_engine | alias: text[] → jsonb |
| `GalgameTagRelation` | galgame_tag_relation | 复合PK，嵌入 Tag |
| `GalgameOfficialRelation` | galgame_official_relation | 复合PK，嵌入 Official |
| `GalgameEngineRelation` | galgame_engine_relation | 复合PK，嵌入 Engine |
| `GalgameLink` | galgame_link | 无 |
| `GalgamePR` | galgame_pr | old_data/new_data → json.RawMessage |
| `GalgameHistory` | galgame_history | 无 |
| `GalgameResource` | galgame_resource | 新增 like_count；移除 provider[] |
| `GalgameResourceProvider` | galgame_resource_provider | 新增表，替代 provider[] |
| `GalgameResourceLink` | galgame_resource_link | 无 |
| `GalgameResourceLike` | galgame_resource_like | 无 |
| `GalgameComment` | galgame_comment | 新增 like_count |
| `GalgameCommentLike` | galgame_comment_like | 无 |
| `GalgameRating` | galgame_rating | galgame_type: text[] → jsonb；新增 like_count, comment_count |
| `GalgameRatingLike` | galgame_rating_like | 无 |
| `GalgameRatingComment` | galgame_rating_comment | 无 |

### topic 模块（16 个模型）

| Go Struct | 表名 | 变更 |
|-----------|------|------|
| `Topic` | topic | 移除 tag[]；新增 6 个 *_count 列 |
| `TopicTag` | topic_tag | 新增表 |
| `TopicTagRelation` | topic_tag_relation | 新增表，替代 tag[] |
| `TopicSection` | topic_section | 无 |
| `TopicSectionRelation` | topic_section_relation | 复合PK |
| `TopicLike` | topic_like | 无 |
| `TopicDislike` | topic_dislike | 无 |
| `TopicUpvote` | topic_upvote | 无（允许重复推） |
| `TopicFavorite` | topic_favorite | 无 |
| `TopicReply` | topic_reply | 新增 3 个 *_count 列 |
| `TopicReplyLike` | topic_reply_like | 无 |
| `TopicReplyDislike` | topic_reply_dislike | 无 |
| `TopicReplyTarget` | topic_reply_target | 无 |
| `TopicComment` | topic_comment | 无 |
| `TopicCommentLike` | topic_comment_like | 无 |
| `TopicPoll` | topic_poll | 无 |
| `TopicPollOption` | topic_poll_option | 新增 vote_count |
| `TopicPollVote` | topic_poll_vote | 无 |

### message 模块（8 个模型）

| Go Struct | 表名 | 变更 |
|-----------|------|------|
| `Message` | message | 无 |
| `SystemMessage` | system_message | 无 |
| `ChatRoom` | chat_room | 无 |
| `ChatRoomParticipant` | chat_room_participant | 无 |
| `ChatRoomAdmin` | chat_room_admin | 无 |
| `ChatMessage` | chat_message | 无 |
| `ChatMessageReadBy` | chat_message_read_by | 无 |
| `ChatMessageReaction` | chat_message_reaction | 无 |

### website 模块（7 个模型）

| Go Struct | 表名 | 变更 |
|-----------|------|------|
| `GalgameWebsite` | galgame_website | domain: text[] → jsonb；新增 3 个 *_count |
| `GalgameWebsiteCategory` | galgame_website_category | 无 |
| `GalgameWebsiteTag` | galgame_website_tag | 无 |
| `GalgameWebsiteTagRelation` | galgame_website_tag_relation | 复合PK |
| `GalgameWebsiteComment` | galgame_website_comment | 自引用树 (parent_id) |
| `GalgameWebsiteLike` | galgame_website_like | 复合PK |
| `GalgameWebsiteFavorite` | galgame_website_favorite | 复合PK |

### toolset 模块（8 个模型）

| Go Struct | 表名 | 变更 |
|-----------|------|------|
| `GalgameToolset` | galgame_toolset | homepage: text[] → jsonb |
| `GalgameToolsetContributor` | galgame_toolset_contributor | 无 |
| `GalgameToolsetPracticality` | galgame_toolset_practicality | 无 |
| `GalgameToolsetAlias` | galgame_toolset_alias | 无 |
| `GalgameToolsetResource` | galgame_toolset_resource | 无 |
| `GalgameToolsetCategory` | galgame_toolset_category | alias: text[] → jsonb |
| `GalgameToolsetCategoryRelation` | galgame_toolset_category_relation | 复合PK |
| `GalgameToolsetComment` | galgame_toolset_comment | 自引用树 (parent_id) |

### doc 模块（4 个模型）

| Go Struct | 表名 | 变更 |
|-----------|------|------|
| `DocCategory` | doc_category | 无 |
| `DocTag` | doc_tag | 无 |
| `DocArticle` | doc_article | 无 |
| `DocArticleTagRelation` | doc_article_tag_relation | 复合PK |

### 其他模型（4 个）

| Go Struct | 表名 | 变更 |
|-----------|------|------|
| `Report` | report | 无 |
| `Unmoe` | unmoe | 无 |
| `UpdateLog` | update_log | 无 |
| `Todo` | todo | 无 |

## 总计

- **原 Prisma 模型**：75 个
- **Go GORM 模型**：78 个（新增 OAuthAccount + TopicTag + TopicTagRelation + GalgameResourceProvider - 移除 UserBrief 投影不算）
