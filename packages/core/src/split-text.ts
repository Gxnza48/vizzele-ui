export interface SplitTextOptions {
  /** Granularity. Lines also produce words, words also produce chars. Default `'chars'`. */
  by?: 'chars' | 'words' | 'lines';
}

export interface SplitTextResult {
  chars: HTMLElement[];
  words: HTMLElement[];
  lines: HTMLElement[];
  /** Restores the original markup. */
  revert(): void;
}

/**
 * Splits an element's text into `<span>`s so each char / word / line can be animated.
 * Screen readers still read the original sentence: the element gets an `aria-label`
 * and the spans are `aria-hidden`. Inline markup inside the element is flattened.
 */
export function splitText(
  el: HTMLElement,
  { by = 'chars' }: SplitTextOptions = {},
): SplitTextResult {
  const html = el.innerHTML;
  const hadLabel = el.getAttribute('aria-label');
  const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  el.setAttribute('aria-label', hadLabel ?? text);
  el.textContent = '';

  const chars: HTMLElement[] = [];
  const words: HTMLElement[] = [];
  const parts = text.split(' ');
  parts.forEach((word, wi) => {
    const w = document.createElement('span');
    w.className = 'vz-word';
    w.setAttribute('aria-hidden', 'true');
    w.style.display = 'inline-block';
    w.style.whiteSpace = 'nowrap';
    w.style.setProperty('--vz-i', String(wi));
    if (by === 'chars' || by === 'lines') {
      for (const ch of Array.from(word)) {
        const c = document.createElement('span');
        c.className = 'vz-char';
        c.style.display = 'inline-block';
        c.textContent = ch;
        c.style.setProperty('--vz-i', String(chars.length));
        chars.push(c);
        w.appendChild(c);
      }
    } else {
      w.textContent = word;
    }
    words.push(w);
    el.appendChild(w);
    if (wi < parts.length - 1) el.appendChild(document.createTextNode(' '));
  });

  const lines: HTMLElement[] = [];
  if (by === 'lines') {
    const groups: HTMLElement[][] = [];
    let top: number | null = null;
    for (const w of words) {
      const t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 2) {
        groups.push([]);
        top = t;
      }
      groups[groups.length - 1]!.push(w);
    }
    el.textContent = '';
    groups.forEach((g, li) => {
      const line = document.createElement('span');
      line.className = 'vz-line';
      line.setAttribute('aria-hidden', 'true');
      line.style.display = 'block';
      line.style.setProperty('--vz-i', String(li));
      g.forEach((w, i) => {
        line.appendChild(w);
        if (i < g.length - 1) line.appendChild(document.createTextNode(' '));
      });
      lines.push(line);
      el.appendChild(line);
    });
  }

  return {
    chars,
    words,
    lines,
    revert() {
      el.innerHTML = html;
      if (hadLabel === null) el.removeAttribute('aria-label');
      else el.setAttribute('aria-label', hadLabel);
    },
  };
}
