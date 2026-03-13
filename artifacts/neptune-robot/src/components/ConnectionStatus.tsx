import { motion, AnimatePresence } from "framer-motion";
import {
  Bluetooth,
  BluetoothOff,
  BluetoothSearching,
  CheckCircle2,
  XCircle,
  Loader2,
  WifiOff,
} from "lucide-react";
import { Button } from "./ui/button";
import type { ConnectionPhase } from "@/hooks/use-robot-control";

interface ConnectionStatusProps {
  phase: ConnectionPhase;
  bluetoothSupported: boolean;
  successMessage: string | null;
  errorMessage: string | null;
  connectedDeviceName: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionStatus({
  phase,
  bluetoothSupported,
  successMessage,
  errorMessage,
  connectedDeviceName,
  onConnect,
  onDisconnect,
}: ConnectionStatusProps) {
  const isConnected = phase === 'connected';
  const isBusy = phase === 'scanning' || phase === 'connecting' || phase === 'disconnecting';

  const statusText: Record<ConnectionPhase, string> = {
    disconnected: 'غير متصل',
    scanning: 'جارٍ البحث عن الأجهزة...',
    connecting: 'جارٍ الاتصال بالجهاز...',
    connected: connectedDeviceName ? `متصل بـ ${connectedDeviceName}` : 'متصل بالروبوت',
    disconnecting: 'جارٍ قطع الاتصال...',
  };

  const statusColor: Record<ConnectionPhase, string> = {
    disconnected: 'text-destructive',
    scanning: 'text-warning',
    connecting: 'text-warning',
    connected: 'text-primary',
    disconnecting: 'text-warning',
  };

  const dotColor: Record<ConnectionPhase, string> = {
    disconnected: 'bg-destructive',
    scanning: 'bg-warning',
    connecting: 'bg-warning',
    connected: 'bg-primary',
    disconnecting: 'bg-warning',
  };

  const StatusIcon = () => {
    if (phase === 'scanning') return <BluetoothSearching className="w-6 h-6 animate-pulse" />;
    if (phase === 'connecting' || phase === 'disconnecting') return <Loader2 className="w-6 h-6 animate-spin" />;
    if (isConnected) return <Bluetooth className="w-6 h-6" />;
    return <BluetoothOff className="w-6 h-6" />;
  };

  const btnLabel = () => {
    if (isConnected) return 'قطع الاتصال';
    if (phase === 'scanning') return 'جارٍ البحث...';
    if (phase === 'connecting') return 'جارٍ الاتصال...';
    if (phase === 'disconnecting') return 'جارٍ القطع...';
    return bluetoothSupported ? 'ابحث عن الأجهزة' : 'اتصال بالروبوت';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel rounded-2xl p-4 px-6 mb-6 relative overflow-hidden"
    >
      {/* خلفية ملونة حسب الحالة */}
      <div
        className={`absolute inset-0 opacity-10 transition-colors duration-1000 
          ${isConnected ? 'bg-primary' : isBusy ? 'bg-warning' : 'bg-destructive'}`}
      />

      {/* معلومات الجهاز */}
      <div className="flex items-center gap-4 z-10">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
            ${isConnected
              ? 'bg-primary/20 text-primary'
              : isBusy
              ? 'bg-warning/20 text-warning'
              : 'bg-destructive/20 text-destructive'}`}
        >
          <StatusIcon />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-wide">روبوت نبتان</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-3 w-3">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColor[phase]}`} />
            </span>
            <span className={`text-sm font-medium ${statusColor[phase]}`}>
              {statusText[phase]}
            </span>
          </div>
        </div>
      </div>

      {/* الرسائل والزر */}
      <div className="flex items-center gap-3 z-10 w-full sm:w-auto">

        {/* رسائل النجاح والخطأ */}
        <AnimatePresence mode="wait">
          {successMessage && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-primary/10 text-primary border border-primary/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              {successMessage}
            </motion.div>
          )}
          {errorMessage && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-destructive/10 text-destructive border border-destructive/30"
            >
              <XCircle className="w-4 h-4" />
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* تنبيه عدم دعم البلوتوث */}
        {!bluetoothSupported && !isConnected && (
          <div className="hidden lg:flex items-center gap-1 text-xs text-muted-foreground opacity-60">
            <WifiOff className="w-3 h-3" />
            <span>وضع المحاكاة</span>
          </div>
        )}

        <Button
          onClick={isConnected ? onDisconnect : onConnect}
          disabled={isBusy}
          variant={isConnected ? 'outline' : 'default'}
          className={`w-full sm:w-auto gap-2 min-w-[160px] ${!isConnected && !isBusy ? 'glow-primary' : ''}`}
        >
          {isBusy ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isConnected ? (
            <BluetoothOff className="w-5 h-5" />
          ) : (
            <BluetoothSearching className="w-5 h-5" />
          )}
          {btnLabel()}
        </Button>
      </div>
    </motion.div>
  );
}
