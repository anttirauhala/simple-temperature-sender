#include <Arduino.h>

#define BUZZER 5

void initBuzzer()
{
  pinMode(BUZZER, OUTPUT);
}

void beep(int freq, int duration_ms)
{
  int period_us = 1000000 / freq;
  int cycles = (duration_ms * 1000) / period_us;

  for (int i = 0; i < cycles; i++)
  {
    digitalWrite(BUZZER, HIGH);
    delayMicroseconds(period_us / 2);
    digitalWrite(BUZZER, LOW);
    delayMicroseconds(period_us / 2);
  }
}

void playStartupMelody()
{
  beep(1500, 150);
  delay(50);

  beep(1000, 150);
  delay(50);

  beep(1500, 150);
  delay(50);

  beep(2000, 400);
}
