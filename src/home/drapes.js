import { gsap, $, reduced } from './core.js';
import { TABS, SAREES } from './drapeData.js';

const hasWebGL2 = () => {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
};

// Static arrangement for browsers without WebGL2 or with reduced motion.
function staticDrapes(stage) {
  const spots = {
    maroon: 'left:42%;top:14%;width:24%;rotate:-6deg',
    ivory: 'left:22%;top:34%;width:22%;rotate:4deg',
    navy: 'left:70%;top:28%;width:24%',
    black: 'left:6%;top:56%;width:26%;rotate:3deg',
    yellow: 'left:55%;top:58%;width:26%;rotate:-3deg',
  };
  const petals = ['left:86%;top:62%;width:6%;rotate:12deg', 'left:48%;top:50%;width:5%;rotate:-20deg', 'left:36%;top:22%;width:4.5%;rotate:45deg', 'left:30%;top:78%;width:5.5%;rotate:-6deg', 'left:90%;top:20%;width:4%;rotate:90deg'];
  const wrap = document.createElement('div');
  wrap.className = 'drapes__fallback';
  SAREES.forEach((s) => {
    const img = document.createElement('img');
    img.src = `/drape/cut-${s.id}.webp`;
    img.alt = s.name;
    img.style.cssText = spots[s.id];
    wrap.appendChild(img);
  });
  petals.forEach((css) => {
    const img = document.createElement('img');
    img.src = '/drape/cut-petal.webp';
    img.alt = '';
    img.style.cssText = css;
    wrap.appendChild(img);
  });
  stage.appendChild(wrap);
}

export function setupDrapes() {
  const section = $('#drapes');
  const stage = $('.drapes__stage', section);
  const zone = $('.drapes__zone', section);
  const pick = $('.pick', section);
  const live = hasWebGL2() && !reduced();
  let scene = null;
  let filter = null;
  let visible = false;
  let mounted = false;

  // filter tabs
  const tabs = $('.drapes__tabs', section);
  const buttons = TABS.map((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tab';
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<i style="background:${t.dot}"></i>${t.tag}`;
    b.addEventListener('click', () => {
      filter = filter === t.tag ? null : t.tag;
      buttons.forEach((x, i) => x.setAttribute('aria-pressed', String(TABS[i].tag === filter)));
      scene?.setFilter(filter);
    });
    tabs.appendChild(b);
    return b;
  });

  // drop → "Unfolding" → your selection
  let phase = null;
  let current = null;
  let t1 = 0;
  let t2 = 0;
  const onDrop = (id) => {
    clearTimeout(t1);
    clearTimeout(t2);
    current = id;
    hidePick(false);
    phase = 'loading';
    section.classList.add('is-loading');
    t1 = setTimeout(() => {
      phase = 'open';
      section.classList.remove('is-loading');
      showPick(id);
    }, 1300);
  };
  const showPick = (id) => {
    const s = SAREES.find((x) => x.id === id);
    $('.pick__img', pick).src = `/drape/cut-${s.id}.webp`;
    $('.pick__img', pick).alt = s.name;
    $('.pick__name', pick).textContent = s.name;
    $('.pick__fabric', pick).textContent = s.fabric;
    $('.pick__note', pick).textContent = s.note;
    pick.setAttribute('aria-label', s.name);
    pick.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => pick.classList.add('is-shown')));
  };
  const hidePick = (later = true) => {
    pick.classList.remove('is-shown');
    if (later) t2 = setTimeout(() => (pick.hidden = true), 800);
    else pick.hidden = true;
  };
  const close = () => {
    clearTimeout(t1);
    phase = null;
    section.classList.remove('is-loading');
    if (current) scene?.eject(current);
    hidePick();
  };
  pick.addEventListener('click', close);
  $('.pick__body', pick).addEventListener('click', (e) => e.stopPropagation());
  $('.pick__close', pick).addEventListener('click', close);
  window.addEventListener('keydown', (e) => e.key === 'Escape' && pick.classList.contains('is-shown') && close());

  // mount the 3D scene lazily: shortly after load, or when it nears the viewport
  const mount = async () => {
    if (mounted) return;
    mounted = true;
    if (!live) {
      zone.style.display = 'none';
      staticDrapes(stage);
      return;
    }
    const { DrapeScene } = await import('./drapeScene.js');
    scene = await DrapeScene.create({ container: stage, arcs: $('.drapes__arcs', section), dropZone: zone, onDropZone: onDrop });
    window.__rooq = { scene };
    scene.setActive(visible);
    if (filter) scene.setFilter(filter);
    gsap.ticker.add(() => scene.tick());
  };
  const idle = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 400));
  const later = () => setTimeout(() => idle(mount), 1200);
  if (document.readyState === 'complete') later();
  else window.addEventListener('load', later, { once: true });
  new IntersectionObserver(([e]) => e.isIntersecting && mount(), { rootMargin: '1500px 0px' }).observe(section);
  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      scene?.setActive(visible);
    },
    { threshold: 0.15 },
  ).observe(section);

  if (!live) zone.style.display = 'none';
  return { phase: () => phase };
}

export function revealDrapes() {
  gsap.from('#drapes .js-drape-reveal', {
    y: 40,
    autoAlpha: 0,
    duration: 1.1,
    stagger: 0.08,
    ease: 'power3.out',
    scrollTrigger: { trigger: '#drapes', start: 'top 65%' },
  });
}
