'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { LaudoPadronizado } from '@/lib/laudo-tipos'

interface Lote {
  id: number
  empresa_nome: string
  clinica_nome: string
}

export default function EditarLaudo() {
  const params = useParams()
  const loteId = parseInt(params.loteId as string)
  const router = useRouter()

  const [lote, setLote] = useState<Lote | null>(null)
  const [laudoPadronizado, setLaudoPadronizado] = useState<LaudoPadronizado | null>(null)
  const [observacoes, setObservacoes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchLaudo()
  }, [loteId])

  const fetchLaudo = async () => {
    try {
      const response = await fetch(`/api/emissor/laudos/${loteId}`)
      const data = await response.json()

      if (data.success) {
        setLote(data.lote)
        setLaudoPadronizado(data.laudoPadronizado)
        setObservacoes(data.laudoPadronizado.observacoesEmissor || '')
      } else {
        toast.error(data.error || 'Erro ao carregar laudo')
        router.push('/emissor')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
      router.push('/emissor')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/emissor/laudos/${loteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ observacoes }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Observações salvas com sucesso')
        fetchLaudo() // Recarregar dados
      } else {
        toast.error(data.error || 'Erro ao salvar observações')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setSaving(false)
    }
  }

  const handleEmitir = async () => {
    if (!confirm('Tem certeza que deseja emitir este laudo? Após a emissão, não será possível editar as observações.')) {
      return
    }

    try {
      const response = await fetch(`/api/emissor/laudos/${loteId}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Laudo emitido com sucesso')
        fetchLaudo()
      } else {
        toast.error(data.error || 'Erro ao emitir laudo')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handleEnviar = async () => {
    if (!confirm('Tem certeza que deseja enviar este laudo para a clínica?')) {
      return
    }

    try {
      const response = await fetch(`/api/emissor/laudos/${loteId}`, {
        method: 'PATCH',
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Laudo enviado com sucesso')
        fetchLaudo()
      } else {
        toast.error(data.error || 'Erro ao enviar laudo')
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando laudo...</p>
        </div>
      </div>
    )
  }

  if (!lote || !laudoPadronizado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Laudo não encontrado</p>
          <button
            onClick={() => router.push('/emissor')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-3 py-4">
        <div className="mb-4">
          <button
            onClick={() => router.push('/emissor')}
            className="text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center text-sm"
          >
            ← Voltar ao Dashboard
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Cabeçalho Visual - Padrão BPS */}
          <div className="text-center mb-8 pb-4 border-b-2 border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">LAUDO PSICOSSOCIAL</h1>
            <h2 className="text-base text-gray-700 mb-2">Avaliação de Saúde Mental no Trabalho</h2>
            <p className="text-sm text-gray-600 font-medium">Baseada no instrumento COPSOQ II</p>
          </div>

          {/* Seção Etapa 1 - Dados Gerais da Empresa */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 pb-1 border-b-2 border-orange-400">
              1. DADOS GERAIS DA EMPRESA AVALIADA
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex flex-wrap items-baseline">
                <span className="text-xs font-medium text-gray-500 mr-2">Empresa Avaliada:</span>
                <span className="text-sm font-semibold text-gray-900">{laudoPadronizado.etapa1.empresaAvaliada}</span>
              </div>
              
              <div className="flex flex-wrap items-baseline">
                <span className="text-xs font-medium text-gray-500 mr-2">CNPJ:</span>
                <span className="text-sm text-gray-900">{laudoPadronizado.etapa1.cnpj}</span>
              </div>

              <div className="flex flex-wrap items-baseline">
                <span className="text-xs font-medium text-gray-500 mr-2">Endereço:</span>
                <span className="text-sm text-gray-900">{laudoPadronizado.etapa1.endereco}</span>
              </div>

              <div className="flex flex-wrap items-baseline">
                <span className="text-xs font-medium text-gray-500 mr-2">Período das Avaliações Consideradas:</span>
                <span className="text-sm text-gray-900">
                  {laudoPadronizado.etapa1.periodoAvaliacoes.dataLiberacao} a {laudoPadronizado.etapa1.periodoAvaliacoes.dataUltimaConclusao}
                </span>
              </div>

              <div className="flex flex-wrap items-baseline">
                <span className="text-xs font-medium text-gray-500 mr-2">Total de Funcionários Avaliados:</span>
                <span className="text-sm text-gray-900">
                  {laudoPadronizado.etapa1.totalFuncionariosAvaliados} <span className="text-green-600 font-semibold">({laudoPadronizado.etapa1.percentualConclusao}% das avaliações liberadas foram concluídas)</span>
                </span>
              </div>

              <div className="flex flex-wrap items-baseline">
                <span className="text-xs font-medium text-gray-500 mr-2">Amostra:</span>
                <span className="text-sm text-gray-900">
                  {laudoPadronizado.etapa1.amostra.operacional} funcionários do nível <span className="font-semibold">Operacional</span> + {laudoPadronizado.etapa1.amostra.gestao} do nível <span className="font-semibold">Gestão</span>
                </span>
              </div>
            </div>
          </div>

          {/* Seção Etapa 2 - Tabela de Scores por Grupo */}
          {laudoPadronizado.etapa2 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3 pb-1 border-b-2 border-orange-400">
                2. SCORES MÉDIOS POR GRUPO DE QUESTÕES (escala 0-100)
              </h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-orange-500 to-orange-600">
                      <th className="border border-orange-400 px-3 py-2 text-center text-xs font-bold text-white" style={{minWidth: '60px'}}>
                        Grupo
                      </th>
                      <th className="border border-orange-400 px-2 py-1.5 text-left text-xs font-bold text-white">
                        Domínio
                      </th>
                      <th className="border border-orange-400 px-2 py-1.5 text-left text-xs font-bold text-white">
                        Descrição
                      </th>
                      <th className="border border-orange-400 px-2 py-1.5 text-center text-xs font-bold text-white">
                        Tipo
                      </th>
                      <th className="border border-orange-400 px-2 py-1.5 text-center text-xs font-bold text-white">
                        x̄ - s
                      </th>
                      <th className="border border-orange-400 px-2 py-1.5 text-center text-xs font-bold text-white">
                        Média Geral
                      </th>
                      <th className="border border-orange-400 px-2 py-1.5 text-center text-xs font-bold text-white">
                        x̄ + s
                      </th>
                      <th className="border border-orange-400 px-2 py-1.5 text-center text-xs font-bold text-white">
                        Categoria de Risco
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {laudoPadronizado.etapa2.map((score, index) => (
                      <tr 
                        key={score.grupo} 
                        className={index % 2 === 0 ? 'bg-orange-50' : 'bg-white'}
                      >
                        <td className="border border-gray-300 px-3 py-2 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 text-sm font-bold">
                            {score.grupo}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <div className="text-xs font-medium text-gray-800">
                            {score.dominio}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <div className="text-xs text-gray-600">
                            {score.descricao}
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            score.tipo === 'positiva' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {score.tipo === 'positiva' ? 'Positiva' : 'Negativa'}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <span className="text-xs text-gray-700">
                            {score.mediaMenosDP.toFixed(1)}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <span className="text-xs font-bold text-gray-900">
                            {score.media.toFixed(1)}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <span className="text-xs text-gray-700">
                            {score.mediaMaisDP.toFixed(1)}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded ${
                            score.classificacaoSemaforo === 'verde'
                              ? 'bg-green-100 text-green-800'
                              : score.classificacaoSemaforo === 'amarelo'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {score.categoriaRisco === 'baixo' ? 'Excelente' :
                             score.categoriaRisco === 'medio' ? 'Monitorar' : 'Atenção Necessária'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-2 bg-gray-50 rounded p-2 border-l-4 border-orange-400">
                <p className="text-xs text-gray-700">
                  <strong>x̄</strong> = média, <strong>s</strong> = desvio-padrão
                </p>
              </div>

              <div className="mt-4 bg-orange-50 rounded-lg p-4 border-l-4 border-orange-400">
                <p className="text-sm text-gray-800 leading-relaxed text-justify">
                  A amostragem acima descrita foi submetida à avaliação psicossocial para verificação de seu estado de saúde mental, como condição necessária à realização do trabalho. Durante o período da avaliação, foi possível identificar os pontos acima descritos.
                </p>
              </div>
            </div>
          )}

          {/* Seção Etapa 3 - Interpretação e Recomendações */}
          {laudoPadronizado.etapa3 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-orange-400">
                3. INTERPRETAÇÃO E RECOMENDAÇÕES
              </h2>

              {/* Texto Principal */}
              <div className="mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border-l-4 border-blue-500">
                  <p className="text-gray-800 leading-relaxed mb-4">{laudoPadronizado.etapa3.textoPrincipal}</p>
                  <p className="text-gray-700 leading-relaxed">{laudoPadronizado.etapa3.conclusao}</p>
                </div>
              </div>

              {/* Resumo dos grupos por categoria */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Excelente - Verde */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border-2 border-green-300 shadow-md">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-2">✅</span>
                    <h4 className="font-bold text-green-800 text-base">Excelente</h4>
                  </div>
                  <p className="text-xs text-green-700 font-medium mb-2">(Baixo Risco)</p>
                  {laudoPadronizado.etapa3.gruposExcelente.length > 0 ? (
                    <ul className="space-y-1">
                      {laudoPadronizado.etapa3.gruposExcelente.map((g, idx) => (
                        <li key={idx} className="text-sm text-green-800">
                          • {g.grupo} - {g.dominio}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-green-700 italic">Nenhum grupo identificado</p>
                  )}
                </div>

                {/* Monitorar - Amarelo */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-5 border-2 border-yellow-300 shadow-md">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-2">⚠️</span>
                    <h4 className="font-bold text-yellow-800 text-base">Monitorar</h4>
                  </div>
                  <p className="text-xs text-yellow-700 font-medium mb-2">(Risco Médio)</p>
                  {laudoPadronizado.etapa3.gruposMonitoramento.length > 0 ? (
                    <ul className="space-y-1">
                      {laudoPadronizado.etapa3.gruposMonitoramento.map((g, idx) => (
                        <li key={idx} className="text-sm text-yellow-800">
                          • {g.grupo} - {g.dominio}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-yellow-700 italic">Nenhum grupo identificado</p>
                  )}
                </div>

                {/* Atenção Necessária - Laranja/Vermelho */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border-2 border-orange-400 shadow-md">
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-2">🚨</span>
                    <h4 className="font-bold text-orange-800 text-base">Atenção Necessária</h4>
                  </div>
                  <p className="text-xs text-orange-700 font-medium mb-2">(Risco Médio)</p>
                  {laudoPadronizado.etapa3.gruposAtencao.length > 0 ? (
                    <ul className="space-y-1">
                      {laudoPadronizado.etapa3.gruposAtencao.map((g, idx) => (
                        <li key={idx} className="text-sm text-orange-800">
                          • {g.grupo} - {g.dominio}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-orange-700 italic">Nenhum grupo identificado</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Seção Etapa 4 - Observações e Conclusão */}
          {laudoPadronizado.etapa4 && (
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-orange-400">
                4. OBSERVAÇÕES E CONCLUSÃO
              </h2>

              {/* Observações do Laudo (opcional) */}
              {laudoPadronizado.etapa4.observacoesLaudo && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Observações do Laudo</h3>
                  <div className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-500">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{laudoPadronizado.etapa4.observacoesLaudo}</p>
                  </div>
                </div>
              )}

              {/* Conclusão */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Conclusão</h3>
                <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
                  <div className="text-gray-800 whitespace-pre-wrap leading-relaxed font-medium text-base">
                    {laudoPadronizado.etapa4.textoConclusao}
                  </div>

                  {/* Data e Assinatura */}
                  <div className="mt-10 pt-8 border-t-2 border-gray-400">
                    <div className="text-center space-y-4">
                      <p className="text-gray-700 font-medium text-base">{laudoPadronizado.etapa4.dataEmissao}</p>

                      <div className="mt-12 space-y-2">
                        <div className="border-b-2 border-gray-500 w-80 mx-auto"></div>
                        <p className="text-gray-900 font-bold text-base">{laudoPadronizado.etapa4.assinatura.nome}</p>
                        <p className="text-gray-700 text-sm font-medium">{laudoPadronizado.etapa4.assinatura.titulo} – {laudoPadronizado.etapa4.assinatura.registro}</p>
                        <p className="text-gray-700 text-sm">{laudoPadronizado.etapa4.assinatura.empresa}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Divisor antes da seção de Observações do Emissor */}
          <div className="border-t-4 border-gray-300 my-10"></div>

          {/* Seção Observações do Emissor */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Observações do Emissor</h2>
              <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full ${
                laudoPadronizado.status === 'enviado'
                  ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                  : laudoPadronizado.status === 'emitido'
                  ? 'bg-green-100 text-green-800 border-2 border-green-300'
                  : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
              }`}>
                Status: {laudoPadronizado.status === 'enviado' ? 'Enviado' : 
                         laudoPadronizado.status === 'emitido' ? 'Emitido' : 'Rascunho'}
              </span>
            </div>

            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              disabled={laudoPadronizado.status !== 'rascunho'}
              placeholder="Digite suas observações profissionais sobre o laudo..."
              className="w-full h-48 p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
              rows={8}
            />
          </div>

          <div className="flex justify-between items-center pt-6 border-t-2 border-gray-200">
            <div className="text-sm text-gray-600">
              <p>📅 Criado em {new Date(laudoPadronizado.criadoEm).toLocaleDateString('pt-BR')} às {new Date(laudoPadronizado.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              {laudoPadronizado.emitidoEm && <p>✅ Emitido em {new Date(laudoPadronizado.emitidoEm).toLocaleDateString('pt-BR')} às {new Date(laudoPadronizado.emitidoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>}
              {laudoPadronizado.enviadoEm && <p>📤 Enviado em {new Date(laudoPadronizado.enviadoEm).toLocaleDateString('pt-BR')} às {new Date(laudoPadronizado.enviadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>}
            </div>

            <div className="flex gap-3">
              {laudoPadronizado.status === 'rascunho' && (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
                  >
                    {saving ? 'Salvando...' : '💾 Salvar Rascunho'}
                  </button>
                  <button
                    onClick={handleEmitir}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-md"
                  >
                    ✓ Emitir Laudo
                  </button>
                </>
              )}

              {laudoPadronizado.status === 'emitido' && (
                <>
                  <button
                    onClick={() => window.open(`/api/emissor/laudos/${loteId}/pdf`, '_blank')}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-md"
                  >
                    📄 Gerar PDF
                  </button>
                  <button
                    onClick={handleEnviar}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md"
                  >
                    📤 Enviar para Clínica
                  </button>
                </>
              )}

              {laudoPadronizado.status === 'enviado' && (
                <span className="text-green-600 font-bold text-base flex items-center">
                  <span className="mr-2">✅</span> Laudo enviado com sucesso
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}