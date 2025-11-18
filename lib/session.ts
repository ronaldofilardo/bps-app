import { query } from './db'
import { cookies } from 'next/headers'

// Tipos
export interface Session {
  cpf: string
  nome: string
  perfil: 'funcionario' | 'rh' | 'admin'
}

// Criar sessão (armazenar em cookie seguro)
export async function createSession(session: Session): Promise<void> {
  const cookieStore = await cookies()
  
  // Cookie httpOnly, secure, sameSite
  cookieStore.set('bps-session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  })
}

// Obter sessão atual
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('bps-session')
    
    if (!sessionCookie?.value) {
      return null
    }
    
    const session = JSON.parse(sessionCookie.value)
    return session
  } catch (error) {
    console.error('Erro ao obter sessão:', error)
    return null
  }
}

// Destruir sessão
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('bps-session')
}

// Verificar se usuário está autenticado
export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  
  if (!session) {
    throw new Error('Não autenticado')
  }
  
  return session
}

// Verificar perfil específico
export async function requireRole(role: 'rh' | 'admin'): Promise<Session> {
  const session = await requireAuth()
  
  if (session.perfil !== role && session.perfil !== 'admin') {
    throw new Error('Sem permissão')
  }
  
  return session
}
