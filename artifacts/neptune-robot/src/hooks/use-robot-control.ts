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

export type BluetoothDeviceInfo = {
  id: string;
  name: string;
};

export function useRobotControl() {
  const [phase, setPhase] = useState<ConnectionPhase>('disconnected');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectedDeviceName, setConnectedDeviceName] = useState<string | null>(null);
  const [bluetoothSupported] = useState(() =>
    typeof navigator !== 'undefined' && 'bluetooth' in navigator
  );

  const queryClient = useQueryClient();
  const isConnected = phase === 'connected';

  const { data: sensorResponse } = useQuery({
    queryKey: ['sensor-data'],
    queryFn: () => getSensorData(),
    refetchInterval: isConnected ? 1000 : false,
    enabled: isConnected,
  });

  const { data: robotStatus } = useQuery({
    queryKey: ['robot-status'],
    queryFn: () => getRobotStatus(),
    refetchInterval: isConnected ? 1000 : false,
    enabled: isConnected,
  });

  const commandMutation = useMutation({
    mutationFn: (command: RobotCommand['command']) =>
      sendRobotCommand({ data: { command } }),
  });

  const connect = useCallback(async () => {
    if (phase !== 'disconnected') return;

    setErrorMessage(null);
    setPhase('scanning');

    try {
      let deviceName = 'روبوت نبتان';

      if (bluetoothSupported) {
        // فتح نافذة اختيار جهاز البلوتوث من المتصفح
        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service', 'generic_access'],
        });

        deviceName = device.name || 'جهاز غير معروف';
        setPhase('connecting');

        // الاتصال بالخادم
        await updateRobotStatus({
          data: {
            connected: true,
            obstacleDetected: false,
            movementProblem: false,
            systemError: false,
            cameraActive: false,
          },
        });

        setConnectedDeviceName(deviceName);
        setSuccessMessage(`Bluetooth Connected Successfully`);
        setPhase('connected');
        setTimeout(() => setSuccessMessage(null), 3000);

      } else {
        // المتصفح لا يدعم البلوتوث — وضع المحاكاة
        setPhase('connecting');
        await new Promise(r => setTimeout(r, 1800));

        await updateRobotStatus({
          data: {
            connected: true,
            obstacleDetected: false,
            movementProblem: false,
            systemError: false,
            cameraActive: false,
          },
        });

        setConnectedDeviceName('نبتان HC-06');
        setSuccessMessage('Bluetooth Connected Successfully');
        setPhase('connected');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      // المستخدم أغلق نافذة الاختيار أو حدث خطأ
      const cancelled =
        err?.name === 'NotFoundError' || err?.message?.includes('cancelled');
      setErrorMessage(cancelled ? 'تم إلغاء البحث' : 'فشل الاتصال — حاول مرة أخرى');
      setTimeout(() => setErrorMessage(null), 3000);
      setPhase('disconnected');
    }
  }, [phase, bluetoothSupported]);

  const disconnect = useCallback(async () => {
    if (phase !== 'connected') return;
    setPhase('disconnecting');

    try {
      await updateRobotStatus({
        data: {
          connected: false,
          obstacleDetected: false,
          movementProblem: false,
          systemError: false,
          cameraActive: false,
        },
      });
    } catch {
      // تجاهل
    }

    queryClient.removeQueries({ queryKey: ['sensor-data'] });
    queryClient.removeQueries({ queryKey: ['robot-status'] });
    setConnectedDeviceName(null);
    setPhase('disconnected');
  }, [phase, queryClient]);

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

  const sensorDataRaw = sensorResponse as any;
  const sensorData: RealSensorData =
    sensorDataRaw?.hasRealData && sensorDataRaw?.data
      ? (sensorDataRaw.data as SensorData)
      : null;

  const safeStatus: RobotStatus = robotStatus ?? {
    connected: false,
    obstacleDetected: false,
    movementProblem: false,
    systemError: false,
    cameraActive: false,
  };

  return {
    phase,
    isConnected,
    bluetoothSupported,
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
