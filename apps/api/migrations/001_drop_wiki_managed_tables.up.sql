-- 001: Drop metadata tables that have been moved to the Galgame Wiki Service
--
-- Background: see decision D8 in docs/proj/next-fiber/09-risks-and-decisions.md.
-- Characters, voice actors/staff, release info, covers and screenshots are now
-- owned by the Galgame Wiki Service; this project accesses them via the
-- patch.vndb_id foreign key and the GalgameClient HTTP calls.
--
-- Drop order: association tables first (they depend on the main tables), then
-- alias tables, and finally the main tables.
-- Every DROP uses CASCADE as a fallback (to clean up foreign keys, indexes,
-- triggers and dependent views).

BEGIN;

-- ─────────────────────────────────────────────────
-- 1. Association/relation tables (depend on patch_char and patch_person)
-- ─────────────────────────────────────────────────
DROP TABLE IF EXISTS patch_char_person_relation CASCADE;
DROP TABLE IF EXISTS patch_char_relation        CASCADE;
DROP TABLE IF EXISTS patch_person_relation      CASCADE;

-- ─────────────────────────────────────────────────
-- 2. Alias tables
-- ─────────────────────────────────────────────────
DROP TABLE IF EXISTS patch_char_alias   CASCADE;
DROP TABLE IF EXISTS patch_person_alias CASCADE;

-- ─────────────────────────────────────────────────
-- 3. Main data tables
-- ─────────────────────────────────────────────────
DROP TABLE IF EXISTS patch_char       CASCADE;
DROP TABLE IF EXISTS patch_person     CASCADE;
DROP TABLE IF EXISTS patch_release    CASCADE;
DROP TABLE IF EXISTS patch_cover      CASCADE;
DROP TABLE IF EXISTS patch_screenshot CASCADE;

-- Verification: should return 0 rows
DO $$
DECLARE
    remaining INT;
BEGIN
    SELECT COUNT(*) INTO remaining
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
          'patch_char', 'patch_char_alias', 'patch_char_relation',
          'patch_char_person_relation',
          'patch_person', 'patch_person_alias', 'patch_person_relation',
          'patch_release', 'patch_cover', 'patch_screenshot'
      );
    IF remaining > 0 THEN
        RAISE EXCEPTION '% deprecated tables still not dropped', remaining;
    END IF;
    RAISE NOTICE 'OK: all 10 Wiki-migrated tables dropped successfully';
END $$;

COMMIT;
