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

    // Verificar se o funcionário existe, se não, criar para testes
    let funcionarioResult = await query(
      'SELECT id FROM funcionarios WHERE cpf = $1',
      [cpf]
    )

    if (funcionarioResult.rows.length === 0) {
      // Criar funcionário para testes
      await query(
        `INSERT INTO funcionarios (cpf, nome, perfil, senha_hash)
         VALUES ($1, 'Funcionário Teste', 'funcionario', '$2a$10$dummyhashfortesting')`,
        [cpf]
      )
    }

    // Criar nova avaliação
    const newAvaliacao = await query(
      `INSERT INTO avaliacoes (funcionario_cpf, status)
       VALUES ($1, 'iniciada')
       RETURNING id`,
      [cpf]
    )

    return NextResponse.json({
      success: true,
      avaliacaoId: newAvaliacao.rows[0].id
    })
  } catch (error) {
    console.error('Erro ao liberar avaliação:', error)
    return NextResponse.json(
      { error: 'Erro ao liberar avaliação' },
      { status: 500 }
    )
  }
}