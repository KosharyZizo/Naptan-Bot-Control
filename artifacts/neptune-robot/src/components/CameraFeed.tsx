import { motion } from "framer-motion";
import { Camera, Radio, AlertCircle } from "lucide-react";

interface CameraFeedProps {
  isActive: boolean;
  isConnected: boolean;
}

export function CameraFeed({ isActive, isConnected }: CameraFeedProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-full aspect-video rounded-3xl overflow-hidden glass-panel border-white/20 group"
    >
      {/* Video Placeholder Background */}
      <div className="absolute inset-0 bg-[#020817] flex items-center justify-center">
        {isActive && isConnected ? (
          <div className="absolute inset-0 overflow-hidden">
            {/* Simulated camera grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            
            {/* Scanning line animation */}
            <motion.div 
              animate={{ y: ["0%", "100%", "0%"] }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-primary/10 to-transparent border-b border-primary/30"
            />
            
            {/* Center target crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-primary/50 rounded-full" />
              <div className="absolute w-full h-[1px] bg-white/20" />
              <div className="absolute h-full w-[1px] bg-white/20" />
            </div>
            
            {/* Mock image for visual interest in demo */}
            <img 
              src="https://pixabay.com/get/g06cc041ceed725c87b4fc55cf12f9adb0f11d185e23316d72c639b234b272238d4dc1dcec448a40c65e3e4102dba1af91fd592c3e0c81b56b560eef149feccee_1280.jpg" 
              alt="Agricultural Field" 
              className="w-full h-full object-cover opacity-30 mix-blend-overlay"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            {!isConnected ? (
              <>
                <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-xl font-medium">الكاميرا غير متاحة</p>
                <p className="text-sm mt-2 opacity-70">يجب الاتصال بالروبوت أولاً</p>
              </>
            ) : (
              <>
                <Camera className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-xl font-medium">الكاميرا متوقفة</p>
                <p className="text-sm mt-2 opacity-70">اضغط على زر (F1) للتشغيل</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Camera Overlay UI */}
      {isActive && isConnected && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
              <span className="text-white font-mono font-bold tracking-wider">LIVE REC</span>
            </div>
            <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-white font-mono">
              CAM-ESP32
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-primary font-mono flex items-center gap-2">
              <Radio className="w-4 h-4" />
              1080p / 30fps
            </div>
            <div className="text-white/50 font-mono text-sm">
              نبتان - وضع المراقبة
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
