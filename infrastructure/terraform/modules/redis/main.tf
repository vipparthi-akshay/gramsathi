resource "google_redis_cluster" "primary" {
  provider = google-beta

  name                           = "${var.name}-${var.environment}"
  region                         = var.region
  shard_count                    = var.shard_count
  replica_count                  = var.replicas_per_shard
  node_type                      = var.node_type
  transit_encryption_mode        = "SERVER_AUTHENTICATION"
  authorization_mode             = "AUTH"
  redis_configs                  = var.redis_configs

  replica_persistence {
    mode = var.persistence_enabled ? "RDB" : "DISABLED"
    rdb_config {
      rdb_snapshot_period     = "ONE_HOUR"
      rdb_snapshot_start_time = "2024-01-01T02:00:00Z"
    }
  }

  zone_distribution_config {
    mode = "MULTI_ZONE"
  }

  dynamic "psc_configs" {
    for_each = var.psc_connections
    content {
      network = psc_configs.value.network
    }
  }

  lifecycle {
    ignore_changes = [
      psc_configs,
    ]
  }

  depends_on = [var.network_dependency]

  timeouts {
    create = "60m"
    update = "60m"
    delete = "30m"
  }
}

resource "google_redis_cluster_user_created_connections" "default" {
  count = var.auto_create_psc_connections ? 1 : 0

  provider = google-beta

  name               = "${var.name}-${var.environment}-psc"
  region             = var.region
  cluster            = google_redis_cluster.primary.cluster_id
  psc_connections {
    network                = var.psc_network
    forwarding_rule        = "${var.name}-${var.environment}-fw"
    ip_address             = var.psc_ip_address
    service_attachment     = google_redis_cluster.primary.psc_service_attachment_link
    subnet                = var.psc_subnet
    psc_connection_id     = "create"
  }
}

resource "random_password" "redis_auth" {
  length  = 24
  special = false
}

resource "google_project_iam_member" "redis_accessor" {
  for_each = var.service_accounts
  project  = var.project_id
  role     = "roles/redis.viewer"
  member   = "serviceAccount:${each.value}"
}
