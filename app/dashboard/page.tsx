'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase' // Se der erro vermelho, mude para '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, LogOut, MessageCircle, Loader2 } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form para novo agendamento
  const [newClient, setNewClient] = useState('')
  const [newPhone, setNewPhone] = useState('')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        fetchAppointments(session.user.id)
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  const fetchAppointments = async (userId: string) => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*, customers(name, phone)')
      .order('start_time', { ascending: true })
    
    if (error) console.error('Erro ao buscar:', error)
    if (data) setAppointments(data)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // CRIA CLIENTE
    const { data: customer } = await supabase
      .from('customers')
      .insert({ user_id: user.id, name: newClient, phone: newPhone })
      .select()
      .single()

    if (customer) {
      // CRIA AGENDAMENTO (Pra amanhã)
      await supabase.from('appointments').insert({
        user_id: user.id,
        customer_id: customer.id,
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      })
      
      setNewClient('')
      setNewPhone('')
      fetchAppointments(user.id)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que quer deletar?')) return;
    await supabase.from('appointments').delete().eq('id', id)
    fetchAppointments(user.id)
  }

  // FUNÇÃO PROVISÓRIA DO BOTÃO ZAP
  const handleSendZap = async (phone: string, name: string) => {
    // Feedback visual imediato (UX Profissional)
    const btn = document.getElementById(`btn-${phone}`) as HTMLButtonElement
    if (btn) {
      btn.disabled = true
      btn.innerHTML = '<span class="animate-spin">⌛</span> Enviando...'
    }

    try {
      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name })
      })

      if (response.ok) {
        alert('✅ Mensagem enviada pelo servidor!')
      } else {
        alert('❌ Erro ao enviar.')
      }
    } catch (error) {
      console.error(error)
      alert('❌ Erro de conexão.')
    } finally {
      // Restaura o botão
      if (btn) {
        btn.disabled = false
        btn.innerHTML = '<svg class="w-4 h-4" ...>...</svg> Cobrar' // O ícone volta aqui, mas o React renderiza rápido
        // Na prática, vamos forçar um reload leve ou apenas deixar assim por enquanto
        window.location.reload() // Recarrega pra limpar o estado visual (MVP)
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Cabeçalho */}
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel de Controle</h1>
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center text-red-600 hover:text-red-800 border border-red-200 px-3 py-1 rounded">
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </button>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Coluna 1: Criar Novo */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Novo Agendamento</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500">Nome do Cliente</label>
                <input
                  placeholder="Ex: Maria Silva"
                  // AQUI ESTÁ A CORREÇÃO DA COR: text-gray-900 bg-white
                  className="w-full border border-gray-300 p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newClient}
                  onChange={e => setNewClient(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">WhatsApp</label>
                <input
                  placeholder="Ex: 11999999999"
                  // AQUI TAMBÉM
                  className="w-full border border-gray-300 p-2 rounded text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  required
                />
              </div>
              <button className="w-full bg-indigo-600 text-white p-2 rounded flex justify-center items-center hover:bg-indigo-700 font-medium transition-colors">
                <Plus className="w-4 h-4 mr-2" /> Agendar
              </button>
            </form>
          </div>
        </div>

        {/* Coluna 2: Lista */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-700">Próximos Clientes (Amanhã)</h3>
            </div>
            {appointments.length === 0 ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                <p>Nenhum agendamento pendente.</p>
                <p className="text-sm mt-2">Cadastre alguém ao lado 👉</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {appointments.map((apt) => (
                  <li key={apt.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 text-lg">{apt.customers?.name || 'Cliente Desconhecido'}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                         <span>📱 {apt.customers?.phone}</span>
                         <span>⏰ {new Date(apt.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      
                      {/* BOTÃO NOVO DO ZAP */}
                      <button 
                        id={`btn-${apt.customers?.phone}`}
                        onClick={() => handleSendZap(apt.customers?.phone, apt.customers?.name)}
                        className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
                        title="Cobrar confirmação"
                      >
                        <MessageCircle className="w-4 h-4" /> Cobrar
                      </button>

                      <button onClick={() => handleDelete(apt.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Deletar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}