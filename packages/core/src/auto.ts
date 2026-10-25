/**
 * Side-effect entry: registers every effect and wires up `data-vz-*` attributes on the page.
 *
 *     import '@vizzele/core/auto';
 */
import { isBrowser } from './env';
import { observe } from './declarative';
import { registerAll } from './effects';

registerAll();

if (isBrowser) {
  const start = () => {
    document.documentElement.classList.add('vz-ready');
    observe(document.body);
  };
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}

export {};
