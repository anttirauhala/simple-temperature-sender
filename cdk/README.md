# Simple Temperature Sender AWS CDK Infrastructure

AWS CDK TypeScript project for Simple Temperature Sender infrastructure. Includes:

- **DynamoDB** - NoSQL database for measurement storage
- **AWS IoT Core** - MQTT messaging for ESP32 devices
- **Lambda Function** - API backend for data retrieval
- **API Gateway** - REST API for frontend access
- **IAM Roles & Policies** - Secure permissions

## Structure

```
cdk/
├── lib/
│   └── cdk-stack.ts          # Main stack - DynamoDB + IoT + API
├── lambda/
│   ├── getMeasurements.ts    # Lambda function for data retrieval
│   └── package.json          # Lambda dependencies
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

### 3. Install Lambda dependencies

```bash
cd lambda
npm install
cd ..
```

### 4. Deploy

```bash
cdk deploy
```

### 5. Get outputs

```
✅ SimpleTemperatureBoxStack
Outputs:
  SimpleTemperatureBoxStack.DynamoDBTable = temperature-measurements
  SimpleTemperatureBoxStack.IoTPolicyName = SimpleTemperatureSenderPublishPolicy
  SimpleTemperatureBoxStack.AwsRegion = eu-west-1
  SimpleTemperatureBoxStack.ApiUrl = https://abc123.execute-api.eu-west-1.amazonaws.com/prod/
  SimpleTemperatureBoxStack.ApiEndpoint = https://abc123.execute-api.eu-west-1.amazonaws.com/prod/measurements
```

**Important:** Save the `ApiUrl` - you'll need it for the frontend configuration!

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
DynamoDB Table
    ↑ Query
Lambda Function
    ↑ HTTPS
API Gateway
    ↑ HTTPS
React Frontend
```

### Data Flow

1. **ESP32 → AWS IoT Core**: Device publishes measurements via MQTT
2. **IoT Core → DynamoDB**: Topic rule saves data to DynamoDB table
3. **Frontend → API Gateway**: User opens dashboard
4. **API Gateway → Lambda**: Request forwarded to Lambda
5. **Lambda → DynamoDB**: Lambda queries measurements
6. **DynamoDB → Frontend**: Data displayed in charts

## Features

✅ **Secure**: TLS certificates, IAM roles, CORS-protected API
✅ **Cost-effective**: ~$0.01-0.05/month with small volume
✅ **Automated**: CloudFormation infrastructure as code
✅ **Scalable**: Supports thousands of devices
✅ **Real-time Dashboard**: React frontend with live charts

## ESP32 Integration

See [ESP32_MQTT_SETUP.md](ESP32_MQTT_SETUP.md) for detailed instructions.

Briefly:
1. Create IoT Thing and certificates in AWS
2. Attach policy: `SimpleTemperatureSenderPublishPolicy`
3. Configure WiFi and certificates in `config.h`
4. Device sends MQTT messages to `SimpleTemperatureSender/measurements` topic
5. Messages are automatically saved to DynamoDB

## Frontend Setup

The React dashboard displays temperature and humidity data from DynamoDB.

### Quick Start

```bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env and set VITE_API_URL to the ApiUrl from CDK outputs
npm run dev
```

See [../frontend/README.md](../frontend/README.md) for details.

## Costs

| Service | Price (estimate) |
|---------|------------------|
| DynamoDB (on-demand) | $0.01-0.02/month |
| Lambda (1M invocations) | Free tier |
| API Gateway (1M calls) | Free tier |
| IoT Core | Free (250k msg/month) |
| **Total** | ~$0.01-0.05/month |

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
