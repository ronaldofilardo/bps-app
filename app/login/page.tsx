'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [cpf, setCpf] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const formatarCPF = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '')
    return apenasNumeros.slice(0, 11)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, senha }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login')
      }

      // Redirecionar baseado no perfil
      if (data.perfil === 'master') {
        router.push('/master')
      } else if (data.perfil === 'admin') {
        router.push('/admin')
      } else if (data.perfil === 'rh') {
        router.push('/rh')
      } else if (data.perfil === 'emissor') {
        router.push('/emissor')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">BPS Brasil</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">Avaliação Psicossocial COPSOQ III</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 required">
              CPF
            </label>
            <input
              id="cpf"
              type="text"
              value={cpf}
              onChange={(e) => setCpf(formatarCPF(e.target.value))}
              placeholder="00000000000"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-base"
              required
              maxLength={11}
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700 required">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-base"
              required
            />
          </div>

          {error && (
            <div className="text-danger text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-600">
          <p>Usuários de teste:</p>
          <p className="mt-1">Master: 00000000000 / master123</p>
          <p>Admin: 11111111111 / admin123</p>
          <p>RH: 22222222222 / rh123</p>
          <p>Emissor: 99999999999 / 123</p>
          <p>Funcionário: 87545772900 / func123</p>
        </div>
      </div>
    </div>
  )
}
