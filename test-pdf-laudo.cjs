// Teste direto da geração de PDF do laudo
const puppeteer = require("puppeteer");

async function testPDFGeneration() {
  try {
    console.log("Iniciando teste de geração de PDF do laudo...");

    // Simular os dados que viriam da API
    const laudoPadronizado = {
      etapa1: {
        empresaAvaliada: "Empresa Teste",
        cnpj: "12.345.678/0001-90",
        endereco: "Rua Teste, 123 - Cidade/UF",
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
        conclusao: "Conclusão do laudo psicossocial...",
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
        observacoesLaudo: "Observações do laudo...",
        textoConclusao: "Texto de conclusão...",
        dataEmissao: "10 de dezembro de 2025",
        assinatura: {
          nome: "Dr. João Silva",
          titulo: "Psicólogo",
          registro: "CRP 12/34567",
          empresa: "Empresa Avaliadora Ltda",
        },
      },
    };

    // Gerar HTML simples para teste
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Teste Laudo</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        .section { margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>LAUDO PSICOSSOCIAL - TESTE</h1>
      <div class="section">
        <h2>Empresa: ${laudoPadronizado.etapa1.empresaAvaliada}</h2>
        <p>CNPJ: ${laudoPadronizado.etapa1.cnpj}</p>
      </div>
      <div class="section">
        <h2>Conclusão</h2>
        <p>${laudoPadronizado.etapa4.textoConclusao}</p>
      </div>
    </body>
    </html>
    `;

    console.log("HTML gerado, tamanho:", html.length, "caracteres");

    // Gerar PDF
    console.log("Iniciando Puppeteer...");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    console.log("Browser iniciado, criando página...");
    const page = await browser.newPage();

    console.log("Definindo conteúdo da página...");
    await page.setContent(html, { waitUntil: "networkidle0" });

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
    });

    console.log("PDF gerado com sucesso! Tamanho:", pdfBuffer.length, "bytes");

    await browser.close();

    console.log("Teste concluído com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro no teste de geração de PDF:", error);
    console.error("Stack trace:", error.stack);
    return false;
  }
}

testPDFGeneration();
