-- Resource comments: let a patch_comment hang off a single resource.
--
-- A comment with resource_id IS NULL is a PATCH comment (the /patch/:id/comment
-- tab) — every existing row. A comment with resource_id set is a RESOURCE
-- comment, shown on /resource/:id. galgame_id stays populated on both: it is
-- what NSFW-gates the comment (content_limit lives on the owning galgame) and
-- what patch.comment_count / the admin recount job aggregate on.
--
-- ON DELETE CASCADE: deleting a resource takes its comments with it. The
-- notification rows that deep-link to those comments have no FK to cascade, so
-- PatchRepository.DeleteResource drops them in the same tx (same pattern as
-- DeleteComment / migration 019 / 026).

ALTER TABLE patch_comment
  ADD COLUMN IF NOT EXISTS resource_id INTEGER
  REFERENCES patch_resource (id) ON DELETE CASCADE;

-- The resource comment list reads (resource_id, parent_id IS NULL, status = 0)
-- ordered by (created DESC, id DESC); the partial index covers both the page
-- slice and LocateComment's "how many roots sort before this one" count.
CREATE INDEX IF NOT EXISTS idx_patch_comment_resource_root
  ON patch_comment (resource_id, created DESC, id DESC)
  WHERE resource_id IS NOT NULL AND parent_id IS NULL AND status = 0;

-- Reply preload + the resource-wide count both filter on resource_id alone.
CREATE INDEX IF NOT EXISTS idx_patch_comment_resource_id
  ON patch_comment (resource_id)
  WHERE resource_id IS NOT NULL;
