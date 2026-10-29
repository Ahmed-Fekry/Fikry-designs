# Fikry Designs

Portfolio of Ahmed Fikry, multidisciplinary designer in Cairo.
Static site: open `index.html` or serve the folder.

## Stack

- Tailwind (Play CDN) for layout, custom CSS in `css/style.css`
- GSAP + ScrollTrigger for scroll and intro motion
- Lenis for smooth scrolling (synced to the GSAP ticker)
- Three.js for the hero object
- Fonts: Clash Display and General Sans (Fontshare)

## Motion layer

| File | What it does |
| --- | --- |
| `js/scene.js` | Hero object. Icosahedron displaced by layered simplex noise in a custom vertex shader, analytic normals, fresnel rim, wireframe skin, three gyroscopic orbit rings with a glowing satellite, soft shader particles. Reacts to pointer speed (agitation) and parallax, and rolls away on scroll. |
| `js/bg.js` | Full-page aurora background. Raw WebGL fbm fragment shader rendered at half resolution, drifts with scroll and warms toward the pointer. Falls back to the CSS mesh gradient. |
| `js/main.js` | Curtain preloader, per-character hero reveal with a seamless gradient, clip-path heading wipes, 3D rise for grids, swinging timeline, 3D work cards with glare and image parallax, cursor label, middle-column scroll parallax, ghost section words, scroll progress, nav that hides on scroll down, velocity-skewed marquee, counters, scrollspy, contact form. |

Everything respects `prefers-reduced-motion`: the WebGL layers and the custom cursor are skipped and content renders immediately.

## Content

Projects live in the `WORKS` array at the bottom of `index.html`. Local covers go in `assets/images`; a full URL is used as-is.
