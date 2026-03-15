resource "aws_dynamodb_table" "sessions" {
  name         = "${var.project_name}-sessions"
  billing_mode = "PAY_PER_REQUEST"  # on-demand — free tier for personal use
  hash_key     = "session_id"

  attribute {
    name = "session_id"
    type = "S"
  }

  # Auto-expire sessions after 30 days (set by backend via TTL attribute)
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = { Name = "${var.project_name}-sessions" }
}
