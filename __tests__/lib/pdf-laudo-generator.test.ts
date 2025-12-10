/**
 * Testes para lib/pdf-laudo-generator.ts
 * Validação de geração de PDFs de laudos com html2pdf
 */

import { gerarLaudoPDF, LaudoData } from '@/lib/pdf-laudo-generator'

// Mock do html2pdf
const mockSave = jest.fn().mockResolvedValue(undefined)
const mockFrom = jest.fn().mockReturnValue({
  save: mockSave
})
const mockSet = jest.fn().mockReturnValue({
  from: mockFrom
})

jest.mock('html2pdf.js', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    set: mockSet,
    from: mockFrom,
    save: mockSave
  }))
}))

describe('pdf-laudo-generator', () => {
  const dadosLaudoMock: LaudoData = {
    etapa1: {
      clinicaNome: 'Clínica de Saúde Ocupacional',
      clinicaEndereco: 'Rua das Flores, 123 - São Paulo/SP',
      clinicaTelefone: '(11) 1234-5678',
      clinicaEmail: 'contato@clinica.com.br',
      empresaAvaliada: 'Empresa Modelo LTDA',
      empresaCnpj: '12.345.678/0001-90',
      empresaEndereco: 'Av. Principal, 456 - São Paulo/SP',
      setorAvaliado: 'Administrativo',
      responsavelTecnico: 'Dr. João Oliveira',
      registroProfissional: 'CRP 06/123456',
      dataAvaliacao: '2025-01-15',
      totalFuncionarios: 50,
      gestao: 10,
      operacional: 40
    },
    etapa2: [
      {
        grupoId: 1,
        grupoTitulo: 'Demandas no Trabalho',
        dominio: 'Demandas Quantitativas',
        mediaNumerica: 45.5,
        classificacao: 'Monitorar (Médio Risco)',
        corClassificacao: '#f59e0b'
      },
      {
        grupoId: 2,
        grupoTitulo: 'Organização do Trabalho',
        dominio: 'Influência e Desenvolvimento',
        mediaNumerica: 75.0,
        classificacao: 'Excelente (Baixo Risco)',
        corClassificacao: '#10b981'
      },
      {
        grupoId: 3,
        grupoTitulo: 'Relações Sociais',
        dominio: 'Apoio Social e Feedback',
        mediaNumerica: 25.0,
        classificacao: 'Atenção (Alto Risco)',
        corClassificacao: '#ef4444'
      }
    ],
    etapa3: [
      {
        grupoId: 2,
        grupoTitulo: 'Organização do Trabalho',
        interpretacao: 'Os resultados indicam um baixo risco psicossocial, com condições organizacionais favoráveis ao bem-estar dos trabalhadores.',
        recomendacoes: [
          'Manter as boas práticas atuais',
          'Comunicação aberta entre equipes e gestores',
          'Políticas de reconhecimento e valorização profissional',
          'Programas de qualidade de vida'
        ]
      },
      {
        grupoId: 1,
        grupoTitulo: 'Demandas no Trabalho',
        interpretacao: 'Nível moderado de risco psicossocial identificado, requerendo atenção preventiva.',
        recomendacoes: [
          'Reuniões de alinhamento sobre papéis e responsabilidades',
          'Adequação das cargas e jornadas de trabalho',
          'Programas de apoio psicológico ou rodas de conversa',
          'Monitoramento contínuo'
        ]
      },
      {
        grupoId: 3,
        grupoTitulo: 'Relações Sociais',
        interpretacao: 'Alto risco psicossocial detectado, demandando intervenções imediatas e estruturadas.',
        recomendacoes: [
          'Intervenção imediata com apoio especializado',
          'Revisão das demandas e processos de trabalho',
          'Programas de suporte psicológico intensivo',
          'Avaliações de acompanhamento periódicas',
          'Ações preventivas estruturadas'
        ]
      }
    ],
    etapa4: {
      observacoes: 'A avaliação foi conduzida de forma adequada, com boa participação dos funcionários.',
      conclusao: 'Este laudo, por si só, não pode diagnosticar uma patologia, mas pode indicar a presença de sintomas, do ponto de vista coletivo. Um diagnóstico clínico de cada avaliado somente pode ser feito pelo seu psicólogo, médico do trabalho, psiquiatra ou outro profissional de saúde qualificado. Declaro que os dados são estritamente agregados e anônimos, em conformidade com a LGPD e o Código de Ética Profissional do Psicólogo.',
      dataEmissao: '2025-01-20T10:00:00Z'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock do document.createElement e document.body
    document.body.appendChild = jest.fn()
    document.body.removeChild = jest.fn()
    document.body.contains = jest.fn().mockReturnValue(true)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('gerarLaudoPDF', () => {
    it('deve gerar PDF de laudo com sucesso', async () => {
      await expect(gerarLaudoPDF(dadosLaudoMock)).resolves.not.toThrow()
    })

    it('deve criar elemento temporário para renderização', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement')
      
      await gerarLaudoPDF(dadosLaudoMock)

      expect(createElementSpy).toHaveBeenCalledWith('div')
    })

    it('deve adicionar elemento temporário ao body', async () => {
      await gerarLaudoPDF(dadosLaudoMock)

      expect(document.body.appendChild).toHaveBeenCalled()
    })

    it('deve remover elemento temporário após conclusão', async () => {
      await gerarLaudoPDF(dadosLaudoMock)

      expect(document.body.removeChild).toHaveBeenCalled()
    })

    it('deve configurar opções corretas do html2pdf', async () => {
      const html2pdf = require('html2pdf.js').default

      await gerarLaudoPDF(dadosLaudoMock)

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          margin: [10, 10, 10, 10],
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: expect.objectContaining({
            scale: 2,
            useCORS: true,
            letterRendering: true
          }),
          jsPDF: expect.objectContaining({
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
          })
        })
      )
    })

    it('deve usar nome de arquivo customizado quando fornecido', async () => {
      const nomeCustomizado = 'laudo-personalizado.pdf'
      
      await gerarLaudoPDF(dadosLaudoMock, nomeCustomizado)

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: nomeCustomizado
        })
      )
    })

    it('deve gerar nome de arquivo baseado na empresa quando não fornecido', async () => {
      await gerarLaudoPDF(dadosLaudoMock)

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: expect.stringMatching(/laudo-Empresa-Modelo-LTDA\.pdf/)
        })
      )
    })

    it('deve remover elemento temporário em caso de erro', async () => {
      mockSave.mockRejectedValueOnce(new Error('Erro ao salvar PDF'))

      await expect(gerarLaudoPDF(dadosLaudoMock)).rejects.toThrow('Erro ao salvar PDF')
      expect(document.body.removeChild).toHaveBeenCalled()
    })

    it('deve incluir todas as etapas do laudo no HTML', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement')
      
      await gerarLaudoPDF(dadosLaudoMock)

      const divElement = createElementSpy.mock.results[0].value
      const htmlContent = divElement.innerHTML

      // Verificar Etapa 1 - Dados Gerais
      expect(htmlContent).toContain('LAUDO PSICOSSOCIAL')
      expect(htmlContent).toContain('Clínica de Saúde Ocupacional')
      expect(htmlContent).toContain('Empresa Modelo LTDA')
      expect(htmlContent).toContain('12.345.678/0001-90')
      expect(htmlContent).toContain('Dr. João Oliveira')

      // Verificar Etapa 2 - Scores
      expect(htmlContent).toContain('RESULTADOS POR DIMENSÃO')
      expect(htmlContent).toContain('Demandas no Trabalho')
      expect(htmlContent).toContain('Organização do Trabalho')

      // Verificar Etapa 3 - Interpretação
      expect(htmlContent).toContain('INTERPRETAÇÃO E RECOMENDAÇÕES')
      expect(htmlContent).toContain('Os resultados indicam um baixo risco psicossocial')

      // Verificar Etapa 4 - Conclusão
      expect(htmlContent).toContain('OBSERVAÇÕES E CONCLUSÃO')
      expect(htmlContent).toContain('A avaliação foi conduzida de forma adequada')
    })
  })

  describe('Validação de conteúdo HTML gerado', () => {
    it('deve incluir informações da clínica no cabeçalho', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement')
      
      await gerarLaudoPDF(dadosLaudoMock)

      const divElement = createElementSpy.mock.results[0].value
      const htmlContent = divElement.innerHTML

      expect(htmlContent).toContain('Clínica de Saúde Ocupacional')
      expect(htmlContent).toContain('Rua das Flores, 123 - São Paulo/SP')
      expect(htmlContent).toContain('(11) 1234-5678')
      expect(htmlContent).toContain('contato@clinica.com.br')
    })

    it('deve incluir informações da empresa avaliada', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement')
      
      await gerarLaudoPDF(dadosLaudoMock)

      const divElement = createElementSpy.mock.results[0].value
      const htmlContent = divElement.innerHTML

      expect(htmlContent).toContain('Empresa Modelo LTDA')
      expect(htmlContent).toContain('12.345.678/0001-90')
      expect(htmlContent).toContain('Av. Principal, 456 - São Paulo/SP')
    })

    it('deve incluir tabela de scores com classificações coloridas', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement')
      
      await gerarLaudoPDF(dadosLaudoMock)

      const divElement = createElementSpy.mock.results[0].value
      const htmlContent = divElement.innerHTML

      // Verificar presença de scores
      expect(htmlContent).toContain('45.5')
      expect(htmlContent).toContain('75.0')
      expect(htmlContent).toContain('25.0')

      // Verificar classificações
      expect(htmlContent).toContain('Monitorar (Médio Risco)')
      expect(htmlContent).toContain('Excelente (Baixo Risco)')
      expect(htmlContent).toContain('Atenção (Alto Risco)')
    })

    it('deve incluir recomendações para cada grupo', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement')
      
      await gerarLaudoPDF(dadosLaudoMock)

      const divElement = createElementSpy.mock.results[0].value
      const htmlContent = divElement.innerHTML

      // Verificar recomendações
      expect(htmlContent).toContain('Manter as boas práticas atuais')
      expect(htmlContent).toContain('Reuniões de alinhamento sobre papéis')
      expect(htmlContent).toContain('Intervenção imediata com apoio especializado')
    })

    it('deve incluir assinatura do responsável técnico', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement')
      
      await gerarLaudoPDF(dadosLaudoMock)

      const divElement = createElementSpy.mock.results[0].value
      const htmlContent = divElement.innerHTML

      expect(htmlContent).toContain('Dr. João Oliveira')
      expect(htmlContent).toContain('CRP 06/123456')
    })

    it('deve incluir observações e conclusão final', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement')
      
      await gerarLaudoPDF(dadosLaudoMock)

      const divElement = createElementSpy.mock.results[0].value
      const htmlContent = divElement.innerHTML

      expect(htmlContent).toContain('A avaliação foi conduzida de forma adequada')
      expect(htmlContent).toContain('Este laudo, por si só, não pode diagnosticar uma patologia')
      expect(htmlContent).toContain('LGPD')
    })
  })

  describe('Tratamento de dados incompletos', () => {
    it('deve lidar com etapa3 vazia', async () => {
      const dadosEtapa3Vazia: LaudoData = {
        ...dadosLaudoMock,
        etapa3: []
      }

      await expect(gerarLaudoPDF(dadosEtapa3Vazia)).resolves.not.toThrow()
    })

    it('deve lidar com grupos sem recomendações', async () => {
      const dadosSemRecomendacoes: LaudoData = {
        ...dadosLaudoMock,
        etapa3: [
          {
            grupoId: 1,
            grupoTitulo: 'Grupo Teste',
            interpretacao: 'Interpretação teste',
            recomendacoes: []
          }
        ]
      }

      await expect(gerarLaudoPDF(dadosSemRecomendacoes)).resolves.not.toThrow()
    })

    it('deve lidar com observações vazias', async () => {
      const dadosSemObservacoes: LaudoData = {
        ...dadosLaudoMock,
        etapa4: {
          ...dadosLaudoMock.etapa4,
          observacoes: ''
        }
      }

      await expect(gerarLaudoPDF(dadosSemObservacoes)).resolves.not.toThrow()
    })
  })

  describe('Performance e robustez', () => {
    it('deve gerar PDF com muitos grupos na etapa2', async () => {
      const gruposEmMassa = Array.from({ length: 20 }, (_, i) => ({
        grupoId: i + 1,
        grupoTitulo: `Grupo ${i + 1}`,
        dominio: `Domínio ${i + 1}`,
        mediaNumerica: Math.random() * 100,
        classificacao: 'Monitorar (Médio Risco)',
        corClassificacao: '#f59e0b'
      }))

      const dadosGrandesVolume: LaudoData = {
        ...dadosLaudoMock,
        etapa2: gruposEmMassa
      }

      await expect(gerarLaudoPDF(dadosGrandesVolume)).resolves.not.toThrow()
    })

    it('deve gerar PDF com muitas recomendações', async () => {
      const recomendacoesEmMassa = Array.from({ length: 15 }, (_, i) => `Recomendação ${i + 1}`)

      const dadosMuitasRecomendacoes: LaudoData = {
        ...dadosLaudoMock,
        etapa3: [
          {
            grupoId: 1,
            grupoTitulo: 'Grupo Teste',
            interpretacao: 'Interpretação detalhada',
            recomendacoes: recomendacoesEmMassa
          }
        ]
      }

      await expect(gerarLaudoPDF(dadosMuitasRecomendacoes)).resolves.not.toThrow()
    })

    it('deve gerar PDF com nomes de empresas com caracteres especiais', async () => {
      const dadosEspeciais: LaudoData = {
        ...dadosLaudoMock,
        etapa1: {
          ...dadosLaudoMock.etapa1,
          empresaAvaliada: 'Empresa & Cia S/A - Filial #1 (Brasil)'
        }
      }

      await expect(gerarLaudoPDF(dadosEspeciais)).resolves.not.toThrow()
    })
  })

  describe('Tratamento de erros', () => {
    it('deve propagar erro quando html2pdf falha', async () => {
      mockSave.mockRejectedValueOnce(new Error('Falha no html2pdf'))

      await expect(gerarLaudoPDF(dadosLaudoMock)).rejects.toThrow('Falha no html2pdf')
    })

    it('deve limpar recursos em caso de erro durante processamento', async () => {
      const createElementSpy = jest.spyOn(document, 'createElement')
      mockSave.mockRejectedValueOnce(new Error('Erro durante processamento'))

      await expect(gerarLaudoPDF(dadosLaudoMock)).rejects.toThrow('Erro durante processamento')
      
      // Verifica se tentou remover o elemento
      expect(document.body.removeChild).toHaveBeenCalled()
    })
  })
})
