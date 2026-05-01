#!/bin/bash
# Baldwin Insurance - AWS Deployment Script

set -e

AWS_REGION="us-east-1"
ECR_REPO="YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com"
CLUSTER_NAME="baldwin-cluster"
SERVICE_NAME="baldwin-leads-service"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Baldwin Insurance AWS Deployment ===${NC}"

# 1. Login to ECR
echo -e "${GREEN}1. Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

# 2. Build images
echo -e "${GREEN}2. Building Docker images...${NC}"
docker build -t baldwin-backend:latest -f Dockerfile.backend .
docker build -t baldwin-enrichment:latest -f Dockerfile.enrichment .
docker build -t baldwin-frontend:latest -f Dockerfile.frontend .

# 3. Tag images
echo -e "${GREEN}3. Tagging images...${NC}"
docker tag baldwin-backend:latest $ECR_REPO/baldwin-backend:latest
docker tag baldwin-enrichment:latest $ECR_REPO/baldwin-enrichment:latest
docker tag baldwin-frontend:latest $ECR_REPO/baldwin-frontend:latest

# 4. Push to ECR
echo -e "${GREEN}4. Pushing to ECR...${NC}"
docker push $ECR_REPO/baldwin-backend:latest
docker push $ECR_REPO/baldwin-enrichment:latest
docker push $ECR_REPO/baldwin-frontend:latest

# 5. Update ECS service
echo -e "${GREEN}5. Updating ECS service...${NC}"
aws ecs update-service \
  --cluster $CLUSTER_NAME \
  --service $SERVICE_NAME \
  --force-new-deployment \
  --region $AWS_REGION

echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo "Backend: http://baldwin-alb-xxx.us-east-1.elb.amazonaws.com:3000"
echo "Frontend: http://baldwin-alb-xxx.us-east-1.elb.amazonaws.com"
