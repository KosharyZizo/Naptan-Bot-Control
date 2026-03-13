import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  StopCircle, Camera 
} from "lucide-react";
import { Button } from "./ui/button";
import type { RobotCommand } from "@workspace/api-client-react";

interface ControlPadProps {
  isConnected: boolean;
  cameraActive: boolean;
  onCommand: (cmd: RobotCommand['command']) => void;
}

export function ControlPad({ isConnected, cameraActive, onCommand }: ControlPadProps) {
  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  const handlePress = (cmd: RobotCommand['command']) => {
    if (!isConnected) return;
    setActiveBtn(cmd);
    onCommand(cmd);
    setTimeout(() => setActiveBtn(null), 200);
  };

  const getBtnClass = (cmd: string) => {
    const base = "h-20 w-full sm:w-20 rounded-2xl glass-panel border-white/10 flex flex-col items-center justify-center gap-2 transition-all duration-150";
    const disabled = !isConnected ? "opacity-40 cursor-not-allowed" : "hover:bg-white/10 hover:border-white/30 cursor-pointer shadow-lg";
    const active = activeBtn === cmd ? "bg-primary/30 border-primary shadow-[0_0_20px_rgba(var(--color-primary),0.5)] scale-95 text-primary" : "text-white/80";
    
    return `${base} ${disabled} ${active}`;
  };

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center h-full relative overflow-hidden">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none opacity-50"></div>

      <h3 className="text-xl font-bold mb-8 w-full text-center relative z-10">
        لوحة التحكم في الحركة
      </h3>

      <div className="grid grid-cols-3 gap-3 md:gap-4 relative z-10 w-full max-w-[320px] mx-auto">
        
        {/* Top Row */}
        <div></div>
        <button 
          disabled={!isConnected}
          onClick={() => handlePress('F')}
          className={getBtnClass('F')}
        >
          <ArrowUp className="w-8 h-8" />
          <span className="text-xs font-bold font-mono">F (أمام)</span>
        </button>
        <div></div>

        {/* Middle Row */}
        <button 
          disabled={!isConnected}
          onClick={() => handlePress('R')} // Note: RTL means 'R' might visually be on the left, but physically it's Right. We place it physically on the right of the pad.
          className={getBtnClass('R')}
        >
          <ArrowRight className="w-8 h-8" />
          <span className="text-xs font-bold font-mono">R (يمين)</span>
        </button>
        
        <button 
          disabled={!isConnected}
          onClick={() => handlePress('S')}
          className={`${getBtnClass('S')} !bg-destructive/10 hover:!bg-destructive/20 border-destructive/30 text-destructive ${activeBtn === 'S' ? '!bg-destructive/50 !border-destructive glow-destructive' : ''}`}
        >
          <StopCircle className="w-8 h-8" />
          <span className="text-xs font-bold font-mono text-white">S (توقف)</span>
        </button>

        <button 
          disabled={!isConnected}
          onClick={() => handlePress('L')}
          className={getBtnClass('L')}
        >
          <ArrowLeft className="w-8 h-8" />
          <span className="text-xs font-bold font-mono">L (يسار)</span>
        </button>

        {/* Bottom Row */}
        <div></div>
        <button 
          disabled={!isConnected}
          onClick={() => handlePress('B')}
          className={getBtnClass('B')}
        >
          <ArrowDown className="w-8 h-8" />
          <span className="text-xs font-bold font-mono">B (خلف)</span>
        </button>
        <div></div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-[320px] mt-8 pt-8 border-t border-white/10 flex justify-center relative z-10">
        <Button
          disabled={!isConnected}
          onClick={() => handlePress('K')}
          variant="glass"
          size="lg"
          className={`w-full flex items-center justify-center gap-3 ${cameraActive ? 'bg-primary/20 border-primary text-primary glow-primary' : ''}`}
        >
          <Camera className={`w-6 h-6 ${cameraActive ? 'animate-pulse' : ''}`} />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm opacity-80">وضع المراقبة</span>
            <span className="font-mono font-bold tracking-widest text-lg">F1 (K)</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
