import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSensorData, getRobotStatus, sendRobotCommand, updateRobotStatus } from '@workspace/api-client-react';
import type { RobotCommand, RobotStatus, SensorData } from '@workspace/api-client-react';

type ConnectionPhase = 'disconnected' | 'connecting' | 'connected' | 'disconnecting';

export type RealSensorData = SensorData | null;

export function useRobotControl() {
  const [phase, setPhase] = useState<ConnectionPhase>('disconnected');
  const [connectionMessage, setConnectionMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const disconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const statusMutation = useMutation({
    mutationFn: (body: Parameters<typeof updateRobotStatus>[0]['data']) =>
      updateRobotStatus({ data: body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['robot-status'] });
    },
  });

  const commandMutation = useMutation({
    mutationFn: (command: RobotCommand['command']) =>
      sendRobotCommand({ data: { command } }),
  });

  const connect = useCallback(async () => {
    if (phase !== 'disconnected') return;
    setPhase('connecting');
    setConnectionMessage(null);

    await new Promise(r => setTimeout(r, 2000));

    try {
      await updateRobotStatus({
        data: {
          connected: true,
          obstacleDetected: false,
          movementProblem: false,
          systemError: false,
          cameraActive: false,
        }
      });
      setConnectionMessage('Bluetooth Connected Successfully');
      setPhase('connected');
      await new Promise(r => setTimeout(r, 2500));
      setConnectionMessage(null);
    } catch {
      setPhase('disconnected');
      setConnectionMessage('فشل الاتصال — يرجى المحاولة مجدداً');
      setTimeout(() => setConnectionMessage(null), 3000);
    }
  }, [phase]);

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
        }
      });
    } catch {
      // ignore
    }

    queryClient.removeQueries({ queryKey: ['sensor-data'] });
    queryClient.removeQueries({ queryKey: ['robot-status'] });
    setPhase('disconnected');
  }, [phase, queryClient]);

  const sendCommand = useCallback(async (command: RobotCommand['command']) => {
    if (!isConnected) return { success: false, message: 'الروبوت غير متصل' };
    try {
      const result = await commandMutation.mutateAsync(command);
      queryClient.invalidateQueries({ queryKey: ['robot-status'] });
      return { success: result.success, message: result.message };
    } catch {
      return { success: false, message: 'فشل إرسال الأمر' };
    }
  }, [isConnected, commandMutation, queryClient]);

  const sensorDataRaw = sensorResponse as any;
  const sensorData: RealSensorData = (sensorDataRaw?.hasRealData && sensorDataRaw?.data)
    ? sensorDataRaw.data as SensorData
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
    connectionMessage,
    sensorData,
    robotStatus: safeStatus,
    connect,
    disconnect,
    sendCommand,
    isSending: commandMutation.isPending,
  };
}
