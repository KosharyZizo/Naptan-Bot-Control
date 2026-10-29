import { motion, AnimatePresence } from "framer-motion";
import {
  Bluetooth, BluetoothOff, BluetoothSearching,
  CheckCircle2, XCircle, Loader2, ExternalLink,
} from "lucide-react";
import { Button } from "./ui/button";
import type { ConnectionPhase } from "@/hooks/use-robot-control";

interface ConnectionStatusProps {
  phase:               ConnectionPhase;
  bluetoothAvailable:  boolean;
  requiresNewTab:      boolean;
  successMessage:      string | null;
  errorMessage:        string | null;
  connectedDeviceName: string | null;
  remoteConnected?: boolean;
  appUrl:              string;
  onConnect:           () => void;
  onDisconnect:        () => void;
}

export function ConnectionStatus({
  phase,
  bluetoothAvailable,
  requiresNewTab,
  successMessage,
  errorMessage,
  connectedDeviceName,
  remoteConnected = false,
  appUrl,
  onConnect,
  onDisconnect,
}: ConnectionStatusProps) {
  const isRemoteConnected = remoteConnected && phase !== 'connected';
  const isConnected = phase === 'connected' || isRemoteConnected;
  const isBusy = phase === 'scanning' || phase === 'connecting' || phase === 'disconnecting';

  const statusText: Record<ConnectionPhase, string> = {
    disconnected:  'غير متصل',
    scanning:      'جارٍ البحث عن الأجهزة...',
    connecting:    'جارٍ الاتصال...',
    connected:     connectedDeviceName ? `متصل بـ ${connectedDeviceName}` : 'متصل بالروبوت',
    disconnecting: 'جارٍ قطع الاتصال...',
  };

  const statusColor: Record<ConnectionPhase, string> = {
    disconnected:  'text-destructive',
    scanning:      'text-warning',
    connecting:    'text-warning',
    connected:     'text-primary',
    disconnecting: 'text-warning',
  };

  const dotColor: Record<ConnectionPhase, string> = {
    disconnected:  'bg-destructive',
    scanning:      'bg-warning',
    connecting:    'bg-warning',
    connected:     'bg-primary',
    disconnecting: 'bg-warning',
  };

  const btnLabel = () => {
    if (isBusy)       return phase === 'scanning' ? 'جارٍ البحث...' : 'جارٍ الاتصال...';
    if (isConnected)  return 'قطع الاتصال';
    return 'ابحث عن الأجهزة';
  };

  const StatusIcon = () => {
    if (phase === 'scanning')                        return <BluetoothSearching className="w-6 h-6 animate-pulse" />;
    if (phase === 'connecting' || phase === 'disconnecting') return <Loader2 className="w-6 h-6 animate-spin" />;
    if (isConnected)                                 return <Bluetooth className="w-6 h-6" />;
    return <BluetoothOff className="w-6 h-6" />;
  };

  return (
    <div className="mb-6 flex flex-col gap-3">

      {/* ── شريط الحالة الرئيسي ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel rounded-2xl p-4 px-6 relative overflow-hidden"
      >
        {/* خلفية ملوّنة */}
        <div className={`absolute inset-0 opacity-10 transition-colors duration-1000
          ${isConnected ? 'bg-primary' : isBusy ? 'bg-warning' : 'bg-destructive'}`} />

        {/* معلومات الجهاز */}
        <div className="flex items-center gap-4 z-10">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500
            ${isConnected ? 'bg-primary/20 text-primary' : isBusy ? 'bg-warning/20 text-warning' : 'bg-destructive/20 text-destructive'}`}>
            <StatusIcon />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-wide">روبوت نبتان</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-3 w-3">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isRemoteConnected ? 'bg-primary' : dotColor[phase]}`} />
              </span>
              <span className={`text-sm font-medium ${isRemoteConnected ? 'text-primary' : statusColor[phase]}`}>
                {isRemoteConnected ? 'متصل من تطبيق Android' : statusText[phase]}
              </span>
            </div>
          </div>
        </div>

        {/* الرسائل والزر */}
        <div className="flex items-center gap-3 z-10 w-full sm:w-auto">
          <AnimatePresence mode="wait">
            {successMessage && (
              <motion.div key="s" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-primary/10 text-primary border border-primary/30">
                <CheckCircle2 className="w-4 h-4" />{successMessage}
              </motion.div>
            )}
            {errorMessage && (
              <motion.div key="e" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-destructive/10 text-destructive border border-destructive/30">
                <XCircle className="w-4 h-4" />{errorMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {isRemoteConnected ? (
            <div className="w-full sm:w-auto min-w-[190px] flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <Bluetooth className="w-5 h-5" />
              البيانات من تطبيق الهاتف
            </div>
          ) : phase === 'disconnected' ? (
            <div className="w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground">
              <Bluetooth className="w-5 h-5" />
              اتصل بـ HC-05 من تطبيق Android
            </div>
          ) : (
            <Button
              onClick={isConnected ? onDisconnect : onConnect}
              disabled={isBusy}
              variant={isConnected ? 'outline' : 'default'}
              className={`w-full sm:w-auto gap-2 min-w-[170px] ${!isConnected && !isBusy ? 'glow-primary' : ''}`}
            >
              {isBusy
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : isConnected
                ? <BluetoothOff className="w-5 h-5" />
                : <BluetoothSearching className="w-5 h-5" />}
              {btnLabel()}
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── بانر: يجب الفتح في تبويب جديد ── */}
      <AnimatePresence>
        {requiresNewTab && (
          <motion.div
            key="newtab"
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4 flex flex-col sm:flex-row items-center gap-4">
              {/* أيقونة */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary">
                <Bluetooth className="w-5 h-5" />
              </div>

              {/* النص */}
              <div className="flex-1 text-center sm:text-right">
                <p className="font-bold text-white text-sm">
                  البلوتوث لا يعمل داخل المعاينة المضمّنة
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  افتح التطبيق في تبويب Chrome مستقل حتى تظهر قائمة الأجهزة
                </p>
              </div>

              {/* زر الفتح */}
              <a
                href={appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity glow-primary"
              >
                <ExternalLink className="w-4 h-4" />
                افتح في تبويب جديد
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* رسائل للشاشات الصغيرة */}
      <AnimatePresence>
        {(successMessage || errorMessage) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`md:hidden flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border
              ${successMessage
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-destructive/10 text-destructive border-destructive/30'}`}
          >
            {successMessage || errorMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
