# Grafana

Grafana provisioning for the fashion e-commerce platform - dashboards on top of the `prometheus`
service in [`../docker-compose.yml`](../docker-compose.yml).

```
grafana/
├── dashboards/
│   └── ecommerce-microservices.json      # the "Ecommerce Microservices" dashboard
└── provisioning/
    ├── dashboards/
    │   └── provider.yaml                 # loads every JSON in /tmp/dashboards
    └── datasources/
        └── prometheus.yml                # the Prometheus datasource (uid: prometheus)
```

## Datasource (`provisioning/datasources/prometheus.yml`)

```yaml
apiVersion: 1
datasources:
  - name: Prometheus
    uid: prometheus          # must match the dashboard JSON + its $service variable
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
```

The `uid` is not cosmetic: every panel in `ecommerce-microservices.json` and its `$service` template
variable reference `{"type": "prometheus", "uid": "prometheus"}`. Without it, panels fail with
*datasource not found*.

## Dashboard (`provisioning/dashboards/provider.yaml`)

Loads every JSON file from `/tmp/dashboards`, where `grafana/dashboards/` is mounted:

```yaml
providers:
  - name: 'ecommerce-dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    allowUiUpdates: false
    updateIntervalSeconds: 30
    options:
      path: /tmp/dashboards
```

The dashboard keeps the uid `ecommerce-microservices`, refresh `5s` and the default range `now-15m`,
with a `$service` variable (`label_values(up{job=~"gateway|auth|products|orders|users"}, job)` ->
`auth, gateway, orders, products, users`).

### Where each panel gets its data

| Panel | Metric source |
| ----- | ------------- |
| Request Rate / Active Requests / Error Rate | `http_requests_total`, `http_requests_in_progress` (from each service) |
| Response Time (p95/p99) | `http_request_duration_seconds_bucket` |
| Request Rate by Service / 4xx-5xx | `http_requests_total{job=~"gateway\|auth\|products\|orders\|users"}` |
| Python Process Memory / CPU | `process_resident_memory_bytes`, `process_virtual_memory_bytes`, `process_cpu_seconds_total` |
| Container CPU / Container Memory | `container_*` metrics from the **cadvisor** service, grouped by `container` (the compose service) - app plus `frontend` and `postgres` |
| Service Health (UP/DOWN) | `up{job=~"gateway\|auth\|products\|orders\|users"}` |

The Compose dashboard ships the 11 panels above: every one is driven by metrics this stack publishes
itself (services, cadvisor). The Kubernetes copy carries one extra panel for comparison -
"Pod Restart Count" from kube-state-metrics - which has no Docker equivalent and is therefore
not replicated here.

## Access

- URL: `http://localhost:8080` - direct dashboard link:
  `http://localhost:8080/d/ecommerce-microservices/ecommerce-microservices`
- Login: **admin / admin** (`GF_SECURITY_ADMIN_USER` / `GF_SECURITY_ADMIN_PASSWORD`; sign-up disabled).
- Grafana starts only after Prometheus is healthy (`depends_on: prometheus: condition: service_healthy`).
  On the very first start it downloads its bundled apps, so allow ~1-2 minutes before the UI answers.




## Known limitations

- The labels the dashboard groups by come from Docker's own labels: `container` = the compose service
  (`auth`, `frontend`, `gateway`, `orders`, `postgres`, `products`, `users`) taken from Docker's
  compose-service label; only this stack's services are matched, monitoring containers stay out.
- No Alertmanager and no host/node exporters; the dashboard does not query their metrics.
- `instance` on the app jobs is the target address (`fashion-ecommerce-auth:8000`); the dashboard never
  queries `instance`.

