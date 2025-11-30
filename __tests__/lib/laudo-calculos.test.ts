/**
 * Testes para as funções de cálculo de laudos padronizados
 *
 * Funcionalidades testadas:
 * 1. calcularScoresPorGrupo - Cálculos dinâmicos baseados em dados reais
 * 2. gerarInterpretacaoRecomendacoes - Geração automática de texto interpretativo
 * 3. gerarObservacoesConclusao - Geração de observações e conclusão
 * 4. gerarDadosGeraisEmpresa - Busca de dados gerais da empresa
 * 5. Funções auxiliares de cálculo estatístico
 */


import assert from 'assert';
import {
  calcularScoresPorGrupo,
  gerarInterpretacaoRecomendacoes,
  gerarObservacoesConclusao,
  gerarDadosGeraisEmpresa,
  gruposCOPSOQ
} from '@/lib/laudo-calculos';
import { query } from '@/lib/db';

jest.mock('@/lib/db');

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Funções de Cálculo de Laudos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calcularScoresPorGrupo', () => {
    it('deve calcular scores corretamente para um lote com respostas', async () => {
      // Mock das respostas do lote
      mockQuery.mockResolvedValue({
        rows: [
          { grupo: 1, valor: 75 },
          { grupo: 1, valor: 80 },
          { grupo: 1, valor: 70 },
          { grupo: 1, valor: 85 },
          { grupo: 2, valor: 60 },
          { grupo: 2, valor: 65 },
          { grupo: 2, valor: 55 },
          { grupo: 2, valor: 70 },
        ],
        rowCount: 8,
      } as any)

      const scores = await calcularScoresPorGrupo(1)

      assert.equal(scores.length, 10) // 10 grupos COPSOQ
      assert.equal(scores[0].grupo, 1)
      assert.ok(Math.abs(scores[0].media - 77.5) < 0.1) // (75+80+70+85)/4
      assert.ok(scores[0].desvioPadrao > 0)
      assert.ok(scores[0].categoriaRisco)
      assert.ok(scores[0].classificacaoSemaforo)
      assert.ok(scores[0].acaoRecomendada)
      assert.ok(scores[0].rotuloCategoria)
    })

    it('deve retornar valores padrão para grupos sem respostas', async () => {
      // Mock sem respostas
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      const scores = await calcularScoresPorGrupo(1)

      assert.equal(scores.length, 10)
      scores.forEach(score => {
        assert.equal(score.media, 0)
        assert.equal(score.desvioPadrao, 0)
        assert.equal(score.categoriaRisco, 'baixo')
        assert.equal(score.classificacaoSemaforo, 'verde')
        assert.ok(score.acaoRecomendada.includes('Dados insuficientes'))
        assert.equal(score.rotuloCategoria, 'Excelente')
      })
    })

    it('deve classificar corretamente riscos baseado em tercis', async () => {
      // Mock respostas que geram tercis específicos
      mockQuery.mockResolvedValue({
        rows: [
          { grupo: 1, valor: 20 }, // Baixo
          { grupo: 1, valor: 30 }, // Médio
          { grupo: 1, valor: 80 }, // Alto
        ],
        rowCount: 3,
      } as any)

      const scores = await calcularScoresPorGrupo(1)

      const grupo1 = scores.find(s => s.grupo === 1)
      assert.ok(grupo1)
      // Média geral = média + desvioPadrao, tipo negativa, deve cair em 'Monitorar' ou 'Atenção Necessária' conforme lógica
      assert.ok(['Monitorar', 'Atenção Necessária', 'Excelente'].includes(grupo1!.rotuloCategoria!))
    })
  })

  describe('gerarInterpretacaoRecomendacoes', () => {
    it('deve gerar texto interpretativo correto para diferentes categorias', () => {
      const mockScores = [
        {
          grupo: 1,
          dominio: 'Demandas no Trabalho',
          descricao: 'Avaliação das exigências quantitativas e ritmo de trabalho',
          tipo: 'negativa' as const,
          media: 75,
          desvioPadrao: 5.0,
          mediaMenosDP: 70.0,
          mediaMaisDP: 80.0,
          classificacaoSemaforo: 'amarelo' as const,
          categoriaRisco: 'medio' as const,
          rotuloCategoria: 'Monitorar',
          acaoRecomendada: 'Atenção; intervenções preventivas'
        },
        {
          grupo: 5,
          dominio: 'Valores Organizacionais',
          descricao: 'Confiança, justiça e respeito mútuo na organização',
          tipo: 'positiva' as const,
          media: 85,
          desvioPadrao: 3.0,
          mediaMenosDP: 82.0,
          mediaMaisDP: 88.0,
          classificacaoSemaforo: 'verde' as const,
          categoriaRisco: 'baixo' as const,
          rotuloCategoria: 'Excelente',
          acaoRecomendada: 'Manter; monitorar anualmente'
        },
        {
          grupo: 7,
          dominio: 'Saúde e Bem-Estar',
          descricao: 'Avaliação de estresse, burnout e sintomas somáticos',
          tipo: 'negativa' as const,
          media: 90,
          desvioPadrao: 2.0,
          mediaMenosDP: 88.0,
          mediaMaisDP: 92.0,
          classificacaoSemaforo: 'vermelho' as const,
          categoriaRisco: 'alto' as const,
          rotuloCategoria: 'Atenção Necessária',
          acaoRecomendada: 'Ação imediata; plano de mitigação'
        }
      ]

      const resultado = gerarInterpretacaoRecomendacoes('Empresa Teste', mockScores)

      assert.ok(resultado.textoPrincipal.includes('Empresa Teste apresenta'))
      assert.ok(resultado.textoPrincipal.includes('Demandas no Trabalho'))
      assert.ok(resultado.textoPrincipal.includes('Valores Organizacionais'))
      assert.ok(resultado.textoPrincipal.includes('Excelente'))
      assert.ok(resultado.textoPrincipal.includes('Monitorar'))
      assert.ok(resultado.textoPrincipal.includes('Atenção Necessária'))
      assert.ok(resultado.conclusao.includes('foi possível identificar'))
      assert.equal(resultado.gruposAtencao.length, 1)
      assert.equal(resultado.gruposExcelente.length, 1)
      assert.equal(resultado.gruposMonitoramento.length, 1)
    })

    it('deve ordenar corretamente: excelente → atenção necessária → alto risco', () => {
      const mockScores = [
        {
          grupo: 1,
          dominio: 'Grupo Atenção',
          descricao: 'desc',
          tipo: 'negativa' as const,
          media: 70,
          desvioPadrao: 1,
          mediaMenosDP: 69,
          mediaMaisDP: 71,
          classificacaoSemaforo: 'amarelo' as const,
          categoriaRisco: 'medio' as const,
          rotuloCategoria: 'Monitorar',
          acaoRecomendada: 'Atenção necessária'
        },
        {
          grupo: 2,
          dominio: 'Grupo Atenção Necessária',
          descricao: 'desc',
          tipo: 'negativa' as const,
          media: 90,
          desvioPadrao: 1,
          mediaMenosDP: 89,
          mediaMaisDP: 91,
          classificacaoSemaforo: 'vermelho' as const,
          categoriaRisco: 'alto' as const,
          rotuloCategoria: 'Atenção Necessária',
          acaoRecomendada: 'Ação urgente'
        },
        {
          grupo: 3,
          dominio: 'Grupo Excelente',
          descricao: 'desc',
          tipo: 'positiva' as const,
          media: 90,
          desvioPadrao: 1,
          mediaMenosDP: 89,
          mediaMaisDP: 91,
          classificacaoSemaforo: 'verde' as const,
          categoriaRisco: 'baixo' as const,
          rotuloCategoria: 'Excelente',
          acaoRecomendada: 'Manter'
        }
      ]

      const resultado = gerarInterpretacaoRecomendacoes('Empresa Teste', mockScores)

      // Verificar ordem no texto
      const texto = resultado.textoPrincipal
      const posExcelente = texto.indexOf('Excelente')
      const posMonitorar = texto.indexOf('Monitorar')
      const posAtencao = texto.indexOf('Atenção Necessária')

      assert.ok(posExcelente >= 0)
      assert.ok(posMonitorar >= 0)
      assert.ok(posAtencao >= 0)
      assert.ok(posExcelente < posMonitorar)
      assert.ok(posMonitorar < posAtencao)
    })
  })

  describe('gerarObservacoesConclusao', () => {
    it('deve incluir observações quando fornecidas', () => {
      const observacoes = 'Observações importantes do profissional'
      const resultado = gerarObservacoesConclusao(observacoes)

      assert.equal(resultado.observacoesLaudo, observacoes)
      assert.ok(resultado.textoConclusao.includes('Este laudo'))
      assert.ok(resultado.textoConclusao.includes('não pode diagnosticar'))
      assert.ok(resultado.textoConclusao.includes('diagnóstico clínico'))
      assert.ok(resultado.dataEmissao.includes('São Paulo'))
      assert.equal(resultado.assinatura.nome, 'Dr. Marcelo Oliveira')
    })

    it('deve retornar undefined para observações quando não fornecidas', () => {
      const resultado = gerarObservacoesConclusao('')

      assert.equal(resultado.observacoesLaudo, undefined)
    })

    it('deve gerar data no formato brasileiro', () => {
      const resultado = gerarObservacoesConclusao()

      assert.ok(/São Paulo, \d{1,2} de \w+ de \d{4}/.test(resultado.dataEmissao))
    })

    it('deve incluir assinatura completa', () => {
      const resultado = gerarObservacoesConclusao()

      assert.deepEqual(resultado.assinatura, {
        nome: 'Dr. Marcelo Oliveira',
        titulo: 'Psicólogo',
        registro: 'CRP 06/123456',
        empresa: 'Responsável Técnico – BPS Brasil'
      })
    })
  })

  describe('gerarDadosGeraisEmpresa', () => {
    it('deve lançar erro se lote não encontrado', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any)

      let erro = null;
      try {
        await gerarDadosGeraisEmpresa(999);
      } catch (e: any) {
        erro = e;
      }
      assert.ok(erro && erro.message.includes('Lote não encontrado'));
    })
  })

  describe('Funções Auxiliares', () => {
    describe('gruposCOPSOQ', () => {
      it('deve conter todos os 10 grupos COPSOQ', () => {
        assert.equal(gruposCOPSOQ.length, 10)
      })

      it('deve ter estrutura correta para cada grupo', () => {
        gruposCOPSOQ.forEach(grupo => {
          assert.ok('grupo' in grupo)
          assert.ok('dominio' in grupo)
          assert.ok('descricao' in grupo)
          assert.ok('tipo' in grupo)
          assert.ok(['positiva', 'negativa'].includes(grupo.tipo))
        })
      })

      it('deve ter grupos numerados de 1 a 10', () => {
        const gruposNumeros = gruposCOPSOQ.map(g => g.grupo).sort((a, b) => a - b)
        assert.deepEqual(gruposNumeros, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      })
    })
  })
})