# Code Comment Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove ordinary comments from project-owned Go, Vue, and CSS source while preserving executable directives, then document the repository's new comment policy.

**Architecture:** Use language-aware parsers to identify comment ranges so URL strings, regular expressions, and template literals are untouched. Preserve the three `//go:embed` directives because they are compiler input, replace the one ESLint suppression with lint-clean code, and verify both the source inventory and the normal Go/Nuxt checks.

**Tech Stack:** Go parser/formatter, Vue compiler SFC parser, Babel parser, PostCSS, ESLint, Nuxt type checker

---

### Task 1: Remove Go comments

**Files:**
- Modify: `apps/api/**/*.go`

- [x] **Step 1: Strip parser-recognized comments**

Use `go/parser` with `parser.ParseComments`, blank every `ast.Comment` range except text beginning with `//go:embed`, and preserve line endings while blanking ranges so adjacent tokens cannot merge.

- [x] **Step 2: Format and compile-check the result**

Run: `gofmt -w $(rg --files apps/api -g '*.go')`

Expected: all files format successfully and the three embedded assets retain their compiler directives.

Run: `go test ./...`

Expected: PASS without requiring `TEST_DATABASE_DSN`; any database-backed suite must instead be run only with the launcher-provided DSN and `-count=1 -p 1`.

### Task 2: Remove Vue and CSS comments

**Files:**
- Modify: `apps/web/app/**/*.vue`
- Modify: `apps/web/app/**/*.css`
- Modify: `apps/web/app/pages/admin/orphans.vue`

- [x] **Step 1: Strip language-recognized comment ranges**

Parse each SFC with `vue/compiler-sfc`, remove HTML comment AST ranges, parse script blocks with Babel for line and block comment ranges, and parse style blocks plus standalone CSS with PostCSS to remove CSS comment nodes.

- [x] **Step 2: Remove the obsolete lint suppression without weakening lint**

Replace the suppressed dynamic delete in `apps/web/app/pages/admin/orphans.vue` with:

```ts
Reflect.deleteProperty(editVndbID, galgameId)
```

- [x] **Step 3: Format and validate the frontend**

Run: `pnpm lint && pnpm typecheck && pnpm build`

Expected: all commands exit successfully; existing warnings may remain, but no new errors.

### Task 3: Document the comment policy

**Files:**
- Modify: `CLAUDE.md`

- [x] **Step 1: Insert the requested policy**

Add the supplied `## Comments` section after Core Engineering Principles, unchanged in meaning and wording.

- [x] **Step 2: Verify the final inventory**

Parse every Go, Vue, and CSS source again and fail if any ordinary comment node remains. Accept only the three `//go:embed` directives, then review `git diff --check` and the final diff summary.
