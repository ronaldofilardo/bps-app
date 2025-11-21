'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'


interface HeaderProps {
  userName?: string;
  userRole?: 'funcionario' | 'rh' | 'admin' | 'master';
  nivelCargo?: 'operacional' | 'gestao';
}

interface Session {
  cpf: string;
  nome: string;
  perfil: 'funcionario' | 'rh' | 'admin' | 'master';
  nivelCargo?: 'operacional' | 'gestao';
}

export default function Header({ userName, userRole, nivelCargo }: HeaderProps) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userName || !userRole) {
      fetchSession()
    } else {
      setLoading(false)
    }
  }, [userName, userRole])

  // Função para atualizar sessão (pode ser chamada externamente se necessário)
  const refreshSession = () => {
    fetchSession()
  }

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        setSession(data)
      }
    } catch (error) {
      console.error('Erro ao buscar sessão:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setSession(null) // Limpa a sessão local imediatamente
      router.push('/login')
    } catch (error) {
      router.push('/login')
    }
  }

  const getUserDisplayName = (name: string, role: string, nivelCargo?: string) => {
    return name
  }

  if (loading) {
    return null;
  }

  // Prioriza props, se não existirem usa session
  const nome = userName || session?.nome;
  const perfil = userRole || session?.perfil;
  const nivel = nivelCargo || session?.nivelCargo;

  return (
    <header
      style={{
        background: '#111',
        color: 'white',
        borderBottom: '4px solid #FF6B00',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        minHeight: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: 22, letterSpacing: 0.5 }}>
        {perfil === 'master' ? 'Master Admin' : 'Administração'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {nome && (
          <span style={{ fontWeight: 'bold', fontSize: 16 }}>
            {getUserDisplayName(nome, perfil || '', nivel)}
          </span>
        )}
        <button
          id="btn-sair"
          onClick={handleLogout}
          style={{
            background: '#FF6B00',
            color: 'white',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: 8,
            padding: '8px 24px',
            fontSize: 16,
            cursor: 'pointer',
            marginLeft: nome ? 16 : 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          SAIR
        </button>
      </div>
    </header>
  )
}
