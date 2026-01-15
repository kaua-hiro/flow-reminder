"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Trash2, Calendar as CalendarIcon, Clock, MessageCircle, Pencil, X } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);

  // Estados do Formulário
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  
  // ESTADO NOVO: Controle de Edição
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setUser(session.user);
        fetchData(session.user.id);
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const fetchData = async (userId: string) => {
    // Busca Clientes
    const { data: customersData } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", userId)
      .order("name");
    
    if (customersData) setCustomers(customersData);

    // Busca Agendamentos
    const { data: appData } = await supabase
      .from("appointments")
      .select(`
        *,
        customers (name, phone)
      `)
      .eq("user_id", userId)
      .order("date", { ascending: true });

    if (appData) setAppointments(appData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !selectedDate) {
      alert("Selecione um cliente e uma data!");
      return;
    }

    if (editingId) {
      // --- MODO EDIÇÃO ---
      const { error } = await supabase
        .from("appointments")
        .update({
          customer_id: selectedCustomer,
          date: new Date(selectedDate).toISOString()
        })
        .eq("id", editingId);

      if (error) {
        alert("Erro ao atualizar: " + error.message);
      } else {
        cancelEdit(); // Limpa o formulário
        fetchData(user.id);
      }

    } else {
      // --- MODO CRIAÇÃO ---
      const { error } = await supabase.from("appointments").insert({
        user_id: user.id,
        customer_id: selectedCustomer,
        date: new Date(selectedDate).toISOString(),
      });

      if (error) {
        alert("Erro ao agendar: " + error.message);
      } else {
        cancelEdit(); // Limpa o formulário
        fetchData(user.id);
      }
    }
  };

  // Prepara o formulário para editar
  const handleEdit = (apt: any) => {
    setSelectedCustomer(apt.customer_id);
    // Converte a data UTC do banco para o formato local do input (yyyy-MM-ddThh:mm)
    const dateObj = new Date(apt.date);
    dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
    setSelectedDate(dateObj.toISOString().slice(0, 16));
    
    setEditingId(apt.id);
    
    // Rola a tela para cima (mobile)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setSelectedDate("");
    setSelectedCustomer("");
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Cancelar este agendamento?")) return;
    await supabase.from("appointments").delete().eq("id", id);
    fetchData(user.id);
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleWhatsApp = (customerName: string, customerPhone: string, dateString: string) => {
    if (!customerPhone) return alert("Cliente sem telefone.");
    const dateObj = new Date(dateString);
    const dateFormatted = dateObj.toLocaleDateString('pt-BR');
    const timeFormatted = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const message = `Olá ${customerName}! Passando para confirmar seu horário agendado para dia *${dateFormatted}* às *${timeFormatted}*. Tudo certo?`;
    const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + 
           " às " + 
           date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  if (loading) return <p className="p-8 text-gray-500">Carregando painel...</p>;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold text-gray-800">FlowReminder</h1>
          <div className="hidden md:flex gap-6 text-sm font-medium text-gray-500">
            <span className="text-blue-600 cursor-default">Agenda</span>
            <span onClick={() => router.push("/customers")} className="hover:text-blue-600 cursor-pointer transition-colors">Clientes</span>
          </div>
        </div>
        <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-700 font-medium">Sair</button>
      </nav>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Formulário (Muda de cor se estiver editando) */}
        <div className="md:col-span-1">
          <div className={`rounded-lg shadow p-6 sticky top-6 transition-colors ${editingId ? 'bg-orange-50 border border-orange-200' : 'bg-white'}`}>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              {editingId ? (
                <> <Pencil className="w-5 h-5 text-orange-500"/> Editando Horário </>
              ) : (
                <> <CalendarIcon className="w-5 h-5 text-blue-600"/> Novo Horário </>
              )}
            </h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select 
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Selecione...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data e Hora</label>
                <input 
                  type="datetime-local"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <button 
                  type="submit" 
                  className={`flex-1 font-medium py-2 rounded-md transition-colors text-white ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {editingId ? "Salvar Alteração" : "Confirmar"}
                </button>
                
                {editingId && (
                  <button 
                    type="button" 
                    onClick={cancelEdit}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-md"
                    title="Cancelar Edição"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Lista de Horários */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500"/> Próximos Horários
              </h2>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {appointments.length} agendados
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {appointments.length > 0 ? appointments.map((apt) => (
                <div key={apt.id} className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 transition-colors gap-4 ${editingId === apt.id ? 'bg-orange-50' : ''}`}>
                  <div>
                    <h3 className="font-semibold text-gray-900">{apt.customers?.name || "Cliente Excluído"}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      📅 {formatDateDisplay(apt.date)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Botão WhatsApp */}
                    <button 
                      onClick={() => handleWhatsApp(apt.customers?.name, apt.customers?.phone, apt.date)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Cobrar
                    </button>

                    {/* Botão Editar */}
                    <button 
                      onClick={() => handleEdit(apt)}
                      className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-all"
                      title="Editar Horário"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Botão Excluir */}
                    <button 
                      onClick={() => handleDelete(apt.id)}
                      className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all"
                      title="Cancelar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-gray-400">
                  <p>Sua agenda está livre.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}