// Service Worker - 离线缓存
var CACHE_NAME = 'xiamen-travel-v3';
var ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 安装时缓存核心文件
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 混合策略：HTML走网络优先（确保更新即时生效），其他资源走缓存优先
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;

  var url = new URL(e.request.url);
  var isHTML = e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/';

  if (isHTML) {
    // HTML: 网络优先，失败时回退缓存（离线可用）
    e.respondWith(
      fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('./index.html');
        });
      })
    );
  } else {
    // 其他资源: 缓存优先
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(response) {
          if (response && response.status === 200) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(e.request, clone);
            });
          }
          return response;
        }).catch(function() {
          return caches.match('./index.html');
        });
      })
    );
  }
});
