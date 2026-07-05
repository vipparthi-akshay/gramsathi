variable "name" {
  description = "Base name for Cloud SQL resources"
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

variable "db_version" {
  description = "Cloud SQL database version"
  type        = string
  default     = "POSTGRES_15"
}

variable "tier" {
  description = "Cloud SQL tier"
  type        = string
  default     = "db-custom-4-16384"
}

variable "disk_size" {
  description = "Cloud SQL disk size in GB"
  type        = number
  default     = 100
}

variable "disk_type" {
  description = "Cloud SQL disk type"
  type        = string
  default     = "pd-ssd"
}

variable "backup_retention" {
  description = "Cloud SQL backup retention in days"
  type        = number
  default     = 30
}

variable "high_availability" {
  description = "Enable HA configuration"
  type        = bool
  default     = true
}

variable "network_self_link" {
  description = "VPC network self link"
  type        = string
}

variable "db_password" {
  description = "Database password (empty to auto-generate)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_user" {
  description = "Database application user name"
  type        = string
  default     = "gramsathi_app"
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "gramsathi"
}

variable "authorized_networks" {
  description = "Authorized networks for Cloud SQL"
  type = list(object({
    name = string
    cidr = string
  }))
  default = []
}

variable "read_replicas" {
  description = "Number of read replicas"
  type        = number
  default     = 2
}
