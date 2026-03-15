terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state — run scripts/setup-state-bucket.sh once before terraform init
  backend "s3" {
    bucket = "wingman-terraform-state-914697327092"
    key    = "wingman/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

