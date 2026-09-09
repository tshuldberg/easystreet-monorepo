# AGENTS.md — EasyStreet Monorepo

Instructions for agents working in `/Users/trey/Desktop/Apps/Parks/easystreet-monorepo`.

## Overview

This repository is the cross-platform EasyStreet monorepo:
- Web app (Next.js)
- Mobile app (Expo / React Native)
- Backend package (Convex)
- Shared domain logic package

## Instruction Sync (Critical)

- Keep `/Users/trey/Desktop/Apps/Parks/easystreet-monorepo/AGENTS.md` and `/Users/trey/Desktop/Apps/Parks/easystreet-monorepo/.claude/CLAUDE.md` synchronized for persistent project rules.
- Any new rule or rule change must be applied in both files in the same change.

## Core References

- Main project context: `/Users/trey/Desktop/Apps/Parks/easystreet-monorepo/.claude/CLAUDE.md`
- Project docs: `/Users/trey/Desktop/Apps/Parks/easystreet-monorepo/README.md`
- Session tracking: `/Users/trey/Desktop/Apps/Parks/easystreet-monorepo/timeline.md`

## Stack

- TypeScript
- Bun 1.2.4
- Turborepo
- Next.js (web)
- Expo / React Native (mobile)
- Convex (backend package)

## Project Structure

```text
apps/web/            Next.js web app
apps/mobile/         Expo mobile app
packages/backend/    Convex schema/functions
packages/shared/     Shared domain logic and types
docs/                plans and supporting docs
timeline.md          required development tracking
```

## Key Commands

```bash
bun run dev
bun run dev:web
bun run dev:mobile
bun run dev:backend
bun run build
bun run test
bun run lint
bun run typecheck
```

## Implementation Rules

- Keep shared domain behavior in `packages/shared/` as the single source for cross-platform logic.
- Prefer changes in shared packages over duplicating logic across web/mobile.
- Maintain consistency with native EasyStreet behavior for core sweeping semantics.

## Validation Requirements

Before completion:
1. Run `bun run lint`
2. Run `bun run typecheck`
3. Run `bun run test`
4. Run targeted app-level validation for touched surfaces (web, mobile, backend)

## Collaboration Rules

- Default to single-session implementation unless independent workstreams exist.
- If parallelizing, keep strict file ownership boundaries across `apps/web`, `apps/mobile`, `packages/backend`, and `packages/shared`.
- Provide complete task context when delegating.

## Timeline Is Mandatory

- Update `/Users/trey/Desktop/Apps/Parks/easystreet-monorepo/timeline.md` for meaningful sessions.
- Include objective, technical changes, files touched, validation evidence, and next steps.

## Security and Secrets

- Never commit API keys or secret-bearing local configs.
- Keep local credential files gitignored.
- Do not commit `.claude.json` if it contains MCP/API credentials.

## Workspace Skill

- `/daily-report-ops` — `/Users/trey/Desktop/Apps/.claude/skills/daily-report-ops/SKILL.md`
