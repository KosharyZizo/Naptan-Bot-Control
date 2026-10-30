package com.neptune.robot;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Locale;

/**
 * Accepts one sensor reading per line:
 *   {"temperature":25.4,"humidity":61.2,"soilMoisture":47}
 *   25.4,61.2,47
 *   temperature=25.4,humidity=61.2,soilMoisture=47
 *   Temp:22.20 Hum:55.00 Soil:0% Rain:0
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
                    number(object, "humidity", "airHumidity", "hum"),
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

        String[] parts = line.split("[,;\\s]+");
        for (String part : parts) {
            String[] pair = part.trim().split("[:=]", 2);
            if (pair.length != 2) continue;

            String key = normalize(pair[0]);
            Double value = parseNumber(pair[1]);
            if (value == null) continue;
            foundKey = true;

            if (key.equals("temperature") || key.equals("temp") || key.equals("temperaturec")) {
                temperature = value;
            } else if (key.equals("humidity") || key.equals("airhumidity") || key.equals("hum")) {
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
            if (object.has(key) && !object.isNull(key)) {
                Double value = jsonNumber(object.opt(key));
                if (value != null) return value;
            }

            String normalizedKey = normalize(key);
            java.util.Iterator<String> names = object.keys();
            while (names.hasNext()) {
                String name = names.next();
                if (!normalizedKey.equals(normalize(name)) || object.isNull(name)) continue;
                Double value = jsonNumber(object.opt(name));
                if (value != null) return value;
            }
        }
        return null;
    }

    private static Double jsonNumber(Object raw) {
        if (raw instanceof Number) {
            double value = ((Number) raw).doubleValue();
            return Double.isFinite(value) ? value : null;
        }
        return raw instanceof String ? parseNumber((String) raw) : null;
    }

    private static String normalize(String key) {
        StringBuilder normalized = new StringBuilder();
        for (int index = 0; index < key.length(); index++) {
            char character = key.charAt(index);
            if (Character.isLetterOrDigit(character)) {
                normalized.append(Character.toLowerCase(character));
            }
        }
        return normalized.toString().toLowerCase(Locale.ROOT);
    }

    private static Double parseNumber(String raw) {
        try {
            String token = raw.trim();
            if (token.endsWith("%")) {
                token = token.substring(0, token.length() - 1).trim();
            } else if (token.endsWith("°C") || token.endsWith("°c")) {
                token = token.substring(0, token.length() - 2).trim();
            } else if (token.endsWith("C") || token.endsWith("c")) {
                token = token.substring(0, token.length() - 1).trim();
            }
            double value = Double.parseDouble(token);
            return Double.isFinite(value) ? value : null;
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
