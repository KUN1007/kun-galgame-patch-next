# User Migration: Kungal + Moyu → KUN OAuth

This document describes the design, logic, and considerations behind the user migration script that consolidates users from two separate websites (KUN Galgame and MoYu Patch) into the centralized KUN OAuth system, while keeping all three databases' user IDs synchronized.

## Overview

**Script location:** `apps/api/cmd/migrate-users/main.go`

**What it does in one run:**

1. Reads all users from kungal and moyu source databases
2. Merges users with the same email into a single identity
3. Creates unified users in the OAuth target database with chronologically ordered IDs
4. Preserves legacy passwords for transparent migration on first login
5. Creates per-site metadata (roles, daily counters, etc.)
6. Migrates social relations (follows)
7. Maps site-level roles to global OAuth roles (admin, moderator)
8. **Remaps user IDs in both source databases** so all three databases share the same user IDs

After the script completes, both kungal and moyu can reference users by the same integer ID as the OAuth system, with zero additional migration work on the application side.

---

## Prerequisites

Before running the migration:

1. **Target database schema must exist:**
   ```bash
   cd apps/api
   go run ./cmd/migrate        # Creates tables and seeds sites + roles
   ```

2. **Source databases must be accessible** (kungal and moyu PostgreSQL instances)

3. **Source databases should have unique emails per user** — the script skips intra-database email duplicates (keeps the earlier registration). Deduplicate emails in source databases before running if possible.

4. **Backup all three databases** — the script modifies source databases (remaps user IDs). This is irreversible.

---

## Execution

```bash
cd apps/api

# Dry run first (no changes made)
go run ./cmd/migrate-users \
  --kungal-dsn="host=localhost port=5432 user=postgres password=xxx dbname=kungalgame sslmode=disable" \
  --moyu-dsn="host=localhost port=5432 user=postgres password=xxx dbname=kungalgame_patch sslmode=disable" \
  --dry-run

# Actual migration
go run ./cmd/migrate-users \
  --kungal-dsn="host=localhost port=5432 user=postgres password=xxx dbname=kungalgame sslmode=disable" \
  --moyu-dsn="host=localhost port=5432 user=postgres password=xxx dbname=kungalgame_patch sslmode=disable"
```

---

## Step-by-Step Logic

### Step 1: Fetch Source Data

Reads all users from both databases:
- `KungalUser` — maps to kungal's `user` table (columns: `id, name, email, password, avatar, bio, role, status, moemoepoint, ip, daily_check_in, daily_image_count, daily_toolset_upload_count, created, updated`)
- `MoyuUser` — maps to moyu's `user` table (similar structure with `daily_upload_size, last_login_time` instead of `daily_toolset_upload_count`)

### Step 2: Merge by Email

Users from both sites are merged into a unified list keyed by lowercase email:

- **Kungal users are inserted first.** If two kungal users share the same email (intra-database duplicate), only the first one (by iteration order = lowest ID = earliest registration) is kept. The duplicate is skipped and counted in `SkippedDuplicates`.
- **Moyu users are matched against the map.** If a moyu user's email already exists (from kungal), the two are merged:
  - Kungal takes priority for name, email, avatar, bio
  - Moemoepoints are summed
  - The earlier `CreatedAt` is used
  - Both source records are preserved for password migration and site data
- If a moyu user's email is unique, they become a moyu-only user.
- Intra-moyu email duplicates are also skipped (same logic as kungal).

### Step 3: Sort Chronologically

All merged users are sorted by `CreatedAt` ascending. This determines the final user ID assignment — **the earliest registered user gets ID 1, the next gets ID 2, and so on.** This preserves registration order across both sites.

### Step 4: Insert Users with Sequential IDs

For each merged user (in chronological order):

1. **Skip if email already exists in target database** (for idempotent re-runs)
2. **Deduplicate username** — if the name is already taken, append `_1`, `_2`, etc.
3. **Set legacy passwords:**
   - `kungal_password` — the original bcrypt hash from kungal (if the user came from kungal)
   - `moyu_password` — the original argon2id hash from moyu (if the user came from moyu)
   - `password` — set to NULL (will be populated on first successful legacy login)
4. **Explicitly set `user.ID`** — sequential starting from `max_existing_id + 1`
5. **Create within a transaction** that also inserts:
   - `user_site_data` records (one per source site, containing role, status, daily counters, and extra JSON metadata)
   - `user_migration` records (audit trail: source_db, source_user_id, merged_from)

The mapping `(source_db, source_user_id) → new_user_id` is stored in memory (`sourceToNewID`) for the remap step.

After all insertions, the PostgreSQL sequence is reset:
```sql
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT COALESCE(MAX(id), 1) FROM users));
```

### Step 5: Migrate Social Relations

Moyu's `user_follow_relation` records are migrated to the OAuth system's `user_follow` table. Both follower and following IDs are mapped through `sourceToNewID`. Records where either user wasn't migrated, or where follower equals following, are skipped.

Duplicate follow relations (from re-runs) are silently ignored.

### Step 6: Map Roles to Global OAuth Roles

Site-level roles from `user_site_data` are mapped to global OAuth roles:

| Site | Source Role Value | OAuth Role |
|------|------------------|------------|
| Kungal | 3 | admin |
| Kungal | 2 | moderator |
| Moyu | 4 | admin (super admin) |
| Moyu | 3 | moderator (admin) |

The highest privilege across all sites wins. Roles are inserted into the `user_roles` many-to-many join table with `ON CONFLICT DO NOTHING` for idempotency.

### Step 7: Remap User IDs in Source Databases

This is the critical step that synchronizes user IDs across all three databases.

**Problem:** The OAuth target assigned new sequential IDs (1, 2, 3...) based on chronological order. The source databases still have their original IDs (potentially overlapping between kungal and moyu, and different from the new IDs). All business tables (galgame, topic, patch, comments, etc.) reference `user.id` via foreign keys.

**Solution: Two-pass remap with offset**

For each source database (kungal, then moyu):

1. **Discover existing tables** — query `pg_tables` to skip tables that don't exist yet (e.g., `oauth_account` before `prisma migrate` is run)

2. **Disable triggers** on all affected tables (disables FK constraint enforcement during the update)

3. **Create temporary mapping table** `_id_map(old_id, new_id)` populated from `sourceToNewID`

4. **Pass 1 — Offset all IDs to temporary range:**
   ```sql
   -- For every FK column in every business table:
   UPDATE "table" SET "column" = "table"."column" + 100000000
     FROM _id_map WHERE "table"."column" = _id_map.old_id;

   -- For user.id itself:
   UPDATE "user" SET id = id + 100000000
     FROM _id_map WHERE "user".id = _id_map.old_id;
   ```
   This moves ALL mapped user IDs to the 100M+ range, completely vacating the target ID space. No collisions are possible because the offset range (100M+) doesn't overlap with any real ID.

5. **Pass 2 — Set final IDs:**
   ```sql
   -- For every FK column:
   UPDATE "table" SET "column" = _id_map.new_id
     FROM _id_map WHERE "table"."column" = _id_map.old_id + 100000000;

   -- For user.id:
   UPDATE "user" SET id = _id_map.new_id
     FROM _id_map WHERE "user".id = _id_map.old_id + 100000000;
   ```

6. **Reset sequence** — update `user_id_seq` to current max ID

7. **Re-enable triggers** on all affected tables

The entire remap runs in a single transaction per source database. If anything fails, all changes are rolled back.

**Tables remapped in Kungal** (51 FK columns across ~30 tables):

```
chat_room.last_message_sender_id,
chat_room_participant.user_id, chat_room_admin.user_id,
chat_message.sender_id, chat_message.receiver_id,
chat_message_read_by.user_id, chat_message_reaction.user_id,
doc_article.author_id,
galgame.user_id, galgame_rating.user_id, galgame_rating_like.user_id,
galgame_rating_comment.user_id, galgame_rating_comment.target_user_id,
galgame_comment.user_id, galgame_comment.target_user_id,
galgame_comment_like.user_id, galgame_contributor.user_id,
galgame_like.user_id, galgame_favorite.user_id,
galgame_history.user_id,
galgame_link.user_id, galgame_pr.user_id,
galgame_resource.user_id, galgame_resource_like.user_id,
galgame_toolset.user_id, galgame_toolset_contributor.user_id,
galgame_toolset_practicality.user_id, galgame_toolset_resource.user_id,
galgame_toolset_comment.user_id,
galgame_website.user_id, galgame_website_comment.user_id,
galgame_website_like.user_id, galgame_website_favorite.user_id,
message.sender_id, message.receiver_id,
system_message.user_id,
topic.user_id, topic_comment.user_id, topic_comment.target_user_id,
topic_comment_like.user_id, topic_poll.user_id, topic_poll_vote.user_id,
topic_reply.user_id, topic_reply_like.user_id, topic_reply_dislike.user_id,
topic_upvote.user_id, topic_like.user_id, topic_dislike.user_id,
topic_favorite.user_id,
todo.user_id, update_log.user_id, unmoe.user_id,
user_friend.user_id, user_friend.friend_id,
user_follow.follower_id, user_follow.followed_id,
oauth_account.user_id
```

**Tables remapped in Moyu** (18 FK columns across ~15 tables):

```
chat_member.user_id, chat_message.sender_id, chat_message.deleted_by_id,
chat_message_seen.user_id, chat_message_reaction.user_id,
patch.user_id, patch_resource.user_id, patch_comment.user_id,
admin_log.user_id,
user_follow_relation.follower_id, user_follow_relation.following_id,
user_message.sender_id, user_message.recipient_id,
user_patch_favorite_relation.user_id,
user_patch_contribute_relation.user_id,
user_patch_comment_like_relation.user_id,
user_patch_resource_like_relation.user_id,
oauth_account.user_id
```

---

## Password Migration Strategy

Users are migrated with NULL `password` fields. Legacy password hashes are preserved in separate columns:

| Column | Format | Source |
|--------|--------|--------|
| `password` | NULL initially, argon2id after migration | Set on first successful login |
| `kungal_password` | bcrypt hash | Kungal source database |
| `moyu_password` | Custom argon2id (`salt_hex:hash_hex`) | Moyu source database |

**Login flow** (implemented in `AuthService.Login`):

1. If `password` is set → verify with argon2id (new system)
2. Else if `kungal_password` is set → verify with bcrypt. On success: hash with argon2id, save to `password`, clear `kungal_password` and `moyu_password`
3. Else if `moyu_password` is set → verify with custom argon2id parser. On success: same migration as above
4. Else → error "password required" (user must reset via email)

This transparent migration happens once per user. After their first successful login, the legacy fields are cleared and they use the new password system going forward.

---

## Design Decisions

### Why chronological ID ordering?

Users on kungal care about their registration order and ID number. By sorting all users from both sites by `CreatedAt` and assigning sequential IDs, the earliest registered user (kungal was founded ~2023, moyu ~2024) gets the smallest ID. This preserves the perceived seniority.

### Why two-pass offset remap?

Directly updating `user.id` from old to new causes unique constraint violations when ID spaces overlap. For example, old_id=5 → new_id=3, but old_id=3 hasn't been remapped yet. The two-pass approach:
1. Moves ALL IDs to a non-overlapping range (100M+)
2. Sets them to their final values

This guarantees zero collisions regardless of how old and new ID spaces overlap.

### Why include ALL users in the mapping (even unchanged IDs)?

Even if `old_id == new_id` for some users, they must still be included in the mapping and go through the two-pass offset. Otherwise, their ID would remain at the original value during Pass 1, potentially blocking another user's new_id in Pass 2.

### Why disable triggers instead of deferring constraints?

PostgreSQL's `SET CONSTRAINTS ALL DEFERRED` only works for constraints declared as `DEFERRABLE`. Prisma-generated constraints are not deferrable by default. Disabling triggers is the reliable way to suspend FK enforcement during bulk updates.

### Why not use `user_migrations` table for the FK remap?

The `user_migrations` table exists in the OAuth target database, not in the source databases. The remap uses an in-memory `sourceToNewID` map, materialized as a temporary table (`_id_map`) in each source database's transaction. This avoids cross-database queries and keeps the remap self-contained.

---

## Idempotency

The script is designed for safe re-runs:

- Users already in the target database (matched by email) are skipped
- Follow relations use `ON CONFLICT DO NOTHING`
- Role assignments use `ON CONFLICT DO NOTHING`
- The remap step is transactional — if it fails, source databases are unchanged

However, if the remap succeeds partially (e.g., kungal succeeds but moyu fails), you must restore from backup before re-running, because the kungal source database's IDs will already be changed.

**Recommended approach for re-runs:**
1. Backup all databases before running
2. If the script fails mid-remap, restore from backup
3. Fix the issue, re-run from scratch

---

## Output

The script prints a summary after completion:

```
==================================================
Migration Results
==================================================
Kungal users total:    67373
Moyu users total:      21286
--------------------------------------------------
New users created:     81442
Users merged:          7194      (same email across both sites)
Site data created:     88636     (one per user per site)
Follows migrated:      2278
Follows skipped:       0
Roles assigned:        57        (admin + moderator)
Skipped (existing):    0         (already in target)
Errors:                0
==================================================
```

Progress is logged every 1000 users during the insertion phase.

---

## Post-Migration Checklist

1. **Verify user count:** `SELECT COUNT(*) FROM users;` in OAuth database should match `New users created`
2. **Verify ID ordering:** `SELECT id, created_at FROM users ORDER BY id LIMIT 10;` — IDs should increase with time
3. **Verify source DB IDs match:** Pick a user, check their ID is the same in kungal, moyu, and OAuth databases
4. **Test legacy login:** Try logging in with a migrated user's original password — it should work and transparently migrate the password hash
5. **Test OAuth flow:** Verify the full OAuth authorization code flow works with a migrated user
6. **Run the Prisma schema changes** on source databases (add `oauth_account` table, `String[]` → `JsonB` conversions, count field backfills — see `prisma/moyu/MIGRATION_NOTES.md`)
