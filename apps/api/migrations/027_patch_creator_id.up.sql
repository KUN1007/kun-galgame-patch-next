-- 027: freeze the wiki entry-creator as a local snapshot column.
--
-- The creator badge ("词条创建者") used to read galgame.user_id off every batch
-- response. That field was wiki PRODUCT state, and the canonical catalog face
-- moyu re-anchored on in wave A2-2 refuses to mirror another service's user
-- model (refs/proj/106 R2). Ruling R12 puts display-class wiki authorship on a
-- one-time local snapshot instead: wiki-era contributions are frozen at the
-- archive, so a live dependency buys nothing and costs a round-trip per card.
--
-- Nullable and WITHOUT a foreign key, deliberately:
--   * null means "unknown", which is what every row is until the backfill runs,
--     and what a row created after the wiki face retires will stay;
--   * the referenced user is resolved through OAuth, not through moyu's local
--     `user` table, so an FK would force us to materialize a local row for
--     every wiki author just to record a badge.
ALTER TABLE patch ADD COLUMN IF NOT EXISTS creator_id integer;

COMMENT ON COLUMN patch.creator_id IS
  'Frozen snapshot of the wiki galgame entry creator (OAuth user id). Null = unknown. See migration 027 / refs/proj/106 R12.';
