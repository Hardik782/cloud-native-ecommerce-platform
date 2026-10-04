resource "kubernetes_namespace_v1" "argocd" {
  metadata {
    name = "argocd"
  }
}

resource "kubernetes_namespace_v1" "monitoring" {
  metadata {
    name = "monitoring"
  }
}

resource "helm_release" "argocd" {
  name       = "argocd"
  namespace  = kubernetes_namespace_v1.argocd.metadata[0].name
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  version    = "6.7.0"

  create_namespace = false

  values = [
    yamlencode({
      server = {
        service = {
          type = "ClusterIP"
        }
      }
      configs = {
        params = {
          "server.insecure" = true
        }
      }
      extraObjects = [
        {
          apiVersion = "argoproj.io/v1alpha1"
          kind       = "Application"

          metadata = {
            name      = "ecommerce"
            namespace = "argocd"
          }

          spec = {
            project = "default"

            source = {
              repoURL        = "https://github.com/Hardik782/cloud-native-ecommerce-platform.git"
              targetRevision = "main"
              path           = "gitops"

              kustomize = {
                images = [
                  "ecommerce-auth=${var.ecr_urls["auth"]}",
                  "ecommerce-gateway=${var.ecr_urls["gateway"]}",
                  "ecommerce-orders=${var.ecr_urls["orders"]}",
                  "ecommerce-products=${var.ecr_urls["products"]}",
                  "ecommerce-users=${var.ecr_urls["users"]}",
                  "ecommerce-frontend=${var.ecr_urls["frontend"]}"
                ]
              }
            }

            destination = {
              server    = "https://kubernetes.default.svc"
              namespace = "ecommerce"
            }

            syncPolicy = {
              automated = {
                prune    = true
                selfHeal = true
              }
            }
          }
        }
      ]
    })
  ]
}

resource "helm_release" "monitoring" {
  name       = "kube-prometheus-stack"
  namespace  = kubernetes_namespace_v1.monitoring.metadata[0].name
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  version    = "56.21.0"

  timeout          = 600
  create_namespace = false

  values = [
    yamlencode({
      grafana = {
        service = {
          type = "ClusterIP"
        }
      }
      prometheus = {
        service = {
          type = "ClusterIP"
        }
      }
      alertmanager = {
        service = {
          type = "ClusterIP"
        }
      }
    })
  ]

  depends_on = [
    kubernetes_namespace_v1.monitoring
  ]
}