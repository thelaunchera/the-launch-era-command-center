# The Launch Era — Dedicated Command Center

**Private portal host:** https://command.thelaunchera.com

This repository **only** deploys the existing The Launch Era Command Center browser application to an isolated GitHub Pages site. The sales website at https://thelaunchera.com remains hosted by its current GitHub Pages repository and is not changed here.

## Source and deployment

The workflow `.github/workflows/deploy-command-center.yml` pulls **pinned** public source commit `44b5edc6e32ee850be1f5e6fca441dd17e0a4d4c` of `thelaunchera/the-launch-era-new-website-`, copies its `public/command-center/` static application to the *root* of the dedicated Pages artifact, includes required brand and CB Depot public assets, rewrites only domain-specific sign-in/recovery/notification paths, and publishes to GitHub Pages.

The latest owner-only AI Team HTML, CSS, and JS are overlaid from approved public website commit \`827d044f0c23e8bb85b3d7b2e5cbf133752b9128\` without changing the pinned base portal navigation or buyer modules. Independent PR QA checks this split-source build before deployment.

The generated artifact includes `CNAME` for `command.thelaunchera.com` and `deployment-source.json`. Existing website Pages `CNAME=thelaunchera.com` stays untouched.

## Required GitHub Settings — not API-configurable by this GitHub connector

In **this new repository**: Settings → Pages → Build and deployment → Source: **GitHub Actions**. Under Custom domain set **command.thelaunchera.com**. Domain DNS already has CNAME `command` → `thelaunchera.github.io`. Wait for validation and enable **Enforce HTTPS**. Do **not** change the old website's custom domain, root records, or app subdomain.

## Release gates

Publishing this public static shell is **not** authorization to invite customers, migrate CB Depot or enable paid AI agents. Before changing actual invitations or buyer links:
1. Verify owner and two synthetic buyers authenticate from the **new origin**; Supabase Auth redirects/recovery must allow the new hostname.
2. Test strict tenant isolation with roles and workspace ownership at both backend/API and UI layers; no owner admin/Jessie data accessible to buyers.
3. Check client activation, reset, 12h browser re-authentication and EN/ES on Safari phone/tablet/desktop, and no broken routes.
4. Validate SSL, page assets, CB Depot branding, PWA/push, rollback, and independent QA.
5. Deploy private-buyer routing updates only after their own reviewed PR acceptance. Buyer AI agents are **optional paid modules** provisioned later, independent of TLE's owner-only seven agents.

This repository contains only public browser static assets; never commit Supabase service-role keys, private client records, credentials or other secrets.

## Owner sales tools — 2026-10-20

The dedicated portal copies only eight sales-tools files from separately pinned website commit `7f5584ae5187b294c448a4bfff368bd735765492`. The original portal and AI Team source SHAs are preserved. The existing owner header keeps its Sales tools shortcut, the authenticated Owner sidebar gets a visible Sales tools entry that routes to the Clara section, and AI Team links to the same owner-verified page. Backend permissions are enforced by the new `tle-owner-growth` function; no buyer UI, booking, email or payment flow is replaced.

`node scripts/build-sales-tools.mjs` runs after the existing build and updates `deployment-source.json` with `salesToolsSourceCommit`. `qa-sales-tools-overlay.mjs` checks exact file hashes and unchanged base SHAs. The PR workflow exercises the built portal in Chromium/WebKit with synthetic EN/ES records; no real client submissions. See website `docs/owner-growth/README.md` for bounded research, monitoring, document-kit scope and rollback.

Clara update: Sales tools now opens the original server-protected Clara preview full-screen through the existing owner_preview action. No raw template is bundled or downloaded; no prospect renaming or public publication. The updated responsive suite covers auth, retry, close, late-response clearing, EN/ES and isolated Sonny relay.


### Owner sidebar entry — 2026-10-21
The dedicated portal copies reviewed source `7f5584ae5187b294c448a4bfff368bd735765492`. Verified owners see **Sales tools** immediately before **More tools**; it links to `sales-tools.html#demos`. The protected Clara preview still opens only from its explicit button. Buyer navigation and the pinned base portal/AI Team sources are preserved.


### Owner sidebar production verification — 2026-10-21
- PR #22 merged at `0c96541bde4f325b4570071308992c3441dc5f2b`; isolated overlay QA 39583392290 and Pages deployment 39583670560 succeeded.
- Live deployment metadata reports Sales tools source `7f5584ae5187b294c448a4bfff368bd735765492` and preserves base portal `44b5edc6e32ee850be1f5e6fca441dd17e0a4d4c` plus AI Team `827d044f0c23e8bb85b3d7b2e5cbf133752b9128`.
- Live root loads `sales-tools-entry.js?v=20261021-sidebar1`; `/sales-tools.html#demos` is live and retains the owner sign-in gate. Signed-in owner-device visual acceptance is still separate; no customer data or actions were used.
