/* ================= GROSTO SERVICE WORKER ================= */
/* Offline support: caches the site shell so pages still open   */
/* (with cached content) when the connection drops, and shows   */
/* a friendly offline page when nothing cached is available.    */

var CACHE_VERSION = "grosto-v1";

var PRECACHE_URLS = [
  "index.html",
  "shop.html",
  "categories.html",
  "deals.html",
  "cart.html",
  "product.html",
  "checkout.html",
  "about.html",
  "faq.html",
  "help.html",
  "privacy.html",
  "terms.html",
  "track-order.html",
  "order-success.html",
  "offline.html",
  "manifest.json",
  "js/supabase-client.js",
  "js/site-extras.js",
  "js/categories.js",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", function (event) {

  event.waitUntil(

    caches.open(CACHE_VERSION).then(function (cache) {

      return cache.addAll(PRECACHE_URLS).catch(function (err) {
        // one missing file shouldn't block install
        console.warn("GROSTO SW precache warning:", err);
      });
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function (event) {

  event.waitUntil(

    caches.keys().then(function (keys) {

      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_VERSION; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", function (event) {

  var request = event.request;

  if (request.method !== "GET") return;

  // Supabase API/storage calls and other cross-origin requests always go
  // to the network - we never want stale product/order data served from
  // cache.
  var url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // Page navigations: network first (fresh content), fall back to cache,
  // then to the offline page if nothing is cached either.
  if (request.mode === "navigate") {

    event.respondWith(

      fetch(request)
        .then(function (response) {

          var copy = response.clone();

          caches.open(CACHE_VERSION).then(function (cache) {
            cache.put(request, copy);
          });

          return response;
        })
        .catch(function () {

          return caches.match(request).then(function (cached) {
            return cached || caches.match("offline.html");
          });
        })
    );

    return;
  }

  // Static assets (css-in-html, js, icons): cache first for speed, then
  // update the cache quietly in the background.
  event.respondWith(

    caches.match(request).then(function (cached) {

      var networkFetch = fetch(request)
        .then(function (response) {

          if (response && response.ok) {

            var copy = response.clone();

            caches.open(CACHE_VERSION).then(function (cache) {
              cache.put(request, copy);
            });
          }

          return response;
        })
        .catch(function () {
          return cached;
        });

      return cached || networkFetch;
    })
  );
});
