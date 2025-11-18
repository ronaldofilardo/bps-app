import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import AvaliacaoGrupoPage from '../app/avaliacao/grupo/[id]/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

global.fetch = jest.fn()

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

const expectButtonToBeDisabled = (button: HTMLElement) => {
  expect(button).toHaveAttribute('disabled')
  expect(button.getAttribute('class')).toContain('cursor-not-allowed')
}

const expectButtonToBeEnabled = (button: HTMLElement) => {
  expect(button).not.toHaveAttribute('disabled')
  expect(button.getAttribute('class')).not.toContain('cursor-not-allowed')
}

describe('Bloqueio de navegação após retomada', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(fetch as jest.Mock).mockClear()
    // Limpar sessionStorage antes de cada teste
    ;(window.sessionStorage.getItem as jest.Mock).mockReturnValue(null)
    ;(window.sessionStorage.setItem as jest.Mock).mockClear()
    ;(window.sessionStorage.removeItem as jest.Mock).mockClear()
  })

  it('bloqueia voltar para grupo anterior à retomada', async () => {
    // Retomou no grupo 4, está no grupo 4
    ;(useParams as jest.Mock).mockReturnValue({ id: '4' })
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ session: { cpf: '123', nome: 'Teste' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'em_andamento', grupo_atual: 4 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ respostas: [] })
      })

    render(<AvaliacaoGrupoPage />)
    await waitFor(() => {
      const voltarButton = screen.getByText('← Voltar')
      expectButtonToBeDisabled(voltarButton)
    })
    // Tenta clicar
    fireEvent.click(screen.getByText('← Voltar'))
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('permite voltar até o grupo de retomada, mas não além', async () => {
    // Retomou no grupo 4, está no grupo 6
    ;(useParams as jest.Mock).mockReturnValue({ id: '6' })
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ session: { cpf: '123', nome: 'Teste' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'em_andamento', grupo_atual: 4 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ respostas: [] })
      })

    render(<AvaliacaoGrupoPage />)
    await waitFor(() => {
      const voltarButton = screen.getByText('← Voltar')
      expectButtonToBeEnabled(voltarButton)
    })
    // Clica em voltar (de 6 para 5)
    fireEvent.click(screen.getByText('← Voltar'))
    expect(mockPush).toHaveBeenCalledWith('/avaliacao/grupo/5')
  })

  it('bloqueia voltar para grupo anterior mesmo após múltiplos avanços', async () => {
    // Simula que já há um grupo de retomada salvo no sessionStorage
    ;(window.sessionStorage.getItem as jest.Mock).mockReturnValue('3')
    
    // Está no grupo 3 (grupo de retomada)
    ;(useParams as jest.Mock).mockReturnValue({ id: '3' })
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ session: { cpf: '123', nome: 'Teste' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'em_andamento', grupo_atual: 3 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ respostas: [] })
      })

    render(<AvaliacaoGrupoPage />)
    await waitFor(() => {
      const voltarButton = screen.getByText('← Voltar')
      expectButtonToBeDisabled(voltarButton)
    })
    
    // Tenta voltar para grupo anterior à retomada
    fireEvent.click(screen.getByText('← Voltar'))
    expect(mockPush).not.toHaveBeenCalledWith('/avaliacao/grupo/2')
  })

  it('não bloqueia navegação em avaliação nova', async () => {
    // Avaliação nova, grupo 2
    ;(useParams as jest.Mock).mockReturnValue({ id: '2' })
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ session: { cpf: '123', nome: 'Teste' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'em_andamento', grupo_atual: 1 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ respostas: [] })
      })

    render(<AvaliacaoGrupoPage />)
    await waitFor(() => {
      const voltarButton = screen.getByText('← Voltar')
      expectButtonToBeEnabled(voltarButton)
    })
  })

  it('nunca permite voltar para antes do grupo de retomada, mesmo após múltiplos cliques', async () => {
    // Simula que já há um grupo de retomada salvo no sessionStorage
    ;(window.sessionStorage.getItem as jest.Mock).mockReturnValue('4')
    
    // Está no grupo 4 (grupo de retomada)
    ;(useParams as jest.Mock).mockReturnValue({ id: '4' })
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ session: { cpf: '123', nome: 'Teste' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'em_andamento', grupo_atual: 4 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ respostas: [] })
      })

    render(<AvaliacaoGrupoPage />)
    await waitFor(() => {
      const voltarButton = screen.getByText('← Voltar')
      expectButtonToBeDisabled(voltarButton)
    })
    
    // Tenta clicar múltiplas vezes
    fireEvent.click(screen.getByText('← Voltar'))
    fireEvent.click(screen.getByText('← Voltar'))
    fireEvent.click(screen.getByText('← Voltar'))
    
    // Não deve navegar para grupo anterior
    expect(mockPush).not.toHaveBeenCalledWith('/avaliacao/grupo/3')
  })
})
