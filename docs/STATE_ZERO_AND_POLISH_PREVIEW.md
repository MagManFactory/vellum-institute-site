# State Zero and the polish preview

The live site stays at **State Zero** until the owner promotes a preview. This branch does not change production by itself.

## State Zero tag

| | |
| --- | --- |
| Tag | `state-zero-2026-09-23` |
| Commit | `14d529c819bf5a53cf598522a840fe42936140bb` |
| Branch at tag time | `main` |

The tag message marks this commit as the revert baseline for velluminstitute.org polish experiments. Production should keep deploying `main` at this commit until the owner says otherwise.

## What the polish branch changes

Branch: `dev/polish-sticky-motion-glass`

Chrome only:

- Sticky navbar, with the existing Apply control kept in the bar while scrolling
- Subtle scroll reveals, staggered card entrances, soft hover, and a light hero drift
- Glass panels and gradients on the hero, course rows, and pricing tiles, using the existing palette

`prefers-reduced-motion: reduce` turns the motion off. There are no copy, pricing, testimonial, or new-section changes.

Files: `css/polish-dev.css`, `js/polish-dev.js`, a stylesheet and script tag on pages that already have the site nav, and this note. The page generator in `scripts/build-seo-pages.mjs` includes the same tags so a later rebuild keeps the preview assets.

## Preview

Open the pull request for `dev/polish-sticky-motion-glass`. If Cloudflare Pages preview builds are enabled, the PR check publishes a `*.pages.dev` URL. That URL is the preview. It is not the live site.

Local static preview:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`. The offer password gate needs `wrangler pages dev` (see the README). Sticky nav, motion, and glass do not need it.

## Revert

Do not merge the polish branch if the live site should stay at State Zero.

To throw away the preview branch locally:

```bash
git checkout main
git branch -D dev/polish-sticky-motion-glass
```

If a polish commit is ever merged and must be undone, return `main` to the tag:

```bash
git checkout main
git reset --hard state-zero-2026-09-23
```

Push that reset only when the owner has explicitly asked to restore State Zero. Checking the tag out in a throwaway worktree is enough to compare or redeploy the baseline without moving `main`.
