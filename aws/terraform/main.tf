terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC
resource "aws_vpc" "baldwin_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "baldwin-vpc"
  }
}

# Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.baldwin_vpc.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "baldwin-public-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.baldwin_vpc.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "baldwin-private-${count.index + 1}"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Internet Gateway
resource "aws_internet_gateway" "baldwin_igw" {
  vpc_id = aws_vpc.baldwin_vpc.id

  tags = {
    Name = "baldwin-igw"
  }
}

# RDS PostgreSQL
resource "aws_db_subnet_group" "baldwin_db" {
  name       = "baldwin-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "Baldwin DB Subnet Group"
  }
}

resource "aws_db_instance" "baldwin_postgres" {
  identifier           = "baldwin-postgres"
  engine              = "postgres"
  engine_version      = "15.4"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  storage_type        = "gp2"

  db_name  = "baldwin_leads"
  username = "baldwin"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.baldwin_db.name
  vpc_security_group_ids = [aws_security_group.baldwin_db.id]

  backup_retention_period = 7
  skip_final_snapshot    = true

  tags = {
    Name = "Baldwin PostgreSQL"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "baldwin_cluster" {
  name = "baldwin-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "baldwin_task" {
  family                   = "baldwin-leads-module"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn           = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "${var.ecr_repo}/baldwin-backend:latest"
      essential = true
      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "DB_HOST", value = aws_db_instance.baldwin_postgres.address },
        { name = "DB_PORT", value = "5432" },
        { name = "DB_NAME", value = "baldwin_leads" },
        { name = "DB_USER", value = "baldwin" },
        { name = "ENRICHMENT_SERVICE_URL", value = "http://localhost:8000" }
      ]
      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = aws_secretsmanager_secret.db_password.arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.backend_logs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    },
    {
      name  = "enrichment"
      image = "${var.ecr_repo}/baldwin-enrichment:latest"
      essential = true
      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "DATABASE_URL", value = "postgresql://baldwin:${var.db_password}@${aws_db_instance.baldwin_postgres.address}:5432/baldwin_leads" }
      ]
      secrets = [
        {
          name      = "ZILLOW_API_KEY"
          valueFrom = aws_secretsmanager_secret.zillow_api_key.arn
        },
        {
          name      = "DATA_AXLE_API_KEY"
          valueFrom = aws_secretsmanager_secret.data_axle_api_key.arn
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.enrichment_logs.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
}

# ECS Service
resource "aws_ecs_service" "baldwin_service" {
  name            = "baldwin-leads-service"
  cluster         = aws_ecs_cluster.baldwin_cluster.id
  task_definition = aws_ecs_task_definition.baldwin_task.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.baldwin_ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.baldwin_backend.arn
    container_name   = "backend"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.baldwin_http]
}

# Application Load Balancer
resource "aws_lb" "baldwin_alb" {
  name               = "baldwin-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.baldwin_alb.id]
  subnets           = aws_subnet.public[*].id

  tags = {
    Name = "Baldwin ALB"
  }
}

resource "aws_lb_target_group" "baldwin_backend" {
  name     = "baldwin-backend-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.baldwin_vpc.id
  target_type = "ip"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 10
  }
}

resource "aws_lb_listener" "baldwin_http" {
  load_balancer_arn = aws_lb.baldwin_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.baldwin_backend.arn
  }
}

# Security Groups
resource "aws_security_group" "baldwin_alb" {
  name_prefix = "baldwin-alb-"
  vpc_id      = aws_vpc.baldwin_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "baldwin_ecs" {
  name_prefix = "baldwin-ecs-"
  vpc_id      = aws_vpc.baldwin_vpc.id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.baldwin_alb.id]
  }

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.baldwin_alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "baldwin_db" {
  name_prefix = "baldwin-db-"
  vpc_id      = aws_vpc.baldwin_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.baldwin_ecs.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "backend_logs" {
  name              = "/ecs/baldwin-backend"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "enrichment_logs" {
  name              = "/ecs/baldwin-enrichment"
  retention_in_days = 7
}

# Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name = "baldwin/db-password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password
}

resource "aws_secretsmanager_secret" "zillow_api_key" {
  name = "baldwin/zillow-api-key"
}

resource "aws_secretsmanager_secret_version" "zillow_api_key" {
  secret_id     = aws_secretsmanager_secret.zillow_api_key.id
  secret_string = var.zillow_api_key
}

resource "aws_secretsmanager_secret" "data_axle_api_key" {
  name = "baldwin/data-axle-api-key"
}

resource "aws_secretsmanager_secret_version" "data_axle_api_key" {
  secret_id     = aws_secretsmanager_secret.data_axle_api_key.id
  secret_string = var.data_axle_api_key
}

# IAM Roles
resource "aws_iam_role" "ecs_execution_role" {
  name = "baldwin-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task_role" {
  name = "baldwin-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# Outputs
output "alb_dns_name" {
  value = aws_lb.baldwin_alb.dns_name
}

output "rds_endpoint" {
  value = aws_db_instance.baldwin_postgres.address
}
