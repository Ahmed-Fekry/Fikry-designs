/* =========================================================
   Ahmed Fikry — Portfolio interactions
   Lenis · preloader curtain · overlay menu · Cairo clock ·
   split-char titles · pinned manifesto · pinned horizontal
   services · stacking cards · archive cursor preview ·
   reveals · counters · magnetic · cursor · form
   ========================================================= */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const desktop = () => window.matchMedia("(min-width: 1024px)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const hasGsap = !!window.gsap && !reduce;
  if (hasGsap) gsap.registerPlugin(window.ScrollTrigger);

  /* ---------------- Smooth scroll ---------------- */
  let lenis = null;
  if (hasGsap && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  function scrollTo(target, opts = {}) {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, ...opts });
    else if (typeof target === "number") window.scrollTo({ top: target, behavior: "smooth" });
    else $(target)?.scrollIntoView({ behavior: "smooth" });
  }
  $$('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    a.addEventListener("click", (e) => { if ($(id)) { e.preventDefault(); closeMenu(); scrollTo(id); } });
  });

  /* ---------------- Clock (Cairo) ---------------- */
  const clock = $("#clock");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick(); setInterval(tick, 1000);
  }
  const y = new Date().getFullYear();
  $$("#year, #year-top").forEach((el) => (el.textContent = y));

  /* ---------------- Split helpers ---------------- */
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = "";
    el.setAttribute("aria-hidden", "true");
    return [...text].map((ch) => {
      const s = document.createElement("span");
      s.className = "char"; s.textContent = ch === " " ? " " : ch;
      el.appendChild(s); return s;
    });
  }
  function splitWords(el) {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return $$(".w", el);
  }

  /* ---------------- Preloader ---------------- */
  const pre = $("#preloader"), bar = $("#preloader .pre-bar > span"), cnt = $("#pre-count"), preWord = $(".pre-word");
  let preChars = preWord ? splitChars(preWord) : [];
  document.body.style.overflow = "hidden";
  let p = 0, started = false;
  const load = setInterval(() => {
    p += Math.random() * 9 + 3;
    if (p >= 100) { p = 100; clearInterval(load); setTimeout(hidePre, 240); }
    if (bar) bar.style.width = p + "%";
    if (cnt) cnt.textContent = String(Math.floor(p)).padStart(3, "0");
  }, 85);
  if (hasGsap && preChars.length) gsap.from(preChars, { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.05, ease: "power4.out", delay: 0.1 });
  function hidePre() {
    if (started) return; started = true;
    document.body.style.overflow = "";
    if (hasGsap && pre) {
      gsap.timeline({ onComplete: () => pre.remove() })
        .to(preChars, { yPercent: -110, opacity: 0, duration: 0.5, stagger: 0.025, ease: "power3.in" })
        .to(".pre-meta, .pre-bar", { opacity: 0, duration: 0.3 }, "<")
        .to(pre, { clipPath: "inset(0 0 100% 0)", duration: 1.05, ease: "expo.inOut" }, "-=0.15")
        .add(startIntro, "-=0.7");
    } else { pre?.remove(); startIntro(); }
  }
  window.addEventListener("load", () => setTimeout(() => { if (p < 100) { p = 100; clearInterval(load); hidePre(); } }, 2200));

  /* ---------------- Cursor + label ---------------- */
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
    const bind = () => {
      $$("a, button, input, textarea, .svc").forEach((el) => {
        if (el.dataset.bound) return; el.dataset.bound = 1;
        el.addEventListener("pointerenter", () => ring.classList.add("is-hover"));
        el.addEventListener("pointerleave", () => ring.classList.remove("is-hover"));
      });
      $$("[data-cursor]").forEach((el) => {
        if (el.dataset.boundL) return; el.dataset.boundL = 1;
        el.addEventListener("pointerenter", () => { if (label) { label.textContent = el.dataset.cursor; label.classList.add("show"); } ring.classList.add("is-label"); });
        el.addEventListener("pointerleave", () => { label?.classList.remove("show"); ring.classList.remove("is-label"); });
      });
    };
    bind();
  }

  /* ---------------- Magnetic ---------------- */
  if (!reduce && fine) $$(".magnetic").forEach((el) => {
    const strength = +el.dataset.strength || 0.3;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * strength}px, ${(e.clientY - r.top - r.height / 2) * strength}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });

  /* ---------------- Overlay menu ---------------- */
  const menuBtn = $("#menu-btn"), menu = $("#menu");
  function openMenu() {
    menu.classList.add("open"); menu.setAttribute("aria-hidden", "false"); menuBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden"; lenis?.stop();
    if (hasGsap) gsap.fromTo(".menu-list a, .menu-foot > *", { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, duration: 0.8, ease: "power4.out", delay: 0.25, overwrite: true });
  }
  function closeMenu() {
    if (!menu?.classList.contains("open")) return;
    menu.classList.remove("open"); menu.setAttribute("aria-hidden", "true"); menuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = ""; lenis?.start();
  }
  menuBtn?.addEventListener("click", () => (menu.classList.contains("open") ? closeMenu() : openMenu()));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ---------------- Typewriter ---------------- */
  function typewriter(el, words, period = 1800) {
    let i = 0, txt = "", del = false;
    (function tick() {
      const full = words[i % words.length];
      txt = del ? full.substring(0, txt.length - 1) : full.substring(0, txt.length + 1);
      el.textContent = txt;
      let delay = del ? 40 : 90;
      if (!del && txt === full) { delay = period; del = true; }
      else if (del && txt === "") { del = false; i++; delay = 350; }
      setTimeout(tick, delay);
    })();
  }
  const tw = $("#typewriter");
  if (tw) typewriter(tw, JSON.parse(tw.dataset.words));

  /* ---------------- Counters ---------------- */
  function animateCount(el) {
    const target = +el.dataset.target, dur = 1500, start = performance.now();
    (function step(now) {
      const t = Math.min((now - start) / dur, 1);
      el.textContent = Math.floor((1 - Math.pow(1 - t, 3)) * target);
      if (t < 1) requestAnimationFrame(step);
    })(start);
  }

  /* ---------------- Spotlight on service cards ---------------- */
  if (fine) $$(".svc").forEach((card) => card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
  }));

  /* ---------------- Archive: cursor preview ---------------- */
  const peek = $("#peek"), peekImg = peek && $("img", peek);
  if (peek && fine && !reduce) {
    let px = 0, py = 0, tx = 0, ty = 0, on = false;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      px += (tx - px) * 0.12; py += (ty - py) * 0.12;
      if (on) peek.style.transform = `translate(${px + 28}px, ${py - 110}px)`;
      requestAnimationFrame(loop);
    })();
    $$(".row").forEach((row) => {
      row.addEventListener("pointerenter", () => { peekImg.src = row.dataset.peek; peek.classList.add("show"); on = true; });
      row.addEventListener("pointerleave", () => { peek.classList.remove("show"); on = false; });
    });
  }

  /* ---------------- Progress + back to top ---------------- */
  $("#toTop")?.addEventListener("click", (e) => { e.preventDefault(); scrollTo(0); });

  /* ---------------- Copy email ---------------- */
  const copyBtn = $("#copy-email");
  copyBtn?.addEventListener("click", async () => {
    const email = $(".email")?.textContent.trim();
    try { await navigator.clipboard.writeText(email); copyBtn.textContent = "Copied"; }
    catch { copyBtn.textContent = email; }
    setTimeout(() => (copyBtn.textContent = "Copy email"), 1800);
  });

  /* ---------------- Scroll choreography ---------------- */
  function startIntro() {
    if (!hasGsap) {
      document.body.classList.add("no-anim");
      $$(".counter").forEach(animateCount);
      $$("[data-words]").forEach((el) => splitWords(el).forEach((w) => (w.style.opacity = 1)));
      return;
    }
    lenis?.start();

    // Hero title: per-character 3D rise
    const heroChars = $$(".hero-title [data-split]").flatMap(splitChars);
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .from(".hero-top > *", { y: 16, opacity: 0, stagger: 0.08, duration: 0.7 })
      .from(heroChars, { yPercent: 110, rotateX: -70, opacity: 0, stagger: 0.04, duration: 1.2, transformOrigin: "50% 100% -40px" }, "-=0.4")
      .from(".hero-copy > *", { y: 24, opacity: 0, stagger: 0.1, duration: 0.7 }, "-=0.7")
      .from(".badge, .rail", { opacity: 0, duration: 0.8 }, "-=0.5")
      .from("#nav > *", { y: -16, opacity: 0, stagger: 0.08, duration: 0.7 }, "-=0.8");

    // Hero drifts up as it leaves
    gsap.to(".hero-title, .hero-copy", { yPercent: -18, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // Progress bar
    gsap.to("#progress", { scaleX: 1, ease: "none", scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 } });

    // Manifesto: pinned, words light up
    const mani = $(".manifesto");
    if (mani) {
      const words = splitWords($(".manifesto__text"));
      gsap.to(words, { opacity: 1, stagger: 0.06, ease: "none", scrollTrigger: { trigger: mani, start: "top top", end: "+=140%", pin: true, scrub: 0.4 } });
    }

    // Reveals
    $$(".reveal").forEach((el) => gsap.to(el, { y: 0, opacity: 1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }));
    $$(".section-head").forEach((h) => gsap.from(h.children, { y: 30, opacity: 0, stagger: 0.12, duration: 1, ease: "power3.out", scrollTrigger: { trigger: h, start: "top 85%" } }));
    $$(".counter").forEach((el) => ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => animateCount(el) }));

    // Portrait: inner parallax
    const pimg = $("[data-parallax-img]");
    if (pimg) gsap.fromTo(pimg, { yPercent: -10 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: pimg.parentElement, start: "top bottom", end: "bottom top", scrub: true } });

    // Services: pinned horizontal scroll on desktop
    const track = $(".services__track"), svcSection = $(".services");
    if (track && svcSection) {
      ScrollTrigger.matchMedia({
        "(min-width: 1024px)": () => {
          const tween = gsap.to(track, {
            x: () => -(track.scrollWidth - window.innerWidth + parseFloat(getComputedStyle($(".services__pin")).paddingLeft) * 2),
            ease: "none",
            scrollTrigger: { trigger: svcSection, start: "top top", end: () => "+=" + (track.scrollWidth - window.innerWidth / 2), pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 },
          });
          gsap.from(".svc", { y: 60, opacity: 0, stagger: 0.08, duration: 1, ease: "power3.out", scrollTrigger: { trigger: svcSection, start: "top 70%" } });
          return () => tween.kill();
        },
        "(max-width: 1023px)": () => {
          gsap.from(".svc", { y: 40, opacity: 0, stagger: 0.08, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: track, start: "top 85%" } });
        },
      });
    }

    // Work: stacking cards (desktop) and simple rise (mobile)
    const cards = $$(".card");
    ScrollTrigger.matchMedia({
      "(min-width: 900px)": () => {
        cards.forEach((card, i) => {
          const next = cards[i + 1];
          if (!next) return;
          gsap.to(card, { scale: 0.94 - (cards.length - i) * 0.004, opacity: 0.55, filter: "blur(2px)", ease: "none",
            scrollTrigger: { trigger: next, start: "top 85%", end: "top 14%", scrub: true } });
        });
      },
      "(max-width: 899px)": () => {
        gsap.from(cards, { y: 50, opacity: 0, stagger: 0.1, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: "#stack", start: "top 85%" } });
      },
    });
    gsap.from(".row", { x: -20, opacity: 0, stagger: 0.05, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: ".archive__list", start: "top 85%" } });

    // Contact title chars
    const cChars = $$(".contact__title [data-split]").flatMap(splitChars);
    gsap.from(cChars, { yPercent: 110, rotateX: -60, opacity: 0, stagger: 0.025, duration: 1.1, ease: "power4.out", transformOrigin: "50% 100% -40px",
      scrollTrigger: { trigger: ".contact__title", start: "top 80%" } });
    gsap.from(".contact-grid > *", { y: 40, opacity: 0, stagger: 0.15, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".contact-grid", start: "top 85%" } });

    // Marquee skew with scroll velocity
    const marquees = $$(".marquee");
    if (marquees.length) {
      const skew = gsap.quickTo(marquees, "skewX", { duration: 0.6, ease: "power3.out" });
      if (lenis) lenis.on("scroll", (e) => skew(gsap.utils.clamp(-12, 12, e.velocity * 0.7)));
    }

    ScrollTrigger.refresh();
  }

  /* ---------------- Contact form ---------------- */
  const form = $("#contactForm");
  if (form) {
    const state = $("#sendState");
    const show = (msg, color) => { state.style.color = color; state.textContent = msg; };
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      if (!data.get("name") || !data.get("email") || !data.get("message")) return show("Please add your name, email and a message.", "#f87171");
      const btn = $("#sendBtn", form); btn.disabled = true;
      show("Sending…", "var(--accent-2)");
      try {
        const res = await fetch(form.action, { method: "POST", body: data, headers: { Accept: "application/json" } });
        if (res.ok) { show("Sent. I'll get back to you soon.", "#4ade80"); form.reset(); }
        else show("Something went wrong. Please email me directly.", "#f87171");
      } catch { show("Network error. Please try again or email me directly.", "#f87171"); }
      finally { btn.disabled = false; }
    });
  }
})();
