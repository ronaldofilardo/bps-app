'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

interface Session {
  cpf: string
  nome: string
  perfil: 'funcionario' | 'rh' | 'admin' | 'master'
}

interface Clinica {
  id: number
  nome: string
  cnpj: string
  email: string
  telefone: string
  endereco: string
  ativa: boolean
  criado_em: string
}

export default function MasterAdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [clinicas, setClinicas] = useState<Clinica[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: ''
  })
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
      
      if (sessionData.perfil !== 'master') {
        router.push('/dashboard')
        return
      }
      
      setSession(sessionData)

      // Buscar clínicas
      const clinicasRes = await fetch('/api/master/clinicas')
      if (clinicasRes.ok) {
        const clinicasData = await clinicasRes.json()
        setClinicas(clinicasData)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/master/clinicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setFormData({ nome: '', cnpj: '', email: '', telefone: '', endereco: '' })
        setShowForm(false)
        fetchData() // Recarregar lista
      } else {
        alert('Erro ao cadastrar clínica')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao cadastrar clínica')
    }
  }

  const toggleClinicaStatus = async (id: number, ativa: boolean) => {
    try {
      const response = await fetch(`/api/master/clinicas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativa: !ativa })
      })

      if (response.ok) {
        fetchData() // Recarregar lista
      } else {
        alert('Erro ao alterar status da clínica')
      }
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao alterar status da clínica')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Master Admin</h1>
              <p className="text-gray-600">Gerenciar Clínicas de Medicina Ocupacional</p>
              <p className="text-sm text-gray-500 mt-1">
                Logado como: <span className="font-semibold">{session?.nome}</span> (Master)
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
            >
              Nova Clínica
            </button>
          </div>

          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold mb-4">Cadastrar Nova Clínica</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Clínica*
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ex: Clínica Saúde Ocupacional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="12.345.678/0001-95"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="contato@clinica.com.br"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Endereço
                  </label>
                  <textarea
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Rua, Número, Bairro, Cidade - Estado"
                    rows={2}
                  />
                </div>
                <div className="col-span-2 flex gap-3">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Cadastrar Clínica
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Clínicas Cadastradas ({clinicas.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clinicas.map((clinica) => (
                    <tr key={clinica.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{clinica.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{clinica.nome}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{clinica.cnpj}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{clinica.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{clinica.telefone}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          clinica.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {clinica.ativa ? 'ATIVA' : 'INATIVA'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => toggleClinicaStatus(clinica.id, clinica.ativa)}
                          className={`px-3 py-1 rounded text-xs font-semibold ${
                            clinica.ativa 
                              ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {clinica.ativa ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}