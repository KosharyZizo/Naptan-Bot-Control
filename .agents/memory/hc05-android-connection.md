---
name: HC-05 Android connection
description: Product requirement and platform constraint for Neptune's HC-05 sensor connection.
---

Keep the HC-05/HC-06 module; users require direct phone connection. Bluetooth Classic SPP needs a native Android app, not browser Web Bluetooth. Replit can hold the Android source but cannot build its APK here; an external Android build is required. The Android app can sync sensor readings to the web dashboard when given an HTTPS site URL.

**Why:** the user explicitly required retaining HC-05/HC-06 and connecting from the phone.

**How to apply:** avoid proposing direct HC-05 browser pairing; use the native Android source for phone connections and ask for the controller's serial data format before changing its parser.
