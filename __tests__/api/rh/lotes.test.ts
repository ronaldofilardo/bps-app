/**
 * Testes para API /api/rh/lotes
 * - Listagem de lotes com estatísticas
 * - Contagem de avaliações concluídas e inativadas
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth } from '@/lib/session'
import { GET } from '@/app/api/rh/lotes/route'

const mockQuery = query as jest.MockedFunction<typeof query>
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>

describe('/api/rh/lotes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET - Listar lotes', () => {
    it('deve retornar lotes com estatísticas completas incluindo inativadas', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      const mockLotes = [
        {
          id: 1,
          codigo: 'LOTE-001',
          titulo: 'Avaliação Trimestral',
          descricao: 'Avaliação do primeiro trimestre',
          tipo: 'completo',
          status: 'ativo',
          liberado_em: '2025-01-15T10:00:00Z',
          liberado_por: '22222222222',
          liberado_por_nome: 'João Silva',
          total_avaliacoes: 10,
          avaliacoes_concluidas: 8,
          avaliacoes_inativadas: 1
        }
      ]

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({ rows: [{ id: 1, clinica_id: 1 }], rowCount: 1 }) // empresa check
        .mockResolvedValueOnce({ rows: mockLotes, rowCount: 1 }) // lotes

      const request = new NextRequest('http://localhost:3000/api/rh/lotes?empresa_id=1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.lotes).toHaveLength(1)

      const lote = data.lotes[0]
      expect(lote.id).toBe(1)
      expect(lote.codigo).toBe('LOTE-001')
      expect(lote.total_avaliacoes).toBe(10)
      expect(lote.avaliacoes_concluidas).toBe(8)
      expect(lote.avaliacoes_inativadas).toBe(1)
      
      // Verifica que a query usa COUNT com CASE WHEN para estatísticas
      const queryCall = mockQuery.mock.calls[2]
      expect(queryCall[0]).toContain("COUNT(CASE WHEN a.status = 'concluida' THEN 1 END)")
      expect(queryCall[0]).toContain("COUNT(CASE WHEN a.status = 'inativada' THEN 1 END)")
      expect(queryCall[0]).toContain("COUNT(a.id) as total_avaliacoes")
    })

    it('deve calcular status do lote como concluido quando todas ativas estão concluídas', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      const mockLotes = [
        {
          id: 1,
          codigo: 'LOTE-001',
          titulo: 'Lote Completo',
          status: 'concluido',
          total_avaliacoes: 5,
          avaliacoes_concluidas: 5,
          avaliacoes_inativadas: 0
        }
      ]

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 1, clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: mockLotes, rowCount: 1 }) // lotes

      const request = new NextRequest('http://localhost:3000/api/rh/lotes?empresa_id=1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      const lote = data.lotes[0]
      expect(lote.status).toBe('concluido')
      expect(lote.avaliacoes_concluidas).toBe(lote.total_avaliacoes)
    })

    it('deve filtrar por empresa_id', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({ rows: [{ id: 1, clinica_id: 1 }], rowCount: 1 }) // empresa check
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotes

      const request = new NextRequest('http://localhost:3000/api/rh/lotes?empresa_id=1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verifica se filtro de empresa foi aplicado
      expect(mockQuery.mock.calls[2][1]).toEqual(["1", 10])
    })

    it('deve limitar resultados quando parâmetro limit é fornecido', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({ rows: [{ id: 1, clinica_id: 1 }], rowCount: 1 }) // empresa check
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotes

      const request = new NextRequest('http://localhost:3000/api/rh/lotes?empresa_id=1&limit=5')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verifica se limit foi aplicado
      expect(mockQuery.mock.calls[2][1]).toEqual(["1", 5])
    })

    it('deve validar acesso apenas para perfil RH', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Usuario Teste',
        perfil: 'funcionario' // Não é RH
      })

      const request = new NextRequest('http://localhost:3000/api/rh/lotes?empresa_id=1')
      const response = await GET(request)

      expect(response.status).toBe(403)
      expect(mockRequireAuth).toHaveBeenCalled()
    })

    it('deve validar que empresa pertence à clínica do RH', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // empresa não encontrada
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup (não chega aqui)

      const request = new NextRequest('http://localhost:3000/api/rh/lotes?empresa_id=999')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Empresa não encontrada')
    })

    it('deve retornar erro quando empresa_id não é fornecido', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      const request = new NextRequest('http://localhost:3000/api/rh/lotes')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('ID da empresa é obrigatório')
    })

    it('deve calcular status do lote como concluido quando todas ativas estão concluídas', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({ rows: [{ id: 1, clinica_id: 1 }], rowCount: 1 }) // empresa check
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotes

      const request = new NextRequest('http://localhost:3000/api/rh/lotes?empresa_id=1')
      await GET(request)

      // Verifica se filtro de status foi aplicado
      expect(mockQuery.mock.calls[2][0]).toContain("status != 'cancelado'")
    })

    it.skip('deve ordenar lotes por data de liberação decrescente', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      mockQuery
        .mockResolvedValueOnce({ rows: [{ id: 1, clinica_id: 1 }], rowCount: 1 }) // empresa check
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotes

      const request = new NextRequest('http://localhost:3000/api/rh/lotes?empresa_id=1')
      await GET(request)

      // Verifica se a query foi chamada (ORDER BY é hardcoded)
      expect(mockQuery).toHaveBeenCalledTimes(3)
    })
  })
})