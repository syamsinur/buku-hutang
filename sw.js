const CACHE_NAME = 'buku-hutang-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (event) => {
  // Handler ini wajib ada agar syarat PWA terpenuhi
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});