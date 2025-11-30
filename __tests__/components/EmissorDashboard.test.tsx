/**
 * Testes para o componente EmissorDashboard
 *
 * Funcionalidades testadas:
 * 1. Renderização inicial com loading
 * 2. Exibição de lotes quando carregados
 * 3. Tratamento de erro na API
 * 4. Botão de refresh
 * 5. Navegação para laudo
 * 6. Estados vazios
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EmissorDashboard from '@/app/emissor/page'

// Mock do useRouter
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock do toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
}))

// Mock do fetch
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('EmissorDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve mostrar loading inicialmente', () => {
    mockFetch.mockImplementationOnce(() =>
      new Promise(() => {}) // Nunca resolve
    )

    render(<EmissorDashboard />)

    expect(screen.getByText('Carregando lotes...')).toBeInTheDocument()
  })

  it('deve renderizar lotes quando API retorna sucesso', async () => {
    const mockLotes = [
      {
        id: 1,
        codigo: '001-291125',
        titulo: 'Lote Teste',
        tipo: 'completo',
        empresa_nome: 'Empresa Teste',
        clinica_nome: 'Clínica Teste',
        liberado_em: '2025-11-29T10:00:00Z',
        laudo: {
          id: 100,
          observacoes: 'Observações do laudo',
          status: 'rascunho',
          emitido_em: null,
          enviado_em: null,
        },
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lotes: mockLotes,
        total: 1,
      }),
    } as Response)

    render(<EmissorDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Lote Teste - Lote: 001-291125')).toBeInTheDocument()
    })

    expect(screen.getByText('Empresa Teste')).toBeInTheDocument()
    expect(screen.getByText('Clínica Teste')).toBeInTheDocument()
    expect(screen.getByText('Abrir Laudo Biopsicossocial')).toBeInTheDocument()
  })

  it('deve mostrar mensagem quando não há lotes', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lotes: [],
        total: 0,
      }),
    } as Response)

    render(<EmissorDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Nenhum lote encontrado no histórico de emissões.')).toBeInTheDocument()
    })
  })

  it('deve mostrar erro quando API falha', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response)

    render(<EmissorDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/HTTP 500: Internal Server Error/)).toBeInTheDocument()
    })

    expect(screen.getByText('Tentar Novamente')).toBeInTheDocument()
  })

  it('deve navegar para laudo quando botão é clicado', async () => {
    const mockLotes = [
      {
        id: 123,
        codigo: '001-291125',
        titulo: 'Lote Teste',
        tipo: 'completo',
        empresa_nome: 'Empresa Teste',
        clinica_nome: 'Clínica Teste',
        liberado_em: '2025-11-29T10:00:00Z',
        laudo: {
          id: 100,
          observacoes: 'Observações do laudo',
          status: 'rascunho',
          emitido_em: null,
          enviado_em: null,
        },
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lotes: mockLotes,
        total: 1,
      }),
    } as Response)

    render(<EmissorDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Abrir Laudo Biopsicossocial')).toBeInTheDocument()
    })

    const button = screen.getByText('Abrir Laudo Biopsicossocial')
    fireEvent.click(button)

    expect(mockPush).toHaveBeenCalledWith('/emissor/laudo/123')
  })

  it('deve recarregar dados quando botão de refresh é clicado', async () => {
    const mockLotes = [
      {
        id: 1,
        codigo: '001-291125',
        titulo: 'Lote Teste',
        tipo: 'completo',
        empresa_nome: 'Empresa Teste',
        clinica_nome: 'Clínica Teste',
        liberado_em: '2025-11-29T10:00:00Z',
        laudo: {
          id: 100,
          observacoes: 'Observações do laudo',
          status: 'rascunho',
          emitido_em: null,
          enviado_em: null,
        },
      },
    ]

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        lotes: mockLotes,
        total: 1,
      }),
    } as Response)

    render(<EmissorDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Lote Teste - Lote: 001-291125')).toBeInTheDocument()
    })

    // Simular clique no botão de refresh
    const refreshButton = screen.getByText('Atualizar')
    fireEvent.click(refreshButton)

    // Verificar se fetch foi chamado novamente
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('deve mostrar status do laudo corretamente', async () => {
    const mockLotes = [
      {
        id: 1,
        codigo: '001-291125',
        titulo: 'Lote Rascunho',
        tipo: 'completo',
        empresa_nome: 'Empresa Teste',
        clinica_nome: 'Clínica Teste',
        liberado_em: '2025-11-29T10:00:00Z',
        laudo: {
          id: 100,
          observacoes: 'Observações do laudo',
          status: 'rascunho',
          emitido_em: null,
          enviado_em: null,
        },
      },
      {
        id: 2,
        codigo: '002-291125',
        titulo: 'Lote Emitido',
        tipo: 'completo',
        empresa_nome: 'Empresa B',
        clinica_nome: 'Clínica B',
        liberado_em: '2025-11-29T11:00:00Z',
        laudo: {
          id: 101,
          observacoes: 'Laudo emitido',
          status: 'emitido',
          emitido_em: '2025-11-30T10:00:00Z',
          enviado_em: null,
        },
      },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lotes: mockLotes,
        total: 2,
      }),
    } as Response)

    render(<EmissorDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Rascunho')).toBeInTheDocument()
      expect(screen.getByText('Emitido')).toBeInTheDocument()
    })
  })
})