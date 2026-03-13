import { useState } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, StopCircle, Camera } from "lucide-react";
import { Button } from "./ui/button";
import type { RobotCommand } from "@workspace/api-client-react";

interface ControlPadProps {
  isConnected: boolean;
  cameraActive: boolean;
  onCommand: (cmd: RobotCommand["command"]) => void;
}

export function ControlPad({ isConnected, cameraActive, onCommand }: ControlPadProps) {
  const [activeBtn, setActiveBtn] = useState<string | null>(null);

  const handlePress = (cmd: RobotCommand["command"]) => {
    if (!isConnected) return;
    setActiveBtn(cmd);
    onCommand(cmd);
    setTimeout(() => setActiveBtn(null), 200);
  };

  const btnBase =
    "h-20 w-full sm:w-20 rounded-2xl glass-panel border border-white/10 flex flex-col items-center justify-center gap-1.5 transition-all duration-150 select-none";

  const btnClass = (cmd: string) => {
    const disabled = !isConnected
      ? "opacity-25 cursor-not-allowed"
      : "hover:bg-white/10 hover:border-white/30 cursor-pointer";
    const active =
      activeBtn === cmd
        ? "bg-primary/30 border-primary scale-95 text-primary shadow-[0_0_20px_rgba(34,197,94,0.4)]"
        : "text-white/80";
    return `${btnBase} ${disabled} ${active}`;
  };

  const buttons = [
    { cmd: "F" as const, label: "أمام",  Icon: ArrowUp    },
    { cmd: "R" as const, label: "يمين",  Icon: ArrowRight  },
    { cmd: "L" as const, label: "يسار",  Icon: ArrowLeft   },
    { cmd: "B" as const, label: "خلف",   Icon: ArrowDown  },
  ];

  return (
    <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col items-center justify-center h-full relative overflow-hidden">
      {/* نمط خلفي ديكوري */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none opacity-50" />

      <h3 className="text-xl font-bold mb-8 w-full text-center relative z-10">
        لوحة التحكم في الحركة
      </h3>

      {/* طبقة التعطيل عند انقطاع الاتصال */}
      {!isConnected && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl">
          <p className="text-muted-foreground text-sm font-medium opacity-70 px-6 text-center leading-relaxed">
            اتصل بالروبوت أولاً
            <br />
            لتفعيل أزرار التحكم
          </p>
        </div>
      )}

      {/* أزرار الاتجاهات */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 relative z-10 w-full max-w-[320px] mx-auto">
        {/* صف علوي */}
        <div />
        <button disabled={!isConnected} onClick={() => handlePress("F")} className={btnClass("F")}>
          <ArrowUp className="w-7 h-7" />
          <span className="text-xs font-bold font-mono">F — أمام</span>
        </button>
        <div />

        {/* صف أوسط */}
        <button disabled={!isConnected} onClick={() => handlePress("R")} className={btnClass("R")}>
          <ArrowRight className="w-7 h-7" />
          <span className="text-xs font-bold font-mono">R — يمين</span>
        </button>

        {/* زر التوقف */}
        <button
          disabled={!isConnected}
          onClick={() => handlePress("S")}
          className={`${btnBase} bg-destructive/10 border-destructive/30 text-destructive
            ${!isConnected ? "opacity-25 cursor-not-allowed" : "hover:bg-destructive/20 cursor-pointer"}
            ${activeBtn === "S" ? "scale-95 bg-destructive/40 border-destructive" : ""}`}
        >
          <StopCircle className="w-7 h-7" />
          <span className="text-xs font-bold font-mono text-white/80">S — توقف</span>
        </button>

        <button disabled={!isConnected} onClick={() => handlePress("L")} className={btnClass("L")}>
          <ArrowLeft className="w-7 h-7" />
          <span className="text-xs font-bold font-mono">L — يسار</span>
        </button>

        {/* صف سفلي */}
        <div />
        <button disabled={!isConnected} onClick={() => handlePress("B")} className={btnClass("B")}>
          <ArrowDown className="w-7 h-7" />
          <span className="text-xs font-bold font-mono">B — خلف</span>
        </button>
        <div />
      </div>

      {/* زر الكاميرا F1 */}
      <div className="w-full max-w-[320px] mt-8 pt-6 border-t border-white/10 flex justify-center relative z-10">
        <Button
          disabled={!isConnected}
          onClick={() => handlePress("K")}
          variant="glass"
          size="lg"
          className={`w-full flex items-center justify-center gap-3
            ${cameraActive ? "bg-primary/20 border-primary text-primary glow-primary" : ""}`}
        >
          <Camera className={`w-5 h-5 ${cameraActive ? "animate-pulse" : ""}`} />
          <div className="flex flex-col items-start leading-tight">
            <span className="text-xs opacity-70">وضع المراقبة</span>
            <span className="font-mono font-bold tracking-widest">F1 — K</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
