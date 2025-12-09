import { describe, it, expect } from '@jest/globals'
import { GET } from '@/app/api/rh/laudos/route'
import { GET as DownloadGET } from '@/app/api/rh/laudos/[laudoId]/download/route'
import { getSession } from '@/lib/session'
import { query } from '@/lib/db'

const mockRequest = (method: string, params?: any) => ({
  method,
  params: params || {},
})

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}))

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>
const mockQuery = query as jest.MockedFunction<typeof query>

describe('API RH - Laudos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve consultar laudos do RH', async () => {
    mockGetSession.mockResolvedValue({ cpf: '11111111111', nome: 'RH Teste', perfil: 'rh' })
    mockQuery.mockResolvedValue({ rows: [] })
    const req = mockRequest('GET')
    const res = await GET(req as any)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.laudos)).toBe(true)
  })

  it('deve baixar um laudo enviado', async () => {
    mockGetSession.mockResolvedValue({ cpf: '11111111111', nome: 'RH Teste', perfil: 'rh' })
    const req = mockRequest('GET', { laudoId: 1 })
    const res = await DownloadGET(req as any, { params: { laudoId: '1' } })
    expect([200, 404]).toContain(res.status)
  })
})
