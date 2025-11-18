export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'

export async function GET() {
  try {
    await requireRole('admin')

    const result = await query(`
      SELECT 
        cpf, nome, setor, funcao, email, perfil, ativo,
        criado_em, atualizado_em
      FROM funcionarios
      ORDER BY nome
    `)

    return NextResponse.json({ funcionarios: result.rows })
  } catch (error) {
    console.error('Erro ao listar funcionários:', error)
    return NextResponse.json({ error: 'Erro ao listar' }, { status: 500 })
  }
}
