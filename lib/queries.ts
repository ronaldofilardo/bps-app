import { query } from '@/lib/db'

/**
 * Interface para representar um funcionário com dados de avaliação
 */
export interface FuncionarioComAvaliacao {
  cpf: string
  nome: string
  setor: string
  funcao: string
  matricula: string | null
  nivel_cargo: 'operacional' | 'gestao' | null
  turno: string | null
  escala: string | null
  avaliacao_id: number
  status_avaliacao: string
  data_conclusao: string | null
  data_inicio: string
}

/**
 * Interface para informações do lote
 */
export interface LoteInfo {
  id: number
  codigo: string
  titulo: string
  descricao: string | null
  tipo: string
  status: string
  liberado_em: string
  liberado_por: string
  liberado_por_nome: string | null
  empresa_id: number
  empresa_nome: string
}

/**
 * Busca funcionários que participam de um lote específico
 * Inclui dados da avaliação (status, datas de início e conclusão)
 * 
 * @param loteId - ID do lote de avaliações
 * @param empresaId - ID da empresa (para validação)
 * @param clinicaId - ID da clínica (para validação de permissões)
 * @returns Array de funcionários com dados de avaliação
 */
export async function getFuncionariosPorLote(
  loteId: number,
  empresaId: number,
  clinicaId: number
): Promise<FuncionarioComAvaliacao[]> {
  const result = await query(`
    SELECT 
      f.cpf,
      f.nome,
      f.setor,
      f.funcao,
      f.matricula,
      f.nivel_cargo,
      f.turno,
      f.escala,
      a.id as avaliacao_id,
      a.status as status_avaliacao,
      a.envio as data_conclusao,
      a.inicio as data_inicio
    FROM funcionarios f
    JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
    WHERE a.lote_id = $1 
      AND f.empresa_id = $2 
      AND f.clinica_id = $3
    ORDER BY f.nome ASC
  `, [loteId, empresaId, clinicaId])

  return result.rows as FuncionarioComAvaliacao[]
}

/**
 * Busca informações detalhadas de um lote específico
 * 
 * @param loteId - ID do lote
 * @param empresaId - ID da empresa (para validação)
 * @param clinicaId - ID da clínica (para validação de permissões)
 * @returns Informações do lote ou null se não encontrado
 */
export async function getLoteInfo(
  loteId: number,
  empresaId: number,
  clinicaId: number
): Promise<LoteInfo | null> {
  const result = await query(`
    SELECT 
      la.id,
      la.codigo,
      la.titulo,
      la.descricao,
      la.tipo,
      la.status,
      la.liberado_em,
      la.liberado_por,
      f.nome as liberado_por_nome,
      la.empresa_id,
      ec.nome as empresa_nome
    FROM lotes_avaliacao la
    LEFT JOIN funcionarios f ON la.liberado_por = f.cpf
    JOIN empresas_clientes ec ON la.empresa_id = ec.id
    WHERE la.id = $1 
      AND la.empresa_id = $2
      AND ec.clinica_id = $3
      AND la.status != 'cancelado'
  `, [loteId, empresaId, clinicaId])

  if (result.rows.length === 0) {
    return null
  }

  return result.rows[0] as LoteInfo
}

/**
 * Busca estatísticas de um lote específico
 * 
 * @param loteId - ID do lote
 * @returns Estatísticas do lote (total, concluídas, inativadas)
 */
export async function getLoteEstatisticas(loteId: number) {
  const result = await query(`
    SELECT
      COUNT(a.id) as total_avaliacoes,
      COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
      COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas,
      COUNT(CASE WHEN a.status = 'iniciada' OR a.status = 'em_andamento' THEN 1 END) as avaliacoes_pendentes
    FROM avaliacoes a
    WHERE a.lote_id = $1
  `, [loteId])

  return result.rows[0]
}
