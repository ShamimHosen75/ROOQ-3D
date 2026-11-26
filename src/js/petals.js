import * as THREE from 'three';

/** Curved rose-petal geometry with a soft blush gradient baked into vertex colours. */
export function createPetalGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.5);
  s.bezierCurveTo(0.42, -0.35, 0.5, 0.25, 0.16, 0.5);
  s.quadraticCurveTo(0, 0.42, -0.16, 0.5);
  s.bezierCurveTo(-0.5, 0.25, -0.42, -0.35, 0, -0.5);
  const geo = new THREE.ShapeGeometry(s, 14);
  const pos = geo.attributes.position;
  const colors = [];
  const base = new THREE.Color('#e45a7f');
  const tip = new THREE.Color('#ffd3de');
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    pos.setZ(i, x * x * 0.9 + (y + 0.5) * (y + 0.5) * 0.12);
    c.copy(base).lerp(tip, THREE.MathUtils.clamp((y + 0.5) * 0.9 + Math.abs(x) * 0.4, 0, 1));
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();
  return geo;
}

export class PetalField {
  constructor(scene, { count = 70, bounds, reduced = false } = {}) {
    this.reduced = reduced;
    this.count = count;
    this.bounds = bounds; // { xMin, xMax, zMin, zMax, top }
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.55,
      metalness: 0,
      emissive: new THREE.Color('#ff7a9a'),
      emissiveIntensity: 0.12,
    });
    this.mesh = new THREE.InstancedMesh(createPetalGeometry(), mat, count);
    this.mesh.castShadow = true;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.dummy = new THREE.Object3D();
    this.p = [];
    for (let i = 0; i < count; i++) {
      this.p.push(this.spawn({}, true));
    }
    this.wind = new THREE.Vector3();
    this.pointer = new THREE.Vector3(999, 0, 999);
  }

  spawn(p, anywhere = false) {
    const b = this.bounds;
    p.x = THREE.MathUtils.lerp(b.xMin, b.xMax, Math.random());
    p.z = THREE.MathUtils.lerp(b.zMin, b.zMax, Math.random());
    p.y = anywhere ? Math.random() * b.top : b.top + Math.random() * 3;
    p.vx = 0;
    p.vz = 0;
    p.vy = -(0.35 + Math.random() * 0.45) * (this.reduced ? 0.4 : 1);
    p.rx = Math.random() * 6.28;
    p.ry = Math.random() * 6.28;
    p.rz = Math.random() * 6.28;
    p.sx = (Math.random() - 0.5) * 2.2;
    p.sy = (Math.random() - 0.5) * 1.6;
    p.phase = Math.random() * 100;
    p.size = 0.34 + Math.random() * 0.34;
    p.rest = 0;
    p.scale = anywhere ? 1 : 0;
    return p;
  }

  setBounds(b) {
    this.bounds = b;
  }

  setPointer(v) {
    this.pointer.copy(v);
  }

  update(dt, t) {
    const d = this.dummy;
    for (let i = 0; i < this.count; i++) {
      const p = this.p[i];
      if (p.y > 0.03) {
        const sway = Math.sin(t * 1.3 + p.phase);
        p.vx += (sway * 0.25 - p.vx) * dt * 1.5;
        p.vz += (Math.cos(t * 0.9 + p.phase) * 0.12 - p.vz) * dt * 1.5;
        // pointer gust: petals scatter away from the cursor
        const dx = p.x - this.pointer.x;
        const dz = p.z - this.pointer.z;
        const dist2 = dx * dx + dz * dz;
        if (dist2 < 4) {
          const f = (1 - dist2 / 4) * 9 * dt;
          p.vx += dx * f;
          p.vz += dz * f;
          p.sx += f * 3;
        }
        p.x += p.vx * dt;
        p.z += p.vz * dt;
        p.y += p.vy * dt * (1 + sway * 0.25);
        p.rx += p.sx * dt;
        p.rz += p.sy * dt;
        p.scale = Math.min(1, p.scale + dt * 1.5);
      } else {
        // landed: flatten out, linger, then fade away and respawn
        p.y = 0.03;
        p.rx *= 0.9;
        p.rz *= 0.9;
        p.rest += dt;
        if (p.rest > 3.5) p.scale -= dt * 0.8;
        if (p.scale <= 0) this.spawn(p);
      }
      d.position.set(p.x, p.y, p.z);
      d.rotation.set(p.rx, p.ry, p.rz);
      d.scale.setScalar(p.size * Math.max(p.scale, 0.0001));
      d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
