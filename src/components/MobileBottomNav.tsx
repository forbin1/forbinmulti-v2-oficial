import { Link } from "@tanstack/react-router";
import { Compass, Briefcase, BookOpen, ClipboardList, User, FolderHeart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function MobileBottomNav() {
  const { user, role } = useAuth();

  // If not logged in, we still show the navigation to basic areas
  const profileLink = role === "admin" 
    ? "/admin" 
    : role === "company" 
    ? "/empresa" 
    : role === "professional"
    ? "/profissional"
    : "/login";

  const candidaturasLink = role === "company" ? "/empresa/candidatos" : "/candidaturas";
  const candidaturasLabel = role === "company" ? "Candidatos" : "Candidaturas";

  const navItems = [
    {
      to: "/feed",
      icon: Compass,
      label: "Feed"
    },
    {
      to: "/vagas",
      icon: Briefcase,
      label: "Vagas"
    },
    {
      to: candidaturasLink,
      icon: ClipboardList,
      label: candidaturasLabel
    },
    {
      to: "/cursos",
      icon: BookOpen,
      label: "Cursos"
    },
    {
      to: profileLink,
      icon: User,
      label: "Perfil"
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/40 bg-card/85 backdrop-blur-xl pb-safe lg:hidden transition-all duration-300">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to as any}
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground transition-all duration-300 hover:text-foreground relative group flex-1 h-full"
          >
            {({ isActive }) => (
              <>
                <item.icon className={`h-5 w-5 transition-all duration-300 ${isActive ? "scale-110 text-primary drop-shadow-[0_0_8px_rgba(234,179,8,0.2)]" : "group-hover:scale-105"}`} />
                <span className={`text-[10px] tracking-wide transition-all duration-300 ${isActive ? "text-primary font-bold" : "text-muted-foreground/80 font-medium"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_#eab308]" />
                )}
              </>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
