output "cloudfront_url" {
  description = "Public HTTPS URL for the app (frontend + /api/* proxied to Lambda)"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — add as GH secret CF_DISTRIBUTION_ID"
  value       = aws_cloudfront_distribution.main.id
}

output "lambda_function_name" {
  description = "Lambda function name — add as GH secret LAMBDA_FUNCTION_NAME"
  value       = aws_lambda_function.backend.function_name
}

output "lambda_function_url" {
  description = "Direct Lambda HTTPS URL (no 29s timeout) — use for long-running agent tasks"
  value       = aws_lambda_function_url.backend.function_url
}

output "ecr_repository_url" {
  description = "ECR repository URL — add as GH secret ECR_REPOSITORY"
  value       = aws_ecr_repository.backend.repository_url
}

output "frontend_bucket" {
  description = "S3 bucket name — add as GH secret S3_BUCKET"
  value       = aws_s3_bucket.frontend.bucket
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions OIDC — add as GH secret AWS_ROLE_ARN"
  value       = aws_iam_role.github_actions.arn
}

output "dynamodb_table" {
  description = "DynamoDB sessions table name"
  value       = aws_dynamodb_table.sessions.name
}
