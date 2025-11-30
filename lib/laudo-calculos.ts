// Funções para cálculos dos laudos padronizados
import { ScoreGrupo, CategoriaRisco, ClassificacaoSemaforo, InterpretacaoRecomendacoes, ObservacoesConclusao, DadosGeraisEmpresa } from './laudo-tipos'
import { query } from './db'

// Definição dos grupos COPSOQ conforme especificado
export const gruposCOPSOQ = [
  {
    grupo: 1,
    dominio: 'Demandas no Trabalho',
    descricao: 'Avaliação das exigências quantitativas e ritmo de trabalho',
    tipo: 'negativa' as const
  },
  {
    grupo: 2,
    dominio: 'Organização e Conteúdo do Trabalho',
    descricao: 'Influência, desenvolvimento de habilidades e significado do trabalho',
    tipo: 'positiva' as const
  },
  {
    grupo: 3,
    dominio: 'Relações Sociais e Liderança',
    descricao: 'Apoio social, feedback e reconhecimento no trabalho',
    tipo: 'positiva' as const
  },
  {
    grupo: 4,
    dominio: 'Interface Trabalho-Indivíduo',
    descricao: 'Insegurança no trabalho e conflito trabalho-família',
    tipo: 'negativa' as const
  },
  {
    grupo: 5,
    dominio: 'Valores Organizacionais',
    descricao: 'Confiança, justiça e respeito mútuo na organização',
    tipo: 'positiva' as const
  },
  {
    grupo: 6,
    dominio: 'Traços de Personalidade',
    descricao: 'Autoeficácia e autoconfiança',
    tipo: 'positiva' as const
  },
  {
    grupo: 7,
    dominio: 'Saúde e Bem-Estar',
    descricao: 'Avaliação de estresse, burnout e sintomas somáticos',
    tipo: 'negativa' as const
  },
  {
    grupo: 8,
    dominio: 'Comportamentos Ofensivos',
    descricao: 'Exposição a assédio e violência no trabalho',
    tipo: 'negativa' as const
  },
  {
    grupo: 9,
    dominio: 'Comportamento de Jogo',
    descricao: 'Comportamentos relacionados a jogos de azar',
    tipo: 'negativa' as const
  },
  {
    grupo: 10,
    dominio: 'Endividamento Financeiro',
    descricao: 'Nível de endividamento e estresse financeiro',
    tipo: 'negativa' as const
  }
]

// Função para gerar dados gerais da empresa (Etapa 1)
export async function gerarDadosGeraisEmpresa(loteId: number): Promise<DadosGeraisEmpresa> {
  // Buscar dados da empresa e lote
  const loteResult = await query(`
    SELECT
      la.id,
      la.liberado_em,
      ec.nome as empresa_nome,
      ec.cnpj,
      ec.endereco,
      ec.cidade,
      ec.estado,
      ec.cep
    FROM lotes_avaliacao la
    JOIN empresas_clientes ec ON la.empresa_id = ec.id
    WHERE la.id = $1
  `, [loteId])

  if (loteResult.rows.length === 0) {
    throw new Error('Lote não encontrado')
  }

  const lote = loteResult.rows[0]

  // Buscar estatísticas das avaliações
  const statsResult = await query(`
    SELECT
      COUNT(a.id) as total_avaliacoes,
      COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
      MIN(a.inicio) as primeira_avaliacao,
      MAX(a.envio) as ultima_conclusao,
      COUNT(CASE WHEN f.nivel_cargo = 'operacional' THEN 1 END) as operacional,
      COUNT(CASE WHEN f.nivel_cargo = 'gestao' THEN 1 END) as gestao
    FROM avaliacoes a
    JOIN funcionarios f ON a.funcionario_cpf = f.cpf
    WHERE a.lote_id = $1
  `, [loteId])

  const stats = statsResult.rows[0]

  // Calcular percentual de conclusão
  const percentualConclusao = stats.total_avaliacoes > 0
    ? Math.round((stats.avaliacoes_concluidas / stats.total_avaliacoes) * 100)
    : 0

  // Formatar endereço completo
  const enderecoCompleto = [
    lote.endereco,
    lote.cidade,
    lote.estado,
    lote.cep
  ].filter(Boolean).join(' - ')

  return {
    empresaAvaliada: lote.empresa_nome,
    cnpj: lote.cnpj,
    endereco: enderecoCompleto,
    periodoAvaliacoes: {
      dataLiberacao: new Date(lote.liberado_em).toLocaleDateString('pt-BR'),
      dataUltimaConclusao: stats.ultima_conclusao
        ? new Date(stats.ultima_conclusao).toLocaleDateString('pt-BR')
        : new Date(lote.liberado_em).toLocaleDateString('pt-BR')
    },
    totalFuncionariosAvaliados: parseInt(stats.avaliacoes_concluidas),
    percentualConclusao,
    amostra: {
      operacional: parseInt(stats.operacional),
      gestao: parseInt(stats.gestao)
    }
  }
}

// Função para calcular percentil de um array
function calcularPercentil(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index % 1

  if (upper >= sorted.length) return sorted[sorted.length - 1]
  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

// Função para calcular média
function calcularMedia(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((sum, val) => sum + val, 0) / arr.length
}

// Função para calcular desvio padrão
function calcularDesvioPadrao(arr: number[], media: number): number {
  if (arr.length <= 1) return 0
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) / (arr.length - 1)
  return Math.sqrt(variance)
}

// Função para determinar categoria de risco baseada nos tercis
function determinarCategoriaRisco(media: number, tipo: 'positiva' | 'negativa', percentil33: number, percentil66: number): CategoriaRisco {
  if (tipo === 'positiva') {
    // Para escalas positivas: quanto maior, melhor
    if (media > percentil66) return 'baixo'
    if (media >= percentil33) return 'medio'
    return 'alto'
  } else {
    // Para escalas negativas: quanto menor, melhor
    if (media < percentil33) return 'baixo'
    if (media <= percentil66) return 'medio'
    return 'alto'
  }
}

// Função para determinar classificação semáforo e rótulo específico
function determinarClassificacaoSemaforo(categoriaRisco: CategoriaRisco): ClassificacaoSemaforo {
  switch (categoriaRisco) {
    case 'baixo': return 'verde'
    case 'medio': return 'amarelo'
    case 'alto': return 'vermelho'
  }
}

// Função para determinar o rótulo textual da categoria de risco
// Usa a média geral (x̄ + s) comparada com tercis fixos da escala 0-100
function determinarRotuloCategoria(mediaGeral: number, tipo: 'positiva' | 'negativa'): string {
  const tercil33 = 33.3333
  const tercil66 = 66.6666
  
  if (tipo === 'positiva') {
    // Para escalas positivas: quanto maior, melhor
    // > 66.66: Excelente (verde)
    // 33.33-66.66: Monitorar (amarelo)
    // < 33.33: Atenção Necessária (vermelho)
    if (mediaGeral > tercil66) return 'Excelente'
    if (mediaGeral >= tercil33) return 'Monitorar'
    return 'Atenção Necessária'
  } else {
    // Para escalas negativas: quanto menor, melhor
    // < 33.33: Excelente (verde)
    // 33.33-66.66: Monitorar (amarelo)
    // > 66.66: Atenção Necessária (vermelho)
    if (mediaGeral < tercil33) return 'Excelente'
    if (mediaGeral <= tercil66) return 'Monitorar'
    return 'Atenção Necessária'
  }
}

// Função principal para calcular scores por grupo
export async function calcularScoresPorGrupo(loteId: number): Promise<ScoreGrupo[]> {
  // Buscar todas as respostas agrupadas por grupo
  const respostasResult = await query(`
    SELECT
      r.grupo,
      r.valor
    FROM respostas r
    JOIN avaliacoes a ON r.avaliacao_id = a.id
    WHERE a.lote_id = $1 AND a.status = 'concluida'
    ORDER BY r.grupo, r.valor
  `, [loteId])

  const respostasPorGrupo: { [key: number]: number[] } = {}
  respostasResult.rows.forEach((row: any) => {
    if (!respostasPorGrupo[row.grupo]) {
      respostasPorGrupo[row.grupo] = []
    }
    respostasPorGrupo[row.grupo].push(row.valor)
  })

  // Calcular tercis globais para todos os grupos
  const todasRespostas = respostasResult.rows.map((row: any) => row.valor)
  const percentil33 = calcularPercentil(todasRespostas, 33)
  const percentil66 = calcularPercentil(todasRespostas, 66)

  const scores: ScoreGrupo[] = []

  for (const grupoDef of gruposCOPSOQ) {
    const valores = respostasPorGrupo[grupoDef.grupo] || []

    if (valores.length === 0) {
      // Valores padrão para grupos sem respostas
      scores.push({
        grupo: grupoDef.grupo,
        dominio: grupoDef.dominio,
        descricao: grupoDef.descricao,
        tipo: grupoDef.tipo,
        media: 0,
        desvioPadrao: 0,
        mediaMenosDP: 0,
        mediaMaisDP: 0,
        categoriaRisco: 'baixo',
        classificacaoSemaforo: 'verde',
        rotuloCategoria: 'Excelente',
        acaoRecomendada: 'Dados insuficientes para avaliação'
      })
      continue
    }

    const media = calcularMedia(valores)
    const desvioPadrao = calcularDesvioPadrao(valores, media)
    const mediaGeral = media + desvioPadrao // x̄ + s (usado na tabela como referência)
    const rotuloCategoria = determinarRotuloCategoria(mediaGeral, grupoDef.tipo)
    
    // Determinar categoria de risco e semáforo baseado no rótulo
    let categoriaRisco: CategoriaRisco
    let classificacaoSemaforo: ClassificacaoSemaforo
    
    if (rotuloCategoria === 'Excelente') {
      categoriaRisco = 'baixo'
      classificacaoSemaforo = 'verde'
    } else if (rotuloCategoria === 'Monitorar') {
      categoriaRisco = 'medio'
      classificacaoSemaforo = 'amarelo'
    } else if (rotuloCategoria === 'Atenção Necessária') {
      categoriaRisco = 'alto'
      classificacaoSemaforo = 'vermelho'
    } else { // Crítico
      categoriaRisco = 'alto'
      classificacaoSemaforo = 'vermelho'
    }
    
    const acaoRecomendada = determinarAcaoRecomendada(classificacaoSemaforo)

    scores.push({
      grupo: grupoDef.grupo,
      dominio: grupoDef.dominio,
      descricao: grupoDef.descricao,
      tipo: grupoDef.tipo,
      media: Math.round(media * 10) / 10, // Arredondar para 1 casa decimal
      desvioPadrao: Math.round(desvioPadrao * 10) / 10,
      mediaMenosDP: Math.round((media - desvioPadrao) * 10) / 10,
      mediaMaisDP: Math.round((media + desvioPadrao) * 10) / 10,
      categoriaRisco,
      classificacaoSemaforo,
      rotuloCategoria,
      acaoRecomendada
    })
  }

  return scores
}

// Função para gerar interpretação e recomendações
export function gerarInterpretacaoRecomendacoes(empresaNome: string, scores: ScoreGrupo[]): InterpretacaoRecomendacoes {
  // Separar grupos por rótulo de categoria
  const gruposExcelente = scores.filter(s => s.rotuloCategoria === 'Excelente')
  const gruposMonitorar = scores.filter(s => s.rotuloCategoria === 'Monitorar')
  const gruposAtencao = scores.filter(s => s.rotuloCategoria === 'Atenção Necessária')
  const gruposAltoRisco = scores.filter(s => s.rotuloCategoria === 'Crítico')

  // Gerar texto principal
  let textoPrincipal = `${empresaNome} apresenta os seguintes resultados na avaliação COPSOQ:\n\n`

  // Grupos excelentes (Baixo Risco)
  if (gruposExcelente.length > 0) {
    textoPrincipal += `Excelente (Baixo Risco): ${gruposExcelente.map(g => g.dominio).join(', ')}\n`
  }

  // Grupos monitorar
  if (gruposMonitorar.length > 0) {
    textoPrincipal += `Monitorar: ${gruposMonitorar.map(g => g.dominio).join(', ')}\n`
  }

  // Grupos atenção necessária (Risco Médio)
  if (gruposAtencao.length > 0) {
    textoPrincipal += `Atenção Necessária (Risco Médio): ${gruposAtencao.map(g => g.dominio).join(', ')}\n`
  }

  // Grupos alto risco/crítico (Alto Risco)
  if (gruposAltoRisco.length > 0) {
    textoPrincipal += `Crítico (Alto Risco): ${gruposAltoRisco.map(g => g.dominio).join(', ')}\n`
  }

  // Conclusão
  const totalGrupos = scores.length
  const percentualExcelente = totalGrupos > 0 ? Math.round((gruposExcelente.length / totalGrupos) * 100) : 0
  const percentualMonitorar = totalGrupos > 0 ? Math.round((gruposMonitorar.length / totalGrupos) * 100) : 0
  const percentualAtencao = totalGrupos > 0 ? Math.round((gruposAtencao.length / totalGrupos) * 100) : 0
  const percentualAltoRisco = totalGrupos > 0 ? Math.round((gruposAltoRisco.length / totalGrupos) * 100) : 0

  let conclusao = `Através da avaliação COPSOQ foi possível identificar que ${percentualExcelente}% dos domínios avaliados estão em excelente condição, ${percentualMonitorar}% necessitam de monitoramento, ${percentualAtencao}% necessitam de atenção e ${percentualAltoRisco}% estão em alto risco. `

  if (gruposAltoRisco.length > 0) {
    conclusao += `Os domínios em alto risco requerem ação imediata conforme preconizado pela NR-1.`
  } else if (gruposAtencao.length > 0) {
    conclusao += `Recomenda-se implementar medidas preventivas nos domínios que necessitam de atenção.`
  } else if (gruposMonitorar.length > 0) {
    conclusao += `Recomenda-se monitoramento contínuo dos domínios identificados.`
  } else {
    conclusao += `A organização apresenta excelentes condições de trabalho.`
  }

  return {
    textoPrincipal,
    conclusao,
    gruposAtencao: gruposAtencao,
    gruposMonitoramento: gruposMonitorar,
    gruposExcelente: gruposExcelente
  }
}

// Função para determinar ação recomendada
export function determinarAcaoRecomendada(classificacao: ClassificacaoSemaforo): string {
  switch (classificacao) {
    case 'verde':
      return 'Manter; monitorar anualmente'
    case 'amarelo':
      return 'Atenção; intervenções preventivas (treinamentos)'
    case 'vermelho':
      return 'Ação imediata; plano de mitigação (PGR/NR-1)'
  }
}

// Função para gerar observações e conclusão
export function gerarObservacoesConclusao(observacoesEmissor?: string): ObservacoesConclusao {
  const dataAtual = new Date()
  const dataFormatada = dataAtual.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  const textoConclusao = `Este laudo, por si só, não pode diagnosticar uma patologia, mas pode indicar a presença de sintomas, do ponto de vista coletivo.
Um diagnóstico clínico de cada avaliado somente pode ser feito pelo seu psicólogo, médico do trabalho, psiquiatra ou outro profissional de saúde qualificado.`

  return {
    observacoesLaudo: observacoesEmissor || undefined,
    textoConclusao,
    dataEmissao: `São Paulo, ${dataFormatada}`,
    assinatura: {
      nome: 'Dr. Marcelo Oliveira',
      titulo: 'Psicólogo',
      registro: 'CRP 06/123456',
      empresa: 'Responsável Técnico – BPS Brasil'
    }
  }
}

