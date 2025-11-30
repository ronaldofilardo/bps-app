import { requireAuth } from "@/lib/session";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const POST = async (req: Request) => {
  const user = await requireAuth();
  if (!user || user.perfil !== "rh") {
    return NextResponse.json({
      error: "Acesso negado - apenas usuários RH podem liberar lotes",
      success: false
    }, { status: 403 });
  }

  try {
    const { empresaId, titulo, descricao, tipo = 'completo' } = await req.json();

    if (!empresaId) {
      return NextResponse.json({
        error: "ID da empresa é obrigatório",
        success: false
      }, { status: 400 });
    }

    if (!['completo', 'operacional', 'gestao'].includes(tipo)) {
      return NextResponse.json({
        error: "Tipo inválido. Use: completo, operacional ou gestao",
        success: false
      }, { status: 400 });
    }

    // Verificar se a empresa existe e pertence à clínica do usuário
    const empresaCheck = await query(`
      SELECT ec.id, ec.nome, ec.clinica_id, c.nome as clinica_nome
      FROM empresas_clientes ec
      JOIN clinicas c ON ec.clinica_id = c.id
      WHERE ec.id = $1 AND ec.ativa = true
    `, [empresaId]);

    if (empresaCheck.rowCount === 0) {
      return NextResponse.json({
        error: "Empresa não encontrada ou inativa",
        success: false
      }, { status: 404 });
    }

    const empresa = empresaCheck.rows[0];

    // Verificar se o usuário RH pertence à mesma clínica
    const userClinicaCheck = await query(`
      SELECT clinica_id FROM funcionarios WHERE cpf = $1
    `, [user.cpf]);

    if (userClinicaCheck.rowCount === 0 || userClinicaCheck.rows[0].clinica_id !== empresa.clinica_id) {
      return NextResponse.json({
        error: "Você não tem permissão para liberar avaliações nesta empresa",
        success: false
      }, { status: 403 });
    }

    // Gerar código do lote automaticamente
    const codigoResult = await query(`SELECT gerar_codigo_lote() as codigo`);
    const codigo = codigoResult.rows[0].codigo;

    // Criar o lote
    const loteResult = await query(`
      INSERT INTO lotes_avaliacao (codigo, clinica_id, empresa_id, titulo, descricao, tipo, liberado_por)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, codigo, liberado_em
    `, [
      codigo,
      empresa.clinica_id,
      empresaId,
      titulo || ` - ${codigo}`,
      descricao || `Lote liberado automaticamente para ${empresa.nome}`,
      tipo,
      user.cpf
    ]);

    const lote = loteResult.rows[0];

    // Determinar quais funcionários receberão as avaliações
    let whereClause = 'f.empresa_id = $1 AND f.ativo = true';
    const params = [empresaId];

    if (tipo === 'operacional') {
      whereClause += ' AND f.nivel_cargo = \'operacional\'';
    } else if (tipo === 'gestao') {
      whereClause += ' AND f.nivel_cargo = \'gestao\'';
    }
    // Para 'completo', não adiciona filtro de nível

    // Buscar funcionários elegíveis
    const funcionariosQuery = await query(`
      SELECT f.cpf, f.nome, f.nivel_cargo
      FROM funcionarios f
      WHERE ${whereClause}
      ORDER BY f.nome
    `, params);

    const funcionarios = funcionariosQuery.rows;

    if (funcionarios.length === 0) {
      return NextResponse.json({
        error: "Nenhum funcionário elegível encontrado para este tipo de lote",
        success: false,
        lote: lote
      }, { status: 400 });
    }

    // Criar avaliações para cada funcionário
    const agora = new Date().toISOString();
    let avaliacoesCriadas = 0;
    const detalhes = [];

    for (const func of funcionarios) {
      try {
        await query(`
          INSERT INTO avaliacoes (funcionario_cpf, status, inicio, lote_id)
          VALUES ($1, 'iniciada', $2, $3)
        `, [func.cpf, agora, lote.id]);

        avaliacoesCriadas++;
        detalhes.push({
          cpf: func.cpf,
          nome: func.nome,
          nivel: func.nivel_cargo,
          status: 'avaliacao_criada'
        });
      } catch (error) {
        console.error(`Erro ao criar avaliação para ${func.cpf}:`, error);
        detalhes.push({
          cpf: func.cpf,
          nome: func.nome,
          nivel: func.nivel_cargo,
          status: 'erro',
          erro: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    // Atualizar status do lote se necessário
    if (avaliacoesCriadas === 0) {
      await query(`UPDATE lotes_avaliacao SET status = 'cancelado' WHERE id = $1`, [lote.id]);
    }

    return NextResponse.json({
      success: true,
      message: `Lote ${codigo} liberado com sucesso!`,
      lote: {
        id: lote.id,
        codigo: lote.codigo,
        titulo: titulo || `Lote ${codigo}`,
        tipo: tipo,
        liberado_em: lote.liberado_em
      },
      estatisticas: {
        avaliacoesCriadas,
        totalFuncionarios: funcionarios.length,
        empresa: empresa.nome
      },
      detalhes
    });

  } catch (error) {
    console.error('Erro ao liberar lote:', error);
    return NextResponse.json({
      error: "Erro interno do servidor",
      success: false,
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
};
