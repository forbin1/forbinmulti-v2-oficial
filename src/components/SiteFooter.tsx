import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-muted-foreground">
            A plataforma de conexão entre profissionais e empresas do setor de
            segurança privada.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Plataforma
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/vagas" className="hover:text-foreground">Vagas</Link></li>
            <li><Link to="/feed" className="hover:text-foreground">Feed</Link></li>
            <li><Link to="/cadastro" className="hover:text-foreground">Criar conta</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Empresas
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/cadastro-empresa" className="hover:text-foreground">Cadastrar empresa</Link></li>
            <li><Link to="/empresa" className="hover:text-foreground">Painel admin</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Contato
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>contato@forbin.com.br</li>
            <li>Brasil — 24h</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FORBIN MultiEmpresas. Todos os direitos reservados.
      </div>
    </footer>
  );
}
