-- 032: mirror catalog's display verdict onto the patch row.
--
-- The bug this fixes: /galgame pages 24 rows in SQL, then EnrichPatches asks
-- catalog for them under the reader's content limit and drops what catalog
-- refuses. Under the default SFW gate a 24-row page rendered 16, and `total`
-- still counted all 6,938 rows because the SQL never saw the axis. 43% of this
-- table is nsfw, so the shortfall was not a rounding error. The forum hit the
-- identical bug and its migration 079 records it in the same words: "An SFW
-- reader therefore got ~10 of 24 cards on every page while the pager still
-- counted all 7,781 rows."
--
-- content_limit caches catalog's verdict (claimed_by.content_limit when the
-- claim block is present, else content_rating = r18 ? nsfw : sfw) so the page
-- and its COUNT agree with what survives enrichment. NULL means "not mirrored
-- yet" and PASSES the predicate: the column can therefore deploy ahead of the
-- sync without blanking a single list. The authority is still catalog's own
-- gate at hydrate time, so a stale value costs a short row, never an NSFW leak.
--
-- Deliberately no backfill. /v2/catalog/changes drained from an empty cursor
-- enumerates the whole population oldest-updated-first, so the first drain is
-- itself the full inventory (docs/catalog/01 §8).
--
-- cron_state.last_cursor: that feed's cursor is an opaque `cur_…` string and
-- the table only had last_id BIGINT.

BEGIN;

ALTER TABLE patch ADD COLUMN IF NOT EXISTS content_limit TEXT;

ALTER TABLE cron_state ADD COLUMN IF NOT EXISTS last_cursor TEXT;

COMMENT ON COLUMN patch.content_limit IS
  'Cached catalog display verdict (032), sfw or nsfw. NULL = not mirrored yet and passes every list predicate. A pre-filter only; catalog''s gate at hydrate time is the real door.';

COMMENT ON COLUMN cron_state.last_cursor IS
  'Opaque keyset cursor for feeds that page by cur_ strings rather than an integer watermark (032).';

COMMIT;
