
import { requireAuth } from "@/lib/session";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const POST = async (req: Request) => {
  const user = await requireAuth();
  if (!user || user.perfil !== "rh") {
    return NextResponse.json({ error: "Acesso negado", criadas: 0, total: 0, success: false, detalhes: [] }, { status: 200 });
  }

  const { tipo } = await req.json();
  if (!["operacional", "gestao"].includes(tipo)) {
    return NextResponse.json({ error: "Tipo inválido", criadas: 0, total: 0, success: false, detalhes: [] }, { status: 200 });
  }

  const perfil = tipo === "operacional" ? "funcionario" : "gestao";
  const funcs = await query(
    `SELECT cpf FROM funcionarios WHERE perfil = $1 AND ativo = true`,
    [perfil]
  );

  if (funcs.rowCount === 0) {
    return NextResponse.json({ criadas: 0, total: 0, success: true, detalhes: [] }, { status: 200 });
  }

  let criadas = 0;
  const agora = new Date().toISOString();
  const detalhes = [];

  for (const func of funcs.rows) {
    // SEMPRE CRIA NOVA — IGNORA TUDO QUE JÁ EXISTE
    await query(
      `INSERT INTO avaliacoes (funcionario_cpf, status, inicio, liberado_por, liberado_em)
       VALUES ($1, 'iniciada', $2, $3, $2)`,
      [func.cpf, agora, user.cpf]
    );
    criadas++;
    detalhes.push({ cpf: func.cpf, status: 'iniciada' });
  }

  return NextResponse.json({ criadas, total: funcs.rowCount, success: true, detalhes }, { status: 200 });
};
