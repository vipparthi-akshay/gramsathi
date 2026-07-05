variable "name" {
  description = "Base name for storage resources"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "app_service_account" {
  description = "Application service account email"
  type        = string
}

variable "kms_key_ring" {
  description = "KMS key ring name"
  type        = string
  default     = "gramsathi-keyring"
}

variable "default_labels" {
  description = "Default labels for all resources"
  type        = map(string)
  default = {
    managed_by = "terraform"
    project    = "gramsathi"
  }
}
