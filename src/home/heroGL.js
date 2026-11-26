// Full-screen WebGL hero: each photo's loose fabric sways, and moving between slides
// a length of the next saree sweeps across the lens like a pallu caught in the wind.
const VERT = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const frag = (samples) => `
precision highp float;
#define CLOTH_SAMPLES ${samples}
uniform vec2 uRes; uniform float uTime; uniform float uSway; uniform vec2 uShift; uniform float uSwayB;
uniform sampler2D uTexA; uniform sampler2D uMaskA; uniform float uAspA; uniform float uCropA; uniform vec2 uFocA; uniform float uScaleA;
uniform sampler2D uTexB; uniform sampler2D uMaskB; uniform float uAspB; uniform float uCropB; uniform vec2 uFocB; uniform float uScaleB;
uniform float uSweep; uniform vec2 uDir; uniform vec2 uSwatch; uniform vec2 uHalf; uniform float uSwatchScale;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec2 coverUV(vec2 uv, float imgAsp, float cropX) {
  float va = uRes.x / uRes.y;
  vec2 s = va > imgAsp ? vec2(1.0, imgAsp / va) : vec2(va / imgAsp, 1.0);
  vec2 c = (uv - 0.5) * s + 0.5;
  c.x += (1.0 - s.x) * (cropX - 0.5);
  return c;
}

// mask: R amplitude (0 at the pin, rising to the free edge), G phase, B flow angle
vec3 fabric(sampler2D tex, sampler2D mask, float asp, vec2 uv, float ampMul) {
  vec4 m = texture2D(mask, uv);
  float amp = m.r * uSway * ampMul;
  if (amp < 0.003) return texture2D(tex, uv).rgb;
  float t = uTime;
  float ph = m.g * 6.2831;
  float a = m.b * 6.2831;
  vec2 dir = vec2(cos(a), sin(a));
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 p = uv * vec2(asp, 1.0);
  float s = dot(p, dir);
  float n = dot(p, nrm);
  float gust = 0.7 + 0.3 * sin(t * 0.31 + ph);
  float w1 = sin(s * 7.0 - t * 1.5 + ph + sin(n * 3.0 + t * 0.45) * 0.8);
  float w2 = sin(s * 15.0 - t * 2.3 + n * 4.0 + ph * 1.7);
  vec2 d = (nrm * (w1 * 0.75 + w2 * 0.25) + dir * w2 * 0.2) * amp * gust * 0.011;
  d.x /= asp;
  vec3 c = texture2D(tex, clamp(uv + d, 0.001, 0.999)).rgb;
  float fold = cos(s * 7.0 - t * 1.5 + ph) * 0.65 + w2 * 0.35;
  c *= 1.0 + fold * amp * gust * 0.085;
  return c;
}

vec3 scene(sampler2D tex, sampler2D mask, float asp, float crop, vec2 foc, float scale, vec2 uv, float ampMul) {
  vec2 base = foc + (coverUV(uv, asp, crop) - foc) / scale + uShift / scale;
  return fabric(tex, mask, asp, clamp(base, 0.0, 1.0), ampMul);
}

vec2 swatchUV(vec2 o) {
  vec2 q = o / (2.0 * uHalf) + 0.5;
  q = 1.0 - abs(1.0 - mod(q, 2.0));
  return uSwatch + (q - 0.5) * 2.0 * uHalf;
}

void main() {
  vec2 uv = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);
  float va = uRes.x / uRes.y;
  float jitter = hash(gl_FragCoord.xy + fract(uTime));
  vec3 col;
  if (uSweep <= 0.0) {
    col = scene(uTexA, uMaskA, uAspA, uCropA, uFocA, uScaleA, uv, 1.0);
  } else if (uSweep >= 1.0) {
    col = scene(uTexB, uMaskB, uAspB, uCropB, uFocB, uScaleB, uv, uSwayB);
  } else {
    vec3 a = scene(uTexA, uMaskA, uAspA, uCropA, uFocA, uScaleA, uv, 1.0);
    vec3 b = scene(uTexB, uMaskB, uAspB, uCropB, uFocB, uScaleB, uv, uSwayB);
    float s = uSweep;
    vec2 dir = uDir;
    vec2 nrm = vec2(-dir.y, dir.x);
    vec2 p = (uv - 0.5) * vec2(va, 1.0);
    float E = 0.5 * (abs(dir.x) * va + abs(dir.y));
    float dn = dot(p, dir) / E;
    float ac = dot(p, nrm);
    float W = 1.75;
    float lead = mix(-1.35, 1.35 + W, s) + 0.11 * sin(ac * 4.0 + s * 7.0 + uTime * 0.8) + 0.05 * sin(ac * 10.0 - s * 12.0);
    float trail = lead - W + 0.2 * sin(ac * 3.0 - s * 6.0 + 1.3) + 0.07 * sin(ac * 8.0 + s * 9.0);
    if (dn > lead) {
      float shadow = smoothstep(lead + 0.4, lead, dn);
      col = a * (1.0 - 0.32 * shadow);
    } else if (dn < trail) {
      col = b;
    } else {
      float ct = (dn - trail) / (lead - trail);
      vec3 beneath = mix(b, a, smoothstep(0.3, 0.8, ct));
      float along = (dn - lead) * E;
      float fold = sin(ac * 13.0 + along * 2.5 + uTime * 1.3) * 0.6 + sin(ac * 29.0 - along * 4.0) * 0.4;
      vec2 off = dir * along + nrm * (ac + fold * 0.012);
      vec3 cloth = vec3(0.0);
      for (int i = 0; i < CLOTH_SAMPLES; i++) {
        float k = (float(i) + jitter) / float(CLOTH_SAMPLES) - 0.5;
        vec2 o = (off + dir * k * 0.022) * uSwatchScale;
        o.x /= uAspB;
        cloth += texture2D(uTexB, swatchUV(o)).rgb;
      }
      cloth /= float(CLOTH_SAMPLES);
      cloth *= 0.82 + 0.28 * fold;
      float sheen = pow(max(0.0, sin(ac * 5.0 + along * 2.0 - s * 10.0)), 10.0);
      cloth += vec3(1.0, 0.93, 0.8) * sheen * 0.4;
      float border = smoothstep(0.895, 0.925, ct) * (1.0 - smoothstep(0.962, 0.982, ct));
      float lum = dot(cloth, vec3(0.3, 0.59, 0.11));
      float glint = pow(hash(floor(gl_FragCoord.xy / 2.0) + floor(uTime * 10.0)), 140.0) * 1.6;
      vec3 zari = vec3(0.93, 0.75, 0.42) * (0.55 + 0.75 * lum) + glint;
      cloth = mix(cloth, zari, border * 0.8);
      float alpha = mix(0.55, 0.95, smoothstep(0.05, 0.55, ct)) * smoothstep(0.0, 0.07, ct) * (1.0 - smoothstep(0.985, 1.0, ct));
      col = mix(beneath, cloth, alpha);
    }
  }
  col += (hash(gl_FragCoord.xy * 0.37 + uTime) - 0.5) * 0.018;
  gl_FragColor = vec4(col, 1.0);
}
`;

const UNIFORMS = ['uRes', 'uTime', 'uSway', 'uShift', 'uSwayB', 'uTexA', 'uMaskA', 'uAspA', 'uCropA', 'uFocA', 'uScaleA', 'uTexB', 'uMaskB', 'uAspB', 'uCropB', 'uFocB', 'uScaleB', 'uSweep', 'uDir', 'uSwatch', 'uHalf', 'uSwatchScale'];
const ZOOM = 1.03;
const MASK = 128;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// horizontal crop: on narrow screens keep the slide's chosen x in view
function cropX(viewAsp, imgAsp, mobileX) {
  if (viewAsp >= imgAsp) return 0.5;
  if (viewAsp >= 1.2) return 0;
  const r = viewAsp / imgAsp;
  return clamp01(0.5 + (mobileX - 0.5) / (1 - r));
}
const sweepEase = (v) => clamp01((v - 0.06) / 0.88);

const loadImage = (src) =>
  new Promise((res, rej) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(`Failed to load ${src}`));
    img.src = src;
  });

function fabricMask(regions, asp) {
  const big = document.createElement('canvas');
  big.width = big.height = 512;
  const g = big.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, 512, 512);
  regions.forEach((r, i) => {
    const cx = r.pts.reduce((s, p) => s + p[0], 0) / r.pts.length;
    const cy = r.pts.reduce((s, p) => s + p[1], 0) / r.pts.length;
    let ang = Math.atan2(cy - r.pin[1], (cx - r.pin[0]) * asp);
    if (ang < 0) ang += Math.PI * 2;
    const reach = Math.max(...r.pts.map(([x, y]) => Math.hypot((x - r.pin[0]) * asp, y - r.pin[1])));
    const ph = Math.round(((i * 0.37 + 0.11) % 1) * 255);
    const fl = Math.round((ang / (Math.PI * 2)) * 255);
    g.save();
    g.scale(1 / asp, 1);
    const px = r.pin[0] * 512 * asp;
    const py = r.pin[1] * 512;
    const grad = g.createRadialGradient(px, py, 0, px, py, reach * 512);
    grad.addColorStop(0, `rgb(${Math.round(r.amp * 255 * 0.05)},${ph},${fl})`);
    grad.addColorStop(0.35, `rgb(${Math.round(r.amp * 255 * 0.55)},${ph},${fl})`);
    grad.addColorStop(1, `rgb(${Math.round(r.amp * 255)},${ph},${fl})`);
    g.fillStyle = grad;
    g.beginPath();
    r.pts.forEach(([x, y], k) => (k ? g.lineTo(x * 512 * asp, y * 512) : g.moveTo(x * 512 * asp, y * 512)));
    g.closePath();
    g.fill();
    g.restore();
  });
  const small = document.createElement('canvas');
  small.width = small.height = MASK;
  const s = small.getContext('2d');
  s.imageSmoothingEnabled = true;
  s.imageSmoothingQuality = 'high';
  s.drawImage(big, 0, 0, MASK, MASK);
  return small;
}

export class HeroGL {
  static create(canvas, opts) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    return gl ? new HeroGL(canvas, gl, opts) : null;
  }
  constructor(canvas, gl, opts) {
    this.canvas = canvas;
    this.gl = gl;
    this.opts = opts;
    this.u = {};
    this.shots = [];
    const prog = gl.createProgram();
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader error');
      return s;
    };
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag(opts.lowPower ? 3 : 6)));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    UNIFORMS.forEach((n) => (this.u[n] = gl.getUniformLocation(prog, n)));
  }
  texture(src) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  async load(slides) {
    const imgs = await Promise.all(slides.map((s) => loadImage(s.image)));
    this.shots = imgs.map((img, i) => {
      const asp = img.naturalWidth / img.naturalHeight;
      return { tex: this.texture(img), mask: this.texture(fabricMask(slides[i].fabric, asp)), aspect: asp, focus: slides[i].focus, mobileX: slides[i].mobileX, sweep: slides[i].sweep };
    });
  }
  bind(k, shot, unit) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, shot.tex);
    gl.activeTexture(gl.TEXTURE0 + unit + 1);
    gl.bindTexture(gl.TEXTURE_2D, shot.mask);
    gl.uniform1i(this.u[`uTex${k}`], unit);
    gl.uniform1i(this.u[`uMask${k}`], unit + 1);
    gl.uniform1f(this.u[`uAsp${k}`], shot.aspect);
    gl.uniform2f(this.u[`uFoc${k}`], shot.focus[0], shot.focus[1]);
    gl.uniform1f(this.u[`uCrop${k}`], cropX(this.canvas.clientWidth / this.canvas.clientHeight, shot.aspect, shot.mobileX));
  }
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.opts.lowPower ? 1.25 : 2);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  }
  render(progress, time, shift) {
    if (!this.shots.length) return;
    const gl = this.gl;
    const n = this.shots.length;
    const motion = this.opts.reduceMotion ? 0 : 1;
    this.resize();
    const i = Math.min(Math.floor(progress), n - 2);
    const f = progress - i;
    const s = motion ? sweepEase(f) : f < 0.5 ? 0 : 1;
    gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.uTime, motion ? time : 0);
    gl.uniform1f(this.u.uSway, motion);
    gl.uniform2f(this.u.uShift, shift.x * 0.004 * motion, shift.y * 0.003 * motion);
    const a = this.shots[i];
    const b = this.shots[i + 1];
    this.bind('A', a, 0);
    this.bind('B', b, 2);
    const r = 1 - s;
    gl.uniform1f(this.u.uScaleA, ZOOM * (1 + 0.07 * s * motion));
    gl.uniform1f(this.u.uScaleB, ZOOM * (1 + 0.09 * r * r * motion));
    gl.uniform1f(this.u.uSwayB, 1 + 1.4 * r * motion);
    const [dx, dy] = b.sweep.dir;
    const len = Math.hypot(dx, dy) || 1;
    gl.uniform1f(this.u.uSweep, s);
    gl.uniform2f(this.u.uDir, dx / len, dy / len);
    gl.uniform2f(this.u.uSwatch, b.sweep.swatch[0], b.sweep.swatch[1]);
    gl.uniform2f(this.u.uHalf, b.sweep.half[0], b.sweep.half[1]);
    gl.uniform1f(this.u.uSwatchScale, b.sweep.scale);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  // image UV → screen fraction, so overlays can follow the photo
  uvToScreen(i, x, y) {
    const shot = this.shots[i];
    if (!shot) return null;
    const va = this.canvas.clientWidth / this.canvas.clientHeight;
    const s = va > shot.aspect ? [1, shot.aspect / va] : [va / shot.aspect, 1];
    const ux = shot.focus[0] + (x - shot.focus[0]) * ZOOM;
    const uy = shot.focus[1] + (y - shot.focus[1]) * ZOOM;
    return [(ux - 0.5 - (1 - s[0]) * (cropX(va, shot.aspect, shot.mobileX) - 0.5)) / s[0] + 0.5, (uy - 0.5) / s[1] + 0.5];
  }
}
