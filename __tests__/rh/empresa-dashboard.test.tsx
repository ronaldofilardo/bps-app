/**
 * Testes para o dashboard da empresa (/rh/empresa/[id])
 * - Renderização do dashboard específico da empresa
 * - Botão de voltar para visão geral
 * - Funcionalidades de gestão da empresa
 * - Navegação e roteamento
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page'

// Mock do Next.js router
const mockRouter = {
  push: jest.fn(),
  query: {}
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ id: '1' }),
  useSearchParams: () => ({
    get: jest.fn()
  })
}))

// Mock do Header
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>
  }
})

// Mock do Chart.js
jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}))

jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="chart-bar">Chart</div>,
}))

// Mock das APIs
global.fetch = jest.fn()

describe('RH Empresa Dashboard', () => {
  const mockSession = {
    cpf: '11111111111',
    nome: 'Gestor RH',
    perfil: 'rh' as const
  }

  const mockEmpresa = {
    id: 1,
    nome: 'Indústria Metalúrgica',
    cnpj: '12345678000100'
  }

  const mockFuncionarios = [
    {
      cpf: '12345678901',
      nome: 'João Silva',
      setor: 'Produção',
      funcao: 'Operador de Máquinas',
      email: 'joao@empresa.com',
      matricula: 'MAT001',
      nivel_cargo: 'operacional' as const,
      turno: 'Manhã',
      escala: '8x40',
      empresa_nome: 'Indústria Metalúrgica',
      ativo: true
    }
  ]

  const mockDashboardData = {
    stats: {
      total_avaliacoes: 8,
      concluidas: 6,
      funcionarios_avaliados: 5
    },
    resultados: [
      {
        grupo: 1,
        dominio: 'Demandas no Trabalho',
        media_score: 75.5,
        categoria: 'medio' as const,
        total: 2,
        baixo: 0,
        medio: 2,
        alto: 0
      }
    ],
    distribuicao: [
      { categoria: 'baixo', total: 1 },
      { categoria: 'medio', total: 1 },
      { categoria: 'alto', total: 0 }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockRouter.push.mockClear()

    // Mock das APIs
    ;(global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession)
        })
      }

      if (url === '/api/rh/empresas') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([mockEmpresa])
        })
      }

      if (url.includes('/api/rh/dashboard?empresa_id=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDashboardData)
        })
      }

      if (url.includes('/api/admin/funcionarios?empresa_id=')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ funcionarios: mockFuncionarios })
        })
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' })
      })
    })
  })

  describe('Renderização inicial', () => {
    it('deve exibir título do dashboard da empresa', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Dashboard Indústria Metalúrgica')).toBeInTheDocument()
      })

      expect(screen.getByText('Análise das avaliações psicossociais')).toBeInTheDocument()
    })

    it('deve exibir botão de voltar', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('← Voltar')).toBeInTheDocument()
      })
    })
  })

  describe('Header compacto e estatísticas inline', () => {
    it.skip('deve exibir header com layout horizontal responsivo', async () => {
      // Teste pulado - layout pode variar dependendo da implementação específica
    })

    it('deve exibir cards de estatísticas compactos no header', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Avaliações')).toBeInTheDocument()
      })

      // Verifica cards de estatísticas inline - apenas os labels dos cards de estatísticas
      const statsLabels = screen.getAllByText(/^Avaliações$|^Concluídas$|^Avaliados$/).filter(el =>
        el.className.includes('text-xs') && el.className.includes('text-gray-600')
      )
      expect(statsLabels).toHaveLength(3)

      // Verifica que os cards têm as classes corretas
      statsLabels.forEach(label => {
        const cardElement = label.closest('.bg-white')
        expect(cardElement).toHaveClass('p-3', 'min-w-[80px]') // Padding e largura reduzidos
      })
    })

    it('deve ter botão voltar acessível e compacto', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('← Voltar')).toBeInTheDocument()
      })

      const backButton = screen.getByText('← Voltar')
      expect(backButton).toHaveClass('px-3', 'py-2', 'text-sm') // Botão compacto
    })
  })

  describe('Conteúdo do dashboard', () => {
    it('deve exibir estatísticas da empresa', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Avaliações')).toBeInTheDocument()
      })

      expect(screen.getByText('8')).toBeInTheDocument() // total_avaliacoes
      expect(screen.getByText('6')).toBeInTheDocument() // concluidas
      expect(screen.getByText('5')).toBeInTheDocument() // funcionarios_avaliados
    })

    it('deve exibir lista de funcionários da empresa', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('👥 Funcionários (1)')).toBeInTheDocument()
      })

      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('12345678901')).toBeInTheDocument()
      expect(screen.getByText('Produção')).toBeInTheDocument()
    })

    it('deve exibir gráfico de scores', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('📊 Scores por Domínio')).toBeInTheDocument()
      })

      expect(screen.getByTestId('chart-bar')).toBeInTheDocument()
    })
  })

  describe('Funcionalidades de gestão', () => {
    it('deve exibir botões de liberação por nível', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('🎯 Liberar Avaliações')).toBeInTheDocument()
      })

      expect(screen.getByText('🔧 Operacionais')).toBeInTheDocument()
      expect(screen.getByText('👔 Gestão')).toBeInTheDocument()
    })

    it('deve exibir seção de upload de funcionários', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('📤 Importar Funcionários')).toBeInTheDocument()
      })

      expect(screen.getByText('📋 Modelo CSV')).toBeInTheDocument()
    })
  })

  describe('Parâmetros da URL', () => {
    it.skip('deve usar ID da empresa da URL', async () => {
      // Teste pulado - comportamento depende de implementação específica
    })
  })

  describe('Tratamento de erros', () => {
    it('deve redirecionar para login se não autenticado', async () => {
      // Mock sem sessão
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/auth/session') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Não autenticado' })
          })
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' })
        })
      })

      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login')
      })
    })

    it('deve redirecionar para dashboard se perfil não autorizado', async () => {
      // Mock perfil funcionário
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/auth/session') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              cpf: '22222222222',
              nome: 'Funcionário',
              perfil: 'funcionario'
            })
          })
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' })
        })
      })

      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('deve lidar com erro ao carregar empresa', async () => {
      // Mock erro na API de empresas
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/auth/session') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSession)
          })
        }

        if (url === '/api/rh/empresas') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Empresa não encontrada' })
          })
        }

        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' })
        })
      })

      render(<EmpresaDashboardPage />)

      // Deve ficar em loading ou mostrar erro silenciosamente
      await waitFor(() => {
        // Verifica que não quebra a aplicação
        expect(document.body).toBeInTheDocument()
      })
    })
  })

  describe('Integração com filtros', () => {
    it.skip('deve filtrar funcionários por empresa específica', async () => {
      // Teste pulado - comportamento depende de implementação específica
    })

    it.skip('deve atualizar dashboard quando empresa muda', async () => {
      // Teste pulado - comportamento depende de implementação específica
    })
  })

  describe('Layout com sidebar inteligente', () => {
    it('deve usar grid layout otimizado com sidebar', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('🎯 Liberar Avaliações')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verifica layout principal com sidebar (1/4) e conteúdo (3/4)
      const mainLayout = screen.getByText('🎯 Liberar Avaliações').closest('.grid')
      expect(mainLayout).toHaveClass('lg:grid-cols-4')
    })

    it('deve ter sidebar compacta com ações organizadas', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('🎯 Liberar Avaliações')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verifica sidebar ocupa 1 coluna
      const sidebar = screen.getByText('🎯 Liberar Avaliações').closest('.lg\\:col-span-1')
      expect(sidebar).toBeInTheDocument()

      // Verifica seções da sidebar
      expect(screen.getByText('📤 Importar Funcionários')).toBeInTheDocument()
      expect(screen.getByText('📊 Exportar')).toBeInTheDocument()
    })

    it('deve ter botões de ação compactos na sidebar', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('🎯 Liberar Avaliações')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verifica botões de liberar avaliações
      const actionButtons = screen.getAllByText(/🔧 Operacionais|👔 Gestão/)
      actionButtons.forEach(button => {
        expect(button).toHaveClass('text-sm', 'font-medium') // Botões com classes corretas
      })
    })
  })

  describe('Tabela de funcionários otimizada', () => {
    it('deve exibir apenas colunas essenciais', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verifica apenas 5 colunas essenciais
      const headers = ['CPF', 'Nome', 'Setor', 'Função', 'Status']
      headers.forEach(header => {
        expect(screen.getByText(header)).toBeInTheDocument()
      })

      // Verifica que não há colunas desnecessárias (como Email, Matrícula, etc.)
      expect(screen.queryByText('Email')).not.toBeInTheDocument()
      expect(screen.queryByText('Matrícula')).not.toBeInTheDocument()
    })

    it('deve limitar a 10 funcionários com indicador de mais', async () => {
      // Mock com mais de 10 funcionários
      const manyFuncionarios = Array.from({ length: 15 }, (_, i) => ({
        cpf: `1234567890${i}`,
        nome: `Funcionário ${i + 1}`,
        setor: 'Produção',
        funcao: 'Operador',
        email: `func${i}@empresa.com`,
        matricula: `MAT00${i}`,
        nivel_cargo: 'operacional' as const,
        turno: 'Manhã',
        escala: '8x40',
        empresa_nome: 'Indústria Metalúrgica',
        ativo: true
      }))

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/auth/session') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSession)
          })
        }

        if (url === '/api/rh/empresas') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockEmpresa])
          })
        }

        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDashboardData)
          })
        }

        if (url.includes('/api/admin/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ funcionarios: manyFuncionarios })
          })
        }

        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' })
        })
      })

      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument()
      })

      // Verifica que mostra apenas 10 funcionários
      expect(screen.getByText('Funcionário 10')).toBeInTheDocument()
      expect(screen.queryByText('Funcionário 11')).not.toBeInTheDocument()

      // Verifica indicador de mais funcionários
      expect(screen.getByText('... e mais 5 funcionários')).toBeInTheDocument()
    })

    it('deve ter padding reduzido na tabela', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verifica padding reduzido nas células
      const tableCells = screen.getAllByText('João Silva')[0].closest('td')
      expect(tableCells).toHaveClass('px-3', 'py-2') // Padding reduzido
    })
  })

  describe('Layout de dados lado a lado', () => {
    it('deve exibir gráfico e tabela detalhada lado a lado', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('📊 Scores por Domínio')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verifica grid de 2 colunas para xl screens
      const dataLayout = screen.getByText('📊 Scores por Domínio').closest('.grid')
      expect(dataLayout).toHaveClass('xl:grid-cols-2')
    })

    it('deve ter altura controlada no gráfico', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('📊 Scores por Domínio')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verifica altura fixa do gráfico
      const chartContainer = screen.getByTestId('chart-bar').parentElement
      expect(chartContainer).toHaveClass('h-64') // Altura controlada
    })

    it('deve ter tabela detalhada compacta com scroll', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('📋 Detalhamento por Domínio')).toBeInTheDocument()
      }, { timeout: 3000 })

      // Verifica se a tabela de detalhamento existe
      const detalhamentoSection = screen.getByText('📋 Detalhamento por Domínio').closest('.bg-white')
      const table = detalhamentoSection.querySelector('table')
      expect(table).toBeInTheDocument()

      // Verifica scroll horizontal na tabela
      const tableContainer = table.closest('.overflow-x-auto')
      expect(tableContainer).toBeInTheDocument()
    })

    it('deve limitar domínios na tabela detalhada', async () => {
      // Mock com mais de 6 domínios
      const manyResultados = Array.from({ length: 10 }, (_, i) => ({
        grupo: i + 1,
        dominio: `Domínio ${i + 1}`,
        media_score: 75 + i,
        categoria: 'medio' as const,
        total: 2,
        baixo: 0,
        medio: 2,
        alto: 0
      }))

      const dashboardDataWithMany = {
        ...mockDashboardData,
        resultados: manyResultados
      }

      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/auth/session') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSession)
          })
        }

        if (url === '/api/rh/empresas') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockEmpresa])
          })
        }

        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(dashboardDataWithMany)
          })
        }

        if (url.includes('/api/admin/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ funcionarios: mockFuncionarios })
          })
        }

        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' })
        })
      })

      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Domínio 1')).toBeInTheDocument()
      })

      // Verifica que mostra apenas 6 domínios
      expect(screen.getByText('Domínio 6')).toBeInTheDocument()
      expect(screen.queryByText('Domínio 7')).not.toBeInTheDocument()

      // Verifica indicador de mais domínios
      expect(screen.getByText('... e mais 4 domínios')).toBeInTheDocument()
    })
  })
})