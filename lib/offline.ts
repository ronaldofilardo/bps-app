import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface BPSDatabase extends DBSchema {
  'avaliacoes-pendentes': {
    key: number
    value: {
      id?: number
      grupo: number
      respostas: Array<{ item: string; valor: number; grupo: number }>
      timestamp: number
    }
  }
  'respostas-cache': {
    key: string
    value: {
      grupo: number
      respostas: Map<string, number>
      timestamp: number
    }
  }
}

let db: IDBPDatabase<BPSDatabase> | null = null

async function getDB() {
  if (!db) {
    db = await openDB<BPSDatabase>('bps-brasil-db', 1, {
      upgrade(db) {
        // Store para avaliações pendentes de sincronização
        if (!db.objectStoreNames.contains('avaliacoes-pendentes')) {
          db.createObjectStore('avaliacoes-pendentes', {
            keyPath: 'id',
            autoIncrement: true,
          })
        }
        
        // Store para cache de respostas
        if (!db.objectStoreNames.contains('respostas-cache')) {
          db.createObjectStore('respostas-cache')
        }
      },
    })
  }
  return db
}

// Salvar avaliação pendente (offline)
export async function salvarAvaliacaoPendente(
  grupo: number,
  respostas: Array<{ item: string; valor: number; grupo: number }>
) {
  const database = await getDB()
  await database.add('avaliacoes-pendentes', {
    grupo,
    respostas,
    timestamp: Date.now(),
  })
}

// Obter avaliações pendentes
export async function getAvaliacoesPendentes() {
  const database = await getDB()
  return await database.getAll('avaliacoes-pendentes')
}

// Limpar avaliação pendente
export async function limparAvaliacaoPendente(id: number) {
  const database = await getDB()
  await database.delete('avaliacoes-pendentes', id)
}

// Salvar respostas em cache
export async function salvarRespostasCache(
  grupo: number,
  respostas: Map<string, number>
) {
  const database = await getDB()
  await database.put('respostas-cache', {
    grupo,
    respostas,
    timestamp: Date.now(),
  }, `grupo-${grupo}`)
}

// Obter respostas do cache
export async function getRespostasCache(grupo: number) {
  const database = await getDB()
  return await database.get('respostas-cache', `grupo-${grupo}`)
}

// Limpar cache expirado (mais de 7 dias)
export async function limparCacheExpirado() {
  const database = await getDB()
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
  
  const allCache = await database.getAll('respostas-cache')
  for (const cache of allCache) {
    if (cache.timestamp < sevenDaysAgo) {
      await database.delete('respostas-cache', `grupo-${cache.grupo}`)
    }
  }
}

// Registrar Service Worker
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope)
        })
        .catch((error) => {
          console.error('❌ Erro ao registrar Service Worker:', error)
        })
    })
  }
}

// Verificar se está online
export function isOnline(): boolean {
  return navigator.onLine
}

// Sincronizar dados quando voltar online
export function setupOnlineSync() {
  window.addEventListener('online', async () => {
    console.log('✅ Voltou online - Sincronizando dados...')
    
    const pendentes = await getAvaliacoesPendentes()
    
    for (const avaliacao of pendentes) {
      try {
        const response = await fetch('/api/avaliacao/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(avaliacao),
        })
        
        if (response.ok && avaliacao.id) {
          await limparAvaliacaoPendente(avaliacao.id)
          console.log('✅ Avaliação sincronizada:', avaliacao.id)
        }
      } catch (error) {
        console.error('❌ Erro ao sincronizar:', error)
      }
    }
  })
}
