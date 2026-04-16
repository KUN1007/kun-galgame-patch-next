# MoYu Patch Prisma Schema Migration Notes

This document explains all schema changes made to the MoYu Patch Prisma models in preparation for the backend migration from Nitro (Node.js) to Go Fiber + GORM. These changes are fully backward-compatible with existing Prisma Client usage — new fields have defaults, and type changes are storage-level only.

## Context

The KUN ecosystem is migrating its backend to Go (Fiber + GORM). Two issues with the current schema must be addressed before the Go backend can efficiently work with this database:

1. **`String[]` (PostgreSQL `text[]`)** — GORM has no native support for PostgreSQL array types. Reading/writing `text[]` columns requires custom scanner/valuer implementations or the `pq` library. By contrast, `JsonB` is natively supported via `gorm.io/datatypes.JSON` with zero boilerplate.

2. **`_count` subqueries** — Prisma's `include: { _count: { select: { like: true } } }` is a Prisma-specific feature with no GORM equivalent. Every list query would need explicit `JOIN + COUNT` subqueries, which is verbose and slow. Denormalized count fields (`like_count`, `favorite_count`, etc.) allow simple `SELECT` queries and are incremented/decremented atomically when the corresponding action occurs.

3. **OAuth integration** — The KUN OAuth system provides centralized authentication. Each site needs an `oauth_account` table to link the OAuth user UUID (`sub` claim) with the local `user.id`.

## Changes by Category

### 1. `String[]` → `Json @db.JsonB` (16 fields)

All `String[]` fields have been changed to `Json @default("[]") @db.JsonB`. The underlying PostgreSQL column type changes from `text[]` to `jsonb`. The data format remains the same (a JSON array of strings), but the storage type is now natively supported by GORM.

**Affected fields:**

| File | Model | Fields |
|------|-------|--------|
| `patch.prisma` | `patch` | `type`, `language`, `engine`, `platform` |
| `patch_resource.prisma` | `patch_resource` | `type`, `language`, `platform` |
| `patch_release.prisma` | `patch_release` | `platforms`, `languages` |
| `patch_char.prisma` | `patch_char` | `roles` |
| `patch_company.prisma` | `patch_company` | `primary_language`, `official_website`, `parent_brand`, `alias` |
| `patch_person.prisma` | `patch_person` | `roles`, `links` |
| `patch_tag.prisma` | `patch_tag` | `alias` |

**Data migration SQL** (run after `prisma migrate deploy`):

```sql
-- For each affected column, convert text[] to jsonb.
-- Example for patch.type:
ALTER TABLE patch
  ALTER COLUMN type TYPE jsonb USING to_jsonb(type),
  ALTER COLUMN type SET DEFAULT '[]'::jsonb;

-- Repeat for all 16 columns listed above.
```

**Frontend impact:** If existing Prisma Client code reads these as `string[]`, it will now receive `JsonValue`. You need to cast or parse:

```typescript
// Before
const types: string[] = patch.type

// After
const types: string[] = patch.type as string[]
```

### 2. Denormalized Count Fields (8 fields)

New integer fields with `@default(0)` added to avoid `_count` subqueries.

| Model | New Field | Counts rows from |
|-------|-----------|-----------------|
| `user` | `follower_count` | `user_follow_relation` where `following_id = user.id` |
| `user` | `following_count` | `user_follow_relation` where `follower_id = user.id` |
| `patch` | `favorite_count` | `user_patch_favorite_relation` |
| `patch` | `contribute_count` | `user_patch_contribute_relation` |
| `patch` | `comment_count` | `patch_comment` |
| `patch` | `resource_count` | `patch_resource` |
| `patch_comment` | `like_count` | `user_patch_comment_like_relation` |
| `patch_resource` | `like_count` | `user_patch_resource_like_relation` |

**Data backfill SQL** (run after migration):

```sql
-- Patch counts
UPDATE patch SET favorite_count = (SELECT COUNT(*) FROM user_patch_favorite_relation WHERE patch_id = patch.id);
UPDATE patch SET contribute_count = (SELECT COUNT(*) FROM user_patch_contribute_relation WHERE patch_id = patch.id);
UPDATE patch SET comment_count = (SELECT COUNT(*) FROM patch_comment WHERE patch_id = patch.id);
UPDATE patch SET resource_count = (SELECT COUNT(*) FROM patch_resource WHERE patch_id = patch.id);

-- Comment like counts
UPDATE patch_comment SET like_count = (SELECT COUNT(*) FROM user_patch_comment_like_relation WHERE comment_id = patch_comment.id);

-- Resource like counts
UPDATE patch_resource SET like_count = (SELECT COUNT(*) FROM user_patch_resource_like_relation WHERE resource_id = patch_resource.id);

-- User follow counts
UPDATE "user" SET follower_count = (SELECT COUNT(*) FROM user_follow_relation WHERE following_id = "user".id);
UPDATE "user" SET following_count = (SELECT COUNT(*) FROM user_follow_relation WHERE follower_id = "user".id);
```

**Code change required:** After adding these fields, all places that create/delete likes, favorites, follows, comments, or resources must also increment/decrement the corresponding count field. For example:

```typescript
// When a user likes a comment:
await prisma.$transaction([
  prisma.user_patch_comment_like_relation.create({ data: { user_id, comment_id } }),
  prisma.patch_comment.update({
    where: { id: comment_id },
    data: { like_count: { increment: 1 } },
  }),
])
```

### 3. OAuth Integration (2 additions)

**New model: `oauth_account`**

```prisma
model oauth_account {
  id       Int    @id @default(autoincrement())
  user_id  Int
  provider String @default("kun-oauth") @db.VarChar(50)
  sub      String @unique @db.VarChar(255)  // OAuth user UUID
  user     user   @relation(fields: [user_id], references: [id], onDelete: Cascade)
  created  DateTime @default(now())
  updated  DateTime @updatedAt
  @@index([user_id])
}
```

**New relation on `user`:** `oauth_account oauth_account[]`

This is identical to the kungal implementation. The `sub` field stores the UUID from the OAuth server's `/oauth/userinfo` response. When a user logs in via OAuth for the first time, the backend matches by email to link an existing account, or creates a new user.

**OAuth flow overview** (see `docs/integration/oauth-integration-guide.md` for full details):

1. User clicks "Login with KUN Account" on MoYu
2. Browser redirects to `oauth.kungal.com/api/v1/oauth/authorize`
3. User authenticates on OAuth server
4. Redirect back to MoYu with authorization code
5. MoYu server exchanges code for access_token
6. MoYu server calls `/oauth/userinfo` to get user UUID
7. MoYu server finds or creates local user via `oauth_account.sub`

## Migration Checklist

1. Run `prisma migrate dev` to generate and apply the migration
2. Run the data migration SQL for `String[]` → `JsonB` conversions (if Prisma doesn't handle it automatically)
3. Run the backfill SQL for count fields
4. Update all `create`/`delete` operations on like/favorite/follow/comment/resource to also increment/decrement counts
5. Update TypeScript types where `string[]` becomes `JsonValue`
6. Deploy and verify
