import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({});

const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || '';
const MIN_TEMPERATURE = 8;
const MAX_TEMPERATURE = 40;

interface TemperatureMeasurement {
  device_id: string;
  timestamp: number;
  temperature: number;
  humidity: number;
}

export const handler = async (event: TemperatureMeasurement): Promise<void> => {
  console.log('Received measurement:', JSON.stringify(event, null, 2));

  const { device_id, temperature, timestamp } = event;

  // Tarkista lämpötilahälytykset
  if (temperature < MIN_TEMPERATURE || temperature > MAX_TEMPERATURE) {
    const alertType = temperature < MIN_TEMPERATURE ? 'MATALA' : 'KORKEA';
    const message = `
LÄMPÖTILAHÄLYTYS!

Tyyppi: ${alertType} LÄMPÖTILA
Laite: ${device_id}
Lämpötila: ${temperature.toFixed(1)}°C
Kosteus: ${event.humidity.toFixed(1)}%
Aika: ${new Date(timestamp).toISOString()}

Hälytysrajat:
- Alaraja: ${MIN_TEMPERATURE}°C
- Yläraja: ${MAX_TEMPERATURE}°C
    `.trim();

    const subject = `⚠️ Lämpötilahälytys: ${temperature.toFixed(1)}°C (${alertType})`;

    console.log('Sending alert:', { subject, temperature, alertType });

    try {
      const command = new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: subject,
        Message: message,
      });

      await snsClient.send(command);
      console.log('Alert sent successfully');
    } catch (error) {
      console.error('Error sending alert:', error);
      throw error;
    }
  } else {
    console.log('Temperature within normal range, no alert sent');
  }
};
