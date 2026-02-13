# AWS IAM User and Access Keys Creation

## 1. Log in to AWS Management Console

https://console.aws.amazon.com

## 2. Navigate to IAM Dashboard

Search: "IAM" → AWS Identity and Access Management

## 3. Create a new IAM user

**In the left sidebar:**
- Click "Users"
- Click "Create user"

**Configuration:**
- Username: `simpletemp-iot` (or your chosen name)
- Click "Next"

## 4. Set permissions

**Select user permissions:**

Select "Attach policies directly"

Search for and select the following:
- ☑️ `AWSIoTFullAccess` (IoT Core)
- ☑️ `AmazonTimestreamFullAccess` (Timestream)
- ☑️ `CloudWatchLogsFullAccess` (Logs)
- ☑️ `AWSCloudFormationFullAccess` (CloudFormation - required by CDK)
- ☑️ `IAMFullAccess` (IAM roles - required by CDK)
- ☑️ `AmazonS3FullAccess` (S3 - required by CDK)
- ☑️ `AmazonEC2ContainerRegistryFullAccess` (ECR - required by CDK)

*Alternatively: Temporarily add `AdministratorAccess` for bootstrap, remove it afterward*

Click "Next"

## 5. Review and create

- Review the summary
- Click "Create user"

## 6. Create Access Keys

With the new user:
1. Click the user you created (e.g. `simpletemp-iot`)
2. Navigate to the "Security credentials" tab
3. Click "Create access key"

**Access key use case:**
- Select: "Local code"
- Click "Next"

**Best practices warning:**
- You can read the warning
- Click "Create access key"

## 7. Save the keys

**IMPORTANT: Copy these AS SOON AS the keys appear:**

```
Access Key ID:     AKIA...
Secret Access Key: wJal...
```

⚠️ **Cannot retrieve again!** If you forget, create a new one.

## 8. Configure AWS CLI

In the terminal:

```bash
aws configure
```

Answer as follows:

```
AWS Access Key ID [None]: AKIA... (paste the one you copied above)
AWS Secret Access Key [None]: wJal... (paste the one you copied above)
Default region name [None]: eu-west-1
Default output format [None]: json
```

Verify:

```bash
aws sts get-caller-identity
```

Output shows:

```json
{
    "UserId": "AIDAI...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/simpletemp-iot"
}
```

## 9. CDK Bootstrap and Deploy

```bash
cd cdk

# Set the region
export AWS_REGION=eu-west-1
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Bootstrap (first time)
cdk bootstrap aws://$AWS_ACCOUNT_ID/$AWS_REGION

# Deploy
cdk deploy

# Accept: "Do you wish to deploy these changes?" → y
# Wait ~5-10 minutes
```

## What happens?

```
✅ SimpleTemperatureBoxStack
  ✅ TemperatureSenderDatabase (Timestream)
  ✅ TemperatureSenderTable (measurements)
  ✅ TemperatureSenderIoTPolicy
  ✅ TemperatureSenderTopicRule
```

## Outputs

After deployment you will see outputs:

```
SimpleTemperatureBoxStack.TimestreamDatabase = temperature-sender-db
SimpleTemperatureBoxStack.TimestreamTable = measurements
SimpleTemperatureBoxStack.IoTPolicyName = TemperatureSenderPublishPolicy
SimpleTemperatureBoxStack.AwsRegion = eu-west-1
SimpleTemperatureBoxStack.AwsAccountId = 123456789012
```

## Next: ESP32 Integration

When deployment is complete, follow the instructions at [./cdk/ESP32_MQTT_SETUP.md](./cdk/ESP32_MQTT_SETUP.md).

## Troubleshooting

### "User is not authorized"
- Make sure the IAM user has the correct policies
- Try temporarily adding `AdministratorAccess` for testing

### "Access Denied for resource"
- Make sure AWS_REGION matches the deployment region
- Refresh credentials: `aws configure`

### "InvalidSignatureException"
- Check that Access Key and Secret Key are correct
- Generate new ones: IAM → Users → Create access key

## Security

🔒 **Never:**
- Push `~/.aws/credentials` to GitHub
- Share Access Keys with anyone
- Use Root account (always use IAM users)

✅ **Best practices:**
- Use MFA (Multi-Factor Authentication)
- Delete unused access keys
- Rotate keys regularly
