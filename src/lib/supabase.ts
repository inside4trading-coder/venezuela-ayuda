import { createClient } from '@supabase/supabase-js'

// El anon key de Supabase es publico por diseno (RLS protege los datos).
// Hardcodeamos como fallback porque la env var de Vercel estaba malformada
// y rompia el build SSR ("Invalid supabaseUrl").
const FALLBACK_URL = 'https://kqtilzssuynblfkuqxyx.supabase.co'
const FALLBACK_ANON = 'sb_publishable_udPVuneAoBbPorp0N0nd-w_pLgp36S8'

function validUrl(v: unknown): v is string {
  if (typeof v !== 'string') return false
  const s = v.trim()
  return s.startsWith('http://') || s.startsWith('https://')
}

const envUrl = import.meta.env.VITE_SUPABASE_URL
const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

const url = validUrl(envUrl) ? envUrl.trim() : FALLBACK_URL
const anon =
  typeof envAnon === 'string' && envAnon.trim().length > 10
    ? envAnon.trim()
    : FALLBACK_ANON

export const supabase = createClient(url, anon)
