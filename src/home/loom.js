import { gsap, ScrollTrigger, reduced } from './core.js';

/*
 * The loom: a weaver at a handloom and a spinner at the wheel. The shuttle flies across the
 * warp and the cloth grows up from the breast beam one pass at a time: first an ivory cloth
 * with the ROOQ mark, then a red one with a thank-you, then round again.
 */
const C = {
  frame: '#8a8462',
  frameDark: '#6f6a4d',
  warp: 'rgba(238, 232, 214, 0.62)',
  magenta: '#9a1d57',
  red: '#a1071b',
  ivory: '#ece5d2',
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
    <defs><linearGradient id="loom-red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ae0a1f" /><stop offset="1" stop-color="#8d0716" /></linearGradient></defs>
    <rect x="${CL.x}" y="${CL.y}" width="${CL.w}" height="${CL.h}" fill="url(#loom-red)" />
    <g stroke="rgba(0,0,0,0.07)" stroke-width="1.5">${lines}</g>
    <rect x="${CL.x}" y="${CL.y}" width="70" height="${CL.h}" fill="${C.brown}" />
    <rect x="${CL.x + CL.w - 70}" y="${CL.y}" width="70" height="${CL.h}" fill="${C.brown}" />
    <rect x="${CL.x + 62}" y="${CL.y}" width="6" height="${CL.h}" fill="${C.ivory}" />
    <rect x="${CL.x + CL.w - 68}" y="${CL.y}" width="6" height="${CL.h}" fill="${C.ivory}" />
    ${diamonds(CL.x + 33, '#fff')}${diamonds(CL.x + CL.w - 33, '#fff')}
    <g fill="${C.ivory}" opacity=".85">
      <rect x="${CL.x + 84}" y="${CL.y + 10}" width="${CL.w - 168}" height="4" /><rect x="${CL.x + 84}" y="${CL.y + 20}" width="${CL.w - 168}" height="3" />
      <rect x="${CL.x + 84}" y="${FELL_BOTTOM - 26}" width="${CL.w - 168}" height="3" /><rect x="${CL.x + 84}" y="${FELL_BOTTOM - 17}" width="${CL.w - 168}" height="4" />
    </g>
    <text x="${cx}" text-anchor="middle" fill="#fff" font-family="DM Sans, sans-serif" font-weight="700" font-size="50" letter-spacing="-0.5">
      <tspan x="${cx}" y="${CL.y + 98}">Thank you for</tspan><tspan x="${cx}" y="${CL.y + 152}">completing your</tspan><tspan x="${cx}" y="${CL.y + 206}">journey with us</tspan>
    </text>
  </g>`;
}

const weaver = `<g class="loom__weaver" transform="translate(150 0)">
  <ellipse cx="190" cy="585" rx="170" ry="10" fill="rgba(0,0,0,.18)" />
  <g fill="${C.frameDark}"><rect x="30" y="456" width="200" height="12" rx="4" /><rect x="44" y="466" width="11" height="118" /><rect x="200" y="466" width="11" height="118" /><rect x="50" y="520" width="155" height="7" /></g>
  <g fill="${C.skin}"><path d="M196 520l18 52h40l-6 -10l-22 -6l-12 -40z" /><path d="M160 520l10 54h38l-6 -10l-20 -5l-6 -40z" /></g>
  <path d="M54 468c4 -60 30 -128 78 -168l70 -6c32 46 52 116 54 176c-56 18 -146 18 -202 -2z" fill="${C.ivory}" />
  <path d="M52 466c58 20 148 20 204 2l1 12c-56 18 -148 18 -206 -2z" fill="${C.magenta}" />
  <g stroke="rgba(0,0,0,.08)" stroke-width="2" fill="none"><path d="M110 330l-14 134M150 316l-6 154M186 318l10 150M220 340l18 124" /></g>
  <path d="M112 300c4 -46 22 -78 52 -86l40 4c16 22 18 56 12 90z" fill="${C.magenta}" />
  <path d="M104 302c18 -34 46 -66 82 -84l14 6c-26 22 -46 58 -56 98c-14 26 -34 56 -66 84l-20 -12c22 -28 36 -60 46 -92z" fill="${C.ivory}" />
  <path d="M100 400c-14 18 -30 34 -48 46l8 10c20 -10 38 -26 52 -44z" fill="${C.magenta}" />
  <rect x="166" y="192" width="22" height="26" rx="6" fill="${C.skin}" />
  <circle cx="178" cy="168" r="34" fill="${C.skin}" />
  <path d="M146 164c-2 -30 22 -46 46 -40c16 4 24 14 26 26c-18 -6 -40 -4 -56 8c-4 4 -10 8 -16 6z" fill="${C.hair}" />
  <circle cx="132" cy="168" r="20" fill="${C.hair}" />
  <g fill="#f4f0e6"><circle cx="140" cy="150" r="4" /><circle cx="136" cy="160" r="4" /><circle cx="134" cy="171" r="4" /><circle cx="136" cy="182" r="4" /></g>
  <circle cx="202" cy="164" r="2.5" fill="${C.hair}" /><path d="M212 172q-4 4 -9 3" stroke="${C.skinDark}" stroke-width="2" fill="none" />
  <circle cx="190" cy="148" r="3" fill="${C.magenta}" />
  <circle cx="176" cy="186" r="4" fill="#d8b46a" />
  <g class="loom__arm"><path d="M190 236c26 16 64 30 104 36l4 18c-46 -2 -90 -14 -120 -34z" fill="${C.skin}" />
    <path d="M178 226c14 4 22 16 20 30l-18 6c-6 -12 -8 -24 -2 -36z" fill="${C.magenta}" />
    <rect x="260" y="266" width="5" height="22" fill="#c9a463" /><rect x="268" y="267" width="4" height="22" fill="${C.magenta}" />
    <ellipse cx="304" cy="282" rx="14" ry="10" fill="${C.skin}" /></g>
</g>`;

const spinner = `<g class="loom__spinner">
  <ellipse cx="1650" cy="585" rx="170" ry="10" fill="rgba(0,0,0,.18)" />
  <g fill="${C.frameDark}"><rect x="1550" y="560" width="200" height="10" rx="4" /><path d="M1600 472l-34 96h10l30 -86zM1600 472l34 96h-10l-30 -86z" /></g>
  <g class="loom__wheel">
    <circle cx="1600" cy="472" r="80" fill="none" stroke="#a37d48" stroke-width="7" />
    <circle cx="1600" cy="472" r="66" fill="none" stroke="#a37d48" stroke-width="2" opacity=".6" />
    <g stroke="#a37d48" stroke-width="3">${Array.from({ length: 8 }, (_, i) => {
      const a = (i * Math.PI) / 4;
      return `<line x1="1600" y1="472" x2="${(1600 + Math.cos(a) * 78).toFixed(1)}" y2="${(472 + Math.sin(a) * 78).toFixed(1)}" />`;
    }).join('')}</g>
    <circle cx="1600" cy="472" r="9" fill="#c9a463" />
  </g>
  <g fill="#c2a26a"><path d="M1720 470h80l-8 90h-64z" /></g>
  <path d="M1722 478l72 76M1794 478l-72 76" stroke="#9c7d4b" stroke-width="3" />
  <path d="M1690 330c26 -10 66 -8 84 14l10 132c-30 14 -78 14 -104 0z" fill="#2f4a3b" />
  <g stroke="${C.magenta}" stroke-width="4"><path d="M1686 380h104M1686 430h104" /></g><g stroke="#d8c58c" stroke-width="2"><path d="M1686 392h104M1686 442h104" /></g>
  <g fill="${C.skin}"><path d="M1690 470l-10 80h-28l-4 12h44l12 -90z" /><path d="M1742 470l-4 82h-24l-4 12h40l10 -92z" /></g>
  <path d="M1672 216c26 -12 72 -12 96 4l20 140c-34 10 -96 10 -128 -2z" fill="${C.ivory}" />
  <path d="M1714 220c14 20 32 40 40 74l6 72l-16 -2l-4 -62c-8 -30 -22 -50 -38 -70z" fill="${C.magenta}" />
  <g stroke="${C.ivory}" stroke-width="2" opacity=".7"><path d="M1742 290l12 -2M1744 312l12 -2M1746 334l12 -2" /></g>
  <rect x="1706" y="178" width="22" height="30" rx="6" fill="${C.skin}" />
  <circle cx="1716" cy="150" r="34" fill="${C.skin}" />
  <path d="M1684 146c-4 -30 20 -50 46 -44c18 4 28 18 26 36c-12 -12 -34 -14 -52 -6c-8 4 -14 10 -20 14z" fill="${C.hair}" />
  <circle cx="1696" cy="148" r="2.5" fill="${C.hair}" /><path d="M1688 164q8 4 14 0" stroke="${C.skinDark}" stroke-width="2" fill="none" />
  <path d="M1690 158q10 -2 14 2" stroke="${C.hair}" stroke-width="3" fill="none" />
  <g class="loom__crank"><path d="M1680 240c-26 40 -50 120 -76 196l16 6c26 -70 52 -150 74 -190z" fill="${C.skin}" /><circle cx="1610" cy="440" r="11" fill="${C.skin}" /></g>
</g>`;

export function setupLoom(root) {
  if (!root) return;
  root.innerHTML = `
    <svg class="loom__svg" viewBox="0 0 1920 600" role="img" aria-label="A weaver at a handloom weaving a ROOQ cloth while a man spins yarn at a wheel">
      <defs>
        <clipPath id="loom-clip" clipPathUnits="userSpaceOnUse"><rect class="loom__clip" x="${CL.x}" y="${FELL_BOTTOM}" width="${CL.w}" height="0" /></clipPath>
      </defs>
      ${weaver}
      <g class="loom__frame" transform="translate(190 0)">
        <rect x="262" y="22" width="20" height="560" rx="6" fill="${C.frame}" />
        <rect x="1258" y="22" width="20" height="560" rx="6" fill="${C.frame}" />
        <rect x="262" y="48" width="1028" height="22" rx="10" fill="${C.frame}" />
        <circle cx="246" cy="58" r="16" fill="#a8a280" />
        <g stroke="${C.warp}" stroke-width="1.6">${warp()}</g>
        <rect x="282" y="134" width="976" height="6" fill="${C.frame}" opacity=".85" />
        <rect class="loom__reed" x="282" y="${CL.y - 48}" width="976" height="12" rx="4" fill="${C.frame}" />
        <g clip-path="url(#loom-clip)">${clothIvory()}${clothRed()}</g>
        <path class="loom__thread" d="" stroke="${C.magenta}" stroke-width="2" fill="none" />
        <g class="loom__shuttle"><path d="M-48 0c18 -12 78 -12 96 0c-18 12 -78 12 -96 0z" fill="${C.ivory}" /><rect x="-20" y="-4" width="40" height="8" rx="4" fill="${C.magenta}" /></g>
        <rect x="240" y="${FELL_BOTTOM + 2}" width="1060" height="26" rx="13" fill="${C.frame}" />
        <circle cx="1290" cy="${FELL_BOTTOM + 2}" r="18" fill="#a8a280" /><ellipse cx="1312" cy="${FELL_BOTTOM + 22}" rx="16" ry="10" fill="${C.ivory}" opacity=".8" />
        <rect x="226" y="${FELL_BOTTOM + 44}" width="96" height="12" rx="6" fill="${C.frameDark}" /><rect x="1230" y="${FELL_BOTTOM + 44}" width="96" height="12" rx="6" fill="${C.frameDark}" />
      </g>
      <path d="M1502 ${FELL_BOTTOM + 22}c40 0 60 -10 80 -30" stroke="${C.ivory}" stroke-width="1.5" fill="none" opacity=".7" />
      ${spinner}
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
      tl.to(arm, { rotation: toRight ? -4 : 2, svgOrigin: '340 236', duration: 0.24, ease: 'sine.inOut' }, '<-0.12');
    }
    tl.to(arm, { rotation: 0, svgOrigin: '340 236', duration: 0.5 });
    tl.to({}, { duration: 3 }); // hold the finished cloth
    tl.to(state, { h: 0, duration: 0.35, ease: 'power2.in', onUpdate: draw });
    return tl;
  };
  const master = gsap.timeline({ repeat: -1, paused: true }).add(weave(clothA, clothB)).add(weave(clothB, clothA));
  const spin = gsap.to(wheel, { rotation: 360, svgOrigin: '1600 472', duration: 2.4, ease: 'none', repeat: -1, paused: true });
  const turn = gsap.to(crank, { rotation: 6, svgOrigin: '1680 250', duration: 0.6, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true });
  draw();
  ScrollTrigger.create({
    trigger: root,
    start: 'top 85%',
    end: 'bottom top',
    onToggle: (self) => [master, spin, turn].forEach((t) => (self.isActive ? t.play() : t.pause())),
  });
}
