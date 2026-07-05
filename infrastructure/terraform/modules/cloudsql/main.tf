resource "random_password" "db_password" {
  length  = 32
  special = false
}

resource "google_service_account" "cloudsql_sa" {
  account_id   = "${var.name}-sa"
  display_name = "Cloud SQL Service Account - ${var.name}"
}

resource "google_project_iam_member" "cloudsql_sa_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/cloudsql.instanceUser",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
  ])

  project = var.project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloudsql_sa.email}"
}

resource "google_sql_database_instance" "primary" {
  provider = google-beta

  name             = "${var.name}-${var.environment}"
  database_version = var.db_version
  region           = var.region

  settings {
    tier              = var.tier
    disk_size         = var.disk_size
    disk_type         = var.disk_type
    disk_autoresize   = true
    disk_autoresize_limit = 0

    availability_type = var.high_availability ? "REGIONAL" : "ZONAL"

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "02:00"
      transaction_log_retention_days = var.backup_retention
      backup_retention_settings {
        retained_backups = var.backup_retention
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.network_self_link

      dynamic "authorized_networks" {
        for_each = var.authorized_networks
        content {
          name  = authorized_networks.value.name
          value = authorized_networks.value.cidr
        }
      }
    }

    database_flags {
      name  = "max_connections"
      value = "500"
    }
    database_flags {
      name  = "shared_buffers"
      value = "2097152"
    }
    database_flags {
      name  = "effective_cache_size"
      value = "6291456"
    }
    database_flags {
      name  = "maintenance_work_mem"
      value = "2097152"
    }
    database_flags {
      name  = "checkpoint_completion_target"
      value = "0.9"
    }
    database_flags {
      name  = "wal_buffers"
      value = "65536"
    }
    database_flags {
      name  = "default_statistics_target"
      value = "100"
    }
    database_flags {
      name  = "random_page_cost"
      value = "1.1"
    }
    database_flags {
      name  = "effective_io_concurrency"
      value = "200"
    }
    database_flags {
      name  = "work_mem"
      value = "65536"
    }
    database_flags {
      name  = "pg_bouncer.enabled"
      value = "on"
    }
    database_flags {
      name  = "pg_bouncer.default_pool_size"
      value = "50"
    }
    database_flags {
      name  = "pg_bouncer.max_client_conn"
      value = "200"
    }
    database_flags {
      name  = "pg_bouncer.pool_mode"
      value = "transaction"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 4096
      record_application_tags = true
      record_client_address   = true
    }

    maintenance_window {
      day          = 1
      hour         = 3
      update_track = "stable"
    }
  }

  deletion_protection = var.environment == "prod" ? true : false

  timeouts {
    create = "60m"
    update = "60m"
    delete = "60m"
  }
}

resource "google_sql_database" "database" {
  name     = var.database_name
  instance = google_sql_database_instance.primary.name

  collation = "en_US.UTF8"
  charset   = "UTF8"
}

resource "google_sql_user" "app_user" {
  name     = var.db_user
  instance = google_sql_database_instance.primary.name
  password = var.db_password != "" ? var.db_password : random_password.db_password.result
}

resource "google_sql_user" "readonly_user" {
  name     = "${var.db_user}_readonly"
  instance = google_sql_database_instance.primary.name
  password = random_password.db_password.result
  type     = "BUILT_IN"
}

resource "google_sql_database_instance" "read_replicas" {
  for_each = var.read_replicas > 0 ? { for i in range(var.read_replicas) : "replica-${i}" => i } : {}

  provider = google-beta

  name                 = "${var.name}-${var.environment}-replica-${each.value}"
  database_version     = google_sql_database_instance.primary.database_version
  region               = var.region
  master_instance_name = google_sql_database_instance.primary.name

  settings {
    tier              = var.tier
    disk_size         = var.disk_size
    disk_type         = var.disk_type
    disk_autoresize   = true
    disk_autoresize_limit = 0

    availability_type = "ZONAL"

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.network_self_link
    }

    database_flags {
      name  = "max_connections"
      value = "250"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 2048
      record_application_tags = true
      record_client_address   = true
    }
  }

  deletion_protection = false

  timeouts {
    create = "45m"
    update = "45m"
    delete = "30m"
  }
}
