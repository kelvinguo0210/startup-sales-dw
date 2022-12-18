# Output value definitions


output "function_name" {
  description = "Name of the Lambda function."

  value = aws_lambda_function.startup-sales-dw-lambda.function_name
}


output "base_url" {
  description = "Base URL for API Gateway stage."

  value = aws_api_gateway_deployment.api-gateway_rest_api-deployment.invoke_url
}

