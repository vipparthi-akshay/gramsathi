output "documents_bucket_name" {
  description = "Documents bucket name"
  value       = google_storage_bucket.documents.name
}

output "models_bucket_name" {
  description = "Models bucket name"
  value       = google_storage_bucket.models.name
}

output "backups_bucket_name" {
  description = "Backups bucket name"
  value       = google_storage_bucket.backups.name
}

output "kms_key_id" {
  description = "KMS crypto key ID"
  value       = google_kms_crypto_key.bucket_key.id
}

output "documents_bucket_url" {
  description = "Documents bucket gs:// URL"
  value       = "gs://${google_storage_bucket.documents.name}"
}

output "models_bucket_url" {
  description = "Models bucket gs:// URL"
  value       = "gs://${google_storage_bucket.models.name}"
}

output "backups_bucket_url" {
  description = "Backups bucket gs:// URL"
  value       = "gs://${google_storage_bucket.backups.name}"
}
