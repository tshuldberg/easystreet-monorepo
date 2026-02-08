# EasyStreet App Comparison (Legacy Swift vs TypeScript Monorepo)

## Scope
- Legacy app: `/Users/trey/Desktop/Apps/Parks/EasyStreet`
- TypeScript target: `/Users/trey/Desktop/Apps/Parks/easystreet-monorepo`
- Product focus: iOS-first, San Francisco street sweeping flow.

## Executive Decision
- **Recommended target:** TypeScript monorepo.
- **Why:** shared logic across mobile/web/backend, better long-term maintainability, single-source business rules.
- **Condition for migration success:** preserve iOS-native UX quality, offline-first behavior, and reliable local notification scheduling.

## Detailed Comparison

### 1) Architecture
- Legacy Swift app:
  - Native UIKit + MapKit + CoreLocation + local SQLite/JSON fallback.
  - Strong iOS-specific polish and device-level behavior control.
  - Harder to share logic with web/other clients.
- TypeScript monorepo:
  - Expo React Native + Convex backend + shared rule engine package.
  - Better reuse and consistency across clients.
  - Needed additional iOS-specific finalization for UX/performance and offline behavior.

### 2) Data Strategy
- Legacy Swift app:
  - Strong offline posture.
  - Bundled dataset, local SQLite queries, spatial filtering.
  - Fast cold launch once bundle data is available.
- TypeScript monorepo (before this pass):
  - Convex query-driven loading with no persistent local segment cache.
  - Network dependency for first meaningful interaction.
- TypeScript monorepo (after this pass):
  - Added local SF segment cache on device (`expo-file-system`).
  - Hydrates cached segments on launch, then syncs live data from Convex.
  - Added city-wide tile priming flow to build cache after first load.

### 3) Parking Flow
- Legacy Swift app:
  - Mature “park here”, drag adjustment, status card, clear action.
  - Street resolution and parked state persist locally.
- TypeScript monorepo (before):
  - Basic park/clear backed by Convex.
  - Limited local fallback.
- TypeScript monorepo (after):
  - Park flow resolves nearest segment before saving.
  - Dragging parked marker updates location + nearest segment.
  - Parked state persisted locally for quick app relaunch.

### 4) Notifications
- Legacy Swift app:
  - Local notifications with configurable lead time.
  - Reliable cancel on clear.
- TypeScript monorepo (before):
  - Stored one lead value; no robust iOS local scheduling pipeline.
- TypeScript monorepo (after):
  - Default schedule implemented: **48h / 24h / 4h / 2h**.
  - Custom lead-time selection implemented.
  - iOS system local notifications with sound and permission flow.
  - Scheduled notification IDs persisted and canceled cleanly when parking is cleared.

### 5) iOS UX and Design Quality
- Legacy Swift app:
  - Native look/feel with system-like controls and popups.
- TypeScript monorepo (before):
  - Functional but generic UI.
- TypeScript monorepo (after):
  - Apple-style card treatment and modal controls.
  - Dedicated notification settings modal + iOS Settings deep-link behavior.
  - Cleaner top overlays and map interaction affordances.

### 6) City Scalability
- Legacy Swift app:
  - SF-focused implementation.
- TypeScript monorepo:
  - Added city config model in shared constants.
  - SF remains the only active city.
  - Color-coding/theming hooks now structured to scale to additional cities.

### 7) Quality and Testability
- Legacy Swift app:
  - Significant unit test coverage in `EasyStreetTests`.
- TypeScript monorepo:
  - Shared logic package includes test setup but currently low test volume.
  - Backend/mobile integration quality improves with unified TS logic, but more tests should be added for end-to-end confidence.

## Migration Risks to Manage
- Convex availability and network variability can still impact live data freshness.
- Expo notification behavior must be validated on real iOS devices (permission states, quiet mode, foreground/background behavior).
- Large cache growth should be monitored for storage footprint and write frequency.

## Final Position
- Move forward with the TypeScript monorepo as the product baseline.
- Keep Swift app as short-term behavioral reference until final iOS QA sign-off is complete.
