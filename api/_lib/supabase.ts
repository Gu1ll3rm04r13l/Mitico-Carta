import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('[supabase] SUPABASE_URL / SUPABASE_ANON_KEY no configurados')
}

export const supabaseServer = createClient(url, anonKey, {
  auth: { persistSession: false },
})
