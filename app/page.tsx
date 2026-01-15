"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      // 1. Pergunta pro Supabase: "Tem alguém logado?"
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Se sim, manda pro painel
        router.push("/dashboard");
      } else {
        // Se não, manda pro login
        router.push("/login");
      }
    };

    // 2. Ouve se o login acabou de acontecer (Magic Link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/dashboard");
      }
    });

    checkSession();

    return () => subscription.unsubscribe();
  }, [router]);

  // Tela de carregamento enquanto decide
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <p className="text-gray-500 animate-pulse">Verificando acesso...</p>
    </div>
  );
}