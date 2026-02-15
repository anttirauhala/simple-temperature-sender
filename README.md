# ESP32-C3 Supermini - Simple Temperature Sender

Temperature and humidity monitoring system using Adafruit SHT30 sensor with AWS IoT Core integration.

## Features

- **SHT30 humidity/temperature sensor** - I2C bus (GPIO 8, 9)
- **WiFi connectivity** - Connects to configured network with automatic reconnection
- **AWS IoT Core** - Publishes sensor data via MQTT every 5 minutes
- **Status LED (Green)** - GPIO 3 (system health indicator)
- **Blue LED** - GPIO 2 (data transmission indicator)
- **Button/Switch** - GPIO 4 (enables audio feedback)
- **Buzzer** - GPIO 5 (startup melody and audio feedback)
- **Serial monitor** - Displays sensor data at 115200 baud

## Functionality

### Sensor Reading
- Reads temperature and humidity every **2 seconds**
- Publishes data to AWS IoT Core every **5 minutes**
- Serial output shows real-time measurements

### Status LED (Green - GPIO 3)
- **ON**: All systems operational (SHT30 initialized, WiFi connected, AWS connected)
- **OFF**: System not ready or connection lost
- **Blinking continuously**: SHT30 sensor initialization failed (error state)
- Automatically monitors WiFi and AWS connection status
- Turns OFF immediately when WiFi or AWS connection is lost
- Turns back ON when both connections are restored

### Blue LED (GPIO 2)
- Blinks when data is published to AWS IoT Core (every 5 minutes)
- Visual confirmation of successful data transmission

### Switch & Audio Feedback (GPIO 4)
- **Switch** on GPIO 4 with internal pull-up (ON = LOW)
- **Effect**: Enables/disables buzzer audio feedback
- When switch is ON:
  - Beeps (2000Hz, 50ms) when sensor reads new data (every 2 seconds)
  - Beeps (3000Hz, 50ms) when data is published to AWS (every 5 minutes)
  - Beeps (250Hz, 150ms twice) if sensor reading fails
  - Beeps (300Hz, 50ms) if AWS publish fails
- When switch is OFF: All beeps are muted (except startup melody)

### Buzzer (GPIO 5)
- Plays startup melody when system initializes successfully
- Provides audio feedback when switch is ON (see Switch section above)
- Generates tones by PWM signal on GPIO 5

### SHT30 Initialization Failure
- If the SHT30 sensor fails to initialize (communication error):
  - **Buzzer**: Plays 4 warning beeps (1000Hz, 200ms each with 500ms pauses)
  - **Green LED**: Enters infinite blinking loop (visual error indicator)
  - **Blue LED**: Remains OFF
  - **Serial Output**: Displays "SHT30 not responding"
  - **System**: Halts in error state, waiting for manual reset

### WiFi & AWS Connection Management
- **Startup**: Retries WiFi and AWS connections until both succeed
  - WiFi failure: Short beep (300Hz, 150ms), retry after 5s
  - AWS failure: Two short beeps (300Hz, 150ms), retry after 5s
  - Success beeps: 750Hz, 100ms (WiFi), then two 750Hz beeps (AWS)
- **Runtime**: Automatically monitors and reconnects if connection drops
  - WiFi: Reconnects immediately on disconnect
  - AWS/MQTT: Reconnects every 30 seconds if disconnected
  - Status LED reflects real-time connection status

## GPIO Mapping

| GPIO | Function | Description |
|------|----------|-------------|
| 2 | Blue LED output | Data transmission indicator |
| 3 | Green LED output | System status indicator |
| 4 | Switch input (pull-up) | Audio feedback enable/disable |
| 5 | Buzzer output | Audio feedback |
| 8 | I2C SDA (SHT30) | Sensor data line |
| 9 | I2C SCL (SHT30) | Sensor clock line |

## Configuration

### 1. Copy Configuration Template
```bash
cp src/config.h.example src/config.h
```

### 2. Edit `src/config.h` with your credentials:
- **WiFi SSID and password**
- **AWS IoT Endpoint** (get from AWS IoT Core settings)
- **AWS Device Client ID** (must match pattern: `SimpleTemperatureSender-*`)
- **Device Certificate and Private Key** (from AWS IoT Core)

### 3. AWS IoT Setup
See [AWS_SETUP.md](AWS_SETUP.md) and [cdk/](cdk/) for AWS infrastructure setup.

## I2C Device Addresses

- **SHT30**: 0x44

## Installation

```bash
platformio run -e esp32-c3-devkitm-1 --target upload
```

## Monitoring

```bash
platformio device monitor -e esp32-c3-devkitm-1
```

In the serial port you will see:
- WiFi connection status and network scan
- AWS IoT Core MQTT connection status
- Temperature and humidity readings every 2 seconds
- Data publication to AWS every 5 minutes
- SHT30 status (OK / error)

## Dependencies

- Adafruit SHT31 Library
- Arduino core for ESP32
- WiFiClientSecure (ESP32 TLS/SSL)
- PubSubClient (MQTT)
- ArduinoJson (JSON serialization)

## MQTT Topic

Data is published to: `SimpleTemperatureSender/measurements`

### Payload Format (JSON)
```json
{
  "temperature": 23.5,
  "humidity": 45.2,
  "timestamp": "2026-02-13T19:30:00"
}
```

## Security

- **config.h is in .gitignore** - Keep credentials secure
- Uses TLS/SSL certificates for AWS IoT Core connection
- Certificates stored in `certs/` directory (also in .gitignore)