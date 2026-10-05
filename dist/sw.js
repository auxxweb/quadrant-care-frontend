/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-8b6973ee'], (function (workbox) { 'use strict';

  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "manifest.webmanifest",
    "revision": "42b5e9eb7aec55b87c910d3e769a61a7"
  }, {
    "url": "logo.png",
    "revision": "8127d6b34a779c657a3b73ef250372a9"
  }, {
    "url": "index.html",
    "revision": "1802da3b10e7703b83c5d909839423e9"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "99c0ec33c78d71fdff555f565b4f9ba8"
  }, {
    "url": "icons/pwa-512.png",
    "revision": "f4a2d4dc52ee0467934b84a1c85a916c"
  }, {
    "url": "icons/pwa-192.png",
    "revision": "e21fb6ed8bf85b752c7613ffc2523a00"
  }, {
    "url": "icons/maskable-512.png",
    "revision": "a5bf8a1d5c51ba2ed6a694edf1773e87"
  }, {
    "url": "icons/maskable-192.png",
    "revision": "e441257c58480429179d22f5bd18bd1d"
  }, {
    "url": "icons/favicon-32.png",
    "revision": "3aeedb39a6b065cd338f20b6f0f075cf"
  }, {
    "url": "icons/apple-touch-icon.png",
    "revision": "99c0ec33c78d71fdff555f565b4f9ba8"
  }, {
    "url": "assets/workbox-window.prod.es5-BBnX5xw4.js",
    "revision": null
  }, {
    "url": "assets/index-QSBVpAKn.css",
    "revision": null
  }, {
    "url": "assets/index-DNG5LWI_.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "99c0ec33c78d71fdff555f565b4f9ba8"
  }, {
    "url": "logo.png",
    "revision": "8127d6b34a779c657a3b73ef250372a9"
  }, {
    "url": "icons/apple-touch-icon.png",
    "revision": "99c0ec33c78d71fdff555f565b4f9ba8"
  }, {
    "url": "icons/favicon-32.png",
    "revision": "3aeedb39a6b065cd338f20b6f0f075cf"
  }, {
    "url": "icons/maskable-192.png",
    "revision": "e441257c58480429179d22f5bd18bd1d"
  }, {
    "url": "icons/maskable-512.png",
    "revision": "a5bf8a1d5c51ba2ed6a694edf1773e87"
  }, {
    "url": "icons/pwa-192.png",
    "revision": "e21fb6ed8bf85b752c7613ffc2523a00"
  }, {
    "url": "icons/pwa-512.png",
    "revision": "f4a2d4dc52ee0467934b84a1c85a916c"
  }, {
    "url": "manifest.webmanifest",
    "revision": "42b5e9eb7aec55b87c910d3e769a61a7"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api\//, /^\/uploads\//]
  }));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-styles",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 8,
      maxAgeSeconds: 31536000
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-files",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 16,
      maxAgeSeconds: 31536000
    })]
  }), 'GET');
  workbox.registerRoute(({
    url
  }) => url.pathname.startsWith("/api/"), new workbox.NetworkOnly(), 'GET');
  workbox.registerRoute(({
    url
  }) => url.pathname.startsWith("/uploads/"), new workbox.NetworkFirst({
    "cacheName": "uploads",
    "networkTimeoutSeconds": 4,
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 40,
      maxAgeSeconds: 86400
    })]
  }), 'GET');

}));
