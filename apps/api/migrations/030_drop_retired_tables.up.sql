-- 030: drop two tables nothing reads any more.
--
-- `wiki_message_read_state` (migration 006) was the per-user "last read" marker
-- for the wiki notification centre's unread badge. The wiki message feed retired
-- in wave 161 and the badge went with it; the last two references — a count in
-- PurgePreview and a DELETE in PurgeUser — are removed in the same commit as
-- this migration. 0 rows in prod and in the dev snapshot, so nothing is lost.
--
-- `patch_resource_update_time_bak_20260606` is the one-off manual backup taken
-- before the 2026-06-06 resource update_time fix, and migration 018 names it as
-- such when it excludes it from the timestamptz conversion. 6,657 rows. Two and
-- a half months of normal operation have passed since the fix it guarded.
-- THE DATA IS NOT RECOVERABLE by the down migration — take a dump first if you
-- want to keep a copy:
--   pg_dump -t patch_resource_update_time_bak_20260606 kungalgame_patch > bak.sql
--
-- DELIBERATELY NOT DROPPED: `wiki_message_processed` and its `cron_state` row.
-- Migration 029 keeps both so a rollback of the catalog claim-event cutover
-- resumes in place. They stay until that rollback window is declared closed.

BEGIN;

DROP TABLE IF EXISTS wiki_message_read_state;
DROP TABLE IF EXISTS patch_resource_update_time_bak_20260606;

COMMIT;
