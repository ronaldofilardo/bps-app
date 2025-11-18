export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export async function GET() {
  try {
    const session = await requireAuth()

    // Buscar avaliação mais recente do usuário
    const avaliacaoResult = await query(
      `SELECT id, status, inicio, envio, grupo_atual FROM avaliacoes
       WHERE funcionario_cpf = $1
       ORDER BY inicio DESC LIMIT 1`,
      [session.cpf]
    )

    if (avaliacaoResult.rows.length === 0) {
      return NextResponse.json({ status: 'nao_iniciada' })
    }

    const avaliacao = avaliacaoResult.rows[0]

    return NextResponse.json({
      status: avaliacao.status,
      inicio: avaliacao.inicio,
      envio: avaliacao.envio,
      grupo_atual: avaliacao.grupo_atual
    })
  } catch (error) {
    console.error('Erro ao buscar status da avaliação:', error)
    return NextResponse.json({ error: 'Erro ao buscar status' }, { status: 500 })
  }
}