-- Recreates wiki_message_read_state empty (its DDL from migration 006). The
-- backup table's 6,657 rows are gone for good — restore them from the pg_dump
-- the up migration tells you to take.

CREATE TABLE IF NOT EXISTS wiki_message_read_state (
    user_id              INT PRIMARY KEY,
    last_read_message_id BIGINT NOT NULL DEFAULT 0,
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
