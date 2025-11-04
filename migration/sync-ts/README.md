TypeScript rewrite of the sync pipeline (VNDB + Bangumi).

Structure overview:

- api/
  - vndb.ts: Minimal client + typed helpers for VNDB Kana API.
  - bangumi.ts: Minimal client + helpers for Bangumi Open API v0.
- db/
  - prisma.ts: Shared Prisma client singleton.
  - helpers.ts: DB utilities (clear tables, upsert tag/company, lowercase VNDB ids safely).
- mapping/
  - types.ts: In-memory mapping types and small value objects.
  - normalize.ts: Name normalization and summary splitting utilities.
  - vndb.ts: Build/augment char/person map using VNDB data.
  - bangumi.ts: Merge Bangumi subject, characters and persons.
  - persist.ts: Persist char/person map + alias tables + voice links.
  - patch.ts: Patch-level syncing (names, cover, screenshots, tags, releases, companies, subject tags, fallbacks).
- utils/
  - fs.ts: ensureDir + append JSON line logging + paths.
  - sleep.ts: backoff helpers.
  - log.ts: tiny logging facade.

Entrypoints:
- processPatch.ts: Orchestrates syncing a single patch id (same behavior as JS version).
- syncFromApis.ts: End-to-end runner across all patches (clears legacy tables).

