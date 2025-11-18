import { POST } from '@/app/api/auth/login/route'
import bcryptjs from 'bcryptjs'

// Mock do NextRequest
class MockNextRequest {
  constructor(url: string, options: any) {
    this.url = url
    this.method = options.method
    this.body = options.body
    this.headers = new Map(Object.entries(options.headers || {}))
  }
  url: string
  method: string
  body: string
  headers: Map<string, string>
  async json() {
    return JSON.parse(this.body)
  }
}

const NextRequest = MockNextRequest as any

// Mock do módulo de banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

// Mock do módulo de sessão para evitar erro de cookies fora do contexto Next.js
jest.mock('@/lib/session', () => ({
  createSession: jest.fn(),
}))

// Mock do bcryptjs
const mockBcryptCompare = jest.fn()
jest.mock('bcryptjs', () => ({
  compare: (...args: any[]) => mockBcryptCompare(...args),
}))

// Mock do iron-session
jest.mock('iron-session', () => ({
  getIronSession: jest.fn(),
}))

import { query } from '@/lib/db'
import { getIronSession } from 'iron-session'

const mockQuery = query as jest.MockedFunction<typeof query>
// mockBcryptCompare já definido acima
const mockGetIronSession = getIronSession as jest.MockedFunction<typeof getIronSession>

// Mock da session
const mockSession = {
  userId: undefined,
  userRole: undefined,
  save: jest.fn(),
}

describe('/api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetIronSession.mockResolvedValue(mockSession as any)
  })

  it('deve retornar erro 401 para senha errada do administrador', async () => {
    const mockUser = {
      cpf: '12345678901',
      nome: 'Administrador',
      perfil: 'admin',
      senha_hash: '$2a$10$ValidHash',
      ativo: true
    }

    mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 })
    mockBcryptCompare.mockResolvedValue(false)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        cpf: '12345678901',
        senha: 'senhaerrada'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('CPF ou senha inválidos')
  })

  it('deve fazer login com sucesso para administrador', async () => {
    const mockUser = {
      cpf: '12345678901',
      nome: 'Administrador',
      perfil: 'admin',
      senha_hash: '$2a$10$ValidHash',
      ativo: true
    }

    mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 })
    mockBcryptCompare.mockResolvedValue(true)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        cpf: '12345678901',
        senha: 'admin123'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cpf).toBe('12345678901')
    expect(data.perfil).toBe('admin')
    expect(data.nome).toBe('Administrador')
  })

  it('deve fazer login com sucesso para RH', async () => {
    const mockUser = {
      cpf: '98765432100',
      nome: 'RH Manager',
      perfil: 'rh',
      senha_hash: '$2a$10$AnotherValidHash',
      ativo: true
    }

    mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 })
    mockBcryptCompare.mockResolvedValue(true)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        cpf: '98765432100',
        senha: 'rh123'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cpf).toBe('98765432100')
    expect(data.perfil).toBe('rh')
    expect(data.nome).toBe('RH Manager')
  })

  it('deve fazer login com sucesso para funcionário', async () => {
    const mockUser = {
      cpf: '11122233344',
      nome: 'João Silva',
      perfil: 'funcionario',
      senha_hash: '$2a$10$ValidHashForEmployee',
      ativo: true
    }

    mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 })
    mockBcryptCompare.mockResolvedValue(true)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        cpf: '11122233344',
        senha: 'func123'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cpf).toBe('11122233344')
    expect(data.perfil).toBe('funcionario')
    expect(data.nome).toBe('João Silva')
  })

  // ...demais testes permanecem iguais...
})


  it('deve retornar erro 400 para dados inválidos', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        cpf: '', // cpf vazio
        senha: 'test'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('CPF e senha são obrigatórios')
  })

  it('deve retornar erro 401 para usuário não encontrado', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        cpf: '99999999999',
        senha: 'qualquercoisa'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('CPF ou senha inválidos')
  })

  // Removido: teste duplicado de senha incorreta (já coberto no início)

  it('deve retornar erro 500 para erro de banco de dados', async () => {
    mockQuery.mockRejectedValue(new Error('Erro de banco'))

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        cpf: '12345678901',
        senha: 'admin123'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erro interno do servidor')
  })

  it('deve validar formato de email', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        cpf: '', // cpf inválido
        senha: 'password123'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('CPF e senha são obrigatórios')
  })

  it('deve processar hash bcrypt corretamente', async () => {
    const realHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // password = 'password'
    
    const mockUser = {
      cpf: '55566677788',
      nome: 'Test User',
      perfil: 'funcionario',
      senha_hash: realHash,
      ativo: true
    }

    mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 })
    mockBcryptCompare.mockResolvedValue(true)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        cpf: '55566677788',
        senha: 'password'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cpf).toBe('55566677788')
    expect(data.perfil).toBe('funcionario')
    expect(data.nome).toBe('Test User')
    expect(mockBcryptCompare).toHaveBeenCalledWith('password', realHash)
  })

  it('deve não retornar password_hash na resposta', async () => {
    const mockUser = {
      cpf: '12345678901',
      nome: 'Administrador',
      perfil: 'admin',
      senha_hash: '$2a$10$SensitiveHash',
      ativo: true
    }

    mockQuery.mockResolvedValue({ rows: [mockUser], rowCount: 1 })
    mockBcryptCompare.mockResolvedValue(true)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        cpf: '12345678901',
        senha: 'admin123'
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.cpf).toBe('12345678901')
    expect(data.perfil).toBe('admin')
    expect(data.nome).toBe('Administrador')
    expect(data.password_hash).toBeUndefined()
  })
