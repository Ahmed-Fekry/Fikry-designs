/* =========================================================
   Ahmed Fikry — Portfolio interactions
   Lenis smooth scroll · curtain preloader · split-char hero ·
   clip reveals · 3D cards with glare + cursor label · column
   parallax · ghost words · scroll progress · velocity marquee ·
   magnetic · typewriter · counters · scrollspy · contact form
   ========================================================= */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const hasGsap = !!window.gsap && !reduce;
  if (hasGsap) gsap.registerPlugin(window.ScrollTrigger);

  /* ---------------- Smooth scroll (Lenis) ---------------- */
  let lenis = null;
  if (hasGsap && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // released once the preloader lifts
  }
  function scrollTo(target, opts = {}) {
    if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4, ...opts });
    else {
      const el = typeof target === "string" ? $(target) : target;
      if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
      else el?.scrollIntoView({ behavior: "smooth" });
    }
  }
  $$('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    a.addEventListener("click", (e) => { if ($(id)) { e.preventDefault(); scrollTo(id); } });
  });

  /* ---------------- Split helpers ---------------- */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = "";
    el.setAttribute("aria-label", text);
    const chars = [...text].map((ch) => {
      const s = document.createElement("span");
      s.className = "char";
      s.textContent = ch === " " ? " " : ch;
      s.setAttribute("aria-hidden", "true");
      el.appendChild(s);
      return s;
    });
    return chars;
  }
  // Keep a seamless gradient across individually animated characters.
  function gradientAcross(el, chars) {
    const w = el.offsetWidth, pad = 0.06 * w;
    chars.forEach((c) => {
      c.classList.add("char--grad");
      c.style.backgroundSize = `${w + pad * 2}px 100%`;
      c.style.backgroundPosition = `${-c.offsetLeft - pad}px 0`;
    });
  }

  /* ---------------- Preloader (curtain) ---------------- */
  const pre = $("#preloader");
  const bar = $("#preloader .pre-bar > span");
  const cnt = $("#preloader .pre-count");
  const preWord = $("#preloader .pre-word");
  let preChars = [];
  if (preWord) { preChars = splitChars(preWord); gradientAcross(preWord, preChars); }
  document.body.style.overflow = "hidden";

  let p = 0, started = false;
  const load = setInterval(() => {
    p += Math.random() * 9 + 3;
    if (p >= 100) { p = 100; clearInterval(load); setTimeout(hidePre, 260); }
    if (bar) bar.style.width = p + "%";
    if (cnt) cnt.textContent = String(Math.floor(p)).padStart(3, "0") + " %";
  }, 90);
  if (hasGsap && preChars.length) {
    gsap.from(preChars, { yPercent: 110, rotateX: -80, opacity: 0, duration: 0.9, stagger: 0.06, ease: "power4.out", delay: 0.1 });
  }
  function hidePre() {
    if (started) return; started = true;
    document.body.style.overflow = "";
    if (hasGsap && pre) {
      gsap.timeline({ onComplete: () => pre.remove() })
        .to(preChars.length ? preChars : preWord, { yPercent: -110, opacity: 0, duration: 0.5, stagger: 0.03, ease: "power3.in" })
        .to([bar?.parentElement, cnt], { opacity: 0, duration: 0.3 }, "<")
        .to(pre, { clipPath: "inset(0 0 100% 0)", duration: 1.05, ease: "expo.inOut" }, "-=0.15")
        .add(startIntro, "-=0.75");
    } else { pre?.classList.add("done"); startIntro(); }
  }
  window.addEventListener("load", () => setTimeout(() => { if (p < 100) { p = 100; clearInterval(load); hidePre(); } }, 2200));

  /* ---------------- Custom cursor + label ---------------- */
  const dot = $(".cursor-dot"), ring = $(".cursor-ring"), label = $("#cursor-label");
  if (dot && ring && !reduce && fine) {
    let rx = 0, ry = 0, dx = 0, dy = 0, lx = 0, ly = 0;
    window.addEventListener("pointermove", (e) => {
      dx = e.clientX; dy = e.clientY;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%,-50%)`;
    });
    (function follow() {
      rx += (dx - rx) * 0.18; ry += (dy - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      if (label) { lx += (dx - lx) * 0.14; ly += (dy - ly) * 0.14; label.style.transform = `translate(${lx}px, ${ly}px) translate(-50%,-50%)`; }
      requestAnimationFrame(follow);
    })();
    $$("a, button, .magnetic, .tilt, input, textarea").forEach((el) => {
      el.addEventListener("pointerenter", () => ring.classList.add("is-hover"));
      el.addEventListener("pointerleave", () => ring.classList.remove("is-hover"));
    });
    $$("[data-cursor]").forEach((el) => {
      el.addEventListener("pointerenter", () => { if (label) { label.textContent = el.dataset.cursor; label.classList.add("show"); } ring.classList.add("is-label"); });
      el.addEventListener("pointerleave", () => { label?.classList.remove("show"); ring.classList.remove("is-label"); });
    });
  }

  /* ---------------- Magnetic buttons ---------------- */
  if (!reduce && fine) $$(".magnetic").forEach((el) => {
    const strength = +el.dataset.strength || 0.35;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });

  /* ---------------- Mobile nav ---------------- */
  const burger = $("#burger"), menu = $("#mobile-menu");
  function closeMenu() {
    menu?.classList.add("translate-x-full"); menu?.classList.remove("translate-x-0");
    burger?.classList.remove("is-open"); document.body.style.overflow = ""; lenis?.start();
  }
  burger?.addEventListener("click", () => {
    const open = menu.classList.toggle("translate-x-0");
    menu.classList.toggle("translate-x-full", !open);
    burger.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
    open ? lenis?.stop() : lenis?.start();
    if (open && hasGsap) gsap.from("#mobile-menu a", { x: 40, opacity: 0, stagger: 0.06, duration: 0.5, ease: "power3.out", delay: 0.15 });
  });
  $$("#mobile-menu a").forEach((a) => a.addEventListener("click", closeMenu));

  /* ---------------- Typewriter ---------------- */
  function typewriter(el, words, period = 1800) {
    let i = 0, txt = "", del = false;
    (function tick() {
      const full = words[i % words.length];
      txt = del ? full.substring(0, txt.length - 1) : full.substring(0, txt.length + 1);
      el.textContent = txt;
      let delay = del ? 45 : 95;
      if (!del && txt === full) { delay = period; del = true; }
      else if (del && txt === "") { del = false; i++; delay = 350; }
      setTimeout(tick, delay);
    })();
  }
  const tw = $("#typewriter");
  if (tw) typewriter(tw, JSON.parse(tw.dataset.words));

  /* ---------------- Counters ---------------- */
  function animateCount(el) {
    const target = +el.dataset.target;
    const dur = 1500, start = performance.now();
    const suffix = el.dataset.suffix || "";
    (function step(now) {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.floor(eased * target).toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ---------------- 3D tilt (services, portrait, work) ---------------- */
  if (!reduce && fine) {
    $$(".tilt").forEach((card) => {
      const max = +card.dataset.tilt || 12;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transform = `perspective(900px) rotateY(${(px - 0.5) * max}deg) rotateX(${(0.5 - py) * max}deg)`;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });

    // Work cards: tilt + glare + inner image parallax. Smoothed by a tiny lerp loop
    // (not quickTo, whose overwrite would kill the cards' scroll tweens).
    $$(".work").forEach((card) => {
      const bg = $(".work__bg", card);
      const tgt = { rx: 0, ry: 0, bx: 0, by: 0 }, cur = { rx: 0, ry: 0, bx: 0, by: 0 };
      let raf = 0, hot = false;
      const loop = () => {
        let settled = true;
        for (const k in tgt) { cur[k] += (tgt[k] - cur[k]) * 0.14; if (Math.abs(tgt[k] - cur[k]) > 0.01) settled = false; }
        gsap.set(card, { rotateX: cur.rx, rotateY: cur.ry, transformPerspective: 900 });
        if (bg) bg.style.translate = `${cur.bx}px ${cur.by}px`;
        raf = (!settled || hot) ? requestAnimationFrame(loop) : 0;
      };
      const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
      card.addEventListener("pointerenter", () => { hot = true; kick(); });
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        tgt.ry = (px - 0.5) * 10; tgt.rx = (0.5 - py) * 10;
        tgt.bx = (px - 0.5) * -18; tgt.by = (py - 0.5) * -18;
        card.style.setProperty("--mx", px * 100 + "%");
        card.style.setProperty("--my", py * 100 + "%");
        kick();
      });
      card.addEventListener("pointerleave", () => { hot = false; tgt.rx = tgt.ry = tgt.bx = tgt.by = 0; kick(); });
    });
  }

  /* ---------------- Scrollspy ---------------- */
  const sections = $$("section[id]");
  const navlinks = $$(".nav-link");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) navlinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));

  /* ---------------- Nav: shadow + hide on scroll down, back to top ---------------- */
  const toTop = $("#toTop"), nav = $("#nav");
  let lastY = 0, navHidden = false;
  const navY = hasGsap && nav ? (v) => gsap.to(nav, { yPercent: v, duration: 0.55, ease: "power3.out", overwrite: false }) : null;
  function onScroll(y) {
    toTop?.classList.toggle("show", y > 600);
    nav?.classList.toggle("scrolled", y > 40);
    const hide = y > lastY + 4 && y > 300;
    const show = y < lastY - 4 || y <= 300;
    if (hide && !navHidden) { navHidden = true; navY ? navY(-130) : nav?.classList.add("is-hidden"); }
    else if (show && navHidden) { navHidden = false; navY ? navY(0) : nav?.classList.remove("is-hidden"); }
    lastY = y;
  }
  if (lenis) lenis.on("scroll", (e) => onScroll(e.scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
  toTop?.addEventListener("click", () => scrollTo(0, { offset: 0 }));

  /* ---------------- GSAP scroll motion ---------------- */
  function startIntro() {
    if (!hasGsap) {
      document.body.classList.add("no-anim");
      $$(".counter").forEach(animateCount);
      return;
    }
    lenis?.start();

    // Hero: per-character 3D flip, gradient preserved across chars
    const heroWords = $$(".hero-line .word");
    const heroChars = [];
    heroWords.forEach((w) => {
      const chars = splitChars(w);
      if (w.classList.contains("grad-text")) { gradientAcross(w, chars); w.classList.remove("grad-text"); w.classList.add("word--grad"); }
      if (w.classList.contains("stroke-text")) { chars.forEach((c) => c.classList.add("stroke-text")); w.classList.remove("stroke-text"); }
      heroChars.push(...chars);
    });
    const regrad = () => heroWords.forEach((w) => w.classList.contains("word--grad") && gradientAcross(w, $$(".char", w)));
    window.addEventListener("resize", regrad);
    document.fonts?.ready.then(regrad);

    gsap.timeline({ defaults: { ease: "power4.out" } })
      .from(".hero-kicker", { y: 24, opacity: 0, duration: 0.7 })
      .from(heroChars, { yPercent: 120, rotateX: -90, opacity: 0, stagger: 0.035, duration: 1.1, transformOrigin: "50% 100% -30px" }, "-=0.3")
      .from(".hero-sub", { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 }, "-=0.6")
      .from(".hero-cta > *", { y: 24, opacity: 0, stagger: 0.12, duration: 0.6 }, "-=0.4")
      .from("#nav", { y: -30, opacity: 0, duration: 0.8 }, "-=0.8")
      .from(".hero-scroll", { opacity: 0, duration: 0.6 }, "-=0.4");

    // Hero content drifts up and fades as the 3D object rolls away
    gsap.to(".hero-content", {
      yPercent: -25, opacity: 0, ease: "none",
      scrollTrigger: { trigger: "#home", start: "top top", end: "bottom top", scrub: true },
    });

    // Scroll progress
    gsap.to("#progress", { scaleX: 1, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 } });

    // Generic reveals
    $$(".reveal").forEach((el) => {
      gsap.to(el, { y: 0, opacity: 1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 86%" } });
    });

    // Section headings: wipe up from a clipped mask
    $$(".reveal-head").forEach((h) => {
      gsap.fromTo(h,
        { clipPath: "inset(0 0 100% 0)", y: 40 },
        { clipPath: "inset(0 0 -10% 0)", y: 0, duration: 1.1, ease: "power4.out", scrollTrigger: { trigger: h, start: "top 88%" } });
    });

    // Staggered groups: 3D rise
    $$("[data-stagger]").forEach((group) => {
      gsap.from(group.children, {
        y: 60, rotateX: 18, opacity: 0, duration: 0.9, stagger: 0.07, ease: "power3.out", transformPerspective: 900, transformOrigin: "50% 100%",
        scrollTrigger: { trigger: group, start: "top 82%" },
      });
    });

    // Experience: alternate sides swing in
    $$(".tl__item").forEach((item, i) => {
      gsap.from(item.children, {
        x: (j) => ((i + j) % 2 ? 60 : -60), rotateY: (j) => ((i + j) % 2 ? -18 : 18), opacity: 0,
        duration: 1, ease: "power3.out", transformPerspective: 900,
        scrollTrigger: { trigger: item, start: "top 85%" },
      });
    });
    const tlSpan = $(".tl__line > span");
    if (tlSpan) gsap.to(tlSpan, { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".tl", start: "top 70%", end: "bottom 80%", scrub: true } });

    // Counters
    $$(".counter").forEach((el) => ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => animateCount(el) }));

    // Parallax tags
    $$("[data-parallax]").forEach((el) => {
      gsap.to(el, { yPercent: +el.dataset.parallax, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Ghost section words drift sideways
    $$(".ghost").forEach((g) => {
      gsap.fromTo(g, { xPercent: g.dataset.dir === "left" ? 8 : -8 }, {
        xPercent: g.dataset.dir === "left" ? -8 : 8, ease: "none",
        scrollTrigger: { trigger: g.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      });
    });

    // Work grid: middle column scrolls at a different speed (desktop only)
    if (!isMobile && window.matchMedia("(min-width: 1024px)").matches) {
      const cards = $$("#workGrid .work");
      cards.forEach((c, i) => {
        if (i % 3 !== 1) return;
        gsap.fromTo(c, { yPercent: 9 }, { yPercent: -9, ease: "none", scrollTrigger: { trigger: "#workGrid", start: "top bottom", end: "bottom top", scrub: true } });
      });
    }

    // Marquee: skew and speed follow scroll velocity
    const tracks = $$(".marquee");
    if (tracks.length) {
      const skew = gsap.quickTo(tracks, "skewX", { duration: 0.6, ease: "power3.out" });
      const velocityHandler = (v) => skew(gsap.utils.clamp(-14, 14, v * 0.012));
      if (lenis) lenis.on("scroll", (e) => velocityHandler(e.velocity * 60));
      else ScrollTrigger.create({ onUpdate: (self) => velocityHandler(self.getVelocity() * 0.1) });
    }

    // Services: icons bob gently, staggered
    $$(".service-card .ico").forEach((ic, i) => {
      gsap.to(ic, { y: -6, rotateZ: 4, duration: 2.2 + i * 0.15, yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.2 });
    });

    // Contact panels tilt in from opposite sides
    gsap.from("#contact .panel", {
      y: 50, rotateX: 12, opacity: 0, duration: 1, stagger: 0.15, ease: "power3.out", transformPerspective: 900,
      scrollTrigger: { trigger: "#contact", start: "top 70%" },
    });

    // Footer line
    gsap.from("footer > div > *", { y: 20, opacity: 0, stagger: 0.1, duration: 0.7, scrollTrigger: { trigger: "footer", start: "top 95%" } });

    ScrollTrigger.refresh();
  }

  /* ---------------- Contact form ---------------- */
  const form = $("#contactForm");
  if (form) {
    const state = $("#sendState");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      if (!data.get("name") || !data.get("email") || !data.get("message")) {
        show(state, "Please fill in your name, email and message.", "#f87171"); return;
      }
      const btn = $("#sendBtn", form);
      btn.disabled = true;
      show(state, "Sending your message…", "var(--accent-2)");
      try {
        const res = await fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } });
        if (res.ok) {
          show(state, "✓ Thanks! Your message was sent. I'll get back to you soon.", "#4ade80");
          form.reset();
        } else { show(state, "Something went wrong. Please email me directly instead.", "#f87171"); }
      } catch {
        show(state, "Network error. Please try again or email me directly.", "#f87171");
      } finally { btn.disabled = false; }
    });
    function show(el, msg, color) { el.style.color = color; el.textContent = msg; }
  }

  /* ---------------- Footer year ---------------- */
  const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();
})();
