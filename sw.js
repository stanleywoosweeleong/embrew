/* 益菌坊 EM Brew Lab — service worker

   No version number to bump. The app opens instantly from the cache, then the
   page asks this worker to "check": every shell file is re-fetched, the cache
   is refreshed, and if index.html came back different the page is told so it
   can show its "new version" toast. */
"use strict";

var CACHE_PREFIX = "embrew-";
var CACHE = "embrew-shell";
var INDEX = "./index.html";

var SHELL = [
  INDEX,
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon-180.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png"
];

function sameBytes(a, b){
  if (a.byteLength !== b.byteLength) return false;
  var x = new Uint8Array(a), y = new Uint8Array(b);
  for (var i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
  return true;
}

/* Fetch one file past the HTTP cache and store it. Resolves true only when a
   copy was already cached and the new one differs. Errors and non-200
   responses leave the cache alone. */
function refresh(url){
  return fetch(url, { cache: "no-cache" }).then(function(res){
    if (!res || !res.ok) return false;
    return caches.open(CACHE).then(function(c){
      return c.match(url).then(function(old){
        return Promise.all([
          old ? old.arrayBuffer() : null,
          res.clone().arrayBuffer()
        ]).then(function(b){
          var changed = !!b[0] && !sameBytes(b[0], b[1]);
          return c.put(url, res).then(function(){ return changed; });
        });
      });
    });
  }).catch(function(){ return false; });
}

function refreshShell(){
  return Promise.all(SHELL.map(refresh)).then(function(changed){
    return changed[SHELL.indexOf(INDEX)];
  });
}

/* install: precache the shell (a missing optional file never fails the
   install) and take over straight away — the cache name never changes, so a
   new worker is always safe to activate. */
self.addEventListener("install", function(e){
  e.waitUntil(refreshShell().then(function(){ return self.skipWaiting(); }));
});

/* activate: drop this app's older, versioned caches, then take control.
   Cache Storage is shared by everything on the origin (all project pages on
   <user>.github.io), so only caches carrying our own prefix are touched. */
self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return (k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE) ? caches.delete(k) : null;
      }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

/* fetch:
   - navigations  → the cached app, instantly; network only if nothing is cached
   - same-origin  → cache first, then network, and cache what comes back
   - cross-origin → left alone
   Freshness is handled by the "check" message below, not here. */
self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate"){
    e.respondWith(
      caches.match(INDEX).then(function(hit){
        if (hit) return hit;
        return fetch(req).then(function(res){
          if (res.ok){
            var copy = res.clone();
            caches.open(CACHE).then(function(c){ c.put(INDEX, copy); });
          }
          return res;
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function(hit){
      if (hit) return hit;
      return fetch(req).then(function(res){
        if (res && res.status === 200 && res.type === "basic"){
          var copy = res.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); });
        }
        return res;
      });
    })
  );
});

/* "check" from a page: refresh the shell and, if index.html changed, tell
   every open window so each can offer a reload. */
self.addEventListener("message", function(e){
  if (e.data !== "check") return;
  e.waitUntil(
    refreshShell().then(function(changed){
      if (!changed) return;
      return self.clients.matchAll({ type: "window" }).then(function(list){
        list.forEach(function(c){ c.postMessage("updated"); });
      });
    })
  );
});
