'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut, UserPlus, Search, Trash2, ArrowLeft } from 'lucide-react'

export default function Customers() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estado para novo cliente
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        fetchCustomers(session.user.id)
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  const fetchCustomers = async (userId: string) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId) // Segurança: só traz meus clientes
      .order('name', { ascending: true })
    
    if (error) console.error(error)
    if (data) setCustomers(data)
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const { error } = await supabase
      .from('customers')
      .insert({ user_id: user.id, name: newName, phone: newPhone })

    if (error) {
      alert('Erro ao criar cliente')
    } else {
      setNewName('')
      setNewPhone('')
      setIsAdding(false)
      fetchCustomers(user.id)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cliente apaga o histórico dele. Confirmar?')) return
    await supabase.from('customers').delete().eq('id', id)
    fetchCustomers(user.id)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Filtro de busca local (Client-side search)
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  )

  if (loading) return <div className="p-10 text-center">Carregando CRM...</div>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Cabeçalho Igual ao Dashboard */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-900">Meus Clientes</h1>
          <p className="text-sm text-gray-500">{customers.length} cadastrados</p>
        </div>
        
        <div className="flex gap-4">
            <button 
            onClick={() => router.push('/dashboard')} 
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md"
            >
            Agendamentos
            </button>
            <button 
            onClick={() => router.push('/customers')} 
            className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md"
            >
            Meus Clientes
            </button>
            <button onClick={handleLogout} className="flex items-center text-red-600 hover:text-red-800 border border-red-200 px-3 py-1 rounded ml-4">
            <LogOut className="w-4 h-4 mr-2" /> Sair
            </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* Barra de Ações */}
        <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                    placeholder="Buscar por nome ou telefone..."
                    className="pl-10 w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 bg-white"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={() => setIsAdding(!isAdding)}
                className="bg-black text-white px-4 py-2 rounded-md flex items-center hover:bg-gray-800 transition-colors"
            >
                <UserPlus className="w-4 h-4 mr-2" /> Novo Cliente
            </button>
        </div>

        {/* Formulário (Aparece só quando clica em Novo Cliente) */}
        {isAdding && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-indigo-500 animate-in fade-in slide-in-from-top-4">
                <h3 className="font-bold text-gray-900 mb-4">Cadastrar Novo Cliente</h3>
                <form onSubmit={handleAddCustomer} className="flex flex-col md:flex-row gap-4">
                    <input 
                        placeholder="Nome Completo" 
                        required 
                        className="flex-1 border p-2 rounded text-gray-900 bg-white"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                    />
                    <input 
                        placeholder="Telefone (11999999999)" 
                        required 
                        className="flex-1 border p-2 rounded text-gray-900 bg-white"
                        value={newPhone}
                        onChange={e => setNewPhone(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">Salvar</button>
                        <button type="button" onClick={() => setIsAdding(false)} className="text-gray-500 px-4 py-2 hover:bg-gray-100 rounded">Cancelar</button>
                    </div>
                </form>
            </div>
        )}

        {/* Lista de Clientes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="p-4 font-semibold text-gray-700">Nome</th>
                        <th className="p-4 font-semibold text-gray-700">Telefone</th>
                        <th className="p-4 font-semibold text-gray-700 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 text-gray-900 font-medium">{customer.name}</td>
                            <td className="p-4 text-gray-500">{customer.phone}</td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => handleDelete(customer.id)}
                                    className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-all"
                                    title="Excluir Cliente"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={3} className="p-8 text-center text-gray-400">
                                Nenhum cliente encontrado.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  )
}