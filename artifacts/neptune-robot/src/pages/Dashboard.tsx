import { motion, AnimatePresence } from "framer-motion";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { SensorCards } from "@/components/SensorCards";
import { CameraFeed } from "@/components/CameraFeed";
import { AlertsPanel } from "@/components/AlertsPanel";
import { ControlPad } from "@/components/ControlPad";
import { useRobotControl } from "@/hooks/use-robot-control";
import { useToast } from "@/hooks/use-toast";
import type { RobotCommand } from "@workspace/api-client-react";

export default function Dashboard() {
  const {
    phase,
    isConnected,
    connectionMessage,
    sensorData,
    robotStatus,
    connect,
    disconnect,
    sendCommand,
  } = useRobotControl();

  const { toast } = useToast();

  const handleCommand = async (cmd: RobotCommand["command"]) => {
    const res = await sendCommand(cmd);

    const cmdMap: Record<string, string> = {
      F: "تحرك للأمام",
      B: "تحرك للخلف",
      R: "دوران لليمين",
      L: "دوران لليسار",
      S: "توقف طارئ",
      K: robotStatus.cameraActive ? "إيقاف الكاميرا" : "تشغيل الكاميرا",
    };

    if (res.success) {
      toast({
        title: "تم إرسال الأمر",
        description: `(${cmd}): ${cmdMap[cmd]}`,
        variant: "default",
        className: "bg-primary text-primary-foreground border-primary",
        duration: 1200,
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
    <div className="min-h-screen bg-background text-foreground font-sans relative" dir="rtl">
      {/* خلفية ديكورية */}
      <div
        className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-screen"
        style={{
          backgroundImage: `url(${import.meta.env.BASE_URL}images/agri-tech-bg.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3 pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3 pointer-events-none z-0" />

      <main className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">

        {/* شريط الاتصال */}
        <ConnectionStatus
          isConnected={isConnected}
          phase={phase}
          connectionMessage={connectionMessage}
          onConnect={connect}
          onDisconnect={disconnect}
        />

        {/* رسالة الاتصال على الشاشة الصغيرة */}
        <AnimatePresence>
          {connectionMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`md:hidden mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border
                ${connectionMessage.includes("Successfully")
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-destructive/10 text-destructive border-destructive/30"}`}
            >
              {connectionMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* شبكة المحتوى الرئيسية */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* العمود الأيمن: الكاميرا + الحساسات */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            <CameraFeed isActive={robotStatus.cameraActive} isConnected={isConnected} />
            <SensorCards data={sensorData} isConnected={isConnected} />
          </div>

          {/* العمود الأيسر: لوحة التحكم + التنبيهات */}
          <div className="xl:col-span-5 flex flex-col gap-6">
            <div className="h-[450px]">
              <ControlPad
                isConnected={isConnected}
                cameraActive={robotStatus.cameraActive}
                onCommand={handleCommand}
              />
            </div>
            <div className="flex-1 min-h-[300px]">
              <AlertsPanel status={robotStatus} isConnected={isConnected} />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
