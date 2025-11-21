export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { unstable_cache } from 'next/cache'

// Função cached para buscar dados do dashboard
const getDashboardData = unstable_cache(
  async (clinicaId: number, empresaId?: string) => {
    // Adicionar filtro opcional por empresa
    const empresaFilter = empresaId ? 'AND f.empresa_id = $2' : ''
    const params = empresaId ? [clinicaId, empresaId] : [clinicaId]

    // Buscar estatísticas gerais apenas da clínica (ou empresa)
    const stats = await query(`
      SELECT
        COUNT(DISTINCT a.id) as total_avaliacoes,
        COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN a.id END) as concluidas,
        COUNT(DISTINCT a.funcionario_cpf) as funcionarios_avaliados
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE f.clinica_id = $1 ${empresaFilter}
    `, params)

    // Buscar resultados por domínio apenas da clínica (ou empresa)
    const resultados = await query(`
      SELECT
        r.grupo,
        r.dominio,
        AVG(r.score) as media_score,
        CASE
          WHEN AVG(r.score) >= 75 THEN 'alto'
          WHEN AVG(r.score) >= 50 THEN 'medio'
          ELSE 'baixo'
        END as categoria,
        COUNT(*) as total,
        SUM(CASE WHEN r.score < 50 THEN 1 ELSE 0 END) as baixo,
        SUM(CASE WHEN r.score >= 50 AND r.score < 75 THEN 1 ELSE 0 END) as medio,
        SUM(CASE WHEN r.score >= 75 THEN 1 ELSE 0 END) as alto
      FROM resultados r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.status = 'concluida' AND f.clinica_id = $1 ${empresaFilter}
      GROUP BY r.grupo, r.dominio
      ORDER BY r.grupo
    `, params)

    // Buscar distribuição por categoria apenas da clínica (ou empresa)
    const distribuicao = await query(`
      SELECT
        categoria,
        COUNT(*) as total
      FROM resultados r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.status = 'concluida' AND f.clinica_id = $1 ${empresaFilter}
      GROUP BY categoria
    `, params)

    return {
      stats: stats.rows[0],
      resultados: resultados.rows,
      distribuicao: distribuicao.rows,
    }
  },
  ['rh-dashboard'],
  { revalidate: 300 } // Cache por 5 minutos
)

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole('rh')
    const searchParams = request.nextUrl.searchParams
    const empresaId = searchParams.get('empresa_id')

    // Obter a clínica do RH logado
    const rhResult = await query(
      'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    )

    if (rhResult.rows.length === 0) {
      return NextResponse.json({ error: 'Usuário RH não encontrado' }, { status: 404 })
    }

    const clinicaId = rhResult.rows[0].clinica_id

    // Buscar dados com cache
    const data = await getDashboardData(clinicaId, empresaId || undefined)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao buscar dados RH:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados' },
      { status: 500 }
    )
  }
}
