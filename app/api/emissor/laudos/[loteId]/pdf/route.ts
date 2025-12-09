import { requireRole } from "@/lib/session"
import { query } from "@/lib/db"
import { NextResponse } from "next/server"
import puppeteer from 'puppeteer'
import { gerarDadosGeraisEmpresa, calcularScoresPorGrupo, gerarInterpretacaoRecomendacoes, gerarObservacoesConclusao } from "@/lib/laudo-calculos"

export const dynamic = 'force-dynamic';

// Função para gerar HTML do laudo completo
function gerarHTMLLaudoCompleto(laudoPadronizado: any): string {
  const { etapa1, etapa2, etapa3, etapa4 } = laudoPadronizado

  const html = `
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
          line-height: 1.4;
          font-size: 8pt;
        }

        .empresa-info strong {
          color: #6b7280;
          font-size: 7pt;
          font-weight: 600;
          display: inline;
          margin-right: 4px;
        }

        .empresa-info span {
          color: #111827;
          font-size: 8pt;
          font-weight: 500;
        }

        /* Cards Laranja - Estilo BPS */
        .grupo-card {
          background: linear-gradient(to right, #f97316, #ea580c);
          border-radius: 8px;
          margin-bottom: 20px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          page-break-inside: avoid;
        }

        .grupo-card-header {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .grupo-card-title {
          color: white;
          font-size: 14pt;
          font-weight: bold;
        }

        .grupo-card-subtitle {
          color: #fed7aa;
          font-size: 9pt;
          font-style: italic;
          margin-top: 4px;
        }

        .badge {
          background: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 9pt;
          border: 2px solid;
        }

        .badge-adequado { color: #15803d; border-color: #bbf7d0; }
        .badge-atencao { color: #a16207; border-color: #fef08a; }
        .badge-critico { color: #b91c1c; border-color: #fecaca; }

        .grupo-card-body {
          background: white;
          padding: 20px;
        }

        .pontuacao {
          margin-bottom: 20px;
        }

        .pontuacao-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .pontuacao-valor {
          font-size: 18pt;
          font-weight: bold;
          color: #ea580c;
        }

        .progress-bar {
          width: 100%;
          height: 28px;
          background: #e5e7eb;
          border-radius: 20px;
          position: relative;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 20px;
          position: absolute;
          left: 0;
          top: 0;
        }

        .progress-fill-verde { background: linear-gradient(to right, #4ade80, #22c55e); }
        .progress-fill-amarelo { background: linear-gradient(to right, #facc15, #eab308); }
        .progress-fill-vermelho { background: linear-gradient(to right, #f87171, #ef4444); }

        .progress-labels {
          position: absolute;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 8px;
          font-size: 8pt;
          font-weight: 600;
          color: #4b5563;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 15px;
          text-align: center;
        }

        .stat-item p:first-child {
          font-size: 8pt;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .stat-item p:last-child {
          font-size: 12pt;
          font-weight: 600;
          color: #111827;
        }

        .stat-media {
          color: #ea580c !important;
        }

        .acao-box {
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .acao-verde { background: #f0fdf4; border-color: #4ade80; }
        .acao-amarelo { background: #fefce8; border-color: #facc15; }
        .acao-vermelho { background: #fef2f2; border-color: #f87171; }

        .acao-box p:first-child {
          font-size: 9pt;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 6px;
        }

        .acao-box p:last-child {
          font-size: 10pt;
          color: #1f2937;
        }

        /* Blocos Coloridos */
        .info-box {
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid;
        }

        .info-box-azul {
          background: linear-gradient(to right, #dbeafe, #bfdbfe);
          border-color: #3b82f6;
        }

        .info-box-verde {
          background: linear-gradient(to right, #d1fae5, #a7f3d0);
          border-color: #10b981;
        }

        .info-box-amarelo {
          background: linear-gradient(to right, #fef3c7, #fde68a);
          border-color: #f59e0b;
        }

        .info-box h3 {
          font-size: 12pt;
          font-weight: bold;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
        }

        .info-box p {
          font-size: 10pt;
          line-height: 1.7;
        }

        .resumo-grid {
          display: flex;
          flex-direction: row;
          gap: 20px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .resumo-card {
          padding: 18px;
          border-radius: 8px;
          border: 2px solid;
        }

        .resumo-card-verde {
          background: linear-gradient(to bottom right, #f0fdf4, #dcfce7);
          border-color: #86efac;
        }

        .resumo-card-amarelo {
          background: linear-gradient(to bottom right, #fefce8, #fef9c3);
          border-color: #fde047;
        }

        .resumo-card-laranja {
          background: linear-gradient(to bottom right, #fff7ed, #ffedd5);
          border-color: #fdba74;
        }

        .resumo-card-vermelho {
          background: linear-gradient(to bottom right, #fef2f2, #fee2e2);
          border-color: #fca5a5;
        }

        .resumo-card h4 {
          font-size: 11pt;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .resumo-card p {
          font-size: 8pt;
          margin-bottom: 8px;
        }

        .resumo-card ul {
          list-style: none;
          padding: 0;
        }

        .resumo-card li {
          font-size: 9pt;
          margin-bottom: 4px;
        }

        .conclusao {
          margin-top: 30px;
          font-weight: 500;
          text-align: justify;
          line-height: 1.8;
        }

        .assinatura {
          margin-top: 60px;
          text-align: center;
          page-break-inside: avoid;
        }

        .assinatura .data {
          margin-bottom: 50px;
          font-weight: 500;
          color: #4b5563;
        }

        .assinatura .linha {
          border-bottom: 2px solid #6b7280;
          width: 400px;
          margin: 0 auto 8px auto;
        }

        .assinatura p {
          font-size: 11pt;
          color: #1f2937;
        }

        .assinatura .nome {
          font-weight: bold;
          font-size: 12pt;
        }

        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 9pt;
          text-align: center;
          color: #6b7280;
        }

        .legenda {
          background: #dbeafe;
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 15px;
          border-left: 4px solid #3b82f6;
        }

        .legenda p {
          font-size: 9pt;
          color: #1e40af;
          margin-bottom: 4px;
        }

        @page {
          margin: 10mm;
          size: A4;
        }

        @media print {
          body {
            background: white;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>LAUDO PSICOSSOCIAL</h1>
          <h2>Avaliação de Saúde Mental no Trabalho</h2>
          <p>Baseada no instrumento COPSOQ II</p>
        </div>

        <!-- Etapa 1: Dados Gerais da Empresa -->
        <div class="section">
          <div class="section-title">1. DADOS GERAIS DA EMPRESA AVALIADA</div>
          <div class="empresa-info">
            <p><strong>Empresa Avaliada:</strong> <span>${etapa1.empresaAvaliada}</span></p>
            <p><strong>CNPJ:</strong> <span>${etapa1.cnpj}</span></p>
            <p><strong>Endereço:</strong> <span>${etapa1.endereco}</span></p>
            <p><strong>Período das Avaliações Consideradas:</strong> <span>${etapa1.periodoAvaliacoes.dataLiberacao} a ${etapa1.periodoAvaliacoes.dataUltimaConclusao}</span></p>
            <p><strong>Total de Funcionários Avaliados:</strong> <span>${etapa1.totalFuncionariosAvaliados} (${etapa1.percentualConclusao}% das avaliações liberadas foram concluídas)</span></p>
            <p><strong>Amostra:</strong> <span>${etapa1.amostra.operacional} funcionários do nível Operacional + ${etapa1.amostra.gestao} do nível Gestão</span></p>
          </div>
        </div>

        <!-- Etapa 2: Scores por Grupo em Tabela -->
        ${etapa2 ? `
        <div class="section">
          <div class="section-title">2. SCORES MÉDIOS POR GRUPO DE QUESTÕES (escala 0-100)</div>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 7pt; margin-top: 10px;">
            <thead>
              <tr style="background: linear-gradient(to right, #f97316, #ea580c);">
                <th style="border: 1px solid #fb923c; padding: 4px 6px; text-align: center; color: white; font-weight: bold; font-size: 7pt; min-width: 40px;">
                  Grupo
                </th>
                <th style="border: 1px solid #fb923c; padding: 4px 6px; text-align: left; color: white; font-weight: bold; font-size: 7pt;">
                  Domínio
                </th>
                <th style="border: 1px solid #fb923c; padding: 4px 6px; text-align: left; color: white; font-weight: bold; font-size: 7pt;">
                  Descrição
                </th>
                <th style="border: 1px solid #fb923c; padding: 4px 6px; text-align: center; color: white; font-weight: bold; font-size: 7pt;">
                  Tipo
                </th>
                <th style="border: 1px solid #fb923c; padding: 4px 6px; text-align: center; color: white; font-weight: bold; font-size: 7pt;">
                  x̄ - s
                </th>
                <th style="border: 1px solid #fb923c; padding: 4px 6px; text-align: center; color: white; font-weight: bold; font-size: 7pt;">
                  Média Geral
                </th>
                <th style="border: 1px solid #fb923c; padding: 4px 6px; text-align: center; color: white; font-weight: bold; font-size: 7pt;">
                  x̄ + s
                </th>
                <th style="border: 1px solid #fb923c; padding: 4px 6px; text-align: center; color: white; font-weight: bold; font-size: 7pt;">
                  Categoria de Risco
                </th>
              </tr>
            </thead>
            <tbody>
              ${etapa2.map((score: any, index: number) => {
                const bgColor = index % 2 === 0 ? '#fff7ed' : '#ffffff';
                const badgeColor = score.classificacaoSemaforo === 'verde' ? '#dcfce7' : 
                                   score.classificacaoSemaforo === 'amarelo' ? '#fef9c3' : '#fee2e2';
                const badgeTextColor = score.classificacaoSemaforo === 'verde' ? '#15803d' :
                                       score.classificacaoSemaforo === 'amarelo' ? '#a16207' : '#b91c1c';
                const badgeText = score.categoriaRisco === 'baixo' ? 'Excelente' :
                                 score.categoriaRisco === 'medio' ? 'Monitorar' : 'Atenção Necessária';
                
                return `
                <tr style="background-color: ${bgColor};">
                  <td style="border: 1px solid #d1d5db; padding: 4px 6px; text-align: center; font-size: 7pt;">
                    <div style="display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; background-color: #fed7aa; color: #c2410c; font-weight: bold; text-align: center;">
                      ${score.grupo}
                    </div>
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 3px 6px; font-size: 7pt;">
                    ${score.dominio}
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 3px 6px; font-size: 7pt; color: #4b5563;">
                    ${score.descricao}
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 3px 6px; text-align: center; font-size: 7pt;">
                    <span style="display: inline-block; padding: 2px 6px; font-size: 6pt; font-weight: bold; border-radius: 3px; background-color: ${score.tipo === 'positiva' ? '#dbeafe' : '#f3e8ff'}; color: ${score.tipo === 'positiva' ? '#1e40af' : '#6b21a8'};">
                      ${score.tipo === 'positiva' ? 'Positiva' : 'Negativa'}
                    </span>
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 3px 6px; text-align: center; font-size: 7pt; color: #4b5563;">
                    ${score.mediaMenosDP.toFixed(1)}
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 3px 6px; text-align: center; font-size: 7pt; font-weight: bold; color: #111827;">
                    ${score.media.toFixed(1)}
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 3px 6px; text-align: center; font-size: 7pt; color: #4b5563;">
                    ${score.mediaMaisDP.toFixed(1)}
                  </td>
                  <td style="border: 1px solid #d1d5db; padding: 3px 6px; text-align: center;">
                    <span style="display: inline-block; padding: 2px 6px; font-size: 6pt; font-weight: bold; border-radius: 3px; background-color: ${badgeColor}; color: ${badgeTextColor};">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="legenda" style="margin-top: 8px; padding: 6px 10px;">
            <p style="font-size: 7pt;"><strong>x̄</strong> = média, <strong>s</strong> = desvio-padrão</p>
          </div>

          <div style="margin-top: 15px; padding: 10px; background-color: #f9fafb; border-radius: 4px; border-left: 4px solid #fb923c;">
            <p style="font-size: 9pt; line-height: 1.4; color: #374151; text-align: justify;">
              A amostragem acima descrita foi submetida à avaliação psicossocial para verificação de seu estado de saúde mental, como condição necessária à realização do trabalho. Durante o período da avaliação, foi possível identificar os pontos acima descritos.
            </p>
          </div>
        </div>
        ` : ''}

        <!-- Etapa 3: Interpretação e Recomendações -->
        ${etapa3 ? `
        <div class="section">
          <div class="section-title">3. INTERPRETAÇÃO E RECOMENDAÇÕES</div>

          <div class="info-box info-box-azul">
            <p>${etapa3.conclusao}</p>
          </div>

          <div class="resumo-grid">
            ${etapa3.gruposExcelente && etapa3.gruposExcelente.length > 0 ? `
            <div class="resumo-card resumo-card-verde">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 16pt; margin-right: 8px;">🟢</span>
                <h4 style="color: #15803d;">1. Risco Psicossocial Baixo (menor que 33%)</h4>
              </div>
              <p style="color: #166534; font-weight: 600; margin-bottom: 8px;">Consideração final detalhada:</p>
              <p style="color: #15803d; font-size: 9pt; line-height: 1.4; margin-bottom: 8px;">
                Os resultados obtidos no Questionário Psicossocial de Copenhague (COPSOQ) indicam um baixo risco psicossocial no ambiente de trabalho, correspondendo ao tertil inferior de exposição a fatores de risco. Isso significa que, de modo geral, as condições organizacionais favorecem o bem-estar e a saúde mental dos trabalhadores. Os fatores psicossociais avaliados — como demandas quantitativas, emocionais, apoio social, influência no trabalho, reconhecimento e equilíbrio entre vida pessoal e profissional — estão sendo geridos de forma adequada, sem evidências de impactos negativos relevantes.
              </p>
              <p style="color: #15803d; font-size: 9pt; line-height: 1.4; margin-bottom: 8px;">
                De acordo com a NR-01, um cenário de baixo risco não elimina a necessidade de monitoramento contínuo, mas demonstra que as ações preventivas e de promoção à saúde mental estão sendo eficazes. Recomenda-se que a organização mantenha as boas práticas atuais, como:
              </p>
              <ul style="color: #15803d; font-size: 9pt; margin-left: 16px; margin-bottom: 8px;">
                <li>• Comunicação aberta entre equipes e gestores;</li>
                <li>• Políticas de reconhecimento e valorização profissional;</li>
                <li>• Programas de qualidade de vida e equilíbrio emocional;</li>
                <li>• Incentivo ao diálogo e à escuta ativa em todos os níveis hierárquicos.</li>
              </ul>
              <p style="color: #15803d; font-size: 9pt; line-height: 1.4;">
                Mesmo em ambientes com baixo risco, a manutenção do clima organizacional e da motivação depende de atenção constante. Sugere-se incluir este resultado no Inventário de Riscos do Programa de Gerenciamento de Riscos (PGR), assegurando que as condições favoráveis atuais sejam acompanhadas e mantidas de forma sistemática, alinhando-se às diretrizes do COPSOQ para avaliações periódicas.
              </p>
              <div style="margin-top: 12px;">
                <p style="color: #166534; font-weight: 600; font-size: 8pt; margin-bottom: 4px;">Grupos identificados:</p>
                <ul>
                  ${etapa3.gruposExcelente.map((g: any) => `<li style="color: #15803d; font-size: 9pt;">• ${g.grupo} - ${g.dominio}</li>`).join('')}
                </ul>
              </div>
            </div>
            ` : ''}

            ${etapa3.gruposMonitoramento && etapa3.gruposMonitoramento.length > 0 ? `
            <div class="resumo-card resumo-card-amarelo">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 16pt; margin-right: 8px;">🟡</span>
                <h4 style="color: #a16207;">2. Risco Psicossocial Moderado (entre 33% e 66%)</h4>
              </div>
              <p style="color: #a16207; font-weight: 600; margin-bottom: 8px;">Consideração final detalhada:</p>
              <p style="color: #a16207; font-size: 9pt; line-height: 1.4; margin-bottom: 8px;">
                O resultado do Questionário Psicossocial de Copenhague (COPSOQ) aponta para um nível moderado de risco psicossocial, correspondendo ao tertil médio de exposição, indicando que o ambiente de trabalho apresenta algumas situações ou percepções que merecem atenção preventiva. Isso pode envolver fatores como demandas moderadas de trabalho, falhas na comunicação interna, falta de clareza nas metas, períodos de estresse temporário ou desafios pontuais no relacionamento entre equipes e gestores.
              </p>
              <p style="color: #a16207; font-size: 9pt; line-height: 1.4; margin-bottom: 8px;">
                Conforme a NR-01, cabe à organização identificar as causas desses resultados e implantar ações de controle e prevenção antes que se agravem. As medidas podem incluir:
              </p>
              <ul style="color: #a16207; font-size: 9pt; margin-left: 16px; margin-bottom: 8px;">
                <li>• Reuniões de alinhamento sobre papéis e responsabilidades;</li>
                <li>• Adequação das cargas e jornadas de trabalho;</li>
                <li>• Programas de apoio psicológico ou rodas de conversa internas;</li>
                <li>• Treinamentos voltados à gestão empática e ao fortalecimento do trabalho em equipe.</li>
              </ul>
              <p style="color: #a16207; font-size: 9pt; line-height: 1.4;">
                É essencial que essas ações sejam documentadas e acompanhadas no Programa de Gerenciamento de Riscos (PGR), com reavaliações periódicas para medir a eficácia das melhorias implementadas, utilizando os benchmarks do COPSOQ como referência. Embora o risco moderado não represente uma situação crítica, ele sinaliza pontos de atenção que, se não tratados, podem evoluir para um risco elevado no futuro.
              </p>
              <div style="margin-top: 12px;">
                <p style="color: #a16207; font-weight: 600; font-size: 8pt; margin-bottom: 4px;">Grupos identificados:</p>
                <ul>
                  ${etapa3.gruposMonitoramento.map((g: any) => `<li style="color: #a16207; font-size: 9pt;">• ${g.grupo} - ${g.dominio}</li>`).join('')}
                </ul>
              </div>
            </div>
            ` : ''}

            ${etapa3.gruposAltoRisco && etapa3.gruposAltoRisco.length > 0 ? `
            <div class="resumo-card resumo-card-vermelho">
              <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 16pt; margin-right: 8px;">🔴</span>
                <h4 style="color: #b91c1c;">3. Risco Psicossocial Elevado (maior que 66%)</h4>
              </div>
              <p style="color: #b91c1c; font-weight: 600; margin-bottom: 8px;">Consideração final detalhada:</p>
              <p style="color: #b91c1c; font-size: 9pt; line-height: 1.4; margin-bottom: 8px;">
                O resultado do Questionário Psicossocial de Copenhague (COPSOQ) indica um risco psicossocial elevado, correspondendo ao tertil superior de exposição, o que significa que há fatores importantes interferindo na saúde mental e emocional dos trabalhadores. Esse cenário pode estar relacionado a demandas altas de trabalho, falta de reconhecimento, pressão excessiva, ausência de apoio da liderança, conflitos interpessoais ou ambiente organizacional desgastante, potencialmente levando a condições como ansiedade, depressão ou burnout.
              </p>
              <p style="color: #b91c1c; font-size: 9pt; line-height: 1.4; margin-bottom: 8px;">
                Segundo a NR-01, quando um risco é classificado como elevado, a empresa deve agir de forma estruturada e imediata, buscando identificar as causas raiz e implantar medidas corretivas e preventivas eficazes. Essas medidas podem incluir:
              </p>
              <ul style="color: #b91c1c; font-size: 9pt; margin-left: 16px; margin-bottom: 8px;">
                <li>• Implementação de programas de apoio psicológico e escuta ativa;</li>
                <li>• Revisão de processos organizacionais e distribuição de tarefas;</li>
                <li>• Capacitação de gestores em liderança humanizada e prevenção de assédio moral;</li>
                <li>• Melhoria na comunicação interna e nos canais de feedback;</li>
                <li>• Promoção de ações voltadas à saúde mental e ao equilíbrio entre trabalho e vida pessoal, com intervenção prioritária.</li>
              </ul>
              <p style="color: #b91c1c; font-size: 9pt; line-height: 1.4;">
                Esse nível de risco exige registro detalhado no inventário de riscos do PGR, bem como acompanhamento contínuo por parte da alta gestão e dos responsáveis pelo SESMT ou equipe de saúde e segurança, alinhando-se aos critérios de risco do COPSOQ. A ausência de ações concretas pode gerar adoecimento ocupacional, absenteísmo e queda de produtividade, devendo a organização priorizar planos de intervenção imediata para mitigar os impactos.
              </p>
              <div style="margin-top: 12px;">
                <p style="color: #b91c1c; font-weight: 600; font-size: 8pt; margin-bottom: 4px;">Grupos identificados:</p>
                <ul>
                  ${etapa3.gruposAltoRisco.map((g: any) => `<li style="color: #b91c1c; font-size: 9pt;">• ${g.grupo} - ${g.dominio}</li>`).join('')}
                </ul>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Etapa 4: Observações e Conclusão -->
        ${etapa4 ? `
        <div class="section">
          <div class="section-title">4. OBSERVAÇÕES E CONCLUSÃO</div>

          ${etapa4.observacoesLaudo ? `
          <div class="subsection-title">Observações do Laudo</div>
          <div class="info-box info-box-azul">
            <p>${etapa4.observacoesLaudo.replace(/\n/g, '<br>')}</p>
          </div>
          ` : ''}

          <div class="subsection-title">Conclusão</div>
          <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 24px;">
            <div class="conclusao">
              <p>${etapa4.textoConclusao.replace(/\n/g, '<br>')}</p>
            </div>

            <div class="assinatura">
              <p class="data">${etapa4.dataEmissao}</p>
              <div class="linha"></div>
              <p class="nome">${etapa4.assinatura.nome}</p>
              <p style="font-weight: 600; margin-top: 4px;">${etapa4.assinatura.titulo} – ${etapa4.assinatura.registro}</p>
              <p style="margin-top: 4px;">${etapa4.assinatura.empresa}</p>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Documento gerado automaticamente pelo Sistema BPS Brasil</p>
          <p style="margin-top: 4px;">Data de geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
      </div>
    </body>
    </html>
  `

  return html
}

export const GET = async (req: Request, { params }: { params: { loteId: string } }) => {
  const user = await requireRole('emissor')
  if (!user) {
    return NextResponse.json({ error: "Acesso negado", success: false }, { status: 403 })
  }

  try {
    const loteId = parseInt(params.loteId)
    if (isNaN(loteId)) {
      return NextResponse.json({ error: "ID do lote inválido", success: false }, { status: 400 })
    }

    // Gerar dados completos do laudo
    const dadosGeraisEmpresa = await gerarDadosGeraisEmpresa(loteId)
    const scoresPorGrupo = await calcularScoresPorGrupo(loteId)
    const interpretacaoRecomendacoes = gerarInterpretacaoRecomendacoes(
      dadosGeraisEmpresa.empresaAvaliada,
      scoresPorGrupo
    )

    // Buscar observações do laudo
    const laudoResult = await query(`
      SELECT observacoes FROM laudos
      WHERE lote_id = $1 AND emissor_cpf = $2
    `, [loteId, user.cpf])

    const observacoes = laudoResult.rows[0]?.observacoes || ''
    const observacoesConclusao = gerarObservacoesConclusao(observacoes)

    const laudoPadronizado = {
      etapa1: dadosGeraisEmpresa,
      etapa2: scoresPorGrupo,
      etapa3: interpretacaoRecomendacoes,
      etapa4: observacoesConclusao
    }

    // Gerar HTML do laudo
    const html = gerarHTMLLaudoCompleto(laudoPadronizado)

    // Gerar PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    })

    await browser.close()

    // Gerar nome do arquivo
    const fileName = `laudo-${loteId}-${Date.now()}.pdf`

    // Atualizar laudo com timestamp
    await query(`
      UPDATE laudos
      SET atualizado_em = NOW()
      WHERE lote_id = $1 AND emissor_cpf = $2
    `, [loteId, user.cpf])

    console.log(`PDF gerado: ${fileName}`)

    // Retornar PDF para download
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })

  } catch (error) {
    console.error('Erro ao gerar PDF do laudo:', error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      success: false,
      detalhes: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}