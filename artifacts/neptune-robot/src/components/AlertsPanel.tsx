import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Wrench, ShieldAlert } from "lucide-react";
import type { RobotStatus } from "@workspace/api-client-react";

interface AlertsPanelProps {
  status: RobotStatus;
  isDemoMode?: boolean;
  onToggleDemoAlert?: (type: 'obstacleDetected' | 'movementProblem' | 'systemError') => void;
}

export function AlertsPanel({ status, isDemoMode, onToggleDemoAlert }: AlertsPanelProps) {
  const alerts = [
    {
      id: 'obstacleDetected' as const,
      active: status.obstacleDetected,
      title: "عائق مكتشف",
      desc: "حساس IR يكتشف جسماً في المسار",
      icon: ShieldAlert,
      color: "text-warning",
      bg: "bg-warning/20 border-warning/50 glow-warning",
      iconStr: "❗"
    },
    {
      id: 'movementProblem' as const,
      active: status.movementProblem,
      title: "مشكلة في الحركة",
      desc: "المحركات لا تستجيب بالشكل المطلوب",
      icon: Wrench,
      color: "text-destructive",
      bg: "bg-destructive/20 border-destructive/50 glow-destructive",
      iconStr: "⚠"
    },
    {
      id: 'systemError' as const,
      active: status.systemError,
      title: "خلل في النظام",
      desc: "خطأ غير معروف في وحدة التحكم",
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/20 border-destructive/50 glow-destructive",
      iconStr: "❓"
    }
  ];

  const hasActiveAlerts = alerts.some(a => a.active);

  return (
    <div className="glass-panel rounded-2xl p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <AlertTriangle className={`w-5 h-5 ${hasActiveAlerts ? 'text-destructive' : 'text-muted-foreground'}`} />
          لوحة التنبيهات
        </h3>
        
        {isDemoMode && (
          <div className="text-xs text-muted-foreground bg-black/30 px-2 py-1 rounded border border-white/5">
            اضغط للتجربة
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-3">
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            layout
            onClick={() => isDemoMode && onToggleDemoAlert?.(alert.id)}
            className={`
              relative overflow-hidden rounded-xl p-4 border transition-all duration-300
              ${alert.active ? alert.bg : 'bg-white/5 border-white/10 opacity-60'}
              ${isDemoMode ? 'cursor-pointer hover:bg-white/10' : ''}
            `}
          >
            <div className="flex items-start gap-4">
              <div className={`text-2xl mt-1 ${alert.active ? 'animate-pulse' : 'grayscale'}`}>
                {alert.iconStr}
              </div>
              <div>
                <h4 className={`font-bold text-lg ${alert.active ? alert.color : 'text-white/70'}`}>
                  {alert.title}
                </h4>
                <p className="text-sm text-white/50 mt-1">
                  {alert.desc}
                </p>
              </div>
            </div>
            
            {/* Animated background pulse for active alerts */}
            {alert.active && (
              <motion.div 
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-current pointer-events-none"
                style={{ color: 'inherit' }}
              />
            )}
          </motion.div>
        ))}

        {!hasActiveAlerts && !isDemoMode && (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50 py-8">
            <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-medium text-lg">لا توجد تنبيهات</p>
            <p className="text-sm">النظام يعمل بشكل طبيعي</p>
          </div>
        )}
      </div>
    </div>
  );
}
