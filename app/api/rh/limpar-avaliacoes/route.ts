import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'

export async function POST(request: Request) {
  try {
    await requireRole('rh')

    const { cpf } = await request.json()

    if (!cpf) {
      return NextResponse.json(
        { error: 'CPF não informado' },
        { status: 400 }
      )
    }

    // Buscar avaliações concluídas do funcionário
    const avaliacoesConcluidas = await query(
      'SELECT id FROM avaliacoes WHERE funcionario_cpf = $1 AND status = $2',
      [cpf, 'concluida']
    )

    if (avaliacoesConcluidas.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhuma avaliação concluída encontrada para limpeza'
      })
    }

    // Deletar respostas das avaliações concluídas
    for (const avaliacao of avaliacoesConcluidas.rows) {
      await query('DELETE FROM respostas WHERE avaliacao_id = $1', [avaliacao.id])
      await query('DELETE FROM resultados WHERE avaliacao_id = $1', [avaliacao.id])
    }

    // Deletar as avaliações concluídas
    await query(
      'DELETE FROM avaliacoes WHERE funcionario_cpf = $1 AND status = $2',
      [cpf, 'concluida']
    )

    return NextResponse.json({
      success: true,
      message: `${avaliacoesConcluidas.rows.length} avaliação(ões) concluída(s) removida(s)`
    })
  } catch (error) {
    console.error('Erro ao limpar avaliações:', error)
    return NextResponse.json(
      { error: 'Erro ao limpar avaliações' },
      { status: 500 }
    )
  }
}