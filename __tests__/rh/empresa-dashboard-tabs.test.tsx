/**
 * Testes para Interface com Abas do Dashboard de Empresa
 * Sistema de abas, cards de lotes com laudos integrados, funcionalidade preservada
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useRouter, useParams } from 'next/navigation'
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page'

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
}))

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn()
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn()
}))

jest.mock('react-chartjs-2', () => ({
  Bar: () => <div>Mock Chart</div>
}))

global.fetch = jest.fn()
global.alert = jest.fn()
global.confirm = jest.fn()

const mockFuncionarios = Array(20).fill(null).map((_, i) => ({
  cpf: String(10000000000 + i),
  nome: `Funcionário ${i + 1}`,
  setor: i % 3 === 0 ? 'TI' : i % 3 === 1 ? 'RH' : 'Produção',
  funcao: i % 2 === 0 ? 'Desenvolvedor' : 'Gestor',
  email: `func${i + 1}@teste.com`,
  matricula: `MAT${String(i + 1).padStart(3, '0')}`,
  nivel_cargo: i % 2 === 0 ? 'operacional' : 'gestao',
  turno: 'Manhã',
  escala: '8x40',
  empresa_nome: 'Empresa Teste',
  ativo: true,
  avaliacoes: []
}))

const mockLotes = [
  {
    id: 1,
    codigo: 'LOTE001',
    titulo: 'Avaliação Trimestral Q1',
    tipo: 'completo',
    liberado_em: '2025-01-15T10:00:00Z',
    status: 'ativo',
    total_avaliacoes: 50,
    avaliacoes_concluidas: 35,
    avaliacoes_inativadas: 2
  },
  {
    id: 2,
    codigo: 'LOTE002',
    titulo: 'Avaliação Gestão 2025',
    tipo: 'gestao',
    liberado_em: '2025-02-01T14:30:00Z',
    status: 'ativo',
    total_avaliacoes: 25,
    avaliacoes_concluidas: 20,
    avaliacoes_inativadas: 1
  }
]

const mockLaudos = [
  {
    id: 1,
    lote_id: 1,
    codigo: 'LOTE001',
    titulo: 'Laudo Avaliação Trimestral Q1',
    empresa_nome: 'Empresa Teste',
    clinica_nome: 'Clínica BPS Brasil',
    emissor_nome: 'Dr. João Silva',
    enviado_em: '2025-01-20T09:15:00Z',
    hash: 'abc123def456'
  }
]

describe('Interface com Abas - Dashboard Empresa', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(useParams as jest.Mock).mockReturnValue({ id: '1' })

    // Setup DOM básico para evitar problemas com createRoot
    document.body.innerHTML = ''

    // Mock padrão de fetch
    ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ cpf: '11111111111', nome: 'RH Teste', perfil: 'rh' })
        })
      }
      if (url.includes('/api/rh/empresas')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, nome: 'Empresa Teste', cnpj: '12345678000100' }]
        })
      }
      if (url.includes('/api/rh/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            stats: { total_avaliacoes: 100, concluidas: 50, funcionarios_avaliados: 25 },
            resultados: [],
            distribuicao: []
          })
        })
      }
      if (url.includes('/api/admin/funcionarios')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ funcionarios: mockFuncionarios })
        })
      }
      if (url.includes('/api/rh/lotes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ lotes: mockLotes })
        })
      }
      if (url.includes('/api/rh/laudos')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ laudos: mockLaudos })
        })
      }
      return Promise.resolve({ ok: false })
    })
  })

  describe('Sistema de Abas', () => {
    it('deve exibir abas "Lotes de avaliações" e "Funcionários"', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('📋 Lotes de avaliações')).toBeInTheDocument()
        expect(screen.getByText('👥 Funcionários')).toBeInTheDocument()
      })
    })

    it('deve iniciar na aba "Lotes de avaliações"', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('📋 Lotes de Avaliações')).toBeInTheDocument()
        expect(screen.getByText('🚀 Liberar Novo Lote')).toBeInTheDocument()
      })
    })

    it('deve alternar para aba "Funcionários" ao clicar', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('📋 Lotes de avaliações')).toBeInTheDocument()
      })

      const funcionariosTab = screen.getByText('👥 Funcionários')
      fireEvent.click(funcionariosTab)

      await waitFor(() => {
        expect(screen.getByText('👥 Gerenciar Funcionários')).toBeInTheDocument()
        expect(screen.getByText('Inserir Individual')).toBeInTheDocument()
      })
    })

    it('deve destacar aba ativa visualmente', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        const lotesTab = screen.getByText('📋 Lotes de avaliações')
        expect(lotesTab).toHaveClass('border-primary')
      })

      const funcionariosTab = screen.getByText('👥 Funcionários')
      fireEvent.click(funcionariosTab)

      await waitFor(() => {
        expect(funcionariosTab).toHaveClass('border-primary')
        const lotesTab = screen.getByText('📋 Lotes de avaliações')
        expect(lotesTab).not.toHaveClass('border-primary')
      })
    })
  })

  describe('Aba "Lotes de avaliações"', () => {
    it('deve exibir botão "Liberar Novo Lote"', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('🚀 Liberar Novo Lote')).toBeInTheDocument()
      })
    })

    it.skip('deve exibir cards de lotes com informações completas', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Avaliação Trimestral Q1')).toBeInTheDocument()
        expect(screen.getByText('Código: LOTE001')).toBeInTheDocument()
        // Verificar elementos específicos usando seletores mais diretos
        expect(screen.getByText('Avaliações liberadas:')).toBeInTheDocument()
        expect(screen.getByText('50')).toBeInTheDocument()
        expect(screen.getByText('Concluídas:')).toBeInTheDocument()
        expect(screen.getByText('35')).toBeInTheDocument()
      })
    })

    it.skip('deve exibir status do relatório corretamente', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('Status relatório:')).toBeInTheDocument()
        expect(screen.getByText('Pendente')).toBeInTheDocument()
      })
    })

    it('deve exibir botão "Gerar Relatório PDF" quando pronto', async () => {
      render(<EmpresaDashboardPage />)

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      await waitFor(() => {
        const buttons = screen.getAllByText('📊 Gerar Relatório PDF')
        expect(buttons.length).toBeGreaterThan(0)
      })
    })

    it('deve integrar laudos nos cards quando disponíveis', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('📄 Laudo disponível')).toBeInTheDocument()
        expect(screen.getByText('Emissor: Dr. João Silva')).toBeInTheDocument()
        expect(screen.getByText('📥 Baixar Laudo PDF')).toBeInTheDocument()
      })
    })

    it('deve exibir mensagem quando não há lotes', async () => {
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/rh/lotes')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ lotes: [] })
          })
        }
        if (url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ cpf: '11111111111', nome: 'RH Teste', perfil: 'rh' })
          })
        }
        if (url.includes('/api/rh/empresas')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{ id: 1, nome: 'Empresa Teste', cnpj: '12345678000100' }]
          })
        }
        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              stats: { total_avaliacoes: 100, concluidas: 50, funcionarios_avaliados: 25 },
              resultados: [],
              distribuicao: []
            })
          })
        }
        if (url.includes('/api/admin/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ funcionarios: mockFuncionarios })
          })
        }
        if (url.includes('/api/rh/laudos')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ laudos: [] })
          })
        }
        return Promise.resolve({ ok: false })
      })

      render(<EmpresaDashboardPage />)

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      await waitFor(() => {
        expect(screen.getByText('📋')).toBeInTheDocument()
        expect(screen.getByText('Nenhum lote encontrado')).toBeInTheDocument()
      })
    })
  })

  describe('Aba "Funcionários"', () => {
    beforeEach(async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('📋 Lotes de avaliações')).toBeInTheDocument()
      })

      const funcionariosTab = screen.getByText('👥 Funcionários')
      fireEvent.click(funcionariosTab)

      await waitFor(() => {
        expect(screen.getByText('👥 Gerenciar Funcionários')).toBeInTheDocument()
      })
    })

    it('deve exibir seção de gerenciamento de funcionários', async () => {
      expect(screen.getByText('👥 Gerenciar Funcionários')).toBeInTheDocument()
      expect(screen.getByText('Inserir Individual')).toBeInTheDocument()
      expect(screen.getByText('Importar Múltiplos (CSV)')).toBeInTheDocument()
    })

    it('deve exibir botão "Inserir Funcionário"', async () => {
      expect(screen.getByText('➕ Inserir Funcionário')).toBeInTheDocument()
    })

    it('deve exibir campo de upload CSV', async () => {
      const fileInput = document.getElementById('csv-upload') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()
      expect(fileInput.type).toBe('file')
      expect(fileInput.accept).toBe('.csv')
    })

    it('deve exibir botão "Importar CSV"', async () => {
      expect(screen.getByText('📤 Importar CSV')).toBeInTheDocument()
    })

    it('deve exibir link para modelo CSV', async () => {
      const modelLink = screen.getByText('📋 Baixar Modelo CSV')
      expect(modelLink).toBeInTheDocument()
      expect(modelLink).toHaveAttribute('href', '/modelo-funcionarios.csv')
    })

    it('deve exibir tabela de funcionários', async () => {
      expect(screen.getByText('👥 Funcionários (20)')).toBeInTheDocument()
      expect(screen.getByText('Funcionário 1')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Buscar por nome, CPF, setor...')).toBeInTheDocument()
    })

    it('deve permitir busca de funcionários', async () => {
      const searchInput = screen.getByPlaceholderText('Buscar por nome, CPF, setor...')
      fireEvent.change(searchInput, { target: { value: 'Funcionário 5' } })

      await waitFor(() => {
        expect(screen.getByText('Funcionário 5')).toBeInTheDocument()
        expect(screen.queryByText('Funcionário 1')).not.toBeInTheDocument()
      })
    })
  })

  describe.skip('Funcionalidade de Download de Laudos', () => {
    it('deve chamar API de download ao clicar em "Baixar Laudo PDF"', async () => {
      // Setup DOM para este teste específico
      document.body.innerHTML = '<div id="root"></div>'
      const mockCreateElement = jest.spyOn(document, 'createElement')
      const mockAppendChild = jest.spyOn(document.body, 'appendChild')
      const mockRemoveChild = jest.spyOn(document.body, 'removeChild')

      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/rh/laudos/1/download')) {
          return Promise.resolve({
            ok: true,
            blob: async () => new Blob(['mock pdf content'])
          })
        }
        if (url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ cpf: '11111111111', nome: 'RH Teste', perfil: 'rh' })
          })
        }
        if (url.includes('/api/rh/empresas')) {
          return Promise.resolve({
            ok: true,
            json: async () => [{ id: 1, nome: 'Empresa Teste', cnpj: '12345678000100' }]
          })
        }
        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              stats: { total_avaliacoes: 100, concluidas: 50, funcionarios_avaliados: 25 },
              resultados: [],
              distribuicao: []
            })
          })
        }
        if (url.includes('/api/admin/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ funcionarios: mockFuncionarios })
          })
        }
        if (url.includes('/api/rh/lotes')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ lotes: mockLotes })
          })
        }
        if (url.includes('/api/rh/laudos')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ laudos: mockLaudos })
          })
        }
        return Promise.resolve({ ok: false })
      })

      // Mock URL.createObjectURL and revokeObjectURL
      global.URL.createObjectURL = jest.fn(() => 'mock-url')
      global.URL.revokeObjectURL = jest.fn()

      // Mock document methods
      const mockClick = jest.fn()
      mockCreateElement.mockReturnValue({
        click: mockClick,
        href: '',
        download: ''
      } as any)
      mockAppendChild.mockReturnValue(document.body)
      mockRemoveChild.mockReturnValue(document.body)

      document.createElement = mockCreateElement
      document.body.appendChild = mockAppendChild
      document.body.removeChild = mockRemoveChild

      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('📥 Baixar Laudo PDF')).toBeInTheDocument()
      })

      const downloadButton = screen.getByText('📥 Baixar Laudo PDF')
      fireEvent.click(downloadButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/rh/laudos/1/download')
        expect(mockCreateElement).toHaveBeenCalledWith('a')
        expect(mockClick).toHaveBeenCalled()
      })
    })
  })

  describe.skip('Integração de Laudos nos Cards', () => {
    it('deve associar laudos aos lotes corretos', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        // Verificar que o laudo aparece no card do lote correto
        expect(screen.getByText('📄 Laudo disponível')).toBeInTheDocument()
        expect(screen.getByText('Emissor: Dr. João Silva')).toBeInTheDocument()
      })

      // Verificar que não há laudo no segundo lote (sem laudo associado)
      const lote2Card = screen.getByText('Avaliação Gestão 2025').closest('div')
      expect(lote2Card).toBeInTheDocument()
      expect(lote2Card?.textContent).not.toContain('📄 Laudo disponível')
    })

    it('deve exibir informações completas do laudo', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        expect(screen.getByText('📄 Laudo disponível')).toBeInTheDocument()
        expect(screen.getByText(/20\/01\/2025/)).toBeInTheDocument() // Data formatada
        expect(screen.getByText('Emissor: Dr. João Silva')).toBeInTheDocument()
      })
    })
  })

  describe.skip('Preservação de Funcionalidade', () => {
    it('deve manter funcionalidade de liberação de lotes', async () => {
      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        const liberarButton = screen.getByText('🚀 Liberar Novo Lote')
        expect(liberarButton).toBeInTheDocument()
      })
    })

    it('deve manter funcionalidade de geração de relatórios', async () => {
      ;(global.confirm as jest.Mock).mockReturnValue(true)

      render(<EmpresaDashboardPage />)

      await waitFor(() => {
        const gerarButton = screen.getByText('📊 Gerar Relatório PDF')
        expect(gerarButton).toBeInTheDocument()
      })
    })

    it('deve manter funcionalidade de gerenciamento de funcionários', async () => {
      const funcionariosTab = screen.getByText('👥 Funcionários')
      fireEvent.click(funcionariosTab)

      await waitFor(() => {
        expect(screen.getByText('➕ Inserir Funcionário')).toBeInTheDocument()
        expect(screen.getByText('📤 Importar CSV')).toBeInTheDocument()
      })
    })
  })
})