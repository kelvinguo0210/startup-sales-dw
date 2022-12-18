dir=/home/ec2-user/SageMaker/kguo
cd ${dir}

# The name of our algorithm
image_name=startup-sales-dw

cd container

account=$(aws sts get-caller-identity --query Account --output text)

# Get the region defined in the current configuration (default to us-west-2 if none defined)
region=$(aws configure get region)
region=${region:-cn-northwest-1}
partition='.cn'


# If the repository doesn't exist in ECR, create it.
aws ecr describe-repositories --repository-names "${image_name}" > /dev/null 2>&1
if [ $? -ne 0 ]
then
    aws ecr create-repository --repository-name "${image_name}" > /dev/null
fi

# build & push
fullname="${account}.dkr.ecr.${region}.amazonaws.com${partition}/${image_name}:latest"
aws ecr get-login-password --region ${region}|docker login --username AWS --password-stdin ${fullname}
docker build -t ${image_name} .
docker tag ${image_name} ${fullname}
docker push ${fullname}


# deploy apigw & lambda
cd ${dir}/infra/
terraform apply -auto-approve 