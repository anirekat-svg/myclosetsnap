import { Link, useLocation } from "@tanstack/react-router";
import { Home, Shirt, Sparkles, User, Plus } from "lucide-react";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/closet", label: "Closet", icon: Shirt },
] as const;

const items2 = [
  { to: "/generate", label: "Style", icon: Sparkles },
  { to: "/profile", label: "Me", icon: User },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 pt-3 pb-6">
        {items.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 ${active ? "text-foreground" : "text-muted-foreground/60"}`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.2 : 1.6} />
              <span className="text-[10px] font-medium uppercase tracking-tight">{label}</span>
            </Link>
          );
        })}
        <div className="-mt-9">
          <Link
            to="/add"
            className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-black/20 ring-4 ring-background"
          >
            <Plus className="size-6" />
          </Link>
        </div>
        {items2.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 ${active ? "text-foreground" : "text-muted-foreground/60"}`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.2 : 1.6} />
              <span className="text-[10px] font-medium uppercase tracking-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
