-- 025: second one-time cleanup of notification messages whose link target no
-- longer exists — this time for EVERY link shape under a deleted patch.
--
-- Migration 019 only swept two shapes (`/patch/:id/resource` and
-- `/resource/:id`), because those were the ones the delete paths knew to clean.
-- But notifications are written at four more:
--
--   /patch/:id/introduction          favorite notice + galgame-sync messages
--   /patch/:id/comment               new comment on a patch you follow
--   /patch/:id/comment#comment-:cid  reply / @mention
--   /patch/:id                       comment-side notices
--
-- and none of them were cleaned when the patch went away, so they kept
-- accumulating. At time of writing: 881 dangling rows across those shapes on
-- top of 41 more `/patch/:id/resource` rows that re-appeared after 019 (the
-- admin user-purge bulk-deleted patches without the in-tx cleanup — fixed in
-- AdminRepository.PurgeUser by the commit pairing this migration; the narrow
-- shape match in PatchRepository.DeletePatch is widened there too).
--
-- Deletes ONLY rows whose link points into a patch (or a resource) that is
-- gone. Valid notifications and other link shapes (/user/:id/resource,
-- /apply/success, …) are untouched. The `/` separator in the LIKE keeps id
-- prefixes apart — `/patch/249/...` must not match patch 2498.
--
-- Idempotent: re-running deletes nothing once the dangling rows are gone.
-- Irreversible: deleted notifications can't be restored — the down is a no-op.

DELETE FROM user_message
WHERE (
        link ~ '^/patch/[0-9]+(/.*)?$'
        AND NOT EXISTS (
          SELECT 1 FROM patch p
          WHERE p.id = substring(link FROM '^/patch/([0-9]+)')::int
        )
      )
   OR (
        link ~ '^/resource/[0-9]+$'
        AND NOT EXISTS (
          SELECT 1 FROM patch_resource r
          WHERE r.id = substring(link FROM '^/resource/([0-9]+)$')::int
        )
      );
