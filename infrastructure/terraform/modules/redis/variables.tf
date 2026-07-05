variable "name" {
  description = "Base name for Redis resources"
  type        = string
}

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

variable "shard_count" {
  description = "Number of shards"
  type        = number
  default     = 6
}

variable "replicas_per_shard" {
  description = "Number of replicas per shard"
  type        = number
  default     = 3
}

variable "node_type" {
  description = "Redis cluster node type"
  type        = string
  default     = "REDIS_STANDARD_SMALL"
}

variable "redis_configs" {
  description = "Redis configuration parameters"
  type        = map(string)
  default = {
    "maxmemory-policy"     = "allkeys-lru"
    "timeout"              = "300"
    "tcp-keepalive"        = "300"
    "maxclients"           = "10000"
    "lfu-log-factor"       = "10"
    "lfu-decay-time"       = "1"
  }
}

variable "persistence_enabled" {
  description = "Enable Redis persistence"
  type        = bool
  default     = true
}

variable "psc_connections" {
  description = "PSC connection configurations"
  type = list(object({
    network = string
  }))
  default = []
}

variable "psc_network" {
  description = "Network for PSC connection"
  type        = string
  default     = ""
}

variable "psc_subnet" {
  description = "Subnet for PSC connection"
  type        = string
  default     = ""
}

variable "psc_ip_address" {
  description = "IP address for PSC forwarding rule"
  type        = string
  default     = ""
}

variable "auto_create_psc_connections" {
  description = "Auto-create PSC connections"
  type        = bool
  default     = false
}

variable "network_self_link" {
  description = "VPC network self link"
  type        = string
}

variable "network_dependency" {
  description = "Network dependency for ordering"
  type        = any
  default     = null
}

variable "service_accounts" {
  description = "Service accounts that need Redis access"
  type        = list(string)
  default     = []
}
