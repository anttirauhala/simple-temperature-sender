import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class SimpleTemperatureBoxStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============ DYNAMODB TABLE ============
    const table = new dynamodb.Table(this, 'SimpleTemperatureSenderTable', {
      tableName: 'temperature-measurements',
      partitionKey: {
        name: 'device_id',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ============ IOT CORE POLICY ============
    const iotPolicy = new iot.CfnPolicy(this, 'SimpleTemperatureSenderIoTPolicy', {
      policyName: 'SimpleTemperatureSenderPublishPolicy',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'iot:Connect',
            ],
            Resource: [`arn:aws:iot:${this.region}:${this.account}:client/SimpleTemperatureSender-*`],
          },
          {
            Effect: 'Allow',
            Action: [
              'iot:Publish',
            ],
            Resource: [
              `arn:aws:iot:${this.region}:${this.account}:topic/SimpleTemperatureSender/measurements`,
              `arn:aws:iot:${this.region}:${this.account}:topic/SimpleTemperatureSender/status`,
            ],
          },
        ],
      },
    });

    // ============ IOT CORE RULE ROLE ============
    const iotRuleRole = new iam.Role(this, 'IotRuleRole', {
      assumedBy: new iam.ServicePrincipal('iot.amazonaws.com'),
    });

    // Salli DynamoDB kirjoittamisen
    iotRuleRole.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          'dynamodb:PutItem',
        ],
        resources: [
          table.tableArn,
        ],
      })
    );

    // ============ IOT CORE TOPIC RULE ============
    const topicRule = new iot.CfnTopicRule(this, 'SimpleTemperatureSenderTopicRule', {
      ruleName: 'SimpleTemperatureSenderToDynamoDB',
      topicRulePayload: {
        ruleDisabled: false,
        sql: `SELECT 
                temperature as temperature,
                humidity as humidity,
                timestamp() as timestamp,
                clientId() as device_id
              FROM 'SimpleTemperatureSender/measurements'`,
        actions: [
          {
            dynamoDBv2: {
              roleArn: iotRuleRole.roleArn,
              putItem: {
                tableName: table.tableName!,
              },
            },
          },
        ],
      },
    });

    // ============ CLOUDWATCH LOGS ============
    const logGroup = new logs.LogGroup(this, 'SimpleTemperatureSenderLogGroup', {
      logGroupName: '/aws/iot/simple-temperature-sender-rules',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ============ LAMBDA FUNCTION (API) ============
    const getMeasurementsLambda = new NodejsFunction(this, 'GetMeasurementsFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/getMeasurements.ts'),
      environment: {
        TABLE_NAME: table.tableName,
        DEVICE_ID: 'SimpleTemperatureSender-ESP32-C3-supermini-1',
      },
      timeout: cdk.Duration.seconds(30),
      bundling: {
        minify: false,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        forceDockerBundling: false,
      },
    });

    // Grant Lambda read access to DynamoDB table
    table.grantReadData(getMeasurementsLambda);

    // ============ LAMBDA SECURITY ============
    // Add resource policy to restrict Lambda invocation to API Gateway only
    getMeasurementsLambda.addPermission('ApiGatewayInvoke', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:*`,
    });

    // ============ API GATEWAY ============
    const api = new apigateway.RestApi(this, 'MeasurementsApi', {
      restApiName: 'Temperature Measurements API',
      description: 'API to retrieve temperature and humidity measurements',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        throttlingRateLimit: 100,      // Max 100 requests per second
        throttlingBurstLimit: 200,     // Max 200 concurrent requests
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,       // Don't log full request/response data
        metricsEnabled: true,          // Enable CloudWatch metrics
      },
    });

    // Create /measurements endpoint
    const measurements = api.root.addResource('measurements');
    const getMeasurementsMethod = measurements.addMethod(
      'GET',
      new apigateway.LambdaIntegration(getMeasurementsLambda, {
        proxy: true,
      })
    );

    // ============ API GATEWAY USAGE PLAN (RATE LIMITING) ============
    const plan = api.addUsagePlan('MeasurementsUsagePlan', {
      name: 'Basic Usage Plan',
      description: 'Usage plan with rate limiting and quotas',
      throttle: {
        rateLimit: 10,           // Steady-state: 10 requests per second
        burstLimit: 20,          // Burst: max 20 concurrent requests
      },
      quota: {
        limit: 10000,            // Max 10,000 requests per month
        period: apigateway.Period.MONTH,
      },
    });

    // Associate the usage plan with the API stage
    plan.addApiStage({
      stage: api.deploymentStage,
    });

    // ============ OUTPUTS ============
    new cdk.CfnOutput(this, 'DynamoDBTable', {
      value: table.tableName!,
      description: 'DynamoDB taulun nimi',
      exportName: 'SimpleTemperatureSenderDynamoDBTable',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableArn', {
      value: table.tableArn,
      description: 'DynamoDB taulun ARN',
      exportName: 'SimpleTemperatureSenderDynamoDBTableArn',
    });

    new cdk.CfnOutput(this, 'IoTPolicyName', {
      value: iotPolicy.policyName!,
      description: 'IoT Policy nimi',
      exportName: 'SimpleTemperatureSenderIoTPolicyName',
    });

    new cdk.CfnOutput(this, 'AwsRegion', {
      value: this.region,
      description: 'AWS Region',
      exportName: 'SimpleTemperatureSenderAwsRegion',
    });

    new cdk.CfnOutput(this, 'AwsAccountId', {
      value: this.account,
      description: 'AWS Account ID',
      exportName: 'SimpleTemperatureSenderAwsAccountId',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: 'SimpleTemperatureSenderApiUrl',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: `${api.url}measurements`,
      description: 'Measurements API Endpoint',
      exportName: 'SimpleTemperatureSenderApiEndpoint',
    });
  }
}
