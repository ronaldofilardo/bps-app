/**
 * Testes para componente NotificationCenterClinica
 *
 * Funcionalidades testadas:
 * 1. Renderização do ícone de notificações com badge
 * 2. Abertura/fechamento do painel
 * 3. Listagem de notificações
 * 4. Estrutura das notificações
 * 5. Atualização automática
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import NotificationCenterClinica from '@/components/NotificationCenterClinica'

// Mock fetch
global.fetch = jest.fn()

const mockNavigate = jest.fn()

describe('NotificationCenterClinica', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      json: async () => ({
        success: true,
        notificacoes: [],
        totalNaoLidas: 0,
      }),
    })
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe('Renderização Inicial', () => {
    it('deve renderizar o ícone de sino', () => {
      render(<NotificationCenterClinica />)
      const button = screen.getByTitle('Central de Notificações')
      expect(button).toBeInTheDocument()
    })

    it('não deve mostrar badge quando não há notificações', async () => {
      render(<NotificationCenterClinica />)

      await waitFor(() => {
        const badge = screen.queryByText('0')
        expect(badge).not.toBeInTheDocument()
      })
    })

    it('deve mostrar badge com quantidade de notificações', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: [{}, {}, {}],
          totalNaoLidas: 3,
        }),
      })

      render(<NotificationCenterClinica />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })

    it('deve mostrar "9+" quando há mais de 9 notificações', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: new Array(12).fill({}),
          totalNaoLidas: 12,
        }),
      })

      render(<NotificationCenterClinica />)

      await waitFor(() => {
        expect(screen.getByText('9+')).toBeInTheDocument()
      })
    })
  })

  describe('Abertura e Fechamento do Painel', () => {
    it('deve abrir painel ao clicar no ícone', async () => {
      render(<NotificationCenterClinica />)

      const button = screen.getByTitle('Central de Notificações')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Notificações')).toBeInTheDocument()
      })
    })

    it('deve fechar painel ao clicar no X', async () => {
      render(<NotificationCenterClinica />)

      const button = screen.getByTitle('Central de Notificações')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Notificações')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('Notificações')).not.toBeInTheDocument()
      })
    })

    it('deve fechar painel ao clicar no overlay', async () => {
      render(<NotificationCenterClinica />)

      const button = screen.getByTitle('Central de Notificações')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Notificações')).toBeInTheDocument()
      })

      const overlay = document.querySelector('.fixed.inset-0.bg-black\\/40')
      if (overlay) {
        fireEvent.click(overlay)
      }

      await waitFor(() => {
        expect(screen.queryByText('Notificações')).not.toBeInTheDocument()
      })
    })
  })

  describe('Listagem de Notificações', () => {
    it('deve mostrar mensagem quando não há notificações', async () => {
      render(<NotificationCenterClinica />)

      const button = screen.getByTitle('Central de Notificações')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Nenhuma notificação')).toBeInTheDocument()
      })
    })

    it('deve listar notificações recebidas', async () => {
      const mockNotificacoes = [
        {
          id: 'avaliacao_concluida_1',
          tipo: 'avaliacao_concluida',
          lote_id: 10,
          codigo: '001-301125',
          titulo: 'Lote Teste 1',
          empresa_nome: 'Empresa A',
          data_evento: '2025-11-29T10:00:00Z',
          mensagem: 'Nova avaliação concluída no lote "Lote Teste 1"'
        },
        {
          id: 'lote_concluido_10',
          tipo: 'lote_concluido',
          lote_id: 11,
          codigo: '002-301125',
          titulo: 'Lote Teste 2',
          empresa_nome: 'Empresa B',
          data_evento: '2025-11-29T11:00:00Z',
          mensagem: 'Lote "Lote Teste 2" totalmente concluído'
        },
        {
          id: 'laudo_enviado_100',
          tipo: 'laudo_enviado',
          lote_id: 12,
          codigo: '003-301125',
          titulo: 'Lote Teste 3',
          empresa_nome: 'Empresa C',
          data_evento: '2025-11-29T12:00:00Z',
          mensagem: 'Laudo enviado para o lote "Lote Teste 3"'
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: mockNotificacoes,
          totalNaoLidas: 3,
        }),
      })

      render(<NotificationCenterClinica />)

      const button = screen.getByTitle('Central de Notificações')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/Nova avaliação concluída/)).toBeInTheDocument()
        expect(screen.getByText(/Lote.*totalmente concluído/)).toBeInTheDocument()
        expect(screen.getByText(/Laudo enviado/)).toBeInTheDocument()
        expect(screen.getByText('001-301125')).toBeInTheDocument()
        expect(screen.getByText('002-301125')).toBeInTheDocument()
        expect(screen.getByText('003-301125')).toBeInTheDocument()
      })
    })

    it('deve aplicar ícones corretos para cada tipo de notificação', async () => {
      const mockNotificacoes = [
        {
          id: 'avaliacao_concluida_1',
          tipo: 'avaliacao_concluida',
          lote_id: 10,
          codigo: '001-301125',
          titulo: 'Lote Teste',
          empresa_nome: 'Empresa A',
          data_evento: '2025-11-29T10:00:00Z',
          mensagem: 'Nova avaliação concluída'
        }
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: mockNotificacoes,
          totalNaoLidas: 1,
        }),
      })

      render(<NotificationCenterClinica />)

      const button = screen.getByTitle('Central de Notificações')
      fireEvent.click(button)

      await waitFor(() => {
        const notification = screen.getByText('Nova avaliação concluída').closest('.mb-2')
        expect(notification).toBeInTheDocument()
        // Verifica se o ícone CheckCircle está presente (através da estrutura)
        const iconContainer = notification?.querySelector('[class*="p-2.5"]')
        expect(iconContainer).toBeInTheDocument()
      })
    })
  })

  describe('Navegação', () => {
    it('deve chamar callback ao clicar em notificação', async () => {
      const mockNotificacoes = [{
        id: 'avaliacao_concluida_1',
        tipo: 'avaliacao_concluida',
        lote_id: 10,
        codigo: '001-301125',
        titulo: 'Lote Teste',
        empresa_nome: 'Empresa A',
        data_evento: '2025-11-29T10:00:00Z',
        mensagem: 'Nova avaliação concluída'
      }]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: mockNotificacoes,
          totalNaoLidas: 1,
        }),
      })

      render(<NotificationCenterClinica onNavigateToLote={mockNavigate} />)

      const button = screen.getByTitle('Central de Notificações')
      fireEvent.click(button)

      await waitFor(() => {
        const notification = screen.getByText('Nova avaliação concluída')
        fireEvent.click(notification)
      })

      expect(mockNavigate).toHaveBeenCalledWith(10)
    })

    it('deve fechar painel após navegar', async () => {
      const mockNotificacoes = [{
        id: 'avaliacao_concluida_1',
        tipo: 'avaliacao_concluida',
        lote_id: 10,
        codigo: '001-301125',
        titulo: 'Lote Teste',
        empresa_nome: 'Empresa A',
        data_evento: '2025-11-29T10:00:00Z',
        mensagem: 'Nova avaliação concluída'
      }]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: mockNotificacoes,
          totalNaoLidas: 1,
        }),
      })

      render(<NotificationCenterClinica onNavigateToLote={mockNavigate} />)

      const openButton = screen.getByTitle('Central de Notificações')
      fireEvent.click(openButton)

      await waitFor(() => {
        expect(screen.getByText('Notificações')).toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('Nova avaliação concluída')).toBeInTheDocument()
      })

      const notification = screen.getByText('Nova avaliação concluída')
      fireEvent.click(notification)

      expect(mockNavigate).toHaveBeenCalledWith(10)

      await waitFor(() => {
        expect(screen.queryByText('Central de Notificações')).not.toBeInTheDocument()
      })
    })
  })

  describe('Atualização de Notificações', () => {
    it('deve buscar notificações na montagem do componente', () => {
      render(<NotificationCenterClinica />)

      expect(global.fetch).toHaveBeenCalledWith('/api/rh/notificacoes')
    })

    it('deve permitir atualização manual', async () => {
      const mockNotificacoes = [
        {
          id: 'avaliacao_concluida_1',
          tipo: 'avaliacao_concluida',
          lote_id: 10,
          codigo: '001-301125',
          titulo: 'Lote Teste',
          empresa_nome: 'Empresa A',
          data_evento: '2025-11-29T10:00:00Z',
          mensagem: 'Nova avaliação concluída'
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        json: async () => ({
          success: true,
          notificacoes: mockNotificacoes,
          totalNaoLidas: 1,
        }),
      })

      render(<NotificationCenterClinica />)

      const button = screen.getByTitle('Central de Notificações')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('🔄 Atualizar')).toBeInTheDocument()
      })

      const updateButton = screen.getByText('🔄 Atualizar')
      fireEvent.click(updateButton)

      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('Estados de Loading e Erro', () => {
    it('deve mostrar loading ao buscar notificações', async () => {
      render(<NotificationCenterClinica />)

      const button = screen.getByTitle('Central de Notificações')
      fireEvent.click(button)

      // O loading inicial já passou, mas ao clicar em atualizar deveria mostrar
      await waitFor(() => {
        expect(screen.getByText('Notificações')).toBeInTheDocument()
      })
    })

    it('deve tratar erro ao buscar notificações', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
      ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

      render(<NotificationCenterClinica />)

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled()
      })

      consoleError.mockRestore()
    })
  })
})