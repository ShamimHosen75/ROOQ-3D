/**
 * Splits an element's text into .word > .char spans, keeping <br> and inline
 * elements such as <em> intact. Returns { words, chars }.
 */
export function split(el) {
  if (el.dataset.splitDone) return { words: [...el.querySelectorAll('.word')], chars: [...el.querySelectorAll('.char')] };
  const words = [];
  const chars = [];
  const walk = (node, parent) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          const w = document.createElement('span');
          w.className = 'word';
          [...part].forEach((ch) => {
            const c = document.createElement('span');
            c.className = 'char';
            c.textContent = ch;
            w.appendChild(c);
            chars.push(c);
          });
          words.push(w);
          frag.appendChild(w);
        });
        parent.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
        walk(child, child);
      }
    });
  };
  walk(el, el);
  el.dataset.splitDone = '1';
  return { words, chars };
}
