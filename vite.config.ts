import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Vite solo lee .env files; en Vercel las vars vienen por process.env.
  // Mezclamos ambas fuentes para que VITE_* lleguen al bundle en todos los entornos.
  const fileEnv = loadEnv(mode, process.cwd(), "");
  for (const key of Object.keys(fileEnv)) {
    if (process.env[key] === undefined) process.env[key] = fileEnv[key];
  }

  return {
    tanstackStart: { server: { entry: "server" }, preset: "vercel" },
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    },
  };
});
