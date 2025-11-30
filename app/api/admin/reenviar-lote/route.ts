import { requireRole } from "@/lib/session"
import { query } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic';

export const POST = async (req: Request) => {
  const user = await requireRole('admin')
  if (!user) {
    return NextResponse.json({ error: "Acesso negado", success: false }, { status: 403 })
  }

  try {
    const { codigoLote } = await req.json()

    if (!codigoLote) {
      return NextResponse.json({
        error: "Código do lote é obrigatório",
        success: false
      }, { status: 400 })
    }

    // Primeiro, verificar se o lote existe e seu status atual
    const loteCheck = await query(`
      SELECT
        la.id,
        la.codigo,
        la.status,
        la.titulo,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
        COUNT(CASE WHEN f.ativo = false THEN 1 END) as avaliacoes_inativas
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      LEFT JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE la.codigo = $1
      GROUP BY la.id, la.codigo, la.status, la.titulo
    `, [codigoLote])

    if (loteCheck.rows.length === 0) {
      return NextResponse.json({
        error: `Lote ${codigoLote} não encontrado`,
        success: false
      }, { status: 404 })
    }

    const lote = loteCheck.rows[0]

    // Verificar se o lote já está pronto para finalização
    const podeFinalizar = lote.total_avaliacoes > 0 &&
                         lote.avaliacoes_concluidas === (lote.total_avaliacoes - lote.avaliacoes_inativas)

    if (!podeFinalizar) {
      return NextResponse.json({
        error: `Lote ${codigoLote} não pode ser finalizado. Avaliações concluídas: ${lote.avaliacoes_concluidas}/${lote.total_avaliacoes - lote.avaliacoes_inativas}`,
        success: false,
        dados: lote
      }, { status: 400 })
    }

    // Marcar o lote como finalizado
    await query(`
      UPDATE lotes_avaliacao
      SET status = 'finalizado', finalizado_em = NOW(), atualizado_em = NOW()
      WHERE codigo = $1
    `, [codigoLote])

    return NextResponse.json({
      success: true,
      message: `Lote ${codigoLote} marcado como finalizado e pronto para emissão de laudo!`,
      lote: {
        id: lote.id,
        codigo: lote.codigo,
        titulo: lote.titulo,
        status_anterior: lote.status,
        status_novo: 'finalizado',
        avaliacoes_concluidas: lote.avaliacoes_concluidas,
        total_avaliacoes: lote.total_avaliacoes - lote.avaliacoes_inativas
      }
    })

  } catch (error) {
    console.error('Erro ao reenviar lote:', error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      success: false,
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}