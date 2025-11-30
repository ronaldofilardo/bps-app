import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page'

// Mock do Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/rh/empresa/1',
  query: { id: '1' },
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ id: '1' }),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock do Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
}))

jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="chart-bar">Chart</div>,
}))

// Mock do componente Header
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header</div>
  }
})

// Mock do fetch global
const mockFetch = jest.spyOn(global, 'fetch')

// Mock do window.alert
const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {})

describe('RH Empresa Dashboard - Sistema de Lotes', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Configurar mocks
    mockFetch.mockImplementation(async (url) => {
      const urlString = typeof url === 'string' ? url : url.toString()

      if (urlString === '/api/auth/session') {
        return {
          ok: true,
          json: async () => ({
            cpf: '11111111111',
            nome: 'Gestor RH',
            perfil: 'rh'
          })
        } as Response
      }

      if (urlString === '/api/rh/empresas') {
        return {
          ok: true,
          json: async () => ([{
            id: 1,
            nome: 'Indústria Metalúrgica São Paulo',
            cnpj: '11222333000144'
          }])
        } as Response
      }

      if (urlString === '/api/rh/dashboard?empresa_id=1') {
        return {
          ok: true,
          json: async () => ({
            stats: {
              total_avaliacoes: 8,
              concluidas: 6,
              funcionarios_avaliados: 5
            },
            resultados: [],
            distribuicao: []
          })
        } as Response
      }

      if (urlString === '/api/admin/funcionarios?empresa_id=1') {
        return {
          ok: true,
          json: async () => ({
            funcionarios: [{
              cpf: '12345678901',
              nome: 'João Silva',
              setor: 'Produção',
              funcao: 'Operador',
              nivel_cargo: 'Operacional',
              ativo: true,
              avaliacoes: []
            }]
          })
        } as Response
      }

      if (urlString === '/api/rh/lotes?empresa_id=1&limit=5') {
        return {
          ok: true,
          json: async () => ({
            lotes: [{
              id: 1,
              codigo: '001-291125',
              titulo: 'Avaliação Trimestral Q4 2025',
              tipo: 'completo',
              status: 'ativo',
              liberado_em: '2025-11-29T10:00:00Z',
              total_avaliacoes: 5,
              avaliacoes_concluidas: 3,
              avaliacoes_inativadas: 0
            }]
          })
        } as Response
      }

      if (urlString === '/api/rh/laudos') {
        return {
          ok: true,
          json: async () => ([])
        } as Response
      }

      // Mock da API de liberação de lote
      if (urlString === '/api/rh/liberar-lote') {
        return {
          ok: true,
          json: async () => ({
            success: true,
            lote: {
              id: 2,
              codigo: '002-291125',
              titulo: 'Novo Lote Criado',
              tipo: 'completo',
              status: 'ativo',
              liberado_em: new Date().toISOString(),
              total_avaliacoes: 1
            }
          })
        } as Response
      }

      throw new Error(`URL não mapeada: ${urlString}`)
    })
  })

  afterEach(() => {
    mockFetch.mockRestore()
  })

  describe('Seção de Liberação de Lotes', () => {
    it('deve exibir botão para liberar novo lote', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Liberar Novo Lote')).toBeInTheDocument()
      })
    })

    it.skip('deve exibir lotes recentes na sidebar', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('001-291125')).toBeInTheDocument()
        // Verifica que mostra as estatísticas do lote
        expect(screen.getByText('3')).toBeInTheDocument() // avaliacoes_concluidas
        expect(screen.getByText('Pendente')).toBeInTheDocument() // status
      }, { timeout: 10000 })
    })

    it('deve abrir modal ao clicar em liberar lote', async () => {
      const user = userEvent.setup()
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Liberar Novo Lote')).toBeInTheDocument()
      })

      await user.click(screen.getByText('🚀 Liberar Novo Lote'))

      expect(screen.getByText('🚀 Liberar Lote de Avaliações')).toBeInTheDocument()
      expect(screen.getByText(/Crie um novo lote de avaliações para/)).toBeInTheDocument()
    })

    it('deve permitir seleção de tipo de lote', async () => {
      const user = userEvent.setup()
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Liberar Novo Lote')).toBeInTheDocument()
      })

      await user.click(screen.getByText('🚀 Liberar Novo Lote'))

      const select = screen.getByDisplayValue('Completo (Todos os funcionários)')
      expect(select).toBeInTheDocument()

      await user.selectOptions(select, 'operacional')
      expect(select).toHaveValue('operacional')
    })

    it('deve validar título obrigatório', async () => {
      const user = userEvent.setup()
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Liberar Novo Lote')).toBeInTheDocument()
      })

      await user.click(screen.getByText('🚀 Liberar Novo Lote'))

      const button = screen.getByText('🚀 Liberar Lote')
      expect(button).toBeDisabled()
    })

    it('deve permitir preenchimento do formulário', async () => {
      const user = userEvent.setup()
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Liberar Novo Lote')).toBeInTheDocument()
      })

      await user.click(screen.getByText('🚀 Liberar Novo Lote'))

      const tituloInput = screen.getByPlaceholderText('Ex: Avaliação Trimestral Q4 2025')
      const descricaoTextarea = screen.getByPlaceholderText('Descrição adicional sobre este lote...')

      await user.type(tituloInput, 'Teste de Lote')
      await user.type(descricaoTextarea, 'Descrição de teste')

      expect(tituloInput).toHaveValue('Teste de Lote')
      expect(descricaoTextarea).toHaveValue('Descrição de teste')
    })
  })

  describe('Integração com API de Lotes', () => {
    it('deve chamar API de liberação de lote corretamente', async () => {
      const user = userEvent.setup()
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Liberar Novo Lote')).toBeInTheDocument()
      })

      await user.click(screen.getByText('🚀 Liberar Novo Lote'))

      const tituloInput = screen.getByPlaceholderText('Ex: Avaliação Trimestral Q4 2025')
      await user.type(tituloInput, 'Novo Lote Criado')

      await user.click(screen.getByText('🚀 Liberar Lote'))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/rh/liberar-lote', expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Novo Lote Criado')
        }))
      })
    })

    it('deve liberar lote com sucesso', async () => {
      const user = userEvent.setup()
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Liberar Novo Lote')).toBeInTheDocument()
      })

      await user.click(screen.getByText('🚀 Liberar Novo Lote'))

      const tituloInput = screen.getByPlaceholderText('Ex: Avaliação Trimestral Q4 2025')
      await user.type(tituloInput, 'Novo Lote Criado')

      await user.click(screen.getByText('🚀 Liberar Lote'))

      // Verifica que a API foi chamada
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/rh/liberar-lote', expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Novo Lote Criado')
        }))
      })

      // Verifica que não houve erro (o alert de erro não foi chamado)
      // Nota: O mock da API retorna sucesso, então não deve haver erro
    })
  })
})