variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "ecr_repo" {
  description = "ECR repository URL"
  type        = string
}

variable "db_password" {
  description = "PostgreSQL password"
  type        = string
  sensitive   = true
}

variable "zillow_api_key" {
  description = "Zillow API key"
  type        = string
  sensitive   = true
}

variable "data_axle_api_key" {
  description = "Data Axle API key"
  type        = string
  sensitive   = true
}
