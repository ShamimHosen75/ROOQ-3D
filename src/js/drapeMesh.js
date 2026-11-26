import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { topTexture, sideTexture } from './drapes.js';

export const DRAPE_SIZE = { x: 2.6, y: 0.62, z: 1.85 };

let sharedGeo = null;

/** Rounded box whose top is gently pillowed, like a folded stack of fabric. */
function getGeometry() {
  if (sharedGeo) return sharedGeo;
  const { x, y, z } = DRAPE_SIZE;
  const geo = new RoundedBoxGeometry(x, y, z, 8, 0.12);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const nx = v.x / (x / 2);
    const nz = v.z / (z / 2);
    const pillow = (1 - nx * nx * 0.7) * (1 - nz * nz * 0.6);
    if (v.y > 0) v.y += pillow * 0.1;
    // soft ripples along the long edges, like folded cloth rather than a box
    const ripple = Math.sin(v.x * 5.3) * 0.012 + Math.sin(v.x * 11.7 + 1.3) * 0.006;
    if (Math.abs(nz) > 0.85) v.y += ripple * (v.y > 0 ? 1 : -0.4);
    if (Math.abs(nx) > 0.85) v.y += Math.sin(v.z * 6.1) * 0.01;
    // subtle sag on the sides so it does not read as a plastic block
    v.x *= 1 - Math.abs(v.y / y) * 0.025;
    // front fold is slightly rounder / thicker than the back
    if (v.z > 0) v.y *= 1 + nz * 0.04;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  sharedGeo = geo;
  return geo;
}

const texFrom = (canvas, renderer) => {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer ? renderer.capabilities.getMaxAnisotropy() : 4;
  return t;
};

export function createDrapeMesh(drape, renderer) {
  const top = texFrom(topTexture(drape), renderer);
  const side = texFrom(sideTexture(drape), renderer);
  const velvet = drape.category === 'velvet';
  const common = {
    roughness: velvet ? 0.85 : 0.5,
    sheen: 1,
    sheenRoughness: velvet ? 0.35 : 0.55,
    sheenColor: new THREE.Color(drape.sheen),
    transparent: true,
    opacity: 1,
  };
  const topMat = new THREE.MeshPhysicalMaterial({ map: top, ...common, clearcoat: velvet ? 0 : 0.12, clearcoatRoughness: 0.6 });
  const sideMat = new THREE.MeshPhysicalMaterial({ map: side, ...common });
  // the underside is the same fabric, so a drape that lands face-down still reads
  const bottomMat = new THREE.MeshPhysicalMaterial({ map: top, ...common, color: '#d9d0cc' });
  // RoundedBoxGeometry keeps BoxGeometry groups: +x, -x, +y, -y, +z, -z
  const mesh = new THREE.Mesh(getGeometry(), [sideMat, sideMat, topMat, bottomMat, sideMat, sideMat]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.drape = drape;
  mesh.userData.materials = [topMat, sideMat, bottomMat];
  return mesh;
}

export function setMeshOpacity(mesh, value) {
  mesh.userData.materials.forEach((m) => {
    m.opacity = value;
    m.depthWrite = value > 0.6;
  });
  mesh.castShadow = value > 0.5;
}
