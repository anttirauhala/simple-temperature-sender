# ESP32-C3 Supermini - Simple Temperature Sender

Temperature and humidity monitoring system using Adafruit SHT30 sensor with AWS IoT Core integration.

## Features

- **SHT30 humidity/temperature sensor** - I2C bus (GPIO 8, 9)
- **WiFi connectivity** - Connects to configured network
- **AWS IoT Core** - Publishes sensor data via MQTT every 5 minutes
- **Green LED** - GPIO 3 (visual feedback)
- **Button LED** - GPIO 2 and GPIO 4 button (user interface)
- **Buzzer** - GPIO 5 (startup sound and feedback)
- **Serial monitor** - Displays sensor data at 115200 baud

## Functionality

### Sensor Reading
- Reads temperature and humidity every **2 seconds**
- Publishes data to AWS IoT Core every **5 minutes**

### Green LED
- Located on GPIO 3
- Blinks when measurement is taken or data is published

### Button & Button LED
- **Button** on GPIO 4 with internal pull-up (pressed = LOW)
- **Button LED** on GPIO 2 (GPIO 2 output)
- **Operation**: LED follows button state in real-time
  - Button pressed → LED turns ON
  - Button released → LED turns OFF
- **Effect**: Toggles buzzer beep on/off when measurement is completed
- When button is pressed, the system will beep when new sensor data is acquired

### Buzzer
- Located on GPIO 5
- Plays startup melody on initialization
- Generates tones by rapidly switching GPIO state

### SHT30 Initialization Failure
- If the SHT30 sensor fails to initialize (communication error):
  - **Buzzer**: Plays 3 warning beeps (1000Hz, 200ms each with 500ms pauses)
  - **Green LED**: Enters infinite blinking loop (visual error indicator)
  - **Button LED**: Remains OFF
  - **Serial Output**: Displays "SHT30 not responding"
  - **System**: Halts in error state, waiting for reset

## GPIO Mapping

| GPIO | Function | Color |
|------|----------|-------|
| 2 | Button-LED output | - |
| 3 | Green LED | - |
| 4 | Button input | - |
| 5 | Buzzer | - |
| 8 | I2C SDA (SHT30) | Yellow |
| 9 | I2C SCL (SHT30) | Green |

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