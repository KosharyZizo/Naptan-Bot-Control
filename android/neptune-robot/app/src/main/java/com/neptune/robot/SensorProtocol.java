package com.neptune.robot;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Locale;

/**
 * Accepts one sensor reading per line:
 *   {"temperature":25.4,"humidity":61.2,"soilMoisture":47}
 *   25.4,61.2,47
 *   temperature=25.4,humidity=61.2,soilMoisture=47
 */
final class SensorProtocol {
    static final class Readings {
        final Double temperature;
        final Double humidity;
        final Double soilMoisture;

        Readings(Double temperature, Double humidity, Double soilMoisture) {
            this.temperature = temperature;
            this.humidity = humidity;
            this.soilMoisture = soilMoisture;
        }

        boolean isEmpty() {
            return temperature == null && humidity == null && soilMoisture == null;
        }
    }

    private SensorProtocol() {}

    static Readings parse(String input) {
        if (input == null) return null;
        String line = input.trim();
        if (line.isEmpty()) return null;

        try {
            if (line.startsWith("{")) {
                JSONObject object = new JSONObject(line);
                Readings readings = new Readings(
                    number(object, "temperature", "temp", "temperatureC"),
                    number(object, "humidity", "airHumidity"),
                    number(object, "soilMoisture", "soil_moisture", "soil", "moisture")
                );
                return readings.isEmpty() ? null : readings;
            }
        } catch (JSONException ignored) {
            // Continue to the key/value and CSV parsers.
        }

        Double temperature = null;
        Double humidity = null;
        Double soilMoisture = null;
        boolean foundKey = false;

        String[] parts = line.split("[,;]");
        for (String part : parts) {
            String[] pair = part.trim().split("[:=]", 2);
            if (pair.length != 2) continue;

            String key = normalize(pair[0]);
            Double value = parseNumber(pair[1]);
            if (value == null) continue;
            foundKey = true;

            if (key.equals("temperature") || key.equals("temp") || key.equals("temperaturec")) {
                temperature = value;
            } else if (key.equals("humidity") || key.equals("airhumidity")) {
                humidity = value;
            } else if (key.equals("soilmoisture") || key.equals("soil") || key.equals("moisture")) {
                soilMoisture = value;
            }
        }

        if (foundKey) {
            Readings readings = new Readings(temperature, humidity, soilMoisture);
            return readings.isEmpty() ? null : readings;
        }

        if (parts.length >= 3) {
            Double csvTemperature = parseNumber(parts[0]);
            Double csvHumidity = parseNumber(parts[1]);
            Double csvSoilMoisture = parseNumber(parts[2]);
            Readings readings = new Readings(csvTemperature, csvHumidity, csvSoilMoisture);
            return readings.isEmpty() ? null : readings;
        }

        return null;
    }

    private static Double number(JSONObject object, String... keys) {
        for (String key : keys) {
            if (!object.has(key) || object.isNull(key)) continue;
            Object raw = object.opt(key);
            if (raw instanceof Number) {
                double value = ((Number) raw).doubleValue();
                if (Double.isFinite(value)) return value;
            } else if (raw instanceof String) {
                Double value = parseNumber((String) raw);
                if (value != null) return value;
            }
        }
        return null;
    }

    private static String normalize(String key) {
        return key.toLowerCase(Locale.ROOT).replace("_", "").replace("-", "").trim();
    }

    private static Double parseNumber(String raw) {
        try {
            double value = Double.parseDouble(raw.trim());
            return Double.isFinite(value) ? value : null;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
