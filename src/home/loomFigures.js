// The two people at the loom, drawn as shaded vector figures in natural proportions
// (head ≈ 1/7.5 of the height), with gradients for skin, silk and cotton so they read as
// real people rather than flat cartoons. Coordinates match loom.js (viewBox 0 0 1920 600).

const DEFS = `
  <linearGradient id="lf-skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c99069" /><stop offset=".55" stop-color="#b07650" /><stop offset="1" stop-color="#8e5a3b" /></linearGradient>
  <linearGradient id="lf-skin-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a6243" /><stop offset="1" stop-color="#c08560" /></linearGradient>
  <radialGradient id="lf-face" cx=".62" cy=".42" r=".7"><stop offset="0" stop-color="#d39a72" /><stop offset=".7" stop-color="#b47a53" /><stop offset="1" stop-color="#93603f" /></radialGradient>
  <linearGradient id="lf-hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a2a22" /><stop offset=".5" stop-color="#1c1410" /><stop offset="1" stop-color="#120c09" /></linearGradient>
  <linearGradient id="lf-ivory" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8cdb4" /><stop offset=".45" stop-color="#f3ecdc" /><stop offset="1" stop-color="#ddd2ba" /></linearGradient>
  <linearGradient id="lf-ivory-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4eedf" /><stop offset="1" stop-color="#d6cbb2" /></linearGradient>
  <linearGradient id="lf-mag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b42a68" /><stop offset=".6" stop-color="#8f1a4f" /><stop offset="1" stop-color="#6d123b" /></linearGradient>
  <linearGradient id="lf-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b6a45" /><stop offset="1" stop-color="#5e4429" /></linearGradient>
  <linearGradient id="lf-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f1d58e" /><stop offset=".5" stop-color="#c9a052" /><stop offset="1" stop-color="#8f6a2b" /></linearGradient>
  <pattern id="lf-check" width="22" height="22" patternUnits="userSpaceOnUse">
    <rect width="22" height="22" fill="#26453a" />
    <rect y="8" width="22" height="3" fill="#8f1a4f" opacity=".85" /><rect x="8" width="3" height="22" fill="#8f1a4f" opacity=".6" />
    <rect y="16" width="22" height="1.2" fill="#d9c58b" opacity=".7" /><rect x="16" width="1.2" height="22" fill="#d9c58b" opacity=".5" />
  </pattern>
  <pattern id="lf-gamcha" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
    <rect width="12" height="12" fill="#9b1e55" /><rect y="5" width="12" height="2" fill="#e9dcc2" opacity=".55" /><rect x="5" width="2" height="12" fill="#e9dcc2" opacity=".35" />
  </pattern>
  <filter id="lf-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4" /></filter>`;

/* ---------- the weaver: seated on a low stool, reaching to the beater ---------- */
const WEAVER = `<g class="loom__weaver" transform="translate(150 0)">
  <ellipse cx="185" cy="588" rx="165" ry="9" fill="rgba(0,0,0,.22)" filter="url(#lf-soft)" />
  <!-- stool -->
  <rect x="38" y="438" width="176" height="14" rx="5" fill="url(#lf-wood)" />
  <rect x="50" y="450" width="12" height="134" rx="3" fill="#5e4429" /><rect x="190" y="450" width="12" height="134" rx="3" fill="#5e4429" />
  <rect x="56" y="526" width="140" height="7" rx="3" fill="#6d5133" />
  <!-- far foot -->
  <path d="M252 566c10 -2 26 0 38 6c6 4 4 10 -4 10h-40c-6 0 -6 -14 6 -16z" fill="url(#lf-skin-shade)" />
  <!-- skirt / pleats over the lap -->
  <path d="M126 318c-24 40 -40 84 -42 126c-2 40 -10 78 -18 118c80 10 168 10 246 2c-4 -32 -14 -66 -26 -98c-6 -18 -26 -30 -52 -34l-40 -6c-6 -36 -14 -74 -16 -108z" fill="url(#lf-ivory)" />
  <g fill="none" stroke="#bfb39a" stroke-width="2" stroke-linecap="round" opacity=".8">
    <path d="M110 380c-6 56 -14 120 -22 178" /><path d="M138 420c-4 46 -8 96 -10 140" /><path d="M170 430c2 42 4 88 4 130" />
    <path d="M206 438c8 40 14 82 18 122" /><path d="M240 446c14 34 24 74 30 114" /><path d="M276 470c10 30 16 60 18 90" />
  </g>
  <path d="M188 420c40 2 70 14 86 36" fill="none" stroke="#fbf7ee" stroke-width="3" opacity=".7" />
  <!-- hem border -->
  <path d="M66 552c80 10 168 10 246 2l2 14c-82 10 -168 10 -250 -2z" fill="url(#lf-mag)" />
  <path d="M66 552c80 10 168 10 246 2" fill="none" stroke="url(#lf-gold)" stroke-width="2.4" />
  <!-- near foot -->
  <path d="M286 564c12 -2 30 2 42 10c6 4 2 10 -6 10h-44c-6 0 -6 -18 8 -20z" fill="url(#lf-skin)" />
  <circle cx="318" cy="574" r="2" fill="#d9b66a" />
  <path d="M276 566l20 -2" stroke="#d9b66a" stroke-width="2" />
  <!-- pallu falling down her back -->
  <path d="M150 246c-26 28 -44 82 -56 142c-6 30 -10 56 -12 80l36 -10c4 -60 18 -128 46 -184z" fill="url(#lf-ivory-v)" />
  <path d="M82 468l36 -10l1 9l-37 11z" fill="url(#lf-mag)" />
  <g stroke="#cfc4aa" stroke-width="1.6" fill="none"><path d="M140 280c-16 40 -28 90 -34 150" /><path d="M156 288c-12 40 -20 90 -24 140" /></g>
  <!-- blouse + midriff -->
  <path d="M146 252c14 -8 40 -10 54 -2c8 20 8 46 2 66l-52 2c-8 -20 -10 -44 -4 -66z" fill="url(#lf-mag)" />
  <path d="M152 318h50c2 8 2 14 0 20h-50z" fill="url(#lf-skin)" />
  <!-- pallu across the chest, over the shoulder -->
  <path d="M206 326c-16 -26 -36 -56 -52 -82l-12 6c12 30 24 62 40 88z" fill="url(#lf-ivory)" />
  <path d="M154 244l-12 6c4 10 8 22 12 32l10 -6z" fill="#b42a68" opacity=".9" />
  <path d="M206 326c-16 -26 -36 -56 -52 -82" fill="none" stroke="url(#lf-gold)" stroke-width="2" />
  <!-- neck -->
  <path d="M170 212c4 12 4 24 2 36c8 4 18 4 24 -2c-4 -10 -6 -22 -4 -34z" fill="url(#lf-skin-shade)" />
  <path d="M172 240c8 6 16 6 24 0" fill="none" stroke="#d9b66a" stroke-width="2.2" />
  <!-- head: face in profile, looking at the work -->
  <path d="M170 136c22 -6 40 6 44 26c1 6 2 10 6 18c3 5 0 7 -4 8c1 4 2 7 -2 9c2 4 0 8 -4 10c-2 8 -10 12 -20 12c-14 2 -24 -4 -30 -12c-10 -16 -12 -38 -8 -54c4 -10 10 -16 18 -17z" fill="url(#lf-face)" />
  <path d="M208 199c-4 2 -8 2 -12 0" fill="none" stroke="#7b3e2e" stroke-width="2" stroke-linecap="round" />
  <path d="M211 195c-2 -1 -4 -1 -6 0" fill="none" stroke="#9c4a3a" stroke-width="2.4" stroke-linecap="round" />
  <path d="M190 166c4 -3 10 -3 14 0c-4 4 -10 4 -14 0z" fill="#fbf6ef" /><circle cx="199" cy="166" r="2.6" fill="#2a1a12" />
  <path d="M187 159c6 -5 13 -5 19 -1" fill="none" stroke="#24170f" stroke-width="2.2" stroke-linecap="round" />
  <path d="M188 163c5 -3 12 -3 17 0" fill="none" stroke="#24170f" stroke-width="1.2" />
  <circle cx="210" cy="152" r="2.6" fill="#b3122c" />
  <path d="M204 186c3 2 7 2 10 0" fill="none" stroke="#8e5a3b" stroke-width="1.4" opacity=".7" />
  <!-- hair, bun and jasmine -->
  <path d="M212 152c-2 -16 -14 -26 -32 -26c-26 0 -42 18 -42 42c0 16 6 30 16 40c4 -14 4 -28 8 -38c6 -10 14 -14 22 -14c10 0 18 -2 28 -4z" fill="url(#lf-hair)" />
  <path d="M176 134c12 -2 24 2 30 10" fill="none" stroke="#5b463a" stroke-width="2" opacity=".6" />
  <circle cx="134" cy="178" r="22" fill="url(#lf-hair)" />
  <path d="M120 168c6 -6 16 -8 24 -4" fill="none" stroke="#4a382d" stroke-width="2" opacity=".7" />
  <g fill="#fbf8f0" stroke="#e3ddcc" stroke-width=".8">${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${(146 - Math.cos(i * 0.5) * 18).toFixed(1)}" cy="${158 + i * 8}" r="4.2" />`).join('')}</g>
  <!-- ear + jhumka -->
  <path d="M170 172c-6 -2 -8 6 -6 12c2 6 8 6 10 2" fill="#a86f4b" />
  <path d="M168 190l0 6" stroke="#c9a052" stroke-width="1.6" /><path d="M162 204c0 -6 4 -9 6 -9s6 3 6 9z" fill="url(#lf-gold)" />
  <!-- reaching arm (animated) -->
  <g class="loom__arm">
    <path d="M178 258c18 10 30 34 36 64l-14 8c-10 -22 -20 -42 -34 -58z" fill="url(#lf-skin-shade)" />
    <path d="M200 316c26 -8 58 -18 92 -30l6 14c-32 14 -64 26 -94 34z" fill="url(#lf-skin)" />
    <path d="M176 250c16 2 28 12 30 28l-16 10c-6 -12 -14 -22 -24 -28z" fill="url(#lf-mag)" />
    <g fill="none" stroke-width="3"><path d="M262 296l4 12" stroke="#d9b66a" /><path d="M268 293l4 12" stroke="#b42a68" /><path d="M274 291l4 12" stroke="#d9b66a" /></g>
    <path d="M290 282c8 -4 18 -4 22 2c4 6 2 12 -4 14l-14 4c-6 0 -8 -14 -4 -20z" fill="url(#lf-skin)" />
    <path d="M300 284c4 -4 8 -6 10 -4" fill="none" stroke="#8e5a3b" stroke-width="1.2" />
  </g>
</g>`;

/* ---------- the spinner: seated on a cane moda, turning the charkha ---------- */
const SPINNER = `<g class="loom__spinner">
  <ellipse cx="1660" cy="588" rx="185" ry="9" fill="rgba(0,0,0,.22)" filter="url(#lf-soft)" />
  <!-- moda (cane stool) -->
  <path d="M1716 468h92l-10 112h-72z" fill="url(#lf-wood)" />
  <path d="M1720 476l80 96M1804 476l-80 96" stroke="#c7a86e" stroke-width="3" opacity=".8" />
  <ellipse cx="1762" cy="468" rx="47" ry="8" fill="#a3834f" />
  <!-- charkha -->
  <g fill="#6e5232"><rect x="1528" y="566" width="150" height="10" rx="4" /><path d="M1600 472l-36 98h10l30 -86zM1600 472l36 98h-10l-30 -86z" /></g>
  <g class="loom__wheel">
    <circle cx="1600" cy="472" r="80" fill="none" stroke="url(#lf-wood)" stroke-width="7" />
    <circle cx="1600" cy="472" r="72" fill="none" stroke="#a37d48" stroke-width="1.5" opacity=".6" />
    <g stroke="#9a7442" stroke-width="3">${Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return `<line x1="1600" y1="472" x2="${(1600 + Math.cos(a) * 78).toFixed(1)}" y2="${(472 + Math.sin(a) * 78).toFixed(1)}" />`;
    }).join('')}</g>
    <circle cx="1600" cy="472" r="10" fill="url(#lf-gold)" />
    <rect x="1596" y="438" width="8" height="34" rx="3" fill="#5e4429" />
  </g>
  <!-- legs: lungi over the thighs, bare shins -->
  <path d="M1700 584c10 -2 22 0 30 6c4 4 0 8 -6 8h-30c-6 0 -6 -12 6 -14z" fill="url(#lf-skin-shade)" transform="translate(-30 -8)" />
  <path d="M1676 470l-8 100h22l12 -96z" fill="url(#lf-skin-shade)" />
  <path d="M1704 474l-4 100h22l6 -98z" fill="url(#lf-skin)" />
  <path d="M1698 572c12 -2 26 0 36 6c6 4 2 10 -6 10h-38c-6 0 -6 -14 8 -16z" fill="url(#lf-skin)" />
  <path d="M1772 380c10 40 6 84 -6 100l-102 4c-8 -14 -6 -34 6 -46c16 -16 48 -26 70 -30z" fill="url(#lf-check)" />
  <path d="M1664 484c34 6 70 6 102 -4" fill="none" stroke="#1b332a" stroke-width="2" opacity=".6" />
  <!-- kurta -->
  <path d="M1708 240c22 -10 54 -10 72 2c10 40 14 96 12 150c-28 12 -70 14 -96 4c-6 -54 0 -110 12 -156z" fill="url(#lf-ivory)" />
  <g stroke="#c6baa0" stroke-width="2" fill="none" opacity=".9"><path d="M1722 262c-8 40 -10 90 -8 130" /><path d="M1772 268c6 40 8 84 6 124" /><path d="M1746 300v90" /></g>
  <!-- gamcha over the shoulder -->
  <path d="M1748 236c18 2 30 10 34 24c-6 40 -12 80 -12 122l-18 -2c0 -44 4 -84 10 -120c-6 -10 -12 -14 -20 -16z" fill="url(#lf-gamcha)" />
  <path d="M1752 380l18 2l-2 14l-18 -2z" fill="#e9dcc2" opacity=".8" />
  <!-- neck + head, facing the wheel -->
  <path d="M1728 206c-2 12 -2 24 2 36c8 4 18 2 24 -4c-4 -10 -4 -22 -2 -32z" fill="url(#lf-skin-shade)" />
  <path d="M1758 128c-24 -6 -46 6 -50 28c-1 6 -2 10 -6 18c-3 5 0 7 4 8c-1 4 -2 7 2 9c-2 4 0 8 4 10c2 8 10 14 22 14c16 0 28 -6 34 -16c10 -16 10 -38 4 -52c-2 -10 -6 -16 -14 -19z" fill="url(#lf-face)" />
  <path d="M1716 174c4 -3 10 -3 14 0c-4 4 -10 4 -14 0z" fill="#fbf6ef" /><circle cx="1721" cy="174" r="2.6" fill="#2a1a12" />
  <path d="M1712 166c6 -5 14 -5 20 -1" fill="none" stroke="#1d130d" stroke-width="2.6" stroke-linecap="round" />
  <path d="M1704 196c6 -2 14 -2 20 2c-6 4 -14 4 -20 -2z" fill="#2a1d16" />
  <path d="M1712 204c4 1 8 1 12 -1" fill="none" stroke="#7b3e2e" stroke-width="2" stroke-linecap="round" />
  <path d="M1700 146c2 -26 26 -38 50 -32c16 4 26 16 26 32c0 10 -2 18 -6 26c-2 -10 -6 -18 -12 -22c-8 -4 -18 -6 -28 -4c-12 2 -22 2 -30 0z" fill="url(#lf-hair)" />
  <path d="M1716 124c12 -4 26 -2 36 6" fill="none" stroke="#5b463a" stroke-width="2" opacity=".6" />
  <path d="M1752 176c6 -2 8 6 6 12c-2 6 -8 6 -10 2" fill="#a86f4b" />
  <!-- turning arm (animated) -->
  <g class="loom__crank">
    <path d="M1716 252c-14 16 -24 44 -28 74l16 4c4 -24 12 -48 24 -64z" fill="url(#lf-ivory)" />
    <path d="M1690 324c-22 32 -42 70 -64 110l14 8c22 -36 44 -74 64 -110z" fill="url(#lf-skin)" />
    <path d="M1624 430c-6 6 -6 18 2 22c8 4 18 0 20 -8c2 -6 -2 -14 -10 -16z" fill="url(#lf-skin)" />
  </g>
</g>`;

export const FIGURE_DEFS = DEFS;
export const WEAVER_SVG = WEAVER;
export const SPINNER_SVG = SPINNER;
// pivots for the animated arms (svg user space)
export const ARM_ORIGIN = '328 256';
export const CRANK_ORIGIN = '1716 256';
