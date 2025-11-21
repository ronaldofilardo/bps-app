'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Session {
  cpf: string
  nome: string
  perfil: 'funcionario' | 'rh' | 'admin'
}

interface Empresa {
  id: number
  nome: string
  cnpj: string
}

interface DashboardData {
  stats: {
    total_avaliacoes: number
    concluidas: number
    funcionarios_avaliados: number
  }
  resultados: Array<{
    grupo: number
    dominio: string
    media_score: number
    categoria: string
    total: number
    baixo: number
    medio: number
    alto: number
  }>
  distribuicao: Array<{
    categoria: string
    total: number
  }>
}

export default function RHPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    const loadEmpresasAndData = async () => {
      await loadEmpresas()
      await fetchData()
    }
    loadEmpresasAndData()
  }, [])

  const loadEmpresas = async () => {
    try {
      const res = await fetch('/api/rh/empresas')
      if (res.ok) {
        const empresasData = await res.json()
        setEmpresas(empresasData)
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error)
    }
  }

  const fetchData = async (empresaId?: string) => {
    try {
      if (!session) {
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
      }

      const dashboardUrl = empresaId
        ? `/api/rh/dashboard?empresa_id=${empresaId}`
        : '/api/rh/dashboard'

      const dashboardRes = await fetch(dashboardUrl)
      const dashboardData = await dashboardRes.json()
      setData(dashboardData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportarPDF = () => {
    // Implementar exportação PDF
    alert('Exportação PDF em desenvolvimento')
  }

  const exportarExcel = () => {
    // Implementar exportação Excel
    alert('Exportação Excel em desenvolvimento')
  }


  const liberarPorNivel = async (nivel: 'operacional' | 'gestao') => {
    try {
      const response = await fetch('/api/rh/liberar-por-nivel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nivelCargo: nivel }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`${result.message}\n✅ Criadas: ${result.avaliacoesCreated}\n⚠️ Já existiam: ${result.avaliacoesExistentes}\n📊 Total funcionários: ${result.totalFuncionarios}`)
        fetchData(selectedEmpresa || undefined)
      } else {
        const error = await response.json()
        alert('Erro: ' + error.error)
      }
    } catch (error) {
      alert('Erro ao liberar avaliações')
    }
  }

  const handleEmpresaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empresaId = e.target.value
    setSelectedEmpresa(empresaId)
    fetchData(empresaId || undefined)
  }


  if (loading || !session || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Dados para gráfico de barras
  const barData = {
    labels: data.resultados.map(r => `Grupo ${r.grupo}: ${r.dominio.substring(0, 15)}`),
    datasets: [{
      label: 'Score Médio',
      data: data.resultados.map(r => r.media_score),
      backgroundColor: 'rgba(255, 107, 0, 0.7)',
      borderColor: 'rgb(255, 107, 0)',
      borderWidth: 1,
    }],
  }


  return (
    <div className="min-h-screen bg-gray-50">

      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard RH</h2>
          <p className="text-gray-600">Visão geral das avaliações psicossociais</p>
        </div>

        {/* Filtro de empresas */}
        <div className="mb-6">
          <label htmlFor="empresa-select" className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por Empresa:
          </label>
          <select
            id="empresa-select"
            value={selectedEmpresa}
            onChange={handleEmpresaChange}
            className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="">Todas as empresas</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total de Avaliações</h3>
            <p className="text-4xl font-bold text-primary">{data.stats.total_avaliacoes}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Concluídas</h3>
            <p className="text-4xl font-bold text-success">{data.stats.concluidas}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Funcionários Avaliados</h3>
            <p className="text-4xl font-bold text-gray-800">{data.stats.funcionarios_avaliados}</p>
          </div>
        </div>

        {/* Botões de ações */}
        <div className="space-y-4 mb-8">
          {/* Botões de liberação por nível */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 Liberar Avaliações por Nível</h3>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={() => liberarPorNivel('operacional')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                🔧 Liberar para OPERACIONAIS
              </button>
              <button
                onClick={() => liberarPorNivel('gestao')}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                👔 Liberar para GESTÃO
              </button>
            </div>
          </div>

          {/* Botões de exportação e outros */}
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={exportarPDF}
              className="bg-danger text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              📄 Exportar PDF
            </button>
            <button
              onClick={exportarExcel}
              className="bg-success text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              📊 Exportar Excel
            </button>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Scores por Domínio</h3>
            <Bar data={barData} options={{ responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }} />
          </div>
        </div>

        {/* Tabela detalhada */}
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Detalhamento por Domínio</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domínio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score Médio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Baixo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Médio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.resultados.map((r, idx) => (
                  <Fragment key={idx}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{r.grupo}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{r.dominio}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{Number(r.media_score).toFixed(1)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{r.baixo}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{r.medio}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{r.alto}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{r.total}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-6 py-2 text-xs text-gray-500"></td>
                      <td className="px-6 py-2 text-xs text-gray-500">{r.total > 0 ? ((r.baixo / r.total) * 100).toFixed(1) + '%' : '0%'}</td>
                      <td className="px-6 py-2 text-xs text-gray-500">{r.total > 0 ? ((r.medio / r.total) * 100).toFixed(1) + '%' : '0%'}</td>
                      <td className="px-6 py-2 text-xs text-gray-500">{r.total > 0 ? ((r.alto / r.total) * 100).toFixed(1) + '%' : '0%'}</td>
                      <td className="px-6 py-2 text-xs text-gray-500"></td>
                    </tr>
                  </Fragment>
                ))}
                {/* Linhas de total geral */}
                {(() => {
                  const totalBaixo = data.resultados.reduce((sum, r) => sum + Number(r.baixo), 0)
                  const totalMedio = data.resultados.reduce((sum, r) => sum + Number(r.medio), 0)
                  const totalAlto = data.resultados.reduce((sum, r) => sum + Number(r.alto), 0)
                  const totalGeral = totalBaixo + totalMedio + totalAlto
                  return (
                    <Fragment>
                      <tr className="bg-blue-50 font-semibold">
                        <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">Total Geral</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{totalBaixo}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{totalMedio}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{totalAlto}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{totalGeral}</td>
                      </tr>
                      <tr className="bg-blue-100">
                        <td colSpan={3} className="px-6 py-2 text-xs text-gray-600">Percentual Geral</td>
                        <td className="px-6 py-2 text-xs text-gray-600">{totalGeral > 0 ? ((totalBaixo / totalGeral) * 100).toFixed(1) + '%' : '0%'}</td>
                        <td className="px-6 py-2 text-xs text-gray-600">{totalGeral > 0 ? ((totalMedio / totalGeral) * 100).toFixed(1) + '%' : '0%'}</td>
                        <td className="px-6 py-2 text-xs text-gray-600">{totalGeral > 0 ? ((totalAlto / totalGeral) * 100).toFixed(1) + '%' : '0%'}</td>
                        <td className="px-6 py-2 text-xs text-gray-600"></td>
                      </tr>
                    </Fragment>
                  )
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
