import { useEffect } from "react";
import { motion } from "framer-motion";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { SensorCards } from "@/components/SensorCards";
import { CameraFeed } from "@/components/CameraFeed";
import { AlertsPanel } from "@/components/AlertsPanel";
import { ControlPad } from "@/components/ControlPad";
import { useRobotControl } from "@/hooks/use-robot-simulation";
import { useToast } from "@/hooks/use-toast";
import type { RobotCommand } from "@workspace/api-client-react";

export default function Dashboard() {
  const { 
    isConnected, 
    isDemoMode, 
    sensorData, 
    robotStatus, 
    toggleConnection, 
    sendCommand,
    demoActions
  } = useRobotControl();
  
  const { toast } = useToast();

  const handleCommand = async (cmd: RobotCommand['command']) => {
    const res = await sendCommand(cmd);
    
    // Command Dictionary for better toast messages
    const cmdMap: Record<string, string> = {
      'F': 'تحرك للأمام',
      'B': 'تحرك للخلف',
      'R': 'دوران لليمين',
      'L': 'دوران لليسار',
      'S': 'توقف طارئ',
      'K': robotStatus.cameraActive ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'
    };

    if (res.success) {
      toast({
        title: "تم إرسال الأمر بنجاح",
        description: `أمر (${cmd}): ${cmdMap[cmd]}`,
        variant: "default",
        className: "bg-primary text-primary-foreground border-primary",
        duration: 1500,
      });
    } else {
      toast({
        title: "فشل إرسال الأمر",
        description: res.message,
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  return (
    <div 
      className="min-h-screen bg-background text-foreground font-sans relative"
      dir="rtl"
    >
      {/* Abstract Background Image */}
      <div 
        className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/agri-tech-bg.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Gradient Orbs */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

      <main className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Top Header / Connection Status */}
        <ConnectionStatus 
          isConnected={isConnected} 
          isDemoMode={isDemoMode}
          onToggle={toggleConnection} 
        />

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Right Column (Sensors & Controls) - Takes 7 cols on extra large */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            
            {/* Top Area: Camera */}
            <div className="w-full">
              <CameraFeed 
                isActive={robotStatus.cameraActive} 
                isConnected={isConnected} 
              />
            </div>
            
            {/* Bottom Area: Sensors */}
            <div>
              <SensorCards data={sensorData} />
            </div>

          </div>

          {/* Left Column (Camera & Alerts) - Takes 5 cols on extra large */}
          <div className="xl:col-span-5 flex flex-col gap-6">
            
            {/* Control Pad */}
            <div className="h-[450px]">
               <ControlPad 
                isConnected={isConnected} 
                cameraActive={robotStatus.cameraActive}
                onCommand={handleCommand}
              />
            </div>

            {/* Alerts Panel */}
            <div className="flex-1 min-h-[300px]">
              <AlertsPanel 
                status={robotStatus} 
                isDemoMode={isDemoMode}
                onToggleDemoAlert={demoActions.toggleAlert}
              />
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
