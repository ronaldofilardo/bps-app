'use client'

import { useEffect } from 'react'
import { registerServiceWorker, setupOnlineSync } from '@/lib/offline'

export default function PWAInitializer() {
  useEffect(() => {
    // Registrar Service Worker
    registerServiceWorker()
    
    // Configurar sincronização online
    setupOnlineSync()
    
    // Notificar status de conexão
    const handleOnline = () => {
      console.log('✅ Conectado à internet')
    }
    
    const handleOffline = () => {
      console.log('⚠️ Sem conexão - Modo offline ativado')
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return null
}
