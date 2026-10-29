import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSensorData, getRobotStatus,
  sendRobotCommand, updateRobotStatus,
} from '@workspace/api-client-react';
import type { RobotCommand, RobotStatus, SensorData } from '@workspace/api-client-react';
import type { DiscoveredDevice } from '@/components/BluetoothScanModal';

export type ConnectionPhase =
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'disconnecting';

export type RealSensorData = SensorData | null;

const isInIframe = (): boolean => {
  try { return window.self !== window.top; } catch { return true; }
};

const getAppUrl = (): string => window.location.href;

const SCAN_TIMEOUT_MS = 8000;

export function useRobotControl() {
  const [phase, setPhase]                   = useState<ConnectionPhase>('disconnected');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage]     = useState<string | null>(null);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [requiresNewTab, setRequiresNewTab] = useState(false);

  // ── حالة مودال البحث ──
  const [showModal, setShowModal]           = useState(false);
  const [isScanning, setIsScanning]         = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDevice[]>([]);
  const [noDevicesFound, setNoDevicesFound] = useState(false);
  const [connectingId, setConnectingId]     = useState<string | null>(null);

  const scanRef      = useRef<any>(null);
  const devicesRef   = useRef<Map<string, DiscoveredDevice>>(new Map());
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inIframe           = isInIframe();
  const appUrl             = getAppUrl();
  const bluetoothAvailable = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const queryClient = useQueryClient();
  const localIsConnected = phase === 'connected';

  /* ── API Queries ── */
  const { data: sensorResponse } = useQuery({
    queryKey: ['sensor-data'],
    queryFn:  () => getSensorData(),
    refetchInterval: localIsConnected ? 1000 : 2000,
  });

  const { data: robotStatus } = useQuery({
    queryKey: ['robot-status'],
    queryFn:  () => getRobotStatus(),
    refetchInterval: localIsConnected ? 1000 : 2000,
  });

  const isConnected = localIsConnected || Boolean(robotStatus?.connected);

  const commandMutation = useMutation({
    mutationFn: (command: RobotCommand['command']) =>
      sendRobotCommand({ command }),
  });

  /* ── إيقاف الفحص ── */
  const stopScan = useCallback(() => {
    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    try { scanRef.current?.stop(); } catch {}
    scanRef.current = null;
    setIsScanning(false);
  }, []);

  /* ── إغلاق المودال ── */
  const closeModal = useCallback(() => {
    stopScan();
    setShowModal(false);
    setDiscoveredDevices([]);
    setNoDevicesFound(false);
    setConnectingId(null);
    devicesRef.current.clear();
    setPhase('disconnected');
  }, [stopScan]);

  /* ── الاتصال بجهاز محدد ── */
  const connectToDevice = useCallback(async (device: DiscoveredDevice) => {
    setConnectingId(device.id);
    stopScan();

    setPhase('connecting');

    try {
      // محاولة الاتصال GATT
      if (device.raw?.gatt) {
        await device.raw.gatt.connect();
      }

      await updateRobotStatus({
        connected:        true,
        obstacleDetected: false,
        movementProblem:  false,
        systemError:      false,
        cameraActive:     false,
      });

      setConnectedDeviceName(device.name);
      setSuccessMessage('Bluetooth Connected Successfully');
      setPhase('connected');
      setShowModal(false);
      setConnectingId(null);
      setDiscoveredDevices([]);
      devicesRef.current.clear();
      setTimeout(() => setSuccessMessage(null), 3500);

    } catch {
      setConnectingId(null);
      setPhase('disconnected');
      setErrorMessage('فشل الاتصال بالجهاز — حاول مرة أخرى');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [stopScan]);

  /* ── بدء البحث ── */
  const connect = useCallback(async () => {
    if (phase !== 'disconnected') return;

    setErrorMessage(null);
    setRequiresNewTab(false);

    if (!bluetoothAvailable) {
      setErrorMessage('متصفحك لا يدعم البلوتوث — استخدم Chrome');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    // افتح المودال وابدأ البحث
    setShowModal(true);
    setIsScanning(true);
    setDiscoveredDevices([]);
    setNoDevicesFound(false);
    setConnectingId(null);
    devicesRef.current.clear();
    setPhase('scanning');

    const bt = (navigator as any).bluetooth;

    /* ── طريقة 1: requestLEScan (فحص حقيقي مخصص) ── */
    if (typeof bt.requestLEScan === 'function') {
      try {
        const scan = await bt.requestLEScan({ acceptAllAdvertisements: true });
        scanRef.current = scan;

        const onAdv = (event: any) => {
          const dev = event.device as any;
          const id = dev.id;
          if (!devicesRef.current.has(id)) {
            const entry: DiscoveredDevice = {
              id,
              name: dev.name || `جهاز ${devicesRef.current.size + 1}`,
              rssi: event.rssi,
              raw:  dev,
            };
            devicesRef.current.set(id, entry);
            setDiscoveredDevices([...devicesRef.current.values()]);
          }
        };

        bt.addEventListener('advertisementreceived', onAdv);

        scanTimerRef.current = setTimeout(() => {
          bt.removeEventListener('advertisementreceived', onAdv);
          stopScan();
          if (devicesRef.current.size === 0) setNoDevicesFound(true);
        }, SCAN_TIMEOUT_MS);

      } catch (err: any) {
        stopScan();
        if (err?.name === 'SecurityError') {
          setShowModal(false);
          setPhase('disconnected');
          setRequiresNewTab(true);
        } else {
          setNoDevicesFound(true);
        }
      }

    /* ── طريقة 2: requestDevice (نافذة المتصفح الأصلية) ── */
    } else {
      try {
        // نافذة المتصفح ستظهر للمستخدم ليختار الجهاز
        const device = await bt.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service', 'generic_access'],
        });

        // حوّل الجهاز لـ DiscoveredDevice وأضفه للقائمة مباشرة
        const entry: DiscoveredDevice = {
          id:   device.id,
          name: device.name || 'جهاز غير معروف',
          raw:  device,
        };

        devicesRef.current.set(device.id, entry);
        setDiscoveredDevices([entry]);
        setIsScanning(false);

        // اتصل تلقائياً
        await connectToDevice(entry);

      } catch (err: any) {
        setIsScanning(false);
        setPhase('disconnected');

        if (err?.name === 'SecurityError') {
          setShowModal(false);
          setRequiresNewTab(true);
        } else if (err?.name === 'NotFoundError' || err?.name === 'NotAllowedError') {
          setNoDevicesFound(true);
        } else {
          setNoDevicesFound(true);
        }
      }
    }
  }, [phase, bluetoothAvailable, stopScan, connectToDevice]);

  /* ── قطع الاتصال ── */
  const disconnect = useCallback(async () => {
    if (phase !== 'connected') return;
    setPhase('disconnecting');

    try {
      await updateRobotStatus({
        connected:        false,
        obstacleDetected: false,
        movementProblem:  false,
        systemError:      false,
        cameraActive:     false,
      });
    } catch { /* تجاهل */ }

    queryClient.removeQueries({ queryKey: ['sensor-data'] });
    queryClient.removeQueries({ queryKey: ['robot-status'] });
    setConnectedDeviceName(null);
    setPhase('disconnected');
  }, [phase, queryClient]);

  /* ── إرسال الأوامر ── */
  const sendCommand = useCallback(
    async (command: RobotCommand['command']) => {
      if (!isConnected) return { success: false, message: 'الروبوت غير متصل' };
      try {
        const result = await commandMutation.mutateAsync(command);
        queryClient.invalidateQueries({ queryKey: ['robot-status'] });
        return { success: result.success, message: result.message };
      } catch {
        return { success: false, message: 'فشل إرسال الأمر' };
      }
    },
    [isConnected, commandMutation, queryClient]
  );

  /* ── تحليل البيانات ── */
  const sensorDataRaw = sensorResponse as any;
  const sensorData: RealSensorData =
    sensorDataRaw?.hasRealData && sensorDataRaw?.data
      ? (sensorDataRaw.data as SensorData)
      : null;

  const safeStatus: RobotStatus = robotStatus ?? {
    connected:        false,
    obstacleDetected: false,
    movementProblem:  false,
    systemError:      false,
    cameraActive:     false,
  };

  return {
    phase,
    isConnected,
    localIsConnected,
    inIframe,
    appUrl,
    bluetoothAvailable,
    requiresNewTab,
    successMessage,
    errorMessage,
    connectedDeviceName,
    sensorData,
    robotStatus: safeStatus,
    // مودال البحث
    showModal,
    isScanning,
    discoveredDevices,
    noDevicesFound,
    connectingId,
    // دوال
    connect,
    disconnect,
    connectToDevice,
    closeModal,
    sendCommand,
    isSending: commandMutation.isPending,
  };
}
