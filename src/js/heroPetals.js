/** Lightweight 2D petal drift for the hero, pushed around by the pointer. */
export class HeroPetals {
  constructor(canvas, { reduced }) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reduced = reduced;
    this.mouse = { x: -999, y: -999 };
    this.active = true;
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('pointermove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    this.resize();
    const n = reduced ? 6 : window.innerWidth < 700 ? 10 : 16;
    this.p = Array.from({ length: n }, () => this.spawn({}, true));
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  spawn(p, anywhere) {
    p.x = Math.random() * this.w * 1.2 - this.w * 0.1;
    p.y = anywhere ? Math.random() * this.h : -30;
    p.z = 0.4 + Math.random() * 0.9; // depth: size + speed + blur
    p.vx = 0;
    p.vy = 0;
    p.rot = Math.random() * 6.28;
    p.spin = (Math.random() - 0.5) * 0.04;
    p.flip = Math.random() * 6.28;
    p.phase = Math.random() * 100;
    return p;
  }

  tick(t) {
    if (!this.active) return;
    const { ctx } = this;
    ctx.clearRect(0, 0, this.w, this.h);
    const speed = this.reduced ? 0.3 : 1;
    for (const p of this.p) {
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 22000) {
        const f = (1 - d2 / 22000) * 0.6;
        p.vx += (dx / Math.sqrt(d2 + 1)) * f * 3;
        p.vy += (dy / Math.sqrt(d2 + 1)) * f * 3;
        p.spin += 0.004;
      }
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.x += (Math.sin(t * 0.8 + p.phase) * 0.6 + 0.35 + p.vx) * p.z * speed;
      p.y += (0.6 + p.vy) * p.z * speed;
      p.rot += p.spin * speed;
      p.flip += 0.03 * speed;
      p.spin *= 0.995;
      if (p.y > this.h + 40 || p.x > this.w + 60) this.spawn(p, false);

      const s = 9 * p.z;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.abs(Math.cos(p.flip)) * 0.7 + 0.3);
      ctx.globalAlpha = 0.45 + p.z * 0.4;
      const g = ctx.createLinearGradient(0, -s, 0, s);
      g.addColorStop(0, '#f08aa6');
      g.addColorStop(1, '#a3163f');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.bezierCurveTo(s * 0.95, s * 0.6, s * 0.9, -s * 0.6, s * 0.3, -s);
      ctx.quadraticCurveTo(0, -s * 0.8, -s * 0.3, -s);
      ctx.bezierCurveTo(-s * 0.9, -s * 0.6, -s * 0.95, s * 0.6, 0, s);
      ctx.fill();
      ctx.restore();
    }
  }
}
