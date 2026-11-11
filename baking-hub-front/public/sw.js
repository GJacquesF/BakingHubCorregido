const SHELL_CACHE = "bakinghub-shell-v1";
const DYNAMIC_CACHE = "bakinghub-dynamic-v1";
const APP_SHELL = ["/", "/offline.html", "/favicon.svg", "/manifest.webmanifest"];

self.addEventListener("install", event => {
    event.waitUntil(
        caches
            .open(SHELL_CACHE)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches
            .keys()
            .then(keys =>
                Promise.all(
                    keys.filter(key => key !== SHELL_CACHE && key !== DYNAMIC_CACHE).map(key => caches.delete(key)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    if (url.pathname === "/offline.html") {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const cloned = response.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, cloned));
                    return response;
                })
                .catch(() => caches.match("/offline.html")),
        );
        return;
    }

    if (
        url.pathname.endsWith(".js") ||
        url.pathname.endsWith(".css") ||
        url.pathname.endsWith(".svg") ||
        url.pathname.endsWith(".png") ||
        url.pathname.endsWith(".jpg") ||
        url.pathname.endsWith(".jpeg") ||
        url.pathname.endsWith(".webp") ||
        url.pathname.endsWith(".ico")
    ) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;

                return fetch(request)
                    .then(response => {
                        const cloned = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, cloned));
                        return response;
                    })
                    .catch(() => caches.match("/offline.html"));
            }),
        );
        return;
    }

    event.respondWith(
        fetch(request)
            .then(response => {
                const cloned = response.clone();
                caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, cloned));
                return response;
            })
            .catch(() => caches.match(request).then(cached => cached || caches.match("/offline.html"))),
    );
});
