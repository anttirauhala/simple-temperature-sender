#include <Arduino.h>
#include "switch.h"
#include "sht30_handler.h"
#include "buzzer.h"
#include "led.h"
#include "mqtt_handler.h"

void setup()
{
  Serial.begin(115200);
  delay(500);

  // Initialize hardware
  initBuzzer();
  initLed();
  initSHT30();

  // Initialize AWS client (sets certificates & server)
  initializeAWSClient();

  // Try Wifi and AWS connections until successful6
  bool wifiConnected = false;
  bool awsConnected = false;
  int attempts = 0;
  
  while (!wifiConnected || !awsConnected) {
    attempts++;
    Serial.print("\n=== Connection Attempt ");
    Serial.print(attempts);
    Serial.println(" ===");
    
    // Try WiFi
    if (!wifiConnected) {
      wifiConnected = connectToWiFi();
      if (!wifiConnected) {
        Serial.println("WiFi failed - beeping and retrying in 5s");
        beep(300, 150);
        delay(5000);
        continue;
      }
    }
    
    // Try AWS (only if WiFi connected)
    if (wifiConnected && !awsConnected) {
      Serial.println("Connecting to AWS...");
      awsConnected = connectToAWS();
      if (!awsConnected) {
        Serial.println("AWS failed - beeping and retrying in 5s");
        beep(300, 150);
        delay(50);
        beep(300, 150);
        delay(5000);
      }
    }
  }

  Serial.println("\n✓ Both WiFi and AWS connected!");
  
  // Turn on green LED to indicate all systems OK
  turnOnLed(LED_GREEN_PIN);
  
  Serial.println("Playing startup melody...");
  turnOnLed(LED_BLUE_PIN);
  playStartupMelody();
  turnOffLed(LED_BLUE_PIN);
}

void loop()
{
  // Check current connection status
  bool wifiOk = (WiFi.status() == WL_CONNECTED);
  bool awsOk = client.connected();
  
  // Handle status LED (green)
  handleStatusLed(wifiOk, awsOk);
  
  // Maintain WiFi connection
  if (!wifiOk) {
    Serial.println("WiFi disconnected, reconnecting...");
    connectToWiFi();
  }

  // Keep MQTT alive and reconnect if needed
  handleMQTT();
  
  updateSHT30Data();
  delay(10);
}