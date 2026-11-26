import * as THREE from 'three';
import gsap from 'gsap';

// Full-screen image slider. Each change plays a "fabric sweep": a close-up of the
// next garment flows in from the left behind a wavy gold-edged front, then pulls
// back and settles into the next image while it slowly zooms out.
const frag = /* glsl */ `
precision highp float;
uniform sampler2D tA;
uniform sampler2D tB;
uniform vec2 uRes;
uniform vec2 uImgA;
uniform vec2 uImgB;
uniform float uP;
uniform float uTime;
uniform float uZoomA;
uniform float uZoomB;
uniform vec2 uMouse;
uniform vec3 uGold;
varying vec2 vUv;

vec2 cover(vec2 uv, vec2 img, float zoom, vec2 focus){
  float rs = uRes.x / uRes.y;
  float ri = img.x / img.y;
  vec2 scale = rs > ri ? vec2(1.0, ri / rs) : vec2(rs / ri, 1.0);
  vec2 c = (uv - 0.5) * scale / (zoom * 1.04) + 0.5 + focus;
  return clamp(c, 0.001, 0.999);
}

void main(){
  vec2 uv = vUv;
  vec2 par = (uMouse - 0.5) * 0.012;
  float p = uP;

  // where the wavy front of the fabric is (sweeps left -> right)
  float sweep = smoothstep(0.0, 0.62, p);
  float edge = mix(-0.35, 1.35, sweep)
    + 0.09 * sin(uv.y * 5.5 + uTime * 2.2 + p * 6.0)
    + 0.045 * sin(uv.y * 13.0 - uTime * 3.1)
    + 0.18 * (uv.y - 0.5) * (1.0 - sweep);
  float behind = smoothstep(edge + 0.004, edge - 0.004, uv.x);

  // outgoing image, pushed and slightly darkened near the front
  float push = smoothstep(0.25, 0.0, edge - uv.x) * (1.0 - behind);
  vec2 ua = cover(uv + vec2(push * 0.05, 0.0), uImgA, uZoomA, par);
  vec3 a = texture2D(tA, ua).rgb * (1.0 - push * 0.18);

  // the incoming garment as a moving close-up: zoomed, rippled, streaked
  float settle = smoothstep(0.5, 1.0, p);
  float zoomCloth = mix(2.1, uZoomB, settle);
  float wave = (1.0 - settle);
  vec2 ub = uv;
  ub.y += wave * 0.035 * sin(uv.x * 7.0 + uTime * 2.5);
  ub.x += wave * 0.05 * sin(uv.y * 4.0 - uTime * 1.8);
  vec2 cb = cover(ub, uImgB, zoomCloth, par + vec2(-0.08 * wave, 0.04 * wave));
  vec3 b = vec3(0.0);
  float blur = 0.012 * wave;
  for (int i = 0; i < 7; i++) {
    float o = (float(i) - 3.0) / 3.0;
    b += texture2D(tB, cb + vec2(o * blur, o * blur * 0.3)).rgb;
  }
  b /= 7.0;
  // silky sheen bands across the cloth while it moves
  float sheen = pow(0.5 + 0.5 * sin((uv.x + uv.y * 0.6) * 9.0 - uTime * 3.0), 6.0);
  b += sheen * 0.12 * wave;

  vec3 col = mix(a, b, behind);

  // gold ribbon on the leading edge
  float d = uv.x - edge;
  float ribbon = smoothstep(0.03, 0.0, abs(d + 0.012)) * (1.0 - settle) * step(0.001, p) * step(p, 0.999);
  float rshade = 0.75 + 0.35 * sin(uv.y * 40.0 + uTime * 4.0);
  col = mix(col, uGold * rshade, ribbon * 0.85);
  // soft shadow cast by the front onto the outgoing image
  col *= 1.0 - smoothstep(0.08, 0.0, d) * step(0.0, d) * 0.22 * (1.0 - settle);

  gl_FragColor = vec4(col, 1.0);
}
`;

const vert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export class HeroSlider {
  constructor(container, slides, { reduced, onLoad }) {
    this.container = container;
    this.reduced = reduced;
    this.slides = slides;
    this.index = 0;
    this.busy = false;
    this.active = true;
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const loader = new THREE.TextureLoader();
    let loaded = 0;
    this.textures = slides.map((s) =>
      loader.load(s.image, (t) => {
        t.userData.size = new THREE.Vector2(t.image.width, t.image.height);
        if (++loaded === slides.length) onLoad?.();
      }),
    );
    this.textures.forEach((t) => {
      // raw shader output: keep texels as-is so the photo is not darkened
      t.colorSpace = THREE.NoColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
    });

    this.uniforms = {
      tA: { value: this.textures[0] },
      tB: { value: this.textures[0] },
      uRes: { value: new THREE.Vector2(1, 1) },
      uImgA: { value: new THREE.Vector2(1920, 1080) },
      uImgB: { value: new THREE.Vector2(1920, 1080) },
      uP: { value: 0 },
      uTime: { value: 0 },
      uZoomA: { value: 1 },
      uZoomB: { value: 1 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uGold: { value: new THREE.Color('#e9c46a') },
    };
    this.scene.add(
      new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: this.uniforms, depthTest: false }),
      ),
    );
    this.mouse = new THREE.Vector2(0.5, 0.5);
    window.addEventListener('pointermove', (e) => this.mouse.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight));
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.clock = new THREE.Clock();
  }

  size(i) {
    return this.textures[i].userData.size || new THREE.Vector2(1920, 1080);
  }

  /** Slow zoom-out on the image that is showing ("Ken Burns" settle). */
  intro() {
    const u = this.uniforms;
    u.uImgA.value.copy(this.size(0));
    gsap.fromTo(u.uZoomA, { value: this.reduced ? 1 : 1.35 }, { value: 1, duration: this.reduced ? 0 : 3.2, ease: 'power3.out' });
  }

  goTo(next) {
    if (next === this.index) return null;
    const u = this.uniforms;
    gsap.killTweensOf(u.uP);
    gsap.killTweensOf(u.uZoomA);
    gsap.killTweensOf(u.uZoomB);
    // whatever is on screen right now becomes the outgoing image
    if (u.uP.value > 0) {
      u.tA.value = u.tB.value;
      u.uImgA.value.copy(u.uImgB.value);
      u.uZoomA.value = u.uZoomB.value;
    }
    u.tB.value = this.textures[next];
    u.uImgB.value.copy(this.size(next));
    u.uP.value = 0;
    u.uZoomB.value = 1.22;
    this.index = next;
    this.uniforms.uGold.value.set(this.slides[next].gold || '#e9c46a');
    const dur = this.reduced ? 0.01 : 2.1;
    const tl = gsap.timeline({
      onComplete: () => {
        u.tA.value = u.tB.value;
        u.uImgA.value.copy(u.uImgB.value);
        u.uZoomA.value = u.uZoomB.value;
        u.uP.value = 0;
        gsap.to(u.uZoomA, { value: 1, duration: this.reduced ? 0 : 2.4, ease: 'power3.out' });
      },
    });
    tl.to(u.uP, { value: 1, duration: dur, ease: 'power2.inOut' }, 0);
    tl.to(u.uZoomB, { value: 1.08, duration: dur, ease: 'power2.out' }, 0);
    return tl;
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h, false);
    this.uniforms.uRes.value.set(w, h);
  }

  tick() {
    const dt = this.clock.getDelta();
    if (!this.active) return;
    this.uniforms.uTime.value += dt;
    this.uniforms.uMouse.value.lerp(this.mouse, 0.05);
    this.renderer.render(this.scene, this.camera);
  }
}
