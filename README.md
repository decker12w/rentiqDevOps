# RentIQ

Aplicação web para predição de preços de aluguel de imóveis em São Carlos (SP), com modelo de machine learning treinado sobre dados reais coletados via scraper.

## Demo

[Assista ao vídeo explicando como usar a aplicação](https://drive.google.com/file/d/1OpxoHdszFuQLldOafGrZ9jrLgVoTGrbQ/view?usp=sharing)

## Visão Geral

O usuário informa as características do imóvel — tipo (apartamento ou casa), bairro, área, quartos, banheiros e vagas — e recebe uma estimativa de aluguel com faixa de preço (mínimo/máximo) e os fatores que mais influenciaram o resultado.

O modelo preditivo é um **LightGBM** treinado com 1.152 amostras, com R² de 0,70 e MAE de R$ 514.

## Stack

| Camada            | Tecnologia                      |
| ----------------- | ------------------------------- |
| Frontend          | React 19 + TypeScript + Vite    |
| Backend           | FastAPI + Uvicorn (Python 3.12) |
| ML                | LightGBM, scikit-learn, pandas  |
| Banco de dados    | PostgreSQL 16                   |
| Pacotes Python    | uv                              |
| Pacotes Node      | Bun                             |
| Servidor estático | Nginx                           |
| Contêineres       | Docker + Docker Compose         |
| Orquestração      | Kubernetes (Minikube) + Helm    |

## Arquitetura

```
┌─────────────┐     HTTP      ┌──────────────────┐     SQL      ┌──────────────┐
│  frontend   │ ────────────► │     backend      │ ───────────► │      db      │
│  nginx:80   │               │  fastapi:8000    │              │ postgres:5432│
└─────────────┘               └──────────────────┘              └──────────────┘
```

Três contêineres orquestrados via `docker-compose.yml`:

- **`db`** — PostgreSQL 16, persiste bairros e histórico de predições em volume nomeado
- **`backend`** — API REST (FastAPI), carrega o modelo LightGBM serializado em disco
- **`frontend`** — SPA React compilada servida pelo Nginx

## Execução com Kubernetes (Minikube + Helm)

A aplicação também pode ser implantada em um cluster Kubernetes local via [Minikube](https://minikube.sigs.k8s.io/), usando o Helm Chart disponível em [`helm/rentiq`](helm/rentiq).

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) >= 24
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) >= 1.30
- [kubectl](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [Helm](https://helm.sh/docs/intro/install/) >= 3

### Arquitetura no Kubernetes

| Recurso                 | Objeto Kubernetes      | Descrição                                              |
| ------------------------ | ----------------------- | ------------------------------------------------------- |
| `db`                      | Deployment + Service    | PostgreSQL 16, armazenamento efêmero (`emptyDir` — dados resetam a cada restart do pod) |
| `db-secret`               | Secret                  | Usuário/senha/nome do banco                             |
| `backend`                 | Deployment + Service    | API FastAPI, com `initContainer` que aguarda o banco subir; probes usam `GET /health` |
| `backend-secret`          | Secret                  | `DATABASE_URL` e `JWT_SECRET`                            |
| `backend-config`          | ConfigMap                | `ALLOWED_ORIGINS`, `MODEL_PATH`, `STAGE`, `DEBUG`        |
| `frontend`                | Deployment + Service    | SPA React servida pelo Nginx, com proxy reverso de `/api/` para o `backend` |
| `rentiq-ingress`          | Ingress                 | Publica o `frontend` em `http://k8s.local`               |

O deploy inteiro é automatizado por targets do [`Makefile`](Makefile) — não é preciso rodar `helm`/`minikube` manualmente. As duas primeiras opções abaixo usam o Makefile; a terceira mostra os comandos crus, caso queira entender ou depurar o que está por trás.

### Opção 1 — Caminho das pedras (passo a passo manual, sem Makefile)

Útil pra entender o que os targets das opções abaixo fazem por baixo, ou pra depurar quando algo dá errado.

**1. Suba o cluster**

```bash
minikube start --driver=docker
minikube addons enable ingress
```

**2. (Opcional) Builde e publique suas próprias imagens**

As imagens já estão publicadas em `josemaia123/rentiq-backend` e `josemaia123/rentiq-frontend` — pule esse passo se quiser só usar as já disponíveis. Se quiser publicar a sua versão:

```bash
./scripts/k8s-build-push.sh <seu-usuario-dockerhub> latest
```

Ou, sem Docker Hub — builde direto dentro do minikube:

```bash
eval $(minikube docker-env)
docker build -f backend/Dockerfile -t <seu-usuario-dockerhub>/rentiq-backend:latest .
docker build -t <seu-usuario-dockerhub>/rentiq-frontend:latest frontend/
```

**3. Instale o Helm Chart**

O `values.yaml` já aponta pras imagens de `josemaia123`, então instalar sem nenhum `--set` já funciona:

```bash
helm upgrade --install rentiq ./helm/rentiq -n rentiq --create-namespace
```

Se você publicou suas próprias imagens no passo anterior, aponte pra elas:

```bash
helm upgrade --install rentiq ./helm/rentiq -n rentiq --create-namespace \
  --set backend.image.repository=<seu-usuario-dockerhub>/rentiq-backend \
  --set frontend.image.repository=<seu-usuario-dockerhub>/rentiq-frontend \
  --set backend.image.tag=latest \
  --set frontend.image.tag=latest
```

Acompanhe os pods:

```bash
kubectl get pods,svc,ingress -n rentiq
```

**4. Publique o serviço em `k8s.local`**

Em um terminal separado (mantenha em execução):

```bash
sudo minikube tunnel
```

Em outro terminal, adicione o host ao `/etc/hosts` (uma única vez):

```bash
echo "127.0.0.1  k8s.local" | sudo tee -a /etc/hosts
```

**5. Acesse**

| Serviço       | URL              |
| ------------- | ---------------- |
| Interface web | http://k8s.local |

As credenciais de demonstração são as mesmas do Docker Compose (`demo@rentiq.com` / `rentiq123`).

### Opção 2 — Deploy a partir do Docker Hub (recomendado)

As imagens já estão publicadas no Docker Hub (`josemaia123/rentiq-backend` e `josemaia123/rentiq-frontend`), então basta rodar o deploy puxando de lá:

```bash
make k8s-up-pull   # deploy puxando as imagens já publicadas do Docker Hub (pullPolicy=Always)
```

Só preencha `DOCKERHUB_USER=<seu-usuario-dockerhub>` se você quiser buildar e publicar sua própria versão das imagens em vez de usar as já disponíveis:

```bash
make DOCKERHUB_USER=<seu-usuario-dockerhub> TAG=latest k8s-push     # builda, dá push e (se o minikube estiver de pé) já carrega nele
make DOCKERHUB_USER=<seu-usuario-dockerhub> TAG=latest k8s-up-pull  # deploy puxando as suas imagens do Docker Hub
```

Configuração manual única, exige `sudo` (por isso não é automatizada):

```bash
echo "127.0.0.1  k8s.local" | sudo tee -a /etc/hosts
sudo minikube tunnel   # rodar num terminal à parte e deixar em execução
```

Acesse em http://k8s.local. Credenciais de demonstração: `demo@rentiq.com` / `rentiq123`.

### Opção 3 — Build local, sem Docker Hub (iteração rápida)

Sem depender de internet/registry — builda as imagens direto no daemon Docker do minikube:

```bash
make k8s-up
```

Isso faz, em ordem: `minikube start`, ativa o addon `ingress`, builda as imagens de backend e frontend direto no minikube, roda `helm upgrade --install` e espera os três Deployments (`db`, `backend`, `frontend`) ficarem prontos. Precisa da mesma configuração manual (`/etc/hosts` + `minikube tunnel`) acima.

Depois de qualquer mudança no código, rode `make k8s-up` de novo — é idempotente (`helm upgrade --install` só reaplica o que mudou).

### Customizando valores

Todos os parâmetros (réplicas, recursos, credenciais do banco, host do Ingress, timings de probe etc.) estão em [`helm/rentiq/values.yaml`](helm/rentiq/values.yaml) e podem ser sobrescritos via `--set` ou `-f meus-valores.yaml` num `helm upgrade --install` manual, se preferir não usar o Makefile.

### Remover

```bash
make k8s-down     # remove só a aplicação (helm uninstall)
make k8s-clean    # remove a aplicação e para o minikube
minikube delete   # destrói o cluster por completo (opcional)
```

---

## Execução com Docker Compose

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) >= 24
- [Docker Compose](https://docs.docker.com/compose/) >= 2

Nenhuma outra dependência precisa ser instalada no host.

### Passo a Passo

**1. Clone o repositório**

```bash
git clone https://github.com/<usuario>/rentiq.git
cd rentiq
```

**2. Crie o arquivo de variáveis de ambiente do backend**

Crie `backend/.env.docker` com o conteúdo abaixo:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/am
ALLOWED_ORIGINS=["http://localhost"]
MODEL_PATH=models/modelo_aluguel.pkl
STAGE=production
DEBUG=false
JWT_SECRET=troque-por-uma-chave-segura
```

**3. Suba os contêineres**

```bash
docker compose up --build
```

**4. Acesse**

| Serviço       | URL              |
| ------------- | ---------------- |
| Interface web | http://localhost |

> A API (porta 8000) não é exposta diretamente — o Nginx faz o proxy de `/api/` para o backend internamente.

### Credenciais de demonstração

O seed cria automaticamente um usuário para acesso imediato:

| Campo | Valor             |
| ----- | ----------------- |
| Email | `demo@rentiq.com` |
| Senha | `rentiq123`       |

### Parar

```bash
docker compose down          # para os contêineres
docker compose down -v       # para e remove o volume do banco
```

---

## Execução Local (sem Docker)

### Pré-requisitos

Instale as seguintes dependências antes de prosseguir:

| Dependência | Versão mínima | Download                                                |
| ----------- | ------------- | ------------------------------------------------------- |
| Python      | 3.12          | https://www.python.org/downloads/                       |
| uv          | qualquer      | https://docs.astral.sh/uv/getting-started/installation/ |
| Bun         | 1.x           | https://bun.sh/                                         |
| PostgreSQL  | 16            | https://www.postgresql.org/download/                    |

> **Atenção:** o PostgreSQL precisa estar instalado e em execução na máquina antes de seguir os passos abaixo.

### 1. Clone o repositório

```bash
git clone https://github.com/<usuario>/rentiq.git
cd rentiq
```

### 2. Configure o banco de dados

Ligue o processo do PostgreSQL local

```bash
brew services start postgresql@14 (MacOS)
sudo service postgresql start (Linux)
```

Crie um usuário e senha para o PostgreSQL:

```bash
psql postgres -c "CREATE ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'postgres';"
```

Crie um banco chamado `am` no PostgreSQL local:

```bash
psql postgres -c "CREATE DATABASE am;"
```

### 3. Configure e inicie o backend

Crie `backend/.env` com as credenciais do seu PostgreSQL local:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/am
ALLOWED_ORIGINS=["http://localhost:5173"]
MODEL_PATH=models/modelo_aluguel.pkl
STAGE=development
DEBUG=true
JWT_SECRET=dev-secret-qualquer
```

Instale as dependências e crie as tabelas:

```bash
uv sync
make db       # cria as tabelas no banco
make seed     # popula os bairros e cria o usuário demo (demo@rentiq.com / rentiq123)
```

Inicie a API em modo de desenvolvimento (com hot-reload):

```bash
make api-dev
```

A API estará disponível em http://localhost:8000.

### 4. Configure e inicie o frontend

```bash
cd frontend
bun install
bun run dev
```

O frontend estará disponível em http://localhost:8080.

## Estrutura do Repositório

```
rentiq/
├── backend/
│   ├── app/
│   │   ├── models/        # Entidades SQLModel
│   │   ├── routes/        # Endpoints FastAPI
│   │   └── services/      # Lógica de predição
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/
│   ├── src/               # Componentes React/TypeScript
│   ├── Dockerfile
│   └── nginx.conf
├── models/                # Modelo LightGBM serializado + métricas
├── helm/
│   └── rentiq/             # Helm Chart (Deployments, Services, Secrets, ConfigMap, Ingress)
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── db/
│           ├── backend/
│           ├── frontend/
│           └── ingress.yaml
├── scripts/
│   └── k8s-build-push.sh  # Build + push das imagens para o Docker Hub + minikube image load
├── legacy/                 # Pipeline de ML/scraping (fora do escopo de implantação)
│   ├── pre_processing/
│   ├── scrapper/
│   └── data/
└── docker-compose.yml
```

## API — Endpoints Principais

| Método | Rota                 | Auth | Descrição                              |
| ------ | -------------------- | ---- | -------------------------------------- |
| `GET`  | `/health`             | —    | Health check (usado pelos probes do Kubernetes) |
| `GET`  | `/api/neighborhoods` | —    | Lista bairros disponíveis              |
| `GET`  | `/api/model/metrics` | —    | Métricas do modelo (R², MAE)           |
| `POST` | `/api/predictions`   | —    | Gera predição de preço                 |
| `GET`  | `/api/predictions`   | JWT  | Histórico de predições do usuário      |
| `POST` | `/api/auth/register` | —    | Cadastro de usuário (retorna JWT)      |
| `POST` | `/api/auth/login`    | —    | Login de usuário (retorna JWT)         |
| `GET`  | `/api/listings`      | JWT  | Lista imóveis cadastrados pelo usuário |
| `POST` | `/api/listings`      | JWT  | Cadastra imóvel e retorna estimativa   |

### Exemplo de requisição

```bash
curl -X POST http://localhost:8000/api/predictions \
  -H "Content-Type: application/json" \
  -d '{
    "type": "apartment",
    "neighborhood_id": "<id>",
    "area": 65.0,
    "bedrooms": 2,
    "bathrooms": 1,
    "parking": 1
  }'
```

```json
{
  "price": 1450.0,
  "min": 1200.0,
  "max": 1700.0,
  "margin_pct": 0.17,
  "factors": [
    { "label": "Área útil", "value": 65.0, "weight": 0.41 },
    { "label": "Bairro", "value": 0.0, "weight": 0.28 }
  ]
}
```
