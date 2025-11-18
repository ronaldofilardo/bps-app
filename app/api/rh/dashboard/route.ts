export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'

export async function GET() {
  try {
    await requireRole('rh')

    // Buscar estatísticas gerais
    const stats = await query(`
      SELECT 
        COUNT(DISTINCT a.id) as total_avaliacoes,
        COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN a.id END) as concluidas,
        COUNT(DISTINCT a.funcionario_cpf) as funcionarios_avaliados
      FROM avaliacoes a
    `)

    // Buscar resultados por domínio
    const resultados = await query(`
      SELECT 
        r.grupo,
        r.dominio,
        AVG(r.score) as media_score,
        r.categoria,
        COUNT(*) as total
      FROM resultados r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      WHERE a.status = 'concluida'
      GROUP BY r.grupo, r.dominio, r.categoria
      ORDER BY r.grupo
    `)

    // Buscar distribuição por categoria
    const distribuicao = await query(`
      SELECT 
        categoria,
        COUNT(*) as total
      FROM resultados r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      WHERE a.status = 'concluida'
      GROUP BY categoria
    `)

    return NextResponse.json({
      stats: stats.rows[0],
      resultados: resultados.rows,
      distribuicao: distribuicao.rows,
    })
  } catch (error) {
    console.error('Erro ao buscar dados RH:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados' },
      { status: 500 }
    )
  }
}
