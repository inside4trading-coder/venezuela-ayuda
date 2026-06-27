import { createClient } from '@supabase/supabase-js'

// El anon key de Supabase es publico por diseno (RLS protege los datos).
// Hardcodeamos como fallback porque el define de Vite no propaga al bundle SSR de Nitro en Vercel.
const FALLBACK_URL = 'https://kqtilzssuynblfkuqxyx.supabase.co'
const FALLBACK_ANON = 'sb_publishable_udPVuneAoBbPorp0N0nd-w_pLgp36S8'

const url = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON

export const supabase = createClient(url, anon)
