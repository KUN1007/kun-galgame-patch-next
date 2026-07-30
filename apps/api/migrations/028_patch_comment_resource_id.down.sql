DROP INDEX IF EXISTS idx_patch_comment_resource_id;
DROP INDEX IF EXISTS idx_patch_comment_resource_root;

-- Dropping the column discards every resource comment (they are only
-- addressable through it).
ALTER TABLE patch_comment DROP COLUMN IF EXISTS resource_id;
