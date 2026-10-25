/**
 * Text effects scramble, split or count the visible text. Screen readers should hear the real
 * sentence once — so it lives in a visually-hidden span, and the animated copy is aria-hidden.
 * (aria-label can't be used: it's prohibited on generic elements like <span>.)
 */
export function srOnly(text: string): HTMLSpanElement {
  const s = document.createElement('span');
  s.className = 'vz-sr-only';
  s.textContent = text;
  // Inline so it stays hidden even without @vizzele/css.
  s.style.cssText =
    'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';
  return s;
}

export interface AccessibleText {
  /** Animate this one; it's hidden from assistive tech. */
  visual: HTMLSpanElement;
  /** Update what screen readers hear. */
  setLabel(text: string): void;
  /** Put the plain text back. */
  restore(text: string): void;
}

export function accessibleText(el: HTMLElement, text: string): AccessibleText {
  const label = srOnly(text);
  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  visual.textContent = text;
  el.replaceChildren(label, visual);
  return {
    visual,
    setLabel(t) {
      label.textContent = t;
    },
    restore(t) {
      el.textContent = t;
    },
  };
}
