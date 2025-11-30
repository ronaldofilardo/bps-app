export async function GET(request: Request) {
  try {
    // Extrair empresa_id da query
    const { searchParams } = new URL(request.url);
    const empresaId = searchParams.get('empresa_id');
    if (!empresaId) {
      return NextResponse.json({ error: 'empresa_id é obrigatório' }, { status: 400 });
    }

    // Validar acesso do RH à empresa
    const session = await requireRHWithEmpresaAccess(Number(empresaId));
    // Obter clínica do RH
    const rhResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    );
    if (rhResult.rows.length === 0) {
      return NextResponse.json({ error: 'Gestor RH não encontrado' }, { status: 404 });
    }
    const clinicaId = rhResult.rows[0].clinica_id;

    // Buscar funcionários ativos e inativos da empresa e clínica
    const funcionariosResult = await query(
      `SELECT cpf, nome, setor, funcao, email, matricula, nivel_cargo, turno, escala, ativo
       FROM funcionarios
       WHERE empresa_id = $1 AND clinica_id = $2
       ORDER BY nome`,
      [empresaId, clinicaId]
    );

    // Buscar avaliações de todos os funcionários da empresa/lote
    const funcionariosCpfs = funcionariosResult.rows.map(f => f.cpf);
    let avaliacoesMap = {};
    if (funcionariosCpfs.length > 0) {
      const avaliacoesResult = await query(
        `SELECT id, funcionario_cpf, inicio, envio, status, lote_id
         FROM avaliacoes
         WHERE funcionario_cpf = ANY($1)`,
        [funcionariosCpfs]
      );
      // Agrupar avaliações por cpf
      avaliacoesMap = avaliacoesResult.rows.reduce((acc, av) => {
        if (!acc[av.funcionario_cpf]) acc[av.funcionario_cpf] = [];
        acc[av.funcionario_cpf].push({
          id: av.id,
          inicio: av.inicio,
          envio: av.envio,
          status: av.status,
          lote_id: av.lote_id
        });
        return acc;
      }, {});
    }

    // Montar resposta incluindo avaliações
    const funcionarios = funcionariosResult.rows.map(f => ({
      ...f,
      avaliacoes: avaliacoesMap[f.cpf] || []
    }));

    return NextResponse.json({ funcionarios });
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    return NextResponse.json({ error: 'Erro ao listar funcionários' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRHWithEmpresaAccess } from '@/lib/session'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const {
      cpf,
      nome,
      setor,
      funcao,
      email,
      senha,
      perfil = 'funcionario',
      empresa_id,
      matricula,
      nivel_cargo,
      turno,
      escala
    } = await request.json()

    // Validações básicas
    if (!cpf || !nome || !setor || !funcao || !email || !empresa_id) {
      return NextResponse.json({
        error: 'CPF, nome, setor, função, email e empresa_id são obrigatórios'
      }, { status: 400 })
    }

    // Validar formato CPF (básico)
    if (!/^\d{11}$/.test(cpf)) {
      return NextResponse.json({ error: 'CPF deve conter 11 dígitos' }, { status: 400 })
    }

    // Validar email básico
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Validar acesso do RH à empresa
    const session = await requireRHWithEmpresaAccess(empresa_id)

    // Obter clínica do RH
    const rhResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    )

    if (rhResult.rows.length === 0) {
      return NextResponse.json({ error: 'Gestor RH não encontrado' }, { status: 404 })
    }

    const clinicaId = rhResult.rows[0].clinica_id

    // Verificar se funcionário já existe
    const existingFunc = await query(
      'SELECT cpf FROM funcionarios WHERE cpf = $1',
      [cpf]
    )

    if (existingFunc.rows.length > 0) {
      return NextResponse.json({
        error: 'Funcionário com este CPF já existe'
      }, { status: 409 })
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha || '123456', 10)

    // Inserir funcionário
    await query(
      `INSERT INTO funcionarios (
        cpf, nome, setor, funcao, email, senha_hash, perfil,
        clinica_id, empresa_id, matricula, nivel_cargo, turno, escala
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        cpf, nome, setor, funcao, email, senhaHash, perfil,
        clinicaId, empresa_id, matricula || null, nivel_cargo || null,
        turno || null, escala || null
      ]
    )

    return NextResponse.json({
      success: true,
      message: 'Funcionário criado com sucesso',
      funcionario: {
        cpf,
        nome,
        setor,
        funcao,
        email,
        empresa_id,
        clinica_id: clinicaId
      }
    })

  } catch (error) {
    console.error('Erro ao criar funcionário:', error)

    if (error instanceof Error && error.message.includes('permissão')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}