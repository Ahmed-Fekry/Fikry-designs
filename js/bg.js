/* =========================================================
   Aurora background — raw WebGL fragment shader
   A slow, layered fbm field in the site's purple palette that
   breathes with time, drifts with scroll and warms toward the
   pointer. Rendered at a fraction of device resolution so it
   costs almost nothing; falls back to the CSS mesh gradient.
   ========================================================= */
(() => {
  const canvas = document.getElementById("bg-canvas");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!canvas || reduce) return;

  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) return;

  const VS = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;
  const FS = `
    precision mediump float;
    uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uScroll;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
      for (int i = 0; i < 5; i++) { v += a * noise(p); p = m * p; a *= 0.5; }
      return v;
    }
    void main(){
      vec2 uv = gl_FragCoord.xy / uRes;
      vec2 p = uv; p.x *= uRes.x / uRes.y;
      float t = uTime * 0.045;
      float sc = uScroll * 0.35;

      vec2 q = vec2(fbm(p * 1.3 + vec2(t, -t * 0.6) + sc), fbm(p * 1.3 - vec2(t * 0.4, t) - sc));
      float n = fbm(p * 1.6 + q * 1.4 + vec2(0.0, sc));
      float ridge = fbm(p * 2.4 - q * 0.8 + t);

      vec3 bg     = vec3(0.031, 0.027, 0.051);   // #08070d
      vec3 deep   = vec3(0.16, 0.08, 0.30);
      vec3 purple = vec3(0.42, 0.20, 0.76);
      vec3 lilac  = vec3(0.66, 0.33, 0.97);

      vec3 col = bg;
      col = mix(col, deep,   smoothstep(0.30, 0.78, n) * 0.85);
      col = mix(col, purple, smoothstep(0.55, 0.92, ridge) * 0.45);
      col += lilac * pow(smoothstep(0.62, 0.95, n * ridge * 1.8), 2.0) * 0.35;

      // pointer warmth
      vec2 m = uMouse; m.x *= uRes.x / uRes.y;
      col += lilac * exp(-length(p - m) * 2.2) * 0.10;

      // vignette + grain
      col *= 1.0 - 0.45 * pow(length(uv - 0.5), 1.6);
      col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.012;

      gl_FragColor = vec4(col, 1.0);
    }`;

  function compile(type, src) {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VS), fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, "uRes");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uMouse = gl.getUniformLocation(prog, "uMouse");
  const uScroll = gl.getUniformLocation(prog, "uScroll");

  // The CSS mesh is only a fallback; hide it once the shader is live.
  document.querySelector(".mesh-bg")?.classList.add("is-hidden");

  const SCALE = window.matchMedia("(max-width: 767px)").matches ? 0.35 : 0.5;
  function resize() {
    const w = Math.floor(window.innerWidth * SCALE), h = Math.floor(window.innerHeight * SCALE);
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  }
  resize();
  window.addEventListener("resize", resize);

  const mouse = { x: 0.5, y: 0.5 }, cur = { x: 0.5, y: 0.5 };
  if (window.matchMedia("(hover: hover)").matches) window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX / window.innerWidth; mouse.y = 1 - e.clientY / window.innerHeight;
  });

  let running = true;
  document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) frame(); });
  const start = performance.now();
  function frame() {
    if (!running) return;
    cur.x += (mouse.x - cur.x) * 0.04; cur.y += (mouse.y - cur.y) * 0.04;
    gl.uniform1f(uTime, (performance.now() - start) / 1000);
    gl.uniform2f(uMouse, cur.x, cur.y);
    gl.uniform1f(uScroll, window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  }
  frame();
})();
