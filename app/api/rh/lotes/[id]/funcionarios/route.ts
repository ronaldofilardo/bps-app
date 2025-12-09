import { requireAuth } from "@/lib/session"
import { getFuncionariosPorLote, getLoteInfo, getLoteEstatisticas } from "@/lib/queries"
import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export const dynamic = 'force-dynamic';

export const GET = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  const user = await requireAuth()
  if (!user || user.perfil !== "rh") {
    return NextResponse.json({ error: "Acesso negado", success: false }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get('empresa_id')
    const loteId = params.id

    if (!empresaId || !loteId) {
      return NextResponse.json({
        error: "Parâmetros empresa_id e lote_id são obrigatórios",
        success: false
      }, { status: 400 })
    }

    // Obter clínica do usuário RH
    const userResult = await query(`
      SELECT clinica_id FROM funcionarios WHERE cpf = $1
    `, [user.cpf])

    if (userResult.rowCount === 0) {
      return NextResponse.json({
        error: "Usuário não encontrado",
        success: false
      }, { status: 404 })
    }

    const clinicaId = userResult.rows[0].clinica_id

    // Verificar se a empresa pertence à clínica do usuário
    const empresaCheck = await query(`
      SELECT ec.id, ec.clinica_id, ec.nome
      FROM empresas_clientes ec
      WHERE ec.id = $1 AND ec.clinica_id = $2 AND ec.ativa = true
    `, [empresaId, clinicaId])

    if (empresaCheck.rowCount === 0) {
      return NextResponse.json({
        error: "Empresa não encontrada ou você não tem permissão para acessá-la",
        success: false
      }, { status: 403 })
    }

    // Buscar informações do lote usando a função utilitária
    const loteInfo = await getLoteInfo(parseInt(loteId), parseInt(empresaId), clinicaId)

    if (!loteInfo) {
      return NextResponse.json({
        error: "Lote não encontrado ou não pertence a esta empresa",
        success: false
      }, { status: 404 })
    }

    // Buscar estatísticas do lote
    const estatisticas = await getLoteEstatisticas(parseInt(loteId))

    // Buscar funcionários do lote usando a função utilitária
    const funcionarios = await getFuncionariosPorLote(
      parseInt(loteId),
      parseInt(empresaId),
      clinicaId
    )

    // Calcular médias dos grupos para cada funcionário
    const funcionariosComGrupos = await Promise.all(
      funcionarios.map(async (func) => {
        let mediasGrupos: { [key: string]: number } = {}
        
        // Apenas calcular se avaliação está concluída
        if (func.status_avaliacao === 'concluida') {
          const respostasResult = await query(`
            SELECT grupo, AVG(valor) as media
            FROM respostas
            WHERE avaliacao_id = $1
            GROUP BY grupo
            ORDER BY grupo
          `, [func.avaliacao_id])

          respostasResult.rows.forEach((row: any) => {
            mediasGrupos[`g${row.grupo}`] = parseFloat(row.media)
          })
        }

        return {
          cpf: func.cpf,
          nome: func.nome,
          setor: func.setor,
          funcao: func.funcao,
          matricula: func.matricula,
          nivel_cargo: func.nivel_cargo,
          turno: func.turno,
          escala: func.escala,
          avaliacao: {
            id: func.avaliacao_id,
            status: func.status_avaliacao,
            data_inicio: func.data_inicio,
            data_conclusao: func.data_conclusao
          },
          grupos: mediasGrupos
        }
      })
    )

    return NextResponse.json({
      success: true,
      lote: loteInfo,
      estatisticas: {
        total_avaliacoes: parseInt(estatisticas.total_avaliacoes),
        avaliacoes_concluidas: parseInt(estatisticas.avaliacoes_concluidas),
        avaliacoes_inativadas: parseInt(estatisticas.avaliacoes_inativadas),
        avaliacoes_pendentes: parseInt(estatisticas.avaliacoes_pendentes)
      },
      funcionarios: funcionariosComGrupos,
      total: funcionariosComGrupos.length
    })

  } catch (error) {
    console.error('Erro ao buscar funcionários do lote:', error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      success: false
    }, { status: 500 })
  }
}
