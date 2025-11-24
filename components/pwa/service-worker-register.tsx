'use client';

import { useEffect } from 'react';

// Extend Window interface for PWA
declare global {
  interface Window {
    deferredPrompt: BeforeInstallPromptEvent | null;
  }
  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);

          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker available
                  console.log('[PWA] New version available');
                  
                  // Notify user (could show a toast here)
                  if (confirm('A new version of DuoFi is available. Reload to update?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });

      // Handle service worker controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Service Worker controller changed');
        window.location.reload();
      });

      // Check if app is installed
      window.addEventListener('beforeinstallprompt', (e: Event) => {
        // Prevent the mini-infobar from appearing
        e.preventDefault();
        
        // Store the event for later use
        window.deferredPrompt = e as BeforeInstallPromptEvent;
        
        console.log('[PWA] Install prompt available');
      });

      // Track if app was installed
      window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed successfully');
        window.deferredPrompt = null;
      });
    }
  }, []);

  return null;
}
