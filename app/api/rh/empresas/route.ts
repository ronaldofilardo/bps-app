import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'

export async function GET() {
  try {
    const session = await requireRole('rh')

    const rhResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    )

    if (rhResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário RH não encontrado' }, { status: 404 })
    }

    const clinicaId = rhResult.rows[0].clinica_id

    const result = await query(`
      SELECT id, nome, cnpj
      FROM empresas_clientes
      WHERE clinica_id = $1 AND ativa = true
      ORDER BY nome
    `, [clinicaId])

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Erro ao listar empresas:', error)
    return NextResponse.json(
      { error: 'Erro ao listar empresas' },
      { status: 500 }
    )
  }
}