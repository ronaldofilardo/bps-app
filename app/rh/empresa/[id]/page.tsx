'use client'

import React from 'react'
import { useEffect, useState, Fragment } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ModalInserirFuncionario from '@/components/ModalInserirFuncionario'
import RelatorioSetor from '@/components/RelatorioSetor'
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

interface LoteAvaliacao {
   id: number;
   codigo: string;
   titulo: string;
   tipo: string;
   liberado_em: string;
   status: string;
   total_avaliacoes: number;
   avaliacoes_concluidas: number;
   avaliacoes_inativadas: number;
 }

interface AvaliacaoFuncionario {
  id: number;
  inicio: string;
  envio: string | null;
  status: string;
  lote_id?: number;
  lote_codigo?: string;
}

interface Funcionario {
  cpf: string;
  nome: string;
  setor: string;
  funcao: string;
  email: string;
  matricula: string | null;
  nivel_cargo: 'operacional' | 'gestao' | null;
  turno: string | null;
  escala: string | null;
  empresa_nome: string;
  ativo: boolean;
  avaliacoes?: AvaliacaoFuncionario[];
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

interface Laudo {
  id: number
  lote_id: number
  codigo: string
  titulo: string
  empresa_nome: string
  clinica_nome: string
  emissor_nome: string
  enviado_em: string
  hash: string
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
  const [modalFuncionario, setModalFuncionario] = useState<Funcionario | null>(null)
  const [showLiberarLoteModal, setShowLiberarLoteModal] = useState(false)
  const [tipoLote, setTipoLote] = useState<'completo' | 'operacional' | 'gestao'>('completo')
  const [tituloLote, setTituloLote] = useState('')
  const [descricaoLote, setDescricaoLote] = useState('')
  const [liberandoLote, setLiberandoLote] = useState(false)
  const [lotesRecentes, setLotesRecentes] = useState<LoteAvaliacao[]>([])
  const [selectedFuncionarios, setSelectedFuncionarios] = useState<string[]>([])
  const [batchOperationInProgress, setBatchOperationInProgress] = useState(false)
  const [batchOperationType, setBatchOperationType] = useState<'activate' | 'deactivate' | null>(null)
  const [showBatchConfirmDialog, setShowBatchConfirmDialog] = useState(false)
  const [laudos, setLaudos] = useState<Laudo[]>([])
  const [downloadingLaudo, setDownloadingLaudo] = useState<number | null>(null)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [busca, setBusca] = useState('')
  const funcionariosPorPagina = 20
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'lotes' | 'funcionarios'>('lotes')
  const [showInserirModal, setShowInserirModal] = useState(false)
  const [showRelatorioSetor, setShowRelatorioSetor] = useState(false)
  const [loteIdRelatorioSetor, setLoteIdRelatorioSetor] = useState<number | null>(null)
  const [setoresDisponiveis, setSetoresDisponiveis] = useState<string[]>([])

  useEffect(() => {
    const checkSessionAndLoad = async () => {
      try {
        // Verificar se há sessão válida
        const sessionRes = await fetch('/api/auth/session')
        if (!sessionRes.ok) {
          router.push('/login')
          return
        }
        const sessionData = await sessionRes.json()

        // Verificar perfil
        if (sessionData.perfil !== 'rh' && sessionData.perfil !== 'admin') {
          router.push('/dashboard')
          return
        }

        setSession(sessionData)

        // Carregar todos os dados em paralelo
        await Promise.all([
          loadEmpresa(),
          fetchDashboardData(),
          fetchFuncionarios(empresaId, sessionData.perfil),
          fetchLotesRecentes(),
          fetchLaudos()
        ])
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }
    checkSessionAndLoad()
  }, [empresaId])

  // Carregar funcionários quando a aba é ativada
  useEffect(() => {
    if (empresaId && session) {
      fetchFuncionarios(empresaId, session.perfil)
      setSelectedFuncionarios([]) // Limpar seleção ao carregar
    }
  }, [empresaId, session])

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

  const fetchDashboardData = async () => {
    try {
      const dashboardRes = await fetch(`/api/rh/dashboard?empresa_id=${empresaId}`)
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    }
  }

  // Corrigir busca de funcionários conforme perfil
  const fetchFuncionarios = async (empresaId?: string, perfil?: string) => {
    try {
      let funcionariosUrl = '';
      if (perfil === 'rh') {
        funcionariosUrl = empresaId
          ? `/api/rh/funcionarios?empresa_id=${empresaId}`
          : '/api/rh/funcionarios';
      } else {
        funcionariosUrl = empresaId
          ? `/api/admin/funcionarios?empresa_id=${empresaId}`
          : '/api/admin/funcionarios';
      }
      const funcionariosRes = await fetch(funcionariosUrl);
      if (funcionariosRes.ok) {
        const funcionariosData = await funcionariosRes.json();
        // Suporta tanto array direto quanto objeto com .funcionarios
        setFuncionarios(funcionariosData.funcionarios || funcionariosData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  }

  const fetchLotesRecentes = async () => {
    try {
      const response = await fetch(`/api/rh/lotes?empresa_id=${empresaId}&limit=5`)
      if (response.ok) {
        const lotesData = await response.json()
        setLotesRecentes(lotesData.lotes || [])
      }
    } catch (error) {
      console.error('Erro ao carregar lotes recentes:', error)
    }
  }

  const fetchLaudos = async () => {
    try {
      const response = await fetch('/api/rh/laudos')
      if (response.ok) {
        const laudosData = await response.json()
        setLaudos(laudosData.laudos || [])
      }
    } catch (error) {
      console.error('Erro ao carregar laudos:', error)
    }
  }

  const handleDownloadLaudo = async (laudo: Laudo) => {
    try {
      setDownloadingLaudo(laudo.id)
      const response = await fetch(`/api/emissor/laudos/${laudo.lote_id}/data`)

      if (!response.ok) {
        const errorData = await response.json()
        alert(`Erro ao buscar dados do laudo: ${errorData.error}`)
        return
      }

      const dadosLaudo = await response.json()
      
      // Importar e usar geração client-side
      const { gerarLaudoPDF } = await import('@/lib/pdf-laudo-generator')
      await gerarLaudoPDF(dadosLaudo, `laudo-${laudo.codigo}.pdf`)
    } catch (error) {
      console.error('Erro ao fazer download:', error)
      alert('Erro ao fazer download do laudo')
    } finally {
      setDownloadingLaudo(null)
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

      // Carregar funcionários da empresa usando o perfil correto
      await fetchFuncionarios(empresaId, sessionData.perfil)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const abrirRelatorioSetor = async (loteId: number) => {
    // Buscar setores disponíveis
    try {
      const response = await fetch(`/api/rh/funcionarios?empresa_id=${empresaId}`)
      if (response.ok) {
        const data = await response.json()
        const setores = [...new Set(data.funcionarios.map((f: any) => f.setor))].filter(Boolean) as string[]
        setSetoresDisponiveis(setores.sort())
        setLoteIdRelatorioSetor(loteId)
        setShowRelatorioSetor(true)
      }
    } catch (error) {
      console.error('Erro ao buscar setores:', error)
      alert('Erro ao carregar setores disponíveis')
    }
  }

  // Filtrar funcionários baseado na busca (incluindo inativos)
  const funcionariosFiltrados = funcionarios.filter(func =>
    func.nome.toLowerCase().includes(busca.toLowerCase()) ||
    func.cpf.includes(busca) ||
    func.setor.toLowerCase().includes(busca.toLowerCase()) ||
    func.funcao.toLowerCase().includes(busca.toLowerCase()) ||
    (func.matricula && func.matricula.toLowerCase().includes(busca.toLowerCase())) ||
    (func.nivel_cargo && func.nivel_cargo.toLowerCase().includes(busca.toLowerCase()))
  )

  // Calcular paginação
  const totalPaginas = Math.ceil(funcionariosFiltrados.length / funcionariosPorPagina)
  const inicioIndex = (paginaAtual - 1) * funcionariosPorPagina
  const funcionariosPaginados = funcionariosFiltrados.slice(inicioIndex, inicioIndex + funcionariosPorPagina)

  // Limpar seleção quando página muda
  useEffect(() => {
    setSelectedFuncionarios([])
  }, [paginaAtual])

  const atualizarStatusFuncionario = async (cpf: string, novoStatus: boolean) => {
    const acao = novoStatus ? 'ativar' : 'desativar'
    const confirmacao = novoStatus
      ? 'Tem certeza que deseja ativar este funcionário?'
      : 'Tem certeza que deseja desativar este funcionário? Isso marcará todas as suas avaliações como inativadas e elas não aparecerão nos relatórios.'

    if (!confirm(confirmacao)) return

    setUpdatingStatus(cpf)
    try {
      const response = await fetch('/api/rh/funcionarios/status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, ativo: novoStatus })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert(result.message)
        // Recarregar funcionários
        await fetchFuncionarios(empresaId, session?.perfil)
      } else {
        alert('Erro: ' + (result.error || 'Erro desconhecido'))
      }
    } catch (error) {
      alert('Erro ao atualizar status: ' + error)
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Funções para seleção em lote
  const handleSelectFuncionario = (cpf: string, selected: boolean) => {
    if (selected) {
      setSelectedFuncionarios(prev => [...prev, cpf])
    } else {
      setSelectedFuncionarios(prev => prev.filter(c => c !== cpf))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedFuncionarios(funcionariosPaginados.map(f => f.cpf))
    } else {
      setSelectedFuncionarios([])
    }
  }

  const isAllSelected = funcionariosPaginados.length > 0 && 
    funcionariosPaginados.every(f => selectedFuncionarios.includes(f.cpf))

  const isSomeSelected = funcionariosPaginados.some(f => selectedFuncionarios.includes(f.cpf))

  // Função para operações em lote
  const handleBatchOperation = async (operationType: 'activate' | 'deactivate', targetFuncionarios: string[]) => {
    if (targetFuncionarios.length === 0) return

    // Limite de segurança: máximo 50 funcionários por operação
    if (targetFuncionarios.length > 50) {
      alert(`Operação limitada a 50 funcionários por vez. Você selecionou ${targetFuncionarios.length}.`)
      return
    }

    setBatchOperationType(operationType)
    setShowBatchConfirmDialog(true)
  }

  const executeBatchOperation = async () => {
    if (!batchOperationType) return

    const targetFuncionarios = selectedFuncionarios.length > 0 ? selectedFuncionarios : 
      (busca ? funcionariosFiltrados.map(f => f.cpf) : [])

    if (targetFuncionarios.length === 0) return

    setBatchOperationInProgress(true)
    setShowBatchConfirmDialog(false)

    try {
      const response = await fetch('/api/rh/funcionarios/status/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cpfs: targetFuncionarios, 
          ativo: batchOperationType === 'activate' 
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert(result.message)
        // Limpar seleção e recarregar funcionários
        setSelectedFuncionarios([])
        await fetchFuncionarios(empresaId)
      } else {
        alert('Erro: ' + (result.error || 'Erro desconhecido'))
      }
    } catch (error) {
      alert('Erro na operação em lote: ' + error)
    } finally {
      setBatchOperationInProgress(false)
      setBatchOperationType(null)
    }
  }

  const liberarLote = async () => {
    if (!tituloLote.trim()) {
      alert('Digite um título para o lote')
      return
    }

    setLiberandoLote(true)
    try {
      const response = await fetch('/api/rh/liberar-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresaId: parseInt(empresaId),
          titulo: tituloLote.trim(),
          descricao: descricaoLote.trim(),
          tipo: tipoLote
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert(`${result.message}\n✅ Avaliações criadas: ${result.estatisticas.avaliacoesCriadas}\n👥 Total funcionários: ${result.estatisticas.totalFuncionarios}`)
        setShowLiberarLoteModal(false)
        setTituloLote('')
        setDescricaoLote('')
        setTipoLote('completo')
        fetchData()
        fetchLotesRecentes()
      } else {
        alert('Erro: ' + (result.error || 'Erro desconhecido'))
      }
    } catch (error) {
      alert('Erro ao liberar lote de avaliações')
    } finally {
      setLiberandoLote(false)
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
      let text = await uploadFile.text()
      // Remover BOM UTF-8 se presente
      text = text.replace(/^\uFEFF/, '')
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length === 0) {
        alert('Arquivo CSV está vazio')
        return
      }

      // Detectar separador automaticamente (vírgula ou ponto e vírgula)
      const firstLine = lines[0]
      const commaCount = (firstLine.match(/,/g) || []).length
      const semicolonCount = (firstLine.match(/;/g) || []).length
      const separator = commaCount >= semicolonCount ? ',' : ';'

      const headers = firstLine.split(separator).map(h => h.trim().replace(/"/g, ''))

      const expectedHeaders = ['cpf', 'nome', 'setor', 'funcao', 'email', 'perfil', 'matricula', 'nivel_cargo', 'turno', 'escala']
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))

      if (missingHeaders.length > 0) {
        alert(`Cabeçalhos obrigatórios faltando: ${missingHeaders.join(', ')}\n\nCabeçalhos esperados: ${expectedHeaders.join(', ')}\n\nSeparador detectado: ${separator === ',' ? 'vírgula' : 'ponto e vírgula'}`)
        return
      }

      // Validar se há dados
      if (lines.length <= 1) {
        alert('Arquivo CSV não contém dados de funcionários')
        return
      }

      const funcionarios = []
      const erros: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        const values = line.split(separator).map(v => v.trim().replace(/"/g, ''))
        const func: any = {}

        // Mapear valores aos headers
        headers.forEach((header, index) => {
          func[header] = values[index] || null
        })

        // Validações básicas por linha
        if (!func.cpf || func.cpf.length !== 11 || !/^\d{11}$/.test(func.cpf)) {
          erros.push(`Linha ${i + 1}: CPF inválido (${func.cpf})`)
          continue
        }

        if (!func.nome || func.nome.trim().length < 2) {
          erros.push(`Linha ${i + 1}: Nome muito curto (${func.nome})`)
          continue
        }

        if (!func.email || !func.email.includes('@')) {
          erros.push(`Linha ${i + 1}: Email inválido (${func.email})`)
          continue
        }

        // Forçar empresa_id para a empresa atual
        func.empresa_id = empresaId

        funcionarios.push(func)
      }

      if (erros.length > 0) {
        alert(`Erros encontrados:\n\n${erros.slice(0, 5).join('\n')}${erros.length > 5 ? `\n... e mais ${erros.length - 5} erros` : ''}`)
        return
      }

      if (funcionarios.length === 0) {
        alert('Nenhum funcionário válido encontrado no arquivo')
        return
      }

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funcionarios, empresa_id: empresaId }),
      })

      const result = await response.json()
      if (response.ok) {
        const mensagem = `Importação concluída!\n✅ Sucessos: ${result.sucesso}\n❌ Erros: ${result.erros}`
        if (result.erros > 0) {
          alert(`${mensagem}\n\nNota: Funcionários com CPF já existente foram atualizados.`)
        } else {
          alert(mensagem)
        }
        setUploadFile(null)
        // Reset file input
        const fileInput = document.getElementById('csv-upload') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        // Recarregar lista de funcionários usando o perfil correto
        if (session) {
          fetchFuncionarios(empresaId, session.perfil)
        } else {
          fetchFuncionarios(empresaId)
        }
      } else {
        alert('Erro na importação: ' + result.error)
      }
    } catch (error) {
      alert('Erro ao processar arquivo: ' + error)
    } finally {
      setUploading(false)
    }
  }
  const AvaliacoesModal = ({ funcionario, onClose }: { funcionario: Funcionario, onClose: () => void }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
          <h2 className="text-lg font-bold mb-2">Avaliações de {funcionario.nome}</h2>
          <table className="w-full text-xs mb-4">
            <thead>
              <tr>
                <th className="px-2 py-1">ID</th>
                <th className="px-2 py-1">Liberação</th>
                <th className="px-2 py-1">Conclusão</th>
                <th className="px-2 py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {funcionario.avaliacoes?.map(av => (
                <tr key={av.id}>
                  <td className="px-2 py-1">{av.id}</td>
                  <td className="px-2 py-1">{av.inicio ? new Date(av.inicio).toLocaleString('pt-BR') : '-'}</td>
                  <td className="px-2 py-1">{av.envio ? new Date(av.envio).toLocaleString('pt-BR') : '-'}</td>
                  <td className="px-2 py-1">{av.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={onClose}>Fechar</button>
        </div>
      </div>
    );
  };

  if (loading || !session || !data || !data.resultados || !data.stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div role="status" className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6">
        {/* Header compacto com botão sair */}
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
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              router.push('/login')
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            Sair
          </button>
        </div>

        {/* Cards de estatísticas compactos no header */}
        <div className="flex gap-4 mb-6">
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

        {/* Abas */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('lotes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'lotes'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📋 Lotes de avaliações
              </button>
              <button
                onClick={() => setActiveTab('funcionarios')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'funcionarios'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 Funcionários
              </button>
            </nav>
          </div>
        </div>

        {/* Conteúdo das abas */}
        {activeTab === 'lotes' && (
          <div className="space-y-6">
            {/* Área única de Lotes e Laudos */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">📋 Lotes de Avaliações</h3>
                <button
                  onClick={() => setShowLiberarLoteModal(true)}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  🚀 Liberar Novo Lote
                </button>
              </div>

              {lotesRecentes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lotesRecentes.map((lote) => {
                    const isPronto = lote.avaliacoes_concluidas === (lote.total_avaliacoes - lote.avaliacoes_inativadas)
                    const laudoAssociado = laudos.find(l => l.lote_id === lote.id)
                    return (
                      <div 
                        key={lote.id} 
                        className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:shadow-lg hover:border-primary transition-all cursor-pointer"
                        onClick={() => router.push(`/rh/empresa/${empresaId}/lote/${lote.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            router.push(`/rh/empresa/${empresaId}/lote/${lote.id}`)
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Ver detalhes do lote ${lote.codigo}`}
                      >
                        <div className="mb-4">
                          <h5 className="font-semibold text-gray-800 text-base mb-1">{lote.titulo}</h5>
                          <p className="text-sm text-gray-600">Código: {lote.codigo}</p>
                          <p className="text-xs text-gray-500">Liberado em {new Date(lote.liberado_em).toLocaleDateString('pt-BR')} às {new Date(lote.liberado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Avaliações liberadas:</span>
                            <span className="font-medium">{lote.total_avaliacoes}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Concluídas:</span>
                            <span className="font-medium text-green-600">{lote.avaliacoes_concluidas}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Inativadas:</span>
                            <span className="font-medium text-red-600">{lote.avaliacoes_inativadas}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Status relatório:</span>
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              isPronto ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {isPronto ? 'Pronto' : 'Pendente'}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            abrirRelatorioSetor(lote.id)
                          }}
                          disabled={!isPronto}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mb-4"
                        >
                          📋 Relatório por Setor
                        </button>

                        {/* Laudo associado */}
                        {laudoAssociado && (
                          <div className="p-3 bg-blue-50 rounded border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-blue-800">📄 Laudo disponível</span>
                              <span className="text-xs text-blue-600">
                                {new Date(laudoAssociado.enviado_em).toLocaleDateString('pt-BR')} às {new Date(laudoAssociado.enviado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-blue-700 mb-2">Emissor: {laudoAssociado.emissor_nome}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownloadLaudo(laudoAssociado)
                              }}
                              disabled={downloadingLaudo === laudoAssociado.id}
                              className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              {downloadingLaudo === laudoAssociado.id ? 'Baixando...' : '📥 Baixar Laudo PDF'}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📋</div>
                  <h4 className="text-xl font-semibold text-gray-600 mb-2">Nenhum lote encontrado</h4>
                  <p className="text-gray-500">Libere um novo lote de avaliações para começar.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'funcionarios' && (
          <div className="space-y-6">
            {/* Gerenciamento de funcionários */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">👥 Gerenciar Funcionários</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inserir Individual */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Inserir Individual</h4>
                  <button
                    onClick={() => setShowInserirModal(true)}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    ➕ Inserir Funcionário
                  </button>
                </div>

                {/* Upload CSV */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Importar Múltiplos (CSV)</h4>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-orange-600"
                  />
                  <button
                    onClick={handleUpload}
                    disabled={!uploadFile || uploading}
                    className="w-full mt-2 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                  >
                    {uploading ? '🔄 Importando...' : '📤 Importar CSV'}
                  </button>
                  <a
                    href="/modelo-funcionarios.csv"
                    download
                    className="block w-full mt-2 bg-gray-600 text-white px-4 py-3 rounded-md hover:bg-gray-700 transition-colors text-center text-sm"
                  >
                    📋 Baixar Modelo CSV
                  </a>
                </div>
              </div>
            </div>

            {/* Lista de Funcionários */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    👥 Funcionários ({funcionariosFiltrados.length}{busca && ` encontrados de ${funcionarios.length} total`})
                  </h3>

                  {/* Busca */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Buscar por nome, CPF, setor, matrícula, nível de cargo..."
                      value={busca}
                      onChange={(e) => {
                        setBusca(e.target.value)
                        setPaginaAtual(1) // Reset para primeira página
                        setSelectedFuncionarios([]) // Limpar seleção ao mudar busca
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Ações em Lote */}
                {(selectedFuncionarios.length > 0 || (busca && funcionariosFiltrados.length > 0)) && (
                  <div className="flex flex-wrap items-center gap-3 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800 font-medium">
                      {selectedFuncionarios.length > 0 ? (
                        `${selectedFuncionarios.length} funcionário(s) selecionado(s)`
                      ) : (
                        `Filtro ativo: ${funcionariosFiltrados.length} funcionário(s) encontrado(s)`
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBatchOperation('activate', selectedFuncionarios.length > 0 ? selectedFuncionarios : funcionariosFiltrados.map(f => f.cpf))}
                        disabled={batchOperationInProgress}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {batchOperationInProgress ? '🔄 Processando...' : '✅ Ativar'}
                      </button>
                      
                      <button
                        onClick={() => handleBatchOperation('deactivate', selectedFuncionarios.length > 0 ? selectedFuncionarios : funcionariosFiltrados.map(f => f.cpf))}
                        disabled={batchOperationInProgress}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {batchOperationInProgress ? '🔄 Processando...' : '❌ Desativar'}
                      </button>

                      {selectedFuncionarios.length > 0 && (
                        <button
                          onClick={() => setSelectedFuncionarios([])}
                          className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                        >
                          🗑️ Limpar Seleção
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isSomeSelected && !isAllSelected
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Matrícula</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nível de Cargo</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avaliação</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Liberação</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Conclusão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {funcionariosPaginados.map((func, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-center">
                          <input
                            type="checkbox"
                            checked={selectedFuncionarios.includes(func.cpf)}
                            onChange={(e) => handleSelectFuncionario(func.cpf, e.target.checked)}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 font-mono">{func.cpf}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{func.nome}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{func.setor}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{func.funcao}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{func.matricula || '-'}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{func.nivel_cargo || '-'}</td>
                        <td className="px-3 py-2 text-sm text-center">
                          <input
                            type="checkbox"
                            checked={func.ativo}
                            disabled={updatingStatus === func.cpf}
                            onChange={(e) => atualizarStatusFuncionario(func.cpf, e.target.checked)}
                            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <span className={`px-2 py-1 text-xs rounded-full ${func.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {func.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {func.avaliacoes && func.avaliacoes.length > 0 ? func.avaliacoes[0].lote_codigo : '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {func.avaliacoes && func.avaliacoes.length > 0 ? func.avaliacoes[0].id : '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {func.avaliacoes && func.avaliacoes.length > 0 ? (
                            <>
                              {new Date(func.avaliacoes[0].inicio).toLocaleDateString('pt-BR')} às {new Date(func.avaliacoes[0].inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              {func.avaliacoes.length > 1 && (
                                <button
                                  className="ml-2 text-blue-600 underline text-xs"
                                  onClick={() => setModalFuncionario(func)}
                                  title="Ver todas as liberações"
                                >
                                  Ver todas
                                </button>
                              )}
                            </>
                          ) : '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">
                          {func.avaliacoes && func.avaliacoes.length > 0 && func.avaliacoes[0].envio ? `${new Date(func.avaliacoes[0].envio).toLocaleDateString('pt-BR')} às ${new Date(func.avaliacoes[0].envio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : '-'}
                        </td>
                      </tr>
                    ))}

                    {funcionariosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={13} className="px-3 py-4 text-center text-sm text-gray-500">
                          {busca ? 'Nenhum funcionário encontrado para a busca' : 'Nenhum funcionário encontrado'}
                        </td>
                      </tr>
                    )}

                    {/* Controles de paginação */}
                    {totalPaginas > 1 && (
                      <tr>
                        <td colSpan={13} className="px-3 py-3 text-center bg-gray-50">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                              disabled={paginaAtual === 1}
                              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              ← Anterior
                            </button>

                            <span className="text-sm text-gray-600">
                              Página {paginaAtual} de {totalPaginas}
                              ({funcionariosFiltrados.length} funcionários)
                            </span>

                            <button
                              onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                              disabled={paginaAtual === totalPaginas}
                              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              Próxima →
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      {modalFuncionario && <AvaliacoesModal funcionario={modalFuncionario} onClose={() => setModalFuncionario(null)} />}


      {/* Modal Liberar Lote */}
      {showLiberarLoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-bold mb-4">🚀 Liberar Lote de Avaliações</h2>
              <p className="text-sm text-gray-600 mb-4">
                Crie um novo lote de avaliações para <strong>{empresa?.nome}</strong>.
                Todas as avaliações ficarão vinculadas a este lote.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Lote
                  </label>
                  <select
                    value={tipoLote}
                    onChange={(e) => setTipoLote(e.target.value as 'completo' | 'operacional' | 'gestao')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="completo">Completo (Todos os funcionários)</option>
                    <option value="operacional">Apenas Operacionais</option>
                    <option value="gestao">Apenas Gestão</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título do Lote *
                  </label>
                  <input
                    type="text"
                    value={tituloLote}
                    onChange={(e) => setTituloLote(e.target.value)}
                    placeholder="Ex: Avaliação Trimestral Q4 2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição (Opcional)
                  </label>
                  <textarea
                    value={descricaoLote}
                    onChange={(e) => setDescricaoLote(e.target.value)}
                    placeholder="Descrição adicional sobre este lote..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    maxLength={500}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={liberarLote}
                  disabled={!tituloLote.trim() || liberandoLote}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {liberandoLote ? '🔄 Liberando...' : '🚀 Liberar Lote'}
                </button>
                <button
                  onClick={() => {
                    setShowLiberarLoteModal(false)
                    setTituloLote('')
                    setDescricaoLote('')
                    setTipoLote('completo')
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  disabled={liberandoLote}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inserir Funcionário */}
      {showInserirModal && empresa && (
        <ModalInserirFuncionario
          empresaId={parseInt(empresaId)}
          empresaNome={empresa.nome}
          onClose={() => setShowInserirModal(false)}
          onSuccess={() => {
            fetchFuncionarios(empresaId) // Recarregar lista
            setShowInserirModal(false)
          }}
        />
      )}

      {/* Modal de Confirmação para Operações em Lote */}
      {showBatchConfirmDialog && batchOperationType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Operação em Lote
            </h3>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Você está prestes a <strong>{batchOperationType === 'activate' ? 'ativar' : 'desativar'}</strong> 
                {' '}
                <strong>
                  {selectedFuncionarios.length > 0 
                    ? `${selectedFuncionarios.length} funcionário(s) selecionado(s)`
                    : `${funcionariosFiltrados.length} funcionário(s) filtrado(s)`
                  }
                </strong>
              </p>
              
              {batchOperationType === 'deactivate' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                  <p className="text-yellow-800 text-sm">
                    ⚠️ <strong>Atenção:</strong> Desativar funcionários marcará todas as suas avaliações como inativadas, 
                    e elas não aparecerão nos relatórios.
                  </p>
                </div>
              )}
              
              <p className="text-gray-600 text-sm mt-3">
                Esta ação não pode ser desfeita. Deseja continuar?
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBatchConfirmDialog(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                disabled={batchOperationInProgress}
              >
                Cancelar
              </button>
              
              <button
                onClick={executeBatchOperation}
                disabled={batchOperationInProgress}
                className={`px-4 py-2 text-white rounded ${
                  batchOperationType === 'activate' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {batchOperationInProgress ? '🔄 Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Relatório por Setor */}
      {showRelatorioSetor && loteIdRelatorioSetor && (
        <RelatorioSetor
          loteId={loteIdRelatorioSetor}
          empresaId={parseInt(empresaId)}
          setores={setoresDisponiveis}
          onClose={() => {
            setShowRelatorioSetor(false)
            setLoteIdRelatorioSetor(null)
          }}
        />
      )}
    </div>
  )
}
