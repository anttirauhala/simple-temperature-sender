#include <Arduino.h>

#define SWITCH_PIN 4

bool isSwitchOn()
{
  return digitalRead(SWITCH_PIN) == HIGH;
}
