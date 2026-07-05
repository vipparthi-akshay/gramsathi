output "instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.primary.name
}

output "private_ip_address" {
  description = "Private IP address of the primary instance"
  value       = google_sql_database_instance.primary.private_ip_address
}

output "public_ip_address" {
  description = "Public IP address of the primary instance"
  value       = google_sql_database_instance.primary.public_ip_address
}

output "database_name" {
  description = "Database name"
  value       = google_sql_database.database.name
}

output "app_user_name" {
  description = "Application database user name"
  value       = google_sql_user.app_user.name
}

output "connection_name" {
  description = "Cloud SQL connection name"
  value       = google_sql_database_instance.primary.connection_name
}

output "replica_instance_names" {
  description = "Read replica instance names"
  value       = values(google_sql_database_instance.read_replicas)[*].name
}

output "replica_private_ips" {
  description = "Read replica private IP addresses"
  value       = values(google_sql_database_instance.read_replicas)[*].private_ip_address
}

output "ca_certificate" {
  description = "Cloud SQL server CA certificate"
  value       = google_sql_database_instance.primary.server_ca_cert[0].cert
  sensitive   = true
}
