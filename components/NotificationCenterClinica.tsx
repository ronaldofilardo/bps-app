'use client'

import { useState, useEffect } from 'react'
import { Bell, X, FileText, CheckCircle, Package, Send } from 'lucide-react'

interface NotificacaoClinica {
  id: string
  tipo: 'avaliacao_concluida' | 'lote_concluido' | 'laudo_enviado'
  lote_id: number
  codigo: string
  titulo: string
  empresa_nome: string
  data_evento: string
  mensagem: string
}

interface NotificationCenterClinicaProps {
  onNavigateToLote?: (loteId: number) => void
}

export default function NotificationCenterClinica({ onNavigateToLote }: NotificationCenterClinicaProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notificacoes, setNotificacoes] = useState<NotificacaoClinica[]>([])
  const [loading, setLoading] = useState(false)
  const [totalNaoLidas, setTotalNaoLidas] = useState(0)
  const [visualizadas, setVisualizadas] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Carregar notificações visualizadas do localStorage
    const visualizadasStorage = localStorage.getItem('notificacoes_visualizadas_clinica')
    if (visualizadasStorage) {
      setVisualizadas(new Set(JSON.parse(visualizadasStorage)))
    }

    fetchNotificacoes()
    // Atualizar notificações a cada 2 minutos
    const interval = setInterval(fetchNotificacoes, 120000)
    return () => clearInterval(interval)
  }, [])

  // Marcar todas as notificações como visualizadas ao navegar
  useEffect(() => {
    const handleRouteChange = () => {
      if (notificacoes.length > 0) {
        const novasVisualizadas = new Set(visualizadas)
        notificacoes.forEach(notif => novasVisualizadas.add(notif.id))
        setVisualizadas(novasVisualizadas)
        localStorage.setItem('notificacoes_visualizadas_clinica', JSON.stringify([...novasVisualizadas]))
        setTotalNaoLidas(0)
      }
    }

    // Escutar mudanças de rota usando o evento popstate
    window.addEventListener('popstate', handleRouteChange)

    // Usar um intervalo para detectar mudanças no pathname
    let currentPath = window.location.pathname
    const checkPathChange = () => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname
        handleRouteChange()
      }
    }

    const interval = setInterval(checkPathChange, 100)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      clearInterval(interval)
    }
  }, [notificacoes, visualizadas])

  const fetchNotificacoes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rh/notificacoes')
      const data = await response.json()

      if (data.success) {
        // Filtrar apenas notificações não visualizadas
        const naoVisualizadas = data.notificacoes.filter((notif: NotificacaoClinica) => !visualizadas.has(notif.id))
        setNotificacoes(naoVisualizadas)
        setTotalNaoLidas(naoVisualizadas.length)
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificacaoClick = (loteId: number) => {
    if (onNavigateToLote) {
      onNavigateToLote(loteId)
    }
    setIsOpen(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`
    return date.toLocaleDateString('pt-BR')
  }

  const getIconForTipo = (tipo: string) => {
    switch (tipo) {
      case 'avaliacao_concluida':
        return <CheckCircle size={20} />
      case 'lote_concluido':
        return <Package size={20} />
      case 'laudo_enviado':
        return <Send size={20} />
      default:
        return <FileText size={20} />
    }
  }

  const getColorForTipo = (tipo: string) => {
    switch (tipo) {
      case 'avaliacao_concluida':
        return 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
      case 'lote_concluido':
        return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
      case 'laudo_enviado':
        return 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
      default:
        return 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'
    }
  }

  return (
    <>
      {/* Botão de Notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
        title="Central de Notificações"
      >
        <Bell size={22} className={totalNaoLidas > 0 ? 'animate-pulse' : ''} />
        {totalNaoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg ring-2 ring-gray-900 animate-bounce">
            {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
          </span>
        )}
      </button>

      {/* Painel de Notificações */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Painel */}
          <div className="fixed top-20 right-6 w-[420px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-top-5 duration-300">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Notificações
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    {totalNaoLidas > 0 ? `${totalNaoLidas} ${totalNaoLidas === 1 ? 'nova' : 'novas'}` : 'Tudo em dia'}
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all"
                  aria-label="close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Lista de Notificações */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-600 mx-auto"></div>
                  <p className="mt-3 text-sm text-gray-500 font-medium">Carregando...</p>
                </div>
              ) : notificacoes.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={32} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Nenhuma notificação</p>
                  <p className="text-xs text-gray-500 mt-1">Você está em dia com tudo!</p>
                </div>
              ) : (
                <div className="p-2">
                  {notificacoes.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificacaoClick(notif.lote_id)}
                      className="mb-2 p-4 bg-white hover:bg-blue-50 cursor-pointer transition-all duration-200 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 p-2.5 rounded-xl shadow-sm transition-all group-hover:scale-110 ${getColorForTipo(notif.tipo)}`}>
                          <div className="[&_svg]:w-[18px] [&_svg]:h-[18px] [&_svg]:stroke-[2.5]">
                            {getIconForTipo(notif.tipo)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 mb-1.5 leading-tight">
                            {notif.mensagem}
                          </p>
                          <div className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-md mb-2">
                            <p className="text-xs font-medium text-gray-700">
                              {notif.codigo}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="font-medium truncate max-w-[180px]">{notif.empresa_nome}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500 whitespace-nowrap">{formatDate(notif.data_evento)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notificacoes.length > 0 && (
              <div className="px-4 py-3 bg-white border-t border-gray-100">
                <button
                  onClick={fetchNotificacoes}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold py-2.5 rounded-lg transition-all duration-200"
                >
                  🔄 Atualizar
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}