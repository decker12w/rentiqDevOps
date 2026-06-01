import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { api, type ListingItem, UnauthorizedError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  Home,
  BedDouble,
  Bath,
  Car,
  Ruler,
  PlusCircle,
  AlertCircle,
  InboxIcon,
} from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  apartment: "Apartamento",
  house: "Casa",
  studio: "Studio/Kitnet",
};

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function MeusImoveis() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.myListings()
      .then(setItems)
      .catch((err) => {
        if (err instanceof UnauthorizedError) {
          logout();
          navigate("/login");
        } else {
          setError(true);
        }
      })
      .finally(() => setLoading(false));
  }, [logout, navigate]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div
            className="absolute -top-40 left-1/2 -z-10 h-96 w-[800px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--gradient-primary)" }}
          />
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <Home className="h-3 w-3" />
                  Meus imóveis
                </span>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                  Imóveis{" "}
                  <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                    cadastrados
                  </span>
                </h1>
              </div>
              <Link
                to="/anunciar"
                className="hidden sm:inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90"
                style={{ background: "var(--gradient-primary)" }}
              >
                <PlusCircle className="h-4 w-4" />
                Anunciar imóvel
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-muted" />
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Não foi possível carregar seus imóveis.
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
              <InboxIcon className="h-10 w-10 opacity-30" />
              <p className="text-base font-medium">Nenhum imóvel cadastrado ainda</p>
              <p className="text-sm">Anuncie o seu imóvel e veja como o preço se compara ao mercado.</p>
              <Link
                to="/anunciar"
                className="mt-2 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                <PlusCircle className="h-4 w-4" />
                Anunciar imóvel
              </Link>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {TYPE_LABEL[item.type] ?? item.type}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{item.neighborhood}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {item.useful_area && (
                        <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{item.useful_area} m²</span>
                      )}
                      {item.bedrooms != null && (
                        <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" />{item.bedrooms} quarto{item.bedrooms !== 1 ? "s" : ""}</span>
                      )}
                      {item.bathrooms != null && (
                        <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{item.bathrooms} banheiro{item.bathrooms !== 1 ? "s" : ""}</span>
                      )}
                      {item.parking != null && (
                        <span className="flex items-center gap-1"><Car className="h-3 w-3" />{item.parking} vaga{item.parking !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {item.rent_price != null ? (
                      <p
                        className="text-xl font-extrabold bg-clip-text text-transparent"
                        style={{ backgroundImage: "var(--gradient-primary)" }}
                      >
                        {formatPrice(item.rent_price)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Preço não informado</p>
                    )}
                    <p className="text-xs text-muted-foreground">por mês</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
