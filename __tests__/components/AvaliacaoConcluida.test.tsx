import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import AvaliacaoConcluidaPage from '@/app/avaliacao/concluida/page'

// Mock do useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock das funções de cálculo
jest.mock('@/lib/calculate', () => ({
  getCorSemaforo: jest.fn((categoria, tipo) => {
    if (categoria === 'alto') return '#EF4444'
    if (categoria === 'medio') return '#F59E0B'
    return '#10B981'
  }),
  getTextoCategoria: jest.fn((categoria, tipo) => {
    if (categoria === 'alto') return 'Alto Risco'
    if (categoria === 'medio') return 'Monitorar'
    return 'Adequado'
  })
}))

// Mock dos dados do relatório
jest.mock('@/lib/relatorio-dados', () => ({
  getRelatorioGrupo: jest.fn((grupoId) => ({
    id: grupoId,
    nome: `Grupo ${grupoId}`,
    explicacao: `Explicação do grupo ${grupoId}`,
    gestao: `Dicas de gestão do grupo ${grupoId}`,
    baixo: `Recomendação baixo grupo ${grupoId}`,
    medio: `Recomendação médio grupo ${grupoId}`,
    alto: `Recomendação alto grupo ${grupoId}`
  })),
  getRecomendacao: jest.fn((grupoId, categoria) => `Recomendação ${categoria} para grupo ${grupoId}`)
}))

// Mock do fetch global
global.fetch = jest.fn()

describe('AvaliacaoConcluidaPage - Relatório Completo', () => {
  const mockResultados = [
    {
      grupo: 1,
      dominio: 'Demandas no Trabalho',
      score: 75.5,
      categoria: 'medio' as const,
      tipo: 'negativa' as const
    },
    {
      grupo: 9,
      dominio: 'Comportamento de Jogo',
      score: 33.3,
      categoria: 'baixo' as const,
      tipo: 'negativa' as const
    },
    {
      grupo: 10,
      dominio: 'Endividamento Financeiro',
      score: 33.3,
      categoria: 'baixo' as const,
      tipo: 'negativa' as const
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ resultados: mockResultados })
    })
  })

  it('deve renderizar o relatório completo com todos os grupos', async () => {
    render(<AvaliacaoConcluidaPage />)

    // Aguarda o carregamento
    await waitFor(() => {
      expect(screen.getByText('📊 Relatório Completo de Avaliação Psicossocial')).toBeInTheDocument()
    })

    // Verifica se todos os grupos são renderizados
    expect(screen.getByText('Grupo 1: Grupo 1')).toBeInTheDocument()
    expect(screen.getByText('Grupo 9: Grupo 9')).toBeInTheDocument()
    expect(screen.getByText('Grupo 10: Grupo 10')).toBeInTheDocument()
  })

  it('deve exibir pontuações corretas para cada grupo', async () => {
    render(<AvaliacaoConcluidaPage />)

    await waitFor(() => {
      // Deve haver uma ocorrência de 75.5% e duas de 33.3%
      expect(screen.getAllByText(/Sua Pontuação: 75\.5%/)).toHaveLength(1)
      expect(screen.getAllByText(/Sua Pontuação: 33\.3%/)).toHaveLength(2)
    })
  })

  it('deve mostrar seções de explicação, gestão e recomendações', async () => {
    render(<AvaliacaoConcluidaPage />)

    await waitFor(() => {
      // Verifica títulos das seções
      expect(screen.getAllByText('📖 Entenda este Domínio')).toHaveLength(3)
      expect(screen.getAllByText('💡 Dicas Práticas de Gestão')).toHaveLength(3)
      expect(screen.getAllByText('🎯 Seu Plano de Ação Personalizado')).toHaveLength(3)
    })
  })

  it('deve aplicar classes CSS corretas para impressão', async () => {
    render(<AvaliacaoConcluidaPage />)

    await waitFor(() => {
      // Verifica classes de impressão
      const grupoCards = screen.getAllByText(/Grupo \d+:/).map(el => el.closest('.grupo-card'))
      expect(grupoCards[0]).toHaveClass('grupo-card')
      
      const headers = screen.getAllByText(/Grupo \d+:/).map(el => el.closest('.grupo-header'))
      expect(headers[0]).toHaveClass('grupo-header')
    })
  })

  it('deve chamar window.print quando clicar no botão imprimir', async () => {
    const mockPrint = jest.fn()
    Object.defineProperty(window, 'print', { value: mockPrint })

    render(<AvaliacaoConcluidaPage />)

    await waitFor(() => {
      const botaoImprimir = screen.getByText('🖨️ Imprimir Relatório')
      fireEvent.click(botaoImprimir)
      expect(mockPrint).toHaveBeenCalled()
    })
  })

  it('deve navegar para dashboard quando clicar em voltar', async () => {
    render(<AvaliacaoConcluidaPage />)

    await waitFor(() => {
      const botaoVoltar = screen.getByText('🏠 Voltar ao Início')
      fireEvent.click(botaoVoltar)
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('deve mostrar informações de privacidade', async () => {
    render(<AvaliacaoConcluidaPage />)

    await waitFor(() => {
      expect(screen.getByText('🔒 Privacidade e Próximos Passos')).toBeInTheDocument()
      expect(screen.getByText(/Respostas individuais são confidenciais/)).toBeInTheDocument()
      expect(screen.getByText(/Refaça este questionário em 3 meses/)).toBeInTheDocument()
    })
  })

  it('deve mostrar loading state corretamente', () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    
    render(<AvaliacaoConcluidaPage />)
    
    expect(screen.getByText('Carregando relatório...')).toBeInTheDocument()
  })

  it('deve mostrar error state quando fetch falha', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Erro na API'))

    render(<AvaliacaoConcluidaPage />)

    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar relatório/)).toBeInTheDocument()
    })
  })

  it('deve incluir informações COPSOQ na versão para impressão', async () => {
    render(<AvaliacaoConcluidaPage />)

    await waitFor(() => {
      // Verifica se o conteúdo print-only está presente no DOM
      const printOnlyElement = document.querySelector('.print-only')
      expect(printOnlyElement).toBeInTheDocument()

      // Verifica o título COPSOQ
      expect(printOnlyElement).toHaveTextContent('Copenhagen Psychosocial Questionnaire (COPSOQ): Versão PBS Brasil, Questões, Pontuação e Classificação')

      // Verifica seções principais
      expect(printOnlyElement).toHaveTextContent('Estrutura Geral')
      expect(printOnlyElement).toHaveTextContent('Resultados e Classificação')

      // Verifica tabela de classificação
      expect(printOnlyElement).toHaveTextContent('Verde (Baixo Risco)')
      expect(printOnlyElement).toHaveTextContent('Amarelo (Risco Médio)')
      expect(printOnlyElement).toHaveTextContent('Vermelho (Alto Risco)')

      // Verifica ações recomendadas
      expect(printOnlyElement).toHaveTextContent('Manter; monitorar anualmente')
      expect(printOnlyElement).toHaveTextContent('Atenção; intervenções preventivas (treinamentos)')
      expect(printOnlyElement).toHaveTextContent('Ação imediata; plano de mitigação (PGR/NR-1)')
    })
  })
})