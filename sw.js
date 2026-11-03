/* ================= GROSTO SERVICE WORKER ================= */
/* Offline support: caches the site shell so pages still open   */
/* (with cached content) when the connection drops, and shows   */
/* a friendly offline page when nothing cached is available.    */

var CACHE_VERSION = "grosto-v2";

var PRECACHE_URLS = [
  "index.html",
  "shop.html",
  "cart.html",
  "offline.html",
  "manifest.json",
  "js/supabase-client.js",
  "js/site-extras.js",
  "js/categories.js",
  "icons/icon-192.png"
];


function networkFirstWithTimeout(request, ms) {

  return new Promise(function (resolve) {

    var settled = false;

    var timer = setTimeout(function () {

      caches.match(request, { ignoreSearch: true }).then(function (cached) {

        if (cached && !settled) {
          settled = true;
          resolve(cached);
        }
      });
    }, ms);

    fetch(request)
      .then(function (response) {

        clearTimeout(timer);

        if (response && response.ok) {

          var copy = response.clone();

          caches.open(CACHE_VERSION).then(function (cache) {
            cache.put(request, copy);
          });
        }

        if (!settled) {
          settled = true;
          resolve(response);
        }
      })
      .catch(function () {

        clearTimeout(timer);

        if (settled) return;

        caches.match(request, { ignoreSearch: true }).then(function (cached) {

          settled = true;

          resolve(cached || caches.match("offline.html"));
        });
      });
  });
}

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

  // Page navigations: network first (fresh content). If the network is
  // slow (more than 3 seconds) we show the cached copy of that page right
  // away so the app never feels stuck. The fresh copy is still saved for
  // next time. Pages like product.html?id=5 reuse the cached page shell
  // because their content is loaded by JavaScript.
  if (request.mode === "navigate") {

    event.respondWith(networkFirstWithTimeout(request, 3000));

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
