import html2pdf from 'html2pdf.js';

export interface LaudoData {
  etapa1: {
    clinicaNome: string;
    clinicaEndereco: string;
    clinicaTelefone: string;
    clinicaEmail: string;
    empresaAvaliada: string;
    empresaCnpj: string;
    empresaEndereco: string;
    setorAvaliado: string;
    responsavelTecnico: string;
    registroProfissional: string;
    dataAvaliacao: string;
    totalFuncionarios: number;
    gestao: number;
    operacional: number;
  };
  etapa2: Array<{
    grupoId: number;
    grupoTitulo: string;
    dominio: string;
    mediaNumerica: number;
    classificacao: string;
    corClassificacao: string;
  }>;
  etapa3: Array<{
    grupoId: number;
    grupoTitulo: string;
    interpretacao: string;
    recomendacoes: string[];
  }>;
  etapa4: {
    observacoes: string;
    conclusao: string;
    dataEmissao: string;
  };
}

function gerarHTMLLaudoCompleto(laudo: LaudoData): string {
  const { etapa1, etapa2, etapa3, etapa4 } = laudo;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Laudo Psicossocial - ${etapa1.empresaAvaliada}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.4;
          color: #1f2937;
          background: white;
          padding: 0;
          margin: 0;
          font-size: 9pt;
        }

        .container {
          max-width: 100%;
          margin: 0;
          background: white;
          padding: 15mm;
        }

        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e5e7eb;
        }

        .header h1 {
          font-size: 18pt;
          font-weight: bold;
          color: #111827;
          margin-bottom: 4px;
        }

        .header h2 {
          font-size: 11pt;
          color: #4b5563;
          margin-bottom: 4px;
        }

        .header p {
          font-size: 9pt;
          color: #6b7280;
          font-weight: 500;
        }

        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 12pt;
          font-weight: bold;
          color: #111827;
          margin-bottom: 10px;
          padding-bottom: 4px;
          border-bottom: 2px solid #fb923c;
        }

        .subsection-title {
          font-size: 13pt;
          font-weight: 600;
          color: #111827;
          margin-bottom: 12px;
          margin-top: 20px;
        }

        .empresa-info {
          background-color: #f9fafb;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 10px;
        }

        .empresa-info p {
          margin-bottom: 4px;
          font-size: 9pt;
        }

        .info-label {
          font-weight: 600;
          color: #374151;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 8pt;
        }

        th, td {
          border: 1px solid #d1d5db;
          padding: 6px 8px;
          text-align: left;
        }

        th {
          background-color: #3b82f6;
          color: white;
          font-weight: 600;
        }

        tr:nth-child(even) {
          background-color: #f9fafb;
        }

        .score-baixo {
          color: #10b981;
          font-weight: 600;
        }

        .score-medio {
          color: #f59e0b;
          font-weight: 600;
        }

        .score-alto {
          color: #ef4444;
          font-weight: 600;
        }

        .recomendacao {
          background-color: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 8px;
          margin-bottom: 10px;
        }

        .recomendacao-item {
          margin-bottom: 6px;
          padding-left: 8px;
        }

        .interpretacao {
          background-color: #dbeafe;
          border-left: 4px solid #3b82f6;
          padding: 8px;
          margin-bottom: 10px;
        }

        .observacoes {
          background-color: #f0fdf4;
          border: 1px solid #86efac;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 10px;
        }

        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          font-size: 8pt;
          color: #6b7280;
        }

        .assinatura {
          margin-top: 40px;
          text-align: center;
        }

        .assinatura-linha {
          border-top: 1px solid #000;
          width: 300px;
          margin: 0 auto 8px;
        }

        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- HEADER -->
        <div class="header">
          <h1>LAUDO PSICOSSOCIAL</h1>
          <h2>Avaliação de Fatores Psicossociais no Trabalho - COPSOQ</h2>
          <p>Copenhagen Psychosocial Questionnaire</p>
        </div>

        <!-- ETAPA 1: DADOS GERAIS -->
        <div class="section">
          <div class="section-title">1. IDENTIFICAÇÃO E DADOS GERAIS</div>
          
          <div class="subsection-title">Clínica Responsável</div>
          <div class="empresa-info">
            <p><span class="info-label">Nome:</span> ${etapa1.clinicaNome}</p>
            <p><span class="info-label">Endereço:</span> ${etapa1.clinicaEndereco}</p>
            <p><span class="info-label">Telefone:</span> ${etapa1.clinicaTelefone}</p>
            <p><span class="info-label">E-mail:</span> ${etapa1.clinicaEmail}</p>
          </div>

          <div class="subsection-title">Empresa Avaliada</div>
          <div class="empresa-info">
            <p><span class="info-label">Razão Social:</span> ${etapa1.empresaAvaliada}</p>
            <p><span class="info-label">CNPJ:</span> ${etapa1.empresaCnpj}</p>
            <p><span class="info-label">Endereço:</span> ${etapa1.empresaEndereco}</p>
            <p><span class="info-label">Setor Avaliado:</span> ${etapa1.setorAvaliado}</p>
          </div>

          <div class="subsection-title">Responsável Técnico</div>
          <div class="empresa-info">
            <p><span class="info-label">Nome:</span> ${etapa1.responsavelTecnico}</p>
            <p><span class="info-label">Registro Profissional:</span> ${etapa1.registroProfissional}</p>
          </div>

          <div class="subsection-title">Informações da Avaliação</div>
          <div class="empresa-info">
            <p><span class="info-label">Data da Avaliação:</span> ${new Date(etapa1.dataAvaliacao).toLocaleDateString('pt-BR')}</p>
            <p><span class="info-label">Total de Funcionários Avaliados:</span> ${etapa1.totalFuncionarios}</p>
            <p><span class="info-label">Gestão:</span> ${etapa1.gestao} | <span class="info-label">Operacional:</span> ${etapa1.operacional}</p>
          </div>
        </div>

        <!-- ETAPA 2: SCORES E CLASSIFICAÇÃO -->
        <div class="section">
          <div class="section-title">2. RESULTADOS POR DIMENSÃO</div>
          <table>
            <thead>
              <tr>
                <th>Dimensão</th>
                <th>Domínio</th>
                <th style="text-align: center;">Média</th>
                <th style="text-align: center;">Classificação</th>
              </tr>
            </thead>
            <tbody>
              ${etapa2.map(grupo => {
                let scoreClass = 'score-baixo';
                if (grupo.classificacao.includes('Médio')) scoreClass = 'score-medio';
                if (grupo.classificacao.includes('Alto')) scoreClass = 'score-alto';
                
                return `
                  <tr>
                    <td>${grupo.grupoTitulo}</td>
                    <td>${grupo.dominio}</td>
                    <td style="text-align: center;">${grupo.mediaNumerica.toFixed(1)}</td>
                    <td class="${scoreClass}" style="text-align: center;">${grupo.classificacao}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- ETAPA 3: INTERPRETAÇÃO E RECOMENDAÇÕES -->
        <div class="section">
          <div class="section-title">3. INTERPRETAÇÃO E RECOMENDAÇÕES</div>
          ${etapa3.map(grupo => `
            <div class="subsection-title">${grupo.grupoTitulo}</div>
            
            <div class="interpretacao">
              <strong>Interpretação:</strong><br>
              ${grupo.interpretacao}
            </div>

            ${grupo.recomendacoes.length > 0 ? `
              <div class="recomendacao">
                <strong>Recomendações:</strong>
                ${grupo.recomendacoes.map(rec => `
                  <div class="recomendacao-item">• ${rec}</div>
                `).join('')}
              </div>
            ` : ''}
          `).join('')}
        </div>

        <!-- ETAPA 4: OBSERVAÇÕES E CONCLUSÃO -->
        <div class="section">
          <div class="section-title">4. OBSERVAÇÕES E CONCLUSÃO</div>
          
          <div class="subsection-title">Observações Gerais</div>
          <div class="observacoes">
            ${etapa4.observacoes}
          </div>

          <div class="subsection-title">Conclusão</div>
          <div class="observacoes">
            ${etapa4.conclusao}
          </div>
        </div>

        <!-- ASSINATURA -->
        <div class="assinatura">
          <div class="assinatura-linha"></div>
          <p><strong>${etapa1.responsavelTecnico}</strong></p>
          <p>${etapa1.registroProfissional}</p>
          <p>Data de Emissão: ${new Date(etapa4.dataEmissao).toLocaleDateString('pt-BR')}</p>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <p>Este laudo foi gerado com base no questionário COPSOQ (Copenhagen Psychosocial Questionnaire)</p>
          <p>Documento confidencial - Uso restrito à empresa contratante</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function gerarLaudoPDF(laudo: LaudoData, nomeArquivo?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const htmlContent = gerarHTMLLaudoCompleto(laudo);
      
      // Criar um elemento temporário para renderizar o HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      document.body.appendChild(tempDiv);

      const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: nomeArquivo || `laudo-${laudo.etapa1.empresaAvaliada.replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' as const
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      html2pdf()
        .set(options)
        .from(tempDiv)
        .save()
        .then(() => {
          // Remover elemento temporário
          document.body.removeChild(tempDiv);
          resolve();
        })
        .catch((error: Error) => {
          // Remover elemento temporário em caso de erro
          if (document.body.contains(tempDiv)) {
            document.body.removeChild(tempDiv);
          }
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
}
