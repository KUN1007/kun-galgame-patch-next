-- 026: sweep notifications whose `#comment-:cid` anchor points at a comment
-- that no longer exists.
--
-- Third leak of the same family as 019 / 025, and the last one: reply and
-- @mention notifications deep-link to a single comment
-- (`/patch/:pid/comment#comment-:cid`), but PatchRepository.DeleteComment was a
-- bare `Delete(PatchComment{}, id)`. patch_comment.parent_id CASCADEs
-- RECURSIVELY, so one deletion can remove an entire reply subtree and strand a
-- notification for every comment in it. Unlike 019/025 these do not 404 — the
-- patch and its comment list still exist — they just land with nothing
-- highlighted, which reads as "the notification lied". Fixed going forward in
-- PatchRepository.DeleteComment (commit pairing this migration), which resolves
-- the CASCADE subtree and clears the anchors in the same transaction.
--
-- Only rows whose link ENDS in a #comment-:cid anchor are considered, and only
-- when that comment id is gone. The patch-level part of the link is 025's job.
--
-- Idempotent: re-running deletes nothing once the stranded rows are gone.
-- Irreversible: deleted notifications can't be restored — the down is a no-op.

DELETE FROM user_message
WHERE link ~ '#comment-[0-9]+$'
  AND NOT EXISTS (
    SELECT 1 FROM patch_comment c
    WHERE c.id = substring(link FROM '#comment-([0-9]+)$')::int
  );
