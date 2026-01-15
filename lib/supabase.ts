import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cria o cliente sem tipagem estrita de banco (any) para evitar erros de TS no MVP
export const supabase = createClient(supabaseUrl, supabaseAnonKey)