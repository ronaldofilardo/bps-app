'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Clock, AlertCircle, CheckCircle } from 'lucide-react'

interface Lote {
   id: number
   codigo: string
   titulo: string
   tipo: string
   empresa_nome: string
   clinica_nome: string
   liberado_em: string
   laudo: {
     id: number
     observacoes: string
     status: string
     emitido_em: string | null
     enviado_em: string | null
   } | null
   notificacoes?: NotificacaoLote[]
 }

 interface NotificacaoLote {
   id: string
   tipo: 'lote_liberado' | 'lote_finalizado'
   mensagem: string
   data_evento: string
   visualizada: boolean
 }

interface LoteComNotificacao extends Lote {
  dias_pendente?: number
  notificacao?: string
  prioridade?: 'alta' | 'media' | 'baixa'
}

export default function EmissorDashboard() {
  const [lotes, setLotes] = useState<LoteComNotificacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchLotes()
  }, [])

  const calcularDiasPendente = (liberadoEm: string) => {
    const dataLiberacao = new Date(liberadoEm)
    const hoje = new Date()
    const diffTime = Math.abs(hoje.getTime() - dataLiberacao.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusCategoria = (status?: string): string => {
    switch (status) {
      case 'rascunho':
        return 'Laudo para Emitir'
      case 'emitido':
        return 'Laudo Emitido / A Enviar'
      case 'enviado':
        return 'Enviados à Clínica'
      default:
        return 'Laudo para Emitir'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'rascunho':
        return 'border-orange-500 bg-orange-50'
      case 'emitido':
        return 'border-blue-500 bg-blue-50'
      case 'enviado':
        return 'border-green-500 bg-green-50'
      default:
        return 'border-gray-500 bg-gray-50'
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'rascunho':
        return '📝'
      case 'emitido':
        return '📋'
      case 'enviado':
        return '✅'
      default:
        return '📝'
    }
  }

  // Agrupar lotes por categoria
  const lotesPorCategoria = lotes.reduce((acc, lote) => {
    const categoria = getStatusCategoria(lote.laudo?.status)
    if (!acc[categoria]) {
      acc[categoria] = []
    }
    acc[categoria].push(lote)
    return acc
  }, {} as Record<string, LoteComNotificacao[]>)

  const categorias = ['Laudo para Emitir', 'Laudo Emitido / A Enviar', 'Enviados à Clínica']

  const fetchLotes = async () => {
    try {
      setError(null)
      const response = await fetch('/api/emissor/lotes')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        // Processar lotes
        const lotesComInfo: LoteComNotificacao[] = data.lotes.map((lote: Lote) => {
          const dias = calcularDiasPendente(lote.liberado_em)

          // Simular notificações para o lote
          const notificacoes: NotificacaoLote[] = []

          // Notificação de lote liberado (sempre presente)
          notificacoes.push({
            id: `lote_liberado_${lote.id}`,
            tipo: 'lote_liberado',
            mensagem: `Lote "${lote.titulo}" foi liberado pela clínica`,
            data_evento: lote.liberado_em,
            visualizada: false // TODO: implementar persistência
          })

          // Notificação de lote finalizado (se aplicável)
          if (lote.laudo?.status === 'enviado') {
            notificacoes.push({
              id: `lote_finalizado_${lote.id}`,
              tipo: 'lote_finalizado',
              mensagem: `Lote "${lote.titulo}" foi finalizado e laudo enviado`,
              data_evento: lote.laudo.enviado_em || lote.liberado_em,
              visualizada: false // TODO: implementar persistência
            })
          }

          return {
            ...lote,
            dias_pendente: dias,
            notificacoes
          }
        })

        setLotes(lotesComInfo)
      } else {
        const errorMsg = data.error || 'Erro ao carregar lotes'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro ao conectar com o servidor'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleEmitirLaudo = (loteId: number) => {
    router.push(`/emissor/laudo/${loteId}`)
  }

  const handleRefresh = () => {
    setLoading(true)
    fetchLotes()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando lotes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com botão de sair */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard do Emissor</h1>
              <p className="mt-2 text-gray-600">Histórico completo dos lotes processados para emissão de laudos</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Atualizando...' : 'Atualizar'}
              </button>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' })
                  router.push('/login')
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Tentar Novamente
            </button>
          </div>
        ) : lotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Nenhum lote encontrado no histórico de emissões.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {categorias.map((categoria) => {
              const lotesCategoria = lotesPorCategoria[categoria] || []
              if (lotesCategoria.length === 0) return null

              return (
                <div key={categoria} className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <span>{getStatusIcon(lotesCategoria[0]?.laudo?.status)}</span>
                      {categoria}
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({lotesCategoria.length} {lotesCategoria.length === 1 ? 'lote' : 'lotes'})
                      </span>
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid gap-4">
                      {lotesCategoria.map((lote) => (
                        <div 
                          key={lote.id} 
                          className={`border-l-4 rounded-r-lg p-4 ${getStatusColor(lote.laudo?.status)}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {lote.titulo} - Lote: {lote.codigo}
                              </h3>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                lote.laudo?.status === 'enviado'
                                  ? 'bg-green-100 text-green-800'
                                  : lote.laudo?.status === 'emitido'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {lote.laudo?.status === 'enviado' ? 'Enviado' : 
                                 lote.laudo?.status === 'emitido' ? 'Emitido' : 'Rascunho'}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Empresa Cliente</p>
                              <p className="text-sm text-gray-900">{lote.empresa_nome}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Clínica Origem</p>
                              <p className="text-sm text-gray-900">{lote.clinica_nome}</p>
                            </div>
                          </div>

                          <div className="space-y-1 mb-4">
                            <div className="text-sm text-gray-500">
                              Recebido em {new Date(lote.liberado_em).toLocaleDateString('pt-BR')} às {new Date(lote.liberado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>

                            {lote.laudo?.emitido_em && (
                              <div className="text-sm text-gray-500">
                                Laudo emitido em {new Date(lote.laudo.emitido_em).toLocaleDateString('pt-BR')} às {new Date(lote.laudo.emitido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}

                            {lote.laudo?.enviado_em && (
                              <div className="text-sm text-gray-500">
                                Enviado em {new Date(lote.laudo.enviado_em).toLocaleDateString('pt-BR')} às {new Date(lote.laudo.enviado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>

                          {/* Notificações do Lote */}
                          {lote.notificacoes && lote.notificacoes.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Notificações</h4>
                              <div className="space-y-2">
                                {lote.notificacoes.map((notif) => (
                                  <div
                                    key={notif.id}
                                    className={`p-3 rounded-lg border ${
                                      notif.visualizada
                                        ? 'bg-gray-50 border-gray-200'
                                        : 'bg-blue-50 border-blue-200'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                        notif.tipo === 'lote_liberado' ? 'bg-green-500' : 'bg-purple-500'
                                      }`}></div>
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-800">{notif.mensagem}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          {new Date(notif.data_evento).toLocaleDateString('pt-BR')} às {new Date(notif.data_evento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                      </div>
                                      {!notif.visualizada && (
                                        <div className="flex-shrink-0">
                                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end">
                            <button
                              onClick={() => handleEmitirLaudo(lote.id)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                              {lote.laudo?.status === 'enviado' ? 'Ver Laudo' : 'Abrir Laudo Biopsicossocial'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}