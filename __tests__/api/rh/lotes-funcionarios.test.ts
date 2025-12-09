import { NextRequest, NextResponse } from 'next/server'
import { GET } from '@/app/api/rh/lotes/[id]/funcionarios/route'
import { requireAuth } from '@/lib/session'
import { getFuncionariosPorLote, getLoteInfo, getLoteEstatisticas } from '@/lib/queries'
import { query } from '@/lib/db'

jest.mock('@/lib/session')
jest.mock('@/lib/queries')
jest.mock('@/lib/db')

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>
const mockGetFuncionariosPorLote = getFuncionariosPorLote as jest.MockedFunction<typeof getFuncionariosPorLote>
const mockGetLoteInfo = getLoteInfo as jest.MockedFunction<typeof getLoteInfo>
const mockGetLoteEstatisticas = getLoteEstatisticas as jest.MockedFunction<typeof getLoteEstatisticas>
const mockQuery = query as jest.MockedFunction<typeof query>

describe('API /api/rh/lotes/[id]/funcionarios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it.skip('deve retornar 403 se usuário não está autenticado', async () => {
      // Skip - A API usa requireAuth que lança exceção antes de chegar no handler
      // O comportamento correto é testado por integração
    })

    it('deve retornar 403 se usuário não é RH', async () => {
      mockRequireAuth.mockResolvedValueOnce({
        cpf: '12345678901',
        nome: 'Funcionário',
        perfil: 'funcionario'
      } as any)

      const req = new NextRequest('http://localhost/api/rh/lotes/1/funcionarios?empresa_id=100')
      const params = { params: { id: '1' } }

      const response = await GET(req, params)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Acesso negado')
    })

    it('deve retornar 400 se empresa_id não foi fornecido', async () => {
      mockRequireAuth.mockResolvedValueOnce({
        cpf: '12345678901',
        nome: 'RH User',
        perfil: 'rh'
      } as any)

      const req = new NextRequest('http://localhost/api/rh/lotes/1/funcionarios')
      const params = { params: { id: '1' } }

      const response = await GET(req, params)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('obrigatórios')
    })

    it('deve retornar 404 se usuário RH não encontrado', async () => {
      mockRequireAuth.mockResolvedValueOnce({
        cpf: '12345678901',
        nome: 'RH User',
        perfil: 'rh'
      } as any)

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)

      const req = new NextRequest('http://localhost/api/rh/lotes/1/funcionarios?empresa_id=100')
      const params = { params: { id: '1' } }

      const response = await GET(req, params)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Usuário não encontrado')
    })

    it('deve retornar 403 se empresa não pertence à clínica do usuário', async () => {
      mockRequireAuth.mockResolvedValueOnce({
        cpf: '12345678901',
        nome: 'RH User',
        perfil: 'rh'
      } as any)

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 10 }], rowCount: 1 } as any) // user clinica
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // empresa check

      const req = new NextRequest('http://localhost/api/rh/lotes/1/funcionarios?empresa_id=100')
      const params = { params: { id: '1' } }

      const response = await GET(req, params)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toContain('não tem permissão')
    })

    it('deve retornar 404 se lote não encontrado', async () => {
      mockRequireAuth.mockResolvedValueOnce({
        cpf: '12345678901',
        nome: 'RH User',
        perfil: 'rh'
      } as any)

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 10 }], rowCount: 1 } as any) // user clinica
        .mockResolvedValueOnce({ rows: [{ id: 100, clinica_id: 10, nome: 'Empresa' }], rowCount: 1 } as any) // empresa check

      mockGetLoteInfo.mockResolvedValueOnce(null)

      const req = new NextRequest('http://localhost/api/rh/lotes/999/funcionarios?empresa_id=100')
      const params = { params: { id: '999' } }

      const response = await GET(req, params)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Lote não encontrado')
    })

    it('deve retornar lista de funcionários do lote com sucesso', async () => {
      mockRequireAuth.mockResolvedValueOnce({
        cpf: '12345678901',
        nome: 'RH User',
        perfil: 'rh'
      } as any)

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 10 }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ id: 100, clinica_id: 10, nome: 'Empresa' }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // Query para setores distintos

      const mockLoteInfo = {
        id: 1,
        codigo: 'LOT-001',
        titulo: 'Lote Teste',
        descricao: null,
        tipo: 'completo',
        status: 'ativo',
        liberado_em: '2025-11-20T10:00:00',
        liberado_por: '12345678901',
        liberado_por_nome: 'Admin',
        empresa_id: 100,
        empresa_nome: 'Empresa Teste'
      }

      const mockEstatisticas = {
        total_avaliacoes: '10',
        avaliacoes_concluidas: '7',
        avaliacoes_inativadas: '1',
        avaliacoes_pendentes: '2'
      }

      const mockFuncionarios = [
        {
          cpf: '98765432109',
          nome: 'João Silva',
          setor: 'TI',
          funcao: 'Desenvolvedor',
          matricula: '001',
          nivel_cargo: 'operacional' as const,
          turno: 'Diurno',
          escala: '8h',
          avaliacao_id: 1,
          status_avaliacao: 'concluida',
          data_inicio: '2025-11-28T08:00:00',
          data_conclusao: '2025-12-01T10:00:00'
        }
      ]

      mockGetLoteInfo.mockResolvedValueOnce(mockLoteInfo)
      mockGetLoteEstatisticas.mockResolvedValueOnce(mockEstatisticas)
      mockGetFuncionariosPorLote.mockResolvedValueOnce(mockFuncionarios)

      const req = new NextRequest('http://localhost/api/rh/lotes/1/funcionarios?empresa_id=100')
      const params = { params: { id: '1' } }

      const response = await GET(req, params)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.lote).toEqual(mockLoteInfo)
      expect(data.estatisticas).toEqual({
        total_avaliacoes: 10,
        avaliacoes_concluidas: 7,
        avaliacoes_inativadas: 1,
        avaliacoes_pendentes: 2
      })
      expect(data.funcionarios).toHaveLength(1)
      expect(data.funcionarios[0]).toHaveProperty('cpf', '98765432109')
      expect(data.funcionarios[0]).toHaveProperty('nome', 'João Silva')
      expect(data.funcionarios[0].avaliacao).toHaveProperty('status', 'concluida')
      expect(data.total).toBe(1)
    })

    it('deve retornar lista vazia se lote não tem funcionários', async () => {
      mockRequireAuth.mockResolvedValueOnce({
        cpf: '12345678901',
        nome: 'RH User',
        perfil: 'rh'
      } as any)

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 10 }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ id: 100, clinica_id: 10, nome: 'Empresa' }], rowCount: 1 } as any)

      const mockLoteInfo = {
        id: 1,
        codigo: 'LOT-001',
        titulo: 'Lote Vazio',
        descricao: null,
        tipo: 'completo',
        status: 'ativo',
        liberado_em: '2025-11-20T10:00:00',
        liberado_por: '12345678901',
        liberado_por_nome: 'Admin',
        empresa_id: 100,
        empresa_nome: 'Empresa Teste'
      }

      mockGetLoteInfo.mockResolvedValueOnce(mockLoteInfo)
      mockGetLoteEstatisticas.mockResolvedValueOnce({
        total_avaliacoes: '0',
        avaliacoes_concluidas: '0',
        avaliacoes_inativadas: '0',
        avaliacoes_pendentes: '0'
      })
      mockGetFuncionariosPorLote.mockResolvedValueOnce([])

      const req = new NextRequest('http://localhost/api/rh/lotes/1/funcionarios?empresa_id=100')
      const params = { params: { id: '1' } }

      const response = await GET(req, params)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.funcionarios).toEqual([])
      expect(data.total).toBe(0)
    })

    it('deve tratar erros internos corretamente', async () => {
      mockRequireAuth.mockResolvedValueOnce({
        cpf: '12345678901',
        nome: 'RH User',
        perfil: 'rh'
      } as any)

      mockQuery.mockRejectedValueOnce(new Error('Database error'))

      const req = new NextRequest('http://localhost/api/rh/lotes/1/funcionarios?empresa_id=100')
      const params = { params: { id: '1' } }

      const response = await GET(req, params)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Erro interno do servidor')
    })

    it('deve converter estatísticas de string para número', async () => {
      mockRequireAuth.mockResolvedValueOnce({
        cpf: '12345678901',
        nome: 'RH User',
        perfil: 'rh'
      } as any)

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 10 }], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [{ id: 100, clinica_id: 10, nome: 'Empresa' }], rowCount: 1 } as any)

      mockGetLoteInfo.mockResolvedValueOnce({
        id: 1,
        codigo: 'LOT-001',
        titulo: 'Lote',
        descricao: null,
        tipo: 'completo',
        status: 'ativo',
        liberado_em: '2025-11-20',
        liberado_por: '123',
        liberado_por_nome: 'Admin',
        empresa_id: 100,
        empresa_nome: 'Empresa'
      })

      mockGetLoteEstatisticas.mockResolvedValueOnce({
        total_avaliacoes: '15',
        avaliacoes_concluidas: '10',
        avaliacoes_inativadas: '2',
        avaliacoes_pendentes: '3'
      })

      mockGetFuncionariosPorLote.mockResolvedValueOnce([])

      const req = new NextRequest('http://localhost/api/rh/lotes/1/funcionarios?empresa_id=100')
      const params = { params: { id: '1' } }

      const response = await GET(req, params)
      const data = await response.json()

      expect(data.estatisticas.total_avaliacoes).toBe(15)
      expect(data.estatisticas.avaliacoes_concluidas).toBe(10)
      expect(data.estatisticas.avaliacoes_inativadas).toBe(2)
      expect(data.estatisticas.avaliacoes_pendentes).toBe(3)
      expect(typeof data.estatisticas.total_avaliacoes).toBe('number')
    })
  })
})
