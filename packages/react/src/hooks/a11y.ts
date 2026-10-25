import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal behaviour for dialogs and sheets: moves focus inside, traps Tab, closes on Escape,
 * locks page scroll and restores focus to the opener on close.
 */
export function useModalFocus(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  { lockScroll = true }: { lockScroll?: boolean } = {},
) {
  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const opener = document.activeElement as HTMLElement | null;
    const first = el.querySelector<HTMLElement>('[autofocus]') ?? el;
    first.focus({ preventScroll: true });
    const prevOverflow = document.documentElement.style.overflow;
    if (lockScroll) document.documentElement.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      if (!nodes.length) {
        e.preventDefault();
        el.focus();
        return;
      }
      const firstNode = nodes[0]!;
      const lastNode = nodes[nodes.length - 1]!;
      if (e.shiftKey && (document.activeElement === firstNode || document.activeElement === el)) {
        e.preventDefault();
        lastNode.focus();
      } else if (!e.shiftKey && document.activeElement === lastNode) {
        e.preventDefault();
        firstNode.focus();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('keydown', onKey);
      if (lockScroll) document.documentElement.style.overflow = prevOverflow;
      opener?.focus?.({ preventScroll: true });
    };
    // onClose is read fresh each time thanks to the effect only depending on `open`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
