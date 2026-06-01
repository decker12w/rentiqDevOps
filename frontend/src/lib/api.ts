const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export class UnauthorizedError extends Error {
  constructor() {
    super("Sessão expirada");
  }
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem("rentiq_auth");
    return raw ? JSON.parse(raw).token : null;
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function get<T>(path: string, auth = false): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: auth ? authHeaders() : {},
  });
  if (res.status === 401) throw new UnauthorizedError();
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown, auth = false): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(auth ? authHeaders() : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `POST ${path} → ${res.status}`);
  }
  return res.json();
}

export type Neighborhood = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type ModelMetrics = {
  model: string;
  mae: number;
  r2: number;
  n_samples: number;
};

export type PredictionRequest = {
  type: string;
  neighborhood_id: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
};

export type ImpactFactor = {
  label: string;
  value: number;
  weight: number;
};

export type PredictionResponse = {
  price: number;
  min: number;
  max: number;
  margin_pct: number;
  factors: ImpactFactor[];
};

export type PredictionHistoryItem = {
  id: string;
  type: string;
  neighborhood: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  estimated_price: number;
  price_min: number;
  price_max: number;
  created_at: string;
};

export type TokenResponse = {
  token: string;
  email: string;
};

export type ListingItem = {
  id: string;
  type: string;
  neighborhood: string;
  useful_area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  parking: number | null;
  rent_price: number | null;
};

export type ListingRequest = {
  type: string;
  neighborhood_id: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  rent_price: number;
};

export type ListingResponse = {
  id: string;
  neighborhood: string;
  estimated_price: number;
  price_min: number;
  price_max: number;
  margin_pct: number;
  factors: ImpactFactor[];
};

export const api = {
  neighborhoods: () => get<Neighborhood[]>("/neighborhoods"),
  modelMetrics: () => get<ModelMetrics>("/model/metrics"),
  predict: (body: PredictionRequest) => post<PredictionResponse>("/predictions", body, true),
  myPredictions: () => get<PredictionHistoryItem[]>("/predictions", true),
  register: (email: string, password: string) =>
    post<TokenResponse>("/auth/register", { email, password }),
  login: (email: string, password: string) =>
    post<TokenResponse>("/auth/login", { email, password }),
  myListings: () => get<ListingItem[]>("/listings", true),
  createListing: (body: ListingRequest) =>
    post<ListingResponse>("/listings", body, true),
};
