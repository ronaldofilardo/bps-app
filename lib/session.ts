import { query } from './db'
import { cookies } from 'next/headers'

// Tipos
export interface Session {
  cpf: string
  nome: string
  perfil: 'funcionario' | 'rh' | 'admin' | 'master' | 'emissor'
  nivelCargo?: 'operacional' | 'gestao'
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
// Verificar se usuário está autenticado
export async function requireAuth(): Promise<Session> {
  const session = await getSession()

  if (!session) {
    console.log('[DEBUG] requireAuth: Sessão não encontrada')
    throw new Error('Não autenticado')
  }

  console.log('[DEBUG] requireAuth: Sessão válida para', session.cpf)
  return session
}

// Verificar perfil específico
export async function requireRole(role: 'rh' | 'admin' | 'master' | 'emissor'): Promise<Session> {
  const session = await requireAuth()

  if (session.perfil !== role && session.perfil !== 'admin' && session.perfil !== 'master') {
    console.log(`[DEBUG] requireRole: Perfil ${session.perfil} não autorizado para role ${role}`)
    throw new Error('Sem permissão')
  }

  console.log(`[DEBUG] requireRole: Acesso autorizado para ${session.cpf} com perfil ${session.perfil}`)
  return session
}

// Verificar se usuário tem acesso à empresa específica (RH ou Admin da clínica)
export async function requireRHWithEmpresaAccess(empresaId: number): Promise<Session> {
  const session = await requireAuth()

  // Admin/master podem acessar qualquer empresa
  if (session.perfil === 'admin' || session.perfil === 'master') {
    console.log(`[DEBUG] requireRHWithEmpresaAccess: Admin/master ${session.cpf} autorizado para empresa ${empresaId}`)
    return session
  }

  // RH precisa ter clínica associada à empresa
  if (session.perfil !== 'rh') {
    console.log(`[DEBUG] requireRHWithEmpresaAccess: Perfil ${session.perfil} não autorizado`)
    throw new Error('Apenas gestores RH ou administradores podem acessar empresas')
  }

  // Verificar se a empresa pertence à clínica do RH
  const empresaResult = await query(
    'SELECT clinica_id FROM empresas_clientes WHERE id = $1',
    [empresaId]
  )

  if (empresaResult.rows.length === 0) {
    console.log(`[DEBUG] requireRHWithEmpresaAccess: Empresa ${empresaId} não encontrada`)
    throw new Error('Empresa não encontrada')
  }

  const empresaClinicaId = empresaResult.rows[0].clinica_id

  // Obter clínica do RH logado
  const rhResult = await query(
    'SELECT clinica_id FROM funcionarios WHERE cpf = $1',
    [session.cpf]
  )

  if (rhResult.rows.length === 0) {
    console.log(`[DEBUG] requireRHWithEmpresaAccess: RH ${session.cpf} não encontrado`)
    throw new Error('Gestor RH não encontrado')
  }

  const rhClinicaId = rhResult.rows[0].clinica_id

  if (empresaClinicaId !== rhClinicaId) {
    console.log(`[DEBUG] requireRHWithEmpresaAccess: RH da clínica ${rhClinicaId} tentou acessar empresa da clínica ${empresaClinicaId}`)
    throw new Error('Você não tem permissão para acessar esta empresa')
  }

  console.log(`[DEBUG] requireRHWithEmpresaAccess: Acesso autorizado para RH ${session.cpf} à empresa ${empresaId}`)
  return session
}
