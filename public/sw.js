// Service Worker para PWA - BPS Brasil
const CACHE_NAME = 'bps-brasil-v1'
const urlsToCache = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
  '/globals.css',
]

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto')
        return cache.addAll(urlsToCache)
      })
  )
})

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Interceptar requests
self.addEventListener('fetch', (event) => {
  // Ignorar requests não-GET
  if (event.request.method !== 'GET') {
    return
  }

  // Ignorar requests para API (sempre buscar da rede)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Sem conexão com a internet' }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      })
    )
    return
  }

  // Network First com cache fallback para outros recursos
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar a resposta
        const responseToCache = response.clone()
        
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache)
          })
        
        return response
      })
      .catch(() => {
        // Se falhar, tentar do cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response
            }
            // Retornar página offline genérica
            return new Response(
              '<html><body><h1>Você está offline</h1><p>Verifique sua conexão com a internet</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            )
          })
      })
  )
})

// Background Sync (para sincronizar dados quando voltar online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-avaliacoes') {
    event.waitUntil(syncAvaliacoes())
  }
})

async function syncAvaliacoes() {
  try {
    // Buscar dados pendentes do IndexedDB e enviar para API
    const db = await openDB()
    const pending = await db.getAll('avaliacoes-pendentes')
    
    for (const avaliacao of pending) {
      try {
        await fetch('/api/avaliacao/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(avaliacao),
        })
        await db.delete('avaliacoes-pendentes', avaliacao.id)
      } catch (error) {
        console.error('Erro ao sincronizar avaliação:', error)
      }
    }
  } catch (error) {
    console.error('Erro no sync:', error)
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('bps-brasil-db', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('avaliacoes-pendentes')) {
        db.createObjectStore('avaliacoes-pendentes', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}
