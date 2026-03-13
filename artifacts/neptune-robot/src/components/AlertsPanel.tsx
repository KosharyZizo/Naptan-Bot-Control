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
      title: "عائق مكتشف",
      desc: "حساس IR اكتشف جسماً في مسار الروبوت",
      icon: ShieldAlert,
      color: "text-warning",
      bg: "bg-warning/20 border-warning/50",
      iconStr: "❗",
    },
    {
      id: "movementProblem" as const,
      active: status.movementProblem,
      title: "مشكلة في الحركة",
      desc: "المحركات لا تستجيب بالشكل المطلوب",
      icon: Wrench,
      color: "text-destructive",
      bg: "bg-destructive/20 border-destructive/50",
      iconStr: "⚠",
    },
    {
      id: "systemError" as const,
      active: status.systemError,
      title: "خلل في النظام",
      desc: "خطأ غير معروف في وحدة التحكم",
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/20 border-destructive/50",
      iconStr: "❓",
    },
  ];

  const hasActiveAlerts = alerts.some((a) => a.active);

  return (
    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle
            className={`w-5 h-5 ${hasActiveAlerts ? "text-destructive" : "text-muted-foreground"}`}
          />
          لوحة التنبيهات
        </h3>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {!isConnected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-40 py-8">
            <AlertTriangle className="w-12 h-12 mb-3" />
            <p className="font-medium">غير متاح</p>
            <p className="text-sm mt-1">يجب الاتصال بالروبوت أولاً</p>
          </div>
        ) : (
          <>
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                className={`relative overflow-hidden rounded-xl p-4 border transition-all duration-300
                  ${alert.active ? alert.bg : "bg-white/5 border-white/10 opacity-60"}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`text-2xl mt-1 ${alert.active ? "animate-pulse" : "grayscale opacity-50"}`}
                  >
                    {alert.iconStr}
                  </div>
                  <div>
                    <h4
                      className={`font-bold text-lg ${alert.active ? alert.color : "text-white/70"}`}
                    >
                      {alert.title}
                    </h4>
                    <p className="text-sm text-white/50 mt-1">{alert.desc}</p>
                  </div>
                </div>

                {alert.active && (
                  <motion.div
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 pointer-events-none bg-current opacity-10"
                  />
                )}
              </motion.div>
            ))}

            {!hasActiveAlerts && (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 py-8">
                <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="font-medium text-lg">لا توجد تنبيهات</p>
                <p className="text-sm">النظام يعمل بشكل طبيعي</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
