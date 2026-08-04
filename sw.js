/* 益菌坊 EM Brew Lab — service worker
   Bump CACHE_VERSION on every deploy. Old caches are deleted on activate. */
"use strict";

var CACHE_VERSION = "embrew-v1.3.1-20260804";

var SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon-180.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png"
];

/* install: precache the shell, but never fail the whole install
   because one optional file 404'd */
self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function(c){
      return Promise.all(SHELL.map(function(url){
        return c.add(url).catch(function(){ /* skip missing file */ });
      }));
    })
  );
});

/* activate: drop every cache that isn't this version, then take control */
self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === CACHE_VERSION ? null : caches.delete(k);
      }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

/* fetch:
   - navigations  → network first, fall back to the cached shell (offline)
   - same-origin  → cache first, then network, and cache what comes back
   - cross-origin → left alone */
self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate"){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function(c){ c.put("./index.html", copy); });
        return res;
      }).catch(function(){
        return caches.match("./index.html").then(function(r){
          return r || caches.match("./");
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
          caches.open(CACHE_VERSION).then(function(c){ c.put(req, copy); });
        }
        return res;
      });
    })
  );
});

/* let the page trigger an immediate takeover if it ever wants to */
self.addEventListener("message", function(e){
  if (e.data === "skipWaiting") self.skipWaiting();
});
