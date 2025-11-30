// Import necessário para queries
import { query } from './db'
import { DadosGeraisEmpresa, ScoreGrupo, CategoriaRisco, ClassificacaoSemaforo, ObservacoesConclusao, InterpretacaoRecomendacoes } from './laudo-tipos'
import { gruposCOPSOQ, determinarAcaoRecomendada } from './laudo-calculos'

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

// Função para calcular percentil
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

// Função para determinar categoria de risco
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

// Função para determinar classificação semáforo
function determinarClassificacaoSemaforo(categoriaRisco: CategoriaRisco): ClassificacaoSemaforo {
  switch (categoriaRisco) {
    case 'baixo': return 'verde'
    case 'medio': return 'amarelo'
    case 'alto': return 'vermelho'
  }
}

// Função para gerar dados gerais da empresa (Etapa 1)
export async function gerarDadosGeraisEmpresa(loteId: number): Promise<DadosGeraisEmpresa> {
  // Buscar informações do lote e empresa
  const loteResult = await query(`
    SELECT
      la.titulo,
      la.liberado_em,
      ec.nome as empresa_nome,
      ec.cnpj,
      ec.endereco,
      ec.cidade,
      ec.estado,
      ec.cep,
      c.nome as clinica_nome,
      COUNT(a.id) as total_avaliacoes,
      COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
      MIN(a.envio) as primeira_conclusao,
      MAX(a.envio) as ultima_conclusao
    FROM lotes_avaliacao la
    JOIN empresas_clientes ec ON la.empresa_id = ec.id
    JOIN clinicas c ON ec.clinica_id = c.id
    LEFT JOIN avaliacoes a ON la.id = a.lote_id
    WHERE la.id = $1
    GROUP BY la.id, la.titulo, la.liberado_em, ec.nome, ec.cnpj, ec.endereco, ec.cidade, ec.estado, ec.cep, c.nome
  `, [loteId])

  if (loteResult.rows.length === 0) {
    throw new Error('Lote não encontrado')
  }

  const lote = loteResult.rows[0]

  // Buscar contagem de funcionários por nível
  const funcionariosResult = await query(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN nivel_cargo = 'operacional' THEN 1 ELSE 0 END) as operacional,
      SUM(CASE WHEN nivel_cargo = 'gestao' THEN 1 ELSE 0 END) as gestao
    FROM funcionarios f
    JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
    WHERE a.lote_id = $1 AND a.status = 'concluida'
  `, [loteId])

  const funcs = funcionariosResult.rows[0] || { total: 0, operacional: 0, gestao: 0 }

  const percentualConclusao = lote.total_avaliacoes > 0
    ? Math.round((lote.avaliacoes_concluidas / lote.total_avaliacoes) * 100)
    : 0

  return {
    empresaAvaliada: lote.empresa_nome,
    cnpj: lote.cnpj,
    endereco: `${lote.endereco}, ${lote.cidade} - ${lote.estado}, CEP: ${lote.cep}`,
    periodoAvaliacoes: {
      dataLiberacao: new Date(lote.liberado_em).toLocaleDateString('pt-BR'),
      dataUltimaConclusao: lote.ultima_conclusao ? new Date(lote.ultima_conclusao).toLocaleDateString('pt-BR') : new Date(lote.liberado_em).toLocaleDateString('pt-BR')
    },
    totalFuncionariosAvaliados: parseInt(lote.avaliacoes_concluidas),
    percentualConclusao,
    amostra: {
      operacional: parseInt(funcs.operacional),
      gestao: parseInt(funcs.gestao)
    }
  }
}

// Função principal para calcular scores por grupo
export async function calcularScoresPorGrupo(loteId: number): Promise<ScoreGrupo[]> {
  // Buscar todas as respostas concluídas do lote agrupadas por grupo
  const respostasPorGrupo: { [key: number]: number[] } = {}

  // Query para buscar respostas por grupo
  const queryResult = await query(`
    SELECT
      r.grupo,
      r.valor
    FROM respostas r
    JOIN avaliacoes a ON r.avaliacao_id = a.id
    WHERE a.lote_id = $1 AND a.status = 'concluida'
    ORDER BY r.grupo, r.avaliacao_id
  `, [loteId])

  // Organizar respostas por grupo
  queryResult.rows.forEach((row: any) => {
    const grupo = row.grupo
    const valor = row.valor

    if (!respostasPorGrupo[grupo]) {
      respostasPorGrupo[grupo] = []
    }
    respostasPorGrupo[grupo].push(valor)
  })

  // Calcular estatísticas para cada grupo
  const scoresCalculados: ScoreGrupo[] = []

  for (const grupoInfo of gruposCOPSOQ) {
    const grupo = grupoInfo.grupo
    const valores = respostasPorGrupo[grupo] || []

    if (valores.length === 0) {
      // Se não há respostas para o grupo, usar valores padrão
      scoresCalculados.push({
        ...grupoInfo,
        media: 0,
        desvioPadrao: 0,
        mediaMenosDP: 0,
        mediaMaisDP: 0,
        categoriaRisco: 'baixo',
        classificacaoSemaforo: 'verde',
        acaoRecomendada: 'Dados insuficientes para análise'
      })
      continue
    }

    // Calcular média
    const media = calcularMedia(valores)

    // Calcular desvio padrão
    const desvioPadrao = calcularDesvioPadrao(valores, media)

    // Calcular média ± desvio padrão
    const mediaMenosDP = Math.max(0, media - desvioPadrao)
    const mediaMaisDP = Math.min(100, media + desvioPadrao)

    // Calcular tercis para classificação
    const percentil33 = calcularPercentil(valores, 33)
    const percentil66 = calcularPercentil(valores, 66)

    // Determinar categoria de risco
    const categoriaRisco = determinarCategoriaRisco(media, grupoInfo.tipo, percentil33, percentil66)

    // Determinar classificação semáforo
    const classificacaoSemaforo = determinarClassificacaoSemaforo(categoriaRisco)

    // Determinar ação recomendada
    const acaoRecomendada = determinarAcaoRecomendada(classificacaoSemaforo)

    scoresCalculados.push({
      ...grupoInfo,
      media: Number(media.toFixed(1)),
      desvioPadrao: Number(desvioPadrao.toFixed(1)),
      mediaMenosDP: Number(mediaMenosDP.toFixed(1)),
      mediaMaisDP: Number(mediaMaisDP.toFixed(1)),
      categoriaRisco,
      classificacaoSemaforo,
      acaoRecomendada
    })
  }

  return scoresCalculados
}

// Função para gerar observações e conclusão (Etapa 4)
export function gerarObservacoesConclusao(observacoesEmissor?: string): ObservacoesConclusao {
  const textoConclusao = `Este laudo, por si só, não pode diagnosticar uma patologia, mas pode indicar a presença de sintomas, do ponto de vista coletivo.
Um diagnóstico clínico de cada avaliado somente pode ser feito pelo seu psicólogo, médico do trabalho, psiquiatra ou outro profissional de saúde qualificado.

Declaro que os dados são estritamente agregados e anônimos, em conformidade com a LGPD e o Código de Ética Profissional do Psicólogo.`

  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

  return {
    observacoesLaudo: observacoesEmissor && observacoesEmissor.trim() ? observacoesEmissor.trim() : undefined,
    textoConclusao,
    dataEmissao: `São Paulo, ${dataEmissao}`,
    assinatura: {
      nome: 'Dr. Marcelo Oliveira',
      titulo: 'Psicólogo',
      registro: 'CRP 06/123456',
      empresa: 'Responsável Técnico – BPS Brasil'
    }
  }
}

// Função para gerar interpretação e recomendações (Etapa 3)
export function gerarInterpretacaoRecomendacoes(
  empresaNome: string,
  scores: ScoreGrupo[]
): InterpretacaoRecomendacoes {
  // Classificar grupos por categoria de risco
  const gruposBaixoRisco = scores.filter(s => s.classificacaoSemaforo === 'verde' && s.categoriaRisco === 'baixo')
  const gruposMedioRisco = scores.filter(s => s.classificacaoSemaforo === 'amarelo' || (s.classificacaoSemaforo === 'verde' && s.categoriaRisco === 'medio'))
  const gruposAltoRisco = scores.filter(s => s.classificacaoSemaforo === 'vermelho')

  // Gerar texto principal na ordem: baixo risco → médio risco → alto risco
  let textoPrincipal = `A ${empresaNome} apresenta `

  // 1. Primeiro: dimensões de baixo risco (Excelente)
  if (gruposBaixoRisco.length > 0) {
    const nomesBaixoRisco = gruposBaixoRisco.map(g => `${g.grupo} - ${g.dominio}`).join(', ')
    textoPrincipal += `os indicadores Excelente nos grupos ${nomesBaixoRisco} que são importantes fatores de proteção e devem ser valorizados e mantidos. `
  }

  // 2. Segundo: dimensões de risco médio (Atenção Necessária)
  if (gruposMedioRisco.length > 0) {
    const nomesMedioRisco = gruposMedioRisco.map(g => `${g.grupo} - ${g.dominio}`).join(', ')
    textoPrincipal += `${gruposMedioRisco.length} dimensão(ões) classificada(s) como Atenção Necessária (${nomesMedioRisco}) onde essa(s) área(s) requer(em) atenção por parte da instituição com intervenção imediata para prevenção de riscos psicossociais. `
  }

  // 3. Terceiro: dimensões de alto risco
  if (gruposAltoRisco.length > 0) {
    const nomesAltoRisco = gruposAltoRisco.map(g => `${g.grupo} - ${g.dominio}`).join(', ')
    textoPrincipal += `Além disso, apresenta ${gruposAltoRisco.length} dimensão(ões) de alto risco (${nomesAltoRisco}) que requerem ação corretiva urgente.`
  }

  // Conclusão padrão
  const conclusao = `A amostragem acima descrita foi submetida à avaliação psicossocial para verificação de seu estado de saúde mental, como condição necessária à realização do trabalho. Durante o período da avaliação, foi possível identificar os pontos acima descritos.`

  return {
    textoPrincipal,
    gruposAtencao: gruposMedioRisco, // manter compatibilidade com interface existente
    gruposMonitoramento: gruposMedioRisco,
    gruposExcelente: gruposBaixoRisco,
    gruposAltoRisco,
    conclusao
  }
}
