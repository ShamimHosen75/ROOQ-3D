import * as THREE from 'three';
import gsap from 'gsap';
import { createDrapeMesh } from './drapeMesh.js';

/** Detail view: one drape, slowly turning, that can be spun with the pointer. */
export class Viewer {
  constructor(container, { reduced }) {
    this.container = container;
    this.reduced = reduced;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.VSMShadowMap;
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
    this.camera.position.set(0, 5.2, 7.5);
    this.camera.lookAt(0, 0.2, 0);
    this.scene.add(new THREE.HemisphereLight('#fff6ee', '#d9b8aa', 1.6));
    const key = new THREE.DirectionalLight('#fff1dc', 3);
    key.position.set(-4, 8, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 12;
    key.shadow.blurSamples = 16;
    this.scene.add(key);
    const rim = new THREE.PointLight('#ffd0dc', 30, 20);
    rim.position.set(4, 2, -3);
    this.scene.add(rim);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.18, color: '#5a3328' }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.7;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.meshes = new Map();
    this.spin = { y: 0, vy: 0 };
    this.running = false;

    let lastX = null;
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', (e) => {
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (lastX === null) return;
      this.spin.vy = (e.clientX - lastX) * 0.01;
      lastX = e.clientX;
    });
    el.addEventListener('pointerup', () => {
      lastX = null;
    });
    window.addEventListener('resize', () => this.resize());
  }

  show(drape) {
    if (!this.meshes.has(drape.id)) this.meshes.set(drape.id, createDrapeMesh(drape, this.renderer));
    this.group.clear();
    const mesh = this.meshes.get(drape.id);
    mesh.position.set(0, 0, 0);
    mesh.rotation.set(0, 0, 0);
    this.group.add(mesh);
    this.resize();
    this.running = true;
    this.group.rotation.set(0, -0.6, 0);
    this.spin.vy = 0;
    if (!this.reduced) {
      gsap.fromTo(this.group.position, { y: 2.5 }, { y: 0, duration: 1.4, ease: 'elastic.out(1, 0.6)' });
      gsap.fromTo(this.group.rotation, { x: -0.9, z: 0.5 }, { x: 0, z: 0, duration: 1.6, ease: 'expo.out' });
    }
  }

  hide() {
    this.running = false;
  }

  resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  tick(t) {
    if (!this.running) return;
    this.spin.vy *= 0.94;
    this.group.rotation.y += this.spin.vy + (this.reduced ? 0 : 0.0035);
    this.group.children[0] && (this.group.children[0].position.y = Math.sin(t * 1.4) * 0.08);
    this.renderer.render(this.scene, this.camera);
  }
}
