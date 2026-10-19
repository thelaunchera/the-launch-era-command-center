# The Launch Era — Dedicated Command Center

**Private portal host:** https://command.thelaunchera.com

This repository **only** deploys the existing The Launch Era Command Center browser application to an isolated GitHub Pages site. The sales website at https://thelaunchera.com remains hosted by its current GitHub Pages repository and is not changed here.

## Source and deployment

The workflow `.github/workflows/deploy-command-center.yml` pulls **pinned** public source commit `827d044f0c23e8bb85b3d7b2e5cbf133752b9128` of `thelaunchera/the-launch-era-new-website-`, copies its `public/command-center/` static application to the *root* of the dedicated Pages artifact, includes required brand and CB Depot public assets, rewrites only domain-specific sign-in/recovery/notification paths, and publishes to GitHub Pages.

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
