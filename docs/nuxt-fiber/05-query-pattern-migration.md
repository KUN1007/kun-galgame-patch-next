# 查询模式迁移：Prisma → GORM

## 1. _count 关联计数（51 处使用）

**迁移后无需子查询**——使用新增的计数缓存字段直接读取。

```go
// 之前需要子查询：
// SELECT *, (SELECT COUNT(*) FROM galgame_like WHERE ...) AS like_count

// 现在直接查：
db.Find(&galgames) // like_count 已经是列
```

维护计数的事务模式：
```go
db.Transaction(func(tx *gorm.DB) error {
    tx.Create(&GalgameLike{GalgameID: gid, UserID: uid})
    tx.Model(&Galgame{}).Where("id = ?", gid).
        Update("like_count", gorm.Expr("like_count + 1"))
    return nil
})
```

## 2. 嵌套 include/select（68 处使用）

### 简单关联

```typescript
// Prisma
include: { user: { select: { id: true, name: true, avatar: true } } }
```

```go
// GORM
db.Preload("User", func(db *gorm.DB) *gorm.DB {
    return db.Select("id", "name", "avatar")
}).Find(&results)
```

### 深度嵌套（详情页）

不要一个查询搞定一切，用 goroutine 并发拆分：

```go
g, _ := errgroup.WithContext(ctx)
g.Go(func() error { return db.First(&galgame, gid).Error })
g.Go(func() error { return db.Where("galgame_id = ?", gid).Find(&tags).Error })
g.Go(func() error { return db.Where("galgame_id = ?", gid).Find(&contributors).Error })
g.Wait()
```

### include 内带 where

```typescript
// Prisma
include: { like: { where: { user_id: userId } } }
```

```go
// GORM
db.Preload("Like", "user_id = ?", userID).First(&result, id)
```

## 3. $transaction 事务（68 处使用）

```typescript
// Prisma
prisma.$transaction(async (prisma) => {
    await prisma.galgame.create({...})
    await prisma.galgame_contributor.create({...})
    await prisma.user.update({...})
}, { timeout: 60000 })
```

```go
// GORM
db.Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(&galgame).Error; err != nil { return err }
    if err := tx.Create(&contributor).Error; err != nil { return err }
    if err := tx.Model(&User{}).Where("id = ?", uid).
        Update("moemoepoint", gorm.Expr("moemoepoint + ?", 3)).Error; err != nil {
        return err
    }
    return nil
})
```

## 4. 复杂 WHERE（OR / AND / contains）

```typescript
// Prisma 搜索
where: {
    AND: keywords.map(kw => ({
        OR: [
            { title: { contains: kw, mode: 'insensitive' } },
            { content: { contains: kw, mode: 'insensitive' } },
        ]
    }))
}
```

迁移后由 **Meilisearch** 处理，Go 端不需要复杂 SQL 搜索。

仅保留简单过滤：
```go
query := db.Model(&Topic{})
if category != "" {
    query = query.Where("category = ?", category)
}
query.Scopes(utils.Paginate(page, limit)).Find(&topics)
```

## 5. hasSome 数组查询（3 处使用）

```typescript
// Prisma
where: { provider: { hasSome: ["steam", "patch"] } }
```

迁移后 `provider` 改为关联表，使用 JOIN：
```go
// 筛选包含特定 provider 的资源
db.Where("id IN (?)",
    db.Model(&GalgameResourceProvider{}).
        Select("resource_id").
        Where("name IN ?", providers),
).Find(&resources)
```

## 6. some / none 关联过滤

```typescript
// Prisma
where: { tag: { some: { tag: { name: { contains: keyword } } } } }
```

```go
// GORM - 子查询
db.Where("id IN (?)",
    db.Model(&GalgameTagRelation{}).Select("galgame_id").
        Joins("JOIN galgame_tag ON galgame_tag.id = galgame_tag_relation.tag_id").
        Where("galgame_tag.name ILIKE ?", "%"+keyword+"%"),
).Find(&galgames)
```

## 7. createMany + skipDuplicates

```typescript
// Prisma
prisma.galgame_alias.createMany({
    data: aliases.map(name => ({ galgame_id: gid, name })),
    skipDuplicates: true
})
```

```go
// GORM
db.Clauses(clause.OnConflict{DoNothing: true}).Create(&aliases)
```

## 8. increment / decrement

```typescript
prisma.user.update({ where: { id: uid }, data: { moemoepoint: { increment: 3 } } })
```

```go
db.Model(&User{}).Where("id = ?", uid).
    Update("moemoepoint", gorm.Expr("moemoepoint + ?", 3))
```

## 9. updateMany / deleteMany

```go
// updateMany
db.Model(&Message{}).Where("receiver_id = ? AND status = 0", uid).Update("status", 1)

// deleteMany
db.Where("galgame_id = ?", gid).Delete(&GalgameAlias{})
```

## 10. 条件动态 select

```typescript
// Prisma
select: { ...(sortField === 'view' && { view: true }) }
```

```go
fields := []string{"id", "name_en_us"}
if sortField == "view" {
    fields = append(fields, "view")
}
db.Select(fields).Find(&results)
```

## 11. Raw SQL（1 处使用）

admin 统计图表，直接用 GORM Raw：
```go
db.Raw(`
    SELECT date_trunc('day', created)::date AS date, COUNT(id)::int AS count
    FROM galgame WHERE created BETWEEN ? AND ?
    GROUP BY date ORDER BY date
`, startDate, endDate).Scan(&results)
```
