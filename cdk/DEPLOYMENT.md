# Simple Temperature Sender AWS CDK Deployment Guide

## Prerequisites

1. **AWS Account** - https://aws.amazon.com
2. **AWS CLI installed** - `aws configure` configured
3. **Node.js 22+** (installed)
4. **AWS CDK CLI installed** (installed)

## Deployment Steps

### 1. Prepare AWS Environment

```bash
# Set AWS region and account
export AWS_REGION=eu-west-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Verify correct settings
aws sts get-caller-identity
```

### 2. Bootstrap CDK (first time only)

```bash
cd cdk
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION
```

### 3. Check stack

```bash
cdk synth
```

### 4. Deploy stack

```bash
cdk deploy

# Accept the prompt when asked
# Wait for deployment (~5-10 minutes)
```

## Outputs

After deployment you will receive:
- **DynamoDBTable**: Table name (temperature-measurements)
- **DynamoDBTableArn**: Table ARN
- **IoTPolicyName**: IoT policy name (SimpleTemperatureSenderPublishPolicy)
- **AwsRegion**: AWS region
- **AwsAccountId**: AWS account ID

## ESP32 Integration

See [ESP32_MQTT_SETUP.md](./ESP32_MQTT_SETUP.md) after the stack is deployed.

## Cost Estimate

**Monthly costs (5 minute intervals = 8,640 messages/month):**

- **DynamoDB**: 
  - Write requests: ~$0.011/month (8,640 writes)
  - Storage: ~$0.0001/month (~0.5 MB)
- **IoT Core**: ~$0.009/month (8,640 messages)
- **CloudWatch Logs**: ~$0.001/month
- **Total**: **~$0.02/month** (2 cents/month)

## Cleanup

To remove resources:

```bash
cdk destroy

# Confirm deletion
```

## Troubleshooting

### "Unable to assume role"
- Make DynamoDB](https://docs.aws.amazon.com/dynamodb

### "User is not authorized"
- Check IAM permissions in AWS console

## More Information

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS IoT Core](https://docs.aws.amazon.com/iot/)
