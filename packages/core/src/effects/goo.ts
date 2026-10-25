const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Injects (once) an SVG "goo" filter and returns its CSS `url()`. Blurring shapes and then
 * re-thresholding their alpha makes nearby shapes fuse with smooth necks — like drops of
 * liquid meeting. The sharp original is composited back on top so edges stay crisp.
 */
export function gooFilter(id: string, blur = 6, sharpness = 20): string {
  if (!document.getElementById(id)) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
    const offset = -(sharpness * 0.42).toFixed(2);
    svg.innerHTML =
      `<defs><filter id="${id}" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">` +
      `<feGaussianBlur in="SourceGraphic" stdDeviation="${blur}" result="blur"/>` +
      `<feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 ${sharpness} ${offset}" result="goo"/>` +
      `<feComposite in="SourceGraphic" in2="goo" operator="atop"/>` +
      `</filter></defs>`;
    document.body.appendChild(svg);
  }
  return `url(#${id})`;
}

/**
 * A tiny semi-implicit spring integrator for effects that animate dozens of values per frame,
 * where a `Spring` object per value would be wasteful.
 */
export function stepSpring(
  s: { x: number; v: number },
  target: number,
  dt: number,
  stiffness = 220,
  damping = 22,
) {
  s.v += ((target - s.x) * stiffness - s.v * damping) * dt;
  s.x += s.v * dt;
  return Math.abs(target - s.x) > 0.05 || Math.abs(s.v) > 0.05;
}
