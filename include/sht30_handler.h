#ifndef SHT30_HANDLER_H
#define SHT30_HANDLER_H

// External sensor data (updated by updateSHT30Data)
extern float sensorTemperature;
extern float sensorHumidity;

/**
 * Initialize SHT30 sensor
 */
void initSHT30();

/**
 * Read sensor data and publish to AWS if interval elapsed
 * Handles 5-minute measurement interval
 */
void updateSHT30Data();

#endif
