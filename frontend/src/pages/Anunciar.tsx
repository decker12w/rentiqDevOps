import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { api, type Neighborhood, type ListingResponse } from "@/lib/api";
import {
  ArrowLeft,
  PlusCircle,
  CheckCircle2,
  BedDouble,
  Bath,
  Car,
  Ruler,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

const TYPES = [
  { value: "apartment", label: "Apartamento" },
  { value: "house", label: "Casa" },
  { value: "studio", label: "Studio / Kitnet" },
];

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:border-primary/40 disabled:opacity-40"
        >
          –
        </button>
        <span className="w-8 text-center text-sm font-semibold text-foreground">{value}</span>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition hover:border-primary/40 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function Anunciar() {
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [type, setType] = useState("apartment");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [area, setArea] = useState(60);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [parking, setParking] = useState(1);
  const [rentPrice, setRentPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ListingResponse | null>(null);

  useEffect(() => {
    api.neighborhoods().then((data) => {
      setNeighborhoods(data);
      if (data.length > 0) setNeighborhoodId(data[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const price = parseFloat(rentPrice.replace(",", "."));
    if (isNaN(price) || price <= 0) {
      setError("Informe um preço de aluguel válido");
      return;
    }
    setLoading(true);
    try {
      const res = await api.createListing({
        type,
        neighborhood_id: neighborhoodId,
        area,
        bedrooms,
        bathrooms,
        parking,
        rent_price: price,
      });
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar imóvel");
    } finally {
      setLoading(false);
    }
  };

  const userPrice = parseFloat(rentPrice.replace(",", ".")) || 0;
  const diff = userPrice && result ? userPrice - result.estimated_price : 0;
  const diffPct = result && result.estimated_price ? (diff / result.estimated_price) * 100 : 0;

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
            <div className="mt-6 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <PlusCircle className="h-3 w-3" />
                Anunciar imóvel
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                Cadastre o{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                  seu imóvel
                </span>
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                Preencha os dados e veja como o preço que você pratica se compara à estimativa do modelo.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Formulário */}
            <div className="rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <h2 className="text-base font-semibold text-foreground">Dados do imóvel</h2>
              <form onSubmit={handleSubmit} className="mt-5 space-y-5">

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Bairro</label>
                  <select
                    value={neighborhoodId}
                    onChange={(e) => setNeighborhoodId(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  >
                    {neighborhoods.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">
                    <Ruler className="inline h-3.5 w-3.5 text-primary mr-1" />
                    Área útil (m²)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={area}
                    onChange={(e) => setArea(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Stepper label="Quartos" value={bedrooms} min={0} max={8} onChange={setBedrooms} />
                  <Stepper label="Banheiros" value={bathrooms} min={1} max={6} onChange={setBathrooms} />
                  <Stepper label="Vagas" value={parking} min={0} max={6} onChange={setParking} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Preço do aluguel (R$)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={rentPrice}
                    onChange={(e) => setRentPrice(e.target.value)}
                    placeholder="ex: 1800"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !neighborhoodId}
                  className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <PlusCircle className="h-4 w-4" />
                  {loading ? "Cadastrando..." : "Cadastrar imóvel"}
                </button>
              </form>
            </div>

            {/* Resultado */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              {!result ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center text-muted-foreground">
                  <PlusCircle className="h-10 w-10 opacity-20" />
                  <p className="text-sm">Preencha os dados e cadastre o imóvel para ver a comparação com o modelo.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Sucesso */}
                  <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm font-medium text-green-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Imóvel cadastrado com sucesso em {result.neighborhood}!
                  </div>

                  {/* Comparação */}
                  <div className="rounded-2xl border border-border bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
                    <h3 className="text-sm font-semibold text-foreground">Comparação com o modelo</h3>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-border bg-background p-4 text-center">
                        <p className="text-xs text-muted-foreground">Seu preço</p>
                        <p className="mt-1 text-xl font-extrabold text-foreground">{formatPrice(userPrice)}</p>
                      </div>
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                        <p className="text-xs text-muted-foreground">Estimativa do modelo</p>
                        <p
                          className="mt-1 text-xl font-extrabold bg-clip-text text-transparent"
                          style={{ backgroundImage: "var(--gradient-primary)" }}
                        >
                          {formatPrice(result.estimated_price)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
                      {Math.abs(diffPct) < 5 ? (
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      ) : diff > 0 ? (
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      )}
                      <p className="text-sm">
                        {Math.abs(diffPct) < 5 ? (
                          <span className="text-muted-foreground">Seu preço está <strong>alinhado</strong> com o mercado</span>
                        ) : diff > 0 ? (
                          <span className="text-orange-600">Seu preço está <strong>{Math.abs(diffPct).toFixed(0)}% acima</strong> da estimativa</span>
                        ) : (
                          <span className="text-green-600">Seu preço está <strong>{Math.abs(diffPct).toFixed(0)}% abaixo</strong> da estimativa</span>
                        )}
                      </p>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Faixa estimada pelo modelo</p>
                      <p className="text-sm text-foreground">
                        {formatPrice(result.price_min)} – {formatPrice(result.price_max)}
                      </p>
                    </div>

                    {result.factors.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Fatores de impacto</p>
                        {result.factors.map((f, i) => (
                          <div key={i} className="flex items-center justify-between gap-2">
                            <span className="text-xs text-foreground">{f.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${f.weight}%`, background: "var(--gradient-primary)" }}
                                />
                              </div>
                              <span className="w-10 text-right text-xs text-muted-foreground">{f.weight.toFixed(0)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
