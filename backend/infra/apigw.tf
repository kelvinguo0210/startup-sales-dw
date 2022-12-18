resource "aws_api_gateway_rest_api" "api-gateway_rest_api" {
  name        = "startup-sales-dw-apigw"
  description = "API to access codingtips application"
  body        = "${data.template_file.apgw_template.rendered}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

}

resource "aws_api_gateway_deployment" "api-gateway_rest_api-deployment" {
  rest_api_id = "${aws_api_gateway_rest_api.api-gateway_rest_api.id}"
  stage_name  = "dev"
  variables = var.stage_vars
  
  //depends_on = [
  //  aws_api_gateway_method._,
  //]  
}

data "template_file" apgw_template{
  template = "${file("apigw.yaml")}"

  vars = {
    post_lambda_arn = "${aws_lambda_function.startup-sales-dw-lambda.invoke_arn}"
    
  }
}

resource "aws_lambda_permission" "api-gateway-invoke-get-lambda" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.startup-sales-dw-lambda.arn
  principal     = "apigateway.amazonaws.com"

  # The /*/* portion grants access from any method on any resource
  # within the specified API Gateway.
  #source_arn = "${aws_api_gateway_deployment.api-gateway_rest_api-deployment.execution_arn}/*/*"
  source_arn = "${aws_api_gateway_rest_api.api-gateway_rest_api.execution_arn}/*/*/*"
}

########

locals {
  headers = {
    "Access-Control-Allow-Headers"     = "'${join(",", var.allow_headers)}'"
    "Access-Control-Allow-Methods"     = "'${join(",", var.allow_methods)}'"
    "Access-Control-Allow-Origin"      = "'${var.allow_origin}'"
    "Access-Control-Max-Age"           = "'${var.allow_max_age}'"
    "Access-Control-Allow-Credentials" = var.allow_credentials ? "'true'" : ""
  }

  # Pick non-empty header values
  header_values = compact(values(local.headers))

  # Pick names that from non-empty header values
  header_names = matchkeys(
    keys(local.headers),
    values(local.headers),
    local.header_values
  )

  # Parameter names for method and integration responses
  parameter_names = formatlist("method.response.header.%s", local.header_names)

  # Map parameter list to "true" values
  true_list = split("|",
    replace(join("|", local.parameter_names), "/[^|]+/", "true")
  )

  # Integration response parameters
  integration_response_parameters = zipmap(
    local.parameter_names,
    local.header_values
  )

  # Method response parameters
  method_response_parameters = zipmap(
    local.parameter_names,
    local.true_list
  )
}

data "aws_api_gateway_resource" "my_resource" {
  rest_api_id = "${aws_api_gateway_rest_api.api-gateway_rest_api.id}"
  path        = "/data"
}


/*
resource "aws_api_gateway_method" "_" {
  rest_api_id   = "${aws_api_gateway_rest_api.api-gateway_rest_api.id}"
  resource_id   = data.aws_api_gateway_resource.my_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "_" {
  rest_api_id = "${aws_api_gateway_rest_api.api-gateway_rest_api.id}"
  resource_id = data.aws_api_gateway_resource.my_resource.id
  http_method = aws_api_gateway_method._.http_method
  content_handling = "CONVERT_TO_TEXT"

  type = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_integration_response" "_" {
  rest_api_id = "${aws_api_gateway_rest_api.api-gateway_rest_api.id}"
  resource_id = data.aws_api_gateway_resource.my_resource.id
  http_method = aws_api_gateway_method._.http_method
  status_code = 200

  response_parameters = local.integration_response_parameters

  depends_on = [
    aws_api_gateway_integration._,
    aws_api_gateway_method_response._,
  ]
}

resource "aws_api_gateway_method_response" "_" {
  rest_api_id = "${aws_api_gateway_rest_api.api-gateway_rest_api.id}"
  resource_id = data.aws_api_gateway_resource.my_resource.id
  http_method = aws_api_gateway_method._.http_method
  status_code = 200

  response_parameters = local.method_response_parameters

  response_models = {
    "application/json" = "Empty"
  }

  depends_on = [
    aws_api_gateway_method._,
  ]
}
*/
