import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bluetooth, BluetoothSearching, Wifi, WifiOff, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";

export interface DiscoveredDevice {
  id:     string;
  name:   string;
  rssi?:  number;
  raw:    any;
}

interface BluetoothScanModalProps {
  open:           boolean;
  isScanning:     boolean;
  devices:        DiscoveredDevice[];
  noDevicesFound: boolean;
  connectingId:   string | null;
  onSelect:       (device: DiscoveredDevice) => void;
  onClose:        () => void;
}

function SignalBars({ rssi }: { rssi?: number }) {
  const strength = rssi === undefined ? 2 : rssi >= -60 ? 3 : rssi >= -80 ? 2 : 1;
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3].map((level) => (
        <div
          key={level}
          className={`w-1.5 rounded-sm transition-all ${
            level <= strength ? "bg-primary" : "bg-white/20"
          }`}
          style={{ height: `${level * 33}%` }}
        />
      ))}
    </div>
  );
}

export function BluetoothScanModal({
  open,
  isScanning,
  devices,
  noDevicesFound,
  connectingId,
  onSelect,
  onClose,
}: BluetoothScanModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* طبقة الخلفية */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* المودال */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* رأس المودال */}
              <div className="relative px-6 pt-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${isScanning ? "bg-primary/20 text-primary" : "bg-white/10 text-white/60"}`}>
                    {isScanning
                      ? <BluetoothSearching className="w-5 h-5 animate-pulse" />
                      : <Bluetooth className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">البحث عن الأجهزة</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isScanning
                        ? "جارٍ البحث عن أجهزة بلوتوث قريبة..."
                        : noDevicesFound
                        ? "انتهى البحث"
                        : `تم العثور على ${devices.length} جهاز`}
                    </p>
                  </div>
                </div>

                {/* زر الإغلاق */}
                <button
                  onClick={onClose}
                  className="absolute left-4 top-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* شريط التقدم */}
                {isScanning && (
                  <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 8, ease: "linear" }}
                    />
                  </div>
                )}
              </div>

              {/* محتوى المودال */}
              <div className="px-4 py-4 min-h-[200px] flex flex-col">

                {/* حالة: جارٍ البحث ولا يوجد أجهزة بعد */}
                {isScanning && devices.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                      <div className="absolute inset-2 rounded-full border-2 border-primary/50 animate-ping [animation-delay:0.3s]" />
                      <div className="absolute inset-4 rounded-full border-2 border-primary animate-ping [animation-delay:0.6s]" />
                      <Bluetooth className="absolute inset-0 m-auto w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      تأكد أن البلوتوث مفعّل على الجهاز المطلوب
                    </p>
                  </div>
                )}

                {/* حالة: لا يوجد أجهزة */}
                {noDevicesFound && devices.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center gap-4 py-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
                      <WifiOff className="w-7 h-7 text-destructive" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-white">لا يوجد اتصال</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        لم يتم العثور على أي أجهزة بلوتوث قريبة
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={onClose} className="gap-2 mt-2">
                      <X className="w-4 h-4" />
                      إغلاق
                    </Button>
                  </motion.div>
                )}

                {/* قائمة الأجهزة */}
                {devices.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <AnimatePresence initial={false}>
                      {devices.map((dev, i) => (
                        <motion.button
                          key={dev.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          disabled={!!connectingId}
                          onClick={() => onSelect(dev)}
                          className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-right transition-all
                            ${connectingId === dev.id
                              ? "bg-primary/20 border-primary"
                              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"}
                            ${connectingId && connectingId !== dev.id ? "opacity-40" : ""}
                            disabled:cursor-not-allowed`}
                        >
                          {/* أيقونة الجهاز */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                            ${connectingId === dev.id ? "bg-primary/30 text-primary" : "bg-white/10 text-white/70"}`}>
                            {connectingId === dev.id
                              ? <Loader2 className="w-5 h-5 animate-spin" />
                              : <Bluetooth className="w-5 h-5" />}
                          </div>

                          {/* اسم الجهاز */}
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate ${connectingId === dev.id ? "text-primary" : "text-white"}`}>
                              {dev.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {connectingId === dev.id ? "جارٍ الاتصال..." : "انقر للاتصال"}
                            </p>
                          </div>

                          {/* قوة الإشارة */}
                          <SignalBars rssi={dev.rssi} />
                        </motion.button>
                      ))}
                    </AnimatePresence>

                    {/* مؤشر البحث أثناء ظهور أجهزة */}
                    {isScanning && (
                      <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        يتابع البحث...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
