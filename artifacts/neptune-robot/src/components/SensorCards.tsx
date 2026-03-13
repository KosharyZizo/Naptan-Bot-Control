import { motion } from "framer-motion";
import { Thermometer, Droplets, Sprout } from "lucide-react";
import type { SensorData } from "@workspace/api-client-react";

interface SensorCardsProps {
  data: SensorData;
}

export function SensorCards({ data }: SensorCardsProps) {
  // Determine soil status color
  let soilColorClass = "text-primary";
  let soilBgClass = "bg-primary/20";
  let soilProgressClass = "bg-primary";
  
  if (data.soilMoisture < 50) {
    soilColorClass = "text-destructive";
    soilBgClass = "bg-destructive/20";
    soilProgressClass = "bg-destructive";
  } else if (data.soilMoisture < 80) {
    soilColorClass = "text-warning";
    soilBgClass = "bg-warning/20";
    soilProgressClass = "bg-warning";
  }

  // Plant health formatting
  const healthConfig = {
    healthy: { label: "نبات صحي", color: "text-success", icon: "🟢" },
    medium: { label: "حالة متوسطة", color: "text-warning", icon: "🟡" },
    unhealthy: { label: "نبات غير صحي", color: "text-destructive", icon: "🔴" }
  };

  const currentHealth = healthConfig[data.plantHealth] || healthConfig.medium;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
    >
      {/* Temperature */}
      <motion.div variants={item} className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
        <div className="flex items-center gap-3 mb-4 text-muted-foreground z-10">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10">
            <Thermometer className="w-5 h-5 text-orange-400" />
          </div>
          <h3 className="font-semibold text-lg">درجة الحرارة</h3>
        </div>
        <div className="z-10 flex items-end gap-2">
          <span className="text-5xl font-mono font-bold text-white text-glow">
            {data.temperature}
          </span>
          <span className="text-xl text-muted-foreground mb-1">°C</span>
        </div>
      </motion.div>

      {/* Air Humidity */}
      <motion.div variants={item} className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
        <div className="flex items-center gap-3 mb-4 text-muted-foreground z-10">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10">
            <Droplets className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="font-semibold text-lg">رطوبة الهواء</h3>
        </div>
        <div className="z-10 flex items-end gap-2">
          <span className="text-5xl font-mono font-bold text-white text-glow">
            {data.humidity}
          </span>
          <span className="text-xl text-muted-foreground mb-1">%</span>
        </div>
      </motion.div>

      {/* Soil Moisture */}
      <motion.div variants={item} className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group md:col-span-2 lg:col-span-1">
        <div className={`absolute -right-6 -top-6 w-24 h-24 ${soilBgClass} rounded-full blur-2xl transition-all`}></div>
        
        <div className="flex justify-between items-start mb-4 z-10">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <Sprout className={`w-5 h-5 ${soilColorClass}`} />
            </div>
            <h3 className="font-semibold text-lg">رطوبة التربة</h3>
          </div>
          <div className="flex flex-col items-end">
             <span className={`text-sm font-bold px-3 py-1 rounded-full bg-black/40 border border-white/10 ${soilColorClass}`}>
               {data.soilStatus}
             </span>
             <span className={`text-xs mt-2 font-medium ${currentHealth.color}`}>
               {currentHealth.icon} {currentHealth.label}
             </span>
          </div>
        </div>

        <div className="z-10">
          <div className="flex items-end gap-2 mb-3">
            <span className={`text-5xl font-mono font-bold text-glow ${soilColorClass}`}>
              {data.soilMoisture}
            </span>
            <span className="text-xl text-muted-foreground mb-1">%</span>
          </div>
          
          {/* Custom Progress Bar */}
          <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className={`h-full ${soilProgressClass} shadow-[0_0_10px_currentColor]`}
              initial={{ width: 0 }}
              animate={{ width: `${data.soilMoisture}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
