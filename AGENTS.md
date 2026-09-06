# EasyStreet cross-platform

- Shared sweeping and holiday behavior belongs in packages/shared; keep it consistent with the sibling native EasyStreet implementation.
- This checkout uses the web/mobile/backend monorepo, not the native project's copied Xcode/Android manual. Read its own manifests and README for setup.
- Validate affected behavior with `bun run lint`, `bun run typecheck`, `bun run test`, and relevant app checks.
