/* =========================================================
   3D Hero — Three.js + custom GLSL
   A liquid, noise-displaced core with analytic normals and a
   fresnel rim, wrapped in a wireframe skin, three gyroscopic
   orbit rings with a glowing satellite, and a soft particle
   field. Reacts to the pointer (parallax + agitation) and to
   scroll (lifts, shrinks and rolls away as the hero leaves).
   Purple on near-black.
   ========================================================= */
/* Classic (non-module) script so it also runs from a file:// double-click. */
const THREE = window.THREE;

const canvas = document.getElementById("hero-canvas");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isMobile = window.matchMedia("(max-width: 767px)").matches;
const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (canvas && THREE && !reduce) {
  /* ---------- Renderer / camera ---------- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7.4);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);

  const DEEP = new THREE.Color("#4c1d95");
  const PURPLE = new THREE.Color("#a855f7");
  const LILAC = new THREE.Color("#e9d5ff");

  /* ---------- Shared GLSL: 3D simplex noise (Ashima / Ian McEwan) ---------- */
  const NOISE = /* glsl */`
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
      i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }
    float displace(vec3 p, float t, float freq, float amp){
      float n1 = snoise(p * freq + vec3(0.0, t * 0.35, t * 0.2));
      float n2 = snoise(p * freq * 2.6 - vec3(t * 0.5, 0.0, t * 0.3)) * 0.35;
      float n3 = snoise(p * freq * 6.0 + t) * 0.08;
      return (n1 + n2 + n3) * amp;
    }
  `;

  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.3 },
    uFreq: { value: 1.25 },
    uDeep: { value: DEEP },
    uPurple: { value: PURPLE },
    uLilac: { value: LILAC },
  };

  /* Analytic normals: displace two tangent neighbours and cross them. */
  const VERT = /* glsl */`
    uniform float uTime, uAmp, uFreq;
    varying vec3 vN; varying vec3 vP; varying float vD;
    ${NOISE}
    void main(){
      vec3 n = normalize(position);
      float d = displace(n, uTime, uFreq, uAmp);
      vec3 p = position + n * d;

      vec3 t = normalize(cross(n, abs(n.y) > 0.99 ? vec3(1.0,0.0,0.0) : vec3(0.0,1.0,0.0)));
      vec3 b = cross(n, t);
      float e = 0.035;
      vec3 nt = normalize(n + t * e); vec3 nb = normalize(n + b * e);
      vec3 pt = nt * (length(position) + displace(nt, uTime, uFreq, uAmp));
      vec3 pb = nb * (length(position) + displace(nb, uTime, uFreq, uAmp));
      vec3 nn = normalize(cross(pt - p, pb - p));
      if (dot(nn, n) < 0.0) nn = -nn;

      vN = normalize(normalMatrix * nn);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vP = mv.xyz; vD = d;
      gl_Position = projectionMatrix * mv;
    }
  `;

  const FRAG = /* glsl */`
    uniform vec3 uDeep, uPurple, uLilac; uniform float uTime;
    varying vec3 vN; varying vec3 vP; varying float vD;
    void main(){
      vec3 N = normalize(vN); vec3 V = normalize(-vP);
      float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.4);
      vec3 L1 = normalize(vec3(2.5, 3.0, 4.0));
      vec3 L2 = normalize(vec3(-3.0, -1.5, 2.0));
      float d1 = max(dot(N, L1), 0.0);
      float d2 = max(dot(N, L2), 0.0) * 0.45;
      float spec = pow(max(dot(reflect(-L1, N), V), 0.0), 48.0);
      vec3 base = mix(uDeep, uPurple, smoothstep(-0.28, 0.32, vD));
      vec3 col = base * (0.14 + d1 * 0.62 + d2) + uLilac * fres * 0.95 + vec3(spec) * 0.45;
      // faint iridescent bands along the displacement
      col += uLilac * 0.08 * (0.5 + 0.5 * sin(vD * 40.0 + uTime * 2.0)) * fres;
      gl_FragColor = vec4(col * 0.9, 0.95);
    }
  `;

  const WIRE_FRAG = /* glsl */`
    uniform vec3 uLilac; varying vec3 vN; varying vec3 vP; varying float vD;
    void main(){
      vec3 N = normalize(vN); vec3 V = normalize(-vP);
      float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 1.6);
      gl_FragColor = vec4(uLilac, 0.05 + fres * 0.35);
    }
  `;

  /* ---------- Core ---------- */
  const group = new THREE.Group();
  scene.add(group);

  const coreGeo = new THREE.IcosahedronGeometry(1.32, isMobile ? 32 : 56);
  const coreMat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  const wire = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.36, 9),
    new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: WIRE_FRAG, wireframe: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  group.add(wire);

  /* ---------- Soft glow sprite behind the core ---------- */
  function glowTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(168,85,247,0.55)");
    grd.addColorStop(0.35, "rgba(124,58,237,0.22)");
    grd.addColorStop(1, "rgba(124,58,237,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.scale.set(6.4, 6.4, 1);
  glow.position.z = -0.5;
  group.add(glow);

  /* ---------- Orbit rings + satellite ---------- */
  const rings = [];
  const ringSpecs = [
    { r: 2.0, tilt: [1.15, 0.2, 0.0], speed: 0.0032, op: 0.55 },
    { r: 2.35, tilt: [0.5, 1.0, 0.4], speed: -0.0021, op: 0.32 },
    { r: 2.7, tilt: [1.9, 0.0, 0.9], speed: 0.0014, op: 0.2 },
  ];
  ringSpecs.forEach((s) => {
    const pivot = new THREE.Group();
    pivot.rotation.set(...s.tilt);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(s.r, 0.009, 6, 260),
      new THREE.MeshBasicMaterial({ color: PURPLE, transparent: true, opacity: s.op, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    pivot.add(ring);
    // a brighter arc segment that reads as motion
    const arc = new THREE.Mesh(
      new THREE.TorusGeometry(s.r, 0.02, 6, 80, Math.PI * 0.42),
      new THREE.MeshBasicMaterial({ color: LILAC, transparent: true, opacity: s.op + 0.25, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    pivot.add(arc);
    group.add(pivot);
    rings.push({ pivot, ring, arc, speed: s.speed, r: s.r });
  });

  const satellite = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  const satGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  satGlow.scale.set(0.9, 0.9, 1);
  satellite.add(satGlow);
  rings[0].pivot.add(satellite);

  /* ---------- Particles (soft, twinkling, custom shader) ---------- */
  const COUNT = isMobile ? 450 : 1000;
  const pPos = new Float32Array(COUNT * 3);
  const pSeed = new Float32Array(COUNT);
  const pSize = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) {
    const r = 2.8 + Math.pow(Math.random(), 0.6) * 3.6;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pPos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pPos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.75;
    pPos[i * 3 + 2] = r * Math.cos(ph);
    pSeed[i] = Math.random() * 100;
    pSize[i] = 0.6 + Math.random() * 1.6;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("aSeed", new THREE.BufferAttribute(pSeed, 1));
  pGeo.setAttribute("aSize", new THREE.BufferAttribute(pSize, 1));
  const pMat = new THREE.ShaderMaterial({
    uniforms: { uTime: uniforms.uTime, uPx: { value: renderer.getPixelRatio() }, uPurple: { value: PURPLE }, uLilac: { value: LILAC } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute float aSeed; attribute float aSize; uniform float uTime, uPx;
      varying float vTw; varying float vMix;
      void main(){
        vec3 p = position;
        p.y += sin(uTime * 0.6 + aSeed) * 0.08;
        p.x += cos(uTime * 0.4 + aSeed * 1.3) * 0.06;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vTw = 0.55 + 0.45 * sin(uTime * (1.2 + fract(aSeed) * 1.5) + aSeed);
        vMix = fract(aSeed * 0.37);
        gl_PointSize = aSize * uPx * 3.2 * (6.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uPurple, uLilac; varying float vTw; varying float vMix;
      void main(){
        vec2 c = gl_PointCoord - 0.5; float d = length(c);
        float a = smoothstep(0.5, 0.0, d) * vTw;
        a *= a;
        gl_FragColor = vec4(mix(uPurple, uLilac, vMix), a * 0.9);
      }`,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  /* ---------- Resize ---------- */
  let baseZ = 7.4;
  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    baseZ = Math.max(7.4, 5.6 / camera.aspect);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- Pointer: parallax + agitation ---------- */
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  let agitation = 0, lastX = 0, lastY = 0, lastT = performance.now();
  if (fine) window.addEventListener("pointermove", (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    const now = performance.now();
    const v = Math.hypot(e.clientX - lastX, e.clientY - lastY) / Math.max(now - lastT, 1);
    agitation = Math.min(agitation + v * 0.06, 1);
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  });

  /* ---------- Animate ---------- */
  const clock = new THREE.Clock();
  let running = true;
  const hero = document.getElementById("home");
  let heroH = hero ? hero.offsetHeight : window.innerHeight;
  window.addEventListener("resize", () => { heroH = hero ? hero.offsetHeight : window.innerHeight; });
  document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) tick(); });

  function tick() {
    if (!running) return;
    const p = Math.min(Math.max(window.scrollY / heroH, 0), 1.2);
    if (p >= 1.15) { requestAnimationFrame(tick); return; } // offscreen: idle cheaply

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    uniforms.uTime.value = t;

    agitation = Math.max(agitation - dt * 0.9, 0);
    uniforms.uAmp.value += ((0.3 + agitation * 0.32) - uniforms.uAmp.value) * 0.08;

    cur.x += (target.x - cur.x) * 0.045;
    cur.y += (target.y - cur.y) * 0.045;

    core.rotation.y = t * 0.12;
    core.rotation.x = Math.sin(t * 0.17) * 0.25;
    wire.rotation.y = -t * 0.08;
    wire.rotation.z = t * 0.05;

    rings.forEach((rg, i) => {
      rg.pivot.rotation.y += rg.speed;
      rg.pivot.rotation.x += rg.speed * 0.35;
      rg.arc.rotation.z = t * (0.6 + i * 0.25) * (i % 2 ? -1 : 1);
    });
    const sa = -rings[0].arc.rotation.z + Math.PI * 0.42;
    satellite.position.set(Math.cos(sa) * rings[0].r, Math.sin(sa) * rings[0].r, 0);

    points.rotation.y = t * 0.02 + cur.x * 0.08;
    points.rotation.x = cur.y * 0.06;

    // pointer parallax on the whole group; scroll lifts, shrinks and rolls it away
    const s = 1 - p * 0.42;
    group.scale.setScalar(s);
    group.position.y = p * 2.2;
    group.position.x = cur.x * 0.18;
    group.rotation.y = cur.x * 0.42 + p * 1.1;
    group.rotation.x = cur.y * 0.3 - p * 0.5;
    camera.position.z = baseZ - Math.abs(cur.x) * 0.25;
    glow.material.opacity = 1 - p * 0.9;
    pMat.uniforms.uPx.value = renderer.getPixelRatio();

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}
