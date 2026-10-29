# Fikry Designs

Portfolio of Ahmed Fikry, multidisciplinary designer in Cairo.
Static site: open `index.html` or serve the folder.

## Stack

- Tailwind (Play CDN) for layout, custom CSS in `css/style.css`
- GSAP + ScrollTrigger for scroll and intro motion
- Lenis for smooth scrolling (synced to the GSAP ticker)
- Three.js for the hero object
- Fonts: Clash Display and General Sans (Fontshare)

## Design

Kinetic editorial: oversized Cabinet Grotesk headlines with Gambetta italic accent words, JetBrains Mono "lab labels" (section indexes, a live Cairo clock, a side rail), Satoshi for text. The 3D element is a "shapeshifter": one particle cloud that re-forms into a different object per section (AF monogram, loose cloud, cursor arrow, play button, rising bars, phone with UI, envelope) and travels with the scroll. Sections: hero, slanted ribbon, pinned manifesto, about, pinned horizontal services, experience ledger, six stacking project cards plus an archive list with a cursor preview, contact.

## Motion layer

| File | What it does |
| --- | --- |
| `js/scene.js` | The shapeshifter. Seven target shapes are sampled from real geometry (boxes, extrusions, a torus) into one 13k-particle cloud; a custom shader morphs between them with a staggered burst of turbulence, brightens the near faces, and reacts to pointer speed. Placement per section is set in the `WAY` array (desktop and mobile values). |
| `js/bg.js` | Full-page aurora background. Raw WebGL fbm fragment shader rendered at half resolution, drifts with scroll and warms toward the pointer. Falls back to the CSS mesh gradient. |
| `js/main.js` | Curtain preloader, overlay menu, Cairo clock, per-character title reveals, pinned manifesto that brightens word by word, pinned horizontal services (desktop), stacking project cards, archive rows with a cursor-following preview, reveals, counters, magnetic buttons, cursor label, velocity-skewed ribbon, copy-email, contact form. |

Everything respects `prefers-reduced-motion`: the WebGL layers and the custom cursor are skipped and content renders immediately.

## Content

Projects live in the `FEATURED` (six stacking cards) and `ARCHIVE` (list) arrays at the bottom of `index.html`. Local covers go in `assets/images`; a full URL is used as-is.
