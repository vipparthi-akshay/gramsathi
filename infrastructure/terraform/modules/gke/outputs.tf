output "cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.primary.name
}

output "endpoint" {
  description = "GKE cluster endpoint"
  value       = google_container_cluster.primary.endpoint
}

output "ca_certificate" {
  description = "GKE cluster CA certificate"
  value       = google_container_cluster.primary.master_auth[0].cluster_ca_certificate
  sensitive   = true
}

output "service_account" {
  description = "GKE node service account email"
  value       = google_service_account.cluster_node_sa.email
}

output "cluster_sa_email" {
  description = "GKE cluster workload identity service account"
  value       = "${var.project_id}.svc.id.goog"
}

output "node_pool_names" {
  description = "Names of created node pools"
  value       = [for np in google_container_node_pool.node_pools : np.name]
}
