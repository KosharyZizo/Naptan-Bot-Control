package com.neptune.robot;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Set;
import java.util.UUID;

final class BluetoothSerialManager {
    interface Listener {
        void onScanStarted();
        void onDeviceFound(BluetoothDevice device);
        void onScanFinished();
        void onConnecting(String deviceName);
        void onConnected(String deviceName);
        void onLineReceived(String line);
        void onDisconnected();
        void onError(String message);
    }

    static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    private final Activity activity;
    private final BluetoothAdapter adapter;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Object socketLock = new Object();
    private Listener listener;
    private BluetoothSocket activeSocket;
    private BluetoothDevice deviceWaitingForPairing;
    private volatile boolean closed;
    private boolean receiversRegistered;

    private final BroadcastReceiver bluetoothReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (BluetoothDevice.ACTION_FOUND.equals(action)) {
                BluetoothDevice device = getDeviceExtra(intent);
                if (device != null) post(() -> {
                    if (listener != null) listener.onDeviceFound(device);
                });
            } else if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(action)) {
                post(() -> {
                    if (listener != null) listener.onScanFinished();
                });
            } else if (BluetoothDevice.ACTION_BOND_STATE_CHANGED.equals(action)) {
                BluetoothDevice device = getDeviceExtra(intent);
                if (device == null || deviceWaitingForPairing == null) return;
                if (!device.getAddress().equals(deviceWaitingForPairing.getAddress())) return;

                int state = intent.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE, BluetoothDevice.ERROR);
                if (state == BluetoothDevice.BOND_BONDED) {
                    deviceWaitingForPairing = null;
                    connectPairedDevice(device);
                } else if (state == BluetoothDevice.BOND_NONE) {
                    deviceWaitingForPairing = null;
                    post(() -> {
                        if (listener != null) listener.onError("لم يكتمل اقتران الجهاز");
                    });
                }
            }
        }
    };

    BluetoothSerialManager(Activity activity) {
        this.activity = activity;
        BluetoothManager manager =
            (BluetoothManager) activity.getSystemService(Context.BLUETOOTH_SERVICE);
        this.adapter = manager == null ? null : manager.getAdapter();
    }

    void setListener(Listener listener) {
        this.listener = listener;
    }

    boolean isBluetoothSupported() {
        return adapter != null;
    }

    boolean isBluetoothEnabled() {
        return adapter != null && adapter.isEnabled();
    }

    @SuppressLint("MissingPermission")
    ArrayList<BluetoothDevice> getPairedDevices() {
        ArrayList<BluetoothDevice> devices = new ArrayList<>();
        if (adapter == null) return devices;
        Set<BluetoothDevice> bonded = adapter.getBondedDevices();
        if (bonded != null) devices.addAll(bonded);
        return devices;
    }

    @SuppressLint("MissingPermission")
    void startDiscovery() {
        if (adapter == null || closed) return;
        try {
            registerReceiverIfNeeded();
            adapter.cancelDiscovery();
            if (listener != null) listener.onScanStarted();
            if (!adapter.startDiscovery()) {
                post(() -> {
                    if (listener != null) listener.onError("تعذر بدء البحث عن أجهزة البلوتوث");
                });
            }
        } catch (SecurityException error) {
            post(() -> {
                if (listener != null) listener.onError("يحتاج التطبيق إلى إذن الأجهزة القريبة");
            });
        }
    }

    @SuppressLint("MissingPermission")
    void stopDiscovery() {
        if (adapter == null) return;
        try {
            if (adapter.isDiscovering()) adapter.cancelDiscovery();
        } catch (SecurityException ignored) {
            // Permission may have been revoked in Android settings.
        }
    }

    @SuppressLint("MissingPermission")
    void connect(BluetoothDevice device) {
        if (device == null || closed) return;
        registerReceiverIfNeeded();
        stopDiscovery();

        try {
            String name = safeName(device);
            post(() -> {
                if (listener != null) listener.onConnecting(name);
            });

            if (device.getBondState() == BluetoothDevice.BOND_BONDED) {
                connectPairedDevice(device);
                return;
            }

            deviceWaitingForPairing = device;
            if (device.getBondState() == BluetoothDevice.BOND_BONDING) return;

            boolean pairingStarted = device.createBond();
            if (!pairingStarted && device.getBondState() != BluetoothDevice.BOND_BONDING) {
                deviceWaitingForPairing = null;
                post(() -> {
                    if (listener != null) listener.onError("تعذر بدء اقتران البلوتوث");
                });
            }
        } catch (SecurityException error) {
            post(() -> {
                if (listener != null) listener.onError("يحتاج التطبيق إلى إذن الاتصال بالبلوتوث");
            });
        }
    }

    @SuppressLint("MissingPermission")
    private void connectPairedDevice(BluetoothDevice device) {
        final String name = safeName(device);
        synchronized (socketLock) {
            if (activeSocket != null && activeSocket.isConnected()) {
                closeSocketLocked();
            }
        }

        Thread connector = new Thread(() -> {
            BluetoothSocket candidate = null;
            try {
                if (adapter != null) adapter.cancelDiscovery();
                candidate = device.createRfcommSocketToServiceRecord(SPP_UUID);
                synchronized (socketLock) {
                    if (closed) {
                        candidate.close();
                        return;
                    }
                    activeSocket = candidate;
                }
                candidate.connect();
                BluetoothSocket connectedSocket = candidate;
                post(() -> {
                    if (listener != null) listener.onConnected(name);
                });
                readLines(connectedSocket);
            } catch (IOException | SecurityException error) {
                BluetoothSocket failedSocket = candidate;
                boolean wasActive = false;
                synchronized (socketLock) {
                    if (failedSocket != null && activeSocket == failedSocket) {
                        activeSocket = null;
                        wasActive = true;
                    }
                }
                closeQuietly(failedSocket);
                if (wasActive) {
                    post(() -> {
                        if (listener != null) {
                            listener.onError("فشل الاتصال. تأكد من تشغيل HC-05 واقترانه بالهاتف");
                            listener.onDisconnected();
                        }
                    });
                }
            }
        }, "hc05-connect");
        connector.start();
    }

    private void readLines(BluetoothSocket socket) {
        ByteArrayOutputStream line = new ByteArrayOutputStream();
        byte[] buffer = new byte[512];
        try {
            InputStream input = socket.getInputStream();
            int count;
            while (!closed && socket == activeSocket && (count = input.read(buffer)) != -1) {
                for (int index = 0; index < count; index++) {
                    byte value = buffer[index];
                    if (value == '\n') {
                        String text = new String(line.toByteArray(), StandardCharsets.UTF_8).trim();
                        line.reset();
                        if (!text.isEmpty()) {
                            post(() -> {
                                if (listener != null) listener.onLineReceived(text);
                            });
                        }
                    } else if (value != '\r') {
                        if (line.size() < 4096) line.write(value);
                        else line.reset();
                    }
                }
            }
        } catch (IOException | SecurityException ignored) {
            // Socket closure is handled below.
        } finally {
            boolean wasActive = false;
            synchronized (socketLock) {
                if (activeSocket == socket) {
                    activeSocket = null;
                    wasActive = true;
                }
            }
            closeQuietly(socket);
            if (wasActive) post(() -> {
                if (listener != null) listener.onDisconnected();
            });
        }
    }

    void sendCommand(char command) {
        Thread writer = new Thread(() -> {
            try {
                OutputStream output;
                synchronized (socketLock) {
                    if (activeSocket == null || !activeSocket.isConnected()) {
                        post(() -> {
                            if (listener != null) listener.onError("الروبوت غير متصل");
                        });
                        return;
                    }
                    output = activeSocket.getOutputStream();
                }
                output.write((byte) command);
                output.flush();
            } catch (IOException | SecurityException error) {
                post(() -> {
                    if (listener != null) listener.onError("تعذر إرسال الأمر إلى الروبوت");
                });
            }
        }, "hc05-command");
        writer.start();
    }

    void disconnect() {
        synchronized (socketLock) {
            closeSocketLocked();
        }
        deviceWaitingForPairing = null;
        post(() -> {
            if (listener != null) listener.onDisconnected();
        });
    }

    void close() {
        closed = true;
        stopDiscovery();
        deviceWaitingForPairing = null;
        synchronized (socketLock) {
            closeSocketLocked();
        }
        if (receiversRegistered) {
            try {
                activity.unregisterReceiver(bluetoothReceiver);
            } catch (IllegalArgumentException ignored) {
                // Receiver was already removed.
            }
            receiversRegistered = false;
        }
        listener = null;
    }

    private void registerReceiverIfNeeded() {
        if (receiversRegistered) return;
        IntentFilter filter = new IntentFilter();
        filter.addAction(BluetoothDevice.ACTION_FOUND);
        filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
        filter.addAction(BluetoothDevice.ACTION_BOND_STATE_CHANGED);
        if (Build.VERSION.SDK_INT >= 33) {
            activity.registerReceiver(bluetoothReceiver, filter, Context.RECEIVER_EXPORTED);
        } else {
            activity.registerReceiver(bluetoothReceiver, filter);
        }
        receiversRegistered = true;
    }

    @SuppressWarnings("deprecation")
    private BluetoothDevice getDeviceExtra(Intent intent) {
        if (Build.VERSION.SDK_INT >= 33) {
            return intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice.class);
        }
        return intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
    }

    @SuppressLint("MissingPermission")
    private String safeName(BluetoothDevice device) {
        String name = device.getName();
        return name == null || name.trim().isEmpty() ? device.getAddress() : name.trim();
    }

    private void closeSocketLocked() {
        BluetoothSocket socket = activeSocket;
        activeSocket = null;
        closeQuietly(socket);
    }

    private void closeQuietly(BluetoothSocket socket) {
        if (socket == null) return;
        try {
            socket.close();
        } catch (IOException ignored) {
            // Already closed.
        }
    }

    private void post(Runnable runnable) {
        mainHandler.post(runnable);
    }
}
