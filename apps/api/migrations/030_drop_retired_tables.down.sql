-- Recreates wiki_message_read_state empty (its DDL from migration 006); it held
-- 0 rows when 030 dropped it, so empty is a faithful restore.
--
-- patch_resource_update_time_bak_20260606 is NOT recreated: its 6,657 rows only
-- exist in the 2026-08-19 prod pg_dump now. Restore them with
--   pg_restore -t patch_resource_update_time_bak_20260606 -d kungalgame_patch <dump>

CREATE TABLE IF NOT EXISTS wiki_message_read_state (
    user_id              INT PRIMARY KEY,
    last_read_message_id BIGINT NOT NULL DEFAULT 0,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
