# Project Overview

## Mission

Pharaxis-One groups medical-affairs and platform products into a single engineering monorepo while operating them as separate sellable products in production.

## Product Domains

### 1) Medical Affairs
- **MIMS**: Core system for inquiry/case lifecycle, admin workflows, process telemetry, and operational reporting.
- **CP Portal**: Client/public interaction layer for submissions, documents, and content delivery.

> **Two products only, from 2026-09-09.** Vault, QMS, AI Agent and the Test
> Console were deleted on Rohith's instruction — see SOP §43–§45. Regulated
> content management is now met by integrating with **Veeva Vault and other
> external content management systems**, not by an in-house app.

## Current State Snapshot

| App | Status |
|---|---|
| MIMS | Active — Sprint 21 complete |
| CP Portal | Stable — hotfix only |

## Technical Baseline

- Backend stack: Node.js + Express
- Frontend stack: React + Vite (MIMS / CP Portal)
- Database: MySQL (MIMS, CP Portal)
- CI: GitHub Actions
- Runtime availability: local-only; the previous AWS/EC2 host has been deleted
- Dependency management: npm + Dependabot

## Team and Process Artifacts

- `docs/TEAM_OPERATING_SOP.md` defines cross-functional operating rules, gates, and responsibilities.
- `docs/TEAM_OPERATING_SOP.md` §39 defines live collaboration communication behavior (consolidated 2026-08-07 from the former `live-communication-use-and-format.md`).
- Domain memory SOP docs capture app-specific context and continuity.

## How to Navigate This Repo

1. Start with root `README.md`.
2. Read `docs/ARCHITECTURE.md` and `docs/DB_DETAILS.md`.
3. Move to app-specific folders under `apps/`.
4. Use `.github/workflows/ci-*.yml` and `.github/workflows/release-*.yml` to understand the per-product validation model. The `deploy-*.yml` workflows are manual-only disabled notices that fail intentionally until a new hosting target exists.
