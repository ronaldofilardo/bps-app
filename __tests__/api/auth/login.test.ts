import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'
import { query } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/session'

// Mock das dependências
jest.mock('@/lib/db')
jest.mock('bcryptjs')
jest.mock('@/lib/session')

const mockQuery = query as jest.MockedFunction<typeof query>
const mockCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>
const mockCreateSession = createSession as jest.MockedFunction<typeof createSession>

describe('/api/auth/login', () => {
  let mockRequest: Partial<NextRequest>

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock da request
    mockRequest = {
      json: jest.fn(),
    }
  })

  it('deve retornar erro 400 se CPF não for fornecido', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({ senha: '123' })

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('CPF e senha são obrigatórios')
  })

  it('deve retornar erro 400 se senha não for fornecida', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({ cpf: '12345678901' })

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('CPF e senha são obrigatórios')
  })

  it('deve retornar erro 401 se CPF não existir', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '99999999999',
      senha: '123'
    })

    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('CPF ou senha inválidos')
  })

  it('deve retornar erro 403 se usuário estiver inativo', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '22222222222',
      senha: '123'
    })

    mockQuery.mockResolvedValue({
      rows: [{
        cpf: '22222222222',
        nome: 'João Silva',
        perfil: 'funcionario',
        senha_hash: '$2a$10$hash',
        ativo: false,
        nivel_cargo: 'operacional'
      }],
      rowCount: 1
    })

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Usuário inativo. Entre em contato com o administrador.')
  })

  it('deve retornar erro 401 se senha estiver incorreta', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '22222222222',
      senha: 'wrongpassword'
    })

    mockQuery.mockResolvedValue({
      rows: [{
        cpf: '22222222222',
        nome: 'João Silva',
        perfil: 'funcionario',
        senha_hash: '$2a$10$hash',
        ativo: true,
        nivel_cargo: 'operacional'
      }],
      rowCount: 1
    })

    mockCompare.mockResolvedValue(false)

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('CPF ou senha inválidos')
  })

  it('deve fazer login com sucesso para funcionário operacional', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '22222222222',
      senha: '123'
    })

    mockQuery.mockResolvedValue({
      rows: [{
        cpf: '22222222222',
        nome: 'João Operacional Silva',
        perfil: 'funcionario',
        senha_hash: '$2a$10$hash',
        ativo: true,
        nivel_cargo: 'operacional'
      }],
      rowCount: 1
    })

    mockCompare.mockResolvedValue(true)
    mockCreateSession.mockResolvedValue()

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cpf).toBe('22222222222')
    expect(data.nome).toBe('João Operacional Silva')
    expect(data.perfil).toBe('funcionario')
    expect(data.nivelCargo).toBe('operacional')

    expect(mockCreateSession).toHaveBeenCalledWith({
      cpf: '22222222222',
      nome: 'João Operacional Silva',
      perfil: 'funcionario',
      nivelCargo: 'operacional'
    })
  })

  it('deve fazer login com sucesso para emissor', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '99999999999',
      senha: '123'
    })

    mockQuery.mockResolvedValue({
      rows: [{
        cpf: '99999999999',
        nome: 'Emissor de Laudos',
        perfil: 'emissor',
        senha_hash: '$2a$10$hash',
        ativo: true,
        nivel_cargo: null
      }],
      rowCount: 1
    })

    mockCompare.mockResolvedValue(true)
    mockCreateSession.mockResolvedValue()

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cpf).toBe('99999999999')
    expect(data.nome).toBe('Emissor de Laudos')
    expect(data.perfil).toBe('emissor')
    expect(data.redirectTo).toBe('/emissor')

    expect(mockCreateSession).toHaveBeenCalledWith({
      cpf: '99999999999',
      nome: 'Emissor de Laudos',
      perfil: 'emissor',
      nivelCargo: null
    })
  })

  it('deve fazer login com sucesso para admin', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '00000000000',
      senha: '123456'
    })

    mockQuery.mockResolvedValue({
      rows: [{
        cpf: '00000000000',
        nome: 'Admin',
        perfil: 'master',
        senha_hash: '$2a$10$hash',
        ativo: true,
        nivel_cargo: null
      }],
      rowCount: 1
    })

    mockCompare.mockResolvedValue(true)
    mockCreateSession.mockResolvedValue()

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cpf).toBe('00000000000')
    expect(data.nome).toBe('Admin')
    expect(data.perfil).toBe('master')
    expect(data.nivelCargo).toBe(null)
  })

  it('deve fazer login com sucesso para RH', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '11111111111',
      senha: '123'
    })

    mockQuery.mockResolvedValue({
      rows: [{
        cpf: '11111111111',
        nome: 'Gestor RH',
        perfil: 'rh',
        senha_hash: '$2a$10$hash',
        ativo: true,
        nivel_cargo: null
      }],
      rowCount: 1
    })

    mockCompare.mockResolvedValue(true)
    mockCreateSession.mockResolvedValue()

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cpf).toBe('11111111111')
    expect(data.nome).toBe('Gestor RH')
    expect(data.perfil).toBe('rh')
  })

  it('deve fazer login com sucesso para funcionário gestão', async () => {
    ;(mockRequest.json as jest.Mock).mockResolvedValue({
      cpf: '33333333333',
      senha: '123'
    })

    mockQuery.mockResolvedValue({
      rows: [{
        cpf: '33333333333',
        nome: 'Maria Gestão Santos',
        perfil: 'funcionario',
        senha_hash: '$2a$10$hash',
        ativo: true,
        nivel_cargo: 'gestao'
      }],
      rowCount: 1
    })

    mockCompare.mockResolvedValue(true)
    mockCreateSession.mockResolvedValue()

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cpf).toBe('33333333333')
    expect(data.nome).toBe('Maria Gestão Santos')
    expect(data.perfil).toBe('funcionario')
    expect(data.nivelCargo).toBe('gestao')
  })

  it('deve retornar erro 500 em caso de erro interno', async () => {
    ;(mockRequest.json as jest.Mock).mockRejectedValue(new Error('Database error'))

    const response = await POST(mockRequest as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erro interno do servidor')
  })

  // Testes para senhas corrigidas (correções de hash)
  describe('Testes de senhas corrigidas', () => {
    it('deve fazer login com senha corrigida do Master Admin (master123)', async () => {
      ;(mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '00000000000',
        senha: 'master123'
      })

      mockQuery.mockResolvedValue({
        rows: [{
          cpf: '00000000000',
          nome: 'Master Admin',
          perfil: 'master',
          senha_hash: '$2a$10$jslNqlvuCyeNibvDArgEx.OAlWip4CZFFxIyVQUgRMzviB.kqMTKe',
          ativo: true,
          nivel_cargo: null
        }],
        rowCount: 1
      })

      mockCompare.mockResolvedValue(true)
      mockCreateSession.mockResolvedValue()

      const response = await POST(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.cpf).toBe('00000000000')
      expect(data.perfil).toBe('master')
    })

    it('deve fazer login com senha corrigida do Admin (admin123)', async () => {
      ;(mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '11111111111',
        senha: 'admin123'
      })

      mockQuery.mockResolvedValue({
        rows: [{
          cpf: '11111111111',
          nome: 'Administrador Clínica',
          perfil: 'admin',
          senha_hash: '$2a$10$RoZFITAppqKWE9IIjc79o.qZ8NSG5EnpU10bwVucHh5AyxkgSBNSy',
          ativo: true,
          nivel_cargo: null
        }],
        rowCount: 1
      })

      mockCompare.mockResolvedValue(true)
      mockCreateSession.mockResolvedValue()

      const response = await POST(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.cpf).toBe('11111111111')
      expect(data.perfil).toBe('admin')
    })

    it('deve fazer login com senha corrigida do RH (rh123)', async () => {
      ;(mockRequest.json as jest.Mock).mockResolvedValue({
        cpf: '22222222222',
        senha: 'rh123'
      })

      mockQuery.mockResolvedValue({
        rows: [{
          cpf: '22222222222',
          nome: 'RH Gestor',
          perfil: 'rh',
          senha_hash: '$2a$10$Z4ZKDa/YHNoDlR9L11Z0qemVhjBXYGvTXYj6PHYWjFLq2tvV/0H/G',
          ativo: true,
          nivel_cargo: null
        }],
        rowCount: 1
      })

      mockCompare.mockResolvedValue(true)
      mockCreateSession.mockResolvedValue()

      const response = await POST(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.cpf).toBe('22222222222')
      expect(data.perfil).toBe('rh')
    })
  })
})
