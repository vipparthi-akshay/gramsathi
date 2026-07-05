variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR range"
  type        = string
}

variable "subnet_cidr" {
  description = "Subnet CIDR range"
  type        = string
}

variable "pods_cidr" {
  description = "GKE pods secondary CIDR range"
  type        = string
}

variable "services_cidr" {
  description = "GKE services secondary CIDR range"
  type        = string
}

variable "project_dependency" {
  description = "Project dependency for ordering"
  type        = any
  default     = null
}
