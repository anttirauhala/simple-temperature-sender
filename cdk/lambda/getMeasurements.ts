import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'temperature-measurements';
const DEVICE_ID = process.env.DEVICE_ID || 'SimpleTemperatureSender-ESP32-C3-supermini-1';

interface Measurement {
  device_id: string;
  timestamp: number;
  temperature: number;
  humidity: number;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Get startTime from query parameters (default to start of today)
    const startTime = event.queryStringParameters?.startTime
      ? parseInt(event.queryStringParameters.startTime)
      : getStartOfToday();

    console.log('Querying measurements from:', new Date(startTime).toISOString());

    // Query DynamoDB for measurements after startTime
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'device_id = :deviceId AND #ts >= :startTime',
      ExpressionAttributeNames: {
        '#ts': 'timestamp',
      },
      ExpressionAttributeValues: {
        ':deviceId': DEVICE_ID,
        ':startTime': startTime,
      },
      ScanIndexForward: true, // Sort by timestamp ascending
    });

    const response = await docClient.send(command);
    const measurements = (response.Items || []) as Measurement[];

    console.log(`Found ${measurements.length} measurements`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        measurements,
        count: measurements.length,
        startTime,
        deviceId: DEVICE_ID,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

function getStartOfToday(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}
