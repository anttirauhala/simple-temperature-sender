#include <Arduino.h>
#include "button_led.h"
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
  initButtonLed();
  updateButtonLed();
  initSHT30();

  // Initialize AWS client (sets certificates & server)
  initializeAWSClient();

  // Try Wifi and AWS connections until successful
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
        turnOnLed();
        delay(5000);
        turnOffLed();
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
        delay(50);
        beep(300, 150);
        for (int i = 0; i < 3; i++) {
          turnOnLed();
          delay(200);
          turnOffLed();
          delay(200);
        }
        delay(5000);
      }
    }
  }

  Serial.println("\n✓ Both WiFi and AWS connected!");
  
  Serial.println("Playing startup melody...");
  playStartupMelody();
}

void loop()
{
  // Maintain WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, reconnecting...");
    connectToWiFi();
  }

  // Keep MQTT alive and reconnect if needed
  handleMQTT();
  
  updateButtonLed();
  updateSHT30Data();
  delay(10);
}