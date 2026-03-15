resource "aws_lambda_function" "backend" {
  function_name = "${var.project_name}-backend"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.backend.repository_url}:latest"

  # LangGraph agent loops can take a while — set generous timeout
  # Note: API Gateway has a hard 29-second proxy timeout.
  # For longer tasks, invoke the Lambda function URL directly (see outputs).
  timeout     = 300  # 5 minutes (Lambda max is 15 min)
  memory_size = 1024

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.sessions.name
      AWS_REGION_    = var.aws_region  # avoid collision with reserved AWS_REGION
      CORS_ORIGINS   = ""  # Updated post-deploy once CloudFront domain is known
      # Secret keys injected by GitHub Actions — not managed by Terraform
      # OPENAI_API_KEY, SERPER_API_KEY, PUSHOVER_TOKEN, PUSHOVER_USER
    }
  }

  depends_on = [aws_ecr_repository.backend]

  tags = { Name = "${var.project_name}-lambda" }
}

# Lambda function URL — direct HTTPS invoke, bypasses API Gateway 29s timeout
# Use this for long-running agent tasks
resource "aws_lambda_function_url" "backend" {
  function_name      = aws_lambda_function.backend.function_name
  authorization_type = "NONE"

  cors {
    allow_origins = ["*"]  # Tighten after first deploy: set to CloudFront domain
    allow_methods = ["GET", "POST"]
    allow_headers = ["Content-Type"]
    max_age       = 86400
  }
}
