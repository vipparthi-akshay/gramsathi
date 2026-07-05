terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "gramsathi-terraform-state"
    prefix = "terraform/state/prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-south1"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "redis_password" {
  description = "Redis password"
  type        = string
  sensitive   = true
}

locals {
  environment = "prod"
}

module "networking" {
  source = "../../modules/networking"

  environment      = local.environment
  region           = var.region
  project_id       = var.project_id
  vpc_cidr         = "10.20.0.0/16"
  subnet_cidr      = "10.20.1.0/24"
  pods_cidr        = "10.21.0.0/16"
  services_cidr    = "10.22.0.0/20"
}

module "gke" {
  source = "../../modules/gke"

  cluster_name  = "gramsathi-prod"
  region        = var.region
  project_id    = var.project_id
  environment   = local.environment
  network       = module.networking.vpc_self_link
  subnetwork    = module.networking.subnet_self_link

  node_pools = [
    {
      name         = "general-purpose"
      machine_type = "e2-standard-4"
      min_count    = 3
      max_count    = 30
      disk_size_gb = 100
      disk_type    = "pd-ssd"
    },
    {
      name         = "ai-inference"
      machine_type = "e2-standard-8"
      min_count    = 1
      max_count    = 10
      disk_size_gb = 200
      disk_type    = "pd-ssd"
      gpu_count    = 1
      gpu_type     = "nvidia-tesla-t4"
    },
  ]

  master_authorized_cidrs = [
    {
      cidr = "10.0.0.0/8"
      name = "corporate-network"
    },
    {
      cidr = "172.16.0.0/12"
      name = "vpn-network"
    },
  ]
}

module "cloudsql" {
  source = "../../modules/cloudsql"

  name              = "gramsathi"
  environment       = local.environment
  project_id        = var.project_id
  region            = var.region
  tier              = "db-custom-8-32768"
  disk_size         = 200
  disk_type         = "pd-ssd"
  backup_retention  = 30
  high_availability = true
  network_self_link = module.networking.vpc_self_link
  db_password       = var.db_password
  read_replicas     = 2
}

module "redis" {
  source = "../../modules/redis"

  name              = "gramsathi"
  environment       = local.environment
  region            = var.region
  project_id        = var.project_id
  shard_count       = 6
  replicas_per_shard = 3
  node_type         = "REDIS_STANDARD"
  network_self_link = module.networking.vpc_self_link
}

module "storage" {
  source = "../../modules/storage"

  name              = "gramsathi"
  environment       = local.environment
  project_id        = var.project_id
  region            = var.region
  app_service_account = module.gke.service_account
  kms_key_ring      = "gramsathi-prod-keyring"
}
