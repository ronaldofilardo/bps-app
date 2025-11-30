/**
 * Testes para API /api/admin/import
 * - Acesso RH
 * - Importação em lote de funcionários
 * - Validação de dados
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

jest.mock('@/lib/session', () => ({
  requireRHWithEmpresaAccess: jest.fn(),
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { requireRHWithEmpresaAccess } from '@/lib/session'
import bcrypt from 'bcryptjs'

const mockQuery = query as jest.MockedFunction<typeof query>
const mockRequireRHWithEmpresaAccess = requireRHWithEmpresaAccess as jest.MockedFunction<typeof requireRHWithEmpresaAccess>
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>

describe('/api/admin/import', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBcryptHash.mockResolvedValue('$2a$10$mockedHash')
  })

  describe('Acesso RH', () => {
    it('deve permitir acesso ao perfil RH', async () => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValue({ rowCount: 1 }) // INSERT success

      const { POST } = await import('@/app/api/admin/import/route')

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({
          funcionarios: [{
            cpf: '12345678901',
            nome: 'João Silva',
            setor: 'Produção',
            funcao: 'Operador',
            email: 'joao@empresa.com',
            empresa_id: 1
          }],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('sucesso')
      expect(data).toHaveProperty('erros')
      expect(mockRequireRHWithEmpresaAccess).toHaveBeenCalledWith(1)
    })

    it('deve permitir acesso ao perfil admin', async () => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue({
        cpf: '00000000000',
        nome: 'Admin Teste',
        perfil: 'admin'
      })

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // admin lookup
        .mockResolvedValue({ rowCount: 1 }) // INSERT success

      const { POST } = await import('@/app/api/admin/import/route')

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({
          funcionarios: [{
            cpf: '12345678901',
            nome: 'João Silva',
            setor: 'Produção',
            funcao: 'Operador',
            email: 'joao@empresa.com',
            empresa_id: 1
          }],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sucesso).toBe(1)
      expect(data.erros).toBe(0)
    })

    it('deve negar acesso a outros perfis', async () => {
      mockRequireRHWithEmpresaAccess.mockRejectedValue(new Error('Sem permissão'))

      const { POST } = await import('@/app/api/admin/import/route')

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({
          funcionarios: [{
            cpf: '12345678901',
            nome: 'João Silva',
            setor: 'Produção',
            funcao: 'Operador',
            email: 'joao@empresa.com'
          }],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Erro ao importar')
    })
  })

  describe('Importação de funcionários', () => {
    it('deve importar funcionários com sucesso', async () => {
      const funcionariosParaImportar = [
        {
          cpf: '12345678901',
          nome: 'João Silva',
          setor: 'Produção',
          funcao: 'Operador de Máquinas',
          email: 'joao@empresa.com',
          empresa_id: 1,
          matricula: 'MAT001',
          nivel_cargo: 'operacional',
          turno: 'Manhã',
          escala: '8x40'
        },
        {
          cpf: '98765432100',
          nome: 'Maria Santos',
          setor: 'RH',
          funcao: 'Gestora',
          email: 'maria@empresa.com',
          empresa_id: 1,
          matricula: 'MAT002',
          nivel_cargo: 'gestao',
          turno: null,
          escala: null
        }
      ]

      mockRequireRHWithEmpresaAccess.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValue({ rowCount: 1 }) // INSERT success for both

      const { POST } = await import('@/app/api/admin/import/route')

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({ funcionarios: funcionariosParaImportar, empresa_id: 1 })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sucesso).toBe(2)
      expect(data.erros).toBe(0)

      // Verifica se bcrypt.hash foi chamado para cada funcionário
      expect(mockBcryptHash).toHaveBeenCalledTimes(2)
      expect(mockBcryptHash).toHaveBeenCalledWith('123456', 10)
      expect(mockBcryptHash).toHaveBeenCalledWith('123456', 10)

      // Verifica se as queries INSERT foram feitas corretamente
      expect(mockQuery).toHaveBeenCalledTimes(3) // 1 lookup + 2 inserts
    })

    it('deve usar senha padrão quando não fornecida', async () => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

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
            setor: 'Produção',
            funcao: 'Operador',
            email: 'joao@empresa.com',
            empresa_id: 1
            // senha não fornecida
          }],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockBcryptHash).toHaveBeenCalledWith('123456', 10)
    })

    it('deve usar senha fornecida quando disponível', async () => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

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
            setor: 'Produção',
            funcao: 'Operador',
            email: 'joao@empresa.com',
            senha: 'minhasenha123',
            empresa_id: 1
          }],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockBcryptHash).toHaveBeenCalledWith('minhasenha123', 10)
    })

    it('deve definir perfil padrão como "funcionario"', async () => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

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
            setor: 'Produção',
            funcao: 'Operador',
            email: 'joao@empresa.com',
            empresa_id: 1
            // perfil não fornecido
          }],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verifica se o INSERT usou 'funcionario' como perfil padrão
      const insertCall = mockQuery.mock.calls[1]
      expect(insertCall[1]).toContain('funcionario')
    })

    it('deve permitir definir perfil personalizado', async () => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

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
            setor: 'Produção',
            funcao: 'Operador',
            email: 'joao@empresa.com',
            perfil: 'rh',
            empresa_id: 1
          }],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verifica se o INSERT usou o perfil fornecido
      const insertCall = mockQuery.mock.calls[1]
      expect(insertCall[1]).toContain('rh')
    })
  })

  describe('Validação e tratamento de erros', () => {
    it('deve retornar erro 400 para dados inválidos', async () => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      const { POST } = await import('@/app/api/admin/import/route')

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({ funcionarios: 'não é array' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Dados inválidos')
    })

    it('deve lidar com erros individuais de importação', async () => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({ rowCount: 1 }) // Primeiro INSERT success
        .mockRejectedValueOnce(new Error('Erro de constraint')) // Segundo INSERT falha
        .mockResolvedValue({ rowCount: 1 }) // Default for any other calls

      const { POST } = await import('@/app/api/admin/import/route')

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({
          funcionarios: [
            {
              cpf: '12345678901',
              nome: 'João Silva',
              setor: 'Produção',
              funcao: 'Operador',
              email: 'joao@empresa.com',
              empresa_id: 1
            },
            {
              cpf: '98765432100',
              nome: 'Maria Santos',
              setor: 'RH',
              funcao: 'Gestora',
              email: 'maria@empresa.com',
              empresa_id: 1
            }
          ],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sucesso).toBe(1)
      expect(data.erros).toBe(1)
    })

    it('deve atualizar funcionário existente em caso de conflito (ON CONFLICT)', async () => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 })
        .mockResolvedValue({ rowCount: 1 })

      const { POST } = await import('@/app/api/admin/import/route')

      const request = new NextRequest('http://localhost:3000/api/admin/import', {
        method: 'POST',
        body: JSON.stringify({
          funcionarios: [{
            cpf: '12345678901',
            nome: 'João Silva Atualizado',
            setor: 'Produção',
            funcao: 'Operador Sênior',
            email: 'joao.atualizado@empresa.com',
            empresa_id: 1
          }],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sucesso).toBe(1)

      // Verifica se a query inclui ON CONFLICT DO UPDATE
      const insertCall = mockQuery.mock.calls[1]
      expect(insertCall[0]).toContain('ON CONFLICT (cpf) DO UPDATE SET')
      expect(insertCall[0]).toContain('nome = EXCLUDED.nome')
      expect(insertCall[0]).toContain('setor = EXCLUDED.setor')
      expect(insertCall[0]).toContain('funcao = EXCLUDED.funcao')
      expect(insertCall[0]).toContain('email = EXCLUDED.email')
    })

    it('deve definir valores null para campos opcionais não fornecidos', async () => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

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
            setor: 'Produção',
            funcao: 'Operador',
            email: 'joao@empresa.com',
            empresa_id: 1
            // matricula, nivel_cargo, turno, escala não fornecidos
          }],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verifica se null foi passado para campos opcionais
      const insertCall = mockQuery.mock.calls[1]
      const params = insertCall[1]
      expect(params[9]).toBeNull()  // matricula
      expect(params[10]).toBeNull() // nivel_cargo
      expect(params[11]).toBeNull() // turno
      expect(params[12]).toBeNull() // escala
    })
  })

  describe('Estrutura da query INSERT', () => {
    it('deve incluir todos os campos necessários no INSERT', async () => {
      mockRequireRHWithEmpresaAccess.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh'
      })

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
            setor: 'Produção',
            funcao: 'Operador',
            email: 'joao@empresa.com',
            empresa_id: 1
          }],
          empresa_id: 1
        })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Verifica estrutura da query INSERT
      const insertCall = mockQuery.mock.calls[1]
      expect(insertCall[0]).toContain('INSERT INTO funcionarios')
      expect(insertCall[0]).toContain('(cpf, nome, setor, funcao, email, senha_hash, perfil, clinica_id, empresa_id, matricula, nivel_cargo, turno, escala)')
      expect(insertCall[0]).toContain('VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)')

      // Verifica parâmetros
      const params = insertCall[1]
      expect(params[0]).toBe('12345678901')  // cpf
      expect(params[1]).toBe('João Silva')   // nome
      expect(params[2]).toBe('Produção')     // setor
      expect(params[3]).toBe('Operador')     // funcao
      expect(params[4]).toBe('joao@empresa.com') // email
      expect(params[5]).toBe('$2a$10$mockedHash') // senha_hash
      expect(params[6]).toBe('funcionario')  // perfil
      expect(params[7]).toBe(1)              // clinica_id
      expect(params[8]).toBe(1)              // empresa_id
    })
  })
})