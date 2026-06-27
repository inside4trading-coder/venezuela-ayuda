import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Vite solo lee .env files; en Vercel las vars vienen por process.env.
  // Mezclamos ambas fuentes para que VITE_* lleguen al bundle en todos los entornos.
  const fileEnv = loadEnv(mode, process.cwd(), "");
  // empty string también cuenta como ausente (Vercel a veces declara la var vacía)
  const pick = (key: string) => {
    const fromProc = process.env[key];
    if (fromProc && fromProc.length > 0) return fromProc;
    return fileEnv[key];
  };
  const SUPABASE_URL = pick("VITE_SUPABASE_URL");
  const SUPABASE_ANON_KEY = pick("VITE_SUPABASE_ANON_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Falla el build con error claro en vez de generar bundle roto
    throw new Error(
      `[vite.config] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ` +
        `Procesa env: url=${JSON.stringify(process.env.VITE_SUPABASE_URL)} key=${JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY)}. ` +
        `File env: url=${JSON.stringify(fileEnv.VITE_SUPABASE_URL)} key=${JSON.stringify(fileEnv.VITE_SUPABASE_ANON_KEY)}.`,
    );
  }

  return {
    tanstackStart: { server: { entry: "server" }, preset: "vercel" },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(SUPABASE_ANON_KEY),
    },
  };
});
