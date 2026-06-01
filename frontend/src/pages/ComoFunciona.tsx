import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { api, type ModelMetrics } from "@/lib/api";
import {
  ArrowLeft,
  Brain,
  Database,
  GitMerge,
  BarChart3,
  MapPin,
  Ruler,
  BedDouble,
  Bath,
  Car,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const steps = [
  {
    icon: Database,
    title: "Coleta de dados",
    description:
      "Imóveis reais de São Carlos foram coletados de plataformas públicas de aluguel, totalizando mais de 1.100 listagens com informações de tipo, bairro, área e preço.",
  },
  {
    icon: GitMerge,
    title: "Engenharia de features",
    description:
      "Cada imóvel é transformado em 17 variáveis numéricas: área por quarto, total de cômodos, distâncias até pontos de referência (Centro, UFSCar, USP, Rodoviária) e codificação do bairro.",
  },
  {
    icon: Brain,
    title: "Treinamento do modelo",
    description:
      "Um modelo LightGBM foi treinado com os dados processados. O LightGBM é uma implementação de Gradient Boosting eficiente e precisa, muito utilizada em problemas de regressão.",
  },
  {
    icon: BarChart3,
    title: "Previsão e explicação",
    description:
      "Para um novo imóvel, o modelo gera o preço estimado e extrai os fatores de maior importância, mostrando quanto cada característica contribuiu para o valor final.",
  },
];

const features = [
  { icon: Ruler, label: "Área útil (m²)" },
  { icon: BedDouble, label: "Quartos" },
  { icon: Bath, label: "Banheiros" },
  { icon: Car, label: "Vagas de garagem" },
  { icon: MapPin, label: "Bairro" },
  { icon: TrendingUp, label: "Distância ao Centro" },
  { icon: TrendingUp, label: "Distância à UFSCar" },
  { icon: TrendingUp, label: "Distância à USP" },
  { icon: TrendingUp, label: "Distância à Rodoviária" },
  { icon: Ruler, label: "Área por quarto" },
  { icon: BedDouble, label: "Total de cômodos" },
];

function MetricCard({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <p className="text-4xl font-extrabold tracking-tight" style={{ backgroundImage: "var(--gradient-primary)", backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>
        {value}
      </p>
      <p className="mt-2 text-base font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sublabel}</p>
    </div>
  );
}

export function ComoFunciona() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.modelMetrics().then(setMetrics).catch(() => setError(true));
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero)" }} />
          <div
            className="absolute -top-40 left-1/2 -z-10 h-96 w-[800px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--gradient-primary)" }}
          />
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>

            <div className="mt-6 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                <Brain className="h-3 w-3" />
                Transparência do modelo
              </span>
              <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                Como funciona o{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  modelo de previsão
                </span>
              </h1>
              <p className="mt-4 text-base text-muted-foreground">
                O RentIQ usa Machine Learning para estimar aluguéis com base em dados reais do mercado imobiliário de São Carlos – SP. Entenda como cada etapa funciona.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">

          {/* Métricas */}
          <section>
            <h2 className="text-xl font-bold text-foreground">Desempenho do modelo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Métricas calculadas sobre o conjunto de dados real de São Carlos.
            </p>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Não foi possível carregar as métricas. Verifique se o servidor está ativo.
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {metrics ? (
                <>
                  <MetricCard
                    label="R² (Coeficiente de determinação)"
                    value={`${(metrics.r2 * 100).toFixed(1)}%`}
                    sublabel="Proporção da variação do aluguel explicada pelo modelo"
                  />
                  <MetricCard
                    label="MAE (Erro médio absoluto)"
                    value={`R$ ${metrics.mae.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`}
                    sublabel="Diferença média entre o valor previsto e o real"
                  />
                  <MetricCard
                    label="Amostras de treinamento"
                    value={metrics.n_samples.toLocaleString("pt-BR")}
                    sublabel={`Imóveis reais de São Carlos usados no treinamento (${metrics.model})`}
                  />
                </>
              ) : !error ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-muted" />
                ))
              ) : null}
            </div>
          </section>

          {/* Pipeline */}
          <section>
            <h2 className="text-xl font-bold text-foreground">Etapas do pipeline</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Da coleta dos dados à geração da previsão.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="relative rounded-2xl border border-border bg-card p-6"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <span className="absolute right-4 top-4 text-4xl font-black text-muted/20 select-none">
                    {i + 1}
                  </span>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-md"
                    style={{ background: "var(--gradient-primary)" }}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Features */}
          <section>
            <h2 className="text-xl font-bold text-foreground">Variáveis utilizadas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Cada imóvel é representado por estas características ao ser processado pelo modelo.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
                >
                  <f.icon className="h-3.5 w-3.5 text-primary" />
                  {f.label}
                </div>
              ))}
            </div>
          </section>

          {/* Interpretação */}
          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
            <h2 className="text-xl font-bold text-foreground">Como interpretar o resultado</h2>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3 text-sm text-muted-foreground">
              <div>
                <p className="font-semibold text-foreground">Preço estimado</p>
                <p className="mt-1">Valor central previsto pelo modelo para as características informadas.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Faixa de preço</p>
                <p className="mt-1">Intervalo de confiança baseado no erro médio absoluto (MAE) do modelo.</p>
              </div>
              <div>
                <p className="font-semibold text-foreground">Fatores de impacto</p>
                <p className="mt-1">Os atributos com maior influência no preço, extraídos da importância de features do LightGBM.</p>
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  );
}
