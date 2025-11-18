'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Session {
  cpf: string
  nome: string
  perfil: 'funcionario' | 'rh' | 'admin'
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
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
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

      const dashboardRes = await fetch('/api/rh/dashboard')
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

  const liberarAvaliacao = async () => {
    try {
      const response = await fetch('/api/rh/liberar-avaliacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: '87545772900' }),
      })

      if (response.ok) {
        alert('Nova avaliação liberada para o funcionário CPF 87545772900')
        // Recarregar dados se necessário
        fetchData()
      } else {
        const error = await response.json()
        alert('Erro: ' + error.error)
      }
    } catch (error) {
      alert('Erro ao liberar avaliação')
    }
  }

  const limparAvaliacoesConcluidas = async () => {
    try {
      const response = await fetch('/api/rh/limpar-avaliacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: '87545772900' }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Avaliações concluídas removidas: ${data.message}`)
        // Recarregar dados se necessário
        fetchData()
      } else {
        const error = await response.json()
        alert('Erro: ' + error.error)
      }
    } catch (error) {
      alert('Erro ao limpar avaliações')
    }
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
    labels: data.resultados.map(r => r.dominio.substring(0, 20)),
    datasets: [{
      label: 'Score Médio',
      data: data.resultados.map(r => r.media_score),
      backgroundColor: 'rgba(255, 107, 0, 0.7)',
      borderColor: 'rgb(255, 107, 0)',
      borderWidth: 1,
    }],
  }

  // Dados para gráfico de pizza
  const doughnutData = {
    labels: ['Baixo', 'Médio', 'Alto'],
    datasets: [{
      data: [
        data.distribuicao.find(d => d.categoria === 'baixo')?.total || 0,
        data.distribuicao.find(d => d.categoria === 'medio')?.total || 0,
        data.distribuicao.find(d => d.categoria === 'alto')?.total || 0,
      ],
      backgroundColor: ['#EF4444', '#F59E0B', '#10B981'],
    }],
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={session.nome} userRole={session.perfil} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Dashboard RH</h2>
          <p className="text-gray-600">Visão geral das avaliações psicossociais</p>
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

        {/* Botões de exportação */}
        <div className="flex gap-4 mb-8 flex-wrap">
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
          <button
            onClick={liberarAvaliacao}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors"
          >
            🚀 Liberar Nova Avaliação (CPF 87545772900)
          </button>
          <button
            onClick={limparAvaliacoesConcluidas}
            className="bg-warning text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
          >
            🗑️ Limpar Avaliações Concluídas (CPF 87545772900)
          </button>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Scores por Domínio</h3>
            <Bar data={barData} options={{ responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }} />
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Distribuição por Categoria</h3>
            <Doughnut data={doughnutData} options={{ responsive: true }} />
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Domínio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score Médio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.resultados.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{r.dominio}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{Number(r.media_score).toFixed(1)}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        r.categoria === 'alto' ? 'bg-green-100 text-green-800' :
                        r.categoria === 'medio' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {r.categoria.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
