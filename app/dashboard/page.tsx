'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { getCorSemaforo, getTextoCategoria } from '@/lib/calculate'

interface Session {
  cpf: string
  nome: string
  perfil: 'funcionario' | 'rh' | 'admin'
}

interface Avaliacao {
  id: number
  status: 'iniciada' | 'em_andamento' | 'concluida'
  inicio: string
  envio?: string
  grupo_atual: number
  criado_em: string
}

interface AvaliacaoStatus {
  status: 'nao_iniciada' | 'iniciada' | 'em_andamento' | 'concluida'
  inicio?: string
  envio?: string
}

interface Resultado {
  grupo: number
  dominio: string
  score: number
  categoria: 'baixo' | 'medio' | 'alto'
  tipo: 'positiva' | 'negativa'
}

export default function DashboardPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [resultados, setResultados] = useState<Resultado[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchSession()
  }, [])

  useEffect(() => {
    if (session) {
      fetchAvaliacoes()
    }
  }, [session])

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (!response.ok) {
        router.push('/login')
        return
      }
      const data = await response.json()
      setSession(data)
    } catch (error) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchAvaliacoes = async () => {
    try {
      const response = await fetch('/api/avaliacao/todas')
      if (response.ok) {
        const data = await response.json()
        setAvaliacoes(data.avaliacoes)
      }
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error)
    }
  }

  const fetchResultados = async (avaliacaoId: number) => {
    try {
      const response = await fetch(`/api/avaliacao/resultados?avaliacao_id=${avaliacaoId}`)
      if (response.ok) {
        const data = await response.json()
        setResultados(data.resultados)
      }
    } catch (error) {
      console.error('Erro ao buscar resultados:', error)
    }
  }

  const entrarAvaliacao = (avaliacao: Avaliacao) => {
    if (avaliacao.status === 'concluida') {
      // Mostrar resultados da avaliação específica
      router.push(`/avaliacao/concluida?avaliacao_id=${avaliacao.id}`)
    } else if (avaliacao.status === 'iniciada') {
      // Iniciar avaliação liberada
      router.push('/avaliacao/grupo/1')
    } else if (avaliacao.status === 'em_andamento') {
      // Continuar avaliação interrompida no grupo correto
      const grupo = avaliacao.grupo_atual || 1;
      router.push(`/avaliacao/grupo/${grupo}`)
    }
  }

  const getStatusTexto = (status: string) => {
    switch (status) {
      case 'iniciada': return 'Iniciada'
      case 'em_andamento': return 'Em andamento'
      case 'concluida': return 'Concluída'
      default: return 'Desconhecido'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': return 'bg-green-100 text-green-800'
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800'
      case 'iniciada': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50">

      
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              Bem-vindo, {session.nome}!
            </h2>

            <div className="mb-4 sm:mb-6">
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Este é o sistema de avaliação psicossocial BPS Brasil, baseado no questionário COPSOQ III.
              </p>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                A avaliação é dividida em <strong>10 grupos</strong> e leva aproximadamente <strong>15-20 minutos</strong> para ser concluída.
              </p>
            </div>

            {/* Lista de Avaliações */}
            <div className="bg-gray-50 border rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">Suas Avaliações</h3>
              {avaliacoes.length === 0 ? (
                <p className="text-gray-600">Nenhuma avaliação encontrada.</p>
              ) : (
                <div className="space-y-3">
                  {avaliacoes.map((avaliacao) => (
                    <div key={avaliacao.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-800">
                            Avaliação #{avaliacao.id}
                          </h4>
                          <p className="text-sm text-gray-500">
                            Criada em: {new Date(avaliacao.criado_em).toLocaleDateString('pt-BR')}
                          </p>
                          {avaliacao.inicio && (
                            <p className="text-sm text-gray-500">
                              Iniciada em: {new Date(avaliacao.inicio).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {avaliacao.envio && (
                            <p className="text-sm text-gray-500">
                              Concluída em: {new Date(avaliacao.envio).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(avaliacao.status)}`}>
                          {getStatusTexto(avaliacao.status)}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => entrarAvaliacao(avaliacao)}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors text-sm"
                        >
                          {avaliacao.status === 'concluida' ? 'Ver Resultados' :
                           avaliacao.status === 'iniciada' ? 'Iniciar Avaliação' :
                           avaliacao.status === 'em_andamento' ? 'Continuar Avaliação' :
                           'Entrar na Avaliação'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Instruções Importantes:</h3>
              <ul className="list-disc list-inside text-blue-700 space-y-1">
                <li>Responda todas as perguntas pensando nas <strong>últimas 4 semanas</strong></li>
                <li>Seja sincero em suas respostas - elas são confidenciais</li>
                <li>Você pode salvar e continuar depois</li>
                <li>Não há respostas certas ou erradas</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Total de Perguntas</h4>
                <p className="text-3xl font-bold text-primary">70</p>
                <p className="text-sm text-gray-600">Itens COPSOQ III + Módulos JZ e EF</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Grupos</h4>
                <p className="text-3xl font-bold text-primary">10</p>
                <p className="text-sm text-gray-600">Domínios de avaliação</p>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              Seu progresso será salvo automaticamente
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
