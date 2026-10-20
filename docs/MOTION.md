# Motion system

One approach for the whole app: **CSS transitions and keyframes driven by
tokens** (`app/globals.css`, "Motion layer"), plus three tiny client helpers.
No animation library is installed; nothing here needs one.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--dur-press` | 120ms | press feedback, menu exit |
| `--dur-micro` | 160ms | hover, focus, color, menu enter, tooltips |
| `--dur-component` | 220ms | dialog/drawer exit, accordion close, card hover |
| `--dur-component-lg` | 280ms | dialog/drawer enter, accordion open, tab indicator |
| `--dur-page` | 320ms | page entry, catalog card entry |
| `--dur-section` | 400ms | hero sequence, section reveal, progress bars, thumbnail zoom |
| `--ease-out` | `cubic-bezier(.16,1,.3,1)` | everything that enters |
| `--ease-in` | `cubic-bezier(.5,0,.75,0)` | everything that leaves |
| `--ease-in-out` | `cubic-bezier(.65,0,.35,1)` | moving between two states (tab indicator) |
| `--stagger` | 45ms | list entry stagger (capped at 6 items) |

Routine effects animate only `transform` and `opacity`. Height uses the
`grid-template-rows: 0fr → 1fr` technique (`.collapse`), never JS measuring.

## Helpers

| Helper | File | What it does |
|---|---|---|
| `usePresence(open, exitMs)` | `components/ui/motion.js` | keeps an overlay mounted for its exit; sets `data-state="open" \| "closing"`; mounts in the same render `open` turns true (focus moves in immediately); unmounts on `animationend` or a timeout; instant under reduced motion |
| `useFlash(ms)` | `components/ui/motion.js` | brief success state after a confirmed save |
| `<TabIndicator activeKey>` | `components/ui/TabIndicator.jsx` | sliding underline for a `.tabs` row (transform + width) |
| `<Reveal>` | `components/ui/Reveal.jsx` | one-time section reveal; only hides content that starts below the fold; visible without JS |

## Component specs

| Component | Enter | Exit | Notes |
|---|---|---|---|
| Dialog | fade + rise/scale (280ms) | fade + drop (220ms) | bottom sheet on phones; closing overlay is `inert`, focus returns at once |
| Drawer | slide from its edge (280ms) | slide out (220ms) | same focus rules |
| Menu / notifications | fade + scale from top-right (160ms) | 120ms | |
| Tooltip | `[data-tooltip]`, hover/focus, 250ms delay | — | icon-only controls; hidden on touch devices |
| Tabs | indicator slides (280ms) | — | |
| Accordion / curriculum | height + rotate chevron (280ms open, 220ms close) | | closed panels are `visibility:hidden` (out of tab order and AT) |
| Buttons | hover color 160ms, press `scale(.97)` 120ms | | loading: spinner + `aria-busy`; success: `.is-success` + check pop |
| Course card | lift 2px + thumbnail zoom 1.04 | | hover-capable devices only |
| Catalog results | dim to .55 while a filter/sort is pending; arriving cards rise in with stagger | | URL stays the source of truth |
| Progress | width eases to the server-confirmed value (400ms) | | completion check pops only when it just changed |
| Drag & drop | dragged row fades/scales; inset line marks the drop slot | moved row settles with a tint fade (400ms) | keyboard up/down buttons get the same settle + status announcement |
| Page entry | `main#main` fades/rises 4px (320ms) | | the lesson player's main is a persistent layout, so lesson changes never re-animate or remount the video |
| Homepage | hero items stagger in (60ms steps, 400ms) | | no continuous decorative motion, no scroll hijacking |

## Reduced motion

`prefers-reduced-motion: reduce` collapses every duration (global rule) and
removes movement: no lifts, zooms, slides or reveals; overlays unmount
immediately. State changes (open/closed, selected, saved) stay visible.
