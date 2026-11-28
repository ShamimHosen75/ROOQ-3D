import { gsap, ScrollTrigger, reduced } from './core.js';
import { FIGURE_DEFS, WEAVER_SVG, SPINNER_SVG, ARM_ORIGIN, CRANK_ORIGIN } from './loomFigures.js';

/*
 * The loom: a weaver at a handloom and a spinner at the wheel. The shuttle flies across the
 * warp and the cloth grows up from the breast beam one pass at a time: first an ivory cloth
 * with the ROOQ mark, then a red one with a thank-you, then round again.
 */
const C = {
  frame: '#a8835a',
  frameDark: '#7d5f40',
  warp: 'rgba(90, 63, 48, 0.38)',
  magenta: '#9a1d57',
  red: '#a1071b',
  ivory: '#ece5d2',
  gold: '#b08440',
  skin: '#b27a54',
  skinDark: '#94603f',
  hair: '#2a1f1a',
  brown: '#8b6a52',
};

// cloth area (svg units)
const CL = { x: 330, y: 250, w: 880, h: 275 };
const FELL_BOTTOM = CL.y + CL.h;

function warp() {
  let s = '';
  for (let x = 292; x <= 1250; x += 11.5) s += `<line x1="${x}" y1="66" x2="${x}" y2="${FELL_BOTTOM}" />`;
  return s;
}
const diamonds = (cx, color) =>
  Array.from({ length: 8 }, (_, i) => `<rect x="${cx - 8}" y="${CL.y + 12 + i * 34}" width="16" height="16" transform="rotate(45 ${cx} ${CL.y + 20 + i * 34})" fill="${color}" />`).join('');

function clothIvory() {
  const cx = CL.x + CL.w / 2;
  let grid = '';
  for (let x = CL.x + 80; x < CL.x + CL.w - 70; x += 16) grid += `<line x1="${x}" y1="${CL.y}" x2="${x}" y2="${FELL_BOTTOM}" />`;
  for (let y = CL.y + 6; y < FELL_BOTTOM; y += 16) grid += `<line x1="${CL.x + 70}" y1="${y}" x2="${CL.x + CL.w - 70}" y2="${y}" />`;
  const tri = Array.from({ length: 20 }, (_, i) => {
    const x = cx - 150 + i * 15;
    return `<path d="M${x} ${CL.y + 58}l7.5 -12l7.5 12z" />`;
  }).join('');
  const dots = Array.from({ length: 10 }, (_, i) => `<circle cx="${cx - 135 + i * 30}" cy="${CL.y + 68}" r="2.2" />`).join('');
  return `<g class="loom__cloth loom__cloth--a">
    <rect x="${CL.x}" y="${CL.y}" width="${CL.w}" height="${CL.h}" fill="#a7ae9d" />
    <g stroke="rgba(255,255,255,0.5)" stroke-width="1.4">${grid}</g>
    <rect x="${CL.x}" y="${CL.y}" width="70" height="${CL.h}" fill="${C.magenta}" />
    <rect x="${CL.x + CL.w - 70}" y="${CL.y}" width="70" height="${CL.h}" fill="${C.magenta}" />
    <rect x="${CL.x + 66}" y="${CL.y}" width="4" height="${CL.h}" fill="${C.ivory}" opacity=".5" />
    <rect x="${CL.x + CL.w - 70}" y="${CL.y}" width="4" height="${CL.h}" fill="${C.ivory}" opacity=".5" />
    ${diamonds(CL.x + 35, C.ivory)}${diamonds(CL.x + CL.w - 35, C.ivory)}
    <rect x="${CL.x + 84}" y="${CL.y + 8}" width="${CL.w - 168}" height="7" fill="${C.magenta}" />
    <rect x="${CL.x + 84}" y="${FELL_BOTTOM - 18}" width="${CL.w - 168}" height="7" fill="${C.magenta}" />
    <g fill="#fff">${tri}${dots}</g>
    <line x1="${cx - 150}" y1="${CL.y + 61}" x2="${cx + 150}" y2="${CL.y + 61}" stroke="#fff" stroke-width="1.5" />
    <text x="${cx}" y="${CL.y + 168}" text-anchor="middle" fill="#fff" font-family="Cormorant Garamond, serif" font-weight="600" font-size="104" letter-spacing="6">ROOQ</text>
    <path d="M${cx - 135} ${CL.y + 202}c-12 -12 6 -24 16 -12c6 8 -2 14 -8 12M${cx - 135} ${CL.y + 202}c60 18 210 18 270 0M${cx + 135} ${CL.y + 202}c12 -12 -6 -24 -16 -12c-6 8 2 14 8 12" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" />
    <use href="#lotus" x="${cx - 26}" y="${CL.y + 186}" width="52" height="32" color="#fff" />
  </g>`;
}

function clothRed() {
  const cx = CL.x + CL.w / 2;
  let lines = '';
  for (let y = CL.y + 3; y < FELL_BOTTOM; y += 6) lines += `<line x1="${CL.x}" y1="${y}" x2="${CL.x + CL.w}" y2="${y}" />`;
  return `<g class="loom__cloth loom__cloth--b">
    <defs>
      <linearGradient id="loom-ink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b2d20" /><stop offset="1" stop-color="#2f1c13" /></linearGradient>
      <linearGradient id="loom-zari" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9cd8f" /><stop offset=".5" stop-color="#c9a463" /><stop offset="1" stop-color="#f1dcaa" /></linearGradient>
    </defs>
    <rect x="${CL.x}" y="${CL.y}" width="${CL.w}" height="${CL.h}" fill="url(#loom-ink)" />
    <g stroke="rgba(255,236,200,0.045)" stroke-width="1.5">${lines}</g>
    <rect x="${CL.x}" y="${CL.y}" width="70" height="${CL.h}" fill="${C.gold}" />
    <rect x="${CL.x + CL.w - 70}" y="${CL.y}" width="70" height="${CL.h}" fill="${C.gold}" />
    <rect x="${CL.x + 66}" y="${CL.y}" width="4" height="${CL.h}" fill="${C.ivory}" opacity=".7" />
    <rect x="${CL.x + CL.w - 70}" y="${CL.y}" width="4" height="${CL.h}" fill="${C.ivory}" opacity=".7" />
    ${diamonds(CL.x + 33, C.ivory)}${diamonds(CL.x + CL.w - 33, C.ivory)}
    <g fill="url(#loom-zari)">
      <rect x="${CL.x + 84}" y="${CL.y + 10}" width="${CL.w - 168}" height="3" /><rect x="${CL.x + 84}" y="${CL.y + 19}" width="${CL.w - 168}" height="1.5" />
      <rect x="${CL.x + 84}" y="${FELL_BOTTOM - 21}" width="${CL.w - 168}" height="1.5" /><rect x="${CL.x + 84}" y="${FELL_BOTTOM - 13}" width="${CL.w - 168}" height="3" />
    </g>
    <text x="${cx}" text-anchor="middle" fill="url(#loom-zari)" font-family="Cormorant Garamond, serif" font-style="italic" font-weight="700" font-size="60" letter-spacing="0.5">
      <tspan x="${cx}" y="${CL.y + 96}">Thank you for</tspan><tspan x="${cx}" y="${CL.y + 154}">completing your</tspan><tspan x="${cx}" y="${CL.y + 212}">journey with us</tspan>
    </text>
    <use href="#lotus" x="${cx - 18}" y="${CL.y + 226}" width="36" height="22" color="#c9a463" />
  </g>`;
}

export function setupLoom(root) {
  if (!root) return;
  root.innerHTML = `
    <svg class="loom__svg" viewBox="0 0 1920 600" role="img" aria-label="A weaver at a handloom weaving a ROOQ cloth while a man spins yarn at a wheel">
      <defs>${FIGURE_DEFS}
        <clipPath id="loom-clip" clipPathUnits="userSpaceOnUse"><rect class="loom__clip" x="${CL.x}" y="${FELL_BOTTOM}" width="${CL.w}" height="0" /></clipPath>
      </defs>
      ${WEAVER_SVG}
      <g class="loom__frame" transform="translate(190 0)">
        <rect x="262" y="22" width="20" height="560" rx="6" fill="${C.frame}" />
        <rect x="1258" y="22" width="20" height="560" rx="6" fill="${C.frame}" />
        <rect x="262" y="48" width="1028" height="22" rx="10" fill="${C.frame}" />
        <circle cx="246" cy="58" r="16" fill="#c19a6b" />
        <g stroke="${C.warp}" stroke-width="1.6">${warp()}</g>
        <rect x="282" y="134" width="976" height="6" fill="${C.frame}" opacity=".85" />
        <rect class="loom__reed" x="282" y="${CL.y - 48}" width="976" height="12" rx="4" fill="${C.frame}" />
        <g clip-path="url(#loom-clip)">${clothIvory()}${clothRed()}</g>
        <path class="loom__thread" d="" stroke="${C.magenta}" stroke-width="2" fill="none" />
        <g class="loom__shuttle"><path d="M-48 0c18 -12 78 -12 96 0c-18 12 -78 12 -96 0z" fill="${C.ivory}" /><rect x="-20" y="-4" width="40" height="8" rx="4" fill="${C.magenta}" /></g>
        <rect x="240" y="${FELL_BOTTOM + 2}" width="1060" height="26" rx="13" fill="${C.frame}" />
        <circle cx="1290" cy="${FELL_BOTTOM + 2}" r="18" fill="#c19a6b" /><ellipse cx="1312" cy="${FELL_BOTTOM + 22}" rx="16" ry="10" fill="${C.ivory}" opacity=".8" />
        <rect x="226" y="${FELL_BOTTOM + 44}" width="96" height="12" rx="6" fill="${C.frameDark}" /><rect x="1230" y="${FELL_BOTTOM + 44}" width="96" height="12" rx="6" fill="${C.frameDark}" />
      </g>
      <path d="M1502 ${FELL_BOTTOM + 22}c40 0 60 -10 80 -30" stroke="${C.ivory}" stroke-width="1.5" fill="none" opacity=".7" />
      ${SPINNER_SVG}
    </svg>`;

  const clip = root.querySelector('.loom__clip');
  const clothA = root.querySelector('.loom__cloth--a');
  const clothB = root.querySelector('.loom__cloth--b');
  const shuttle = root.querySelector('.loom__shuttle');
  const thread = root.querySelector('.loom__thread');
  const reed = root.querySelector('.loom__reed');
  const arm = root.querySelector('.loom__arm');
  const wheel = root.querySelector('.loom__wheel');
  const crank = root.querySelector('.loom__crank');

  const LEFT = CL.x + 40;
  const RIGHT = CL.x + CL.w - 40;
  const state = { h: 0, sx: RIGHT };
  const draw = () => {
    const fell = FELL_BOTTOM - state.h;
    clip.setAttribute('y', fell);
    clip.setAttribute('height', state.h);
    const sy = fell - 18;
    shuttle.setAttribute('transform', `translate(${state.sx} ${sy})`);
    const from = state.sx > (LEFT + RIGHT) / 2 ? CL.x + 70 : CL.x + CL.w - 70;
    thread.setAttribute('d', state.h > 1 ? `M${from} ${fell + 2}L${state.sx} ${sy + 2}` : '');
    reed.setAttribute('y', Math.max(CL.y - 48, fell - 46));
  };

  if (reduced()) {
    state.h = CL.h;
    state.sx = LEFT - 30;
    clothB.style.display = 'none';
    draw();
    return;
  }

  const PASSES = 14;
  const weave = (cloth, other) => {
    const tl = gsap.timeline();
    tl.call(() => {
      cloth.style.display = '';
      other.style.display = 'none';
    });
    tl.set(state, { h: 0, sx: LEFT - 40, onUpdate: draw });
    for (let i = 0; i < PASSES; i++) {
      const toRight = i % 2 === 0;
      tl.to(state, { sx: toRight ? RIGHT + 40 : LEFT - 40, duration: 0.24, ease: 'sine.inOut', onUpdate: draw });
      tl.to(state, { h: (CL.h * (i + 1)) / PASSES, duration: 0.12, ease: 'power2.out', onUpdate: draw }, '<0.12');
      tl.to(arm, { rotation: toRight ? -5 : 3, svgOrigin: ARM_ORIGIN, duration: 0.24, ease: 'sine.inOut' }, '<-0.12');
    }
    tl.to(arm, { rotation: 0, svgOrigin: ARM_ORIGIN, duration: 0.5 });
    tl.to({}, { duration: 3 }); // hold the finished cloth
    tl.to(state, { h: 0, duration: 0.35, ease: 'power2.in', onUpdate: draw });
    return tl;
  };
  const master = gsap.timeline({ repeat: -1, paused: true }).add(weave(clothA, clothB)).add(weave(clothB, clothA));
  const spin = gsap.to(wheel, { rotation: 360, svgOrigin: '1600 472', duration: 2.4, ease: 'none', repeat: -1, paused: true });
  const turn = gsap.to(crank, { rotation: 5, svgOrigin: CRANK_ORIGIN, duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });
  draw();
  ScrollTrigger.create({
    trigger: root,
    start: 'top 85%',
    end: 'bottom top',
    onToggle: (self) => [master, spin, turn].forEach((t) => (self.isActive ? t.play() : t.pause())),
  });
}
