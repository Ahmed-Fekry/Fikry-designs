/* =========================================================
   3D Hero — Three.js
   A glowing, morphing wireframe core wrapped in a particle
   field that reacts to the cursor. Amber on near-black.
   ========================================================= */
import * as THREE from "three";

const canvas = document.getElementById("hero-canvas");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (canvas && !reduce) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6.2);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const AMBER = new THREE.Color("#a855f7");
  const WHITE = new THREE.Color("#e9d5ff");

  // ---- Core: icosahedron with vertex displacement (organic morph) ----
  const geo = new THREE.IcosahedronGeometry(1.7, 6);
  const basePos = geo.attributes.position.array.slice();
  const mat = new THREE.MeshStandardMaterial({
    color: AMBER, metalness: 0.35, roughness: 0.25,
    wireframe: true, transparent: true, opacity: 0.55,
  });
  const core = new THREE.Mesh(geo, mat);
  scene.add(core);

  // Inner solid glow shell
  const shell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.45, 3),
    new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.06 })
  );
  scene.add(shell);

  // ---- Particle field (a rotating shell of points) ----
  const COUNT = 1100;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(COUNT * 3);
  const pCol = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 2.4 + Math.random() * 2.6;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    pPos[i * 3] = r * Math.sin(p) * Math.cos(t);
    pPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
    pPos[i * 3 + 2] = r * Math.cos(p);
    const c = Math.random() > 0.5 ? AMBER : WHITE;
    pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
  const points = new THREE.Points(
    pGeo,
    new THREE.PointsMaterial({ size: 0.03, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending })
  );
  scene.add(points);

  // ---- Lights ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const key = new THREE.PointLight(0xd8b4fe, 40, 50); key.position.set(5, 5, 5); scene.add(key);
  const rim = new THREE.PointLight(0x7c3aed, 28, 50); rim.position.set(-6, -3, 2); scene.add(rim);

  // ---- Resize ----
  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    const w = r.width, h = r.height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // ---- Pointer parallax ----
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ---- Animate ----
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  let t = 0;
  function noise(x, y, z) {
    return Math.sin(x * 1.6 + t) * Math.cos(y * 1.7 + t * 0.8) * Math.sin(z * 1.5 + t * 1.1);
  }
  function tick() {
    t += 0.006;
    cur.x += (target.x - cur.x) * 0.05;
    cur.y += (target.y - cur.y) * 0.05;

    // morph the core
    for (let i = 0; i < pos.count; i++) {
      const ix = i * 3;
      v.set(basePos[ix], basePos[ix + 1], basePos[ix + 2]);
      const n = noise(v.x, v.y, v.z);
      const d = 1 + n * 0.12;
      pos.setXYZ(i, v.x * d, v.y * d, v.z * d);
    }
    pos.needsUpdate = true;

    core.rotation.y += 0.0026;
    core.rotation.x += 0.0012;
    shell.rotation.copy(core.rotation);
    points.rotation.y -= 0.0009;

    // parallax tilt
    scene.rotation.y = cur.x * 0.35;
    scene.rotation.x = cur.y * 0.25;
    camera.position.z = 6.2 - Math.abs(cur.x) * 0.3;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}
