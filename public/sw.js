// LuminSight Service Worker v1
const CACHE_NAME = 'luminsight-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/journal',
  '/alerts',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// 설치: 핵심 정적 자산 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// 활성화: 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// 요청 인터셉트: Network First (API) / Cache First (정적)
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API 요청은 항상 네트워크 우선, 실패 시 캐시
  if (url.pathname.startsWith('/api/') || url.hostname !== location.hostname) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }

  // 정적 자산은 캐시 우선, 없으면 네트워크
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        // 성공한 GET 응답은 캐시에 저장
        if (request.method === 'GET' && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      })
    })
  )
})

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'LuminSight 알림', {
      body: data.body ?? '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: data.tag ?? 'luminsight',
      data: { url: data.url ?? '/alerts' },
      vibrate: [100, 50, 100],
    })
  )
})

// 알림 클릭 → 앱으로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? '/alerts'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes(location.origin) && 'focus' in c)
      if (existing) {
        existing.focus()
        existing.navigate(targetUrl)
      } else {
        clients.openWindow(targetUrl)
      }
    })
  )
})
