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
    prefix = "terraform/state"
  }
}

provider "google" {
  project = data.google_project.current.project_id
  region  = data.google_client_config.current.region
}

provider "google-beta" {
  project = data.google_project.current.project_id
  region  = data.google_client_config.current.region
}

data "google_project" "current" {}

data "google_client_config" "current" {}

data "google_compute_network" "vpc" {
  name = var.vpc_name
}

data "google_compute_subnetwork" "subnet" {
  name   = var.subnet_name
  region = var.region
}
