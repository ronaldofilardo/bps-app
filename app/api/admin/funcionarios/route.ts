export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'

export async function GET() {
  try {
    const session = await requireRole('admin')

    // Obter a clínica do administrador logado
    const adminResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    )

    if (adminResult.rows.length === 0) {
      return NextResponse.json({ error: 'Administrador não encontrado' }, { status: 404 })
    }

    const clinicaId = adminResult.rows[0].clinica_id

    // Listar apenas funcionários da mesma clínica (exceto master) com empresa e novos campos
    const result = await query(`
      SELECT 
        f.cpf, f.nome, f.setor, f.funcao, f.email, f.perfil, f.ativo,
        f.matricula, f.nivel_cargo, f.turno, f.escala,
        f.empresa_id, ec.nome as empresa_nome,
        f.criado_em, f.atualizado_em
      FROM funcionarios f
      LEFT JOIN empresas_clientes ec ON f.empresa_id = ec.id
      WHERE f.clinica_id = $1 AND f.perfil != 'master'
      ORDER BY f.nome
    `, [clinicaId])

    return NextResponse.json({ funcionarios: result.rows })
  } catch (error) {
    console.error('Erro ao listar funcionários:', error)
    return NextResponse.json({ error: 'Erro ao listar' }, { status: 500 })
  }
}
