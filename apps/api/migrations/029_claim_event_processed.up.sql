-- 029: idempotency + submitter ledger for the catalog claim-event cron.
--
-- The wiki message feed retires with the wiki tables (wave 161 / N5), and the
-- cron that applied its side effects moves to the registry's claim-event feed.
-- That feed is a DIFFERENT id space, so it needs a different marker table:
-- `wiki_message_processed` holds wiki message ids, both sequences are small
-- integers, and sharing the table would let wiki message 42 silently suppress
-- claim event 42's side effects (and the reverse). The old table and the old
-- `cron_state` row stay exactly as they are so a rollback resumes in place.
--
-- This table carries three columns the old one did not, and they are not
-- bookkeeping — they are the feed's missing beneficiary:
--
--   The wiki feed named the user each message was FOR (`target_user_id`). A
--   claim event names the ACTOR, and on an approval the actor is the REVIEWER.
--   Paying or notifying the actor would invert every reward. The submitter is
--   named on the earlier transition INTO `pending`, so the cron records it as
--   it goes past and looks it back up when the approval arrives.
--
-- Keeping that memo here rather than in a Redis key with a TTL buys three
-- things: it commits in the SAME transaction as the idempotency marker (so a
-- crash cannot leave the marker without the memo), it has no expiry cliff for a
-- submission that sits unreviewed for months, and it keeps this cron's whole
-- durable state in one store, which is how the wiki one was already built.

BEGIN;

CREATE TABLE IF NOT EXISTS claim_event_processed (
    event_id     BIGINT PRIMARY KEY,
    work_id      BIGINT NOT NULL,
    to_state     VARCHAR(16) NOT NULL,
    actor_uid    INT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The submitter lookup: latest transition into `pending` for one work. Ordering
-- by event_id descending inside the work is the whole access pattern, so the
-- index carries it.
CREATE INDEX IF NOT EXISTS idx_claim_event_processed_work
    ON claim_event_processed (work_id, event_id DESC);

COMMENT ON TABLE claim_event_processed IS
  'Idempotency log for the catalog claim-event cron, keyed by claim_event.id, plus the actor of each transition so an approval can be attributed to its submitter. See migration 029 / refs/proj/161.';

COMMIT;
