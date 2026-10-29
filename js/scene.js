/* =========================================================
   Shapeshifter — Three.js (classic build)
   One cloud of particles that re-forms into a different object
   for each section of the page:
     hero → AF monogram        manifesto → loose cloud
     about → cursor arrow      services → play button
     experience → rising bars  work → phone with UI
     contact → envelope
   Every shape is sampled from real 3D geometry, so the cloud
   has volume and silhouettes. Between shapes, particles burst
   outward with turbulence and settle into the next form.
   The cloud lives on a fixed canvas and travels with scroll.
   Purple on near-black.
   ========================================================= */
const THREE = window.THREE;
const canvas = document.getElementById("hero-canvas");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 767px)").matches;
const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (canvas && THREE && !reduce) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  const PURPLE = new THREE.Color("#a855f7"), LILAC = new THREE.Color("#e9d5ff"), DEEP = new THREE.Color("#7c3aed");
  const N = isMobile ? 5000 : 13000;

  /* ---------- Geometry helpers ---------- */
  const box = (w, h, d, x = 0, y = 0, z = 0, rz = 0) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.applyMatrix4(new THREE.Matrix4().makeRotationZ(rz));
    g.translate(x, y, z); return g;
  };
  const extrude = (pts, depth, x = 0, y = 0, z = 0) => {
    const sh = new THREE.Shape(pts.map(([a, b]) => new THREE.Vector2(a, b)));
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
    g.translate(x, y, z - depth / 2); return g;
  };
  const frame = (w, h, t, depth) => {
    const sh = new THREE.Shape([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([a, b]) => new THREE.Vector2(a, b)));
    const hole = new THREE.Path([[-w / 2 + t, -h / 2 + t], [w / 2 - t, -h / 2 + t], [w / 2 - t, h / 2 - t], [-w / 2 + t, h / 2 - t]].map(([a, b]) => new THREE.Vector2(a, b)));
    sh.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
    g.translate(0, 0, -depth / 2); return g;
  };

  /* Sample n points on the surfaces of a list of geometries, weighted by triangle area. */
  function sample(geos, n) {
    const tris = [];
    let total = 0;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    geos.forEach((g) => {
      const G = g.index ? g.toNonIndexed() : g;
      const pos = G.attributes.position;
      for (let i = 0; i < pos.count; i += 3) {
        a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
        const area = b.clone().sub(a).cross(c.clone().sub(a)).length() * 0.5;
        total += area; tris.push({ a: a.clone(), b: b.clone(), c: c.clone(), cum: total });
      }
    });
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = Math.random() * total;
      let lo = 0, hi = tris.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (tris[mid].cum < r) lo = mid + 1; else hi = mid; }
      const t = tris[lo];
      let u = Math.random(), v = Math.random();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      out[i * 3] = t.a.x + (t.b.x - t.a.x) * u + (t.c.x - t.a.x) * v;
      out[i * 3 + 1] = t.a.y + (t.b.y - t.a.y) * u + (t.c.y - t.a.y) * v;
      out[i * 3 + 2] = t.a.z + (t.b.z - t.a.z) * u + (t.c.z - t.a.z) * v;
    }
    return out;
  }
  /* Order points so neighbouring particles travel together between shapes. */
  function ordered(arr) {
    const pts = [];
    for (let i = 0; i < arr.length; i += 3) pts.push([arr[i], arr[i + 1], arr[i + 2]]);
    pts.sort((p, q) => (Math.atan2(p[2], p[0]) + p[1] * 0.9) - (Math.atan2(q[2], q[0]) + q[1] * 0.9));
    return new Float32Array(pts.flat());
  }

  /* ---------- The shapes (unit space, roughly 3.4 units tall) ---------- */
  const SHAPES = [];
  // 0 · AF monogram
  SHAPES.push([
    box(0.5, 3.5, 0.5, -1.62, 0, 0, -0.3), box(0.5, 3.5, 0.5, -0.58, 0, 0, 0.3), box(1.0, 0.42, 0.5, -1.1, -0.55, 0),
    box(0.52, 3.4, 0.5, 0.55, 0, 0), box(1.5, 0.52, 0.5, 1.04, 1.44, 0), box(1.15, 0.46, 0.5, 0.86, 0.2, 0),
  ]);
  // 1 · loose cloud (volume scatter)
  {
    const arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const r = 1.2 + Math.pow(Math.random(), 0.5) * 1.6, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(p) * Math.cos(t); arr[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.7; arr[i * 3 + 2] = r * Math.cos(p);
    }
    SHAPES.push(arr);
  }
  // 2 · cursor arrow
  SHAPES.push([extrude([[0, 1.7], [0, -1.1], [0.55, -0.6], [0.95, -1.5], [1.4, -1.3], [1.0, -0.4], [1.65, -0.4]], 0.45, -0.8, 0.0, 0)]);
  // 3 · play button in a ring
  SHAPES.push([extrude([[-0.85, -1.1], [-0.85, 1.1], [1.15, 0]], 0.5, -0.1, 0, 0), new THREE.TorusGeometry(2.0, 0.09, 10, 120)]);
  // 4 · rising bars
  SHAPES.push([box(0.75, 1.2, 0.75, -1.25, -0.9, 0), box(0.75, 2.2, 0.75, 0, -0.4, 0), box(0.75, 3.3, 0.75, 1.25, 0.15, 0)]);
  // 5 · phone with UI
  SHAPES.push([
    frame(2.0, 3.8, 0.14, 0.26),
    box(1.4, 0.22, 0.08, 0, 1.35, 0.05), box(1.5, 0.7, 0.08, 0, 0.6, 0.05), box(1.5, 0.7, 0.08, 0, -0.25, 0.05),
    box(0.9, 0.3, 0.08, 0, -1.15, 0.05), box(0.5, 0.06, 0.06, 0, -1.65, 0.05),
  ]);
  // 6 · envelope
  SHAPES.push([
    frame(3.3, 2.2, 0.1, 0.22),
    box(3.1, 2.0, 0.06, 0, 0, -0.1),
    extrude([[-1.6, 1.05], [1.6, 1.05], [0, -0.15]], 0.08, 0, 0, 0.2),
    box(1.75, 0.06, 0.08, -0.82, -0.45, 0.16, 0.6), box(1.75, 0.06, 0.08, 0.82, -0.45, 0.16, -0.6),
  ]);

  const geo = new THREE.BufferGeometry();
  const seeds = new Float32Array(N);
  for (let i = 0; i < N; i++) seeds[i] = Math.random();
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  SHAPES.forEach((s, i) => {
    const arr = s instanceof Float32Array ? s : sample(s, N);
    geo.setAttribute("aS" + i, new THREE.BufferAttribute(ordered(arr), 3));
  });
  geo.setAttribute("position", geo.getAttribute("aS0"));

  const uniforms = {
    uTime: { value: 0 }, uFrom: { value: 0 }, uTo: { value: 0 }, uMix: { value: 1 },
    uAgit: { value: 0 }, uPx: { value: renderer.getPixelRatio() }, uOpacity: { value: 1 },
    uPurple: { value: PURPLE }, uLilac: { value: LILAC }, uDeep: { value: DEEP },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 aS0, aS1, aS2, aS3, aS4, aS5, aS6; attribute float aSeed;
      uniform int uFrom, uTo; uniform float uMix, uTime, uAgit, uPx;
      varying float vBurst; varying float vSeed; varying float vDepth;
      vec3 pick(int i){
        if (i == 0) return aS0; if (i == 1) return aS1; if (i == 2) return aS2; if (i == 3) return aS3;
        if (i == 4) return aS4; if (i == 5) return aS5; return aS6;
      }
      void main(){
        vec3 a = pick(uFrom), b = pick(uTo);
        float tt = clamp((uMix - aSeed * 0.3) / 0.7, 0.0, 1.0);
        tt = tt * tt * (3.0 - 2.0 * tt);
        vec3 p = mix(a, b, tt);
        float burst = sin(tt * 3.14159);
        vec3 turb = vec3(sin(aSeed * 12.9 + uTime * 2.1), cos(aSeed * 7.1 + uTime * 1.7), sin(aSeed * 3.3 + uTime * 2.3));
        p += turb * (burst * 1.1 + uAgit * 0.4);
        p += normalize(p + 0.001) * sin(uTime * 1.4 + aSeed * 25.0) * 0.02;   // breathing
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (1.1 + fract(aSeed * 7.3) * 1.9) * uPx * 2.3 * (7.0 / -mv.z) * (1.0 + burst * 0.9);
        gl_Position = projectionMatrix * mv;
        vBurst = burst; vSeed = aSeed; vDepth = p.z;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uPurple, uLilac, uDeep; uniform float uOpacity;
      varying float vBurst; varying float vSeed; varying float vDepth;
      void main(){
        vec2 c = gl_PointCoord - 0.5; float d = length(c);
        float a = smoothstep(0.5, 0.05, d); a *= a;
        vec3 col = mix(uDeep, uPurple, fract(vSeed * 3.7));
        col = mix(col, uLilac, step(0.82, fract(vSeed * 9.1)) * 0.9);   // a few bright specks
        col = mix(col, vec3(1.0), vBurst * 0.5);
        float front = smoothstep(-0.4, 0.4, vDepth);                   // nearer faces brighter
        gl_FragColor = vec4(col * (0.55 + 0.45 * front), a * (0.55 + 0.45 * front) * uOpacity);
      }`,
  });
  const cloud = new THREE.Points(geo, mat);
  const group = new THREE.Group();
  group.add(cloud);
  scene.add(group);

  /* Soft glow behind the cloud */
  const glowTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d"), grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(168,85,247,0.4)"); grd.addColorStop(0.4, "rgba(124,58,237,0.15)"); grd.addColorStop(1, "rgba(124,58,237,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
  })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.set(7, 7, 1); glow.position.z = -1;
  group.add(glow);

  /* ---------- Resize ---------- */
  let baseZ = 8, visW = 5, visH = 5;
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    baseZ = Math.max(8, 6.2 / camera.aspect);
    camera.updateProjectionMatrix();
    visH = 2 * baseZ * Math.tan((camera.fov * Math.PI) / 360);
    visW = visH * camera.aspect;
    uniforms.uPx.value = renderer.getPixelRatio();
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- Pointer ---------- */
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  let agitation = 0, lastX = 0, lastY = 0, lastT = performance.now();
  if (fine) window.addEventListener("pointermove", (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    const now = performance.now();
    const v = Math.hypot(e.clientX - lastX, e.clientY - lastY) / Math.max(now - lastT, 1);
    agitation = Math.min(agitation + v * 0.05, 1);
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  });

  /* ---------- Waypoints: shape + placement per section ----------
     x/y are fractions of the viewport (-0.5..0.5); s scale; o opacity; r idle roll speed. */
  const WAY = [
    { id: "hero",       shape: 0, d: { x: 0.27, y: 0.06, s: 1.0,  o: 1,    r: 0.25 }, m: { x: 0, y: 0.22, s: 0.6, o: 1, r: 0.25 } },
    { id: "manifesto",  shape: 1, d: { x: -0.38, y: -0.2, s: 0.7, o: 0.45, r: 0.1 },  m: { x: 0.3, y: -0.3, s: 0.4, o: 0.4, r: 0.1 } },
    { id: "about",      shape: 2, d: { x: -0.33, y: 0.12, s: 0.7,  o: 0.9,  r: 0.3 },  m: { x: 0.36, y: 0.32, s: 0.35, o: 0.6, r: 0.3 } },
    { id: "services",   shape: 3, d: { x: 0.42, y: 0.34, s: 0.4, o: 0.6,  r: 0.35 }, m: { x: 0.38, y: -0.38, s: 0.25, o: 0.4, r: 0.35 } },
    { id: "experience", shape: 4, d: { x: 0.42, y: 0.22, s: 0.45, o: 0.7, r: 0.2 }, m: { x: 0.38, y: -0.38, s: 0.28, o: 0.4, r: 0.2 } },
    { id: "work",       shape: 5, d: { x: 0.42, y: 0.36, s: 0.38, o: 0.45, r: 0.3 },  m: { x: 0.36, y: 0.4, s: 0.22, o: 0.35, r: 0.3 } },
    { id: "contact",    shape: 6, d: { x: 0.32, y: 0.12, s: 0.8, o: 0.85, r: 0.2 },  m: { x: 0.3, y: 0.3, s: 0.5, o: 0.7, r: 0.2 } },
  ].map((w) => ({ ...w, el: document.getElementById(w.id) })).filter((w) => w.el);

  const state = { x: 0.27, y: 0.06, s: 1, o: 1, r: 0.25 };
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);
  function targetFor() {
    // Live viewport rects: pinned sections (manifesto, services) report where they are on screen.
    const centre = window.innerHeight * 0.5;
    const key = isMobile ? "m" : "d";
    const pts = WAY.map((w) => { const r = w.el.getBoundingClientRect(); return { c: r.top + r.height * 0.5, v: w[key], shape: w.shape }; });
    let nearest = pts[0];
    pts.forEach((p) => { if (Math.abs(p.c - centre) < Math.abs(nearest.c - centre)) nearest = p; });
    let v = pts[0].v;
    if (centre >= pts[pts.length - 1].c) v = pts[pts.length - 1].v;
    else for (let i = 0; i < pts.length - 1; i++) {
      if (centre >= pts[i].c && centre <= pts[i + 1].c) {
        const t = ease((centre - pts[i].c) / Math.max(pts[i + 1].c - pts[i].c, 1));
        const a = pts[i].v, b = pts[i + 1].v;
        v = { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), s: lerp(a.s, b.s, t), o: lerp(a.o, b.o, t), r: lerp(a.r, b.r, t) };
      }
    }
    return { v, shape: nearest.shape };
  }

  /* ---------- Shape transitions ---------- */
  let mixT = 1;
  const MORPH = 1.5; // seconds
  function morphTo(i) {
    if (i === uniforms.uTo.value) return;
    // If a morph is still in flight, continue from where the particles are heading.
    uniforms.uFrom.value = uniforms.uTo.value;
    uniforms.uTo.value = i; mixT = 0;
  }
  let roll = 0;

  /* ---------- Animate ---------- */
  const clock = new THREE.Clock();
  let running = true;
  document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) tick(); });

  function tick() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    const tg = targetFor();
    morphTo(tg.shape);
    ["x", "y", "s", "o", "r"].forEach((k) => (state[k] += (tg.v[k] - state[k]) * 0.06));
    if (state.o < 0.02) { renderer.clear(); requestAnimationFrame(tick); return; }

    mixT = Math.min(mixT + dt / MORPH, 1);
    uniforms.uMix.value = mixT;
    uniforms.uTime.value = t;
    agitation = Math.max(agitation - dt * 0.9, 0);
    uniforms.uAgit.value += (agitation - uniforms.uAgit.value) * 0.1;
    uniforms.uOpacity.value = state.o;

    cur.x += (target.x - cur.x) * 0.045;
    cur.y += (target.y - cur.y) * 0.045;
    roll += dt * state.r;

    group.scale.setScalar(Math.max(state.s, 0.001));
    group.position.set(state.x * visW + cur.x * 0.15, state.y * visH, 0);
    group.rotation.y = cur.x * 0.5 + Math.sin(roll) * 0.45;
    group.rotation.x = cur.y * 0.35 + Math.sin(roll * 0.7) * 0.12;
    camera.position.z = baseZ - Math.abs(cur.x) * 0.2;
    glow.material.opacity = state.o * 0.9;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}
