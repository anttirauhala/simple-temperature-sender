# ESP32 AWS IoT Core MQTT Setup

## 1. Create IoT Thing and Certificates in AWS Console

### AWS IoT Core Console:
1. Navigate to **AWS IoT Core console**
2. Select **Manage** → **All devices** → **Things**
3. Click **Create thing**
4. Name the device: `TemperatureSender-ESP32`
5. Click **Create**

### Certificate Creation and Attachment:
AWS will automatically create and attach the certificate to your Thing and Policy:

1. After Thing creation, you'll be offered to **download credentials**
2. Download and save:
   - `*.pem.crt` (device certificate)
   - `*.pem.key` (private key)
   - `AmazonRootCA1.pem` (root CA)
3. The certificate is automatically attached to both the Thing and `TemperatureSenderPublishPolicy`

**✅ No need for manual attachment steps - it's already done!**

### Find Your AWS IoT Endpoint:

**Option A: AWS Console**
1. Go to **AWS IoT Core → Settings**
2. Under **Device data endpoint**, copy the endpoint URL
3. It should look like: `xxxxxxxxxxxxx-ats.iot.eu-west-1.amazonaws.com`

**Option B: AWS CLI**
```bash
aws iot describe-endpoint --endpoint-type iot:Data-ATS --region eu-west-1
```

You'll need this endpoint for `config.h` in step 4

## 2. Copy Certificates to ESP32 Project

Create a `certs/` directory in the project:

```bash
mkdir -p certs/
# Copy your downloaded files:
# - device-certificate.pem.crt
# - private.pem.key
# - AmazonRootCA1.pem
```

## 3. Arduino/PlatformIO Libraries

**Already configured in `platformio.ini`:**

✅ No action needed - PlatformIO will automatically download these when you build the project.

## 4. WiFi + MQTT Configuration

Create `src/config.h`:

```cpp
#ifndef AWS_CONFIG_H
#define AWS_CONFIG_H

// WiFi settings
#define WIFI_SSID "YOUR_SSID"
#define WIFI_PASSWORD "YOUR_PASSWORD"

// AWS IoT settings
#define AWS_IOT_ENDPOINT "xxxxxxxxxxxxx-ats.iot.eu-west-1.amazonaws.com"
#define MQTT_PORT 8883
#define AWS_CLIENT_ID "TemperatureSender-ESP32"

// MQTT topic
#define MQTT_TOPIC_PUBLISH "temperatureSender/measurements"

// Pem certificates (base64 encoded or inline)
// See next section

#endif
```

## 5. Certificates for ESP32

### Option A: Flash Memory (SPIFFS)

```cpp
// LittleFS or SPIFFS to memory
#include <SPIFFS.h>

void setup() {
  SPIFFS.begin(true);  // Format if needed
  
  // Copy certificates from certs/ directory
  // to LittleFS
}
```

### Option B: Inline PEM (simpler)

Convert PEM to base64 and add to `config.h`:

```cpp
const char AWS_CERT_CA[] = R"(
-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmXjzQzA...
-----END CERTIFICATE-----
)";

const char AWS_CERT_CRT[] = R"(
-----BEGIN CERTIFICATE-----
MIIDWTCCAkGgAwIBAgIUHQ...
-----END CERTIFICATE-----
)";

const char AWS_CERT_PRIVATE[] = R"(
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA3m...
-----END RSA PRIVATE KEY-----
)";
```

## Further Reading

- [AWS IoT Core Documentation](https://docs.aws.amazon.com/iot/)
- [PubSubClient Library](https://github.com/knolleary/pubsubclient)
- [ArduinoJson](https://arduinojson.org/)
