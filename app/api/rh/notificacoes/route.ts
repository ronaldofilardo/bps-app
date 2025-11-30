import { getSession } from "@/lib/session"
import { query } from "@/lib/db"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
  const session = await getSession()
  if (!session || (session.perfil !== 'rh' && session.perfil !== 'admin' && session.perfil !== 'master')) {
    return NextResponse.json({ error: "Acesso negado", success: false }, { status: 403 })
  }
  const user = session

  try {
    // Buscar notificações para clínicas: avaliações concluídas e laudos enviados
    const notificacoesQuery = await query(`
      SELECT
        'avaliacao_concluida' as tipo,
        a.id as id_referencia,
        a.id as avaliacao_id,
        la.id as lote_id,
        la.codigo,
        la.titulo,
        ec.nome as empresa_nome,
        a.envio as data_evento,
        COUNT(*) OVER () as total_count
      FROM avaliacoes a
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      WHERE la.clinica_id = (SELECT clinica_id FROM funcionarios WHERE cpf = $1)
        AND a.status = 'concluida'
        AND a.envio >= NOW() - INTERVAL '7 days'

      UNION ALL

      SELECT
        'laudo_enviado' as tipo,
        l.id as id_referencia,
        NULL as avaliacao_id,
        l.lote_id,
        la.codigo,
        la.titulo,
        ec.nome as empresa_nome,
        l.enviado_em as data_evento,
        COUNT(*) OVER () as total_count
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      WHERE la.clinica_id = (SELECT clinica_id FROM funcionarios WHERE cpf = $1)
        AND l.status = 'enviado'
        AND l.enviado_em >= NOW() - INTERVAL '7 days'

      ORDER BY data_evento DESC
      LIMIT 50
    `, [user.cpf])

    const notificacoes = notificacoesQuery.rows.map(notif => ({
      id: `${notif.tipo}_${notif.id_referencia}`,
      tipo: notif.tipo,
      lote_id: notif.lote_id,
      codigo: notif.codigo,
      titulo: notif.titulo,
      empresa_nome: notif.empresa_nome,
      data_evento: notif.data_evento,
      mensagem: notif.tipo === 'avaliacao_concluida'
        ? `Nova avaliação concluída no lote "${notif.titulo}"`
        : `Laudo enviado para o lote "${notif.titulo}"`
    }))

    // Contar total de notificações não lidas (todas são consideradas não lidas por enquanto)
    const totalNaoLidas = notificacoes.length

    return NextResponse.json({
      success: true,
      notificacoes,
      totalNaoLidas
    })

  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      success: false,
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}