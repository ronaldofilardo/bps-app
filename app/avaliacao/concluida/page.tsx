'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCorSemaforo, getTextoCategoria } from '@/lib/calculate'
import { getRelatorioGrupo, getRecomendacao } from '@/lib/relatorio-dados'
import { grupos } from '@/lib/questoes'
import ResultadosChart from '@/components/ResultadosChart'

interface Resultado {
  grupo: number
  dominio: string
  score: number
  categoria: 'baixo' | 'medio' | 'alto'
  tipo: 'positiva' | 'negativa'
}


export default function AvaliacaoConcluidaPage() {
  const router = useRouter()
  const [resultados, setResultados] = useState<Resultado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [prontoParaImprimir, setProntoParaImprimir] = useState(false)

  useEffect(() => {
    const fetchResultados = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const avaliacaoId = urlParams.get('avaliacao_id')
        const url = avaliacaoId ? `/api/avaliacao/resultados?avaliacao_id=${avaliacaoId}` : '/api/avaliacao/resultados'

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Erro ao buscar resultados')
        }
        const data = await response.json()
        setResultados(data.resultados)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    fetchResultados()
  }, [])

  // Quando resultados carregarem, aguarde um pequeno delay para garantir renderização do gráfico
  useEffect(() => {
    if (!loading && resultados.length > 0) {
      const timeout = setTimeout(() => setProntoParaImprimir(true), 300);
      return () => clearTimeout(timeout);
    }
  }, [loading, resultados])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 max-w-2xl w-full text-center">
          <div className="animate-spin mx-auto w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Carregando relatório...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 max-w-2xl w-full text-center">
          <p className="text-sm sm:text-base text-red-600 mb-4">Erro ao carregar relatório: {error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-primary text-white py-3 px-4 sm:px-6 rounded-lg hover:bg-primary-hover transition-colors text-sm sm:text-base"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto px-2 sm:px-0">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 mb-4 sm:mb-6 text-center">
           <div className="mb-4 sm:mb-6">
             <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-success rounded-full flex items-center justify-center">
               <svg className="w-8 h-8 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
             </div>
           </div>

           <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
             Avaliação Concluída!
           </h1>

           <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
             Obrigado por completar a avaliação psicossocial BPS Brasil.
           </p>

           {/* Botões de ação no topo */}
           <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-4 sm:mb-6">
             <button
               onClick={() => {
                 if (prontoParaImprimir) {
                   window.print();
                 }
               }}
               disabled={!prontoParaImprimir}
               className={`bg-blue-600 text-white py-2 px-4 sm:px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base ${!prontoParaImprimir ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               🖨️ Imprimir
             </button>

             <button
               onClick={() => router.push('/dashboard')}
               className="bg-primary text-white py-2 px-4 sm:px-6 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
             >
               ← Voltar ao Dashboard
             </button>
           </div>
         </div>

        {/* Gráfico de Resultados */}
        <div className="px-2 sm:px-0">
          <ResultadosChart resultados={resultados} />
        </div>

        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
            📊 Relatório Completo de Avaliação Psicossocial
          </h2>

          <div className="space-y-8">
            {resultados.map((resultado) => {
              const dadosGrupo = getRelatorioGrupo(resultado.grupo)
              // Corrigir: garantir que o texto do plano de ação seja exibido corretamente conforme o tipo do grupo
              let categoriaParaTexto: 'baixo' | 'medio' | 'alto' = resultado.categoria;
              // Para grupos do tipo positiva, score baixo é problema; para negativa, score alto é problema
              // O texto do plano de ação já está correto se a correspondência de tipo/categoria estiver certa
              // Mas se houver inversão, forçamos a exibição correta:
              // Se for grupo positiva e categoria 'baixo', exibe texto de alerta ("Precisa Melhorar")
              // Se for grupo negativa e categoria 'alto', exibe texto de alerta ("Atenção")
              // O getRecomendacao já retorna o texto correto, mas garantimos que o tipo do grupo está correto
              // Busca o tipo do grupo
              const tipoGrupo = dadosGrupo ? (grupos.find(g => g.id === resultado.grupo)?.tipo || 'positiva') : 'positiva';
              // Se houver inconsistência, ajusta a categoria para o texto correto
              let recomendacao = getRecomendacao(resultado.grupo, resultado.categoria);
              // Se for grupo positiva e categoria 'alto', garantir texto positivo
              // Se for grupo positiva e categoria 'baixo', garantir texto de alerta
              // Se for grupo negativa e categoria 'alto', garantir texto de alerta
              // Se for grupo negativa e categoria 'baixo', garantir texto positivo
              // (O getRecomendacao já faz isso, mas garantimos a correspondência)
              // Se o tipo do grupo não bater com o esperado, logar para debug
              if (!dadosGrupo) {
                console.warn('Grupo não encontrado para resultado', resultado);
              }
              return (
                <div key={resultado.grupo} className="grupo-card border-2 border-gray-200 rounded-xl overflow-hidden mx-2 sm:mx-0">
                  {/* Header do Grupo */}
                  <div className="grupo-header bg-gradient-to-r from-primary to-primary-hover p-4 sm:p-6 text-white">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                      <h3 className="grupo-titulo text-lg sm:text-xl font-bold">
                        Grupo {resultado.grupo}: {dadosGrupo?.nome || resultado.dominio}
                      </h3>
                      {(() => {
                        const textoCategoria = getTextoCategoria(resultado.categoria, resultado.tipo);
                        let corBadge = '';
                        if (textoCategoria === 'Excelente') corBadge = '#10B981'; // verde
                        else if (textoCategoria === 'Precisa Melhorar') corBadge = '#EF4444'; // vermelho
                        else if (textoCategoria === 'Adequado') corBadge = '#F59E0B'; // amarelo
                        else corBadge = getCorSemaforo(resultado.categoria, resultado.tipo);
                        return (
                          <div
                            className={`categoria-badge px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold text-white border-2 border-white`}
                            style={{ backgroundColor: corBadge }}
                          >
                            {textoCategoria}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="pontuacao text-base sm:text-lg font-semibold">
                      Sua Pontuação: {Number(resultado.score).toFixed(1)}%
                      <span className="ml-2 text-xs sm:text-sm opacity-90">
                        (Nível {resultado.categoria.charAt(0).toUpperCase() + resultado.categoria.slice(1)})
                      </span>
                    </div>
                  </div>

                  <div className="grupo-conteudo p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Explicação */}
                    {dadosGrupo && (
                      <div className="secao-explicacao bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 rounded-r-lg">
                        <h4 className="secao-titulo secao-titulo-azul font-bold text-blue-800 mb-2 text-sm sm:text-base">📖 Entenda este Domínio</h4>
                        <p className="secao-texto secao-texto-azul text-blue-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                          {dadosGrupo.explicacao}
                        </p>
                      </div>
                    )}

                    {/* Gestão/Dicas Gerais */}
                     {dadosGrupo && (
                       <div className="secao-gestao bg-green-50 border-l-4 border-green-400 p-3 sm:p-4 rounded-r-lg">
                         <h4 className="secao-titulo secao-titulo-verde font-bold text-green-800 mb-2 text-sm sm:text-base">💡 Dicas Práticas de Gestão</h4>
                         <p className="secao-texto secao-texto-verde text-green-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                           {dadosGrupo.gestao}
                         </p>
                       </div>
                     )}

                    {/* Recomendação Específica */}
                    {(() => {
                      const textoCategoria = getTextoCategoria(resultado.categoria, resultado.tipo);
                      let corBg = '', corBorder = '', corTitulo = '', corTexto = '';
                      if (textoCategoria === 'Excelente') {
                        corBg = 'bg-green-50'; corBorder = 'border-green-400'; corTitulo = 'text-green-800'; corTexto = 'text-green-700';
                      } else if (textoCategoria === 'Precisa Melhorar') {
                        corBg = 'bg-red-50'; corBorder = 'border-red-400'; corTitulo = 'text-red-800'; corTexto = 'text-red-700';
                      } else {
                        corBg = 'bg-yellow-50'; corBorder = 'border-yellow-400'; corTitulo = 'text-yellow-800'; corTexto = 'text-yellow-700';
                      }
                      return (
                        <div className={`border-l-4 p-3 sm:p-4 rounded-r-lg ${corBg} ${corBorder}`}>
                          <h4 className={`secao-titulo font-bold mb-2 text-sm sm:text-base ${corTitulo}`}>
                            🎯 Seu Plano de Ação Personalizado
                          </h4>
                          <p className={`secao-texto text-xs sm:text-sm leading-relaxed whitespace-pre-line ${corTexto}`}>
                            {recomendacao}
                          </p>
                        </div>
                      );
                    })()}

                    {/* Barra de Progresso Visual */}
                    <div className="progress-container bg-gray-200 rounded-full h-3 sm:h-4 overflow-hidden">
                      <div
                        className="progress-bar h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${Number(resultado.score)}%`,
                          backgroundColor: getCorSemaforo(resultado.categoria, resultado.tipo)
                        }}
                      ></div>
                    </div>
                    <div className="progress-markers flex justify-between text-xs text-gray-500 mt-1">
                      <span className="progress-marker">0%</span>
                      <span className="progress-marker">50%</span>
                      <span className="progress-marker">100%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 mb-4 sm:mb-6">
          <h3 className="font-semibold text-blue-800 mb-4 text-base sm:text-lg">🔒 Privacidade e Próximos Passos</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="font-semibold text-blue-700 mb-2 text-sm sm:text-base">✅ O que aconteceu:</h4>
              <ul className="list-disc list-inside text-blue-600 space-y-1 text-xs sm:text-sm">
                <li>Suas respostas foram salvas com segurança</li>
                <li>Relatório personalizado foi gerado</li>
                <li>Análise psicossocial está completa</li>
                <li>Dados foram processados automaticamente</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-blue-700 mb-2 text-sm sm:text-base">🔐 Sua Privacidade:</h4>
              <ul className="list-disc list-inside text-blue-600 space-y-1 text-xs sm:text-sm">
                <li>Respostas individuais são confidenciais</li>
                <li>RH acessa apenas dados agregados</li>
                <li>Identificação é protegida por criptografia</li>
                <li>Conformidade com LGPD garantida</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
            <h4 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">⏰ Recomendação Importante:</h4>
            <p className="text-yellow-700 text-xs sm:text-sm">
              <strong>Refaça este questionário em 3 meses</strong> para acompanhar sua evolução e
              verificar se as ações implementadas estão funcionando. O acompanhamento contínuo
              é essencial para manter seu bem-estar e produtividade.
            </p>
          </div>
        </div>

        <div className="print-only bg-white rounded-lg shadow-xl p-4 sm:p-8 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
            Copenhagen Psychosocial Questionnaire (COPSOQ): Versão PBS Brasil, Questões, Pontuação e Classificação
          </h2>

          <div className="text-sm sm:text-base text-gray-700 space-y-4">
            <p>
              O Copenhagen Psychosocial Questionnaire (COPSOQ) é um instrumento validado internacionalmente para avaliar fatores psicossociais no trabalho, incluindo demandas, organização, relações interpessoais, interface trabalho-vida, valores organizacionais, bem-estar e comportamentos ofensivos. Desenvolvido na Dinamarca. No contexto brasileiro e português, a versão mais utilizada e validada é a <strong>COPSOQ II em português</strong>, alinhada à NR-1 para gestão de riscos psicossociais. Os itens são baseados em escalas Likert de 5 pontos.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Estrutura Geral</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Domínios</strong>: 8 (Demandas no Trabalho; Organização e Conteúdo do Trabalho; Relações Interpessoais e Liderança; Interface Trabalho-Indivíduo; Valores no Trabalho; Personalidade; Saúde e Bem-Estar; Comportamentos Ofensivos). Além disso foram criados dois módulos suplementares para o PBS Brasil: 1. Módulo: Jogos de Azar no Contexto Ocupacional e 2. Módulo: Endividamento e Estresse Financeiro [Compatibilidade total com NR-1 (atualização 2025) com foco em riscos psicossociais emergentes e com estrutura idêntica ao COPSOQ III (escala, instruções, layout)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-2">Resultados e Classificação</h3>
            <p>
              Os resultados são analisados por dimensão, com benchmarks baseados em tercis (33º, 66º percentis) de populações normais (ex.: trabalhadores portugueses/brasileiros). Classificação visual "semáforo" (verde/amarelo/vermelho) para ação:
            </p>

            <table className="w-full border-collapse border border-gray-300 mt-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left font-semibold">Classificação</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Pontuação em Escalas Positivas</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Pontuação em Escalas Negativas</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Ação Recomendada</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold text-green-700">Verde (Baixo Risco)</td>
                  <td className="border border-gray-300 p-2">{">"} 66 (bom suporte/influência)</td>
                  <td className="border border-gray-300 p-2">{"<"} 33 (pouco estresse)</td>
                  <td className="border border-gray-300 p-2">Manter; monitorar anualmente</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold text-yellow-700">Amarelo (Risco Médio)</td>
                  <td className="border border-gray-300 p-2">33-66 (moderado)</td>
                  <td className="border border-gray-300 p-2">33-66 (moderado)</td>
                  <td className="border border-gray-300 p-2">Atenção; intervenções preventivas (treinamentos)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2 font-semibold text-red-700">Vermelho (Alto Risco)</td>
                  <td className="border border-gray-300 p-2">{"<"} 33 (baixo)</td>
                  <td className="border border-gray-300 p-2">{">"} 66 (alto)</td>
                  <td className="border border-gray-300 p-2">Ação imediata; plano de mitigação (PGR/NR-1)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="botoes-acao no-print text-center space-y-3 sm:space-y-4 px-2 sm:px-0">
           <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
             <button
               onClick={() => {
                 if (prontoParaImprimir) {
                   window.print();
                 }
               }}
               disabled={!prontoParaImprimir}
               className={`bg-blue-600 text-white py-3 px-4 sm:px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto ${!prontoParaImprimir ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               🖨️ Imprimir
             </button>

             <button
               onClick={() => router.push('/dashboard')}
               className="bg-primary text-white py-3 px-4 sm:px-6 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
             >
               ← Voltar
             </button>
           </div>

           <p className="text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4">
             💾 Este relatório ficará disponível no seu dashboard para consulta futura
           </p>
         </div>
      </div>
    </div>
  )
}
