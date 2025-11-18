'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Header from '@/components/Header'
import FormGroup from '@/components/FormGroup'
import ProgressBar from '@/components/ProgressBar'
import { grupos } from '@/lib/questoes'

interface Session {
  cpf: string
  nome: string
  perfil: 'funcionario' | 'rh' | 'admin'
}

// Funções para gerenciar grupo de retomada no sessionStorage
const getGrupoRetomadaFromStorage = (): number | null => {
  if (typeof window === 'undefined') return null
  const stored = sessionStorage.getItem('grupo_retomada')
  return stored ? parseInt(stored, 10) : null
}

const setGrupoRetomadaInStorage = (grupo: number): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('grupo_retomada', grupo.toString())
  }
}

const clearGrupoRetomadaFromStorage = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('grupo_retomada')
  }
}


export default function AvaliacaoGrupoPage() {
  const params = useParams()
  const router = useRouter()
  const grupoId = parseInt(params.id as string)

  const [session, setSession] = useState<Session | null>(null)
  const [respostas, setRespostas] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [grupoRetomada, setGrupoRetomada] = useState<number | null>(() => getGrupoRetomadaFromStorage())

  const grupo = grupos.find(g => g.id === grupoId)
  const totalGrupos = grupos.length

  useEffect(() => {
    fetchSession()
    loadRespostas()
  }, [grupoId])

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
    }
  }


  const loadRespostas = async () => {
    try {
      // Verificar status da avaliação
      const statusResponse = await fetch('/api/avaliacao/status')
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        if (statusData.status === 'concluida') {
          // Avaliação já concluída, redirecionar para relatório
          router.push('/avaliacao/concluida')
          return
        }
        // Armazena o grupo de retomada se for uma retomada (grupo_atual > 1) e ainda não foi definido
        if (typeof statusData.grupo_atual === 'number' && statusData.grupo_atual > 1 && grupoRetomada === null) {
          console.log('Definindo grupo de retomada:', statusData.grupo_atual)
          setGrupoRetomada(statusData.grupo_atual)
          setGrupoRetomadaInStorage(statusData.grupo_atual)
        }
        
        // Se a avaliação foi concluída, limpa o grupo de retomada do storage
        if (statusData.status === 'concluida') {
          clearGrupoRetomadaFromStorage()
        }
      }

      // Carregar respostas salvas do grupo
      const response = await fetch(`/api/avaliacao/respostas?grupo=${grupoId}`)
      if (response.ok) {
        const data = await response.json()
        const respostasMap = new Map<string, number>()
        data.respostas?.forEach((r: any) => {
          respostasMap.set(r.item, r.valor)
        })
        setRespostas(respostasMap)
      }
    } catch (error) {
      console.error('Erro ao carregar respostas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRespostaChange = (itemId: string, valor: number) => {
    setRespostas(prev => {
      const newMap = new Map(prev)
      newMap.set(itemId, valor)
      return newMap
    })
  }

  const validateGroup = (): boolean => {
    if (!grupo) return false
    
    for (const item of grupo.itens) {
      if (!respostas.has(item.id)) {
        setError(`Por favor, responda a pergunta: "${item.texto}"`)
        return false
      }
    }
    return true
  }

  const handleSalvar = async () => {
    setError('')
    
    if (!validateGroup()) return

    setSaving(true)
    try {
      const respostasArray = Array.from(respostas.entries()).map(([item, valor]) => ({
        item,
        valor,
        grupo: grupoId,
      }))

      const response = await fetch('/api/avaliacao/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupo: grupoId,
          respostas: respostasArray,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar respostas')
      }

      // Navegar para próximo grupo ou finalizar
      if (grupoId < totalGrupos) {
        router.push(`/avaliacao/grupo/${grupoId + 1}`)
      } else {
        // Finalizar avaliação
        await fetch('/api/avaliacao/finalizar', { method: 'POST' })
        clearGrupoRetomadaFromStorage()
        router.push('/avaliacao/concluida')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }


  const handleVoltar = () => {
    console.log('handleVoltar - grupoRetomada:', grupoRetomada, 'grupoId:', grupoId, 'destino:', grupoId - 1)
    // Bloqueia voltar para grupo anterior ao ponto de retomada
    if (grupoRetomada !== null && (grupoId - 1) < grupoRetomada) {
      console.log('Bloqueando navegação - tentativa de ir para grupo anterior à retomada')
      return;
    }
    if (grupoId > 1) {
      router.push(`/avaliacao/grupo/${grupoId - 1}`)
    } else {
      router.push('/dashboard')
    }
  }

  if (loading || !session || !grupo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={session.nome} userRole={session.perfil} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <ProgressBar currentGroup={grupoId} totalGroups={totalGrupos} />
          
          <FormGroup
            grupo={grupo}
            respostas={respostas}
            onChange={handleRespostaChange}
          />

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:justify-between gap-3 sm:gap-0">

            <button
              onClick={handleVoltar}
              className={`px-4 sm:px-6 py-3 border rounded-lg transition-colors text-sm sm:text-base ${
                grupoRetomada !== null && (grupoId - 1) < grupoRetomada
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
              disabled={grupoRetomada !== null && (grupoId - 1) < grupoRetomada}
              title={grupoRetomada !== null && (grupoId - 1) < grupoRetomada ? 'Não é permitido voltar para grupos anteriores à retomada' : ''}
            >
              ← Voltar
            </button>

            <button
              onClick={handleSalvar}
              disabled={saving}
              className="px-4 sm:px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 text-sm sm:text-base font-medium"
            >
              {saving ? 'Salvando...' : grupoId < totalGrupos ? 'Próximo →' : 'Finalizar'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
