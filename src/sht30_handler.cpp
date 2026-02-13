#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_SHT31.h>
#include <buzzer.h>
#include <led.h>
#include <button_led.h>
#include "mqtt_handler.h"

// I2C pins for SHT30
#define SDA_PIN 8
#define SCL_PIN 9

// Sensor reading interval (2 seconds)
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 2000;

// MQTT publish interval
unsigned long lastPublishTime = 0;
const unsigned long PUBLISH_INTERVAL = 5 * 60 * 1000;

// Current sensor values
float sensorTemperature = 0;
float sensorHumidity = 0;

Adafruit_SHT31 sht31 = Adafruit_SHT31();

void initSHT30()
{
    Wire.begin(SDA_PIN, SCL_PIN);

    if (!sht31.begin(0x44))
    {
        Serial.println("SHT30 not responding");
        beep(1000, 200);
        delay(500);
        beep(1000, 200);
        delay(500);
        beep(1000, 200);
        delay(500);
        beep(1000, 200);
        while (1)
        {
            delay(350);
            blinkLed();
        }
    }

    Serial.println("SHT30 OK");
    lastReadTime = millis();
}

void updateSHT30Data()
{
    unsigned long currentTime = millis();

    if (currentTime - lastReadTime >= READ_INTERVAL)
    {
        lastReadTime = currentTime;
        if (isButtonPressed())
        {
            beep(2000, 50);
        }
        blinkLed();

        float t = sht31.readTemperature();
        float h = sht31.readHumidity();

        if (!isnan(t) && !isnan(h))
        {
            sensorTemperature = t;
            sensorHumidity = h;

            Serial.print("Temperature: ");
            Serial.print(t);
            Serial.print(" °C   ");

            Serial.print("Humidity: ");
            Serial.print(h);
            Serial.println(" %RH");
        }
        else
        {
            Serial.println("Reading failed");
        }
    }

    // Publish to AWS every 5 minutes
    if (currentTime - lastPublishTime >= PUBLISH_INTERVAL)
    {
        if (isButtonPressed())
        {
            beep(3000, 50);
        }
        blinkLed();
        lastPublishTime = currentTime;
        publishMeasurement(sensorTemperature, sensorHumidity);
        Serial.println("Data published to AWS");
    }
}
