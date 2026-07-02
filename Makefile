nb2py:
	uv run jupyter nbconvert --to script pre_processing/notebook.ipynb --stdout

db:
	cd backend && uv run python -c "from app.database import create_db; create_db()"

seed:
	cd backend && uv run python scripts/seed.py

db-seed: db seed

api-dev:
	cd backend && uv run uvicorn app.main:application --reload --host 0.0.0.0 --port 8000

api-prod:
	cd backend && uv run uvicorn app.main:application --host 0.0.0.0 --port 8000

MINIKUBE_PROFILE ?= minikube
RELEASE ?= rentiq
NAMESPACE ?= rentiq
DOCKERHUB_USER ?= josemaia123
TAG ?= latest
BACKEND_IMAGE ?= $(DOCKERHUB_USER)/rentiq-backend
FRONTEND_IMAGE ?= $(DOCKERHUB_USER)/rentiq-frontend

k8s-build:
	eval $$(minikube -p $(MINIKUBE_PROFILE) docker-env) && \
	docker build -f backend/Dockerfile -t $(BACKEND_IMAGE):latest . && \
	docker build -t $(FRONTEND_IMAGE):latest frontend/

k8s-up:
	minikube start --profile=$(MINIKUBE_PROFILE)
	minikube addons enable ingress --profile=$(MINIKUBE_PROFILE)
	$(MAKE) k8s-build
	helm upgrade --install $(RELEASE) helm/rentiq -n $(NAMESPACE) --create-namespace
	kubectl rollout status deployment/db -n $(NAMESPACE) --timeout=120s
	kubectl rollout status deployment/backend -n $(NAMESPACE) --timeout=120s
	kubectl rollout status deployment/frontend -n $(NAMESPACE) --timeout=120s
	@echo ""
	@echo "Setup pronto. Falta só (uma vez, manual):"
	@echo "  1) Adicionar ao /etc/hosts: 127.0.0.1 k8s.local"
	@echo "  2) Rodar em outro terminal:  sudo minikube tunnel --profile=$(MINIKUBE_PROFILE)"
	@echo "Depois abra http://k8s.local no navegador."

k8s-push:
	./scripts/k8s-build-push.sh $(DOCKERHUB_USER) $(TAG)

k8s-up-pull:
	minikube start --profile=$(MINIKUBE_PROFILE)
	minikube addons enable ingress --profile=$(MINIKUBE_PROFILE)
	helm upgrade --install $(RELEASE) helm/rentiq -n $(NAMESPACE) --create-namespace \
		--set backend.image.repository=$(BACKEND_IMAGE) \
		--set backend.image.tag=$(TAG) \
		--set backend.image.pullPolicy=Always \
		--set frontend.image.repository=$(FRONTEND_IMAGE) \
		--set frontend.image.tag=$(TAG) \
		--set frontend.image.pullPolicy=Always
	kubectl rollout status deployment/db -n $(NAMESPACE) --timeout=120s
	kubectl rollout status deployment/backend -n $(NAMESPACE) --timeout=120s
	kubectl rollout status deployment/frontend -n $(NAMESPACE) --timeout=120s
	@echo ""
	@echo "Setup pronto (imagens puxadas do Docker Hub: $(DOCKERHUB_USER)/*:$(TAG)). Falta só (uma vez, manual):"
	@echo "  1) Adicionar ao /etc/hosts: 127.0.0.1 k8s.local"
	@echo "  2) Rodar em outro terminal:  sudo minikube tunnel --profile=$(MINIKUBE_PROFILE)"
	@echo "Depois abra http://k8s.local no navegador."

k8s-down:
	helm uninstall $(RELEASE) -n $(NAMESPACE)

k8s-clean: k8s-down
	minikube stop --profile=$(MINIKUBE_PROFILE)
