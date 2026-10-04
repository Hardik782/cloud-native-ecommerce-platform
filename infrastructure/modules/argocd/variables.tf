variable "ecr_urls" {
  description = "Map of ECR repository names to their repository URLs"
  type        = map(string)
}