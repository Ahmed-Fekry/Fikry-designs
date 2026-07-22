/* =========================================================
   Ahmed Fikry — Portfolio interactions
   Preloader · custom cursor · magnetic · typewriter ·
   GSAP scroll motion · counters · tilt · scrollspy ·
   theme toggle · creative contact form
   ========================================================= */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------------- Preloader ---------------- */
  const pre = $("#preloader");
  const bar = $("#preloader .pre-bar > span");
  const cnt = $("#preloader .pre-count");
  let p = 0;
  const load = setInterval(() => {
    p += Math.random() * 12 + 4;
    if (p >= 100) { p = 100; clearInterval(load); setTimeout(hidePre, 350); }
    if (bar) bar.style.width = p + "%";
    if (cnt) cnt.textContent = String(Math.floor(p)).padStart(3, "0") + " %";
  }, 120);
  function hidePre() {
    pre?.classList.add("done");
    document.body.style.overflow = "";
    startIntro();
  }
  document.body.style.overflow = "hidden";
  // safety: never trap the user
  window.addEventListener("load", () => setTimeout(() => { if (p < 100) { p = 100; clearInterval(load); hidePre(); } }, 2500));

  /* ---------------- Custom cursor ---------------- */
  const dot = $(".cursor-dot"), ring = $(".cursor-ring");
  if (dot && ring && !reduce && matchMedia("(hover:hover)").matches) {
    let rx = 0, ry = 0, dx = 0, dy = 0;
    window.addEventListener("pointermove", (e) => {
      dx = e.clientX; dy = e.clientY;
      dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%,-50%)`;
    });
    (function follow() {
      rx += (dx - rx) * 0.18; ry += (dy - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(follow);
    })();
    $$("a, button, .magnetic, .tilt, input, textarea").forEach((el) => {
      el.addEventListener("pointerenter", () => ring.classList.add("is-hover"));
      el.addEventListener("pointerleave", () => ring.classList.remove("is-hover"));
    });
  }

  /* ---------------- Magnetic buttons ---------------- */
  if (!reduce) $$(".magnetic").forEach((el) => {
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
  burger?.addEventListener("click", () => {
    const open = menu.classList.toggle("translate-x-0");
    menu.classList.toggle("translate-x-full", !open);
    burger.classList.toggle("is-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  $$("#mobile-menu a").forEach((a) => a.addEventListener("click", () => {
    menu.classList.add("translate-x-full"); menu.classList.remove("translate-x-0");
    burger.classList.remove("is-open"); document.body.style.overflow = "";
  }));

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

  /* ---------------- Tilt cards ---------------- */
  if (!reduce) $$(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.transform = `perspective(800px) rotateY(${(px - 0.5) * 14}deg) rotateX(${(0.5 - py) * 14}deg)`;
      card.style.setProperty("--mx", px * 100 + "%");
      card.style.setProperty("--my", py * 100 + "%");
    });
    card.addEventListener("pointerleave", () => { card.style.transform = ""; });
  });

  /* ---------------- Scrollspy ---------------- */
  const sections = $$("section[id]");
  const navlinks = $$(".nav-link");
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        navlinks.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + en.target.id));
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((s) => spy.observe(s));

  /* ---------------- Back to top + nav shadow ---------------- */
  const toTop = $("#toTop"), nav = $("#nav");
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    toTop?.classList.toggle("show", y > 600);
    nav?.classList.toggle("scrolled", y > 40);
  });
  toTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------------- GSAP scroll motion ---------------- */
  function startIntro() {
    if (reduce || !window.gsap) {
      document.body.classList.add("no-anim");
      $$(".counter").forEach(animateCount);
      return;
    }
    const { gsap } = window;
    gsap.registerPlugin(window.ScrollTrigger);

    // Hero intro
    gsap.timeline({ defaults: { ease: "power4.out" } })
      .from(".hero-kicker", { y: 20, opacity: 0, duration: 0.6 })
      .from(".hero-line .word", { yPercent: 120, opacity: 0, stagger: 0.08, duration: 0.9 }, "-=0.2")
      .from(".hero-sub", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
      .from(".hero-cta > *", { y: 20, opacity: 0, stagger: 0.12, duration: 0.5 }, "-=0.3");

    // generic reveals
    $$(".reveal").forEach((el) => {
      gsap.to(el, {
        y: 0, opacity: 1, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    // staggered groups
    $$("[data-stagger]").forEach((group) => {
      gsap.from(group.children, {
        y: 40, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power3.out",
        scrollTrigger: { trigger: group, start: "top 80%" },
      });
    });

    // section heading words
    $$(".reveal-head").forEach((h) => {
      gsap.from(h, {
        backgroundPositionX: "100%", duration: 1,
        scrollTrigger: { trigger: h, start: "top 85%" },
      });
    });

    // timeline line draw
    const tlSpan = $(".tl__line > span");
    if (tlSpan) gsap.to(tlSpan, {
      scaleY: 1, ease: "none",
      scrollTrigger: { trigger: ".tl", start: "top 70%", end: "bottom 80%", scrub: true },
    });

    // counters on view
    $$(".counter").forEach((el) => {
      ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => animateCount(el) });
    });

    // subtle parallax on tagged elements
    $$("[data-parallax]").forEach((el) => {
      gsap.to(el, {
        yPercent: +el.dataset.parallax,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }

  /* ---------------- Creative contact form ---------------- */
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
          show(state, "✓ Thanks! Your message was sent — I'll get back to you soon.", "#4ade80");
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
