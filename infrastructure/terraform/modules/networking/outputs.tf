output "vpc_id" {
  description = "VPC network ID"
  value       = google_compute_network.vpc.id
}

output "vpc_name" {
  description = "VPC network name"
  value       = google_compute_network.vpc.name
}

output "vpc_self_link" {
  description = "VPC network self link"
  value       = google_compute_network.vpc.self_link
}

output "subnet_name" {
  description = "Subnet name"
  value       = google_compute_subnetwork.subnet.name
}

output "subnet_self_link" {
  description = "Subnet self link"
  value       = google_compute_subnetwork.subnet.self_link
}

output "subnet_cidr" {
  description = "Subnet CIDR range"
  value       = google_compute_subnetwork.subnet.ip_cidr_range
}

output "pods_secondary_range" {
  description = "GKE pods secondary CIDR range"
  value = {
    range_name    = google_compute_subnetwork.subnet.secondary_ip_range[0].range_name
    ip_cidr_range = google_compute_subnetwork.subnet.secondary_ip_range[0].ip_cidr_range
  }
}

output "services_secondary_range" {
  description = "GKE services secondary CIDR range"
  value = {
    range_name    = google_compute_subnetwork.subnet.secondary_ip_range[1].range_name
    ip_cidr_range = google_compute_subnetwork.subnet.secondary_ip_range[1].ip_cidr_range
  }
}

output "nat_ip_addresses" {
  description = "Cloud NAT IP addresses"
  value       = google_compute_router_nat.nat.nat_ip_allocate_option
}

output "private_service_access_connection" {
  description = "Private Service Access connection"
  value       = google_service_networking_connection.private_service_access.network
}
