#!/usr/bin/env bash
# Builda as imagens do backend e frontend, publica no Docker Hub
# e (se o Minikube estiver rodando) carrega as imagens nele com `minikube image load`.
#
# Uso: ./scripts/k8s-build-push.sh <usuario-dockerhub> [tag]
set -euo pipefail

DOCKERHUB_USER="${1:-${DOCKERHUB_USER:-}}"
TAG="${2:-latest}"

if [[ -z "${DOCKERHUB_USER}" ]]; then
  echo "Uso: $0 <usuario-dockerhub> [tag]"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BACKEND_IMAGE="docker.io/${DOCKERHUB_USER}/rentiq-backend:${TAG}"
FRONTEND_IMAGE="docker.io/${DOCKERHUB_USER}/rentiq-frontend:${TAG}"

echo "==> Building backend image: ${BACKEND_IMAGE}"
docker build -t "${BACKEND_IMAGE}" -f "${ROOT_DIR}/backend/Dockerfile" "${ROOT_DIR}"

echo "==> Building frontend image: ${FRONTEND_IMAGE}"
docker build -t "${FRONTEND_IMAGE}" -f "${ROOT_DIR}/frontend/Dockerfile" "${ROOT_DIR}/frontend"

echo "==> Publicando imagens no Docker Hub"
docker push "${BACKEND_IMAGE}"
docker push "${FRONTEND_IMAGE}"

if command -v minikube >/dev/null 2>&1 && minikube status >/dev/null 2>&1; then
  echo "==> Carregando imagens no Minikube"
  minikube image load "${BACKEND_IMAGE}"
  minikube image load "${FRONTEND_IMAGE}"
fi

cat <<EOF

Imagens publicadas:
  ${BACKEND_IMAGE}
  ${FRONTEND_IMAGE}

Para implantar com Helm:
  helm upgrade --install rentiq ./helm/rentiq -n rentiq --create-namespace \\
    --set backend.image.repository=${DOCKERHUB_USER}/rentiq-backend \\
    --set frontend.image.repository=${DOCKERHUB_USER}/rentiq-frontend \\
    --set backend.image.tag=${TAG} \\
    --set frontend.image.tag=${TAG}
EOF
