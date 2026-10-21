# ROUTE_MAP.md

## 2026-10-15 — Jessie portrait and bundle preparation
- Public website `/assets/jessy-site.js` uses owner-approved `/assets/jessie-avatar.webp` and Jessie display name.
- Dedicated Command Center `Dashboard → Prepare bundles` opens authenticated Clients & Purchases and selects Booking + AI Bundle. Existing tenant-scoped controls manage Booking and AI separately; AI setup links use `https://thelaunchera.com/ai-booking-assistant/owner-delivery/`.


## 2026-10-21 — Dedicated owner sidebar route to Sales tools / Clara
- Dedicated portal sales overlay source: `7f5584ae5187b294c448a4bfff368bd735765492`; base portal remains `44b5edc6e32ee850be1f5e6fca441dd17e0a4d4c` and AI Team remains `827d044f0c23e8bb85b3d7b2e5cbf133752b9128`.
- Authenticated TLE Owner sidebar: **Sales tools** → `./sales-tools.html#demos` → visible **Clara demo** section → explicit **Open Clara demo** button → existing protected `owner_preview` dialog.
- The link is created only while the existing owner gateway is verified and is removed otherwise. Buyer navigation, Clara private source, bookings, messages and payments are unchanged.
- Release status: dedicated pin prepared; isolated overlay CI and production Pages deployment pending.
