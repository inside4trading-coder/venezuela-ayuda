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

// Solo navegador: con SSR no hay window y supabase no debe parsear URL
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

export const supabase = createClient(url, anon, {
  auth: {
    detectSessionInUrl: isBrowser,
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    flowType: 'implicit',
    debug: isBrowser,
  },
})

if (isBrowser) {
  // Log diagnostico para confirmar que el cliente arranca client-side
  // (visible en DevTools). Si el OAuth vuelve y aqui no se limpia el hash,
  // sabemos que el bug esta dentro de supabase-js, no en useAuth.
  // eslint-disable-next-line no-console
  console.log('[supabase] client created', { url, hashOnLoad: window.location.hash.slice(0, 40) })
}
