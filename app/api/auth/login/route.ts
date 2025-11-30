import { NextResponse } from 'next/server'
import { query, getDatabaseInfo } from '@/lib/db'
import { createSession } from '@/lib/session'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    console.log('Database info:', getDatabaseInfo())
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
      'SELECT cpf, nome, perfil, senha_hash, ativo, nivel_cargo FROM funcionarios WHERE cpf = $1',
      [cpf]
    )

    console.log(`Login attempt for CPF: ${cpf}, found: ${result.rows.length > 0}`)

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'CPF ou senha inválidos' },
        { status: 401 }
      )
    }

    const funcionario = result.rows[0]
    console.log(`User found: ${funcionario.nome}, perfil: ${funcionario.perfil}, ativo: ${funcionario.ativo}`)

    // Verificar se está ativo
    if (!funcionario.ativo) {
      return NextResponse.json(
        { error: 'Usuário inativo. Entre em contato com o administrador.' },
        { status: 403 }
      )
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, funcionario.senha_hash)
    console.log(`Password valid: ${senhaValida}`)

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
      nivelCargo: funcionario.nivel_cargo,
    })

    // Determinar redirecionamento baseado no perfil
    let redirectTo = '/dashboard'
    if (funcionario.perfil === 'master') redirectTo = '/master'
    else if (funcionario.perfil === 'admin') redirectTo = '/admin'
    else if (funcionario.perfil === 'rh') redirectTo = '/rh'
    else if (funcionario.perfil === 'emissor') redirectTo = '/emissor'

    return NextResponse.json({
      success: true,
      cpf: funcionario.cpf,
      nome: funcionario.nome,
      perfil: funcionario.perfil,
      nivelCargo: funcionario.nivel_cargo,
      redirectTo,
    })
  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
