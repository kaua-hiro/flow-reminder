'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin, 
      }
    });

    if (error) {
      alert("Erro ao enviar login: " + error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md border">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">FlowReminder</h2>
          <p className="mt-2 text-sm text-gray-600">Acesse sua conta</p>
        </div>

        {!sent ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <input
              type="email"
              required
              className="block w-full rounded-md border p-2 text-gray-900 shadow-sm ring-1 ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-600"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-indigo-600 p-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Entrar com Link Mágico'}
            </button>
          </form>
        ) : (
          <div className="text-center bg-green-50 p-4 rounded text-green-800 border border-green-200">
            <p className="font-bold">✅ Link enviado!</p>
            <p className="text-sm mt-1">Verifique seu e-mail ({email}).</p>
            <button onClick={() => setSent(false)} className="mt-4 text-xs underline">Voltar</button>
          </div>
        )}
      </div>
    </div>
  )
}