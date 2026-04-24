-- 003: Drop patch_tag / patch_company and their association tables (D11)
--
-- Background: see D11 in docs/proj/next-fiber/09-risks-and-decisions.md.
-- Patches no longer maintain tag/company metadata locally; everything moves to
-- the Galgame Wiki Service's tag / official (joined via patch.vndb_id).

BEGIN;

-- Drop association tables first (their FKs point at the main tables)
DROP TABLE IF EXISTS patch_tag_relation     CASCADE;
DROP TABLE IF EXISTS patch_company_relation CASCADE;

-- Then drop the main tables
DROP TABLE IF EXISTS patch_tag     CASCADE;
DROP TABLE IF EXISTS patch_company CASCADE;

DO $$
DECLARE
    remaining INT;
BEGIN
    SELECT COUNT(*) INTO remaining
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('patch_tag', 'patch_tag_relation', 'patch_company', 'patch_company_relation');
    IF remaining > 0 THEN
        RAISE EXCEPTION '% tag/company tables still not dropped', remaining;
    END IF;
    RAISE NOTICE 'OK: all 4 tag/company tables dropped successfully';
END $$;

COMMIT;
