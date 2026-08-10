# Restore Load-Bearing Comments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore a minimal set of incident-backed and cross-service comments, clarify the repository policy boundary, and remove two unapproved UI gradients.

**Architecture:** Keep comments directly beside the statement whose locally invisible contract they protect. Preserve behavior everywhere except the two gradient backgrounds, which become uniform solid overlays to comply with the repository iron rule.

**Tech Stack:** Go 1.24 parser/toolchain, Nuxt 4, Vue 3, Tailwind CSS, ESLint

---

### Task 1: Clarify the Comment Policy

**Files:**
- Modify: `CLAUDE.md`

- [x] **Step 1: Add the cross-service exception boundary**

Add two short paragraphs after the standing-exception list:

```markdown
Cross-service identity and ownership boundaries count as invisible constraints when their authority lives in infra. Keep the shortest comment at the exact seam where confusing the identities or sources would fail silently.

This policy governs source code. Concise onboarding or incident notes in configuration files such as `.env.example`, `.air.toml`, and Compose files remain allowed.
```

- [x] **Step 2: Confirm protected files remain untouched**

Run: `git diff --name-only | rg '^docs/(oauth|image_service|artifact)/|(^|/)(\.env|\.air\.toml|compose)'`

Expected: no output.

### Task 2: Restore OAuth and Image Ownership Comments

**Files:**
- Modify: `apps/api/internal/middleware/auth.go`
- Modify: `apps/api/pkg/userclient/client.go`
- Modify: `apps/api/pkg/moemoepoint/awarder.go`
- Modify: `apps/api/pkg/imageclient/client.go`
- Modify: `apps/api/pkg/imageclient/meta_resolver.go`

- [x] **Step 1: Restore identity and session-namespace traps**

Add these comments at `UserInfo` and the session constants:

```go
// ID is the same integer in OAuth and this database; never translate or renumber it.
```

```go
// Cookie names and Redis prefixes must stay site-specific. Localhost cookies
// ignore ports; sharing them caused client_id_mismatch logouts.
```

- [x] **Step 2: Restore source-of-truth boundaries**

Add these comments at `Brief`, the local moemoepoint cache update, and the image client:

```go
// OAuth owns these profile fields; moyu stores user IDs, not profile truth.
```

```go
// OAuth owns the balance; this local column only mirrors the authoritative response.
```

```go
// This client addresses OAuth's content-addressed image store; moyu has no
// local object-key namespace.
```

- [x] **Step 3: Restore the incomplete-backfill cache trap**

Add this comment immediately before caching resolved image metadata:

```go
// Empty Thumbhash is an incomplete upstream backfill, not a stable miss;
// caching it forever prevents blur-up from appearing after the backfill.
```

- [x] **Step 4: Format and run focused Go tests**

Run: `gofmt -w apps/api/internal/middleware/auth.go apps/api/pkg/userclient/client.go apps/api/pkg/moemoepoint/awarder.go apps/api/pkg/imageclient/client.go apps/api/pkg/imageclient/meta_resolver.go`

Run from `apps/api`: `go test ./internal/middleware ./pkg/userclient ./pkg/moemoepoint ./pkg/imageclient`

Expected: all packages pass.

### Task 3: Restore Catalog Cutover Comments

**Files:**
- Modify: `apps/api/internal/galgame/client/catalog_dto.go`
- Modify: `apps/api/internal/galgame/client/catalog_resolve.go`
- Modify: `apps/api/internal/infrastructure/cron/claim_event_sync.go`

- [x] **Step 1: Restore site/source and absence distinctions**

Add concise comments beside `catalogClaimSiteKungal`, `catalogAbsent`, and `anchorSourceKeys`:

```go
// Claim sites are product identities, not external_ref source keys. Both
// spellings stay readable until the Wave 161 re-site has soaked.
```

```go
// Only the catalog's business-code 404 is absence; treating router or proxy
// 404s as misses made a broken face look like an empty archive.
```

```go
// These keys name one external_ref source across the Wave 161 rename; they are
// not claim sites.
```

- [x] **Step 2: Restore the adopted-ID validation trap**

Add this comment immediately before `resolveByIdentity`:

```go
// A legacy gid may equal an unrelated catalog id; accept adopted IDs only when
// claimed_by.work_id points back.
```

- [x] **Step 3: Restore feed identity, import, and idempotency traps**

Add comments at `claimSyncCronName`, the live-import transition, and the approval award key:

```go
// Catalog and retired wiki feeds have unrelated ID spaces; reusing
// wiki_msg_sync skips or replays events silently.
```

```go
// A claim born directly into live is an import, not an approval.
```

```go
// Claim event IDs overlap retired wiki message IDs, so their award keys need a
// separate namespace.
```

- [x] **Step 4: Format and run focused cutover tests**

Run: `gofmt -w apps/api/internal/galgame/client/catalog_dto.go apps/api/internal/galgame/client/catalog_resolve.go apps/api/internal/infrastructure/cron/claim_event_sync.go`

Run from `apps/api`: `go test ./internal/galgame/client ./internal/infrastructure/cron ./pkg/catalogclient`

Expected: all packages pass.

### Task 4: Remove Unapproved Background Gradients

**Files:**
- Modify: `apps/web/app/components/home/carousel/DesktopCard.vue`
- Modify: `apps/web/app/components/resource/Note.vue`

- [x] **Step 1: Record the failing gradient audit**

Run: `rg -n 'bg-gradient-|linear-gradient\(|radial-gradient\(|conic-gradient\(' apps/web/app -g '*.vue' -g '*.ts' -g '*.css'`

Expected: two matches, in `DesktopCard.vue` and `Note.vue`.

- [x] **Step 2: Replace gradients with solid overlays**

Change the carousel scrim utility group to `bg-black/20` and the resource-note overlay utility group to `bg-default-50/90`. Do not add exception comments.

- [x] **Step 3: Verify the gradient audit passes**

Run the Step 1 command again.

Expected: no output.

### Task 5: Full Verification and Independent Commit

**Files:**
- Modify: `docs/superpowers/plans/2026-08-09-restore-load-bearing-comments.md`

- [x] **Step 1: Audit the final comment inventory**

Use `go/parser` with `parser.ParseComments` across `apps/api/**/*.go`. Require only the planned ordinary comments, existing migration-history comments, and three `//go:embed` directives.

Parse all `apps/web/app/**/*.vue` with Vue SFC and Babel parsers and all Vue/standalone styles with PostCSS. Require zero script/template/style comments and zero parse errors.

- [x] **Step 2: Run backend verification**

Run from `apps/api`: `go test ./...`

Run from `apps/api`: `go vet ./...`

Run from repository root: `gofmt -d $(rg --files apps/api -g '*.go')`

Expected: tests and vet exit 0; gofmt emits no diff.

- [x] **Step 3: Run frontend verification**

Run from `apps/web`: `pnpm lint && pnpm typecheck && pnpm build`

Expected: exit 0. Existing component-name, Volar, sourcemap, dependency-annotation, and chunk-size warnings may remain.

- [x] **Step 4: Review scope and diff quality**

Run: `git diff --check`

Run: `git diff --name-only`

Expected: only the design/plan, `CLAUDE.md`, the eight planned Go files, and the two planned Vue files appear; no migrations, contract mirrors, or configuration files appear.

- [x] **Step 5: Commit the implementation independently**

```bash
git add -- CLAUDE.md apps/api/internal/middleware/auth.go apps/api/pkg/userclient/client.go apps/api/pkg/moemoepoint/awarder.go apps/api/pkg/imageclient/client.go apps/api/pkg/imageclient/meta_resolver.go apps/api/internal/galgame/client/catalog_dto.go apps/api/internal/galgame/client/catalog_resolve.go apps/api/internal/infrastructure/cron/claim_event_sync.go apps/web/app/components/home/carousel/DesktopCard.vue apps/web/app/components/resource/Note.vue docs/superpowers/plans/2026-08-09-restore-load-bearing-comments.md
git commit -m "Restore load-bearing cross-service comments"
```

- [x] **Step 6: Merge locally and reverify**

Fast-forward `master` to the implementation branch, delete the merged branch, and rerun the backend tests plus frontend lint/typecheck/build on `master`.
