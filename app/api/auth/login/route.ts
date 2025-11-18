import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { cpf, senha } = await request.json()

    // Validar entrada
    if (!cpf || !senha) {
      return NextResponse.json(
        { error: 'CPF e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar funcionário
    const result = await query(
      'SELECT cpf, nome, perfil, senha_hash, ativo FROM funcionarios WHERE cpf = $1',
      [cpf]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'CPF ou senha inválidos' },
        { status: 401 }
      )
    }

    const funcionario = result.rows[0]

    // Verificar se está ativo
    if (!funcionario.ativo) {
      return NextResponse.json(
        { error: 'Usuário inativo. Entre em contato com o administrador.' },
        { status: 403 }
      )
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, funcionario.senha_hash)

    if (!senhaValida) {
      return NextResponse.json(
        { error: 'CPF ou senha inválidos' },
        { status: 401 }
      )
    }

    // Criar sessão
    await createSession({
      cpf: funcionario.cpf,
      nome: funcionario.nome,
      perfil: funcionario.perfil,
    })

    return NextResponse.json({
      success: true,
      cpf: funcionario.cpf,
      nome: funcionario.nome,
      perfil: funcionario.perfil,
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
