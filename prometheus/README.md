# Prometheus

Prometheus configuration for the fashion e-commerce platform monitoring stack. The `prometheus`
service in [`../docker-compose.yml`](../docker-compose.yml) mounts `prometheus.yml`.

## Scrape configuration (`prometheus.yml`)

| Job | Target | Interval |
| --- | ------ | -------- |
| `prometheus` | `localhost:9090` | 30s (global) |
| `gateway` | `fashion-ecommerce-gateway:8000/metrics` | 15s |
| `auth` | `fashion-ecommerce-auth:8000/metrics` | 15s |
| `products` | `fashion-ecommerce-products:8000/metrics` | 15s |
| `orders` | `fashion-ecommerce-orders:8000/metrics` | 15s |
| `users` | `fashion-ecommerce-users:8000/metrics` | 15s |
| `cadvisor` | `cadvisor:8080/metrics` | 15s |

```yaml
global:
  scrape_interval: 30s
  evaluation_interval: 30s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'gateway'
    metrics_path: /metrics
    scrape_interval: 15s
    static_configs:
      - targets: ['fashion-ecommerce-gateway:8000']
  # ... auth / products / orders / users identical

  - job_name: 'cadvisor'
    scrape_interval: 15s
    static_configs:
      - targets: ['cadvisor:8080']
    metric_relabel_configs:
      - source_labels: [container_label_com_docker_compose_service]   # container = compose service
        target_label: container
```

### Labels

Container series carry a `container` label mapped from Docker's own compose-service label
(`container_label_com_docker_compose_service`), so the dashboard's container panels group by the
service name (`auth`, `frontend`, `gateway`, `orders`, `postgres`, `products`, `users`). The app jobs
carry no extra labels; the dashboard's panels and its `$service` dropdown
(`label_values(up{job=~"gateway|auth|products|orders|users"}, job)`) match on `job`.

## Metrics exported by each service

Every backend service exposes `/metrics` (shared middleware in `app/core/metrics.py`):

| Metric                          | Type      | Labels                                          |
| ------------------------------- | --------- | ----------------------------------------------- |
| `http_requests_total`           | Counter   | `method`, `endpoint`, `status_code`, `service`  |
| `http_request_duration_seconds` | Histogram | `method`, `endpoint`, `service`                 |
| `http_requests_in_progress`     | Gauge     | `service`                                       |
| `service_info`                  | Gauge     | `service_name`, `version`                       |
| `process_*`                     | Gauge / Counter | RSS, virtual memory, CPU seconds of the process |

Container CPU/memory come from the `cadvisor` service (`container_*` metrics). Container restart counts are not exposed as a standard Prometheus metric by Docker itself. Unlike Kubernetes, where restart counts are commonly available through kube-state-metrics, this dashboard does not include a restart-count panel, resulting in 11 panels instead of 12.

## Useful queries

```promql
# All services up?
up{job=~"gateway|auth|products|orders|users"}

# Request rate per service (last 5m)
sum by (job) (rate(http_requests_total[5m]))

# p95 latency per service
histogram_quantile(0.95, sum by (le, service) (rate(http_request_duration_seconds_bucket[5m])))

# 5xx error rate per service
sum by (service) (rate(http_requests_total{status_code=~"5.."}[5m]))

# Resident memory of each service process
process_resident_memory_bytes{job=~"gateway|auth|products|orders|users"}

# CPU used by each container
sum by (container) (rate(container_cpu_usage_seconds_total{container=~"gateway|auth|products|orders|users|frontend|postgres"}[5m]))
```

## Access

- `http://localhost:9090` - targets page `http://localhost:9090/targets`, query UI `http://localhost:9090/graph`
- Retention: 10 days (`--storage.tsdb.retention.time=10d`)

## Verify

```bash
curl -s http://localhost:9090/-/healthy                                      # "Prometheus Server is Healthy."
curl -s http://localhost:9090/api/v1/targets | grep -o '"job":"[a-z]*"'     # 7 jobs, all up
curl -sG http://localhost:9090/api/v1/query --data-urlencode 'query=up{job=~"gateway|auth|products|orders|users"}'  # 5 series
```

## Related

- [`../grafana/`](../grafana/README.md) - dashboard and datasource provisioning.
- [`../docker-compose.yml`](../docker-compose.yml) - the `prometheus`, `cadvisor` and `grafana` services.
