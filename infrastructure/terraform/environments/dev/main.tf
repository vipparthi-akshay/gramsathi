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
    prefix = "terraform/state/dev"
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
  environment = "dev"
}

module "networking" {
  source = "../../modules/networking"

  environment = local.environment
  region      = var.region
  project_id  = var.project_id
  vpc_cidr    = "10.0.0.0/16"
  subnet_cidr  = "10.0.1.0/24"
  pods_cidr    = "10.1.0.0/16"
  services_cidr = "10.2.0.0/20"
}

module "gke" {
  source = "../../modules/gke"

  cluster_name  = "gramsathi-dev"
  region        = var.region
  project_id    = var.project_id
  environment   = local.environment
  network       = module.networking.vpc_self_link
  subnetwork    = module.networking.subnet_self_link

  node_pools = [
    {
      name         = "general-purpose"
      machine_type = "e2-standard-4"
      min_count    = 1
      max_count    = 5
      disk_size_gb = 50
      disk_type    = "pd-standard"
    },
    {
      name         = "ai-inference"
      machine_type = "e2-standard-8"
      min_count    = 0
      max_count    = 2
      disk_size_gb = 100
      disk_type    = "pd-standard"
      gpu_count    = 1
      gpu_type     = "nvidia-tesla-t4"
    },
  ]

  master_authorized_cidrs = [
    {
      cidr = "0.0.0.0/0"
      name = "dev-access"
    },
  ]
}

module "cloudsql" {
  source = "../../modules/cloudsql"

  name              = "gramsathi"
  environment       = local.environment
  project_id        = var.project_id
  region            = var.region
  tier              = "db-custom-2-8192"
  disk_size         = 50
  disk_type         = "pd-ssd"
  backup_retention  = 7
  high_availability = false
  network_self_link = module.networking.vpc_self_link
  db_password       = var.db_password
  read_replicas     = 0
}

module "redis" {
  source = "../../modules/redis"

  name              = "gramsathi"
  environment       = local.environment
  region            = var.region
  project_id        = var.project_id
  shard_count       = 3
  replicas_per_shard = 1
  node_type         = "REDIS_SHARED_CORE_NANO"
  network_self_link = module.networking.vpc_self_link
}

module "storage" {
  source = "../../modules/storage"

  name              = "gramsathi"
  environment       = local.environment
  project_id        = var.project_id
  region            = var.region
  app_service_account = module.gke.service_account
  kms_key_ring      = "gramsathi-dev-keyring"
}
