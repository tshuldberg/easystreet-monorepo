# EasyStreet Privacy Policy (cross-platform app)

> DRAFT for approval (2026-10-24), for the Expo/Next.js/Convex version only. The native
> iOS app has its own policy. Fill [PUBLISHER_NAME], [SUPPORT_EMAIL], [EFFECTIVE_DATE]
> before publishing. If `PARKING_SERVER_SYNC` is ever turned on, this policy must be
> updated first.

**Effective date:** [EFFECTIVE_DATE]
**Publisher:** [PUBLISHER_NAME]

## The short version

Your parked car, reminders and settings stay on your device. To draw street cleaning
schedules, the app asks our backend for the streets inside the map area you are looking
at. Those requests are not stored or linked to you.

## What stays on your device

- Your parked car's location, street name and time parked (secure storage on the phone,
  local storage in the browser).
- Reminder settings and scheduled local notifications.
- A random device key used to keep that data separate on the device. It is not sent
  anywhere while server sync is off.

## What the backend receives

- **Map area requests**: the corners of the visible map (and, for the offline cache, the
  city's tiles) so it can return street segments and schedules. Map areas are not
  stored with any identifier and are not used to track you.
- **Street search**: the text you type, to find matching streets.
- Our backend runs on Convex (convex.dev), which processes these requests for us.

Parked car locations are **not** sent to the backend.

## Location

The app uses your location on your device to center the map, find the nearest street
and save where you parked. Background location (if you allow it) is used only for
reminders about your parked car.

## Maps

The iOS app shows Apple Maps (react-native-maps); the web app shows its map provider's
tiles. Those providers receive the map area needed to draw tiles under their own
privacy policies.

## Street cleaning data

Schedules come from DataSF ("Street Sweeping Schedule", San Francisco Public Works),
published under the Open Data Commons Public Domain Dedication and License. Posted signs
take precedence over the app.

## What we collect

No accounts, no analytics, no advertising, no tracking, and no sale or sharing of
personal data.

## Contact

[SUPPORT_EMAIL]
