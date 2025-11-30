import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRHWithEmpresaAccess } from '@/lib/session'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const { funcionarios, empresa_id } = await request.json()

    if (!Array.isArray(funcionarios)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    if (!empresa_id) {
      return NextResponse.json({ error: 'empresa_id é obrigatório' }, { status: 400 })
    }

    // Validar acesso do RH à empresa
    const session = await requireRHWithEmpresaAccess(empresa_id)

    // Obter a clínica do RH logado
    const rhResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    )

    if (rhResult.rows.length === 0) {
      return NextResponse.json({ error: 'Gestor RH não encontrado' }, { status: 404 })
    }

    const clinicaId = rhResult.rows[0].clinica_id

    let sucesso = 0
    let erros = 0

    for (const func of funcionarios) {
      try {
        const senhaHash = await bcrypt.hash(func.senha || '123456', 10)
        
        await query(
          `INSERT INTO funcionarios (cpf, nome, setor, funcao, email, senha_hash, perfil, clinica_id, empresa_id, matricula, nivel_cargo, turno, escala)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (cpf) DO UPDATE SET
           nome = EXCLUDED.nome,
           setor = EXCLUDED.setor,
           funcao = EXCLUDED.funcao,
           email = EXCLUDED.email,
           empresa_id = EXCLUDED.empresa_id,
           matricula = EXCLUDED.matricula,
           nivel_cargo = EXCLUDED.nivel_cargo,
           turno = EXCLUDED.turno,
           escala = EXCLUDED.escala,
           clinica_id = EXCLUDED.clinica_id`,
          [func.cpf, func.nome, func.setor, func.funcao, func.email, senhaHash, func.perfil || 'funcionario', clinicaId, func.empresa_id || null, func.matricula || null, func.nivel_cargo || null, func.turno || null, func.escala || null]
        )
        sucesso++
      } catch (error) {
        console.error('Erro ao importar funcionário:', func.cpf, error)
        erros++
      }
    }

    return NextResponse.json({ sucesso, erros })
  } catch (error) {
    console.error('Erro ao importar funcionários:', error)
    return NextResponse.json({ error: 'Erro ao importar' }, { status: 500 })
  }
}
