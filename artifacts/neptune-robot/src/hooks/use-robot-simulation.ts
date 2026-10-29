import { useState, useEffect, useCallback } from 'react';
import { 
  useGetSensorData, 
  getGetSensorDataQueryKey,
  useSendRobotCommand, 
  useGetRobotStatus,
  getGetRobotStatusQueryKey,
  type SensorData,
  type RobotStatus,
  type RobotCommand
} from '@workspace/api-client-react';

// Simulated initial state for the demo
const INITIAL_SENSOR_DATA: SensorData = {
  temperature: 24.5,
  humidity: 45.2,
  soilMoisture: 60,
  soilStatus: 'رطوبة متوسطة',
  plantHealth: 'medium',
  updatedAt: new Date().toISOString()
};

const INITIAL_ROBOT_STATUS: RobotStatus = {
  connected: false,
  obstacleDetected: false,
  movementProblem: false,
  systemError: false,
  cameraActive: false,
  lastSeen: new Date().toISOString()
};

/**
 * This hook wraps the generated API hooks to provide a seamless demo experience.
 * If the API fails or is not yet implemented on the backend, it falls back to 
 * local simulated state that updates realistically.
 */
export function useRobotControl() {
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [localConnected, setLocalConnected] = useState(false);
  
  // Local state for simulation
  const [simulatedSensors, setSimulatedSensors] = useState<SensorData>(INITIAL_SENSOR_DATA);
  const [simulatedStatus, setSimulatedStatus] = useState<RobotStatus>(INITIAL_ROBOT_STATUS);

  // Real API hooks
  const { data: apiSensors, error: sensorError } = useGetSensorData({
    query: {
      queryKey: getGetSensorDataQueryKey(),
      refetchInterval: localConnected ? 1000 : false,
      retry: 1,
    }
  });

  const { data: apiStatus, error: statusError } = useGetRobotStatus({
    query: {
      queryKey: getGetRobotStatusQueryKey(),
      refetchInterval: localConnected ? 2000 : false,
      retry: 1,
    }
  });

  const commandMutation = useSendRobotCommand();

  // Determine if we should use API or simulation based on errors
  useEffect(() => {
    if (sensorError || statusError) {
      setIsDemoMode(true);
    } else if (apiSensors && apiStatus) {
      setIsDemoMode(false);
    }
  }, [apiSensors, apiStatus, sensorError, statusError]);

  // Simulation Loop
  useEffect(() => {
    if (!isDemoMode || !localConnected) return;

    const interval = setInterval(() => {
      setSimulatedSensors(prev => {
        // Random slight fluctuations
        const tempChange = (Math.random() - 0.5) * 0.4;
        const humChange = (Math.random() - 0.5) * 1.5;
        const soilChange = (Math.random() - 0.5) * 2;

        let newSoil = Math.max(0, Math.min(100, prev.soilMoisture + soilChange));
        
        let soilStatus = 'رطوبة متوسطة';
        let plantHealth: 'healthy' | 'medium' | 'unhealthy' = 'medium';

        if (newSoil < 50) {
          soilStatus = 'التربة تحتاج ماء';
          plantHealth = 'unhealthy';
        } else if (newSoil >= 80) {
          soilStatus = 'التربة لا تحتاج ماء';
          plantHealth = 'healthy';
        }

        return {
          temperature: Number((prev.temperature + tempChange).toFixed(1)),
          humidity: Number((prev.humidity + humChange).toFixed(1)),
          soilMoisture: Number(newSoil.toFixed(1)),
          soilStatus,
          plantHealth,
          updatedAt: new Date().toISOString()
        };
      });

      // Randomly trigger an obstacle alert rarely just for demo
      if (Math.random() > 0.95) {
        setSimulatedStatus(prev => ({
          ...prev,
          obstacleDetected: true
        }));
        // Auto clear it after 3 seconds
        setTimeout(() => {
          setSimulatedStatus(prev => ({ ...prev, obstacleDetected: false }));
        }, 3000);
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [isDemoMode, localConnected]);


  // Actions
  const toggleConnection = useCallback(() => {
    setLocalConnected(prev => !prev);
    setSimulatedStatus(prev => ({
      ...prev,
      connected: !prev.connected,
      cameraActive: false // turn off camera on disconnect
    }));
  }, []);

  const sendCommand = useCallback(async (command: RobotCommand['command']) => {
    if (!localConnected) return { success: false, message: 'Not connected' };

    // Update local state for immediate feedback
    if (command === 'K') {
      setSimulatedStatus(prev => ({
        ...prev,
        cameraActive: !prev.cameraActive
      }));
    }

    if (!isDemoMode) {
      try {
        await commandMutation.mutateAsync({ data: { command } });
        return { success: true, message: `Command ${command} sent` };
      } catch (err) {
        console.error('Command failed', err);
        return { success: false, message: 'Failed to send' };
      }
    } else {
      // Simulate network delay
      await new Promise(r => setTimeout(r, 100));
      return { success: true, message: `[Demo] Command ${command} sent` };
    }
  }, [isDemoMode, commandMutation, localConnected]);

  // Provide toggle functions for alerts in demo mode
  const toggleAlert = useCallback((type: 'obstacleDetected' | 'movementProblem' | 'systemError') => {
    setSimulatedStatus(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, []);

  return {
    isConnected: isDemoMode ? localConnected : (apiStatus?.connected ?? false),
    isDemoMode,
    sensorData: isDemoMode ? simulatedSensors : (apiSensors ?? INITIAL_SENSOR_DATA),
    robotStatus: isDemoMode ? simulatedStatus : (apiStatus ?? INITIAL_ROBOT_STATUS),
    toggleConnection,
    sendCommand,
    isSending: commandMutation.isPending,
    demoActions: {
      toggleAlert
    }
  };
}
