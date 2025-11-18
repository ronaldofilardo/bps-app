import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import AvaliacaoGrupoPage from '../app/avaliacao/grupo/[id]/page'

// Mock do next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

// Mock do fetch
global.fetch = jest.fn()

// Helper para verificar se um botão está desabilitado
const expectButtonToBeDisabled = (button: HTMLElement) => {
  expect(button).toHaveAttribute('disabled')
  expect(button.getAttribute('class')).toContain('cursor-not-allowed')
}

const expectButtonToBeEnabled = (button: HTMLElement) => {
  expect(button).not.toHaveAttribute('disabled')
  expect(button.getAttribute('class')).not.toContain('cursor-not-allowed')
}

describe('Navegação entre grupos após retomada', () => {
  const mockPush = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(fetch as jest.Mock).mockClear()
  })

  it('deve desabilitar botão Voltar quando tentaria ir para grupo anterior à retomada', async () => {
    // Mock: retomou no grupo 2, está no grupo 2 - não pode voltar para grupo 1
    ;(useParams as jest.Mock).mockReturnValue({ id: '2' })
    
    // Mock da sessão
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          session: { cpf: '12345678901', nome: 'Teste' }
        })
      })
      // Mock do status - retomou no grupo 2
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          status: 'em_andamento',
          grupo_atual: 2
        })
      })
      // Mock das respostas
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ respostas: [] })
      })

    render(<AvaliacaoGrupoPage />)

    await waitFor(() => {
      const voltarButton = screen.getByText('← Voltar')
      expectButtonToBeDisabled(voltarButton)
      expect(voltarButton).toHaveAttribute('title', 'Não é permitido voltar para grupos anteriores à retomada')
    })
  })

  it('deve habilitar botão Voltar quando pode voltar até grupo de retomada', async () => {
    // Mock: retomou no grupo 2, agora está no grupo 4 - pode voltar até grupo 2
    ;(useParams as jest.Mock).mockReturnValue({ id: '4' })
    
    // Mock da sessão
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          session: { cpf: '12345678901', nome: 'Teste' }
        })
      })
      // Mock do status - retomou no grupo 2
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          status: 'em_andamento',
          grupo_atual: 2
        })
      })
      // Mock das respostas
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ respostas: [] })
      })

    render(<AvaliacaoGrupoPage />)

    await waitFor(() => {
      const voltarButton = screen.getByText('← Voltar')
      expectButtonToBeEnabled(voltarButton)
      expect(voltarButton).not.toHaveAttribute('title', 'Não é permitido voltar para grupos anteriores à retomada')
    })
  })

  it('deve permitir voltar até o grupo de retomada, mas não além', async () => {
    // Mock: retomou no grupo 2, está no grupo 3 - pode voltar para grupo 2
    ;(useParams as jest.Mock).mockReturnValue({ id: '3' })
    
    // Mock da sessão
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          session: { cpf: '12345678901', nome: 'Teste' }
        })
      })
      // Mock do status - retomou no grupo 2
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          status: 'em_andamento',
          grupo_atual: 2
        })
      })
      // Mock das respostas
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ respostas: [] })
      })

    render(<AvaliacaoGrupoPage />)

    await waitFor(() => {
      const voltarButton = screen.getByText('← Voltar')
      expectButtonToBeEnabled(voltarButton)
    })

    // Clica em voltar - deve ir para o grupo 2
    fireEvent.click(screen.getByText('← Voltar'))
    expect(mockPush).toHaveBeenCalledWith('/avaliacao/grupo/2')
  })

  it('deve funcionar normalmente quando não há retomada (avaliação nova)', async () => {
    // Mock: avaliação nova, está no grupo 3
    ;(useParams as jest.Mock).mockReturnValue({ id: '3' })
    
    // Mock da sessão
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          session: { cpf: '12345678901', nome: 'Teste' }
        })
      })
      // Mock do status - avaliação nova (grupo_atual = 1)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          status: 'em_andamento',
          grupo_atual: 1
        })
      })
      // Mock das respostas
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ respostas: [] })
      })

    render(<AvaliacaoGrupoPage />)

    await waitFor(() => {
      const voltarButton = screen.getByText('← Voltar')
      // Como grupo_atual (1) < grupoId (3), não é uma retomada, botão deve estar habilitado
      expectButtonToBeEnabled(voltarButton)
    })
  })
})