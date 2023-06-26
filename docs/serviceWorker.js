const cacheUrl = ["309.7fd157384c22f44e.js", "3rdpartylicenses.txt", "assets/data/dashboard.json", "assets/data/jobandskill.json", "assets/data/menu.json", "assets/fonts/flUhRq6tzZclQEJ-Vdg-IuiaDsNcIhQ8tQ.woff2", "assets/fonts/Material_Icons.css", "assets/i18n/en-US.json", "assets/i18n/zh-CN.json", "assets/i18n/zh-TW.json", "assets/images/avatar-default.jpg", "assets/images/avatar.jpg", "assets/images/matero.png", "favicon.ico", "index.html", "main.a08d98b7bbe23ae6.js", "polyfills.a68c3e8c4e8265c3.js", "runtime.0d5b12b5b946864d.js", "serviceWorker.js", "styles.da8023eae4e352f8.css", '/'];
const pattern = /^(?!.*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)$).*$/;
var currentDomain = self.location.hostname;

/* 监听安装事件，install 事件一般是被用来设置你的浏览器的离线缓存逻辑 */
this.addEventListener('install', function (event) {
  /* 通过这个方法可以防止缓存未完成，就关闭serviceWorker */
  event.waitUntil(
    /* 创建一个名叫V1的缓存版本 */
    caches.open('v1').then(function (cache) {
      /* 指定要缓存的内容，地址为相对于跟域名的访问路径 */
      return cache.addAll(cacheUrl);
    })
  );
});

self.addEventListener('fetch', function (event) {
  console.log('Handling fetch event for', event.request.url);
  cacheUrl.some(url => event.request.url === (currentDomain + '/' + url) && pattern.test(event.request.url)) &&
    event.respondWith(
      caches.open('v1').then(function (cache) {
        // 遇到升级，清空缓存重新加载
        cache.keys().then(function(keys) {
          keys.forEach(function(request) {
            cache.delete(request);
          });
        return cache
          .match(event.request)
          .then(function (response) {
            if (response) {
              console.log(' Found response in cache:', response);

              return response;
            } else {
              return cache.match('/index.html');
            }
          })
          .catch(function (error) {
            // 处理 match() 或 fetch() 引起的异常。
            console.error('  Error in fetch handler:', error);

            throw error;
          });
      })
    );
});
