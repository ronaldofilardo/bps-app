import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import DetalhesLotePage from '@/app/rh/empresa/[id]/lote/[loteId]/page'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
}))

global.fetch = jest.fn()
global.alert = jest.fn()
global.confirm = jest.fn()

const mockRouter = {
  push: jest.fn(),
  back: jest.fn()
}

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
const mockAlert = global.alert as jest.MockedFunction<typeof alert>
const mockConfirm = global.confirm as jest.MockedFunction<typeof confirm>

describe('Página de Detalhes do Lote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(useParams as jest.Mock).mockReturnValue({ id: '100', loteId: '1' })
  })

  const mockLoteData = {
    success: true,
    lote: {
      id: 1,
      codigo: 'LOT-001',
      titulo: 'Lote de Teste',
      descricao: 'Descrição do lote',
      tipo: 'completo',
      status: 'ativo',
      liberado_em: '2025-11-20T10:00:00',
      liberado_por_nome: 'Admin Silva',
      empresa_nome: 'Empresa Teste'
    },
    estatisticas: {
      total_avaliacoes: 10,
      avaliacoes_concluidas: 7,
      avaliacoes_inativadas: 1,
      avaliacoes_pendentes: 2
    },
    funcionarios: [
      {
        cpf: '12345678901',
        nome: 'João Silva',
        setor: 'TI',
        funcao: 'Desenvolvedor',
        matricula: '001',
        nivel_cargo: 'operacional',
        turno: 'Diurno',
        escala: '8h',
        avaliacao: {
          id: 1,
          status: 'concluida',
          data_inicio: '2025-11-28T08:00:00',
          data_conclusao: '2025-12-01T10:00:00'
        }
      },
      {
        cpf: '98765432109',
        nome: 'Maria Santos',
        setor: 'RH',
        funcao: 'Analista',
        matricula: '002',
        nivel_cargo: 'gestao',
        turno: 'Diurno',
        escala: '8h',
        avaliacao: {
          id: 2,
          status: 'em_andamento',
          data_inicio: '2025-11-28T08:00:00',
          data_conclusao: null
        }
      }
    ],
    total: 2
  }

  describe('Carregamento e Autenticação', () => {
    it('deve mostrar loading inicial', () => {
      mockFetch.mockImplementation(() => new Promise(() => {}))

      render(<DetalhesLotePage />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('deve redirecionar para login se sessão inválida', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401
      } as Response)

      render(<DetalhesLotePage />)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login')
      })
    })

    it('deve carregar dados do lote após verificação de sessão', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ session: { cpf: '123', perfil: 'rh' } })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockLoteData
        } as Response)

      render(<DetalhesLotePage />)

      await waitFor(() => {
        expect(screen.getByText('Lote de Teste')).toBeInTheDocument()
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/session')
      expect(mockFetch).toHaveBeenCalledWith('/api/rh/lotes/1/funcionarios?empresa_id=100')
    })
  })

  describe('Renderização de Dados', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ session: { cpf: '123', perfil: 'rh' } })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockLoteData
        } as Response)

      render(<DetalhesLotePage />)

      await waitFor(() => {
        expect(screen.getByText('Lote de Teste')).toBeInTheDocument()
      })
    })

    it('deve exibir informações do lote corretamente', () => {
      expect(screen.getByText('Lote de Teste')).toBeInTheDocument()
      expect(screen.getByText(/LOT-001/)).toBeInTheDocument()
      expect(screen.getByText(/Empresa Teste/)).toBeInTheDocument()
      expect(screen.getByText(/Descrição do lote/)).toBeInTheDocument()
    })

    it('deve exibir estatísticas corretas', () => {
      expect(screen.getByText('10')).toBeInTheDocument() // total
      expect(screen.getByText('7')).toBeInTheDocument() // concluídas
      expect(screen.getByText('2')).toBeInTheDocument() // pendentes
      expect(screen.getByText('1')).toBeInTheDocument() // inativadas
    })

    it('deve renderizar tabela de funcionários', () => {
      expect(screen.getByText('João Silva')).toBeInTheDocument()
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
      expect(screen.getByText('TI')).toBeInTheDocument()
      expect(screen.getByText('RH')).toBeInTheDocument()
    })

    it('deve exibir badges de status corretos', () => {
      expect(screen.getByText('Concluída')).toBeInTheDocument()
      expect(screen.getByText('Em andamento')).toBeInTheDocument()
    })

    it('deve exibir matrícula e nível de cargo', () => {
      expect(screen.getByText('001')).toBeInTheDocument()
      expect(screen.getByText('002')).toBeInTheDocument()
      expect(screen.getByText('Operacional')).toBeInTheDocument()
      expect(screen.getByText('Gestão')).toBeInTheDocument()
    })

    it('deve exibir data de conclusão apenas para avaliações concluídas', () => {
      const rows = screen.getAllByRole('row')
      // João Silva (concluída) deve ter data
      expect(rows[1]).toHaveTextContent(/01\/12\/2025/)
      // Maria Santos (em andamento) deve ter "-"
      const mariaCells = rows[2].querySelectorAll('td')
      expect(mariaCells[mariaCells.length - 1]).toHaveTextContent('-')
    })
  })

  describe('Filtros e Busca', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ session: { cpf: '123', perfil: 'rh' } })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockLoteData
        } as Response)

      render(<DetalhesLotePage />)

      await waitFor(() => {
        expect(screen.getByText('Lote de Teste')).toBeInTheDocument()
      })
    })

    it('deve filtrar funcionários por busca de texto', async () => {
      const searchInput = screen.getByPlaceholderText(/Buscar por nome/)

      fireEvent.change(searchInput, { target: { value: 'João' } })

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
      })
    })

    it('deve filtrar por CPF', async () => {
      const searchInput = screen.getByPlaceholderText(/Buscar por nome/)

      fireEvent.change(searchInput, { target: { value: '123456' } })

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
      })
    })

    it('deve filtrar por setor', async () => {
      const searchInput = screen.getByPlaceholderText(/Buscar por nome/)

      fireEvent.change(searchInput, { target: { value: 'RH' } })

      await waitFor(() => {
        expect(screen.getByText('Maria Santos')).toBeInTheDocument()
        expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
      })
    })

    it('deve filtrar por status concluída', async () => {
      const statusSelect = screen.getByRole('combobox')

      fireEvent.change(statusSelect, { target: { value: 'concluida' } })

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
      })
    })

    it('deve filtrar por status pendente', async () => {
      const statusSelect = screen.getByRole('combobox')

      fireEvent.change(statusSelect, { target: { value: 'pendente' } })

      await waitFor(() => {
        expect(screen.getByText('Maria Santos')).toBeInTheDocument()
        expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
      })
    })

    it('deve mostrar contador de funcionários filtrados', async () => {
      expect(screen.getByText(/Mostrando 2 de 2/)).toBeInTheDocument()

      const searchInput = screen.getByPlaceholderText(/Buscar por nome/)
      fireEvent.change(searchInput, { target: { value: 'João' } })

      await waitFor(() => {
        expect(screen.getByText(/Mostrando 1 de 2/)).toBeInTheDocument()
      })
    })
  })

  describe('Navegação', () => {
    it('deve voltar para dashboard ao clicar em Voltar', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ session: { cpf: '123', perfil: 'rh' } })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockLoteData
        } as Response)

      render(<DetalhesLotePage />)

      await waitFor(() => {
        expect(screen.getByText('Lote de Teste')).toBeInTheDocument()
      })

      const backButton = screen.getByText(/Voltar para Dashboard/)
      fireEvent.click(backButton)

      expect(mockRouter.push).toHaveBeenCalledWith('/rh/empresa/100')
    })
  })

  describe('Geração de Relatório', () => {
    beforeEach(async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ session: { cpf: '123', perfil: 'rh' } })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockLoteData
        } as Response)

      render(<DetalhesLotePage />)

      await waitFor(() => {
        expect(screen.getByText('Lote de Teste')).toBeInTheDocument()
      })
    })

    it('deve habilitar botão de relatório quando lote está pronto', () => {
      const reportButton = screen.getByText(/Gerar Relatório PDF/)
      expect(reportButton).not.toBeDisabled()
    })

    it('deve gerar relatório ao clicar no botão e confirmar', async () => {
      mockConfirm.mockReturnValueOnce(true)
      
      const blob = new Blob(['PDF content'], { type: 'application/pdf' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => blob
      } as Response)

      const reportButton = screen.getByText(/Gerar Relatório PDF/)
      fireEvent.click(reportButton)

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith(expect.stringContaining('LOT-001'))
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/avaliacao/relatorio-impressao?lote_id=1&empresa_id=100&formato=pdf')
        )
      })
    })

    it('não deve gerar relatório se usuário cancelar confirmação', async () => {
      mockConfirm.mockReturnValueOnce(false)

      const reportButton = screen.getByText(/Gerar Relatório PDF/)
      fireEvent.click(reportButton)

      expect(mockConfirm).toHaveBeenCalled()
      expect(mockFetch).toHaveBeenCalledTimes(2) // apenas session e load data
    })
  })

  describe('Tratamento de Erros', () => {
    it('deve mostrar erro e voltar se API retornar erro', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ session: { cpf: '123', perfil: 'rh' } })
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Lote não encontrado' })
        } as Response)

      render(<DetalhesLotePage />)

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Lote não encontrado'))
        expect(mockRouter.push).toHaveBeenCalledWith('/rh/empresa/100')
      })
    })

    it('deve exibir mensagem quando não há funcionários', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ session: { cpf: '123', perfil: 'rh' } })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockLoteData,
            funcionarios: [],
            total: 0
          })
        } as Response)

      render(<DetalhesLotePage />)

      await waitFor(() => {
        expect(screen.getByText(/Nenhum funcionário neste lote/)).toBeInTheDocument()
      })
    })

    it('deve mostrar mensagem quando filtros não encontram resultados', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ session: { cpf: '123', perfil: 'rh' } })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockLoteData
        } as Response)

      render(<DetalhesLotePage />)

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText(/Buscar por nome/)
      fireEvent.change(searchInput, { target: { value: 'ZZZZZ' } })

      await waitFor(() => {
        expect(screen.getByText(/Nenhum funcionário encontrado com os filtros aplicados/)).toBeInTheDocument()
      })
    })
  })

  describe('Campos Opcionais', () => {
    it('deve exibir "-" quando matrícula é null', async () => {
      const dataWithNullMatricula = {
        ...mockLoteData,
        funcionarios: [{
          ...mockLoteData.funcionarios[0],
          matricula: null
        }]
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ session: { cpf: '123', perfil: 'rh' } })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => dataWithNullMatricula
        } as Response)

      render(<DetalhesLotePage />)

      await waitFor(() => {
        const cells = screen.getAllByRole('cell')
        const matriculaCell = cells.find(cell => 
          cell.textContent === '-' && cells.indexOf(cell) === 4
        )
        expect(matriculaCell).toBeInTheDocument()
      })
    })

    it('deve exibir "-" quando nivel_cargo é null', async () => {
      const dataWithNullNivel = {
        ...mockLoteData,
        funcionarios: [{
          ...mockLoteData.funcionarios[0],
          nivel_cargo: null
        }]
      }

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ session: { cpf: '123', perfil: 'rh' } })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => dataWithNullNivel
        } as Response)

      render(<DetalhesLotePage />)

      await waitFor(() => {
        const cells = screen.getAllByRole('cell')
        // Verificar que há um "-" na coluna de nível
        expect(screen.getAllByText('-').length).toBeGreaterThan(0)
      })
    })
  })
})
