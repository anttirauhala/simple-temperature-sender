#ifndef LED_H
#define LED_H

// LED pin definitions
#define LED_BLUE_PIN 2
#define LED_GREEN_PIN 3

void initLed();
void blinkLed(int led);
void turnOnLed(int led);
void turnOffLed(int led);
void handleStatusLed(bool wifiConnected, bool awsConnected);

#endif
