import { motion } from "framer-motion";
import { Wifi, WifiOff, Power, Info } from "lucide-react";
import { Button } from "./ui/button";

interface ConnectionStatusProps {
  isConnected: boolean;
  isDemoMode: boolean;
  onToggle: () => void;
}

export function ConnectionStatus({ isConnected, isDemoMode, onToggle }: ConnectionStatusProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel rounded-2xl p-4 px-6 mb-6 relative overflow-hidden"
    >
      {/* Background glow based on status */}
      <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${isConnected ? 'bg-primary' : 'bg-destructive'}`} />

      <div className="flex items-center gap-4 z-10">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isConnected ? 'bg-primary/20 text-primary glow-primary' : 'bg-destructive/20 text-destructive glow-destructive'}`}>
          {isConnected ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-wide">
            روبوت نبتان
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-3 w-3">
              {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-primary' : 'bg-destructive'}`}></span>
            </span>
            <span className={`text-sm font-medium ${isConnected ? 'text-primary' : 'text-destructive'}`}>
              {isConnected ? 'متصل بالروبوت' : 'غير متصل'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 z-10 w-full sm:w-auto">
        {isDemoMode && (
          <div className="hidden md:flex items-center gap-2 bg-warning/10 text-warning px-3 py-1.5 rounded-full text-xs font-semibold border border-warning/20">
            <Info className="w-4 h-4" />
            وضع المحاكاة
          </div>
        )}
        
        <Button 
          onClick={onToggle}
          variant={isConnected ? "outline" : "default"}
          className={`w-full sm:w-auto gap-2 ${!isConnected && 'glow-primary'}`}
        >
          <Power className="w-5 h-5" />
          {isConnected ? 'قطع الاتصال' : 'اتصال بالروبوت'}
        </Button>
      </div>
    </motion.div>
  );
}
