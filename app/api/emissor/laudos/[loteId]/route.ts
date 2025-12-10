import { requireRole } from "@/lib/session"
import { query } from "@/lib/db"
import { NextResponse } from "next/server"
import { DadosGeraisEmpresa, LaudoPadronizado } from "@/lib/laudo-tipos"
import { gerarDadosGeraisEmpresa, calcularScoresPorGrupo, gerarInterpretacaoRecomendacoes, gerarObservacoesConclusao } from "@/lib/laudo-calculos"

export const dynamic = 'force-dynamic';

// GET - Buscar laudo de um lote
export const GET = async (req: Request, { params }: { params: { loteId: string } }) => {
  const user = await requireRole('emissor')
  if (!user) {
    return NextResponse.json({ error: "Acesso negado", success: false }, { status: 403 })
  }

  try {
    const loteId = parseInt(params.loteId)
    if (isNaN(loteId)) {
      return NextResponse.json({ error: "ID do lote inválido", success: false }, { status: 400 })
    }

    // Verificar se o lote existe e está pronto
    const loteCheck = await query(`
      SELECT la.id, la.codigo, la.status, ec.nome as empresa_nome, c.nome as clinica_nome,
             COUNT(a.id) as total, COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas
      FROM lotes_avaliacao la
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      JOIN clinicas c ON ec.clinica_id = c.id
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      WHERE la.id = $1 AND la.status != 'cancelado'
      GROUP BY la.id, la.codigo, la.status, ec.nome, c.nome
    `, [loteId])

    if (loteCheck.rows.length === 0) {
      return NextResponse.json({ error: "Lote não encontrado", success: false }, { status: 404 })
    }

    const lote = loteCheck.rows[0]
    if (lote.total !== lote.concluidas) {
      return NextResponse.json({ error: "Lote ainda não está pronto para emissão de laudo", success: false }, { status: 400 })
    }

    // Gerar dados da Etapa 1
    const dadosGeraisEmpresa = await gerarDadosGeraisEmpresa(loteId)

    // Calcular scores da Etapa 2
    const scoresPorGrupo = await calcularScoresPorGrupo(loteId)

    // Buscar ou criar laudo
    let laudoQuery = await query(`
      SELECT id, observacoes, status, criado_em, emitido_em, enviado_em
      FROM laudos
      WHERE lote_id = $1 AND emissor_cpf = $2
    `, [loteId, user.cpf])

    let laudo = laudoQuery.rows[0]

    if (!laudo) {
      // Criar laudo em rascunho
      const novoLaudo = await query(`
        INSERT INTO laudos (lote_id, emissor_cpf, status)
        VALUES ($1, $2, 'rascunho')
        RETURNING id, observacoes, status, criado_em, emitido_em, enviado_em
      `, [loteId, user.cpf])
      laudo = novoLaudo.rows[0]
    }

    // Gerar interpretação e recomendações da Etapa 3
    const interpretacaoRecomendacoes = gerarInterpretacaoRecomendacoes(
      dadosGeraisEmpresa.empresaAvaliada,
      scoresPorGrupo
    )

    // Gerar observações e conclusão da Etapa 4
    const observacoesConclusao = gerarObservacoesConclusao(laudo.observacoes)

    // Estrutura completa do laudo padronizado
    const laudoPadronizado: LaudoPadronizado = {
      etapa1: dadosGeraisEmpresa,
      etapa2: scoresPorGrupo,
      etapa3: interpretacaoRecomendacoes,
      etapa4: observacoesConclusao,
      observacoesEmissor: laudo.observacoes,
      status: laudo.status,
      criadoEm: laudo.criado_em,
      emitidoEm: laudo.emitido_em,
      enviadoEm: laudo.enviado_em
    }

    return NextResponse.json({
      success: true,
      lote: {
        id: lote.id,
        codigo: lote.codigo,
        empresa_nome: lote.empresa_nome,
        clinica_nome: lote.clinica_nome
      },
      laudoPadronizado
    })

  } catch (error) {
    console.error('Erro ao buscar laudo:', error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      success: false,
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// PUT - Atualizar observações do laudo
export const PUT = async (req: Request, { params }: { params: { loteId: string } }) => {
  const user = await requireRole('emissor')
  if (!user) {
    return NextResponse.json({ error: "Acesso negado", success: false }, { status: 403 })
  }

  try {
    const loteId = parseInt(params.loteId)
    const { observacoes } = await req.json()

    if (isNaN(loteId)) {
      return NextResponse.json({ error: "ID do lote inválido", success: false }, { status: 400 })
    }

    // Atualizar observações
    await query(`
      UPDATE laudos
      SET observacoes = $1, atualizado_em = NOW()
      WHERE lote_id = $2 AND emissor_cpf = $3 AND status = 'rascunho'
    `, [observacoes, loteId, user.cpf])

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao atualizar laudo:', error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      success: false,
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// POST - Emitir laudo
export const POST = async (req: Request, { params }: { params: { loteId: string } }) => {
  const user = await requireRole('emissor')
  if (!user) {
    return NextResponse.json({ error: "Acesso negado", success: false }, { status: 403 })
  }

  try {
    const loteId = parseInt(params.loteId)
    if (isNaN(loteId)) {
      return NextResponse.json({ error: "ID do lote inválido", success: false }, { status: 400 })
    }

    // Emitir laudo
    await query(`
      UPDATE laudos
      SET status = 'emitido', emitido_em = NOW(), atualizado_em = NOW()
      WHERE lote_id = $1 AND emissor_cpf = $2 AND status = 'rascunho'
    `, [loteId, user.cpf])

    return NextResponse.json({ success: true, message: "Laudo emitido com sucesso" })

  } catch (error) {
    console.error('Erro ao emitir laudo:', error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      success: false,
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

// PATCH - Enviar laudo para clínica
export const PATCH = async (req: Request, { params }: { params: { loteId: string } }) => {
  const user = await requireRole('emissor')
  if (!user) {
    return NextResponse.json({ error: "Acesso negado", success: false }, { status: 403 })
  }

  try {
    const loteId = parseInt(params.loteId)
    if (isNaN(loteId)) {
      return NextResponse.json({ error: "ID do lote inválido", success: false }, { status: 400 })
    }

    // Enviar laudo (simulação - em produção seria email/notificação)
    await query(`
      UPDATE laudos
      SET status = 'enviado', enviado_em = NOW(), atualizado_em = NOW()
      WHERE lote_id = $1 AND emissor_cpf = $2 AND status = 'emitido'
    `, [loteId, user.cpf])

    return NextResponse.json({ success: true, message: "Laudo enviado para clínica com sucesso" })

  } catch (error) {
    console.error('Erro ao enviar laudo:', error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      success: false,
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}