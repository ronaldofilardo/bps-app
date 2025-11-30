'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Package, Send, RefreshCw } from 'lucide-react'

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

interface NotificationsSectionProps {
  onNavigateToLote?: (loteId: number) => void
}

export default function NotificationsSection({ onNavigateToLote }: NotificationsSectionProps) {
  const [notificacoes, setNotificacoes] = useState<NotificacaoClinica[]>([])
  const [loading, setLoading] = useState(false)
  const [totalNaoLidas, setTotalNaoLidas] = useState(0)

  useEffect(() => {
    fetchNotificacoes()
  }, [])

  const fetchNotificacoes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/rh/notificacoes')
      const data = await response.json()

      if (data.success) {
        // Filtrar apenas não lidas
        const naoLidas = data.notificacoes.filter((n: NotificacaoClinica) => 
          new Date(n.data_evento).getTime() > Date.now() - 24 * 60 * 60 * 1000 // últimas 24h
        )
        setNotificacoes(naoLidas.slice(0, 5)) // Mostrar apenas as 5 mais recentes
        setTotalNaoLidas(data.totalNaoLidas)
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
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}min atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const getIconForTipo = (tipo: string) => {
    switch (tipo) {
      case 'avaliacao_concluida':
        return <CheckCircle size={18} />
      case 'lote_concluido':
        return <Package size={18} />
      case 'laudo_enviado':
        return <Send size={18} />
      default:
        return <Package size={18} />
    }
  }

  const getColorForTipo = (tipo: string) => {
    switch (tipo) {
      case 'avaliacao_concluida':
        return 'bg-green-500 text-white'
      case 'lote_concluido':
        return 'bg-blue-500 text-white'
      case 'laudo_enviado':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  if (notificacoes.length === 0) {
    return null // Não mostra a seção se não há notificações
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold text-gray-800">🔔 Notificações</h3>
          {totalNaoLidas > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalNaoLidas}
            </span>
          )}
        </div>
        <button
          onClick={fetchNotificacoes}
          disabled={loading}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 disabled:opacity-50"
          title="Atualizar notificações"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {notificacoes.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificacaoClick(notif.lote_id)}
              className="p-4 hover:bg-blue-50 cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 p-2 rounded-lg shadow-sm transition-all group-hover:scale-110 ${getColorForTipo(notif.tipo)}`}>
                  {getIconForTipo(notif.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 mb-1 leading-tight">
                    {notif.mensagem}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-700">
                      {notif.codigo}
                    </span>
                    <span className="text-xs text-gray-600 truncate max-w-[200px]">
                      {notif.empresa_nome}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(notif.data_evento)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
