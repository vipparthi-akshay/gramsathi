output "cluster_id" {
  description = "Redis cluster ID"
  value       = google_redis_cluster.primary.cluster_id
}

output "cluster_name" {
  description = "Redis cluster name"
  value       = google_redis_cluster.primary.name
}

output "region" {
  description = "Redis cluster region"
  value       = google_redis_cluster.primary.region
}

output "shard_count" {
  description = "Number of shards"
  value       = google_redis_cluster.primary.shard_count
}

output "psc_service_attachment_link" {
  description = "PSC service attachment link"
  value       = google_redis_cluster.primary.psc_service_attachment_link
}

output "auth_string" {
  description = "Redis AUTH string"
  value       = random_password.redis_auth.result
  sensitive   = true
}
