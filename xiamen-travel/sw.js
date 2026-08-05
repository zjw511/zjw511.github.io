// Service Worker - 离线缓存
var CACHE_NAME = 'xiamen-travel-v2';
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

// 离线优先策略
self.addEventListener('fetch', function(e) {
  // 只处理GET请求
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      // 有缓存就用缓存（离线可用）
      if (cached) return cached;
      
      // 没缓存就请求网络
      return fetch(e.request).then(function(response) {
        // 成功了就存一份缓存
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      }).catch(function() {
        // 网络也失败了，回退到首页
        return caches.match('./index.html');
      });
    })
  );
});