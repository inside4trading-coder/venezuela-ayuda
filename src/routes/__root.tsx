import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { LiveTicker } from "@/components/layout/LiveTicker";
import { Navbar } from "@/components/layout/Navbar";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-[48px] font-semibold">404</h1>
        <h2 className="mt-2 text-[17px]">No encontramos esta página</h2>
        <p className="mt-2 text-[13px] text-[var(--color-text-muted)]">
          Quizá el enlace cambió o el recurso fue retirado.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-[var(--color-critical)] px-4 py-2 text-[14px] text-white"
          >
            Volver al directorio
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-[20px] font-display font-semibold">Esta página no cargó</h1>
        <p className="mt-2 text-[13px] text-[var(--color-text-muted)]">
          Algo falló de nuestro lado. Reintenta o vuelve al directorio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-[var(--color-operational)] px-4 py-2 text-[14px] text-white"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="rounded-md border-hair border-[var(--color-border)] px-4 py-2 text-[14px]"
            style={{ borderWidth: "0.5px" }}
          >
            Ir al directorio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Venezuela Ayuda · Coordinación humanitaria en vivo" },
      {
        name: "description",
        content:
          "Plataforma operativa de coordinación humanitaria tras el terremoto del 24 de junio de 2026 en Venezuela.",
      },
      { name: "author", content: "Venezuela Ayuda" },
      { name: "theme-color", content: "#E11D2A" },
      { name: "application-name", content: "Venezuela Ayuda" },
      { name: "apple-mobile-web-app-title", content: "Venezuela Ayuda" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "mobile-web-app-capable", content: "yes" },

      // Open Graph
      { property: "og:title", content: "Venezuela Ayuda · Coordinación humanitaria en vivo" },
      {
        property: "og:description",
        content:
          "Centros activos, necesidades en tiempo real y rutas de entrega. Encuentra dónde donar o cómo ayudar hoy.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Venezuela Ayuda" },
      { property: "og:locale", content: "es_VE" },
      { property: "og:image", content: "/og-image.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:alt", content: "Venezuela Ayuda — Coordinar la ayuda en tiempo real" },

      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Venezuela Ayuda · Coordinación humanitaria en vivo" },
      {
        name: "twitter:description",
        content:
          "Centros activos, necesidades en tiempo real y rutas de entrega. Encuentra dónde donar o cómo ayudar hoy.",
      },
      { name: "twitter:image", content: "/og-image.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },

      // Icons
      { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "mask-icon", href: "/favicon.svg", color: "#E11D2A" },

      // Fonts
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LiveTicker />
      <Navbar />
      <div style={{ paddingTop: "88px" }}>
        <Outlet />
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-surface)",
            color: "var(--color-text-main)",
            border: "0.5px solid var(--color-border)",
            fontFamily: "var(--font-sans)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
