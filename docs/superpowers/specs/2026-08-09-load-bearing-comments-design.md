# Load-Bearing Comment Restoration Design

## Context

The comment-removal pass left project-owned Go, Vue, and CSS sources with no ordinary comments. That removed useful noise, but it also erased a small set of constraints whose evidence lives in OAuth, catalog, deployment history, or a previously observed failure rather than in the local statement being read.

The Wave 161 reference still describes the production window as ready rather than confirmed complete. Migration `029_claim_event_processed` is present in this repository, and the moyu catalog client binding remains an external deployment prerequisite. The legacy catalog spellings therefore cannot be treated as soaked or removable.

The frontend also contains two background gradients with no historical exception annotation. Unlike the forum examples, moyu's iron rule permits no gradient exceptions, so those rules must become solid backgrounds rather than acquire exemption comments.

## Decision

Restore only short comments at exact failure-prone seams. Each comment must record either an upstream ownership boundary, a Wave 161 dual-read requirement, or a concrete failure mode that the local code does not reveal.

The restored comments cover:

- OAuth and local user IDs sharing one integer identity.
- Site-specific session namespaces after cross-site localhost logout failures.
- OAuth as the user-profile and moemoepoint source of truth.
- OAuth's content-addressed image store and incomplete ThumbHash backfills.
- Catalog claim sites remaining distinct from external-reference source keys.
- Wave 161 dual reads for both site and source-key renames.
- Catalog 404 envelopes, adopted-ID round-trip validation, live-import classification, and event cursor/idempotency namespaces.

No identifier-echoing doc comments, section banners, code restatements, or broad explanatory blocks return.

## Policy Clarification

`CLAUDE.md` will explicitly say that cross-service identity and ownership boundaries qualify for the invisible-constraint exception. It will also state that the default-none rule governs source code comments, while concise onboarding or incident notes in configuration files remain allowed.

The generated mirrors under `docs/{oauth,image_service,artifact}/` remain untouched.

## UI Compliance

Replace the carousel's gradient scrim with a uniform translucent black background and the collapsed resource-note fade with a uniform translucent project background. This preserves text separation without creating an unapproved exception to the no-gradient rule.

## Verification

- Parse every Go file and inventory all ordinary comments plus `//go:embed` directives.
- Parse all Vue scripts, templates, and styles plus standalone CSS; require zero parse errors and no restored Vue/CSS comments.
- Confirm no background-gradient utility or CSS gradient function remains in project UI sources.
- Run `gofmt`, `go test ./...`, `go vet ./...`, frontend lint, typecheck, and production build.
- Review the final diff to ensure contract mirrors, migrations, and configuration files are unchanged.
