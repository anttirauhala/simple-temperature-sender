#include <Arduino.h>

#define BTN_PIN 4
#define BTN_LED_PIN 2

void initButtonLed()
{
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(BTN_LED_PIN, OUTPUT);
  digitalWrite(BTN_LED_PIN, LOW);
}

bool isButtonPressed()
{
  return digitalRead(BTN_PIN) == LOW;
}

void updateButtonLed()
{
  digitalWrite(BTN_LED_PIN, isButtonPressed() ? HIGH : LOW);
}
