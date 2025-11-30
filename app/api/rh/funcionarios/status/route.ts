import { NextResponse, NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic';
async function updateLotesStatus(cpf: string) {
  // Buscar lotes que têm avaliações deste funcionário
  const lotesResult = await query(`
    SELECT DISTINCT la.id, la.status, la.codigo
    FROM lotes_avaliacao la
    JOIN avaliacoes a ON la.id = a.lote_id
    WHERE a.funcionario_cpf = $1
  `, [cpf])

  console.log(`[INFO] Atualizando ${lotesResult.rowCount} lotes afetados pelo funcionário ${cpf}`)

  for (const lote of lotesResult.rows) {
    // Recalcular status do lote baseado nas avaliações ativas (não inativadas)
    const statsResult = await query(`
      SELECT
        COUNT(*) FILTER (WHERE a.status != 'inativada') as ativas,
        COUNT(*) FILTER (WHERE a.status = 'concluida') as concluidas
      FROM avaliacoes a
      WHERE a.lote_id = $1
    `, [lote.id])

    const { ativas, concluidas } = statsResult.rows[0]
    const ativasNum = parseInt(ativas) || 0
    const concluidasNum = parseInt(concluidas) || 0

    console.log(`[DEBUG] Lote ${lote.codigo}: ${ativasNum} ativas, ${concluidasNum} concluídas`)

    // Se todas as avaliações ativas estão concluídas, status = 'concluido', senão 'ativo'
    const novoStatus = ativasNum > 0 && concluidasNum === ativasNum ? 'concluido' : 'ativo'

    if (novoStatus !== lote.status) {
      await query('UPDATE lotes_avaliacao SET status = $1 WHERE id = $2', [novoStatus, lote.id])
      console.log(`[INFO] Lote ${lote.codigo} alterado de '${lote.status}' para '${novoStatus}'`)
    }
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireRole('rh')
    const { cpf, ativo } = await request.json()

    if (!cpf || typeof ativo !== 'boolean') {
      return NextResponse.json({ error: 'CPF e status ativo são obrigatórios' }, { status: 400 })
    }

    // Verificar se o RH pertence à mesma clínica do funcionário
    const rhResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    )

    if (rhResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário RH não encontrado' }, { status: 404 })
    }

    const clinicaId = rhResult.rows[0].clinica_id

    // Verificar se funcionário existe e pertence à clínica
    const funcResult = await query(
      'SELECT cpf, ativo FROM funcionarios WHERE cpf = $1 AND clinica_id = $2',
      [cpf, clinicaId]
    )

    if (funcResult.rows.length === 0) {
      return NextResponse.json({ error: 'Funcionário não encontrado ou não pertence à sua clínica' }, { status: 404 })
    }

    const statusAtual = funcResult.rows[0].ativo

    // Se já está no status desejado, não fazer nada
    if (statusAtual === ativo) {
      return NextResponse.json({ success: true, message: 'Status já está atualizado' })
    }

    // Atualizar status do funcionário
    await query(
      'UPDATE funcionarios SET ativo = $1 WHERE cpf = $2',
      [ativo, cpf]
    )

    // Atualizar status das avaliações baseado no status do funcionário
    if (!ativo) {
      // Desativando: marcar avaliações não concluídas como 'inativada' (concluídas permanecem)
      const updateResult = await query(
        "UPDATE avaliacoes SET status = 'inativada' WHERE funcionario_cpf = $1 AND status != 'concluida' RETURNING id, status",
        [cpf]
      )
      console.log(`[INFO] Inativadas ${updateResult.rowCount} avaliações do funcionário ${cpf}`)
      if (updateResult.rowCount > 0) {
        console.log('[DEBUG] Avaliações inativadas:', updateResult.rows)
      }
    }
    // Reativando: não há necessidade de alterar, pois concluídas já estão corretas e outras permanecem inativadas

    // Atualizar status dos lotes afetados
    await updateLotesStatus(cpf)

    return NextResponse.json({
      success: true,
      message: ativo
        ? 'Funcionário reativado com sucesso.'
        : 'Funcionário desativado. Avaliações não concluídas foram marcadas como inativadas.'
    })

  } catch (error) {
    console.error('Erro ao atualizar status do funcionário:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
