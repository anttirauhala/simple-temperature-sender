#include <Arduino.h>

#define LED_GREEN_PIN 3

void initLed()
{
  pinMode(LED_GREEN_PIN, OUTPUT);
}

void blinkLed()
{
  digitalWrite(LED_GREEN_PIN, HIGH);
  delay(100);
  digitalWrite(LED_GREEN_PIN, LOW);
  delay(100);
}

void turnOnLed()
{
  digitalWrite(LED_GREEN_PIN, HIGH);
}

void turnOffLed()
{
  digitalWrite(LED_GREEN_PIN, LOW);
}
