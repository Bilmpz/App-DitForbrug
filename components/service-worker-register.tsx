'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    async function registerServiceWorker() {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        console.error('Kunne ikke registrere service worker', error);
      }
    }

    registerServiceWorker();
  }, []);

  return null;
}
