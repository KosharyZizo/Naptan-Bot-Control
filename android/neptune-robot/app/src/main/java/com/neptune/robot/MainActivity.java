package com.neptune.robot;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.bluetooth.BluetoothDevice;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.content.SharedPreferences;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.text.InputType;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.Locale;

public class MainActivity extends Activity implements BluetoothSerialManager.Listener {
    private static final int REQUEST_BLUETOOTH_PERMISSIONS = 4101;
    private static final int REQUEST_ENABLE_BLUETOOTH = 4102;

    private static final int BG = Color.rgb(7, 18, 13);
    private static final int SURFACE = Color.rgb(16, 31, 23);
    private static final int SURFACE_ALT = Color.rgb(22, 42, 31);
    private static final int TEXT = Color.rgb(235, 245, 238);
    private static final int MUTED = Color.rgb(156, 177, 163);
    private static final int GREEN = Color.rgb(82, 214, 138);
    private static final int RED = Color.rgb(255, 107, 107);

    private BluetoothSerialManager bluetooth;
    private DashboardSync dashboardSync;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private TextView connectionLabel;
    private TextView scanMessage;
    private TextView syncStatus;
    private TextView temperatureValue;
    private TextView humidityValue;
    private TextView soilValue;
    private Button connectionButton;
    private EditText serverUrlInput;
    private AlertDialog deviceDialog;
    private ArrayAdapter<String> deviceAdapter;
    private ListView deviceList;
    private final LinkedHashMap<String, BluetoothDevice> devices = new LinkedHashMap<>();
    private Double temperature;
    private Double humidity;
    private Double soilMoisture;
    private boolean connected;
    private String apiBaseUrl = "";
    private final Runnable heartbeat = new Runnable() {
        @Override
        public void run() {
            if (!connected) return;
            publishConnection(true);
            mainHandler.postDelayed(this, 5000);
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        window.setStatusBarColor(BG);
        window.setNavigationBarColor(BG);
        window.getDecorView().setSystemUiVisibility(0);

        bluetooth = new BluetoothSerialManager(this);
        bluetooth.setListener(this);
        dashboardSync = new DashboardSync(mainHandler);
        SharedPreferences preferences = getSharedPreferences("neptune-settings", MODE_PRIVATE);
        apiBaseUrl = preferences.getString("dashboard_url", "");
        setContentView(buildScreen());
        updateConnectionUi();
        updateSyncStatus("أدخل رابط لوحة الويب للمزامنة");
    }

    private View buildScreen() {
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(BG);

        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        page.setPadding(dp(20), dp(20), dp(20), dp(28));
        scroll.addView(page, new ScrollView.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        ));

        TextView brand = text("نبتان", 30, TEXT, true);
        page.addView(brand);
        TextView subtitle = text("نظام مراقبة الحساسات والتحكم", 15, MUTED, false);
        LinearLayout.LayoutParams subtitleParams = margins(0, 4, 0, 18);
        page.addView(subtitle, subtitleParams);

        LinearLayout connectionCard = card();
        page.addView(connectionCard, margins(0, 0, 0, 16));
        TextView cardTitle = text("اتصال البلوتوث", 18, TEXT, true);
        connectionCard.addView(cardTitle);
        connectionLabel = text("غير متصل — ابحث عن HC-05", 14, MUTED, false);
        connectionCard.addView(connectionLabel, margins(0, 8, 0, 14));
        connectionButton = button("ابحث عن الأجهزة", GREEN, BG);
        connectionCard.addView(connectionButton, matchWidth());
        connectionButton.setOnClickListener(view -> {
            if (connected) {
                bluetooth.disconnect();
            } else {
                requestBluetoothPermissionsThenScan();
            }
        });
        TextView pairingHint = text("إذا لم يظهر HC-05، فعّل البلوتوث واقترن به من إعدادات الهاتف أولاً.", 12, MUTED, false);
        connectionCard.addView(pairingHint, margins(0, 12, 0, 0));

        TextView sensorsTitle = text("قراءات الحساسات", 19, TEXT, true);
        page.addView(sensorsTitle, margins(0, 0, 0, 10));

        temperatureValue = addSensorCard(page, "درجة الحرارة", "°C");
        humidityValue = addSensorCard(page, "رطوبة الهواء", "%");
        soilValue = addSensorCard(page, "رطوبة التربة", "%");

        TextView controlsTitle = text("التحكم في الحركة", 19, TEXT, true);
        page.addView(controlsTitle, margins(0, 12, 0, 10));
        LinearLayout controls = card();
        page.addView(controls, margins(0, 0, 0, 12));

        addControlRow(controls, null, control("أمام\nF", 'F'), null);
        addControlRow(controls, control("يسار\nL", 'L'), control("توقف\nS", 'S'), control("يمين\nR", 'R'));
        addControlRow(controls, null, control("خلف\nB", 'B'), null);

        Button camera = button("وضع المراقبة  •  K", SURFACE_ALT, TEXT);
        controls.addView(camera, margins(0, 8, 0, 0));
        camera.setOnClickListener(view -> sendCommand('K'));

        TextView protocolHint = text(
            "يستقبل التطبيق سطراً واحداً لكل قراءة، بصيغة JSON أو CSV. التفاصيل في README.",
            12, MUTED, false
        );
        page.addView(protocolHint, margins(2, 0, 2, 0));

        LinearLayout syncCard = card();
        page.addView(syncCard, margins(0, 18, 0, 0));
        syncCard.addView(text("مزامنة لوحة الويب", 17, TEXT, true));
        syncCard.addView(text("اختياري: أدخل رابط موقع نبتان لإظهار القراءات عليه أيضاً.", 12, MUTED, false),
            margins(0, 6, 0, 10));
        serverUrlInput = new EditText(this);
        serverUrlInput.setSingleLine(true);
        serverUrlInput.setTextSize(14);
        serverUrlInput.setTextColor(TEXT);
        serverUrlInput.setHintTextColor(MUTED);
        serverUrlInput.setHint("https://example.replit.app");
        serverUrlInput.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        serverUrlInput.setPadding(dp(12), dp(10), dp(12), dp(10));
        serverUrlInput.setBackground(rounded(SURFACE_ALT, dp(12), Color.rgb(34, 58, 43)));
        serverUrlInput.setText(apiBaseUrl);
        syncCard.addView(serverUrlInput, margins(0, 0, 0, 10));
        Button saveUrl = button("حفظ رابط لوحة الويب", SURFACE_ALT, TEXT);
        syncCard.addView(saveUrl, matchWidth());
        saveUrl.setOnClickListener(view -> saveDashboardUrl());
        syncStatus = text("أدخل رابط لوحة الويب للمزامنة", 12, MUTED, false);
        syncCard.addView(syncStatus, margins(0, 8, 0, 0));
        return scroll;
    }

    private TextView addSensorCard(LinearLayout parent, String title, String unit) {
        LinearLayout sensor = card();
        parent.addView(sensor, margins(0, 0, 0, 10));
        TextView label = text(title, 14, MUTED, true);
        sensor.addView(label);
        LinearLayout valueRow = new LinearLayout(this);
        valueRow.setOrientation(LinearLayout.HORIZONTAL);
        valueRow.setGravity(Gravity.CENTER_VERTICAL);
        sensor.addView(valueRow, margins(0, 5, 0, 0));
        TextView value = text("--", 30, TEXT, true);
        value.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        valueRow.addView(value);
        TextView suffix = text("  " + unit, 15, MUTED, false);
        valueRow.addView(suffix);
        return value;
    }

    private View control(String label, char command) {
        Button control = button(label, command == 'S' ? Color.rgb(89, 35, 39) : SURFACE_ALT, TEXT);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(0, dp(64), 1);
        params.setMargins(dp(4), dp(4), dp(4), dp(4));
        control.setLayoutParams(params);
        control.setOnClickListener(view -> sendCommand(command));
        return control;
    }

    private void addControlRow(LinearLayout parent, View left, View center, View right) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setLayoutDirection(View.LAYOUT_DIRECTION_LTR);
        if (left == null) row.addView(spacer(), new LinearLayout.LayoutParams(0, dp(64), 1));
        else row.addView(left);
        if (center == null) row.addView(spacer(), new LinearLayout.LayoutParams(0, dp(64), 1));
        else row.addView(center);
        if (right == null) row.addView(spacer(), new LinearLayout.LayoutParams(0, dp(64), 1));
        else row.addView(right);
        parent.addView(row);
    }

    private View spacer() {
        return new View(this);
    }

    private LinearLayout card() {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        panel.setPadding(dp(16), dp(16), dp(16), dp(16));
        panel.setBackground(rounded(SURFACE, dp(18), Color.rgb(34, 58, 43)));
        return panel;
    }

    private TextView text(String value, int sizeSp, int color, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextColor(color);
        view.setTextSize(sizeSp);
        view.setGravity(Gravity.CENTER_VERTICAL);
        view.setTextDirection(View.TEXT_DIRECTION_FIRST_STRONG_RTL);
        if (bold) view.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return view;
    }

    private Button button(String label, int backgroundColor, int textColor) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextColor(textColor);
        button.setTextSize(15);
        button.setAllCaps(false);
        button.setMinHeight(dp(48));
        button.setPadding(dp(12), dp(8), dp(12), dp(8));
        button.setBackground(rounded(backgroundColor, dp(14), backgroundColor));
        return button;
    }

    private GradientDrawable rounded(int color, int radius, int strokeColor) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(radius);
        drawable.setStroke(dp(1), strokeColor);
        return drawable;
    }

    private LinearLayout.LayoutParams margins(int start, int top, int end, int bottom) {
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        );
        params.setMargins(dp(start), dp(top), dp(end), dp(bottom));
        return params;
    }

    private LinearLayout.LayoutParams matchWidth() {
        return new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT
        );
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private void requestBluetoothPermissionsThenScan() {
        if (!bluetooth.isBluetoothSupported()) {
            showToast("هذا الهاتف لا يدعم البلوتوث");
            return;
        }

        ArrayList<String> required = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (checkSelfPermission(Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
                required.add(Manifest.permission.BLUETOOTH_SCAN);
            }
            if (checkSelfPermission(Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                required.add(Manifest.permission.BLUETOOTH_CONNECT);
            }
        } else if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            required.add(Manifest.permission.ACCESS_FINE_LOCATION);
        }

        if (!required.isEmpty()) {
            requestPermissions(required.toArray(new String[0]), REQUEST_BLUETOOTH_PERMISSIONS);
            return;
        }
        ensureBluetoothEnabledThenScan();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != REQUEST_BLUETOOTH_PERMISSIONS) return;
        boolean granted = grantResults.length > 0;
        for (int result : grantResults) granted &= result == PackageManager.PERMISSION_GRANTED;
        if (granted) ensureBluetoothEnabledThenScan();
        else showToast("يجب السماح بإذن الأجهزة القريبة للبحث والاتصال");
    }

    private void ensureBluetoothEnabledThenScan() {
        if (!bluetooth.isBluetoothEnabled()) {
            try {
                startActivityForResult(new Intent(android.bluetooth.BluetoothAdapter.ACTION_REQUEST_ENABLE), REQUEST_ENABLE_BLUETOOTH);
            } catch (SecurityException error) {
                showToast("تعذر تفعيل البلوتوث");
            }
            return;
        }
        showDevicePicker();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQUEST_ENABLE_BLUETOOTH) {
            if (resultCode == RESULT_OK) showDevicePicker();
            else showToast("فعّل البلوتوث أولاً");
        }
    }

    @SuppressLint("MissingPermission")
    private void showDevicePicker() {
        devices.clear();
        for (BluetoothDevice device : bluetooth.getPairedDevices()) addDevice(device);

        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setPadding(dp(20), dp(18), dp(20), dp(12));
        panel.setBackgroundColor(SURFACE);

        LinearLayout heading = new LinearLayout(this);
        heading.setGravity(Gravity.CENTER_VERTICAL);
        heading.setOrientation(LinearLayout.HORIZONTAL);
        heading.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        TextView title = text("اختيار جهاز البلوتوث", 19, TEXT, true);
        heading.addView(title, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        Button close = button("×", SURFACE_ALT, TEXT);
        close.setMinWidth(dp(48));
        close.setOnClickListener(view -> {
            if (deviceDialog != null) deviceDialog.dismiss();
        });
        heading.addView(close);
        panel.addView(heading);

        scanMessage = text("جارٍ البحث عن أجهزة قريبة…", 13, MUTED, false);
        panel.addView(scanMessage, margins(0, 8, 0, 8));

        deviceList = new ListView(this);
        deviceList.setDividerHeight(dp(1));
        deviceList.setBackgroundColor(SURFACE);
        deviceAdapter = new ArrayAdapter<String>(this, android.R.layout.simple_list_item_1, new ArrayList<>()) {
            @Override
            public View getView(int position, View convertView, ViewGroup parent) {
                TextView row = (TextView) super.getView(position, convertView, parent);
                row.setTextColor(TEXT);
                row.setTextSize(16);
                row.setPadding(dp(12), dp(15), dp(12), dp(15));
                row.setTextDirection(View.TEXT_DIRECTION_FIRST_STRONG_RTL);
                row.setBackgroundColor(SURFACE_ALT);
                return row;
            }
        };
        deviceList.setAdapter(deviceAdapter);
        panel.addView(deviceList, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, dp(260)
        ));

        for (BluetoothDevice device : new ArrayList<>(devices.values())) addDeviceRow(device);

        deviceDialog = new AlertDialog.Builder(this)
            .setView(panel)
            .create();
        deviceDialog.setOnDismissListener(dialog -> {
            bluetooth.stopDiscovery();
            deviceDialog = null;
        });
        deviceDialog.show();
        deviceList.setOnItemClickListener((parent, view, position, id) -> {
            if (position < 0 || position >= devices.size()) return;
            BluetoothDevice selected = new ArrayList<>(devices.values()).get(position);
            if (deviceDialog != null) deviceDialog.dismiss();
            bluetooth.connect(selected);
        });

        for (BluetoothDevice device : new ArrayList<>(devices.values())) addDevice(device);
        scanMessage.setText("اضغط على HC-05 للاتصال. سيظهر طلب الاقتران من Android عند الحاجة.");
        bluetooth.startDiscovery();
    }

    @SuppressLint("MissingPermission")
    private void addDevice(BluetoothDevice device) {
        if (device == null) return;
        String address;
        String name;
        try {
            address = device.getAddress();
            name = device.getName();
        } catch (SecurityException error) {
            return;
        }
        if (address == null || devices.containsKey(address)) return;
        devices.put(address, device);
        addDeviceRow(device);
    }

    @SuppressLint("MissingPermission")
    private void addDeviceRow(BluetoothDevice device) {
        if (deviceAdapter == null || device == null) return;
        String name;
        String address;
        boolean paired;
        try {
            name = device.getName();
            address = device.getAddress();
            paired = device.getBondState() == BluetoothDevice.BOND_BONDED;
        } catch (SecurityException error) {
            return;
        }
        if (address == null) return;
        String label = (name == null || name.trim().isEmpty()) ? "جهاز بلوتوث" : name.trim();
        deviceAdapter.add(label + (paired ? "  •  مقترن" : "") + "\n" + address);
        deviceAdapter.notifyDataSetChanged();
    }

    private void sendCommand(char command) {
        if (!connected) {
            showToast("اتصل بالروبوت أولاً");
            return;
        }
        bluetooth.sendCommand(command);
    }

    private void saveDashboardUrl() {
        String normalized = DashboardSync.normalizeBaseUrl(serverUrlInput.getText().toString());
        if (normalized == null) {
            updateSyncStatus("أدخل رابطاً يبدأ بـ https://");
            return;
        }
        apiBaseUrl = normalized;
        getSharedPreferences("neptune-settings", MODE_PRIVATE)
            .edit()
            .putString("dashboard_url", apiBaseUrl)
            .apply();
        updateSyncStatus(apiBaseUrl.isEmpty() ? "المزامنة غير مفعّلة" : "تم حفظ الرابط — جارٍ اختبار المزامنة");
        if (!apiBaseUrl.isEmpty() && connected) {
            publishConnection(true);
            publishCurrentReadings();
        }
    }

    private void publishConnection(boolean online) {
        if (dashboardSync == null || apiBaseUrl.isEmpty()) return;
        dashboardSync.sendConnection(apiBaseUrl, online, success -> {
            if (isFinishing()) return;
            updateSyncStatus(success
                ? (online ? "متصل بلوحة الويب" : "تم تحديث حالة الاتصال")
                : "تعذرت المزامنة — راجع رابط لوحة الويب");
        });
    }

    private void publishCurrentReadings() {
        if (dashboardSync == null || apiBaseUrl.isEmpty()
            || temperature == null || humidity == null || soilMoisture == null) return;
        dashboardSync.sendSensors(apiBaseUrl, temperature, humidity, soilMoisture, success -> {
            if (isFinishing()) return;
            updateSyncStatus(success ? "تم إرسال القراءات إلى لوحة الويب" : "تعذرت مزامنة القراءات");
        });
    }

    private void updateSyncStatus(String message) {
        if (syncStatus != null) syncStatus.setText(message);
    }

    private void updateConnectionUi() {
        if (connectionButton == null || connectionLabel == null) return;
        connectionButton.setText(connected ? "قطع الاتصال" : "ابحث عن الأجهزة");
        connectionButton.setBackground(rounded(connected ? Color.rgb(89, 35, 39) : GREEN, dp(14),
            connected ? Color.rgb(130, 49, 54) : GREEN));
        connectionButton.setTextColor(connected ? TEXT : BG);
    }

    private void showToast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }

    private String format(Double value) {
        return value == null ? "--" : String.format(Locale.US, "%.1f", value);
    }

    @Override
    public void onScanStarted() {
        if (scanMessage != null) scanMessage.setText("جارٍ البحث عن أجهزة قريبة…");
    }

    @Override
    public void onDeviceFound(BluetoothDevice device) {
        addDevice(device);
    }

    @Override
    public void onScanFinished() {
        if (scanMessage == null) return;
        if (devices.isEmpty()) {
            scanMessage.setText("لا يوجد اتصال — لم يتم العثور على أجهزة. تأكد من تشغيل HC-05.");
        } else {
            scanMessage.setText("تم العثور على " + devices.size() + " جهاز. اختر HC-05 للاتصال.");
        }
    }

    @Override
    public void onConnecting(String deviceName) {
        connectionLabel.setText("جارٍ الاتصال بـ " + deviceName + "…");
        connected = false;
        updateConnectionUi();
    }

    @Override
    public void onConnected(String deviceName) {
        connected = true;
        connectionLabel.setText("متصل بـ " + deviceName);
        updateConnectionUi();
        mainHandler.removeCallbacks(heartbeat);
        publishConnection(true);
        mainHandler.postDelayed(heartbeat, 5000);
        showToast("تم الاتصال بالروبوت");
    }

    @Override
    public void onLineReceived(String line) {
        SensorProtocol.Readings readings = SensorProtocol.parse(line);
        if (readings == null) return;
        if (readings.temperature != null) {
            temperature = readings.temperature;
            temperatureValue.setText(format(temperature));
        }
        if (readings.humidity != null) {
            humidity = readings.humidity;
            humidityValue.setText(format(humidity));
        }
        if (readings.soilMoisture != null) {
            soilMoisture = readings.soilMoisture;
            soilValue.setText(format(soilMoisture));
        }
        publishCurrentReadings();
    }

    @Override
    public void onDisconnected() {
        mainHandler.removeCallbacks(heartbeat);
        publishConnection(false);
        connected = false;
        connectionLabel.setText("غير متصل — ابحث عن HC-05");
        temperature = null;
        humidity = null;
        soilMoisture = null;
        if (temperatureValue != null) temperatureValue.setText("--");
        if (humidityValue != null) humidityValue.setText("--");
        if (soilValue != null) soilValue.setText("--");
        updateConnectionUi();
    }

    @Override
    public void onError(String message) {
        connectionLabel.setText(message);
        updateConnectionUi();
        showToast(message);
    }

    @Override
    protected void onDestroy() {
        mainHandler.removeCallbacks(heartbeat);
        if (connected) publishConnection(false);
        if (bluetooth != null) bluetooth.close();
        if (dashboardSync != null) dashboardSync.close();
        super.onDestroy();
    }
}
