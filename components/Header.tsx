'use client'

import { useEffect, useState } from 'react'

interface HeaderProps {
  userName?: string;
  userRole?: 'funcionario' | 'rh' | 'admin' | 'master' | 'emissor';
  nivelCargo?: 'operacional' | 'gestao';
}

interface Session {
  cpf: string;
  nome: string;
  perfil: 'funcionario' | 'rh' | 'admin' | 'master' | 'emissor';
  nivelCargo?: 'operacional' | 'gestao';
}

export default function Header({ userName, userRole, nivelCargo }: HeaderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sempre busca a sessão se não houver props
    if (!userName || !userRole) {
      fetchSession()
    } else {
      setSession({
        cpf: '',
        nome: userName,
        perfil: userRole,
        nivelCargo: nivelCargo
      })
      setLoading(false)
    }
  }, [userName, userRole, nivelCargo])

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.cpf) {
          setSession(data)
        } else {
          setSession(null)
        }
      } else {
        setSession(null)
      }
    } catch (error) {
      console.error('Erro ao buscar sessão:', error)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  const getRoleTitle = (role?: string) => {
    switch (role) {
      case 'master':
        return 'Master Admin'
      case 'emissor':
        return 'Emissor de Laudos'
      case 'admin':
        return 'Administração'
      case 'rh':
        return 'Clínica BPS Brasil'
      case 'funcionario':
        return 'Avaliação Psicossocial'
      default:
        return 'BPS Brasil'
    }
  }

  if (loading) {
    return null;
  }

  // Prioriza props, se não existirem usa session
  const nome = userName || session?.nome;
  const perfil = userRole || session?.perfil;

  // Se não há informação de usuário, não renderiza o header
  if (!nome && !perfil) {
    return null;
  }

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
      {/* Título do papel/contexto */}
      <div style={{ fontWeight: 'bold', fontSize: 22, letterSpacing: 0.5 }}>
        {getRoleTitle(perfil)}
      </div>
      
      {/* Nome do usuário */}
      {nome && (
        <span style={{ fontWeight: 'bold', fontSize: 16, color: '#FF6B00' }}>
          {nome}
        </span>
      )}
    </header>
  )
}
