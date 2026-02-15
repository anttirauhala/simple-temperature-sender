#include <Arduino.h>
#include <led.h>

void initLed()
{
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_BLUE_PIN, OUTPUT);
}

void blinkLed(int led)
{
  digitalWrite(led, HIGH);
  delay(100);
  digitalWrite(led, LOW);
  delay(100);
}

void turnOnLed(int led)
{
  digitalWrite(led, HIGH);
}

void turnOffLed(int led)
{
  digitalWrite(led, LOW);
}

void handleStatusLed(bool wifiConnected, bool awsConnected)
{
  static bool wasConnectedLastTime = true;
  
  bool allSystemsOk = wifiConnected && awsConnected;
  
  // Update green LED based on connection status
  if (allSystemsOk && !wasConnectedLastTime) {
    // Just reconnected - turn on LED
    turnOnLed(LED_GREEN_PIN);
    Serial.println("✓ All systems OK - Green LED ON");
  } else if (!allSystemsOk && wasConnectedLastTime) {
    // Just lost connection - turn off LED
    turnOffLed(LED_GREEN_PIN);
    if (!wifiConnected) Serial.println("✗ WiFi disconnected - Green LED OFF");
    if (!awsConnected) Serial.println("✗ AWS disconnected - Green LED OFF");
  }
  wasConnectedLastTime = allSystemsOk;
}
