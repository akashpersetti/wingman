#!/usr/bin/env bash
# Run this ONCE before `terraform init` to create the S3 state backend.
set -euo pipefail

BUCKET="wingman-terraform-state-914697327092"
REGION="us-east-1"

echo "Creating Terraform state bucket: $BUCKET"

# Create bucket (us-east-1 doesn't use LocationConstraint)
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION"

# Enable versioning so you can recover previous states
aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

# Block all public access
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "Done. Now run:"
echo "  cd terraform && terraform init"
