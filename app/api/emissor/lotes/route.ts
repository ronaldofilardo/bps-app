import { requireRole } from "@/lib/session"
import { query } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
  const user = await requireRole('emissor')
  if (!user) {
    return NextResponse.json({ error: "Acesso negado", success: false }, { status: 403 })
  }

  try {
    // Buscar TODOS os lotes que têm laudos associados ao emissor atual
    // Inclui todos os status de laudo: rascunho, emitido, enviado
    const lotesQuery = await query(`
      SELECT
        la.id,
        la.codigo,
        la.titulo,
        la.tipo,
        la.liberado_em,
        ec.nome as empresa_nome,
        c.nome as clinica_nome,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
        l.observacoes,
        l.status as status_laudo,
        l.id as laudo_id,
        l.emitido_em,
        l.enviado_em
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      JOIN clinicas c ON ec.clinica_id = c.id
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      WHERE l.emissor_cpf = $1
      GROUP BY la.id, la.codigo, la.titulo, la.tipo, la.liberado_em, ec.nome, c.nome, l.observacoes, l.status, l.id, l.emitido_em, l.enviado_em
      ORDER BY
        CASE
          WHEN l.status = 'rascunho' THEN 1
          WHEN l.status = 'emitido' THEN 2
          WHEN l.status = 'enviado' THEN 3
        END,
        la.liberado_em DESC
    `, [user.cpf])

    const lotes = lotesQuery.rows.map(lote => ({
      id: lote.id,
      codigo: lote.codigo,
      titulo: lote.titulo,
      tipo: lote.tipo,
      empresa_nome: lote.empresa_nome,
      clinica_nome: lote.clinica_nome,
      liberado_em: lote.liberado_em,
      laudo: lote.laudo_id ? {
        id: lote.laudo_id,
        observacoes: lote.observacoes,
        status: lote.status_laudo,
        emitido_em: lote.emitido_em,
        enviado_em: lote.enviado_em
      } : null
    }))

    return NextResponse.json({
      success: true,
      lotes,
      total: lotes.length
    })

  } catch (error) {
    console.error('Erro ao buscar lotes para emissão:', error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      success: false,
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}