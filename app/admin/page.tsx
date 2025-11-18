'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

interface Session {
  cpf: string
  nome: string
  perfil: 'funcionario' | 'rh' | 'admin'
}

interface Funcionario {
  cpf: string
  nome: string
  setor: string
  funcao: string
  email: string
  perfil: string
  ativo: boolean
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session')
      if (!sessionRes.ok) {
        router.push('/login')
        return
      }
      const sessionData = await sessionRes.json()
      
      if (sessionData.perfil !== 'admin') {
        router.push('/dashboard')
        return
      }
      
      setSession(sessionData)

      const funcRes = await fetch('/api/admin/funcionarios')
      const funcData = await funcRes.json()
      setFuncionarios(funcData.funcionarios || [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim())
      
      const funcionariosImport = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim())
        const obj: any = {}
        headers.forEach((header, idx) => {
          obj[header] = values[idx]
        })
        return obj
      })

      const response = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funcionarios: funcionariosImport }),
      })

      const result = await response.json()
      alert(`Importação concluída!\nSucesso: ${result.sucesso}\nErros: ${result.erros}`)
      fetchData()
    } catch (error) {
      alert('Erro ao importar arquivo CSV')
    } finally {
      setUploading(false)
    }
  }

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={session.nome} userRole={session.perfil} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Administração</h2>
          <p className="text-gray-600">Gerenciamento de funcionários e sistema</p>
        </div>

        {/* Upload CSV */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Importar Funcionários (CSV)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Formato esperado: cpf,nome,setor,funcao,email,perfil
          </p>
          
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors">
              {uploading ? 'Importando...' : 'Escolher Arquivo CSV'}
              <input
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                disabled={uploading}
                className="hidden"
              />
            </label>
            
            <button
              onClick={() => router.push('/rh')}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Ver Dashboard RH
            </button>
          </div>
        </div>

        {/* Tabela de funcionários */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Funcionários Cadastrados ({funcionarios.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Setor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perfil</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {funcionarios.map((func) => (
                  <tr key={func.cpf} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{func.cpf}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{func.nome}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{func.setor}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{func.funcao}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        func.perfil === 'admin' ? 'bg-purple-100 text-purple-800' :
                        func.perfil === 'rh' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {func.perfil.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        func.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {func.ativo ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
