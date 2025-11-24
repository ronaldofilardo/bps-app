'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

interface Session {
  cpf: string
  nome: string
  perfil: 'funcionario' | 'rh' | 'admin'
}

interface Empresa {
  id: number
  nome: string
  cnpj: string
  total_funcionarios?: number
  avaliacoes_pendentes?: number
}

interface ClinicaStats {
  total_empresas: number
  total_funcionarios: number
  total_avaliacoes: number
  avaliacoes_concluidas: number
}

export default function ClinicaOverviewPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [clinicaStats, setClinicaStats] = useState<ClinicaStats | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      await checkAuth()
      await loadEmpresas()
      await loadClinicaStats()
    }
    loadData()
  }, [])

  const checkAuth = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session')
      if (!sessionRes.ok) {
        router.push('/login')
        return
      }
      const sessionData = await sessionRes.json()

      if (sessionData.perfil !== 'rh' && sessionData.perfil !== 'admin') {
        router.push('/dashboard')
        return
      }

      setSession(sessionData)
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      router.push('/login')
    }
  }

  const loadEmpresas = async () => {
    try {
      const res = await fetch('/api/rh/empresas')
      if (res.ok) {
        const empresasData = await res.json()
        // Adicionar estatísticas mock para cada empresa (seria calculado na API)
        const empresasComStats = empresasData.map((empresa: Empresa) => ({
          ...empresa,
          total_funcionarios: Math.floor(Math.random() * 50) + 10, // Mock
          avaliacoes_pendentes: Math.floor(Math.random() * 20) + 5 // Mock
        }))
        setEmpresas(empresasComStats)
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    }
  }

  const loadClinicaStats = async () => {
    try {
      // Mock stats - seria calculado na API
      setClinicaStats({
        total_empresas: empresas.length,
        total_funcionarios: empresas.reduce((sum, emp) => sum + (emp.total_funcionarios || 0), 0),
        total_avaliacoes: 150,
        avaliacoes_concluidas: 120
      })
    } catch (error) {
      console.error('Erro ao carregar estatísticas da clínica:', error)
    } finally {
      setLoading(false)
    }
  }

  const navigateToEmpresa = (empresaId: number) => {
    router.push(`/rh/empresa/${empresaId}`)
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Clínica BPS Brasil</h2>
          <p className="text-gray-600">Visão geral das empresas e avaliações psicossociais</p>
        </div>

        {/* Cards de estatísticas da clínica - Layout compacto */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary mb-1">{clinicaStats?.total_empresas || 0}</div>
              <div className="text-xs md:text-sm font-medium text-gray-600">Empresas</div>
            </div>

            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{clinicaStats?.total_funcionarios || 0}</div>
              <div className="text-xs md:text-sm font-medium text-gray-600">Funcionários</div>
            </div>

            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">{clinicaStats?.total_avaliacoes || 0}</div>
              <div className="text-xs md:text-sm font-medium text-gray-600">Avaliações</div>
            </div>

            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-success mb-1">{clinicaStats?.avaliacoes_concluidas || 0}</div>
              <div className="text-xs md:text-sm font-medium text-gray-600">Concluídas</div>
            </div>
          </div>
        </div>

        {/* Empresas - Layout compacto */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">🏢 Empresas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {empresas.map((empresa) => (
              <div
                key={empresa.id}
                onClick={() => navigateToEmpresa(empresa.id)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 hover:border-primary p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 truncate flex-1 mr-2">{empresa.nome}</h4>
                  <div className="text-lg">🏭</div>
                </div>

                <p className="text-xs text-gray-500 mb-3 truncate">CNPJ: {empresa.cnpj}</p>

                <div className="flex justify-between items-center text-center">
                  <div className="flex-1">
                    <div className="text-lg font-bold text-blue-600">{empresa.total_funcionarios}</div>
                    <div className="text-xs text-gray-500">Funcionários</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300 mx-2"></div>
                  <div className="flex-1">
                    <div className="text-lg font-bold text-orange-600">{empresa.avaliacoes_pendentes}</div>
                    <div className="text-xs text-gray-500">Pendentes</div>
                  </div>
                </div>

                <button className="w-full mt-3 bg-primary text-white py-2 px-3 rounded-md hover:bg-orange-600 transition-colors text-sm font-medium">
                  Ver Dashboard →
                </button>
              </div>
            ))}
          </div>

          {empresas.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏢</div>
              <h4 className="text-xl font-semibold text-gray-600 mb-2">Nenhuma empresa encontrada</h4>
              <p className="text-gray-500">Entre em contato com o administrador para cadastrar empresas.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
