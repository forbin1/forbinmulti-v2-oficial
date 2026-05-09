import { Outlet, createRootRoute, HeadContent, Scripts, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <p className="font-display text-7xl font-bold text-gradient-gold">404</p>
      <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        O conteúdo que você procura não existe ou foi movido.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Voltar ao início
      </Link>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FORBIN MultiEmpresas — Conexão com oportunidades em segurança privada" },
      {
        name: "description",
        content:
          "Plataforma que conecta profissionais e empresas do setor de segurança privada. Vagas, perfis, candidaturas e gestão em um só lugar.",
      },
      { name: "author", content: "FORBIN" },
      { property: "og:title", content: "FORBIN MultiEmpresas — Conexão com oportunidades em segurança privada" },
      { property: "og:description", content: "FORBIN MultiEmpresas connects private security professionals with job opportunities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "FORBIN MultiEmpresas — Conexão com oportunidades em segurança privada" },
      { name: "description", content: "FORBIN MultiEmpresas connects private security professionals with job opportunities." },
      { name: "twitter:description", content: "FORBIN MultiEmpresas connects private security professionals with job opportunities." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/12ed61ca-1b77-4140-ad9c-661eefbed122/id-preview-d7635d85--b8f0ecfc-7737-40d9-b026-d92132af60ea.lovable.app-1777047674996.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/12ed61ca-1b77-4140-ad9c-661eefbed122/id-preview-d7635d85--b8f0ecfc-7737-40d9-b026-d92132af60ea.lovable.app-1777047674996.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
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
  const { pathname } = useLocation();
  const isAuthScreen = pathname === "/login";
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
  const hideChrome = isAuthScreen || isAdminArea;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAdminArea && pathname !== "/login") {
      window.sessionStorage.setItem("admin:returnTo", pathname);
    }
  }, [pathname, isAdminArea]);

  return (
    <AuthProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        {!hideChrome && <SiteHeader />}
        <main className="flex-1">
          <Outlet />
        </main>
        {!hideChrome && <SiteFooter />}
        <Toaster theme="dark" richColors position="top-center" />
      </div>
    </AuthProvider>
  );
}
