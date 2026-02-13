# Simple Temperature Sender AWS CDK Infrastructure

AWS CDK TypeScript project for Simple Temperature Sender infrastructure. Includes:

- **Amazon Timestream** - Time series measurement database
- **AWS IoT Core** - MQTT messaging
- **IAM Roles & Policies** - Secure permissions

## Structure

```
cdk/
├── lib/
│   └── cdk-stack.ts          # Main stack - Timestream + IoT Core
├── bin/
│   └── cdk.ts                # CDK application
├── DEPLOYMENT.md             # Deployment instructions
├── ESP32_MQTT_SETUP.md       # ESP32 integration
├── package.json              # npm dependencies
├── tsconfig.json             # TypeScript configuration
└── cdk.json                  # CDK configuration
```

## Quick Start

### 1. Prepare credentials

```bash
# Set AWS region
export AWS_REGION=eu-west-1

# Verify AWS credentials
aws sts get-caller-identity
```

### 2. Bootstrap (first time only)

```bash
cd cdk
cdk bootstrap
```

### 3. Deploy

```bash
cdk deploy
```

### 4. Get outputs

```
✅ SimpleTemperatureBoxStack
Outputs:
  SimpleTemperatureBoxStack.TimestreamDatabase = temperature-sender-db
  SimpleTemperatureBoxStack.TimestreamTable = measurements
  SimpleTemperatureBoxStack.IoTPolicyName = TemperatureSenderPublishPolicy
  SimpleTemperatureBoxStack.AwsRegion = eu-west-1
  SimpleTemperatureBoxStack.AwsAccountId = 123456789012
```

## Commands

```bash
# Compile
npm run build

# Check changes
cdk diff

# Synthesize CloudFormation template
cdk synth

# Deploy
cdk deploy

# Destroy resources
cdk destroy
```

## Architecture

```
ESP32 (WiFi)
    ↓ MQTT + TLS
AWS IoT Core
    ↓ Topic Rule
Timestream Database
    ↓
Queries / Dashboards
```

## Features

✅ **Secure**: TLS certificates, IAM roles
✅ **Cost-effective**: ~$0.01-0.02/month with small volume
✅ **Automated**: CloudFormation infrastructure as code
✅ **Scalable**: Supports thousands of devices

## ESP32 Integration

See [ESP32_MQTT_SETUP.md](ESP32_MQTT_SETUP.md) for detailed instructions.

Briefly:
1. Create IoT Thing and certificates in AWS
2. Add libraries: `PubSubClient`, `ArduinoJson`
3. Configure WiFi and certificates
4. Send MQTT messages to `temperatureSender/measurements` topic

## Costs

| Service | Price |
|---------|-------|
| Timestream ingestion | $0.007/month |
| Timestream storage | $0.005/month |
| IoT Core | Free (250k msg/month) |
| **Total** | ~$0.01/month |

*Free Tier covers first 12 months*

## Deployment Instructions

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete instructions.

## Troubleshooting

### Environment error
```bash
# CDK needs AWS credentials
aws configure
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=eu-west-1
```

### Bootstrap error
```bash
# Retry bootstrap
cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION
```

### Compile error
```bash
npm install  # Update dependencies
npm run build
```

## More Information

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Timestream Query Language](https://docs.aws.amazon.com/timestream/latest/developerguide/queries.html)
- [IoT Core Best Practices](https://docs.aws.amazon.com/iot/latest/developerguide/security.html)

## Project

Simple Temperature Sender measurement device
