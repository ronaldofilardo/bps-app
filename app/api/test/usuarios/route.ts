// API de teste para verificar usuários disponíveis
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(`
      SELECT cpf, nome, perfil, ativo 
      FROM funcionarios 
      WHERE perfil IN ('admin', 'rh', 'master', 'funcionario') 
      ORDER BY perfil, cpf
    `)

    return NextResponse.json({
      success: true,
      usuarios: result.rows
    })
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar usuários'
    }, { status: 500 })
  }
}