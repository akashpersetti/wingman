#!/usr/bin/env bash
# Manual deployment script — mirrors what GitHub Actions does.
# Usage: ./scripts/deploy.sh [--backend-only | --frontend-only]
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPOSITORY="${ECR_REPOSITORY:?Set ECR_REPOSITORY (from terraform output)}"
LAMBDA_FUNCTION_NAME="${LAMBDA_FUNCTION_NAME:?Set LAMBDA_FUNCTION_NAME (from terraform output)}"
S3_BUCKET="${S3_BUCKET:?Set S3_BUCKET (from terraform output)}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:?Set CF_DISTRIBUTION_ID (from terraform output)}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo latest)}"

# API keys
OPENAI_API_KEY="${OPENAI_API_KEY:?Set OPENAI_API_KEY}"
SERPER_API_KEY="${SERPER_API_KEY:?Set SERPER_API_KEY}"
PUSHOVER_TOKEN="${PUSHOVER_TOKEN:-}"
PUSHOVER_USER="${PUSHOVER_USER:-}"

DEPLOY_BACKEND=true
DEPLOY_FRONTEND=true
case "${1:-}" in
  --backend-only)  DEPLOY_FRONTEND=false ;;
  --frontend-only) DEPLOY_BACKEND=false ;;
esac

# ── Deploy backend ─────────────────────────────────────────────────────────────
if $DEPLOY_BACKEND; then
  echo "==> Building Docker image (linux/amd64)..."
  docker build --platform linux/amd64 \
    -t "${ECR_REPOSITORY}:${IMAGE_TAG}" \
    -t "${ECR_REPOSITORY}:latest" \
    .

  echo "==> Logging in to ECR..."
  aws ecr get-login-password --region "$AWS_REGION" \
    | docker login --username AWS --password-stdin "$ECR_REPOSITORY"

  echo "==> Pushing image to ECR..."
  docker push "${ECR_REPOSITORY}:${IMAGE_TAG}"
  docker push "${ECR_REPOSITORY}:latest"

  echo "==> Updating Lambda function code..."
  aws lambda update-function-code \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --image-uri "${ECR_REPOSITORY}:${IMAGE_TAG}" \
    --region "$AWS_REGION"

  echo "==> Injecting API secrets into Lambda environment..."
  CURRENT=$(aws lambda get-function-configuration \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --query 'Environment.Variables' \
    --output json)

  UPDATED=$(echo "$CURRENT" | jq \
    --arg openai "$OPENAI_API_KEY" \
    --arg serper "$SERPER_API_KEY" \
    --arg pt "$PUSHOVER_TOKEN" \
    --arg pu "$PUSHOVER_USER" \
    '. + {OPENAI_API_KEY: $openai, SERPER_API_KEY: $serper, PUSHOVER_TOKEN: $pt, PUSHOVER_USER: $pu}')

  aws lambda update-function-configuration \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --environment "{\"Variables\": $UPDATED}" \
    --region "$AWS_REGION"

  echo "==> Waiting for Lambda update..."
  aws lambda wait function-updated \
    --function-name "$LAMBDA_FUNCTION_NAME" \
    --region "$AWS_REGION"

  echo "==> Backend deployed."
fi

# ── Deploy frontend ────────────────────────────────────────────────────────────
if $DEPLOY_FRONTEND; then
  echo "==> Building Next.js frontend..."
  (cd frontend && NEXT_PUBLIC_API_URL="" npm run build)

  echo "==> Syncing to S3..."
  aws s3 sync frontend/out/ "s3://${S3_BUCKET}/" \
    --delete \
    --cache-control "public,max-age=31536000,immutable" \
    --exclude "*.html"

  aws s3 sync frontend/out/ "s3://${S3_BUCKET}/" \
    --exclude "*" \
    --include "*.html" \
    --cache-control "no-cache"

  echo "==> Invalidating CloudFront..."
  aws cloudfront create-invalidation \
    --distribution-id "$CF_DISTRIBUTION_ID" \
    --paths "/*"

  CF_DOMAIN=$(aws cloudfront get-distribution \
    --id "$CF_DISTRIBUTION_ID" \
    --query 'Distribution.DomainName' --output text)
  echo "==> Frontend deployed to https://${CF_DOMAIN}"
fi

echo ""
echo "Deployment complete!"
