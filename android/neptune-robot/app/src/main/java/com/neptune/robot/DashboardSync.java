package com.neptune.robot;

import android.os.Handler;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

final class DashboardSync {
    interface Callback {
        void onComplete(boolean success);
    }

    private final Handler mainHandler;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();

    DashboardSync(Handler mainHandler) {
        this.mainHandler = mainHandler;
    }

    static String normalizeBaseUrl(String value) {
        if (value == null) return null;
        String input = value.trim();
        if (input.isEmpty()) return "";
        try {
            URL url = new URL(input);
            if (!"https".equalsIgnoreCase(url.getProtocol())) return null;
            if (url.getHost() == null || url.getHost().trim().isEmpty()) return null;
            String path = url.getPath() == null ? "" : url.getPath().replaceAll("/+$", "");
            int port = url.getPort();
            return "https://" + url.getHost() + (port > 0 ? ":" + port : "") + path;
        } catch (Exception ignored) {
            return null;
        }
    }

    void sendConnection(String baseUrl, boolean connected, Callback callback) {
        JSONObject body = new JSONObject();
        try {
            body.put("connected", connected);
            body.put("obstacleDetected", false);
            body.put("movementProblem", false);
            body.put("systemError", false);
            body.put("cameraActive", false);
        } catch (JSONException impossible) {
            complete(callback, false);
            return;
        }
        post(baseUrl, "/api/robot/status", body, callback);
    }

    void sendSensors(String baseUrl, double temperature, double humidity, double soilMoisture, Callback callback) {
        JSONObject body = new JSONObject();
        try {
            body.put("temperature", temperature);
            body.put("humidity", humidity);
            body.put("soilMoisture", soilMoisture);
        } catch (JSONException impossible) {
            complete(callback, false);
            return;
        }
        post(baseUrl, "/api/robot/sensor-data", body, callback);
    }

    void close() {
        worker.shutdown();
    }

    private void post(String baseUrl, String path, JSONObject body, Callback callback) {
        if (baseUrl == null || baseUrl.trim().isEmpty()) {
            complete(callback, false);
            return;
        }
        worker.execute(() -> {
            HttpURLConnection connection = null;
            boolean success = false;
            try {
                connection = (HttpURLConnection) new URL(baseUrl + path).openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(5000);
                connection.setReadTimeout(5000);
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                byte[] bytes = body.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
                connection.setFixedLengthStreamingMode(bytes.length);
                try (OutputStream output = connection.getOutputStream()) {
                    output.write(bytes);
                }
                int status = connection.getResponseCode();
                success = status >= 200 && status < 300;
            } catch (IOException | RuntimeException ignored) {
                success = false;
            } finally {
                if (connection != null) connection.disconnect();
            }
            complete(callback, success);
        });
    }

    private void complete(Callback callback, boolean success) {
        if (callback != null) mainHandler.post(() -> callback.onComplete(success));
    }
}
