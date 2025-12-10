// Teste completo da geração de PDF do laudo com dados reais
const puppeteer = require("puppeteer");
const { Client } = require("pg");

// Configuração do banco
const client = new Client({
  host: "ep-steep-credit-acckkvg4.sa-east-1.aws.neon.tech",
  port: 5432,
  user: "neondb_owner",
  password: "npg_NfJGO8vck9ob",
  database: "neondb",
  ssl: { rejectUnauthorized: false },
});

async function testFullPDFGeneration() {
  try {
    console.log("Conectando ao banco de dados...");
    await client.connect();

    const loteId = 5; // Lote que sabemos que tem laudo emitido

    console.log("Buscando dados do lote...");
    const loteQuery = await client.query(
      `
      SELECT la.id, la.codigo, ec.nome as empresa_nome, c.nome as clinica_nome
      FROM lotes_avaliacao la
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      JOIN clinicas c ON ec.clinica_id = c.id
      WHERE la.id = $1
    `,
      [loteId]
    );

    if (loteQuery.rows.length === 0) {
      throw new Error("Lote não encontrado");
    }

    console.log("Lote encontrado:", loteQuery.rows[0]);

    console.log("Buscando laudo...");
    const laudoQuery = await client.query(
      `
      SELECT status, observacoes, emitido_em
      FROM laudos
      WHERE lote_id = $1 AND status = 'emitido'
      LIMIT 1
    `,
      [loteId]
    );

    if (laudoQuery.rows.length === 0) {
      throw new Error("Laudo emitido não encontrado");
    }

    console.log("Laudo encontrado:", laudoQuery.rows[0]);

    // Simular dados básicos para teste
    const laudoPadronizado = {
      etapa1: {
        empresaAvaliada: loteQuery.rows[0].empresa_nome,
        cnpj: "12.345.678/0001-90",
        endereco: "Endereço da empresa",
        periodoAvaliacoes: {
          dataLiberacao: "01/12/2025",
          dataUltimaConclusao: "10/12/2025",
        },
        totalFuncionariosAvaliados: 50,
        percentualConclusao: 100,
        amostra: {
          operacional: 40,
          gestao: 10,
        },
      },
      etapa2: [
        {
          grupo: 1,
          dominio: "Demanda Quantitativa",
          descricao: "Trabalho intenso e acelerado",
          tipo: "negativa",
          media: 75.5,
          mediaMenosDP: 65.2,
          mediaMaisDP: 85.8,
          classificacaoSemaforo: "amarelo",
          categoriaRisco: "medio",
        },
      ],
      etapa3: {
        conclusao:
          "Conclusão do laudo psicossocial baseada nos dados coletados.",
        gruposExcelente: [],
        gruposMonitoramento: [
          {
            grupo: 1,
            dominio: "Demanda Quantitativa",
          },
        ],
        gruposAltoRisco: [],
      },
      etapa4: {
        observacoesLaudo:
          laudoQuery.rows[0].observacoes || "Sem observações adicionais.",
        textoConclusao:
          "Texto de conclusão do laudo psicossocial conforme NR-01.",
        dataEmissao: "10 de dezembro de 2025",
        assinatura: {
          nome: "Dr. João Silva",
          titulo: "Psicólogo",
          registro: "CRP 12/34567",
          empresa: "Empresa Avaliadora Ltda",
        },
      },
    };

    console.log("Gerando HTML...");

    // HTML simplificado para teste
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laudo Psicossocial - Teste</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        .section { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>LAUDO PSICOSSOCIAL</h1>
      <div class="section">
        <h2>Empresa: ${laudoPadronizado.etapa1.empresaAvaliada}</h2>
        <p>Lote: ${loteQuery.rows[0].codigo}</p>
        <p>Status: ${laudoQuery.rows[0].status}</p>
        <p>Emitido em: ${laudoQuery.rows[0].emitido_em}</p>
      </div>
      <div class="section">
        <h2>Conclusão</h2>
        <p>${laudoPadronizado.etapa4.textoConclusao}</p>
        <p><strong>Observações:</strong> ${laudoPadronizado.etapa4.observacoesLaudo}</p>
      </div>
    </body>
    </html>
    `;

    console.log("HTML gerado, tamanho:", html.length, "caracteres");

    // Gerar PDF
    console.log("Iniciando Puppeteer...");
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    console.log("Browser iniciado, criando página...");
    const page = await browser.newPage();

    // Aumentar timeout
    page.setDefaultTimeout(60000);

    console.log("Definindo conteúdo da página...");
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });

    console.log("Gerando PDF...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20mm",
        right: "15mm",
        bottom: "20mm",
        left: "15mm",
      },
      timeout: 60000,
    });

    console.log("PDF gerado com sucesso! Tamanho:", pdfBuffer.length, "bytes");

    await browser.close();
    await client.end();

    console.log("Teste concluído com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro no teste completo:", error);
    console.error("Stack trace:", error.stack);

    try {
      await client.end();
    } catch (e) {
      console.error("Erro ao fechar conexão:", e);
    }

    return false;
  }
}

testFullPDFGeneration();
