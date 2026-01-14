import { createClient } from '@supabase/supabase-js'

// Estamos colocando direto aqui pra burlar o erro do Windows
const supabaseUrl = 'https://qmrttritmebjgrnzngth.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcnR0cml0bWViamdybnpuZ3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0MDAzOTIsImV4cCI6MjA4Mzk3NjM5Mn0.RYT0iHAwSQuTElHqHR09k_RR6P3Z_hE56tEu3zbzFeQ'

export const supabase = createClient(supabaseUrl, supabaseKey)