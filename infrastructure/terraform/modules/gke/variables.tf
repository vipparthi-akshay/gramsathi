variable "cluster_name" {
  description = "GKE cluster name"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "network" {
  description = "VPC network self link"
  type        = string
}

variable "subnetwork" {
  description = "Subnet self link"
  type        = string
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "node_pools" {
  description = "Node pool configurations"
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
}

variable "master_authorized_cidrs" {
  description = "Master authorized networks"
  type = list(object({
    cidr = string
    name = string
  }))
  default = []
}
