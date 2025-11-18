export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/session'

export async function GET(request: Request) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    const grupo = searchParams.get('grupo')

    if (!grupo) {
      return NextResponse.json({ error: 'Grupo não informado' }, { status: 400 })
    }

    // Buscar avaliação atual
    const avaliacaoResult = await query(
      `SELECT id FROM avaliacoes 
       WHERE funcionario_cpf = $1 AND status IN ('iniciada', 'em_andamento')
       ORDER BY inicio DESC LIMIT 1`,
      [session.cpf]
    )

    if (avaliacaoResult.rows.length === 0) {
      return NextResponse.json({ respostas: [] })
    }

    const avaliacaoId = avaliacaoResult.rows[0].id

    // Buscar respostas do grupo
    const respostasResult = await query(
      'SELECT item, valor FROM respostas WHERE avaliacao_id = $1 AND grupo = $2',
      [avaliacaoId, parseInt(grupo)]
    )

    return NextResponse.json({ respostas: respostasResult.rows })
  } catch (error) {
    console.error('Erro ao buscar respostas:', error)
    return NextResponse.json({ error: 'Erro ao buscar' }, { status: 500 })
  }
}
