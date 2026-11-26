// Drape catalogue + procedural fabric textures.
// Every pattern is drawn on a canvas at runtime, so the site ships with no photos.

export const DRAPES = [
  {
    id: 'saffron',
    name: 'Saffron Dusk',
    category: 'silk',
    fabric: 'Silk · banarasi weave',
    note: 'Liquid mustard silk, woven with a whisper-thin gold jaal and a temple border.',
    base: '#e2a63a',
    shade: '#b97a1d',
    motif: '#f6dc9a',
    border: '#9b5a14',
    zari: '#f3d28a',
    motifType: 'jaal',
    sheen: '#fff1c4',
  },
  {
    id: 'ivory',
    name: 'Ivory Bloom',
    category: 'organza',
    fabric: 'Organza · resham florals',
    note: 'Featherlight organza with hand-embroidered blush blooms and a gota edge.',
    base: '#f4e2cf',
    shade: '#dcc0a3',
    motif: '#e48a8f',
    border: '#d1a35a',
    zari: '#f1d394',
    motifType: 'bloom',
    sheen: '#ffffff',
  },
  {
    id: 'midnight',
    name: 'Midnight Zari',
    category: 'velvet',
    fabric: 'Velvet · zardozi',
    note: 'Deep navy pile with raised gold zardozi vines and tiny garnet stones.',
    base: '#1c2150',
    shade: '#0e1130',
    motif: '#d9b264',
    border: '#c8a050',
    zari: '#f0cf85',
    motifType: 'vine',
    sheen: '#6c74c8',
  },
  {
    id: 'ruby',
    name: 'Ruby Vow',
    category: 'bridal',
    fabric: 'Silk · bridal buttis',
    note: 'A wedding-red drape scattered with gold buttis and a heavy kanjeevaram border.',
    base: '#8e1424',
    shade: '#5c0814',
    motif: '#e9c172',
    border: '#d2933c',
    zari: '#f5d58e',
    motifType: 'butti',
    sheen: '#ff8a8a',
  },
  {
    id: 'noir',
    name: 'Noir Garden',
    category: 'festive',
    fabric: 'Chanderi · printed florals',
    note: 'Ink-black chanderi with rose-red florals, finished in a striped festive pallu.',
    base: '#1c1716',
    shade: '#0a0808',
    motif: '#c8323c',
    border: '#b8282f',
    zari: '#e0b058',
    motifType: 'rose',
    sheen: '#7a5a50',
  },
];

export const CATEGORIES = ['all', 'silk', 'organza', 'velvet', 'bridal', 'festive'];

const cache = new Map();

const rand = (seed) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

function petalFlower(ctx, x, y, r, color, center, petals = 5, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  for (let i = 0; i < petals; i++) {
    ctx.rotate((Math.PI * 2) / petals);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 0.32, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = center;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function leaf(ctx, x, y, len, rot, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.5, -len * 0.35, len, 0);
  ctx.quadraticCurveTo(len * 0.5, len * 0.35, 0, 0);
  ctx.fill();
  ctx.restore();
}

function drawMotifs(ctx, d, w, h, top) {
  const r = rand(d.id.length * 977 + 13);
  ctx.globalAlpha = 0.95;
  switch (d.motifType) {
    case 'jaal': {
      ctx.strokeStyle = d.motif;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.55;
      const step = 120;
      for (let x = -step; x < w + step; x += step) {
        for (let y = top; y < h; y += step) {
          ctx.beginPath();
          ctx.moveTo(x, y + step / 2);
          ctx.quadraticCurveTo(x + step / 2, y, x + step, y + step / 2);
          ctx.quadraticCurveTo(x + step / 2, y + step, x, y + step / 2);
          ctx.stroke();
          petalFlower(ctx, x + step / 2, y + step / 2, 22, d.motif, d.zari, 6);
        }
      }
      break;
    }
    case 'bloom': {
      for (let i = 0; i < 26; i++) {
        const x = r() * w;
        const y = top + r() * (h - top);
        const s = 26 + r() * 30;
        for (let k = 0; k < 3; k++) leaf(ctx, x, y, s * 1.3, r() * 6.28, '#9fb07c');
        petalFlower(ctx, x, y, s, d.motif, '#f6c4a4', 5, r() * 6);
        petalFlower(ctx, x, y, s * 0.55, '#f2a7a6', '#fff0dc', 5, r() * 6);
      }
      break;
    }
    case 'vine': {
      ctx.strokeStyle = d.motif;
      ctx.lineWidth = 4;
      for (let v = 0; v < 4; v++) {
        const x0 = 60 + v * 260;
        ctx.beginPath();
        ctx.moveTo(x0, h);
        for (let y = h; y > top; y -= 20) {
          ctx.lineTo(x0 + Math.sin(y * 0.02 + v) * 50, y);
        }
        ctx.stroke();
        for (let y = h - 60; y > top + 40; y -= 90) {
          const x = x0 + Math.sin(y * 0.02 + v) * 50;
          leaf(ctx, x, y, 40, -0.6 + r() * 0.3, d.motif);
          leaf(ctx, x, y, 40, Math.PI + 0.6, d.motif);
          petalFlower(ctx, x + 30, y - 30, 24, d.motif, '#9b1f2e', 8);
        }
      }
      break;
    }
    case 'butti': {
      const step = 110;
      for (let y = top + 50, row = 0; y < h; y += step, row++) {
        for (let x = (row % 2) * (step / 2) + 40; x < w; x += step) {
          ctx.fillStyle = d.motif;
          ctx.beginPath();
          ctx.moveTo(x, y - 22);
          ctx.quadraticCurveTo(x + 18, y, x, y + 22);
          ctx.quadraticCurveTo(x - 18, y, x, y - 22);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y + 30, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
    case 'rose': {
      for (let i = 0; i < 18; i++) {
        const x = r() * w;
        const y = top + r() * (h - top);
        const s = 34 + r() * 30;
        for (let k = 0; k < 4; k++) leaf(ctx, x, y, s * 1.4, r() * 6.28, '#c9a24f');
        petalFlower(ctx, x, y, s, d.motif, '#f0c060', 6, r() * 6);
        petalFlower(ctx, x, y, s * 0.6, '#e0525a', '#f0c060', 6, r() * 6);
      }
      break;
    }
    case 'dots': {
      ctx.fillStyle = d.motif;
      for (let i = 0; i < 520; i++) {
        ctx.globalAlpha = 0.5 + r() * 0.5;
        ctx.beginPath();
        ctx.arc(r() * w, top + r() * (h - top), 2 + r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    default:
  }
  ctx.globalAlpha = 1;
}

function drawBorder(ctx, d, w, y0, bh) {
  ctx.fillStyle = d.border;
  ctx.fillRect(0, y0, w, bh);
  ctx.fillStyle = d.zari;
  ctx.fillRect(0, y0 + 6, w, 5);
  ctx.fillRect(0, y0 + bh - 11, w, 5);
  // temple / scallop band
  ctx.globalAlpha = 0.9;
  for (let x = 0; x < w; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, y0 + bh * 0.62);
    ctx.lineTo(x + 18, y0 + bh * 0.26);
    ctx.lineTo(x + 36, y0 + bh * 0.62);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 18, y0 + bh * 0.78, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function grain(ctx, w, h, amount = 0.05) {
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    // woven-thread grain: tiny per-pixel noise + horizontal threads
    const row = ((i / 4 / w) | 0) % 3 === 0 ? -6 : 0;
    const n = (Math.random() - 0.5) * 255 * amount + row;
    data[i] += n;
    data[i + 1] += n;
    data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/** Top face of a folded drape: body pattern + border running along the front edge. */
export function topTexture(d) {
  const key = `top-${d.id}`;
  if (cache.has(key)) return cache.get(key);
  const w = 1024;
  const h = 768;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, d.base);
  g.addColorStop(0.55, d.base);
  g.addColorStop(1, d.shade);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const borderH = 190;
  drawMotifs(ctx, d, w, h - borderH, 0);
  drawBorder(ctx, d, w, h - borderH, borderH);
  // soft fold crease highlight
  const s = ctx.createLinearGradient(0, 0, 0, h);
  s.addColorStop(0, 'rgba(255,255,255,0.18)');
  s.addColorStop(0.3, 'rgba(255,255,255,0)');
  s.addColorStop(0.75, 'rgba(0,0,0,0)');
  s.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = s;
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, 0.045);
  cache.set(key, c);
  return c;
}

/** Side faces show the stacked folds: alternating body / border layers with gold lines. */
export function sideTexture(d) {
  const key = `side-${d.id}`;
  if (cache.has(key)) return cache.get(key);
  const w = 512;
  const h = 128;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const layers = 6;
  const lh = h / layers;
  for (let i = 0; i < layers; i++) {
    const y = i * lh;
    const g = ctx.createLinearGradient(0, y, 0, y + lh);
    const col = i % 2 === 0 ? d.border : d.base;
    g.addColorStop(0, d.shade);
    g.addColorStop(0.35, col);
    g.addColorStop(0.7, col);
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, w, lh);
    ctx.fillStyle = d.zari;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(0, y + lh * 0.35, w, 2);
    ctx.globalAlpha = 1;
  }
  grain(ctx, w, h, 0.06);
  cache.set(key, c);
  return c;
}

/** Flat swatch used by the collection cards (top pattern, framed). */
export function swatchDataURL(d) {
  return topTexture(d).toDataURL('image/jpeg', 0.86);
}
