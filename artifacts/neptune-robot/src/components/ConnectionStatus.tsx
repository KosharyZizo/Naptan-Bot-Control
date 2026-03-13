import { motion, AnimatePresence } from "framer-motion";
import { Bluetooth, BluetoothOff, Power, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";

interface ConnectionStatusProps {
  isConnected: boolean;
  phase: 'disconnected' | 'connecting' | 'connected' | 'disconnecting';
  connectionMessage: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function ConnectionStatus({
  isConnected,
  phase,
  connectionMessage,
  onConnect,
  onDisconnect,
}: ConnectionStatusProps) {
  const isConnecting = phase === 'connecting' || phase === 'disconnecting';

  const statusText = {
    disconnected: 'غير متصل',
    connecting: 'جارٍ الاتصال عبر البلوتوث...',
    connected: 'متصل بالروبوت',
    disconnecting: 'جارٍ قطع الاتصال...',
  }[phase];

  const statusColor = {
    disconnected: 'text-destructive',
    connecting: 'text-warning',
    connected: 'text-primary',
    disconnecting: 'text-warning',
  }[phase];

  const dotColor = {
    disconnected: 'bg-destructive',
    connecting: 'bg-warning',
    connected: 'bg-primary',
    disconnecting: 'bg-warning',
  }[phase];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel rounded-2xl p-4 px-6 mb-6 relative overflow-hidden"
    >
      <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${isConnected ? 'bg-primary' : 'bg-destructive'}`} />

      <div className="flex items-center gap-4 z-10">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
          ${isConnected ? 'bg-primary/20 text-primary' : isConnecting ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}`}
        >
          {isConnecting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isConnected ? (
            <Bluetooth className="w-6 h-6" />
          ) : (
            <BluetoothOff className="w-6 h-6" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-wide">روبوت نبتان</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-3 w-3">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${dotColor}`} />
            </span>
            <span className={`text-sm font-medium ${statusColor}`}>{statusText}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 z-10 w-full sm:w-auto">
        <AnimatePresence mode="wait">
          {connectionMessage && (
            <motion.div
              key="msg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border
                ${connectionMessage.includes('Successfully')
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-destructive/10 text-destructive border-destructive/30'}`}
            >
              {connectionMessage.includes('Successfully') && <CheckCircle2 className="w-4 h-4" />}
              {connectionMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={isConnected ? onDisconnect : onConnect}
          disabled={isConnecting}
          variant={isConnected ? "outline" : "default"}
          className={`w-full sm:w-auto gap-2 ${!isConnected && !isConnecting ? 'glow-primary' : ''}`}
        >
          {isConnecting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Power className="w-5 h-5" />
          )}
          {isConnected ? 'قطع الاتصال' : isConnecting ? 'جارٍ الاتصال...' : 'اتصال بالروبوت'}
        </Button>
      </div>
    </motion.div>
  );
}
