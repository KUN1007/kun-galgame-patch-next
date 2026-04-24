-- 001 DOWN: Recreate the dropped Wiki-migrated metadata tables (schema only; data cannot be restored)
--
-- Warning: this is a one-way migration under decision D8. The data has moved
--   to the Galgame Wiki Service; this down script is for emergency schema
--   rollback only and will not restore any business data.
--   To retrieve historical data, export it from the Galgame Wiki Service and re-import.

BEGIN;

-- ─────────────────────────────────────────────────
-- Main table: patch_char
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patch_char (
    id                    SERIAL PRIMARY KEY,
    image                 VARCHAR(1007) NOT NULL DEFAULT '',
    gender                TEXT NOT NULL DEFAULT 'unknown',
    roles                 JSONB NOT NULL DEFAULT '[]',
    role                  TEXT NOT NULL DEFAULT 'side',
    birthday              TEXT NOT NULL DEFAULT '',
    bust                  INT NOT NULL DEFAULT 0,
    waist                 INT NOT NULL DEFAULT 0,
    hips                  INT NOT NULL DEFAULT 0,
    height                INT NOT NULL DEFAULT 0,
    weight                INT NOT NULL DEFAULT 0,
    cup                   TEXT NOT NULL DEFAULT '',
    age                   INT NOT NULL DEFAULT 0,
    infobox               TEXT NOT NULL DEFAULT '',
    vndb_char_id          VARCHAR(32) UNIQUE,
    bangumi_character_id  INT UNIQUE,
    name_zh_cn            VARCHAR(1007) NOT NULL DEFAULT '',
    name_ja_jp            VARCHAR(1007) NOT NULL DEFAULT '',
    name_en_us            VARCHAR(1007) NOT NULL DEFAULT '',
    description_zh_cn     VARCHAR(100007) NOT NULL DEFAULT '',
    description_ja_jp     VARCHAR(100007) NOT NULL DEFAULT '',
    description_en_us     VARCHAR(100007) NOT NULL DEFAULT '',
    created               TIMESTAMP NOT NULL DEFAULT NOW(),
    updated               TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- Main table: patch_person
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patch_person (
    id                 SERIAL PRIMARY KEY,
    image              VARCHAR(1007) NOT NULL DEFAULT '',
    roles              JSONB NOT NULL DEFAULT '[]',
    language           TEXT NOT NULL DEFAULT '',
    links              JSONB NOT NULL DEFAULT '[]',
    vndb_staff_id      VARCHAR(32) UNIQUE,
    bangumi_person_id  INT UNIQUE,
    name_zh_cn         VARCHAR(1007) NOT NULL DEFAULT '',
    name_ja_jp         VARCHAR(1007) NOT NULL DEFAULT '',
    name_en_us         VARCHAR(1007) NOT NULL DEFAULT '',
    description_zh_cn  VARCHAR(100007) NOT NULL DEFAULT '',
    description_ja_jp  VARCHAR(100007) NOT NULL DEFAULT '',
    description_en_us  VARCHAR(100007) NOT NULL DEFAULT '',
    birthday           TEXT NOT NULL DEFAULT '',
    blood_type         TEXT NOT NULL DEFAULT '',
    reference_source   TEXT NOT NULL DEFAULT '',
    birthplace         TEXT NOT NULL DEFAULT '',
    office             TEXT NOT NULL DEFAULT '',
    x                  TEXT NOT NULL DEFAULT '',
    spouse             TEXT NOT NULL DEFAULT '',
    official_website   TEXT NOT NULL DEFAULT '',
    blog               TEXT NOT NULL DEFAULT '',
    created            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated            TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────
-- Main table: patch_release (VNDB release info)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patch_release (
    id         SERIAL PRIMARY KEY,
    patch_id   INT NOT NULL REFERENCES patch(id) ON DELETE CASCADE,
    rid        VARCHAR(16) NOT NULL UNIQUE,
    title      VARCHAR(1007) NOT NULL,
    released   VARCHAR(107) NOT NULL DEFAULT '2019-10-07',
    platforms  JSONB NOT NULL DEFAULT '[]',
    languages  JSONB NOT NULL DEFAULT '[]',
    minage     INT NOT NULL DEFAULT 0,
    created    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_patch_release_patch_id ON patch_release(patch_id);
CREATE INDEX IF NOT EXISTS idx_patch_release_released ON patch_release(released);

-- ─────────────────────────────────────────────────
-- Main table: patch_cover (VNDB cover images)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patch_cover (
    id             SERIAL PRIMARY KEY,
    patch_id       INT NOT NULL REFERENCES patch(id) ON DELETE CASCADE,
    image_id       VARCHAR(107) NOT NULL,
    url            VARCHAR(1007) NOT NULL,
    width          INT NOT NULL,
    height         INT NOT NULL,
    sexual         DOUBLE PRECISION NOT NULL,
    violence       DOUBLE PRECISION NOT NULL,
    votecount      INT NOT NULL,
    thumbnail_url  VARCHAR(1007) NOT NULL,
    thumb_width    INT NOT NULL,
    thumb_height   INT NOT NULL,
    created        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (patch_id, image_id)
);
CREATE INDEX IF NOT EXISTS idx_patch_cover_patch_id ON patch_cover(patch_id);
CREATE INDEX IF NOT EXISTS idx_patch_cover_image_id ON patch_cover(image_id);

-- ─────────────────────────────────────────────────
-- Main table: patch_screenshot (VNDB screenshots)
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patch_screenshot (
    id             SERIAL PRIMARY KEY,
    patch_id       INT NOT NULL REFERENCES patch(id) ON DELETE CASCADE,
    image_id       VARCHAR(107) NOT NULL,
    url            VARCHAR(1007) NOT NULL,
    width          INT NOT NULL,
    height         INT NOT NULL,
    sexual         DOUBLE PRECISION NOT NULL,
    violence       DOUBLE PRECISION NOT NULL,
    votecount      INT NOT NULL,
    thumbnail_url  VARCHAR(1007) NOT NULL,
    thumb_width    INT NOT NULL,
    thumb_height   INT NOT NULL,
    order_no       INT NOT NULL DEFAULT 0,
    created        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated        TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (patch_id, image_id)
);
CREATE INDEX IF NOT EXISTS idx_patch_screenshot_patch_id ON patch_screenshot(patch_id);
CREATE INDEX IF NOT EXISTS idx_patch_screenshot_image_id ON patch_screenshot(image_id);

-- ─────────────────────────────────────────────────
-- Alias tables
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patch_char_alias (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(233) NOT NULL,
    patch_char_id INT NOT NULL REFERENCES patch_char(id) ON DELETE CASCADE,
    created       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated       TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (patch_char_id, name)
);
CREATE INDEX IF NOT EXISTS idx_patch_char_alias_char_id ON patch_char_alias(patch_char_id);
CREATE INDEX IF NOT EXISTS idx_patch_char_alias_name    ON patch_char_alias(name);

CREATE TABLE IF NOT EXISTS patch_person_alias (
    id        SERIAL PRIMARY KEY,
    name      VARCHAR(233) NOT NULL,
    person_id INT NOT NULL REFERENCES patch_person(id) ON DELETE CASCADE,
    created   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (person_id, name)
);
CREATE INDEX IF NOT EXISTS idx_patch_person_alias_person_id ON patch_person_alias(person_id);
CREATE INDEX IF NOT EXISTS idx_patch_person_alias_name      ON patch_person_alias(name);

-- ─────────────────────────────────────────────────
-- Association tables
-- ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patch_char_relation (
    id            SERIAL PRIMARY KEY,
    patch_id      INT NOT NULL REFERENCES patch(id) ON DELETE CASCADE,
    patch_char_id INT NOT NULL REFERENCES patch_char(id) ON DELETE CASCADE,
    created       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated       TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (patch_id, patch_char_id)
);
CREATE INDEX IF NOT EXISTS idx_patch_char_rel_patch_id ON patch_char_relation(patch_id);
CREATE INDEX IF NOT EXISTS idx_patch_char_rel_char_id  ON patch_char_relation(patch_char_id);

CREATE TABLE IF NOT EXISTS patch_person_relation (
    id              SERIAL PRIMARY KEY,
    patch_id        INT NOT NULL REFERENCES patch(id) ON DELETE CASCADE,
    patch_person_id INT NOT NULL REFERENCES patch_person(id) ON DELETE CASCADE,
    created         TIMESTAMP NOT NULL DEFAULT NOW(),
    updated         TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (patch_id, patch_person_id)
);
CREATE INDEX IF NOT EXISTS idx_patch_person_rel_patch_id  ON patch_person_relation(patch_id);
CREATE INDEX IF NOT EXISTS idx_patch_person_rel_person_id ON patch_person_relation(patch_person_id);

CREATE TABLE IF NOT EXISTS patch_char_person_relation (
    id              SERIAL PRIMARY KEY,
    patch_char_id   INT NOT NULL REFERENCES patch_char(id) ON DELETE CASCADE,
    patch_person_id INT NOT NULL REFERENCES patch_person(id) ON DELETE CASCADE,
    relation        TEXT NOT NULL DEFAULT '',
    created         TIMESTAMP NOT NULL DEFAULT NOW(),
    updated         TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (patch_char_id, patch_person_id, relation)
);
CREATE INDEX IF NOT EXISTS idx_patch_char_person_rel_char_id   ON patch_char_person_relation(patch_char_id);
CREATE INDEX IF NOT EXISTS idx_patch_char_person_rel_person_id ON patch_char_person_relation(patch_person_id);

COMMIT;
