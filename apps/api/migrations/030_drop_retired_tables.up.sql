-- 030: drop two tables nothing reads any more.
--
-- `wiki_message_read_state` (migration 006) was the per-user "last read" marker
-- for the wiki notification centre's unread badge. The wiki message feed retired
-- in wave 161 and the badge went with it; the last two references — a count in
-- PurgePreview and a DELETE in PurgeUser — are removed in the same commit as
-- this migration. 0 rows in prod, so nothing is lost.
--
-- `patch_resource_update_time_bak_20260606` is the manual backup taken before
-- the 2026-06-06 resource_update_time correction; migration 018 names it as a
-- one-off when it excludes it from the timestamptz conversion. 6,657 rows.
-- Against the live column today, 4,946 of them match to sub-second (the backup
-- is timestamp(3), the live column timestamptz, so the remainder is rounding),
-- 1,612 have simply moved on, and 70 moved backward — patches with zero
-- resources whose inflated timestamps the correction pulled back off the
-- default sort, which is what it was for. The correction has held for two and a
-- half months. THE DOWN MIGRATION CANNOT RESTORE THIS DATA; it lives on in the
-- full pg_dump taken from prod on 2026-08-19 before this migration was written.
--
-- DELIBERATELY NOT DROPPED: `wiki_message_processed` and its `cron_state` row.
-- Migration 029 keeps both so a rollback of the catalog claim-event cutover
-- resumes in place. They stay until that rollback window is declared closed.

BEGIN;

DROP TABLE IF EXISTS wiki_message_read_state;
DROP TABLE IF EXISTS patch_resource_update_time_bak_20260606;

COMMIT;
