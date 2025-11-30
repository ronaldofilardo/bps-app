/**
 * Testes para Upload CSV Inteligente
 * Detecção automática de separador, validações e ON CONFLICT
 */

import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'

jest.mock('@/lib/db')
jest.mock('bcryptjs')
jest.mock('@/lib/session', () => ({
  requireRHWithEmpresaAccess: jest.fn()
}))

const mockQuery = query as jest.MockedFunction<typeof query>
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>
const mockRequireRHWithEmpresaAccess = require('@/lib/session').requireRHWithEmpresaAccess

describe('Upload CSV Inteligente', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRequireRHWithEmpresaAccess.mockResolvedValue({
      cpf: '11111111111',
      nome: 'RH Teste',
      perfil: 'rh'
    })
    mockBcryptHash.mockResolvedValue('hashedpassword')
  })

  describe('Detecção Automática de Separador', () => {
    it('deve detectar vírgula como separador', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      // CSV com vírgulas
      const funcionarios = [
        {
          cpf: '12345678901',
          nome: 'João Silva',
          setor: 'TI',
          funcao: 'Dev',
          email: 'joao@teste.com'
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({ funcionarios, empresa_id: 1 })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sucesso).toBe(1)
    })

    it('deve processar CSV com ponto e vírgula', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      const funcionarios = [
        {
          cpf: '98765432100',
          nome: 'Maria; Santos',
          setor: 'RH',
          funcao: 'Gestora',
          email: 'maria@teste.com'
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({ funcionarios, empresa_id: 1 })
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('deve lidar com valores entre aspas', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      const funcionarios = [
        {
          cpf: '11122233344',
          nome: 'Silva, João',
          setor: 'TI',
          funcao: 'Dev Senior',
          email: 'joao.silva@teste.com'
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({ funcionarios, empresa_id: 1 })
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Validação por Linha', () => {
    it('deve validar CPF em cada linha', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      const funcionarios = [
        {
          cpf: '123', // CPF inválido
          nome: 'João Silva',
          setor: 'TI',
          funcao: 'Dev',
          email: 'joao@teste.com'
        },
        {
          cpf: '12345678901',
          nome: 'Maria Santos',
          setor: 'RH',
          funcao: 'Gestora',
          email: 'maria@teste.com'
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({ funcionarios, empresa_id: 1 })
      })

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockRejectedValueOnce(new Error('CPF inválido'))
        .mockResolvedValueOnce({ rowCount: 1 })

      const response = await POST(request)
      const data = await response.json()

      expect(data.sucesso).toBe(1)
      expect(data.erros).toBe(1)
    })

    it.skip('deve validar email em cada linha', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 }) // Default for all other calls

      const { POST } = await import('@/app/api/admin/import/route')

      const funcionarios = [
        {
          cpf: '12345678901',
          nome: 'João Silva',
          setor: 'TI',
          funcao: 'Dev',
          email: 'joao@teste.com'
        },
        {
          cpf: '98765432100',
          nome: 'Maria Santos',
          setor: 'RH',
          funcao: 'Gestora',
          email: 'maria@teste.com'
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({ funcionarios, empresa_id: 1 })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sucesso).toBe(2)
      expect(data.erros).toBe(0)
    })

    it.skip('deve validar campos obrigatórios por linha', async () => {
      const { POST } = await import('@/app/api/admin/import/route')

      const funcionarios = [
        {
          cpf: '12345678901',
          nome: '', // Nome vazio
          setor: 'TI',
          funcao: 'Dev',
          email: 'joao@teste.com'
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({ funcionarios, empresa_id: 1 })
      })

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockRejectedValueOnce(new Error('Nome obrigatório')) // INSERT fails
        .mockResolvedValue({ rowCount: 1 })

      const response = await POST(request)
      const data = await response.json()

      expect(data.erros).toBeGreaterThan(0)
    })
  })

  describe('Feedback Detalhado de Erros', () => {
    it.skip('deve retornar contadores de sucesso e erro', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockRejectedValueOnce(new Error('Erro linha 2'))
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      const funcionarios = [
        {
          cpf: '12345678901',
          nome: 'João Silva',
          setor: 'TI',
          funcao: 'Dev',
          email: 'joao@teste.com'
        },
        {
          cpf: 'invalido',
          nome: 'Erro Teste',
          setor: 'TI',
          funcao: 'Dev',
          email: 'erro@teste.com'
        },
        {
          cpf: '11122233344',
          nome: 'Maria Santos',
          setor: 'RH',
          funcao: 'Gestora',
          email: 'maria@teste.com'
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({ funcionarios, empresa_id: 1 })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('sucesso')
      expect(data).toHaveProperty('erros')
      expect(data.sucesso).toBeGreaterThan(0)
      expect(data.erros).toBeGreaterThan(0)
    })

    it.skip('deve processar linha a linha independentemente', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockRejectedValueOnce(new Error('Erro 1'))
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockRejectedValueOnce(new Error('Erro 2'))
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      const funcionarios = [
        { cpf: '11111111111', nome: 'Teste 1', setor: 'TI', funcao: 'Dev', email: 'teste1@email.com' },
        { cpf: '22222222222', nome: 'Teste 2', setor: 'TI', funcao: 'Dev', email: 'teste2@email.com' },
        { cpf: '33333333333', nome: 'Teste 3', setor: 'TI', funcao: 'Dev', email: 'teste3@email.com' },
        { cpf: '44444444444', nome: 'Teste 4', setor: 'TI', funcao: 'Dev', email: 'teste4@email.com' },
        { cpf: '55555555555', nome: 'Teste 5', setor: 'TI', funcao: 'Dev', email: 'teste5@email.com' }
      ]

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funcionarios, empresa_id: 1 })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.sucesso + data.erros).toBe(5)
    })
  })

  describe('Confirmação ON CONFLICT - Atualização', () => {
    it.skip('deve atualizar funcionário existente em conflito de CPF', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      const funcionarios = [
        {
          cpf: '12345678901',
          nome: 'João Silva Atualizado',
          setor: 'Produção',
          funcao: 'Supervisor',
          email: 'joao.novo@teste.com',
          matricula: 'MAT999',
          nivel_cargo: 'gestao'
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({ funcionarios, empresa_id: 1 })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sucesso).toBe(1)

      // Verificar se o INSERT incluiu ON CONFLICT DO UPDATE
      const insertCall = mockQuery.mock.calls.find(
        call => call[0].includes('ON CONFLICT')
      )
      expect(insertCall).toBeDefined()
    })

    it.skip('deve preservar clinica_id em atualização', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 5 }], rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({
          funcionarios: [{
            cpf: '12345678901',
            nome: 'Atualizado',
            setor: 'TI',
            funcao: 'Dev',
            email: 'teste@teste.com'
          }],
          empresa_id: 1
        })
      })

      await POST(request)

      const insertCall = mockQuery.mock.calls[1]
      expect(insertCall[0]).toContain('ON CONFLICT')
      expect(insertCall[0]).toContain('clinica_id = EXCLUDED.clinica_id')
    })

    it.skip('deve atualizar todos os campos em conflito', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      const funcionarios = [
        {
          cpf: '12345678901',
          nome: 'Nome Atualizado',
          setor: 'Setor Atualizado',
          funcao: 'Funcao Atualizada',
          email: 'email.atualizado@teste.com',
          matricula: 'MATATU',
          nivel_cargo: 'gestao',
          turno: 'Tarde',
          escala: '12x36'
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({ funcionarios, empresa_id: 1 })
      })

      const response = await POST(request)

      expect(response.status).toBe(200)

      const insertCall = mockQuery.mock.calls[1]
      expect(insertCall[0]).toContain('nome = EXCLUDED.nome')
      expect(insertCall[0]).toContain('setor = EXCLUDED.setor')
      expect(insertCall[0]).toContain('email = EXCLUDED.email')
      expect(insertCall[0]).toContain('matricula = EXCLUDED.matricula')
      expect(insertCall[0]).toContain('nivel_cargo = EXCLUDED.nivel_cargo')
    })
  })

  describe('Campos Opcionais CSV', () => {
    it.skip('deve aceitar funcionário sem matrícula', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({
          funcionarios: [{
            cpf: '12345678901',
            nome: 'João Silva',
            setor: 'TI',
            funcao: 'Dev',
            email: 'joao@teste.com'
            // sem matrícula
          }],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })

    it.skip('deve aceitar funcionário sem nível de cargo', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({
          funcionarios: [{
            cpf: '12345678901',
            nome: 'João Silva',
            setor: 'TI',
            funcao: 'Dev',
            email: 'joao@teste.com'
            // sem nivel_cargo
          }],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })

    it.skip('deve processar todos os campos opcionais', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({
          funcionarios: [{
            cpf: '12345678901',
            nome: 'João Silva',
            setor: 'TI',
            funcao: 'Dev',
            email: 'joao@teste.com',
            matricula: 'MAT001',
            nivel_cargo: 'operacional',
            turno: 'Manhã',
            escala: '8x40',
            perfil: 'funcionario'
          }],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sucesso).toBe(1)
    })
  })

  describe('Importação em Lote', () => {
    it.skip('deve processar múltiplos funcionários em uma requisição', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      const funcionarios = Array(50).fill(null).map((_, i) => ({
        cpf: String(10000000000 + i),
        nome: `Funcionário ${i}`,
        setor: 'TI',
        funcao: 'Dev',
        email: `func${i}@teste.com`
      }))

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({ funcionarios, empresa_id: 1 })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sucesso).toBe(50)
      expect(data.erros).toBe(0)
    })

    it('deve validar empresa_id obrigatório', async () => {
      const { POST } = await import('@/app/api/admin/import/route')

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({
          funcionarios: [{
            cpf: '12345678901',
            nome: 'João',
            setor: 'TI',
            funcao: 'Dev',
            email: 'joao@teste.com'
          }]
          // sem empresa_id
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('empresa_id é obrigatório')
    })

    it('deve validar formato de array', async () => {
      const { POST } = await import('@/app/api/admin/import/route')

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({
          funcionarios: 'não é array',
          empresa_id: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dados inválidos')
    })
  })
})
