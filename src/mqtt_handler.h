#ifndef MQTT_HANDLER_H
#define MQTT_HANDLER_H

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// External client objects (defined in mqtt_handler.cpp)
extern WiFiClientSecure espClient;
extern PubSubClient client;

/**
 * Connect ESP32 to WiFi network
 * Uses WIFI_SSID and WIFI_PASSWORD from config.h
 * @return true if connected successfully, false otherwise
 */
bool connectToWiFi();

/**
 * Initialize AWS IoT Core MQTT client (certificates & server)
 * Call this once in setup() before connecting
 */
void initializeAWSClient();

/**
 * Connect to AWS IoT Core via MQTT
 * Must call initializeAWSClient() first
 * @return true if connected successfully, false otherwise
 */
bool connectToAWS();

/**
 * Publish temperature and humidity measurement to AWS IoT Core
 * @param temperature Temperature value in Celsius
 * @param humidity Humidity value in percentage
 */
void publishMeasurement(float temperature, float humidity);

/**
 * Handle MQTT client loop
 * Call this regularly in main loop to process MQTT messages
 */
void handleMQTT();

#endif // MQTT_HANDLER_H
