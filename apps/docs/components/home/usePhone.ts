'use client';

import { useEffect, useState } from 'react';

/** True on phones and small tablets, where the landing switches to its touch layouts. */
export function usePhone(query = '(max-width: 860px)') {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = matchMedia(query);
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [query]);
  return phone;
}
