-- Dropping the column restores the pre-032 behaviour: lists page and count
-- without the display axis, so an SFW reader gets short pages again.
--
-- The cursor row goes with it. Keeping it would let a roll-forward resume the
-- drain from where it stopped, past every id whose verdict was just dropped,
-- and those rows would stay NULL for good. last_cursor itself is generic and
-- stays.

DELETE FROM cron_state WHERE name = 'catalog_display_mirror';

ALTER TABLE patch DROP COLUMN IF EXISTS content_limit;
