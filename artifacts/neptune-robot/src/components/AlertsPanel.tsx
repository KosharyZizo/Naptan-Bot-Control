import { motion } from "framer-motion";
import { AlertTriangle, Wrench, ShieldAlert } from "lucide-react";
import type { RobotStatus } from "@workspace/api-client-react";

interface AlertsPanelProps {
  status: RobotStatus;
  isConnected: boolean;
}

export function AlertsPanel({ status, isConnected }: AlertsPanelProps) {
  const alerts = [
    {
      id: "obstacleDetected" as const,
      active: status.obstacleDetected,
      title: "عائق في المسار",
      desc: "اكتشف حساس IR جسماً أمام الروبوت",
      icon: ShieldAlert,
      color: "text-warning",
      bg: "bg-warning/20 border-warning/40",
      iconStr: "❗",
    },
    {
      id: "movementProblem" as const,
      active: status.movementProblem,
      title: "خلل في الحركة",
      desc: "المحركات لا تستجيب بصورة صحيحة",
      icon: Wrench,
      color: "text-destructive",
      bg: "bg-destructive/20 border-destructive/40",
      iconStr: "⚠",
    },
    {
      id: "systemError" as const,
      active: status.systemError,
      title: "خطأ في النظام",
      desc: "حدث خطأ غير متوقع في وحدة التحكم",
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/20 border-destructive/40",
      iconStr: "❓",
    },
  ];

  const hasActiveAlerts = alerts.some((a) => a.active);

  return (
    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
        <AlertTriangle
          className={`w-5 h-5 ${hasActiveAlerts ? "text-destructive" : "text-muted-foreground"}`}
        />
        لوحة التنبيهات
      </h3>

      <div className="flex-1 flex flex-col gap-3">
        {!isConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-40 py-8 gap-3">
            <AlertTriangle className="w-10 h-10" />
            <p className="font-medium text-base">غير متاح</p>
            <p className="text-sm">اتصل بالروبوت أولاً</p>
          </div>
        ) : (
          <>
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                className={`relative overflow-hidden rounded-xl p-4 border transition-all duration-300
                  ${alert.active ? alert.bg : "bg-white/5 border-white/10 opacity-50"}`}
              >
                <div className="flex items-start gap-4">
                  <span className={`text-2xl mt-0.5 ${alert.active ? "animate-pulse" : "grayscale opacity-40"}`}>
                    {alert.iconStr}
                  </span>
                  <div>
                    <h4 className={`font-bold ${alert.active ? alert.color : "text-white/60"}`}>
                      {alert.title}
                    </h4>
                    <p className="text-sm text-white/40 mt-0.5">{alert.desc}</p>
                  </div>
                </div>

                {alert.active && (
                  <motion.div
                    animate={{ opacity: [0.05, 0.2, 0.05] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 pointer-events-none bg-current opacity-10"
                  />
                )}
              </motion.div>
            ))}

            {!hasActiveAlerts && (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 py-6 gap-3">
                <div className="w-14 h-14 rounded-full bg-success/10 text-success flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold text-base">لا توجد تنبيهات</p>
                <p className="text-sm">النظام يعمل بشكل سليم</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
