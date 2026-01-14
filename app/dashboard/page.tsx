'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, LogOut, MessageCircle, Loader2, Calendar, Clock, User } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados do Formulário
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedDate, setSelectedDate] = useState('') // Agora temos data real
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
        fetchData(session.user.id)
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  const fetchData = async (userId: string) => {
    const { data: apts } = await supabase
      .from('appointments')
      .select('*, customers(name, phone)')
      .order('start_time', { ascending: true })
    
    if (apts) setAppointments(apts)

    const { data: custs } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })
    
    if (custs) setCustomers(custs)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedCustomerId || !selectedDate) return
    setSubmitting(true)

    const { error } = await supabase.from('appointments').insert({
      user_id: user.id,
      customer_id: selectedCustomerId,
      start_time: new Date(selectedDate).toISOString(), // Usa a data escolhida
      status: 'pending'
    })

    if (error) {
      alert('Erro ao agendar: ' + error.message)
    } else {
      // Limpa formulário
      setSelectedCustomerId('')
      setSelectedDate('')
      fetchData(user.id)
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Cancelar este agendamento?')) return;
    await supabase.from('appointments').delete().eq('id', id)
    fetchData(user?.id)
  }

  const handleSendZap = async (phone: string, name: string, date: string) => {
    const btn = document.getElementById(`btn-${phone}`) as HTMLButtonElement
    if (btn) {
      btn.disabled = true
      btn.innerHTML = '⌛ Enviando...'
    }

    // Formata data pra mensagem ficar bonita no zap
    const dateObj = new Date(date)
    const dateStr = dateObj.toLocaleDateString('pt-BR')
    const timeStr = dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})

    try {
      await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          name,
          message: `Olá ${name}! Seu horário está agendado para ${dateStr} às ${timeStr}. Confirma?`
        })
      })
      alert('✅ Mensagem enviada!')
    } catch (error) {
      alert('❌ Erro de conexão.')
    } finally {
      if (btn) {
        btn.disabled = false
        btn.innerHTML = 'Cobrar'
        window.location.reload()
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Formatador de Data Bonito (ex: 14 de Jan às 15:30)
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(date)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navbar Premium */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-8">
              <span className="text-xl font-bold tracking-tight text-gray-900">FlowReminder</span>
              <div className="hidden md:flex space-x-4">
                <button onClick={() => router.push('/dashboard')} className="text-indigo-600 px-3 py-2 text-sm font-medium border-b-2 border-indigo-600">Agenda</button>
                <button onClick={() => router.push('/customers')} className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium">Clientes</button>
              </div>
            </div>
            <div className="flex items-center">
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 text-sm font-medium transition-colors">Sair</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Card de Agendamento */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Novo Horário
              </h2>
              
              {customers.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <User className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 mb-4">Sem clientes cadastrados.</p>
                  <button 
                    onClick={() => router.push('/customers')}
                    className="w-full bg-indigo-600 text-white p-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
                  >
                    Cadastrar Cliente
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreate} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cliente</label>
                    <select
                      required
                      className="block w-full rounded-lg border-gray-300 border p-2.5 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
                      value={selectedCustomerId}
                      onChange={e => setSelectedCustomerId(e.target.value)}
                    >
                      <option value="" disabled>Selecione...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Data e Hora</label>
                    <input
                      type="datetime-local"
                      required
                      className="block w-full rounded-lg border-gray-300 border p-2.5 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                    />
                  </div>

                  <button 
                    disabled={submitting}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-all"
                  >
                    {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Confirmar Agendamento'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Lista de Agenda */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" /> Próximos Horários
                </h3>
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  {appointments.length} agendados
                </span>
              </div>

              {appointments.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                    <Calendar className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900">Agenda vazia</h3>
                  <p className="mt-1 text-sm text-gray-500">Nenhum agendamento futuro encontrado.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {appointments.map((apt) => (
                    <li key={apt.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-medium text-gray-900">{apt.customers?.name}</span>
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              apt.status === 'confirmed' ? 'bg-green-50 text-green-700 ring-green-600/20' : 
                              'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                            }`}>
                              {apt.status === 'pending' ? 'Pendente' : 'Confirmado'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(apt.start_time)}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button 
                            id={`btn-${apt.customers?.phone}`}
                            onClick={() => handleSendZap(apt.customers?.phone, apt.customers?.name, apt.start_time)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all"
                          >
                            <MessageCircle className="w-4 h-4 text-green-600" />
                            <span className="hidden sm:inline">Cobrar</span>
                          </button>
                          
                          <button 
                            onClick={() => handleDelete(apt.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Cancelar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}