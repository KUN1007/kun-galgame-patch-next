# 查询模式迁移

本文档列出 `apps/next-server/` 中使用的所有 Prisma 查询模式，以及对应的 GORM 写法。

## 1. 反范式化计数（消除 _count 子查询）

**当前：Prisma `_count`**
```typescript
const patch = await prisma.patch.findUnique({
  where: { id: patchId },
  include: {
    _count: {
      select: {
        favorite_by: true,
        contribute_by: true,
        comment: true,
        resource: true
      }
    }
  }
})
// 访问: patch._count.favorite_by
```

**目标：GORM 直接读取字段**
```go
var patch model.Patch
db.First(&patch, patchID)
// 访问: patch.FavoriteCount, patch.ContributeCount, ...
```

**代价**：写操作中需同步维护计数字段。

```go
// 收藏时 +1
db.Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(&relation).Error; err != nil {
        return err
    }
    return tx.Model(&model.Patch{}).Where("id = ?", patchID).
        UpdateColumn("favorite_count", gorm.Expr("favorite_count + 1")).Error
})
```

涉及的计数字段及其维护时机：

| 模型 | 字段 | +1 时机 | -1 时机 |
|------|------|---------|---------|
| user | `follower_count` | 被关注 | 被取消关注 |
| user | `following_count` | 关注他人 | 取消关注 |
| patch | `favorite_count` | 被收藏 | 被取消收藏 |
| patch | `contribute_count` | 新增贡献者 | - |
| patch | `comment_count` | 新增评论 | 删除评论 |
| patch | `resource_count` | 新增资源 | 删除资源 |
| patch_comment | `like_count` | 被点赞 | 被取消点赞 |
| patch_resource | `like_count` | 被点赞 | 被取消点赞 |

## 2. 嵌套 Include / Select → Preload

**当前：Prisma 嵌套查询**
```typescript
const resource = await prisma.patch_resource.findMany({
  where: { patch_id: patchId },
  include: {
    user: { select: { id: true, name: true, avatar: true } },
    like_by: { where: { user_id: uid }, select: { id: true } }
  }
})
```

**目标：GORM Preload**
```go
var resources []model.PatchResource
db.Where("patch_id = ?", patchID).
    Preload("User", func(db *gorm.DB) *gorm.DB {
        return db.Select("id", "name", "avatar")
    }).
    Find(&resources)

// 点赞状态需要单独查询
var likedIDs []int
db.Model(&model.UserPatchResourceLikeRelation{}).
    Where("user_id = ? AND resource_id IN ?", uid, resourceIDs).
    Pluck("resource_id", &likedIDs)
```

## 3. 事务操作

**当前：Prisma $transaction**
```typescript
await prisma.$transaction(async (prisma) => {
  await prisma.patch_resource.create({ data: resourceData })
  await prisma.patch.update({
    where: { id: patchId },
    data: { resource_count: { increment: 1 } }
  })
  await prisma.user.update({
    where: { id: uid },
    data: { moemoepoint: { increment: 3 } }
  })
})
```

**目标：GORM Transaction**
```go
db.Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(&resource).Error; err != nil {
        return err
    }
    if err := tx.Model(&model.Patch{}).Where("id = ?", patchID).
        UpdateColumn("resource_count", gorm.Expr("resource_count + 1")).Error; err != nil {
        return err
    }
    return tx.Model(&model.User{}).Where("id = ?", uid).
        UpdateColumn("moemoepoint", gorm.Expr("moemoepoint + 3")).Error
})
```

## 4. 分页查询

**当前：Prisma skip/take**
```typescript
const [patches, total] = await Promise.all([
  prisma.patch.findMany({
    where: filters,
    orderBy: { [sortField]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
    include: { user: { select: { id: true, name: true, avatar: true } } }
  }),
  prisma.patch.count({ where: filters })
])
```

**目标：GORM Offset/Limit**
```go
var patches []model.Patch
var total int64

query := db.Model(&model.Patch{}).Where(filters)
query.Count(&total)
query.Order(fmt.Sprintf("%s %s", sortField, sortOrder)).
    Offset((page - 1) * limit).
    Limit(limit).
    Preload("User", func(db *gorm.DB) *gorm.DB {
        return db.Select("id", "name", "avatar")
    }).
    Find(&patches)
```

使用 `pkg/utils/pagination.go` 封装分页逻辑。

## 5. 条件筛选（复杂 WHERE）

**当前：Galgame 列表的多条件过滤**
```typescript
const where: any = {}
if (selectedType !== 'all') {
  where.type = { hasSome: [selectedType] }  // text[] 已改为 jsonb
}
if (yearString !== '0') {
  where.released = { startsWith: yearString }
}
```

**目标：GORM 条件构建**
```go
query := db.Model(&model.Patch{})

if selectedType != "all" {
    // jsonb 数组查询
    query = query.Where("type @> ?", fmt.Sprintf(`["%s"]`, selectedType))
}
if year != "0" {
    query = query.Where("released LIKE ?", year+"%")
}
```

## 6. jsonb 数组操作

已完成 `String[]` → `jsonb` 迁移，需要适配查询方式：

**包含查询（替代 `hasSome`）**
```go
// 查询 type 包含 "pc" 的补丁
db.Where("type @> ?", `["pc"]`).Find(&patches)
```

**追加去重（替代 Prisma push + 去重）**
```go
// 当前 TypeScript：手动合并数组后 update
// Go：使用 jsonb_build_array + 去重，或在应用层处理
var patch model.Patch
db.First(&patch, patchID)

existing := patch.Type
for _, v := range newTypes {
    if !contains(existing, v) {
        existing = append(existing, v)
    }
}
db.Model(&patch).Update("type", existing)
```

## 7. Upsert / 去重创建

**当前：Prisma createMany + skipDuplicates**
```typescript
await prisma.patch_tag_relation.createMany({
  data: tags.map(tagId => ({ patch_id: patchId, tag_id: tagId })),
  skipDuplicates: true
})
```

**目标：GORM OnConflict DoNothing**
```go
relations := make([]model.PatchTagRelation, len(tagIDs))
for i, tagID := range tagIDs {
    relations[i] = model.PatchTagRelation{PatchID: patchID, TagID: tagID}
}
db.Clauses(clause.OnConflict{DoNothing: true}).Create(&relations)
```

## 8. 自增/自减

**当前：Prisma increment/decrement**
```typescript
await prisma.user.update({
  where: { id: uid },
  data: { moemoepoint: { increment: 3 } }
})
```

**目标：GORM Expr**
```go
db.Model(&model.User{}).Where("id = ?", uid).
    UpdateColumn("moemoepoint", gorm.Expr("moemoepoint + ?", 3))
```

## 9. 嵌套回复查询（评论树）

**当前：Prisma 嵌套 include 回复**
```typescript
const comments = await prisma.patch_comment.findMany({
  where: { patch_id: patchId, parent_id: null },
  include: {
    user: { select: { id: true, name: true, avatar: true } },
    reply: {
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        like_by: true
      }
    },
    like_by: true
  }
})
```

**目标：GORM 两次查询**
```go
// 先查顶层评论
var comments []model.PatchComment
db.Where("patch_id = ? AND parent_id IS NULL", patchID).
    Order("created DESC").
    Offset(offset).Limit(limit).
    Preload("User", selectUserBasic).
    Find(&comments)

// 再查所有回复（批量）
commentIDs := extractIDs(comments)
var replies []model.PatchComment
db.Where("parent_id IN ?", commentIDs).
    Preload("User", selectUserBasic).
    Find(&replies)

// 在应用层组装树结构
```

## 10. 批量删除（级联）

**当前：Prisma 递归删除评论**
```typescript
// 删除评论及其所有子评论
const childComments = await prisma.patch_comment.findMany({
  where: { parent_id: commentId },
  select: { id: true }
})
for (const child of childComments) {
  await deleteCommentRecursive(child.id)
}
await prisma.patch_comment.delete({ where: { id: commentId } })
```

**目标：数据库级联 + GORM**

Prisma schema 中已定义 `onDelete: Cascade`，数据库层面的外键级联会自动处理子评论删除：

```go
// 单条删除，数据库级联处理子评论
db.Transaction(func(tx *gorm.DB) error {
    // 先统计要减少的评论数
    var count int64
    tx.Model(&model.PatchComment{}).
        Where("id = ? OR parent_id = ?", commentID, commentID).
        Count(&count)

    if err := tx.Delete(&model.PatchComment{}, commentID).Error; err != nil {
        return err
    }
    return tx.Model(&model.Patch{}).Where("id = ?", patchID).
        UpdateColumn("comment_count", gorm.Expr("comment_count - ?", count)).Error
})
```

## 11. 去重消息创建

**当前：createDedupMessage**
```typescript
export const createDedupMessage = async (data: MessageData) => {
  const existingMessage = await prisma.user_message.findFirst({
    where: {
      type: data.type,
      sender_id: data.sender_id,
      recipient_id: data.recipient_id,
      link: data.link
    }
  })
  if (!existingMessage) {
    await prisma.user_message.create({ data })
  }
}
```

**目标：GORM FirstOrCreate**
```go
func CreateDedupMessage(db *gorm.DB, msg *model.UserMessage) error {
    result := db.Where(
        "type = ? AND sender_id = ? AND recipient_id = ? AND link = ?",
        msg.Type, msg.SenderID, msg.RecipientID, msg.Link,
    ).FirstOrCreate(msg)
    return result.Error
}
```

## 12. 并行查询

**当前：Promise.all**
```typescript
const [patches, resources, comments] = await Promise.all([
  prisma.patch.findMany({ take: 12, orderBy: { created: 'desc' } }),
  prisma.patch_resource.findMany({ take: 6, orderBy: { created: 'desc' } }),
  prisma.patch_comment.findMany({ take: 6, orderBy: { created: 'desc' } })
])
```

**目标：Go errgroup**
```go
import "golang.org/x/sync/errgroup"

var patches []model.Patch
var resources []model.PatchResource
var comments []model.PatchComment

g, _ := errgroup.WithContext(ctx)

g.Go(func() error {
    return db.Order("created DESC").Limit(12).Find(&patches).Error
})
g.Go(func() error {
    return db.Order("created DESC").Limit(6).Find(&resources).Error
})
g.Go(func() error {
    return db.Order("created DESC").Limit(6).Find(&comments).Error
})

if err := g.Wait(); err != nil {
    return err
}
```
