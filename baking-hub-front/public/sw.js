const SHELL_CACHE = "bakinghub-shell-v1";
const DYNAMIC_CACHE = "bakinghub-dynamic-v1";
const OFFLINE_URL = "/offline.html";
const APP_SHELL = ["/", OFFLINE_URL, "/favicon.svg", "/manifest.webmanifest"];

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

    if (request.method !== "GET" || url.origin !== self.location.origin) return;
    if (url.pathname === OFFLINE_URL) return;

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(OFFLINE_URL) || caches.match("/")),
        );
        return;
    }

    const isStaticAsset = [".js", ".css", ".svg", ".png", ".jpg", ".jpeg", ".webp", ".ico", ".json"].some(extension =>
        url.pathname.endsWith(extension),
    );

    if (isStaticAsset) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;

                return fetch(request)
                    .then(response => {
                        const clone = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
                        return response;
                    })
                    .catch(() => caches.match(OFFLINE_URL));
            }),
        );
        return;
    }

    event.respondWith(
        fetch(request)
            .then(response => {
                const clone = response.clone();
                caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
                return response;
            })
            .catch(() => caches.match(request).then(cached => cached || caches.match(OFFLINE_URL))),
    );
});
