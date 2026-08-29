-- Dropping the cache costs nothing permanent: infra still owns every alias it
-- minted and re-answers the same one per (client, product), so a roll-forward
-- re-fills the table from traffic. Until it does, purchase buttons fall back to
-- the bare affiliate template and those clicks go unattributed.

DROP TABLE IF EXISTS dlsite_store_link;
