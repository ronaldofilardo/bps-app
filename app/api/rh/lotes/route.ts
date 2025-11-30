import { requireAuth } from "@/lib/session"
import { query } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
  const user = await requireAuth()
  if (!user || user.perfil !== "rh") {
    return NextResponse.json({ error: "Acesso negado", success: false }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get('empresa_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!empresaId) {
      return NextResponse.json({
        error: "ID da empresa é obrigatório",
        success: false
      }, { status: 400 })
    }

    // Verificar se o usuário tem acesso à empresa
    const empresaCheck = await query(`
      SELECT ec.id, ec.clinica_id
      FROM empresas_clientes ec
      WHERE ec.id = $1 AND ec.ativa = true
    `, [empresaId])

    if (empresaCheck.rowCount === 0) {
      return NextResponse.json({
        error: "Empresa não encontrada",
        success: false
      }, { status: 404 })
    }

    const empresa = empresaCheck.rows[0]

    // Verificar se o usuário pertence à mesma clínica
    const userClinicaCheck = await query(`
      SELECT clinica_id FROM funcionarios WHERE cpf = $1
    `, [user.cpf])

    if (userClinicaCheck.rowCount === 0 || userClinicaCheck.rows[0].clinica_id !== empresa.clinica_id) {
      return NextResponse.json({
        error: "Você não tem permissão para acessar lotes desta empresa",
        success: false
      }, { status: 403 })
    }

    // Buscar lotes da empresa
    const lotesQuery = await query(`
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
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas
      FROM lotes_avaliacao la
      LEFT JOIN funcionarios f ON la.liberado_por = f.cpf
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      WHERE la.empresa_id = $1 AND la.status != 'cancelado'
      GROUP BY la.id, la.codigo, la.titulo, la.descricao, la.tipo, la.status, la.liberado_em, la.liberado_por, f.nome
      ORDER BY la.liberado_em DESC
      LIMIT $2
    `, [empresaId, limit])

    const lotes = lotesQuery.rows.map(lote => ({
      id: lote.id,
      codigo: lote.codigo,
      titulo: lote.titulo,
      tipo: lote.tipo,
      status: lote.status,
      liberado_em: lote.liberado_em,
      liberado_por: lote.liberado_por,
      liberado_por_nome: lote.liberado_por_nome,
      total_avaliacoes: parseInt(lote.total_avaliacoes),
      avaliacoes_concluidas: parseInt(lote.avaliacoes_concluidas),
      avaliacoes_inativadas: parseInt(lote.avaliacoes_inativadas)
    }))

    return NextResponse.json({
      success: true,
      lotes,
      total: lotes.length
    })

  } catch (error) {
    console.error('Erro ao buscar lotes:', error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      success: false,
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}