import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    await requireRole('admin')
    const { funcionarios } = await request.json()

    if (!Array.isArray(funcionarios)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    let sucesso = 0
    let erros = 0

    for (const func of funcionarios) {
      try {
        const senhaHash = await bcrypt.hash(func.senha || '123456', 10)
        
        await query(
          `INSERT INTO funcionarios (cpf, nome, setor, funcao, email, senha_hash, perfil)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (cpf) DO UPDATE SET
           nome = EXCLUDED.nome,
           setor = EXCLUDED.setor,
           funcao = EXCLUDED.funcao,
           email = EXCLUDED.email`,
          [func.cpf, func.nome, func.setor, func.funcao, func.email, senhaHash, func.perfil || 'funcionario']
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
