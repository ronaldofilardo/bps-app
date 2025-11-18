// Cálculo de scores para COPSOQ III

export interface Resposta {
  item: string
  valor: number
}

export interface ResultadoGrupo {
  grupo: number
  dominio: string
  score: number
  categoria: 'baixo' | 'medio' | 'alto'
}

// Calcular score de um grupo
export function calcularScoreGrupo(
  respostas: Resposta[],
  tipo: 'positiva' | 'negativa' | 'mista'
): number {
  if (respostas.length === 0) return 0

  const soma = respostas.reduce((acc, r) => acc + r.valor, 0)
  const media = soma / respostas.length

  // Para escalas negativas, inverter o score
  // Quanto maior o valor, pior a situação
  return tipo === 'negativa' ? media : media
}

// Categorizar score (semáforo)
export function categorizarScore(
  score: number,
  tipo: 'positiva' | 'negativa' | 'mista'
): 'baixo' | 'medio' | 'alto' {
  if (tipo === 'negativa') {
    // Para negativas: alto = problema sério
    if (score >= 75) return 'alto'
    if (score >= 50) return 'medio'
    return 'baixo'
  } else {
    // Para positivas: alto = ótimo
    if (score >= 75) return 'alto'
    if (score >= 50) return 'medio'
    return 'baixo'
  }
}

// Calcular todos os resultados de uma avaliação
export function calcularResultados(
  respostasPorGrupo: Map<number, Resposta[]>,
  gruposTipo: Map<number, { dominio: string; tipo: 'positiva' | 'negativa' | 'mista' }>
): ResultadoGrupo[] {
  const resultados: ResultadoGrupo[] = []

  respostasPorGrupo.forEach((respostas, grupoId) => {
    const grupoInfo = gruposTipo.get(grupoId)
    if (!grupoInfo) return

    const score = calcularScoreGrupo(respostas, grupoInfo.tipo)
    const categoria = categorizarScore(score, grupoInfo.tipo)

    resultados.push({
      grupo: grupoId,
      dominio: grupoInfo.dominio,
      score,
      categoria,
    })
  })

  return resultados
}

// Obter cor do semáforo
export function getCorSemaforo(
  categoria: 'baixo' | 'medio' | 'alto',
  tipo: 'positiva' | 'negativa' | 'mista'
): string {
  if (tipo === 'negativa') {
    // Negativa: alto = vermelho (ruim)
    if (categoria === 'alto') return '#EF4444'
    if (categoria === 'medio') return '#F59E0B'
    return '#10B981'
  } else {
    // Positiva: alto = verde (bom)
    if (categoria === 'alto') return '#10B981'
    if (categoria === 'medio') return '#F59E0B'
    return '#EF4444'
  }
}

// Obter texto descritivo
export function getTextoCategoria(
  categoria: 'baixo' | 'medio' | 'alto',
  tipo: 'positiva' | 'negativa' | 'mista'
): string {
  if (tipo === 'negativa') {
    if (categoria === 'alto') return 'Atenção Necessária'
    if (categoria === 'medio') return 'Monitorar'
    return 'Adequado'
  } else {
    if (categoria === 'alto') return 'Excelente'
    if (categoria === 'medio') return 'Adequado'
    return 'Precisa Melhorar'
  }
}
