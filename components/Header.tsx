'use client'

import { useRouter } from 'next/navigation'

interface HeaderProps {
  userName: string
  userRole: 'funcionario' | 'rh' | 'admin'
}

export default function Header({ userName, userRole }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const getRoleName = (role: string) => {
    const roles = {
      funcionario: 'Funcionário',
      rh: 'RH',
      admin: 'Administrador',
    }
    return roles[role as keyof typeof roles] || role
  }

  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold">BPS Brasil</h1>
            <p className="text-xs sm:text-sm opacity-90">COPSOQ III - Avaliação Psicossocial</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="text-center sm:text-right">
              <p className="font-semibold text-sm sm:text-base">{userName}</p>
              <p className="text-xs opacity-90">{getRoleName(userRole)}</p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-white text-primary px-3 sm:px-4 py-1 sm:py-2 rounded-md hover:bg-gray-100 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
