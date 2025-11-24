'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

interface Funcionario {
  cpf: string
  nome: string
  setor: string
  funcao: string
  email: string
  matricula: string | null
  nivel_cargo: 'operacional' | 'gestao' | null
  turno: string | null
  escala: string | null
  empresa_nome: string
  ativo: boolean
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

export default function EmpresaDashboardPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const router = useRouter()
  const params = useParams()
  const empresaId = params.id as string

  useEffect(() => {
    const loadEmpresaAndData = async () => {
      await loadEmpresa()
      await fetchData()
    }
    loadEmpresaAndData()
  }, [empresaId])

  const loadEmpresa = async () => {
    try {
      const res = await fetch('/api/rh/empresas')
      if (res.ok) {
        const empresasData = await res.json()
        const empresaAtual = empresasData.find((e: Empresa) => e.id.toString() === empresaId)
        setEmpresa(empresaAtual || null)
      }
    } catch (error) {
      console.error('Erro ao carregar empresa:', error)
    }
  }

  const fetchFuncionarios = async (empresaId?: string) => {
    try {
      const funcionariosUrl = empresaId
        ? `/api/admin/funcionarios?empresa_id=${empresaId}`
        : '/api/admin/funcionarios'

      const funcionariosRes = await fetch(funcionariosUrl)
      if (funcionariosRes.ok) {
        const funcionariosData = await funcionariosRes.json()
        setFuncionarios(funcionariosData.funcionarios || [])
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error)
    }
  }

  const fetchData = async () => {
    try {
      // Verificar sessão primeiro
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

      // Carregar dados do dashboard
      const dashboardRes = await fetch(`/api/rh/dashboard?empresa_id=${empresaId}`)
      const dashboardData = await dashboardRes.json()
      setData(dashboardData)

      // Carregar funcionários da empresa
      await fetchFuncionarios(empresaId)
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
        body: JSON.stringify({ nivelCargo: nivel, empresaId: parseInt(empresaId) }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`${result.message}\n✅ Criadas: ${result.avaliacoesCreated}\n⚠️ Já existiam: ${result.avaliacoesExistentes}\n📊 Total funcionários: ${result.totalFuncionarios}`)
        fetchData()
      } else {
        const error = await response.json()
        alert('Erro: ' + error.error)
      }
    } catch (error) {
      alert('Erro ao liberar avaliações')
    }
  }


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setUploadFile(file)
    } else {
      alert('Por favor, selecione um arquivo CSV válido.')
      setUploadFile(null)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile) {
      alert('Selecione um arquivo CSV primeiro.')
      return
    }

    setUploading(true)
    try {
      const text = await uploadFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))

      const expectedHeaders = ['cpf', 'nome', 'setor', 'funcao', 'email', 'perfil', 'empresa_id', 'matricula', 'nivel_cargo', 'turno', 'escala']
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))

      if (missingHeaders.length > 0) {
        alert(`Cabeçalhos obrigatórios faltando: ${missingHeaders.join(', ')}`)
        return
      }

      const funcionarios = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const func: any = {}
        headers.forEach((header, index) => {
          func[header] = values[index] || null
        })
        return func
      })

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funcionarios }),
      })

      const result = await response.json()
      if (response.ok) {
        alert(`Importação concluída!\n✅ Sucessos: ${result.sucesso}\n❌ Erros: ${result.erros}`)
        setUploadFile(null)
        // Reset file input
        const fileInput = document.getElementById('csv-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        alert('Erro na importação: ' + result.error)
      }
    } catch (error) {
      alert('Erro ao processar arquivo: ' + error)
    } finally {
      setUploading(false)
    }
  }


  if (loading || !session || !data || !data.resultados || !data.stats) {
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
      <main className="container mx-auto px-4 py-6">
        {/* Header compacto */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => router.push('/rh')}
                className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg border border-gray-200 transition-colors text-sm"
              >
                ← Voltar
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Dashboard {empresa?.nome || 'Empresa'}</h1>
            </div>
            <p className="text-sm text-gray-600">Análise das avaliações psicossociais</p>
          </div>

          {/* Cards de estatísticas compactos no header */}
          <div className="flex gap-4">
            <div className="bg-white rounded-lg shadow-sm p-3 text-center min-w-[80px]">
              <div className="text-lg font-bold text-primary">{data.stats.total_avaliacoes}</div>
              <div className="text-xs text-gray-600">Avaliações</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3 text-center min-w-[80px]">
              <div className="text-lg font-bold text-success">{data.stats.concluidas}</div>
              <div className="text-xs text-gray-600">Concluídas</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3 text-center min-w-[80px]">
              <div className="text-lg font-bold text-gray-800">{data.stats.funcionarios_avaliados}</div>
              <div className="text-xs text-gray-600">Avaliados</div>
            </div>
          </div>
        </div>

        {/* Layout principal com sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar com ações */}
          <div className="lg:col-span-1 space-y-4">
            {/* Liberação por nível */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">🎯 Liberar Avaliações</h3>
              <div className="space-y-2">
                <button
                  onClick={() => liberarPorNivel('operacional')}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  🔧 Operacionais
                </button>
                <button
                  onClick={() => liberarPorNivel('gestao')}
                  className="w-full bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  👔 Gestão
                </button>
              </div>
            </div>

            {/* Upload de funcionários */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">📤 Importar Funcionários</h3>
              <div className="space-y-3">
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-white hover:file:bg-orange-600"
                />
                <button
                  onClick={handleUpload}
                  disabled={!uploadFile || uploading}
                  className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {uploading ? '🔄...' : '📤 Importar'}
                </button>
                <a
                  href="/modelo-funcionarios.csv"
                  download
                  className="block w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors text-center text-sm"
                >
                  📋 Modelo CSV
                </a>
              </div>
            </div>

            {/* Exportações */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">📊 Exportar</h3>
              <div className="space-y-2">
                <button
                  onClick={exportarPDF}
                  className="w-full bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
                >
                  📄 PDF
                </button>
                <button
                  onClick={exportarExcel}
                  className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
                >
                  📊 Excel
                </button>
              </div>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="lg:col-span-3 space-y-6">

            {/* Lista de Funcionários - Compacta */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">👥 Funcionários ({funcionarios.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {funcionarios.slice(0, 10).map((func, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-900 font-mono">{func.cpf}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{func.nome}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{func.setor}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{func.funcao}</td>
                        <td className="px-3 py-2 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${func.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {func.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {funcionarios.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                          Nenhum funcionário encontrado
                        </td>
                      </tr>
                    )}
                    {funcionarios.length > 10 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-center text-sm text-gray-600 bg-gray-50">
                          ... e mais {funcionarios.length - 10} funcionários
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gráfico e tabela lado a lado */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Gráfico */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Scores por Domínio</h3>
                <div className="h-64">
                  <Bar
                    data={barData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { beginAtZero: true, max: 100, ticks: { font: { size: 11 } } },
                        x: { ticks: { font: { size: 10 } } }
                      },
                      plugins: {
                        legend: { display: false }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Tabela detalhada compacta */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">📋 Detalhamento por Domínio</h3>
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Domínio</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Distribuição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.resultados.slice(0, 6).map((r, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm text-gray-900">
                            <div className="font-medium">{r.dominio.substring(0, 20)}{r.dominio.length > 20 ? '...' : ''}</div>
                            <div className="text-xs text-gray-500">Grupo {r.grupo}</div>
                          </td>
                          <td className="px-3 py-2 text-center text-sm font-semibold text-primary">
                            {Number(r.media_score).toFixed(1)}
                          </td>
                          <td className="px-3 py-2 text-center text-sm">
                            <div className="flex justify-center space-x-1">
                              <span className="px-1 py-0.5 bg-red-100 text-red-800 text-xs rounded">B:{r.baixo}</span>
                              <span className="px-1 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">M:{r.medio}</span>
                              <span className="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded">A:{r.alto}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {data.resultados.length > 6 && (
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-center text-sm text-gray-600 bg-gray-50">
                            ... e mais {data.resultados.length - 6} domínios
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
