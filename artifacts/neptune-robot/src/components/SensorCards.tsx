import { motion } from "framer-motion";
import { Thermometer, Droplets, Sprout, Hourglass } from "lucide-react";
import type { SensorData } from "@workspace/api-client-react";

interface SensorCardsProps {
  data: SensorData | null;
  isConnected: boolean;
}

export function SensorCards({ data, isConnected }: SensorCardsProps) {
  const hasData = data !== null;

  let soilColorClass = "text-primary";
  let soilBgClass = "bg-primary/20";
  let soilProgressClass = "bg-primary";

  if (hasData) {
    if (data!.soilMoisture < 50) {
      soilColorClass = "text-destructive";
      soilBgClass = "bg-destructive/20";
      soilProgressClass = "bg-destructive";
    } else if (data!.soilMoisture < 80) {
      soilColorClass = "text-warning";
      soilBgClass = "bg-warning/20";
      soilProgressClass = "bg-warning";
    }
  }

  const healthConfig = {
    healthy: { label: "نبات صحي", color: "text-success", icon: "🟢" },
    medium: { label: "حالة متوسطة", color: "text-warning", icon: "🟡" },
    unhealthy: { label: "نبات غير صحي", color: "text-destructive", icon: "🔴" },
  };

  const currentHealth = hasData ? (healthConfig[data!.plantHealth] || healthConfig.medium) : null;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const WaitingValue = () => (
    <div className="flex items-center gap-2 text-muted-foreground">
      {isConnected ? (
        <>
          <Hourglass className="w-5 h-5 animate-spin opacity-50" />
          <span className="text-4xl font-mono font-bold opacity-40">--</span>
        </>
      ) : (
        <span className="text-4xl font-mono font-bold opacity-20">--</span>
      )}
    </div>
  );

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
    >
      {/* Temperature */}
      <motion.div variants={item} className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all" />
        <div className="flex items-center gap-3 mb-4 text-muted-foreground z-10">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10">
            <Thermometer className="w-5 h-5 text-orange-400" />
          </div>
          <h3 className="font-semibold text-lg">درجة الحرارة</h3>
        </div>
        <div className="z-10 flex items-end gap-2">
          {hasData ? (
            <>
              <span className="text-5xl font-mono font-bold text-white text-glow">
                {data!.temperature.toFixed(1)}
              </span>
              <span className="text-xl text-muted-foreground mb-1">°C</span>
            </>
          ) : (
            <WaitingValue />
          )}
        </div>
        {!hasData && isConnected && (
          <p className="text-xs text-muted-foreground mt-2 opacity-50 z-10">في انتظار قراءة الحساس...</p>
        )}
      </motion.div>

      {/* Air Humidity */}
      <motion.div variants={item} className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
        <div className="flex items-center gap-3 mb-4 text-muted-foreground z-10">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10">
            <Droplets className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="font-semibold text-lg">رطوبة الهواء</h3>
        </div>
        <div className="z-10 flex items-end gap-2">
          {hasData ? (
            <>
              <span className="text-5xl font-mono font-bold text-white text-glow">
                {data!.humidity.toFixed(1)}
              </span>
              <span className="text-xl text-muted-foreground mb-1">%</span>
            </>
          ) : (
            <WaitingValue />
          )}
        </div>
        {!hasData && isConnected && (
          <p className="text-xs text-muted-foreground mt-2 opacity-50 z-10">في انتظار قراءة الحساس...</p>
        )}
      </motion.div>

      {/* Soil Moisture */}
      <motion.div variants={item} className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group md:col-span-2 lg:col-span-1">
        <div className={`absolute -right-6 -top-6 w-24 h-24 ${hasData ? soilBgClass : 'bg-white/5'} rounded-full blur-2xl transition-all`} />

        <div className="flex justify-between items-start mb-4 z-10">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <Sprout className={`w-5 h-5 ${hasData ? soilColorClass : 'text-muted-foreground'}`} />
            </div>
            <h3 className="font-semibold text-lg">رطوبة التربة</h3>
          </div>
          {hasData && (
            <div className="flex flex-col items-end">
              <span className={`text-sm font-bold px-3 py-1 rounded-full bg-black/40 border border-white/10 ${soilColorClass}`}>
                {data!.soilStatus}
              </span>
              {currentHealth && (
                <span className={`text-xs mt-2 font-medium ${currentHealth.color}`}>
                  {currentHealth.icon} {currentHealth.label}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="z-10">
          {hasData ? (
            <>
              <div className="flex items-end gap-2 mb-3">
                <span className={`text-5xl font-mono font-bold text-glow ${soilColorClass}`}>
                  {data!.soilMoisture.toFixed(1)}
                </span>
                <span className="text-xl text-muted-foreground mb-1">%</span>
              </div>
              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  className={`h-full ${soilProgressClass}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${data!.soilMoisture}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 20 }}
                />
              </div>
            </>
          ) : (
            <>
              <WaitingValue />
              {isConnected && (
                <p className="text-xs text-muted-foreground mt-2 opacity-50">في انتظار قراءة الحساس...</p>
              )}
              <div className="w-full h-2 bg-black/50 rounded-full mt-3 border border-white/5" />
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
