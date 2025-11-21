import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'

// GET - Listar empresas clientes da clínica do admin
export async function GET() {
  try {
    const session = await requireRole('admin')

    // Obter a clínica do admin logado
    const adminResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    )

    if (adminResult.rows.length === 0) {
      return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
    }

    const clinicaId = adminResult.rows[0].clinica_id

    // Buscar empresas apenas da clínica do admin
    const result = await query(`
      SELECT 
        id,
        nome,
        cnpj,
        email,
        telefone,
        endereco,
        cidade,
        estado,
        cep,
        ativa,
        criado_em,
        atualizado_em
      FROM empresas_clientes 
      WHERE clinica_id = $1
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

// POST - Criar nova empresa cliente
export async function POST(request: Request) {
  try {
    const session = await requireRole('admin')
    const data = await request.json()

    // Obter a clínica do admin logado
    const adminResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    )

    if (adminResult.rows.length === 0) {
      return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
    }

    const clinicaId = adminResult.rows[0].clinica_id

    // Validar dados obrigatórios
    if (!data.nome || !data.cnpj) {
      return NextResponse.json(
        { error: 'Nome e CNPJ são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se CNPJ já existe na clínica
    const existingResult = await query(
      'SELECT id FROM empresas_clientes WHERE cnpj = $1 AND clinica_id = $2',
      [data.cnpj, clinicaId]
    )

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado nesta clínica' },
        { status: 400 }
      )
    }

    // Inserir nova empresa
    const result = await query(`
      INSERT INTO empresas_clientes (
        nome, cnpj, email, telefone, endereco, cidade, estado, cep, clinica_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      data.nome,
      data.cnpj,
      data.email || null,
      data.telefone || null,
      data.endereco || null,
      data.cidade || null,
      data.estado || null,
      data.cep || null,
      clinicaId
    ])

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Erro ao criar empresa:', error)
    return NextResponse.json(
      { error: 'Erro ao criar empresa' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar empresa cliente
export async function PATCH(request: Request) {
  try {
    const session = await requireRole('admin')
    const data = await request.json()

    if (!data.id) {
      return NextResponse.json(
        { error: 'ID da empresa é obrigatório' },
        { status: 400 }
      )
    }

    // Obter a clínica do admin logado
    const adminResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    )

    if (adminResult.rows.length === 0) {
      return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
    }

    const clinicaId = adminResult.rows[0].clinica_id

    // Verificar se a empresa pertence à clínica do admin
    const empresaResult = await query(
      'SELECT id FROM empresas_clientes WHERE id = $1 AND clinica_id = $2',
      [data.id, clinicaId]
    )

    if (empresaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada ou sem permissão' },
        { status: 404 }
      )
    }

    // Montar query de atualização dinamicamente
    const fields = []
    const values = []
    let paramIndex = 1

    if (data.nome !== undefined) {
      fields.push(`nome = $${paramIndex}`)
      values.push(data.nome)
      paramIndex++
    }
    if (data.cnpj !== undefined) {
      fields.push(`cnpj = $${paramIndex}`)
      values.push(data.cnpj)
      paramIndex++
    }
    if (data.email !== undefined) {
      fields.push(`email = $${paramIndex}`)
      values.push(data.email)
      paramIndex++
    }
    if (data.telefone !== undefined) {
      fields.push(`telefone = $${paramIndex}`)
      values.push(data.telefone)
      paramIndex++
    }
    if (data.endereco !== undefined) {
      fields.push(`endereco = $${paramIndex}`)
      values.push(data.endereco)
      paramIndex++
    }
    if (data.cidade !== undefined) {
      fields.push(`cidade = $${paramIndex}`)
      values.push(data.cidade)
      paramIndex++
    }
    if (data.estado !== undefined) {
      fields.push(`estado = $${paramIndex}`)
      values.push(data.estado)
      paramIndex++
    }
    if (data.cep !== undefined) {
      fields.push(`cep = $${paramIndex}`)
      values.push(data.cep)
      paramIndex++
    }
    if (data.ativa !== undefined) {
      fields.push(`ativa = $${paramIndex}`)
      values.push(data.ativa)
      paramIndex++
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    fields.push(`atualizado_em = CURRENT_TIMESTAMP`)
    values.push(data.id)

    const result = await query(`
      UPDATE empresas_clientes 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values)

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar empresa' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir empresa cliente
export async function DELETE(request: Request) {
  try {
    const session = await requireRole('admin')
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID da empresa é obrigatório' },
        { status: 400 }
      )
    }

    // Obter a clínica do admin logado
    const adminResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    )

    if (adminResult.rows.length === 0) {
      return NextResponse.json({ error: 'Admin não encontrado' }, { status: 404 })
    }

    const clinicaId = adminResult.rows[0].clinica_id

    // Verificar se a empresa pertence à clínica do admin
    const empresaResult = await query(
      'SELECT id FROM empresas_clientes WHERE id = $1 AND clinica_id = $2',
      [id, clinicaId]
    )

    if (empresaResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada ou sem permissão' },
        { status: 404 }
      )
    }

    // Excluir empresa
    await query('DELETE FROM empresas_clientes WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir empresa:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir empresa' },
      { status: 500 }
    )
  }
}