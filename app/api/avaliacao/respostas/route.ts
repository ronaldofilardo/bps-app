export async function POST(request: Request) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const respostas = body.respostas

    if (!Array.isArray(respostas) || respostas.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Buscar avaliação atual
    const avaliacaoResult = await query(
      `SELECT id FROM avaliacoes 
       WHERE funcionario_cpf = $1 AND status IN ('iniciada', 'em_andamento')
       ORDER BY inicio DESC LIMIT 1`,
      [session.cpf]
    )

    if (avaliacaoResult.rows.length === 0) {
      return NextResponse.json({ error: 'Avaliação não encontrada' }, { status: 404 })
    }

    const avaliacaoId = avaliacaoResult.rows[0].id

    // Salvar respostas
    for (const resposta of respostas) {
      await query(
        `INSERT INTO respostas (avaliacao_id, item, valor, grupo)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (avaliacao_id, item) DO UPDATE SET valor = EXCLUDED.valor` ,
        [avaliacaoId, resposta.item, resposta.valor, resposta.grupo]
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao salvar respostas:', error)
    if (error instanceof Error && error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}
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
