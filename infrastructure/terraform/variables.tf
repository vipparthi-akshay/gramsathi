variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-south1"
}

variable "environment" {
  description = "Deployment environment (dev/staging/prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "db_password" {
  description = "Cloud SQL database password"
  type        = string
  sensitive   = true
}

variable "redis_password" {
  description = "Redis AUTH password"
  type        = string
  sensitive   = true
}

variable "allowed_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["https://gramsathi.ai"]
}

variable "vpc_name" {
  description = "Existing VPC network name"
  type        = string
  default     = ""
}

variable "subnet_name" {
  description = "Existing subnet name"
  type        = string
  default     = ""
}

variable "node_pools" {
  description = "GKE node pool configurations"
  type = list(object({
    name         = string
    machine_type = string
    min_count    = number
    max_count    = number
    disk_size_gb = number
    disk_type    = string
    gpu_count    = optional(number, 0)
    gpu_type     = optional(string, "")
    preemptible  = optional(bool, false)
  }))
  default = [
    {
      name         = "general-purpose"
      machine_type = "e2-standard-4"
      min_count    = 1
      max_count    = 10
      disk_size_gb = 100
      disk_type    = "pd-standard"
      preemptible  = false
    }
  ]
}

variable "db_tier" {
  description = "Cloud SQL tier"
  type        = string
  default     = "db-custom-4-16384"
}

variable "db_disk_size" {
  description = "Cloud SQL disk size in GB"
  type        = number
  default     = 100
}

variable "db_disk_type" {
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
  description = "Enable high availability for Cloud SQL"
  type        = bool
  default     = true
}

variable "redis_memory_size_gb" {
  description = "Redis instance memory size in GB"
  type        = number
  default     = 10
}

variable "k8s_namespace" {
  description = "Kubernetes namespace"
  type        = string
  default     = "gramsathi"
}
