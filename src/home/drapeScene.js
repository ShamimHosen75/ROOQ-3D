import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { SAREES, LAYOUT } from './drapeData.js';

const { MathUtils: M } = THREE;
const VIEW = 1.2; // the canvas is 1.2 screens tall; the play area sits in the top screen
const FLOAT_LIFT = 14;
const PETAL_GRAVITY = 0.16;
const BUNDLE = { w: 2.2, h: 0.5, d: 1.5, r: 0.17 };
const SKIN = 0.06;
const PETAL = { len: 0.62, wid: 0.46, cup: 0.11 };
const SHADOW_DIR = new THREE.Vector2(-0.9, 0.42).normalize();

// damped spring step → [value, velocity]
const spring = (x, v, to, k, c, dt) => {
  const a = k * (to - x) - c * v;
  v += a * dt;
  return [x + v * dt, v];
};

/* ---------- geometry ---------- */
function bundleGeometry(h, shape) {
  const { w, d } = BUNDLE;
  let r = BUNDLE.r;
  const geo = new THREE.BoxGeometry(w, h, d, 48, 10, 36);
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const half = new THREE.Vector3(w / 2, h / 2, d / 2);
  r = Math.min(r, half.y * 0.62);
  const front = Math.min(h * 0.48, half.y * 0.8);
  const v = new THREE.Vector3();
  const core = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const isFront = v.z > 0;
    const taper = 0.22 + 0.78 * M.smoothstep((v.y + half.y) / (2 * half.y), 0, 0.5);
    const ry = (isFront ? front : r) * taper;
    const rx = r * taper;
    core.set(M.clamp(v.x, -half.x + rx, half.x - rx), M.clamp(v.y, -half.y + ry, half.y - ry), M.clamp(v.z, -half.z + rx, half.z - (isFront ? ry : rx)));
    n.subVectors(v, core);
    if (n.lengthSq() > 1e-8) {
      n.normalize();
      v.copy(core).addScaledVector(n, ry);
    } else n.fromBufferAttribute(nor, i);
    const hy = (v.y + half.y) / (2 * half.y);
    const qx = v.x / half.x;
    const qz = v.z / half.z;
    const e = Math.max(Math.abs(qx), Math.abs(qz));
    const rim = M.smoothstep(e, 0.4, 0.9) * (1 - 0.35 * M.smoothstep(e, 0.93, 1));
    const mid = Math.max(0, (1 - qx * qx) * (1 - qz * qz));
    v.y += hy * (shape.rim * rim - shape.hollow * mid ** 1.4);
    v.y += hy * shape.wave * Math.sin(qx * 5.2 + qz * 3.1) * rim;
    v.y += hy * h * 0.012 * Math.sin(qx * 9 + qz * 6) * (1 - rim);
    const side = M.clamp(1 - Math.abs(n.y) * 1.6, 0, 1);
    const ridge = shape.ridge * side * (0.5 + 0.5 * Math.cos(hy * shape.layers * Math.PI * 2));
    v.x += n.x * ridge;
    v.z += n.z * ridge;
    if (isFront) v.y -= 0.04 * h * Math.max(0, qz) ** 2;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  // weld normals across the box's split faces so the cloth shades smoothly
  const key = (i) => `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
  const sum = new Map();
  for (let i = 0; i < pos.count; i++) {
    const k = key(i);
    const s = sum.get(k) ?? sum.set(k, new THREE.Vector3()).get(k);
    s.x += nor.getX(i);
    s.y += nor.getY(i);
    s.z += nor.getZ(i);
  }
  for (let i = 0; i < pos.count; i++) {
    const s = sum.get(key(i)).clone().normalize();
    nor.setXYZ(i, s.x, s.y, s.z);
  }
  nor.needsUpdate = true;
  return geo;
}

function petalGeometry() {
  const p = [];
  const uv = [];
  const idx = [];
  const R = 28;
  const C = 18;
  for (let i = 0; i <= R; i++) {
    const t = i / R;
    const half = PETAL.wid * 0.5 * Math.sin(Math.PI * t ** 0.72) ** 0.85 * (1 - 0.18 * t);
    const bow = 0.55 * (t - 0.42) ** 2 - 0.05;
    for (let j = 0; j <= C; j++) {
      const s = (j / C) * 2 - 1;
      const a = Math.abs(s);
      const cup = PETAL.cup * a ** 1.7 * Math.sin(Math.PI * Math.min(1, t * 0.95 + 0.04)) ** 0.7;
      const crinkle = 0.012 * Math.sin(t * 17 + s * 3) * a ** 3 + 0.008 * Math.sin(t * 31 - s * 5) * a ** 4;
      p.push(s * half, cup + bow * PETAL.cup * 1.6 + crinkle - PETAL.cup * 0.5, (t - 0.5) * PETAL.len);
      uv.push((s + 1) / 2, t);
    }
  }
  for (let i = 0; i < R; i++)
    for (let j = 0; j < C; j++) {
      const a = i * (C + 1) + j;
      const b = a + C + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function petalTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const g = c.getContext('2d');
  const img = g.createImageData(256, 512);
  const deep = [214, 66, 112];
  const mid = [240, 130, 160];
  const pale = [253, 228, 233];
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const ss = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  for (let y = 0; y < 512; y++) {
    const t = y / 511;
    for (let x = 0; x < 256; x++) {
      const s = (x / 255) * 2 - 1;
      const a = Math.abs(s);
      const vein = (0.5 + 0.5 * Math.sin(s * (2.2 + 3.2 * t) * 3.1 + Math.sin(t * 3.1 + s * 1.7) * 0.9)) * 0.05 * (1 - a * 0.5);
      let k = 0.1 + 0.85 * ss(0.3, 1, a) + 0.55 * ss(0.78, 1, t) + 0.4 * (1 - ss(0, 0.2, t)) - 0.18 * (1 - a) * ss(0.2, 0.7, t) * (1 - ss(0.7, 1, t));
      k = Math.min(1, Math.max(0, k)) + vein;
      let col = k < 0.55 ? mix(pale, mid, k / 0.55) : mix(mid, deep, (k - 0.55) / 0.45);
      const base = (1 - ss(0.04, 0.34, 1 - t)) * (1 - ss(0.05, 0.62, a));
      if (base > 0) col = mix(col, [242, 238, 172], Math.min(1, base * 0.85));
      const o = (y * 256 + x) * 4;
      img.data[o] = col[0];
      img.data[o + 1] = col[1];
      img.data[o + 2] = col[2];
      img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647), seed / 2147483647);
  const X = (v) => ((v + 1) / 2) * 255;
  const Y = (v) => v * 511;
  const vein = (x0, y0, x1, y1, depth) => {
    const wob = (rnd() - 0.5) * 0.05;
    g.beginPath();
    for (let k = 0; k <= 18; k++) {
      const t = k / 18;
      const x = x0 + (x1 - x0) * t ** 0.85 + Math.sin(t * 6 + wob * 40) * wob;
      const y = y0 + (y1 - y0) * t;
      if (k) g.lineTo(X(x), Y(y));
      else g.moveTo(X(x), Y(y));
    }
    g.stroke();
    if (depth < 2)
      for (let b = 0; b < 2; b++) {
        const t = 0.45 + rnd() * 0.3;
        const bx = x0 + (x1 - x0) * t ** 0.85;
        const by = y0 + (y1 - y0) * t;
        vein(bx, by, bx + (x1 - x0) * (0.35 + rnd() * 0.25) * (b ? 1 : -0.4), Math.min(0.98, by + (y1 - y0) * (0.3 + rnd() * 0.2)), depth + 1);
      }
  };
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(160, 30, 75, 0.36)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 15; i++) vein(0, 0.02, -0.95 + (1.9 * i) / 14 + (rnd() - 0.5) * 0.08, 0.9 + rnd() * 0.08, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function softRect(size, frac, blur) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const o = (size * (1 - frac)) / 2;
  g.filter = `blur(${blur}px)`;
  g.fillStyle = 'rgb(46,20,13)';
  g.beginPath();
  g.roundRect(o, o, size * frac, size * frac, size * frac * 0.22);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function softPetal(size, frac, blur) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const a = size * frac;
  const o = (size - a) / 2;
  const X = (v) => o + v * a;
  g.filter = `blur(${blur}px)`;
  g.fillStyle = 'rgb(46,20,13)';
  g.beginPath();
  g.moveTo(X(0.5), X(0.02));
  g.bezierCurveTo(X(0.92), X(0.1), X(1.04), X(0.62), X(0.62), X(0.94));
  g.quadraticCurveTo(X(0.52), X(1.02), X(0.46), X(0.95));
  g.bezierCurveTo(X(-0.04), X(0.66), X(0), X(0.12), X(0.5), X(0.02));
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* Soft contact + cast shadow that fades as the body rises. */
class BlobShadow {
  constructor(scene, { w, d, strength = 1, y = -0.03, petal = false }) {
    const near = petal ? { frac: 0.6, tex: softPetal(256, 0.6, 9) } : { frac: 0.6, tex: softRect(256, 0.6, 11) };
    const far = petal ? { frac: 0.4, tex: softPetal(512, 0.4, 42) } : { frac: 0.4, tex: softRect(512, 0.4, 50) };
    const plane = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const mat = (tex) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
    this.cast = new THREE.Mesh(plane, mat(far.tex));
    this.cast.renderOrder = -2;
    this.contact = new THREE.Mesh(plane, mat(near.tex));
    this.contact.renderOrder = -1;
    this.core = new THREE.Mesh(plane, mat(near.tex));
    this.core.renderOrder = 0;
    scene.add(this.cast, this.contact, this.core);
    Object.assign(this, { w, d, strength, y, near, far });
    this.e = new THREE.Euler();
    this.q = new THREE.Quaternion();
  }
  update(body) {
    const p = body.translation();
    const r = body.rotation();
    this.e.setFromQuaternion(this.q.set(r.x, r.y, r.z, r.w), 'YXZ');
    const { w, d, y, near, far } = this;
    const size = Math.max(w, d);
    const lift = Math.max(0, p.y - size * 0.1);
    const touch = 1 - M.smoothstep(lift, 0.02, 0.25);
    const high = M.clamp(lift / 3, 0, 1);
    const off = size * 0.15;
    this.contact.position.set(p.x + SHADOW_DIR.x * off, y + 0.004, p.z + SHADOW_DIR.y * off);
    this.contact.rotation.y = this.e.y;
    this.contact.scale.set((w * 1.12) / near.frac, 1, (d * 1.1) / near.frac);
    this.contact.material.opacity = 0.5 * touch * this.strength;
    this.core.position.set(p.x, y + 0.005, p.z);
    this.core.rotation.y = this.e.y;
    this.core.scale.set((w * 0.98) / near.frac, 1, (d * 0.98) / near.frac);
    this.core.material.opacity = 0.4 * touch * touch * this.strength;
    const reach = size * 0.36 + lift * 0.5;
    this.cast.position.set(p.x + SHADOW_DIR.x * reach, y + 0.003, p.z + SHADOW_DIR.y * reach);
    this.cast.rotation.y = this.e.y;
    const grow = 1.3 + high * 0.7;
    this.cast.scale.set((w * grow) / far.frac, 1, (d * grow) / far.frac);
    this.cast.material.opacity = 0.4 * (1 - high * 0.65) * this.strength;
  }
}

/* Cloth deformation driven by the physics: lag, ripple, slump, droop while held, sag over another bundle. */
function clothUniforms(half) {
  return {
    uTime: { value: 0 },
    uLag: { value: new THREE.Vector3() },
    uRipple: { value: 0 },
    uSlump: { value: 0 },
    uHold: { value: 0 },
    uGrab: { value: new THREE.Vector2() },
    uSup: { value: new THREE.Vector4() },
    uSupRot: { value: new THREE.Vector2(1, 0) },
    uSag: { value: 0 },
    uHalf: { value: half },
  };
}
function clothify(mat, uniforms) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime; uniform vec3 uLag; uniform float uRipple; uniform float uSlump; uniform float uHold; uniform vec2 uGrab; uniform vec4 uSup; uniform vec2 uSupRot; uniform float uSag; uniform vec3 uHalf;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec3 q = transformed / uHalf;
        float hgt = clamp(q.y * 0.5 + 0.5, 0.0, 1.0);
        float edge = smoothstep(0.55, 1.0, max(abs(q.x), abs(q.z)));
        transformed += uLag * hgt * (0.55 + 0.45 * edge);
        float wave = sin(q.x * 3.2 + q.z * 2.1 - uTime * 7.0) * 0.6 + sin(q.x * 6.3 - q.z * 4.7 + uTime * 9.5) * 0.4;
        transformed.y += uRipple * wave * (0.25 + 0.75 * edge) * hgt * uHalf.y * 0.55;
        transformed.xz += uRipple * edge * hgt * normalize(q.xz + 1e-4) * wave * 0.035;
        transformed.y -= uSlump * hgt * uHalf.y * 0.55;
        transformed.xz *= 1.0 + uSlump * hgt * 0.07;
        vec2 dg = (q.xz - uGrab) / (1.0 + abs(uGrab));
        float droop = dg.x * dg.x;
        transformed.y -= uHold * (droop * uHalf.y * 0.85 + dg.y * dg.y * uHalf.y * 0.14);
        transformed.x *= 1.0 - uHold * droop * 0.022;
        vec2 pl = transformed.xz - uSup.xy;
        vec2 pb = vec2(uSupRot.x * pl.x + uSupRot.y * pl.y, -uSupRot.y * pl.x + uSupRot.x * pl.y);
        float over = length(max(abs(pb) - uSup.zw, 0.0));
        float sag = uSag * pow(clamp(over / 0.95, 0.0, 1.0), 1.1);
        transformed.y -= sag * uHalf.y * 2.3;
        transformed.xz -= normalize(pl + 1e-4) * sag * 0.12;`,
      );
  };
  mat.customProgramCacheKey = () => 'saree-fabric';
}

/* ---------- the scene ---------- */
export class DrapeScene {
  static async create(opts) {
    await RAPIER.init();
    return new DrapeScene(opts);
  }

  constructor({ container, arcs, dropZone, onDropZone }) {
    this.container = container;
    this.arcs = arcs;
    this.dropZone = dropZone;
    this.onDropZone = onDropZone;
    this.active = false;
    this.filter = null;

    const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NeutralToneMapping;
    container.appendChild(r.domElement);
    r.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault());

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.5, 60);
    this.scene.add(new THREE.AmbientLight('#ffffff', 0.4));
    const key = new THREE.DirectionalLight('#fff4ea', 1.9);
    key.position.set(7, 9, -4);
    const fill = new THREE.DirectionalLight('#ffd9c2', 0.35);
    fill.position.set(-6, 4, 6);
    this.scene.add(key, fill);
    this.environment();

    this.world = new RAPIER.World({ x: 0, y: -14, z: 0 });
    this.world.timestep = 1 / 60;
    this.walls = [];
    this.bundles = new Map();
    this.petals = new Map();
    this.items = [];
    this.gusts = [];
    this.cursor = { x: 0, z: 0, vx: 0, vz: 0, on: false };
    this.dragging = null;
    this.pointer = new THREE.Vector2(-9, -9);
    this.ray = new THREE.Raycaster();
    this.hit = new THREE.Vector3();
    this.cursorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.15);
    this.last = performance.now();
    this.time = 0;
    this.acc = 0;
    this.arcState = { a: 0, x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0, init: false, speed: 0, lean: 0, hw: 90 };

    this.layout();
    this.populate();
    this.bind();
    new ResizeObserver(() => this.resize()).observe(container);
  }

  environment() {
    const env = new THREE.Scene();
    env.background = new THREE.Color('#e9d3c6');
    const form = (intensity, pos, rot, scale, color) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide, toneMapped: false }));
      m.position.set(...pos);
      m.rotation.set(...rot);
      m.scale.set(...scale);
      env.add(m);
    };
    form(2.4, [5, 6, -4], [Math.PI / 2, 0, 0], [12, 6, 1], '#fff6ec');
    form(0.6, [-6, 2, 1], [0, Math.PI / 2, 0], [10, 3, 1], '#ffe2c4');
    form(1.4, [6, 2, 0], [0, -Math.PI / 2, 0], [10, 3, 1], '#ffd0d6');
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pm.fromScene(env, 0, 0.1, 100, { size: 256 }).texture;
    pm.dispose();
  }

  /* Fit the play area to what the camera sees; the canvas is VIEW screens tall. */
  layout() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight * VIEW;
    const screenH = h / VIEW;
    const asp = w / screenH;
    const zoom = asp < 1 ? 1.45 : asp < 1.4 ? 1.2 : 1;
    const place = (c) => {
      c.position.set(0, 8.6 * zoom, 10.6 * zoom);
      c.lookAt(0, 0, 1 * zoom);
    };
    const ref = new THREE.PerspectiveCamera(30, asp, 0.5, 60);
    place(ref);
    ref.updateProjectionMatrix();
    ref.updateMatrixWorld();
    const fov = (2 * Math.atan(Math.tan((30 * Math.PI) / 360) * VIEW) * 180) / Math.PI;
    const cam = this.camera;
    cam.fov = fov;
    cam.aspect = w / h;
    place(cam);
    cam.rotateX(-((fov - 30) * Math.PI) / 360);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    this.renderer.setSize(w, h, false);

    const ray = new THREE.Raycaster();
    const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const at = (c, x, y) => (ray.setFromCamera(new THREE.Vector2(x, y), c), ray.ray.intersectPlane(floor, new THREE.Vector3()));
    const far = [at(ref, -1, 0.86), at(ref, 1, 0.86)];
    const near = [at(ref, -1, -1), at(ref, 1, -1)];
    const bottom = at(cam, 0, -1);
    const hx = Math.min(Math.abs(far[0].x), Math.abs(far[1].x)) * 0.94;
    const zFar = far[0].z;
    const zNearRef = near[0].z;
    const hz = ((zNearRef - zFar) / 2) * 0.86;
    const zNear = zFar + (bottom.z - zFar) * 0.93;
    this.bounds = { cx: 0, cz: (zFar + zNearRef) / 2, hx, hz, s: M.clamp(hx / 4.6, 0.62, 1), zNear };
    this.cursorPlane.constant = -0.8 * this.bounds.s;
    this.buildWalls();
  }

  buildWalls() {
    this.walls.forEach((b) => this.world.removeRigidBody(b));
    const { cx, cz, hx, hz, zNear } = this.bounds;
    const t = 0.5;
    const pz = (cz - hz + zNear) / 2;
    const dz = (zNear - (cz - hz)) / 2;
    const body = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    const box = (ex, ey, ez, x, y, z) =>
      this.world.createCollider(RAPIER.ColliderDesc.cuboid(ex, ey, ez).setTranslation(x, y, z).setFriction(0.9).setRestitution(0.05), body);
    box(40, 0.5, 40, 0, -0.5, 0);
    box(t, 6, dz + 2, cx - hx - t, 6, pz);
    box(t, 6, dz + 2, cx + hx + t, 6, pz);
    box(hx + 2, 6, t, cx, 6, cz - hz - t);
    box(hx + 2, 6, t, cx, 6, zNear + t);
    box(hx + 2, t, dz + 2, cx, 7.5, pz);
    this.walls = [body];
  }

  populate() {
    const loader = new THREE.TextureLoader();
    const aniso = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const { bounds } = this;
    const l = bounds.s;

    LAYOUT.saree.forEach((at, index) => {
      const s = SAREES.find((x) => x.id === at.id);
      const h = s.shape.h;
      const half = new THREE.Vector3(BUNDLE.w / 2, h / 2, BUNDLE.d / 2);
      const geo = bundleGeometry(h, s.shape);
      const uniforms = clothUniforms(half);
      const load = (name, color) => {
        const t = loader.load(`/drape/${name}.webp`);
        if (color) t.colorSpace = THREE.SRGBColorSpace;
        return t;
      };
      const src = {
        top: { col: load(`top-${s.id}-col`, true), rm: load(`top-${s.id}-rm`), h: load(`top-${s.id}-h`) },
        edge: { col: load(`edge-${s.id}-col`, true), rm: load(`edge-${s.id}-rm`) },
      };
      const variant = (t, rx, ox, ry, oy) => {
        const c = t.clone();
        c.anisotropy = aniso;
        c.wrapS = c.wrapT = THREE.RepeatWrapping;
        c.repeat.set(rx, ry);
        c.offset.set(ox, oy);
        c.needsUpdate = true;
        return c;
      };
      const mat = (face, rx = 1, ox = 0, ry = 1, oy = 0) => {
        const f = src[face];
        const rm = variant(f.rm, rx, ox, ry, oy);
        const m = new THREE.MeshPhysicalMaterial({
          map: variant(f.col, rx, ox, ry, oy),
          bumpMap: variant(face === 'top' ? f.h : f.col, rx, ox, ry, oy),
          bumpScale: s.bump,
          roughnessMap: rm,
          metalnessMap: rm,
          roughness: 1,
          metalness: 1,
          envMapIntensity: 0.8,
          anisotropy: s.weave === 'silk' ? 0.55 : s.weave === 'organza' ? 0.3 : 0,
          sheen: s.weave === 'velvet' ? 0.45 : s.weave === 'organza' ? 0.2 : 0.12,
          sheenRoughness: s.weave === 'velvet' ? 0.6 : 0.35,
          sheenColor: new THREE.Color(s.sheen),
          transparent: true,
        });
        clothify(m, uniforms);
        return m;
      };
      // box faces: +x, -x, +y (top), -y (underside), +z, -z
      const mats = [mat('edge', -1, 1), mat('edge'), mat('top'), mat('edge'), mat('top', 1, 0, -0.2, 0.2), mat('edge')];

      const p = new THREE.Vector3(bounds.cx + at.x * bounds.hx, 2.6 + index * 0.75, bounds.cz + at.z * bounds.hz);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, at.ry, 0));
      const rb = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z).setRotation(q).setLinearDamping(0.95).setAngularDamping(2.2).setCcdEnabled(true).enabledRotations(false, true, false),
      );
      this.world.createCollider(
        RAPIER.ColliderDesc.roundCuboid((BUNDLE.w / 2 - BUNDLE.r) * l, (h / 2 + SKIN - BUNDLE.r) * l, (BUNDLE.d / 2 - BUNDLE.r) * l, BUNDLE.r * l)
          .setTranslation(0, SKIN * l, 0)
          .setDensity(1.1)
          .setFriction(1.25)
          .setRestitution(0.04),
        rb,
      );
      const root = new THREE.Object3D();
      const tilt = new THREE.Group();
      const mesh = new THREE.Mesh(geo, mats);
      mesh.scale.setScalar(l);
      tilt.add(mesh);
      root.add(tilt);
      this.scene.add(root);
      const item = {
        kind: 'saree',
        key: s.id,
        saree: s,
        index,
        at,
        rb,
        root,
        tilt,
        mesh,
        mats,
        uniforms,
        half,
        heavy: true,
        gravity: 1,
        floating: LAYOUT.floating.includes(s.id),
        home: { x: p.x, z: p.z },
        grab: new THREE.Vector2(),
        tiltS: { x: 0, vx: 0, z: 0, vz: 0 },
        c: { prev: new THREE.Vector3(), lag: new THREE.Vector3(), lagV: new THREE.Vector3(), ripple: 0, slump: 0, slumpV: 0, prevVy: 0, hold: 0, holdV: 0, gusted: false, drape: 0, drapeV: 0 },
        dim: false,
        shadow: new BlobShadow(this.scene, { w: BUNDLE.w * l, d: BUNDLE.d * l }),
      };
      mesh.userData.item = item;
      this.bundles.set(s.id, item);
      this.items.push(item);
    });

    const pg = petalGeometry();
    const ptex = petalTexture();
    const pmat = new THREE.MeshPhysicalMaterial({
      map: ptex,
      roughness: 0.55,
      sheen: 0.8,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color('#ffd3df'),
      clearcoat: 0.08,
      clearcoatRoughness: 0.6,
      envMapIntensity: 0.28,
      emissive: new THREE.Color('#ffffff'),
      emissiveMap: ptex,
      emissiveIntensity: 0.42,
      side: THREE.DoubleSide,
    });
    LAYOUT.petal.forEach((at, i) => {
      if (!(l > 0.7 || i < 6)) return;
      const k = l * at.k;
      const p = new THREE.Vector3(bounds.cx + at.x * bounds.hx, 2.4 + (i % 5) * 0.55, bounds.cz + at.z * bounds.hz);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((i % 3) * 0.3, i * 1.7, (i % 2) * 0.4));
      const rb = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic().setTranslation(p.x, p.y, p.z).setRotation(q).setGravityScale(PETAL_GRAVITY).setLinearDamping(3.2).setAngularDamping(1.1).setCcdEnabled(true),
      );
      this.world.createCollider(RAPIER.ColliderDesc.cuboid(0.22 * k * 1.25, 0.07 * k, 0.3 * k * 1.25).setDensity(0.15).setFriction(0.6).setRestitution(0), rb);
      const mesh = new THREE.Mesh(pg, pmat);
      mesh.scale.setScalar(1.25 * k);
      this.scene.add(mesh);
      const item = { kind: 'petal', key: `petal-${i}`, i, k, rb, root: mesh, mesh, gravity: PETAL_GRAVITY, heavy: false, shadow: new BlobShadow(this.scene, { w: 0.5 * k, d: 0.68 * k, strength: 0.62, y: -0.04, petal: true }) };
      mesh.userData.item = item;
      this.petals.set(item.key, item);
      this.items.push(item);
    });
  }

  /* ---------- input ---------- */
  bind() {
    const el = this.renderer.domElement;
    el.style.touchAction = 'pan-y';
    const setPointer = (x, y) => {
      const r = el.getBoundingClientRect();
      this.pointer.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    };
    this.setPointer = setPointer;
    el.addEventListener('pointerenter', () => (this.cursor.on = true));
    el.addEventListener('pointerleave', () => {
      this.cursor.on = false;
      if (!this.dragging) document.body.style.cursor = '';
      this.hover = null;
    });
    el.addEventListener('pointermove', (e) => {
      setPointer(e.clientX, e.clientY);
      if (this.dragging) return;
      const hit = this.pick();
      if (hit !== this.hover) {
        this.hover = hit;
        document.body.style.cursor = hit ? 'grab' : '';
      }
    });
    el.addEventListener('pointerdown', (e) => {
      setPointer(e.clientX, e.clientY);
      const hit = this.pick(true);
      if (!hit) return;
      const { item, point } = hit;
      if (item.kind === 'saree') {
        const t = item.rb.translation();
        const yaw = this.yaw(item.rb);
        const dx = point.x - t.x;
        const dz = point.z - t.z;
        const lx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
        const lz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
        const l = this.bounds.s;
        item.grab.set(M.clamp(lx / (item.half.x * l), -1, 1), M.clamp(lz / (item.half.z * l), -1, 1));
        item.uniforms.uGrab.value.copy(item.grab);
        item.floating = false;
        this.gust(t.x, t.z, 2.4 * l, 0.35);
      }
      this.startDrag(item, e);
    });
    el.addEventListener('dblclick', (e) => {
      setPointer(e.clientX, e.clientY);
      const hit = this.pick(true);
      if (!hit || hit.item.kind !== 'saree') return;
      const t = hit.item.rb.translation();
      hit.item.home = { x: t.x, z: t.z };
      hit.item.floating = true;
    });
  }

  pick(withPoint = false) {
    this.ray.setFromCamera(this.pointer, this.camera);
    const hits = this.ray.intersectObjects(this.items.map((i) => i.mesh), false);
    if (!hits.length) return null;
    return withPoint ? { item: hits[0].object.userData.item, point: hits[0].point } : hits[0].object.userData.item;
  }

  yaw(rb) {
    const r = rb.rotation();
    return new THREE.Euler().setFromQuaternion(new THREE.Quaternion(r.x, r.y, r.z, r.w), 'YXZ').y;
  }

  startDrag(item, e) {
    this.dragging = item;
    item.rb.setGravityScale(0, true);
    document.body.style.cursor = 'grabbing';
    const move = (ev) => this.setPointer(ev.clientX, ev.clientY);
    const up = (ev) => {
      const it = this.dragging;
      this.dragging = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      document.body.style.cursor = '';
      if (!it) return;
      if (it.heavy && ev) this.checkDrop(it, ev);
      it.rb.setGravityScale(it.gravity, true);
      const v = it.rb.linvel();
      const sp = Math.hypot(v.x, v.y, v.z);
      const keep = it.heavy ? 0.55 : 1;
      const cap = it.heavy ? 5.5 : 13;
      const f = Math.min(keep, (cap / Math.max(sp * keep, 0.001)) * keep);
      it.rb.setLinvel({ x: v.x * f, y: Math.min(v.y * f, it.heavy ? 1.5 : 8), z: v.z * f }, true);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  /* Released over the placement card (or overlapping it enough)? */
  checkDrop(item, ev) {
    const zone = this.dropZone;
    if (!zone) return;
    const t = item.rb.translation();
    const yaw = this.yaw(item.rb);
    const rect = this.renderer.domElement.getBoundingClientRect();
    const hx = (BUNDLE.w / 2) * this.bounds.s;
    const hz = (BUNDLE.d / 2) * this.bounds.s;
    const c = Math.cos(yaw);
    const s = Math.sin(yaw);
    const boxes = [t.y, 0].map((y) => {
      let x0 = 1e9;
      let y0 = 1e9;
      let x1 = -1e9;
      let y1 = -1e9;
      for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const p = new THREE.Vector3(t.x + a * hx * c + b * hz * s, y, t.z - a * hx * s + b * hz * c).project(this.camera);
        const sx = rect.left + ((p.x + 1) / 2) * rect.width;
        const sy = rect.top + ((1 - p.y) / 2) * rect.height;
        x0 = Math.min(x0, sx);
        x1 = Math.max(x1, sx);
        y0 = Math.min(y0, sy);
        y1 = Math.max(y1, sy);
      }
      return [x0, y0, x1, y1];
    });
    const z = zone.getBoundingClientRect();
    const padX = z.width * 0.08;
    const padY = z.height * 0.12;
    const inside = (x, y) => x >= z.left - padX && x <= z.right + padX && y >= z.top - padY && y <= z.bottom + padY;
    const overlap = ([a, b, c2, d]) => (Math.max(0, Math.min(c2, z.right) - Math.max(a, z.left)) * Math.max(0, Math.min(d, z.bottom) - Math.max(b, z.top))) / (z.width * z.height);
    if (inside(ev.clientX, ev.clientY) || boxes.some(([a, b, c2, d]) => inside((a + c2) / 2, (b + d) / 2)) || boxes.some((bx) => overlap(bx) > 0.3)) this.onDropZone?.(item.key);
  }

  /* After the detail closes, toss the drape back off the card. */
  eject(key) {
    const it = this.bundles.get(key);
    if (!it) return;
    const m = it.rb.mass();
    const a = (Math.PI / 2) * Math.random();
    it.rb.applyImpulse({ x: -9 * Math.cos(a) * m, y: 0.5 * m, z: -11 * Math.sin(a) * m }, true);
  }

  setFilter(tag) {
    this.filter = tag;
    this.items.forEach((it) => {
      if (it.kind !== 'saree') return;
      it.dim = !!tag && !it.saree.tags.includes(tag);
      if (tag && !it.dim) {
        const m = it.rb.mass();
        it.rb.applyImpulse({ x: 0, y: 3.4 * m, z: 0 }, true);
        it.rb.applyTorqueImpulse({ x: 0, y: 0.05 * m, z: 0.02 * m }, true);
      }
    });
  }

  gust(x, z, radius, power) {
    this.gusts.push({ x, z, radius, power, t0: performance.now() / 1000 });
    if (this.gusts.length > 8) this.gusts.shift();
  }

  resize() {
    if (!this.bounds) return;
    this.layout();
  }

  setActive(v) {
    this.active = v;
    if (v) this.last = performance.now();
  }

  /* ---------- per frame ---------- */
  tick() {
    if (!this.active) return;
    const now = performance.now();
    const raw = (now - this.last) / 1000;
    this.last = now;
    const dt = Math.min(raw, 1 / 30);
    this.time += raw;
    this.updateDrag(dt);
    this.updateCursor(dt);
    this.updateGusts(dt);
    this.items.forEach((it) => (it.kind === 'saree' ? this.updateBundle(it, dt) : this.updatePetal(it)));
    this.acc += Math.min(raw, 0.1);
    let steps = 0;
    while (this.acc >= 1 / 60 && steps < 4) {
      this.world.step();
      this.acc -= 1 / 60;
      steps++;
    }
    this.items.forEach((it) => {
      const p = it.rb.translation();
      const r = it.rb.rotation();
      it.root.position.set(p.x, p.y, p.z);
      it.root.quaternion.set(r.x, r.y, r.z, r.w);
      it.shadow.update(it.rb);
    });
    this.updateArcs(dt);
    this.renderer.render(this.scene, this.camera);
  }

  updateDrag() {
    const it = this.dragging;
    if (!it) return;
    this.ray.setFromCamera(this.pointer, this.camera);
    const u = this.hit;
    if (!this.ray.ray.intersectPlane(this.dragPlane, u)) return;
    const b = this.bounds;
    u.x = M.clamp(u.x, b.cx - b.hx + 0.6, b.cx + b.hx - 0.6);
    u.z = M.clamp(u.z, b.cz - b.hz + 0.5, b.zNear - 0.5);
    const p = it.rb.translation();
    const gain = it.heavy ? 5.5 : 13;
    const cap = it.heavy ? 6.5 : 18;
    let vx = (u.x - p.x) * gain;
    let vy = (u.y - p.y) * gain;
    let vz = (u.z - p.z) * gain;
    const sp = Math.hypot(vx, vy, vz);
    if (sp > cap) {
      vx *= cap / sp;
      vy *= cap / sp;
      vz *= cap / sp;
    }
    it.rb.setLinvel({ x: vx, y: vy, z: vz }, true);
    const r = it.rb.rotation();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(new THREE.Quaternion(r.x, r.y, r.z, r.w));
    const w = it.rb.angvel();
    it.rb.setAngvel({ x: -up.z * 6 + vz * 0.05 + w.x * 0.2, y: w.y * 0.85, z: up.x * 6 - vx * 0.05 + w.z * 0.2 }, true);
  }

  updateCursor(dt) {
    const c = this.cursor;
    if (!c.on) {
      c.vx = c.vz = 0;
      return;
    }
    this.ray.setFromCamera(this.pointer, this.camera);
    if (!this.ray.ray.intersectPlane(this.cursorPlane, this.hit)) return;
    const d = Math.max(dt, 0.001);
    c.vx += ((this.hit.x - c.x) / d - c.vx) * 0.25;
    c.vz += ((this.hit.z - c.z) / d - c.vz) * 0.25;
    c.x = this.hit.x;
    c.z = this.hit.z;
  }

  updateGusts(dt) {
    if (!this.gusts.length) return;
    const now = performance.now() / 1000;
    const step = Math.min(dt, 1 / 30);
    const life = 0.55;
    for (let i = this.gusts.length - 1; i >= 0; i--) {
      const g = this.gusts[i];
      const age = now - g.t0;
      if (age > 0.9) {
        this.gusts.splice(i, 1);
        continue;
      }
      this.petals.forEach((pt, key) => {
        const p = pt.rb.translation();
        const dx = p.x - g.x;
        const dz = p.z - g.z;
        const dist = Math.hypot(dx, dz);
        if (dist > g.radius) return;
        const t = age - (dist / g.radius) * 0.3;
        if (t <= 0 || t >= life) return;
        const env = Math.sin((Math.PI * t) / life) ** 2;
        const f = (1 - dist / g.radius) ** 1.4 * g.power;
        const nx = dist > 0.001 ? dx / dist : 1;
        const nz = dist > 0.001 ? dz / dist : 0;
        const k = (2 / life) * env * step * pt.rb.mass();
        const n = Number(key.slice(6)) || 0;
        pt.rb.applyImpulse({ x: nx * f * 26 * k, y: f * 6 * k, z: nz * f * 26 * k }, true);
        pt.rb.applyTorqueImpulse({ x: Math.sin(n * 12.9 + g.t0) * f * 0.01 * k, y: Math.sin(n * 7.3 + g.t0 * 2) * f * 0.015 * k, z: Math.cos(n * 5.1 + g.t0) * f * 0.01 * k }, true);
      });
    }
  }

  updateBundle(it, dt) {
    const rb = it.rb;
    const l = this.bounds.s;
    const n = it.index;
    const t = this.time;
    const u = dt;
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const yawOf = () => {
      const r = rb.rotation();
      return e.setFromQuaternion(q.set(r.x, r.y, r.z, r.w), 'YXZ').y;
    };

    if (it.floating) {
      const p = rb.translation();
      const v = rb.linvel();
      const m = rb.mass();
      const hoverY = (0.62 + (n % 3) * 0.14) * l + 0.08 * Math.sin(t * 0.9 + n * 1.7);
      const damp = 4.2;
      rb.applyImpulse(
        { x: m * (5 * (it.home.x - p.x) - damp * v.x) * u, y: m * (FLOAT_LIFT + 16 * (hoverY - p.y) - 6.2 * v.y) * u, z: m * (5 * (it.home.z - p.z) - damp * v.z) * u },
        true,
      );
      const c = this.cursor;
      if (c.on && !this.dragging) {
        const dx = p.x - c.x;
        const dz = p.z - c.z;
        const d = Math.hypot(dx, dz);
        const R = 2.3 * l;
        if (d < R) {
          const f = (1 - d / R) ** 2;
          const nx = d > 0.001 ? dx / d : 0;
          const nz = d > 0.001 ? dz / d : 0;
          const push = 7.5 * f;
          rb.applyImpulse({ x: m * (nx * push + M.clamp(c.vx, -8, 8) * 0.5 * f) * u, y: 0, z: m * (nz * push + M.clamp(c.vz, -8, 8) * 0.5 * f) * u }, true);
        }
      }
      rb.setAngvel({ x: 0, y: (it.at.ry + 0.22 * Math.sin(t * 0.45 + n) - yawOf()) * 2, z: 0 }, true);
    }

    const s = it.c;
    const vel = rb.linvel();
    // fabric falls softly: limit how fast it can drop near the floor
    if (!it.floating && this.dragging !== it && vel.y < -0.3) {
      const floorY = it.half.y * l;
      const above = Math.max(0, rb.translation().y - floorY);
      const maxFall = M.lerp(0.6, 2.4, M.smoothstep(above, 0.04, 0.9));
      if (vel.y < -maxFall) rb.applyImpulse({ x: 0, y: rb.mass() * (-maxFall - vel.y) * 40 * u, z: 0 }, true);
    }
    const V = new THREE.Vector3(vel.x, vel.y, vel.z);
    const A = V.clone().sub(s.prev).divideScalar(Math.max(u, 0.001));
    s.prev.copy(V);
    const rot = rb.rotation();
    q.set(rot.x, rot.y, rot.z, rot.w).invert();
    A.applyQuaternion(q);
    const ph = t + n * 2.1;
    const breathe = 0.6 + 0.4 * Math.sin(ph * 0.37);
    const lagGoal = A.multiplyScalar(-0.0026).clampLength(0, 0.22);
    lagGoal.x += Math.sin(ph * 0.8) * 0.035 * breathe;
    lagGoal.z += Math.cos(ph * 0.63 + 1.3) * 0.03 * breathe;
    for (const k of ['x', 'y', 'z']) [s.lag[k], s.lagV[k]] = spring(s.lag[k], s.lagV[k], lagGoal[k], 62, 9.5, u);
    const speed = V.length();
    const landed = s.prevVy < -2 && vel.y - s.prevVy > 1.5 ? Math.min(1, (vel.y - s.prevVy) / 9) : 0;
    const pos = rb.translation();
    if (!it.floating && !s.gusted && vel.y < -1.6 && pos.y < 0.75 * l && this.dragging !== it) {
      s.gusted = true;
      this.gust(pos.x, pos.z, 3.4 * l, 0.4 + Math.min(1, -vel.y / 7));
    }
    if (vel.y > -0.3 && pos.y < 0.4 * l) s.gusted = false;
    s.prevVy = vel.y;
    const idle = 0.42 + 0.16 * Math.sin(ph * 0.5) + 0.08 * Math.sin(ph * 1.3);
    const rip = Math.max(idle, Math.min(1, speed / 7) + landed * 0.9);
    s.ripple += (rip - s.ripple) * (rip > s.ripple ? 0.25 : 0.035);
    if (landed) s.slumpV += landed * 3.4;
    const [sl, slV] = spring(s.slump, s.slumpV, 0, 38, 11, u);
    s.slump = M.clamp(sl, -0.15, 0.6);
    s.slumpV = slV;

    // tilt the visible bundle: lean into motion, droop toward the hand while held
    {
      const ts = it.tiltS;
      const yaw = yawOf();
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const lx = vel.x * cy - vel.z * sy;
      const lz = vel.x * sy + vel.z * cy;
      const gx = it.grab.x * s.hold;
      const gz = it.grab.y * s.hold;
      const toX = it.floating ? 0.32 + 0.06 * Math.sin(t * 0.9 + n) : M.clamp(lz * 0.045 - gz * 0.16, -0.38, 0.38);
      const toZ = it.floating ? -0.14 + 0.05 * Math.sin(t * 0.7 + n) : M.clamp(-lx * 0.045 + gx * 0.22, -0.38, 0.38);
      [ts.x, ts.vx] = spring(ts.x, ts.vx, toX, 45, 8, u);
      [ts.z, ts.vz] = spring(ts.z, ts.vz, toZ, 45, 8, u);
      const shake = s.hold * Math.min(1, Math.hypot(vel.x, vel.z) / 5);
      it.tilt.rotation.set(ts.x + Math.sin(t * 5.1) * 0.012 * shake, Math.sin(t * 4.3 + n) * 0.02 * shake, ts.z + Math.cos(t * 4.7) * 0.014 * shake);
    }

    const U = it.uniforms;
    U.uLag.value.copy(s.lag);
    U.uRipple.value = s.ripple;
    // petals resting on the cloth get tossed by its ripple
    if (this.dragging !== it && this.petals.size) {
      const wave = (x, z, tt) => Math.sin(x * 3.2 + z * 2.1 - tt * 7) * 0.6 + Math.sin(x * 6.3 - z * 4.7 + tt * 9.5) * 0.4;
      const yaw = yawOf();
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      const topY = pos.y + (it.half.y + SKIN) * l;
      this.petals.forEach((pt) => {
        const pp = pt.rb.translation();
        const dx = pp.x - pos.x;
        const dz = pp.z - pos.z;
        const qx = (dx * cy - dz * sy) / l / it.half.x;
        const qz = (dx * sy + dz * cy) / l / it.half.z;
        const dy = pp.y - topY;
        if (Math.abs(qx) > 1.2 || Math.abs(qz) > 1.2 || dy < -0.12 * l || dy > 0.3 * l) return;
        const edge = M.smoothstep(Math.max(Math.abs(qx), Math.abs(qz)), 0.55, 1);
        const amp = s.ripple * (0.25 + 0.75 * edge) * it.half.y * 0.55 * l;
        const w0 = wave(qx, qz, t);
        const vy = (amp * (w0 - wave(qx, qz, t - 0.03))) / 0.03;
        const gx = (((wave(qx + 0.05, qz, t) - w0) / 0.05 / it.half.x) * amp) / l;
        const gz = (((wave(qx, qz + 0.05, t) - w0) / 0.05 / it.half.z) * amp) / l;
        const rr = Math.hypot(qx, qz) || 1;
        const fx = -gx * 70 + (qx / rr) * edge * s.ripple * 16;
        const fz = -gz * 70 + (qz / rr) * edge * s.ripple * 16;
        const m = pt.rb.mass();
        pt.rb.applyImpulse({ x: m * (fx * cy + fz * sy) * u, y: m * Math.max(0, vy) * 40 * u, z: m * (-fx * sy + fz * cy) * u }, true);
      });
    }
    U.uSlump.value = s.slump;
    const held = this.dragging === it;
    [s.hold, s.holdV] = spring(s.hold, s.holdV, held ? 1 : 0, 70, 9, u);
    U.uHold.value = s.hold;

    // resting on another bundle? the overhang sags around it
    let sup = null;
    if (!it.floating && !held && vel.y > -1.5) {
      const yaw = yawOf();
      const cy = Math.cos(yaw);
      const sy = Math.sin(yaw);
      this.bundles.forEach((other, key) => {
        if (key === it.key || sup) return;
        const op = other.rb.translation();
        const dy = pos.y - op.y;
        if (dy < 0.3 * l || dy > 0.95 * l) return;
        const dx = op.x - pos.x;
        const dz = op.z - pos.z;
        const oy = this.yaw(other.rb);
        const oc = Math.cos(oy);
        const os = Math.sin(oy);
        const ax = -dx * oc - dz * os;
        const az = dx * os - dz * oc;
        if (Math.abs(ax) > it.half.x * 1.9 * l || Math.abs(az) > it.half.z * 1.9 * l) return;
        const px = Math.sign(ax) * Math.max(0, Math.abs(ax) - it.half.x * l * 1.55);
        const pz = Math.sign(az) * Math.max(0, Math.abs(az) - it.half.z * l * 1.55);
        sup = { sx: (dx * cy - dz * sy) / l, sz: (dx * sy + dz * cy) / l, dyaw: oy - yaw, px: px * oc - pz * os, pz: px * os + pz * oc };
      });
    }
    if (sup) {
      U.uSup.value.set(sup.sx, sup.sz, it.half.x, it.half.z);
      U.uSupRot.value.set(Math.cos(sup.dyaw), Math.sin(sup.dyaw));
      const d = Math.hypot(sup.px, sup.pz);
      if (d > 0.02) {
        const k = (Math.min(1, d / (0.2 * l)) * 20 * rb.mass() * u) / d;
        rb.applyImpulse({ x: sup.px * k, y: 0, z: sup.pz * k }, true);
      }
    }
    [s.drape, s.drapeV] = spring(s.drape, s.drapeV, sup ? 1 : 0, 46, 9, u);
    U.uSag.value = Math.max(0, s.drape);
    U.uTime.value = t;
    const op = it.dim ? 0.22 : 1;
    it.mats.forEach((m) => (m.opacity += (op - m.opacity) * 0.12));
    it.shadow.strength = it.dim ? 0.22 : 1;
  }

  updatePetal(pt) {
    const rb = pt.rb;
    const a = pt.k;
    const y = rb.translation().y;
    const m = rb.mass();
    const c = 1 / 60;
    const r = rb.rotation();
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(new THREE.Quaternion(r.x, r.y, r.z, r.w));
    const right = new THREE.Vector3().crossVectors(up, new THREE.Vector3(0, 1, 0));
    const settle = 0.07 + 0.93 * (1 - M.smoothstep(y, 0.15 * a, 1.2 * a));
    const w = rb.angvel();
    rb.applyTorqueImpulse({ x: (right.x * 2.6 * settle - w.x * 0.06) * m * c, y: 0, z: (right.z * 2.6 * settle - w.z * 0.06) * m * c }, true);
    // petals don't stack: they slide off one another
    {
      const p = rb.translation();
      let fx = 0;
      let fz = 0;
      let fy = 0;
      this.petals.forEach((o, key) => {
        if (key === pt.key) return;
        const q = o.rb.translation();
        const dx = p.x - q.x;
        const dz = p.z - q.z;
        const dy = p.y - q.y;
        const R = 0.8 * a;
        const d = Math.hypot(dx, dz);
        if (d >= R || Math.abs(dy) > 0.45 * a) return;
        const f = (1 - d / R) ** 1.5;
        const inv = d > 0.001 ? 1 / d : 0;
        fx += (inv ? dx * inv : Math.cos(pt.i * 2.4)) * f;
        fz += (inv ? dz * inv : Math.sin(pt.i * 2.4)) * f;
        fy += Math.sign(dy || 1) * f * 0.35;
      });
      if (fx || fz) rb.applyImpulse({ x: fx * 7 * m * c, y: fy * 3 * m * c, z: fz * 7 * m * c }, true);
    }
    // airborne petals flutter and swing as they fall
    const air = M.smoothstep(y, 0.05, 0.4);
    if (air <= 0) return;
    const t = this.time + pt.i * 1.3;
    const swing = Math.sin(t * 3.3);
    const head = pt.i * 1.9 + Math.sin(t * 0.21) * 0.6;
    const hc = Math.cos(head);
    const hs = Math.sin(head);
    rb.applyImpulse({ x: (hc * swing * 3.2 + Math.sin(t * 1.3) * 0.3) * air * m * c, y: 0, z: (hs * swing * 3.2 + Math.cos(t * 1.1) * 0.3) * air * m * c }, true);
    const v = rb.linvel();
    const bank = M.clamp((v.x * hc + v.z * hs) * 0.5, -0.28, 0.28);
    const want = new THREE.Vector3(hc * bank, 1, hs * bank).normalize();
    const tq = new THREE.Vector3().crossVectors(up, want);
    rb.applyTorqueImpulse({ x: tq.x * 2.3 * air * m * c, y: tq.y * 2.3 * air * m * c, z: tq.z * 2.3 * air * m * c }, true);
  }

  /* Two little gold arcs flank a drape while it is held. */
  updateArcs(dt) {
    const host = this.arcs;
    if (!host) return;
    const [L, R] = host.children;
    const f = this.arcState;
    const d = Math.min(dt, 1 / 30);
    const it = this.dragging;
    const heavy = !!it?.heavy;
    f.a += ((heavy ? 1 : 0) - f.a) * (1 - Math.exp(-d * (heavy ? 18 : 9)));
    if (f.a < 0.01 && !heavy) {
      L.style.opacity = R.style.opacity = '0';
      f.init = false;
      return;
    }
    const W = this.renderer.domElement.clientWidth;
    const H = this.renderer.domElement.clientHeight;
    if (it) {
      const p = it.rb.translation();
      const v = new THREE.Vector3(p.x, p.y, p.z).project(this.camera);
      const sx = (v.x * 0.5 + 0.5) * W;
      const sy = (-v.y * 0.5 + 0.5) * H;
      const right = new THREE.Vector3();
      this.camera.matrixWorld.extractBasis(right, new THREE.Vector3(), new THREE.Vector3());
      const edge = new THREE.Vector3(p.x, p.y, p.z).addScaledVector(right, 1.2 * this.bounds.s).project(this.camera);
      const hw = Math.abs((edge.x * 0.5 + 0.5) * W - sx);
      if (!f.init) {
        f.px = sx;
        f.py = sy;
        f.init = true;
      }
      f.vx += ((sx - f.px) / Math.max(d, 0.001) - f.vx) * 0.25;
      f.vy += ((sy - f.py) / Math.max(d, 0.001) - f.vy) * 0.25;
      f.px = f.x = sx;
      f.py = f.y = sy;
      f.hw = hw;
    }
    const hw = f.hw ?? 90;
    const sp = Math.min(1, Math.hypot(f.vx, f.vy) / 700);
    f.speed += (sp - f.speed) * (1 - Math.exp(-d * 10));
    const t = this.time;
    f.lean += (M.clamp(f.vx * 0.02, -16, 16) - f.lean) * (1 - Math.exp(-d * 9));
    const wob = Math.sin(t * 6.2) * (2.5 + 5 * f.speed);
    const b1 = 0.5 - 0.5 * Math.cos(t * 10);
    const b2 = 0.5 - 0.5 * Math.cos(t * 10 - 1.7);
    const ox = M.clamp(-f.vx * 0.025, -16, 16);
    const oy = M.clamp(-f.vy * 0.02, -10, 10);
    const place = (el, side) => {
      const x = Math.round(f.x + side * (hw + 16) + ox * 0.5);
      const y = Math.round(f.y - 10 + oy * 0.5);
      const rot = side * (f.lean * 0.6 + wob);
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${rot.toFixed(2)}deg)`;
      el.style.opacity = String(Math.min(1, f.a) * 0.55);
      const imgs = el.querySelectorAll('img');
      if (imgs.length === 2) {
        const a = 2 * b1;
        const c = 2.6 * b2;
        imgs[1].style.transform = `translate(${a.toFixed(2)}px, ${(-a * 0.55).toFixed(2)}px)`;
        imgs[0].style.transform = `translate(${c.toFixed(2)}px, ${(-c * 0.55).toFixed(2)}px)`;
      }
    };
    place(L, -1);
    place(R, 1);
  }
}
