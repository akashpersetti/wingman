# Deploying Wingman to AWS

## Architecture (same as twin project)

```
User → HTTPS → CloudFront ──┬── /*      → S3 (Next.js static export)
                             └── /api/* → API Gateway v2 → Lambda (FastAPI + Mangum)
                                                              ↕
                                                          DynamoDB
                                                       (session store)
```

| Component | Service | Cost |
|-----------|---------|------|
| Backend   | Lambda (container image) | Free tier |
| API routing | API Gateway v2 | Free tier |
| Sessions | DynamoDB on-demand | Free tier |
| Frontend | S3 static + CloudFront | ~$0.02/month |
| Images | ECR | ~$0.05/month |
| **Total** | | **~$0–1/month** |

> **Note:** API Gateway has a hard 29-second timeout. For complex agent tasks that take longer, use the Lambda Function URL directly (available as `lambda_function_url` in terraform outputs).

---

## One-time Setup

### 1. Prerequisites

```bash
brew install terraform awscli
aws configure   # region: us-east-1
```

### 2. Create GitHub OIDC provider (if not in your AWS account)

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### 3. Bootstrap Terraform state bucket

```bash
./scripts/setup-state-bucket.sh
```

### 4. Configure Terraform

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — set github_org and github_repo
```

### 5. First deploy: push a Docker image before applying Terraform

Terraform needs a container image in ECR before it can create the Lambda function.
Bootstrap the ECR repo first:

```bash
# Apply only ECR first
terraform init
terraform apply -target=aws_ecr_repository.backend

# Build and push initial image
ECR_URL=$(terraform output -raw ecr_repository_url)
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URL
docker build --platform linux/amd64 -t $ECR_URL:latest .
docker push $ECR_URL:latest

# Now apply everything
terraform apply
```

### 6. Add GitHub repository secrets

Go to GitHub repo → Settings → Secrets → Actions:

| Secret | Value (from `terraform output`) |
|--------|--------------------------------|
| `AWS_ROLE_ARN` | `github_actions_role_arn` |
| `ECR_REPOSITORY` | `ecr_repository_url` |
| `LAMBDA_FUNCTION_NAME` | `lambda_function_name` |
| `S3_BUCKET` | `frontend_bucket` |
| `CF_DISTRIBUTION_ID` | `cloudfront_distribution_id` |
| `OPENAI_API_KEY` | Your OpenAI key |
| `SERPER_API_KEY` | Your Serper key |
| `PUSHOVER_TOKEN` | Your Pushover token (optional) |
| `PUSHOVER_USER` | Your Pushover user (optional) |

---

## Deploying

### Automatic (CI/CD)

Push to `main` — GitHub Actions builds the image, pushes to ECR, updates Lambda,
builds the frontend, syncs to S3, and invalidates CloudFront.

### Manual

```bash
export AWS_REGION=us-east-1
export ECR_REPOSITORY="$(cd terraform && terraform output -raw ecr_repository_url)"
export LAMBDA_FUNCTION_NAME="$(cd terraform && terraform output -raw lambda_function_name)"
export S3_BUCKET="$(cd terraform && terraform output -raw frontend_bucket)"
export CF_DISTRIBUTION_ID="$(cd terraform && terraform output -raw cloudfront_distribution_id)"
export OPENAI_API_KEY="sk-..."
export SERPER_API_KEY="..."

./scripts/deploy.sh                  # everything
./scripts/deploy.sh --backend-only   # Lambda only
./scripts/deploy.sh --frontend-only  # S3/CloudFront only
```

---

## Local Development

```bash
# Option A: docker-compose (uses DynamoDB Local — closest to production)
docker-compose up

# Option B: native (fastest iteration)
# Terminal 1 — backend
uv sync --group local
uvicorn backend.main:app --reload

# Terminal 2 — frontend
cd frontend && npm run dev
```

For native local dev, you need either:
- Real AWS credentials with DynamoDB access, OR
- Set `AWS_ENDPOINT_URL=http://localhost:8001` and run DynamoDB Local:
  `docker run -p 8001:8000 amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb -inMemory`

---

## Troubleshooting

**Lambda timeout (> 29 seconds):**
Use the Lambda Function URL directly — no 29s limit:
```bash
terraform output lambda_function_url
```
Update `NEXT_PUBLIC_API_URL` to this URL for long-running tasks.

**Cold start is slow:**
Lambda initialises the LangGraph agent on first invocation (~3–5s).
Subsequent warm invocations reuse the module-level `wingman` instance.

**DynamoDB access denied:**
Check Lambda execution role has `dynamodb:GetItem/PutItem/UpdateItem/DeleteItem` on the table.
`aws lambda get-function-configuration --function-name wingman-backend | jq .Role`

**Check Lambda logs:**
```bash
aws logs tail /aws/lambda/wingman-backend --follow
```
