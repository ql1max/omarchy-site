# Omarchy Homepage Redesign — Checkpoint

**Date:** 2026-08-30
**Status:** Submitted to design@omarchy.org by Stephano (email sent, awaiting reply)

## What this is

An interactive Omarchy Quattro desktop recreated in the browser as a homepage
redesign pitch for the Omarchy Design team. Prompted by DHH's tweet asking for
homepage redesigns (https://x.com/dhh/status/2093946369731854766) and his
"Send PR" reply to Stephano's idea
(https://x.com/dhh/status/2093946631620018513).

## Key links

- **Live demo:** https://ql1max.github.io/omarchy-site/
- **Feature branch (the contribution):** https://github.com/ql1max/omarchy-site/tree/feat/interactive-quattro-homepage
- **Demo-only deploy branch:** `gh-pages` on the fork (ql1max/omarchy-site) —
  has path hacks (`/omarchy-site/` prefixes), Plausible removed, CNAME removed.
  NOT the branch to PR upstream.
- **Upstream repo:** https://github.com/omacom/omarchy-site
- **Fork:** https://github.com/ql1max/omarchy-site

## Local checkout

`/opt/mother/work/omarchy-site`
- Branch `feat/interactive-quattro-homepage` — clean, matches remote
- Branch `gh-pages` — demo deploy branch, do not PR this
- Branch `master` — untouched upstream

## Implementation summary

Single static page: `index.html` + `assets/css/homepage-quattro.css` +
`assets/js/homepage-quattro.js`. No framework, no build step (repo constraint).

- 4 workspaces (Welcome / Watch / Explore / Shortcuts), URL-hash routed
- Ctrl+K / logo searchable command launcher with all site destinations
- 4 real Omarchy themes (Tokyo Night, Catppuccin, Gruvbox, Nord) with real
  wallpapers from omacom/omarchy source; persisted in localStorage
- Animated ASCII wordmark (reused upstream laseretch WASM effect), deferred
  via requestIdleCallback
- Latest-release widget (v4.0.1, from GitHub releases API at build time —
  hardcoded in HTML, will need updating when a new release ships)
- Hero CTA row, official Omarchy icon.svg in the top bar
- Accessible: skip link, landmarks, 44px touch targets, reduced-motion,
  no-JS fallback, focus restoration, no keyboard capture while typing

## Key architectural decision (2026-08-30)

Wallpaper uses a fixed `body.quattro-body::before` composited layer instead of
`background-attachment: fixed` (which caused Safari flicker + Chrome loading
stutter on click). `body` must stay transparent — its background-color would
paint over the layer. Mobile switches the layer to `position: absolute`.
Themes drive wallpapers via `--quattro-wallpaper` and scrims via
`--quattro-scrim-top/bottom` custom properties.

## Known compromises / follow-ups if it gets traction

1. Theme wallpapers: catppuccin 262KB, gruvbox 1.2MB, nord 77KB — repo README
   asks <100KB. Compress before any PR.
2. Release widget version is hardcoded in index.html — make it dynamic.
3. gh-pages branch content must NOT be merged; strip path hacks first.
4. Demo has no build step for the logo WASM paths — logo.js uses absolute
   `/omarchy-site/` paths on gh-pages, `/assets/` paths on the feature branch.

## Git commits (feature branch, newest last)

- 8b9230a Redesign homepage as interactive Quattro desktop
- cfbdae0 Improve readability and add desktop themes
- 22854aa Restore animated Omarchy wordmark
- a081d4f Center topbar with content; transition CTA and active buttons to solid cyan
- a46114d Add clear hero CTA below animated logo
- d8e59fb Raise box opacity and restore visible topbar buttons
- a013c94 Give topbar buttons breathing room; enlarge hero CTAs
- f07d5bb Deduplicate active workspace rule
- a41fd24 Stretch topbar buttons to full bar height
- 0740278 Remove fake tray glyphs; polish bar type and launcher spacing
- 47101eb Composite wallpaper on fixed layer; defer logo WASM to idle
- dc3ecad Make body transparent so fixed wallpaper layer shows

## GitHub access note

MOTHER authenticates to GitHub as `ql1max` via SSH key. `gh` CLI is logged in
(sessions expire; re-run `gh auth login --web` and enter the device code in a
browser when needed).

## If Stephano wants to resume

Say "resume the Omarchy homepage work" — read this file, check
`git log` in `/opt/mother/work/omarchy-site`, and check for a reply from
design@omarchy.org (not accessible from MOTHER; Stephano checks his inbox).
