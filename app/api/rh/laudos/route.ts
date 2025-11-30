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
    // Buscar laudos enviados para a clínica do usuário
    const laudosQuery = await query(`
      SELECT
        l.id as laudo_id,
        l.lote_id,
        l.status,
        l.enviado_em,
        la.codigo,
        la.titulo,
        ec.nome as empresa_nome,
        c.nome as clinica_nome,
        f.nome as emissor_nome
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      JOIN clinicas c ON ec.clinica_id = c.id
      JOIN funcionarios f ON l.emissor_cpf = f.cpf
      WHERE ec.clinica_id = (SELECT clinica_id FROM funcionarios WHERE cpf = $1)
        AND l.status = 'enviado'
      ORDER BY l.enviado_em DESC
    `, [user.cpf])

    const laudos = laudosQuery.rows.map(laudo => ({
      id: laudo.laudo_id,
      lote_id: laudo.lote_id,
      codigo: laudo.codigo,
      titulo: laudo.titulo,
      empresa_nome: laudo.empresa_nome,
      clinica_nome: laudo.clinica_nome,
      emissor_nome: laudo.emissor_nome,
      enviado_em: laudo.enviado_em,
      hash: null // Hash será implementado quando a coluna existir
    }))

    return NextResponse.json({
      success: true,
      laudos
    })

  } catch (error) {
    console.error('Erro ao buscar laudos:', error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      success: false,
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}