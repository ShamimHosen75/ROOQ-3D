import * as THREE from 'three';

// Full-screen flowing silk: a height field of travelling folds, lit with an
// anisotropic sheen and an embroidered floral lattice that rides the folds.
const frag = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uMouseForce;
uniform vec3 uBase;
uniform vec3 uDeep;
uniform vec3 uThread;
uniform vec3 uGlow;
uniform float uScroll;
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p); vec2 f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}

float folds(vec2 p, float t){
  // long diagonal folds, domain-warped so they bend like draped fabric
  float a = -0.55;
  vec2 q = mat2(cos(a), -sin(a), sin(a), cos(a)) * p;
  float w = q.x + 0.55 * sin(q.y * 0.75 + t * 0.32) + 0.25 * sin(q.y * 1.6 - t * 0.21 + 1.3);
  w += 0.15 * noise(q * 0.9 + t * 0.05);
  float h = 0.62 * sin(w * 2.0 + t * 0.42);
  h += 0.26 * sin(w * 4.3 - q.y * 0.6 + t * 0.31 + 0.8);
  h += 0.08 * sin(w * 9.1 + q.y * 0.4 - t * 0.5);
  // ripple from the pointer
  vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 3.0;
  float d = length(p - m);
  h += uMouseForce * 0.3 * sin(d * 7.0 - t * 4.0) * exp(-d * 1.8);
  return h;
}

float flower(vec2 p){
  // tiled five-petal blossom on a diamond lattice (the embroidery)
  vec2 g = p * 3.2;
  g.x += step(1.0, mod(floor(g.y), 2.0)) * 0.5;
  vec2 c = fract(g) - 0.5;
  float r = length(c);
  float a = atan(c.y, c.x);
  float petal = 0.18 + 0.12 * cos(a * 5.0);
  float bloom = smoothstep(0.02, 0.0, r - petal) * smoothstep(0.03, 0.06, r);
  float core = smoothstep(0.05, 0.03, r);
  float ring = smoothstep(0.012, 0.0, abs(r - 0.36)) * 0.6;
  return clamp(bloom * 0.9 + core + ring, 0.0, 1.0);
}

void main(){
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * 3.0;
  p.y += uScroll * 0.8;
  float t = uTime;

  float e = 0.01;
  float h = folds(p, t);
  float hx = folds(p + vec2(e, 0.0), t);
  float hy = folds(p + vec2(0.0, e), t);
  vec3 n = normalize(vec3(-(hx - h) / e * 0.16, -(hy - h) / e * 0.16, 1.0));

  vec3 L = normalize(vec3(-0.45, 0.6, 0.75));
  vec3 V = vec3(0.0, 0.0, 1.0);
  vec3 H = normalize(L + V);
  float diff = clamp(dot(n, L), 0.0, 1.0);

  // anisotropic sheen along the weave direction
  vec3 T = normalize(vec3(1.0, 0.35, 0.0) - n * dot(n, vec3(1.0, 0.35, 0.0)));
  float th = dot(T, H);
  float aniso = pow(sqrt(max(0.0, 1.0 - th * th)), 60.0);
  float fres = pow(1.0 - clamp(dot(n, V), 0.0, 1.0), 2.0);

  float spec = pow(clamp(dot(n, H), 0.0, 1.0), 48.0);
  vec3 col = mix(uDeep, uBase, smoothstep(0.1, 0.95, diff));
  col += uGlow * aniso * 0.32;
  col += uGlow * spec * 0.35;
  col += uGlow * fres * 0.12;

  // embroidery follows the fabric (offset by the fold normal)
  float f = flower(p * 1.5 + n.xy * 0.12);
  float threadLight = 0.6 + 0.7 * pow(clamp(dot(n, H), 0.0, 1.0), 18.0);
  float mask = smoothstep(0.35, 0.75, noise(p * 0.45 + 3.0));
  col = mix(col, uThread * threadLight, f * 0.42 * mask * smoothstep(-0.7, 0.5, h));

  // woven grain
  float weave = sin(uv.x * uRes.x * 1.4) * sin(uv.y * uRes.y * 1.4);
  col += weave * 0.012;

  // soft light from top right, vignette
  col += uGlow * 0.18 * smoothstep(1.2, 0.0, length(uv - vec2(0.85, 0.95)));
  float vig = smoothstep(1.25, 0.35, length((uv - 0.5) * vec2(1.1, 1.3)));
  col *= mix(0.78, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

const vert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const SILK_PALETTES = [
  { base: '#eeb04a', deep: '#a05e16', thread: '#fff0c8', glow: '#ffe2b0' }, // saffron
  { base: '#f3dfd2', deep: '#c9a28f', thread: '#e0737f', glow: '#ffffff' }, // ivory organza
  { base: '#2a3274', deep: '#0b0d2a', thread: '#e9c47a', glow: '#8d97ff' }, // midnight velvet
  { base: '#a8182c', deep: '#3d0510', thread: '#f2c97a', glow: '#ff9a8a' }, // ruby bridal
  { base: '#2a2120', deep: '#060404', thread: '#d0383f', glow: '#d89a7a' }, // noir festive
];

export class Silk {
  constructor(container, { reduced }) {
    this.reduced = reduced;
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const p = SILK_PALETTES[0];
    this.uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseForce: { value: 0 },
      uScroll: { value: 0 },
      uBase: { value: new THREE.Color(p.base) },
      uDeep: { value: new THREE.Color(p.deep) },
      uThread: { value: new THREE.Color(p.thread) },
      uGlow: { value: new THREE.Color(p.glow) },
    };
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: this.uniforms, depthTest: false }),
    );
    this.scene.add(this.mesh);
    this.mouse = new THREE.Vector2(0.5, 0.5);
    this.force = 0;
    this.active = true;
    window.addEventListener('pointermove', (e) => {
      const nx = e.clientX / window.innerWidth;
      const ny = 1 - e.clientY / window.innerHeight;
      this.force = Math.min(1, this.force + Math.hypot(nx - this.mouse.x, ny - this.mouse.y) * 6);
      this.mouse.set(nx, ny);
    });
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.clock = new THREE.Clock();
  }

  /** Blend palettes; `progress` runs 0..(palettes-1). */
  setPalette(progress) {
    const i = Math.min(Math.floor(progress), SILK_PALETTES.length - 2);
    const f = THREE.MathUtils.smoothstep(progress - i, 0, 1);
    const a = SILK_PALETTES[i];
    const b = SILK_PALETTES[i + 1];
    const u = this.uniforms;
    u.uBase.value.set(a.base).lerp(new THREE.Color(b.base), f);
    u.uDeep.value.set(a.deep).lerp(new THREE.Color(b.deep), f);
    u.uThread.value.set(a.thread).lerp(new THREE.Color(b.thread), f);
    u.uGlow.value.set(a.glow).lerp(new THREE.Color(b.glow), f);
    u.uScroll.value = progress;
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h, false);
    this.uniforms.uRes.value.set(w, h);
  }

  setActive(v) {
    this.active = v;
  }

  tick() {
    const dt = this.clock.getDelta();
    if (!this.active) return;
    const u = this.uniforms;
    u.uTime.value += dt * (this.reduced ? 0.15 : 1);
    u.uMouse.value.lerp(this.mouse, 0.08);
    this.force *= 0.96;
    u.uMouseForce.value += (this.force - u.uMouseForce.value) * 0.1;
    this.renderer.render(this.scene, this.camera);
  }
}
