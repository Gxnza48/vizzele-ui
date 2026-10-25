import { isBrowser } from './env';
import { observe } from './declarative';
import { registerAll } from './effects';

/**
 * Registers every effect and wires up `data-vz-*` attributes on the page once the DOM is ready.
 * A plain call (not an import side effect) so bundlers can never tree-shake it away.
 */
export function autoInit() {
  registerAll();
  if (!isBrowser) return;
  const start = () => {
    document.documentElement.classList.add('vz-ready');
    observe(document.body);
  };
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
