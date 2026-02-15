#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"
#include <esp_wifi.h>
#include <time.h>
#include <switch.h>
#include <buzzer.h>

WiFiClientSecure espClient;
PubSubClient client(espClient);

static void handleWiFiEvent(WiFiEvent_t event, WiFiEventInfo_t info) {
  if (event == ARDUINO_EVENT_WIFI_STA_DISCONNECTED) {
    Serial.print("WiFi disconnected, reason: ");
    Serial.println(info.wifi_sta_disconnected.reason);
  }
}

static const char *wifiStatusToString(wl_status_t status) {
  switch (status) {
    case WL_IDLE_STATUS:
      return "IDLE";
    case WL_NO_SSID_AVAIL:
      return "NO_SSID_AVAIL";
    case WL_SCAN_COMPLETED:
      return "SCAN_COMPLETED";
    case WL_CONNECTED:
      return "CONNECTED";
    case WL_CONNECT_FAILED:
      return "CONNECT_FAILED";
    case WL_CONNECTION_LOST:
      return "CONNECTION_LOST";
    case WL_DISCONNECTED:
      return "DISCONNECTED";
    default:
      return "UNKNOWN";
  }
}

// Initialize AWS IoT client (only once)
void initializeAWSClient() {
  Serial.println("Initializing AWS IoT client...");
  
  Serial.println("Setting CA certificate...");
  espClient.setCACert(AWS_CERT_CA);
  
  Serial.println("Setting client certificate...");
  espClient.setCertificate(AWS_CERT_CRT);
  
  Serial.println("Setting private key...");
  espClient.setPrivateKey(AWS_CERT_PRIVATE);
  
  Serial.print("Setting MQTT broker: ");
  Serial.print(AWS_IOT_ENDPOINT);
  Serial.print(":");
  Serial.println(MQTT_PORT);
  client.setServer(AWS_IOT_ENDPOINT, MQTT_PORT);
  
  client.setBufferSize(512);
  Serial.println("Set MQTT buffer to 512 bytes");
  
  client.setKeepAlive(15);
  Serial.println("Set keepalive to 15 seconds");
  
  client.setSocketTimeout(30);
  Serial.println("Set socket timeout to 30 seconds");
  
  Serial.println("AWS IoT client initialized!");
}

bool connectToWiFi() {
  Serial.println("Connecting to WiFi...");
  
  WiFi.mode(WIFI_STA);

  static bool wifiEventRegistered = false;
  if (!wifiEventRegistered) {
    WiFi.onEvent(handleWiFiEvent);
    wifiEventRegistered = true;
  }

/*   // Scan first (for diagnostics only)
  Serial.println("Scanning WiFi networks...");
  int networkCount = WiFi.scanNetworks();
  if (networkCount <= 0) {
    Serial.println("No WiFi networks found");
  } else {
    Serial.print("Found ");
    Serial.print(networkCount);
    Serial.println(" networks:");
    for (int i = 0; i < networkCount; ++i) {
      Serial.print("- ");
      Serial.print(WiFi.SSID(i));
      Serial.print(" ");
      Serial.print(WiFi.RSSI(i));
      Serial.print(" dBm, ch ");
      Serial.println(WiFi.channel(i));
    }
  }
  WiFi.scanDelete();  // Clear scan results before connecting */

  Serial.println("Attempting to connect to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  WiFi.setTxPower(WIFI_POWER_8_5dBm); // To connect easier
  
  int attempts = 0;
  wl_status_t lastStatus = WL_DISCONNECTED;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    wl_status_t status = WiFi.status();
    if (status != lastStatus) {
      Serial.print(" [");
      Serial.print(wifiStatusToString(status));
      Serial.print("]");
      lastStatus = status;
    }
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    
    // Disable WiFi power save to keep MQTT connection stable
    WiFi.setSleep(false);
    Serial.println("WiFi power save disabled");
    
    // Sync time via NTP
    configTime(2 * 3600, 0, "pool.ntp.org", "time.nist.gov");
    Serial.print("Syncing NTP time");
    time_t now = time(nullptr);
    int ntpAttempts = 0;
    while (now < 8 * 3600 * 2 && ntpAttempts < 20) {
      delay(500);
      Serial.print(".");
      now = time(nullptr);
      ntpAttempts++;
    }
    Serial.println();
    struct tm timeinfo;
    localtime_r(&now, &timeinfo);
    Serial.print("Current time: ");
    Serial.print(asctime(&timeinfo));
    Serial.print("Unix timestamp: ");
    Serial.print((unsigned long)now);
    Serial.print(" (");
    Serial.print((unsigned long long)now * 1000ULL);
    Serial.println(" ms)");
    
    return true;
  } else {
    Serial.println("\nFailed to connect to WiFi!");
    Serial.print("WiFi status: ");
    Serial.println(wifiStatusToString(WiFi.status()));
    wifi_ap_record_t apInfo;
    esp_err_t apErr = esp_wifi_sta_get_ap_info(&apInfo);
    if (apErr == ESP_OK) {
      Serial.print("AP channel: ");
      Serial.print(apInfo.primary);
      Serial.print(", RSSI: ");
      Serial.println(apInfo.rssi);
    } else {
      Serial.print("esp_wifi_sta_get_ap_info failed: ");
      Serial.println(apErr);
    }
    return false;
  }
}

bool connectToAWS() {
  // Check WiFi first
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, cannot connect to AWS!");
    return false;
  }
  
  // If already connected, return true
  if (client.connected()) {
    return true;
  }
  
  Serial.println("Connecting to AWS IoT Core...");
  
  // Try to connect - don't disconnect first, let old connection timeout naturally
  Serial.print("MQTT connecting... ");
  
  if (client.connect(AWS_CLIENT_ID)) {
    Serial.println("Connected!");
    // Don't subscribe - policy doesn't allow it and causes disconnect
    return true;
  } else {
    Serial.print("Failed (state=");
    Serial.print(client.state());
    Serial.println(")");
    return false;
  }
}

void publishMeasurement(float temperature, float humidity) {
  if (!client.connected()) {
    Serial.println("Cannot publish - MQTT not connected");
    if(isSwitchOn())
    {
        beep(300, 50);
    }
    return;
  }
  
  // Create JSON
  DynamicJsonDocument doc(256);
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  
  // Real timestamp (ISO 8601)
  time_t now = time(nullptr);
  struct tm timeinfo;
  localtime_r(&now, &timeinfo);
  char timeStr[25];
  strftime(timeStr, sizeof(timeStr), "%Y-%m-%dT%H:%M:%S", &timeinfo);
  doc["timestamp"] = timeStr;
  
  Serial.print("Current Unix timestamp: ");
  Serial.print((unsigned long)now);
  Serial.print(" (");
  Serial.print((unsigned long long)now * 1000ULL);
  Serial.println(" ms)");
  
  // Convert to string
  String payload;
  serializeJson(doc, payload);
  
  // Send
  Serial.print("Publishing to topic: ");
  Serial.println(MQTT_TOPIC_PUBLISH);
  bool published = client.publish(MQTT_TOPIC_PUBLISH, payload.c_str());
  Serial.print("Publish result: ");
  Serial.println(published ? "SUCCESS" : "FAILED");
  Serial.print("Payload: ");
  Serial.println(payload);
}

void handleMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  client.loop();

  if (!client.connected()) {
    static unsigned long lastMQTTAttempt = 0;
    unsigned long now = millis();
    if (now - lastMQTTAttempt > 30000) {
      lastMQTTAttempt = now;
      Serial.println("MQTT reconnecting...");
      connectToAWS();
    }
  }
}