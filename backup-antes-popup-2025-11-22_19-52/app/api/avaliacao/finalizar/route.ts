export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { calcularResultados } from '@/lib/calculate'
import { grupos } from '@/lib/questoes'

export async function POST() {
  try {
    const session = await requireAuth()

    // Buscar avaliação atual
    const avaliacaoResult = await query(
      `SELECT id FROM avaliacoes 
       WHERE funcionario_cpf = $1 AND status IN ('iniciada', 'em_andamento')
       ORDER BY inicio DESC LIMIT 1`,
      [session.cpf]
    )

    if (avaliacaoResult.rows.length === 0) {
      return NextResponse.json({ error: 'Nenhuma avaliação encontrada' }, { status: 404 })
    }

    const avaliacaoId = avaliacaoResult.rows[0].id

    // Buscar todas as respostas
    const respostasResult = await query(
      'SELECT grupo, item, valor FROM respostas WHERE avaliacao_id = $1',
      [avaliacaoId]
    )

    // Calcular total de perguntas obrigatórias
    const totalPerguntasObrigatorias = grupos.reduce((acc, grupo) => acc + grupo.itens.length, 0);

    // Verificar se todas as respostas obrigatórias foram preenchidas
    if (respostasResult.rows.length < totalPerguntasObrigatorias) {
      return NextResponse.json({ error: 'A avaliação não está completa. Responda todas as perguntas antes de finalizar.' }, { status: 400 });
    }

    // Organizar respostas por grupo
    const respostasPorGrupo = new Map<number, Array<{ item: string; valor: number }>>();
    respostasResult.rows.forEach((r: any) => {
      if (!respostasPorGrupo.has(r.grupo)) {
        respostasPorGrupo.set(r.grupo, []);
      }
      respostasPorGrupo.get(r.grupo)!.push({ item: r.item, valor: r.valor });
    });

    // Criar mapa de tipos de grupos
    const gruposTipo = new Map(
      grupos.map(g => [g.id, { dominio: g.dominio, tipo: g.tipo }])
    );

    // Calcular resultados
    const resultados = calcularResultados(respostasPorGrupo, gruposTipo);

    // Salvar resultados no banco
    for (const resultado of resultados) {
      await query(
        `INSERT INTO resultados (avaliacao_id, grupo, dominio, score, categoria)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT ON CONSTRAINT resultados_avaliacao_id_grupo_key
         DO UPDATE SET score = EXCLUDED.score, categoria = EXCLUDED.categoria`,
        [avaliacaoId, resultado.grupo, resultado.dominio, resultado.score, resultado.categoria]
      );
    }

    // Atualizar status da avaliação
    await query(
      'UPDATE avaliacoes SET status = $1, envio = NOW() WHERE id = $2',
      ['concluida', avaliacaoId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao finalizar avaliação:', error)
    return NextResponse.json({ error: 'Erro ao finalizar' }, { status: 500 })
  }
}
