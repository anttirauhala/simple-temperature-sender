import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iot from 'aws-cdk-lib/aws-iot';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

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
  }
}
