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

    this.setupLights();
    this.setupPhysics();
    this.setupDrapes();

    this.petals = new PetalField(this.scene, {
      count: reduced ? 24 : window.innerWidth < 760 ? 40 : 80,
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
        shape: new CANNON.Box(half),
        linearDamping: 0.12,
        angularDamping: 0.35,
        sleepSpeedLimit: 0.15,
        sleepTimeLimit: 0.6,
      });
      this.world.addBody(body);
      const item = { drape, mesh, body, opacity: { v: 1 }, index: i };
      mesh.userData.item = item;
      return item;
    });
    this.meshes = this.items.map((i) => i.mesh);
    this.layout(true);
  }

  /** Scatter drapes across the visible floor; `fromSky` drops them in from above. */
  layout(fromSky) {
    const portrait = this.camera.aspect < 1;
    const cols = portrait ? 2 : 3;
    const rows = Math.ceil(this.items.length / cols);
    const b = this.bounds || { xMin: -6, xMax: 6, zMin: -3, zMax: 3 };
    const xStart = portrait ? b.xMin + 0.3 : THREE.MathUtils.lerp(b.xMin, b.xMax, 0.3);
    const xEnd = b.xMax - (portrait ? 1.5 : 1.4);
    // portrait: keep the pile in the middle band, clear of the title and footer copy
    const zA = portrait ? THREE.MathUtils.lerp(b.zMin, b.zMax, 0.38) : b.zMin + 1.6;
    const zB = portrait ? THREE.MathUtils.lerp(b.zMin, b.zMax, 0.72) : b.zMax - 1.8;
    this.items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = THREE.MathUtils.lerp(xStart + 1.2, xEnd, cols === 1 ? 0.5 : col / (cols - 1)) + (Math.random() - 0.5) * 0.8;
      const z = THREE.MathUtils.lerp(zA, zB, rows > 1 ? row / (rows - 1) : 0.5) + (col % 2 ? 0.6 : -0.4) * (portrait ? 0.4 : 1);
      const { body } = item;
      body.position.set(x, fromSky ? 9 + i * 1.6 : DRAPE_SIZE.y / 2 + 0.05, z);
      body.quaternion.setFromEuler((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.4);
      body.velocity.setZero();
      body.angularVelocity.setZero();
      body.wakeUp();
    });
  }

  /** Called when the section first scrolls into view. */
  start() {
    if (this.started) return;
    this.started = true;
    if (this.reduced) this.layout(false);
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
        item.body.wakeUp();
        item.body.applyImpulse(new CANNON.Vec3(0, 9, 0), new CANNON.Vec3(0.2, 0, 0.1));
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
    this.dropZone.classList.add('is-armed');
    this.cursor?.setState('hold', 'Drop');
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
    this.cursor?.setState(this.hovered ? 'hover' : 'default', this.hovered ? 'Lift' : '');
    if (overZone) {
      this.dropZone.classList.add('is-accepted');
      setTimeout(() => this.dropZone.classList.remove('is-accepted'), 900);
      this.onSelect?.(item.drape);
      // send it back to the pile from above once the detail view has opened
      setTimeout(() => {
        const b = this.bounds;
        item.body.position.set(THREE.MathUtils.lerp(b.xMin + 3, b.xMax - 2, Math.random()), 10, THREE.MathUtils.lerp(b.zMin + 1, b.zMax - 1, Math.random()));
        item.body.velocity.setZero();
        item.body.angularVelocity.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
      }, 700);
    }
  }

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const far = Math.max(1, 0.95 / this.camera.aspect);
    this.camera.position.set(0, 17 * far, 10.5 * far);
    this.camera.lookAt(0, 0, 0.6);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();

    // project screen corners onto the floor to find what is visible
    const corner = (x, y) => {
      this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);
      const p = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.3), p);
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
    if (!this.started) this.layout(true);
  }

  setActive(v) {
    this.active = v;
  }

  tick() {
    const dt = Math.min(this.clock.getDelta(), 1 / 30);
    const t = this.clock.elapsedTime;
    if (!this.active) return;

    if (this.started) this.world.step(1 / 60, dt, 5);

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
        this.cursor?.setState(item ? 'hover' : 'default', item ? 'Lift' : '');
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
