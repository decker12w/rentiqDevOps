import { Building2, MapPin, ChevronDown, LogOut, History, LogIn, PlusCircle, Home } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const cities = [
  { id: "sao-carlos", name: "São Carlos", state: "SP", available: true },
  { id: "sao-paulo", name: "São Paulo", state: "SP", available: false },
  { id: "campinas", name: "Campinas", state: "SP", available: false },
  { id: "ribeirao-preto", name: "Ribeirão Preto", state: "SP", available: false },
];

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(cities[0]);
  const [cityOpen, setCityOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const cityRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleLogout = () => {
    logout();
    setUserOpen(false);
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg text-primary-foreground shadow-md"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Building2 className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight text-foreground">RentIQ</p>
            <p className="hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:block">
              ML Rent Predictor
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* City selector */}
          <div ref={cityRef} className="relative">
            <button
              onClick={() => setCityOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <MapPin className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">
                {selected.name} - {selected.state}
              </span>
              <span className="sm:hidden">{selected.state}</span>
              <ChevronDown
                className={cn("h-4 w-4 text-muted-foreground transition-transform", cityOpen && "rotate-180")}
              />
            </button>

            {cityOpen && (
              <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                <div className="border-b border-border bg-muted/40 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Selecione a cidade
                  </p>
                </div>
                <ul className="max-h-72 overflow-y-auto p-1">
                  {cities.map((city) => (
                    <li key={city.id}>
                      <button
                        disabled={!city.available}
                        onClick={() => {
                          if (city.available) {
                            setSelected(city);
                            setCityOpen(false);
                          }
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition",
                          city.available
                            ? "hover:bg-accent text-foreground cursor-pointer"
                            : "text-muted-foreground cursor-not-allowed",
                          selected.id === city.id && "bg-accent/60 font-semibold",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          {city.name} - {city.state}
                        </span>
                        {!city.available && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                            Em breve
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* User menu */}
          {user ? (
            <div ref={userRef} className="relative">
              <button
                onClick={() => setUserOpen((v) => !v)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {user.email[0].toUpperCase()}
                </div>
                <span className="hidden max-w-30 truncate sm:block">{user.email}</span>
                <ChevronDown
                  className={cn("h-4 w-4 text-muted-foreground transition-transform", userOpen && "rotate-180")}
                />
              </button>

              {userOpen && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
                  <div className="border-b border-border bg-muted/40 px-3 py-2">
                    <p className="truncate text-xs font-medium text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      to="/historico"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition hover:bg-accent"
                    >
                      <History className="h-4 w-4 text-primary" />
                      Minhas previsões
                    </Link>
                    <Link
                      to="/meus-imoveis"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition hover:bg-accent"
                    >
                      <Home className="h-4 w-4 text-primary" />
                      Meus imóveis
                    </Link>
                    <Link
                      to="/anunciar"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground transition hover:bg-accent"
                    >
                      <PlusCircle className="h-4 w-4 text-primary" />
                      Anunciar imóvel
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive transition hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition hover:border-primary/40 hover:shadow-md"
            >
              <LogIn className="h-4 w-4 text-primary" />
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
