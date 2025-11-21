import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Header from '@/components/Header'

// Mock do next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock do fetch global
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar o botão de sair', () => {
    render(<Header userName="Usuário Teste" userRole="admin" />)
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
  })

  it('deve ter cor de fundo escura e texto branco', () => {
    render(<Header userName="Usuário Teste" userRole="admin" />)
    const header = screen.getByRole('banner')
    expect(header).toHaveStyle({ background: '#111', color: 'rgb(255, 255, 255)' })
  })



  it('deve buscar sessão na inicialização', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cpf: '22222222222',
        nome: 'João Operacional Silva',
        perfil: 'funcionario',
        nivelCargo: 'operacional'
      })
    })

    render(<Header />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/session')
    })

    await waitFor(() => {
      expect(screen.getByText('João Operacional Silva')).toBeInTheDocument()
    })
  })

  it('deve exibir nome do usuário quando há sessão', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cpf: '22222222222',
        nome: 'João Operacional Silva',
        perfil: 'funcionario',
        nivelCargo: 'operacional'
      })
    })

    render(<Header />)

    await waitFor(() => {
      expect(screen.getByText('João Operacional Silva')).toBeInTheDocument()
    })
  })

  it('deve exibir nome do usuário para perfil admin', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cpf: '00000000000',
        nome: 'Admin',
        perfil: 'admin'
      })
    })

    render(<Header />)

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })
  })

  it('deve exibir nome do usuário para perfil rh', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cpf: '11111111111',
        nome: 'Gestor RH',
        perfil: 'rh'
      })
    })

    render(<Header />)

    await waitFor(() => {
      expect(screen.getByText('Gestor RH')).toBeInTheDocument()
    })
  })

  it('deve exibir funcionário operacional corretamente', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cpf: '22222222222',
        nome: 'João Operacional Silva',
        perfil: 'funcionario',
        nivelCargo: 'operacional'
      })
    })

    render(<Header />)

    await waitFor(() => {
      expect(screen.getByText('João Operacional Silva')).toBeInTheDocument()
    })
  })

  it('deve exibir funcionário gestão corretamente', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cpf: '33333333333',
        nome: 'Maria Gestão Santos',
        perfil: 'funcionario',
        nivelCargo: 'gestao'
      })
    })

    render(<Header />)

    await waitFor(() => {
      expect(screen.getByText('Maria Gestão Santos')).toBeInTheDocument()
    })
  })

  it('não deve exibir nome quando não há sessão', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false
    })

    render(<Header />)

    await waitFor(() => {
      // Não deve exibir nenhum nome de usuário
      expect(screen.queryByText('João Operacional Silva')).not.toBeInTheDocument()
      expect(screen.queryByText('Maria Gestão Santos')).not.toBeInTheDocument()
      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
      expect(screen.queryByText('Gestor RH')).not.toBeInTheDocument()
    })

    // Deve ter apenas o botão sair
    expect(screen.getByRole('button', { name: /sair/i })).toBeInTheDocument()
  })

  it('deve limpar sessão no logout', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cpf: '22222222222',
          nome: 'João Operacional Silva',
          perfil: 'funcionario',
          nivelCargo: 'operacional'
        })
      })
      .mockResolvedValueOnce({
        ok: true
      })

    render(<Header />)

    // Espera sessão carregar
    await waitFor(() => {
      expect(screen.getByText('João Operacional Silva')).toBeInTheDocument()
    })

    // Simula logout
    fireEvent.click(screen.getByRole('button', { name: /sair/i }))

    // Verifica se fetch de logout foi chamado
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
    })

    // Nome deve desaparecer após logout
    await waitFor(() => {
      expect(screen.queryByText('João Operacional Silva')).not.toBeInTheDocument()
    })
  })

  it('deve redirecionar para login após logout', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cpf: '22222222222',
          nome: 'João Operacional Silva',
          perfil: 'funcionario',
          nivelCargo: 'operacional'
        })
      })
      .mockResolvedValueOnce({
        ok: true
      })

    render(<Header />)

    await waitFor(() => {
      expect(screen.getByText('João Operacional Silva')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /sair/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('deve mostrar título correto para master admin', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cpf: '00000000000',
        nome: 'Master Admin',
        perfil: 'master'
      })
    })

    render(<Header />)

    await waitFor(() => {
      const masterAdminElements = screen.getAllByText('Master Admin')
      expect(masterAdminElements.length).toBeGreaterThan(0)
      expect(masterAdminElements[0]).toBeInTheDocument()
    })
  })

  it('deve mostrar título "Administração" para outros perfis', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        cpf: '22222222222',
        nome: 'João Operacional Silva',
        perfil: 'funcionario',
        nivelCargo: 'operacional'
      })
    })

    render(<Header />)

    await waitFor(() => {
      expect(screen.getByText('Administração')).toBeInTheDocument()
    })
  })
})