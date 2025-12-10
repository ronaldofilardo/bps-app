// Teste da geração completa do HTML do laudo
const { Client } = require("pg");
const puppeteer = require("puppeteer");

// Configuração do banco
const client = new Client({
  host: "ep-steep-credit-acckkvg4.sa-east-1.aws.neon.tech",
  port: 5432,
  user: "neondb_owner",
  password: "npg_NfJGO8vck9ob",
  database: "neondb",
  ssl: { rejectUnauthorized: false },
});

// Função simplificada para gerar HTML (baseada na função real)
function gerarHTMLLaudoCompleto(laudoPadronizado) {
  const { etapa1, etapa2, etapa3, etapa4 } = laudoPadronizado;

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Laudo Psicossocial</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 210mm; margin: 0 auto; }
        .section { margin-bottom: 20px; page-break-inside: avoid; }
        h1, h2 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <div style="max-width: 100%; margin: 0; padding: 15mm;">
        <h1>LAUDO PSICOSSOCIAL</h1>
        <h2>Avaliação de Saúde Mental no Trabalho</h2>
        <p>Baseada no instrumento COPSOQ II</p>

        <div class="section">
          <h2>1. DADOS GERAIS DA EMPRESA AVALIADA</h2>
          <p><strong>Empresa Avaliada:</strong> ${etapa1.empresaAvaliada}</p>
          <p><strong>CNPJ:</strong> ${etapa1.cnpj}</p>
          <p><strong>Endereço:</strong> ${etapa1.endereco}</p>
          <p><strong>Período:</strong> ${
            etapa1.periodoAvaliacoes.dataLiberacao
          } a ${etapa1.periodoAvaliacoes.dataUltimaConclusao}</p>
          <p><strong>Total de Funcionários:</strong> ${
            etapa1.totalFuncionariosAvaliados
          }</p>
          <p><strong>Amostra:</strong> ${
            etapa1.amostra.operacional
          } operacional + ${etapa1.amostra.gestao} gestão</p>
        </div>

        ${
          etapa2 && etapa2.length > 0
            ? `
        <div class="section">
          <h2>2. SCORES MÉDIOS POR GRUPO DE QUESTÕES</h2>
          <table>
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Domínio</th>
                <th>Descrição</th>
                <th>Média</th>
                <th>Risco</th>
              </tr>
            </thead>
            <tbody>
              ${etapa2
                .map(
                  (score) => `
                <tr>
                  <td>${score.grupo}</td>
                  <td>${score.dominio}</td>
                  <td>${score.descricao}</td>
                  <td>${score.media.toFixed(1)}</td>
                  <td>${score.categoriaRisco}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        `
            : ""
        }

        ${
          etapa3
            ? `
        <div class="section">
          <h2>3. INTERPRETAÇÃO E RECOMENDAÇÕES</h2>
          <p>${etapa3.conclusao}</p>
        </div>
        `
            : ""
        }

        ${
          etapa4
            ? `
        <div class="section">
          <h2>4. OBSERVAÇÕES E CONCLUSÃO</h2>
          <p>${etapa4.textoConclusao}</p>
          ${
            etapa4.observacoesLaudo
              ? `<p><strong>Observações:</strong> ${etapa4.observacoesLaudo}</p>`
              : ""
          }
        </div>
        `
            : ""
        }
      </div>
    </body>
    </html>
  `;

  return html;
}

async function testFullHTMLGeneration() {
  try {
    console.log("Iniciando teste com dados mockados...");

    // Dados mockados baseados nos dados reais
    const laudoPadronizado = {
      etapa1: {
        empresaAvaliada: "Indústria Metalúrgica São Paulo",
        cnpj: "12.345.678/0001-90",
        endereco: "Rua Teste, 123 - São Paulo/SP",
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
        {
          grupo: 2,
          dominio: "Demanda Emocional",
          descricao: "Exigências emocionais no trabalho",
          tipo: "negativa",
          media: 68.3,
          mediaMenosDP: 58.1,
          mediaMaisDP: 78.5,
          classificacaoSemaforo: "amarelo",
          categoriaRisco: "medio",
        },
      ],
      etapa3: {
        conclusao:
          "O resultado do Questionário Psicossocial de Copenhague (COPSOQ) aponta para um nível moderado de risco psicossocial, correspondendo ao tertil médio de exposição, indicando que o ambiente de trabalho apresenta algumas situações ou percepções que merecem atenção preventiva.",
        gruposExcelente: [],
        gruposMonitoramento: [
          { grupo: 1, dominio: "Demanda Quantitativa" },
          { grupo: 2, dominio: "Demanda Emocional" },
        ],
        gruposAltoRisco: [],
      },
      etapa4: {
        observacoesLaudo: "TEste de Laudo emitido pelo psicólogo.",
        textoConclusao:
          "Recomenda-se que a organização identifique as causas desses resultados e implemente ações de controle e prevenção antes que se agravem. As medidas podem incluir reuniões de alinhamento, adequação das cargas de trabalho e programas de apoio psicológico.",
        dataEmissao: "10 de dezembro de 2025",
        assinatura: {
          nome: "Dr. João Silva",
          titulo: "Psicólogo",
          registro: "CRP 12/34567",
          empresa: "Empresa Avaliadora Ltda",
        },
      },
    };

    console.log("Gerando HTML completo...");
    const html = gerarHTMLLaudoCompleto(laudoPadronizado);
    console.log("HTML gerado, tamanho:", html.length, "caracteres");

    // Testar com Puppeteer
    console.log("Testando com Puppeteer...");
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--max_old_space_size=4096",
      ],
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(120000); // 2 minutos

    console.log("Definindo conteúdo...");
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 120000 });

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
      timeout: 120000,
    });

    console.log("PDF gerado com sucesso! Tamanho:", pdfBuffer.length, "bytes");

    await browser.close();

    console.log("Teste concluído com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro no teste:", error);
    console.error("Stack trace:", error.stack);
    return false;
  }
}

testFullHTMLGeneration();
