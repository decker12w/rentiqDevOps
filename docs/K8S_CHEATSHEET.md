# Colinha: kubectl, helm e minikube

Comandos do dia a dia pra mexer no cluster do rentiq. Namespace e release são sempre `rentiq` (a menos que indicado).

> Atalhos prontos pra maioria disso já existem no [`Makefile`](Makefile) (`make k8s-up`, `make k8s-down` etc). Use os comandos abaixo quando precisar de algo mais específico ou pra debugar.

## minikube

```bash
minikube start --profile=minikube        # sobe o cluster
minikube status --profile=minikube       # ver se tá rodando
minikube stop --profile=minikube         # para o cluster (mantém estado)
minikube delete --profile=minikube       # destrói o cluster por completo

minikube addons enable ingress           # ativa o ingress controller (nginx)
minikube addons list                     # ver addons disponíveis/ativos

sudo minikube tunnel                     # expõe o LoadBalancer/Ingress em 127.0.0.1 (deixar rodando)

eval $(minikube docker-env)              # aponta o docker CLI pro daemon do minikube (builda imagem direto nele)
minikube dashboard                       # abre o dashboard visual do cluster
minikube ip                              # IP do node do minikube
```

## helm

```bash
helm upgrade --install rentiq helm/rentiq -n rentiq --create-namespace   # instala/atualiza o chart
helm upgrade --install rentiq helm/rentiq -n rentiq --set backend.image.tag=v2  # sobrescreve um valor pontual

helm uninstall rentiq -n rentiq          # remove a release inteira

helm list -n rentiq                      # releases instaladas no namespace
helm status rentiq -n rentiq             # status da release (recursos, notas)
helm history rentiq -n rentiq            # histórico de revisões (pra rollback)
helm rollback rentiq <revision> -n rentiq  # volta pra uma revisão anterior

helm template rentiq helm/rentiq         # renderiza os YAMLs localmente, sem aplicar (bom pra debugar)
helm lint helm/rentiq                    # valida o chart (erros de sintaxe, boas práticas)
helm get values rentiq -n rentiq         # valores efetivamente usados na release instalada
```

## kubectl

```bash
kubectl config set-context --current --namespace=rentiq   # evita ter que passar -n rentiq toda hora

# ver recursos
kubectl get pods
kubectl get pods -w                      # observa em tempo real (watch)
kubectl get deployments
kubectl get svc
kubectl get ingress
kubectl get all                          # tudo de uma vez

# investigar
kubectl describe pod <nome>              # eventos, erros de agendamento/imagem, etc
kubectl logs <nome>                      # logs do pod
kubectl logs -f <nome>                   # segue o log em tempo real
kubectl logs -f deployment/backend       # segue o log de um Deployment (pega qualquer pod dele)
kubectl logs <nome> --previous           # logs do container anterior (útil se ele crashou/reiniciou)

# entrar/executar dentro do pod
kubectl exec -it <nome> -- sh
kubectl exec -it deployment/backend -- sh

# rollout / deploy
kubectl rollout status deployment/backend    # espera o deploy ficar pronto
kubectl rollout restart deployment/backend   # força recriar os pods (ex: novo secret/config sem mudar imagem)
kubectl rollout undo deployment/backend      # desfaz o último rollout

# port-forward (acessar sem depender do ingress/tunnel)
kubectl port-forward svc/backend 8000:8000
kubectl port-forward svc/db 5432:5432

# limpeza pontual
kubectl delete pod <nome>                # mata o pod (o Deployment recria automaticamente)
kubectl delete deployment backend        # remove o deployment (cuidado)
```

## Fluxo típico de debug

```bash
kubectl get pods                         # 1. algum pod não tá Running/Ready?
kubectl describe pod <nome>              # 2. ver eventos (ImagePullBackOff, CrashLoopBackOff, etc)
kubectl logs <nome>                      # 3. ver o erro real da aplicação
helm get values rentiq -n rentiq         # 4. confirmar que os values aplicados são os esperados
helm template rentiq helm/rentiq         # 5. conferir se o YAML gerado tá como o esperado
```
