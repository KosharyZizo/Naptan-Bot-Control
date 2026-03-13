import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSensorData, getRobotStatus, sendRobotCommand, updateRobotStatus } from '@workspace/api-client-react';
import type { RobotCommand, RobotStatus, SensorData } from '@workspace/api-client-react';

export type ConnectionPhase =
  | 'disconnected'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'disconnecting';

export type RealSensorData = SensorData | null;

// هل التطبيق يعمل داخل إطار مضمّن (iframe)؟
const isInIframe = (): boolean => {
  try { return window.self !== window.top; } catch { return true; }
};

// رابط التطبيق المباشر
const getAppUrl = (): string => window.location.href;

export function useRobotControl() {
  const [phase, setPhase]                     = useState<ConnectionPhase>('disconnected');
  const [successMessage, setSuccessMessage]   = useState<string | null>(null);
  const [errorMessage, setErrorMessage]       = useState<string | null>(null);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [requiresNewTab, setRequiresNewTab]   = useState(false);

  const inIframe            = isInIframe();
  const appUrl              = getAppUrl();
  const bluetoothAvailable  = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const queryClient = useQueryClient();
  const isConnected = phase === 'connected';

  /* ── استعلامات API ── */
  const { data: sensorResponse } = useQuery({
    queryKey: ['sensor-data'],
    queryFn:  () => getSensorData(),
    refetchInterval: isConnected ? 1000 : false,
    enabled:  isConnected,
  });

  const { data: robotStatus } = useQuery({
    queryKey: ['robot-status'],
    queryFn:  () => getRobotStatus(),
    refetchInterval: isConnected ? 1000 : false,
    enabled:  isConnected,
  });

  const commandMutation = useMutation({
    mutationFn: (command: RobotCommand['command']) =>
      sendRobotCommand({ data: { command } }),
  });

  /* ── دالة الاتصال ── */
  const connect = useCallback(async () => {
    if (phase !== 'disconnected') return;

    setErrorMessage(null);
    setRequiresNewTab(false);
    setPhase('scanning');

    // ── إذا كان البلوتوث غير مدعوم نهائياً ──
    if (!bluetoothAvailable) {
      setPhase('disconnected');
      setErrorMessage('متصفحك لا يدعم البلوتوث — استخدم Chrome');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    try {
      // ── فتح نافذة اختيار أجهزة البلوتوث ──
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'generic_access'],
      });

      const deviceName = (device as any).name || 'جهاز غير معروف';
      setPhase('connecting');

      await updateRobotStatus({
        data: {
          connected:        true,
          obstacleDetected: false,
          movementProblem:  false,
          systemError:      false,
          cameraActive:     false,
        },
      });

      setConnectedDeviceName(deviceName);
      setSuccessMessage('Bluetooth Connected Successfully');
      setPhase('connected');
      setTimeout(() => setSuccessMessage(null), 3500);

    } catch (err: any) {
      setPhase('disconnected');

      // ── خطأ الإطار المضمّن (iframe يمنع البلوتوث) ──
      if (err?.name === 'SecurityError' || err?.message?.toLowerCase().includes('security')) {
        setRequiresNewTab(true);
        return;
      }

      // ── ألغى المستخدم الاختيار ──
      if (err?.name === 'NotFoundError' || err?.name === 'NotAllowedError') {
        setErrorMessage('تم إلغاء البحث');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }

      setErrorMessage('فشل الاتصال — حاول مرة أخرى');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  }, [phase, bluetoothAvailable]);

  /* ── دالة قطع الاتصال ── */
  const disconnect = useCallback(async () => {
    if (phase !== 'connected') return;
    setPhase('disconnecting');

    try {
      await updateRobotStatus({
        data: {
          connected:        false,
          obstacleDetected: false,
          movementProblem:  false,
          systemError:      false,
          cameraActive:     false,
        },
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

  /* ── تحليل بيانات الحساسات ── */
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
    inIframe,
    appUrl,
    bluetoothAvailable,
    requiresNewTab,
    successMessage,
    errorMessage,
    connectedDeviceName,
    sensorData,
    robotStatus: safeStatus,
    connect,
    disconnect,
    sendCommand,
    isSending: commandMutation.isPending,
  };
}
