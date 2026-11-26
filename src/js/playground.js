import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import gsap from 'gsap';
import { DRAPES } from './drapes.js';
import { createDrapeMesh, setMeshOpacity, DRAPE_SIZE } from './drapeMesh.js';
import { PetalField } from './petals.js';

const LIFT_HEIGHT = 2.4;

/**
 * "Pick a Drape": folded drapes resting on a soft floor. Lift one with the pointer
 * (it hangs from a spring constraint so it sways), throw it, or drop it on the
 * placement card to open the detail view. Rose petals drift through the scene.
 */
export class Playground {
  constructor({ container, dropZone, cursor, reduced, onSelect }) {
    this.container = container;
    this.dropZone = dropZone;
    this.cursor = cursor;
    this.reduced = reduced;
    this.onSelect = onSelect;
    this.active = true;
    this.started = false;
    this.filter = 'all';

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);

    this.setupLights();
    this.setupPhysics();
    this.setupDrapes();

    this.petals = new PetalField(this.scene, {
      count: reduced ? 12 : window.innerWidth < 760 ? 18 : 30,
      bounds: { xMin: -8, xMax: 8, zMin: -5, zMax: 5, top: 7 },
      reduced,
    });

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2(-9, -9);
    this.liftPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -LIFT_HEIGHT);
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.tmp = new THREE.Vector3();
    this.hovered = null;
    this.held = null;

    this.bindEvents();
    this.resize();
    this.clock = new THREE.Clock();
  }

  setupLights() {
    const hemi = new THREE.HemisphereLight('#fff4ec', '#e9cbbf', 1.5);
    this.scene.add(hemi);
    const key = new THREE.DirectionalLight('#fff3e2', 2.6);
    key.position.set(-6, 14, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -14;
    key.shadow.camera.right = 14;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 40;
    key.shadow.radius = 14;
    key.shadow.blurSamples = 20;
    key.shadow.bias = -0.0006;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight('#ffd6e0', 0.9);
    rim.position.set(8, 6, -6);
    this.scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.ShadowMaterial({ color: '#6d4335', opacity: 0.2 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  setupPhysics() {
    this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -22, 0) });
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = true;
    this.world.defaultContactMaterial.friction = 0.45;
    this.world.defaultContactMaterial.restitution = 0.08;

    const ground = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(ground);

    // invisible walls, positioned on resize to match what the camera sees
    this.walls = [0, 1, 2, 3].map(() => {
      const b = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
      this.world.addBody(b);
      return b;
    });

    this.hand = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC });
    this.hand.collisionFilterGroup = 0;
    this.hand.collisionFilterMask = 0;
    this.world.addBody(this.hand);
  }

  setupDrapes() {
    const half = new CANNON.Vec3(DRAPE_SIZE.x / 2, DRAPE_SIZE.y / 2 + 0.03, DRAPE_SIZE.z / 2);
    this.items = DRAPES.map((drape, i) => {
      const mesh = createDrapeMesh(drape, this.renderer);
      this.scene.add(mesh);
      const body = new CANNON.Body({
        mass: 1.2,
        type: CANNON.Body.KINEMATIC,
        shape: new CANNON.Box(half),
        linearDamping: 0.12,
        angularDamping: 0.35,
        sleepSpeedLimit: 0.15,
        sleepTimeLimit: 0.6,
      });
      this.world.addBody(body);
      const item = { drape, mesh, body, opacity: { v: 1 }, index: i, floating: true, home: new THREE.Vector3(), homeRot: new THREE.Euler(), enter: { v: 9 }, hop: { v: 0 }, phase: Math.random() * 10 };
      mesh.userData.item = item;
      return item;
    });
    this.meshes = this.items.map((i) => i.mesh);
    this.layout();
  }

  /** Arrange the floating drapes at fixed spots on screen (matching the reference layout). */
  layout() {
    const portrait = this.camera.aspect < 1;
    // [screen x 0..1, screen y 0..1, height above the floor]
    const spots = portrait
      ? [[0.3, 0.36, 2.4], [0.72, 0.42, 2.0], [0.7, 0.24, 2.8], [0.33, 0.6, 1.6], [0.68, 0.64, 1.4]]
      : [[0.32, 0.2, 2.4], [0.55, 0.21, 2.2], [0.83, 0.13, 2.8], [0.36, 0.56, 1.5], [0.76, 0.46, 1.8]];
    const order = ['ivory', 'ruby', 'midnight', 'noir', 'saffron'];
    const ray = new THREE.Raycaster();
    this.items.forEach((item, i) => {
      const k = Math.max(0, order.indexOf(item.drape.id));
      const [sx, sy, h] = spots[k] || spots[i % spots.length];
      ray.setFromCamera(new THREE.Vector2(sx * 2 - 1, 1 - sy * 2), this.camera);
      ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -h), item.home);
      item.homeRot.set(0.1 + (Math.random() - 0.5) * 0.16, -0.18 + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.1);
      if (item.floating) this.placeFloating(item, 0);
    });
  }

  placeFloating(item, t) {
    const { body, home, homeRot, phase } = item;
    const bob = this.reduced ? 0 : Math.sin(t * 0.9 + phase) * 0.16;
    body.position.set(home.x, home.y + bob + item.enter.v + item.hop.v, home.z);
    body.quaternion.setFromEuler(
      homeRot.x + (this.reduced ? 0 : Math.sin(t * 0.7 + phase) * 0.05),
      homeRot.y + (this.reduced ? 0 : Math.sin(t * 0.4 + phase * 2) * 0.06),
      homeRot.z + (this.reduced ? 0 : Math.cos(t * 0.8 + phase) * 0.05),
    );
  }

  setFloating(item, on) {
    const { body } = item;
    item.floating = on;
    body.type = on ? CANNON.Body.KINEMATIC : CANNON.Body.DYNAMIC;
    body.mass = on ? 0 : 1.2;
    body.updateMassProperties();
    body.velocity.setZero();
    body.angularVelocity.setZero();
    body.wakeUp();
  }

  /** Called when the section first scrolls into view: drapes drift down into place. */
  start() {
    if (this.started) return;
    this.started = true;
    this.items.forEach((item, i) => {
      gsap.to(item.enter, { v: 0, duration: this.reduced ? 0 : 2.2, delay: this.reduced ? 0 : i * 0.12, ease: 'power3.out' });
    });
  }

  setFilter(cat) {
    this.filter = cat;
    this.items.forEach((item) => {
      const on = cat === 'all' || item.drape.category === cat;
      gsap.to(item.opacity, {
        v: on ? 1 : 0.16,
        duration: 0.6,
        ease: 'power2.out',
        onUpdate: () => setMeshOpacity(item.mesh, item.opacity.v),
      });
      if (on && cat !== 'all' && !this.reduced) {
        // matching drapes hop to say hello
        if (item.floating) {
          gsap.timeline().to(item.hop, { v: 0.7, duration: 0.35, ease: 'power2.out' }).to(item.hop, { v: 0, duration: 0.9, ease: 'bounce.out' });
        } else {
          item.body.wakeUp();
          item.body.applyImpulse(new CANNON.Vec3(0, 9, 0), new CANNON.Vec3(0.2, 0, 0.1));
        }
      }
    });
  }

  bindEvents() {
    const el = this.renderer.domElement;
    el.style.touchAction = 'pan-y';
    this.onMove = (e) => {
      const r = el.getBoundingClientRect();
      this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      this.pointerClient = { x: e.clientX, y: e.clientY };
      if (this.held) {
        const over = this.overDropZone(e.clientX, e.clientY);
        this.dropZone.classList.toggle('is-hot', over);
        this.swoosh(e.clientX, e.clientY);
        e.preventDefault();
      }
    };
    this.onDown = (e) => {
      this.onMove(e);
      const hit = this.pick();
      if (!hit) return;
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      this.grab(hit.object.userData.item, hit.point);
    };
    this.onUp = (e) => {
      if (!this.held) return;
      const over = this.overDropZone(e.clientX, e.clientY);
      this.release(over);
    };
    el.addEventListener('pointermove', this.onMove);
    el.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointerup', this.onUp);
    el.addEventListener('pointerleave', () => {
      if (!this.held) this.ndc.set(-9, -9);
    });
    window.addEventListener('resize', () => this.resize());
  }

  /** Gold arc strokes that flick off a drape while it is dragged (public/images/ui/arc-*.png). */
  swoosh(x, y) {
    if (this.reduced) return;
    const last = this.lastSwoosh || { x, y, t: 0 };
    const dx = x - last.x;
    const dy = y - last.y;
    const now = performance.now();
    if (Math.hypot(dx, dy) < 70 || now - last.t < 140) {
      if (!this.lastSwoosh) this.lastSwoosh = { x, y, t: now };
      return;
    }
    this.lastSwoosh = { x, y, t: now };
    if (!this.swooshes) {
      this.swooshes = Array.from({ length: 6 }, (_, i) => {
        const img = document.createElement('img');
        img.src = i % 2 ? '/images/ui/arc-big.png' : '/images/ui/arc-small.png';
        img.className = 'swoosh';
        img.alt = '';
        document.body.appendChild(img);
        return img;
      });
      this.swooshIndex = 0;
    }
    // trail behind the motion, on either side of the path
    const ang = Math.atan2(dy, dx);
    const side = this.swooshIndex % 2 ? 1 : -1;
    const back = 46;
    const off = 34 * side;
    const px = x - Math.cos(ang) * back - Math.sin(ang) * off;
    const py = y - Math.sin(ang) * back + Math.cos(ang) * off;
    const img = this.swooshes[this.swooshIndex++ % this.swooshes.length];
    const rot = (ang * 180) / Math.PI + (side > 0 ? 200 : 70);
    gsap.killTweensOf(img);
    gsap.fromTo(
      img,
      { x: px - 23, y: py - 22, rotation: rot, scale: 0.55, opacity: 0 },
      {
        keyframes: [
          { opacity: 0.85, scale: 0.8, duration: 0.18, ease: 'power2.out' },
          { opacity: 0, scale: 1.05, x: px - 23 - Math.cos(ang) * 22, y: py - 22 - Math.sin(ang) * 22, rotation: rot + 25 * side, duration: 0.55, ease: 'power1.in' },
        ],
      },
    );
  }

  overDropZone(x, y) {
    const r = this.dropZone.getBoundingClientRect();
    const pad = 24;
    return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
  }

  pick() {
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.meshes, false);
    return hits.find((h) => h.object.userData.item.opacity.v > 0.5) || null;
  }

  grab(item, point) {
    if (item.floating) this.setFloating(item, false);
    const { body } = item;
    // pivot in body-local space so the drape hangs from where it was picked
    const local = new CANNON.Vec3();
    body.pointToLocalFrame(new CANNON.Vec3(point.x, point.y, point.z), local);
    // pull the pivot toward the centre so the drape lifts mostly level, with a little sway
    local.scale(0.3, local);
    local.y = DRAPE_SIZE.y / 2;
    this.hand.position.set(point.x, point.y, point.z);
    this.constraint = new CANNON.PointToPointConstraint(body, local, this.hand, new CANNON.Vec3(0, 0, 0), 60);
    this.world.addConstraint(this.constraint);
    body.angularDamping = 0.9;
    body.wakeUp();
    this.held = item;
    this.lastSwoosh = null;
    this.dropZone.classList.add('is-armed');
    this.cursor?.setState('hold');
    document.body.classList.add('is-dragging');
  }

  release(overZone) {
    const item = this.held;
    this.world.removeConstraint(this.constraint);
    this.constraint = null;
    item.body.angularDamping = 0.35;
    this.held = null;
    this.dropZone.classList.remove('is-armed', 'is-hot');
    document.body.classList.remove('is-dragging');
    this.cursor?.setState(this.hovered ? 'hover' : 'default');
    if (overZone) {
      this.dropZone.classList.add('is-accepted');
      setTimeout(() => this.dropZone.classList.remove('is-accepted'), 900);
      this.onSelect?.(item.drape);
      // send it back to the pile from above once the detail view has opened
      setTimeout(() => {
        this.setFloating(item, true);
        item.enter.v = 8;
        gsap.to(item.enter, { v: 0, duration: 2, ease: 'power3.out' });
      }, 700);
    }
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const far = Math.max(1, 0.95 / this.camera.aspect);
    this.camera.position.set(0, 9.5 * far, 13.5 * far);
    this.camera.lookAt(0, 1.1, 0);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();

    // project screen corners onto the floor to find what is visible
    const corner = (x, y) => {
      this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
      const p = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.6), p);
      return p;
    };
    const bl = corner(-1, -1);
    const tl = corner(-1, 1);
    const m = 0.4;
    this.bounds = { xMin: bl.x + m, xMax: -bl.x - m, zMin: tl.z + 1.2, zMax: bl.z - m };
    const [left, right, back, front] = this.walls;
    left.position.set(this.bounds.xMin, 0, 0);
    left.quaternion.setFromEuler(0, Math.PI / 2, 0);
    right.position.set(this.bounds.xMax, 0, 0);
    right.quaternion.setFromEuler(0, -Math.PI / 2, 0);
    back.position.set(0, 0, this.bounds.zMin);
    back.quaternion.setFromEuler(0, 0, 0);
    front.position.set(0, 0, this.bounds.zMax);
    front.quaternion.setFromEuler(0, Math.PI, 0);
    this.petals?.setBounds({ ...this.bounds, xMin: tl.x, xMax: -tl.x, top: 8 });
    this.layout();
  }

  setActive(v) {
    this.active = v;
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 1 / 30);
    const t = this.clock.elapsedTime;
    if (!this.active) return;

    this.items.forEach((item) => item.floating && this.placeFloating(item, t));
    this.world.step(1 / 60, dt, 5);

    // pointer → lift plane for the held drape, floor for petal gusts
    this.raycaster.setFromCamera(this.ndc, this.camera);
    if (this.held && this.raycaster.ray.intersectPlane(this.liftPlane, this.tmp)) {
      const b = this.bounds;
      this.tmp.x = THREE.MathUtils.clamp(this.tmp.x, b.xMin + 1, b.xMax - 1);
      this.tmp.z = THREE.MathUtils.clamp(this.tmp.z, b.zMin + 0.8, b.zMax - 0.6);
      const hp = this.hand.position;
      // ease the hand toward the pointer for a weighty, silky follow
      hp.x += (this.tmp.x - hp.x) * 0.35;
      hp.y += (LIFT_HEIGHT - hp.y) * 0.2;
      hp.z += (this.tmp.z - hp.z) * 0.35;
    }
    if (this.raycaster.ray.intersectPlane(this.groundPlane, this.tmp)) this.petals.setPointer(this.tmp);

    // hover
    if (!this.held) {
      const hit = this.ndc.x > -2 ? this.pick() : null;
      const item = hit ? hit.object.userData.item : null;
      if (item !== this.hovered) {
        if (this.hovered) gsap.to(this.hovered.mesh.userData.materials[0].emissive, { r: 0, g: 0, b: 0, duration: 0.4 });
        if (item) gsap.to(item.mesh.userData.materials[0].emissive, { r: 0.07, g: 0.05, b: 0.04, duration: 0.4 });
        this.hovered = item;
        this.cursor?.setState(item ? 'hover' : 'default');
        this.renderer.domElement.style.cursor = item ? 'grab' : '';
      }
    }

    this.items.forEach(({ mesh, body }) => {
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);
    });
    this.petals.update(dt, t);
    this.renderer.render(this.scene, this.camera);
  }
}
