{{- define "rentiq.labels" -}}
app.kubernetes.io/part-of: rentiq
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
{{- end -}}
