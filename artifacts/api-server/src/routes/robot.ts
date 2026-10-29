import { Router, type IRouter } from "express";
import {
  GetSensorDataResponse,
  UpdateSensorDataBody,
  UpdateSensorDataResponse,
  SendRobotCommandBody,
  SendRobotCommandResponse,
  GetRobotStatusResponse,
  UpdateRobotStatusBody,
  UpdateRobotStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

type SensorState = {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  soilStatus: string;
  plantHealth: "healthy" | "medium" | "unhealthy";
  updatedAt: Date;
  hasRealData: boolean;
};

type StatusState = {
  connected: boolean;
  obstacleDetected: boolean;
  movementProblem: boolean;
  systemError: boolean;
  cameraActive: boolean;
  lastSeen: Date;
};

let sensorState: SensorState = {
  temperature: 0,
  humidity: 0,
  soilMoisture: 0,
  soilStatus: "لا توجد بيانات",
  plantHealth: "medium",
  updatedAt: new Date(),
  hasRealData: false,
};

let robotStatus: StatusState = {
  connected: false,
  obstacleDetected: false,
  movementProblem: false,
  systemError: false,
  cameraActive: false,
  lastSeen: new Date(),
};

const CONNECTION_TIMEOUT_MS = 20_000;

function expireStaleConnection(): void {
  if (!robotStatus.connected) return;
  if (Date.now() - robotStatus.lastSeen.getTime() <= CONNECTION_TIMEOUT_MS) return;

  sensorState.hasRealData = false;
  robotStatus = {
    connected: false,
    obstacleDetected: false,
    movementProblem: false,
    systemError: false,
    cameraActive: false,
    lastSeen: new Date(),
  };
}

function getSoilStatus(moisture: number): string {
  if (moisture <= 50) return "التربة تحتاج ماء";
  if (moisture <= 80) return "رطوبة متوسطة";
  return "التربة لا تحتاج ماء";
}

function getPlantHealth(
  moisture: number,
  temperature: number,
  humidity: number
): "healthy" | "medium" | "unhealthy" {
  const moistureOk = moisture >= 50 && moisture <= 80;
  const tempOk = temperature >= 15 && temperature <= 35;
  const humidityOk = humidity >= 40 && humidity <= 80;
  const goodCount = [moistureOk, tempOk, humidityOk].filter(Boolean).length;
  if (goodCount === 3) return "healthy";
  if (goodCount >= 1) return "medium";
  return "unhealthy";
}

router.get("/sensor-data", (_req, res) => {
  expireStaleConnection();
  if (!sensorState.hasRealData || !robotStatus.connected) {
    return res.json({ hasRealData: false });
  }
  const data = GetSensorDataResponse.parse({
    temperature: sensorState.temperature,
    humidity: sensorState.humidity,
    soilMoisture: sensorState.soilMoisture,
    soilStatus: sensorState.soilStatus,
    plantHealth: sensorState.plantHealth,
    updatedAt: sensorState.updatedAt,
  });
  return res.json({ hasRealData: true, data });
});

router.post("/sensor-data", (req, res) => {
  const body = UpdateSensorDataBody.parse(req.body);
  const soilStatus = getSoilStatus(body.soilMoisture);
  const plantHealth = getPlantHealth(
    body.soilMoisture,
    body.temperature,
    body.humidity
  );

  sensorState = {
    temperature: body.temperature,
    humidity: body.humidity,
    soilMoisture: body.soilMoisture,
    soilStatus,
    plantHealth,
    updatedAt: new Date(),
    hasRealData: true,
  };

  const data = UpdateSensorDataResponse.parse({
    temperature: sensorState.temperature,
    humidity: sensorState.humidity,
    soilMoisture: sensorState.soilMoisture,
    soilStatus: sensorState.soilStatus,
    plantHealth: sensorState.plantHealth,
    updatedAt: sensorState.updatedAt,
  });
  res.json(data);
});

router.post("/command", (req, res) => {
  const body = SendRobotCommandBody.parse(req.body);

  if (!robotStatus.connected) {
    return res.status(403).json({
      success: false,
      command: body.command,
      message: "الروبوت غير متصل",
    });
  }

  if (body.command === "K") {
    robotStatus.cameraActive = !robotStatus.cameraActive;
  }
  robotStatus.lastSeen = new Date();

  const commandNames: Record<string, string> = {
    F: "تحرك للأمام",
    B: "تحرك للخلف",
    L: "دوران لليسار",
    R: "دوران لليمين",
    K: robotStatus.cameraActive ? "تشغيل الكاميرا" : "إيقاف الكاميرا",
    S: "توقف",
  };

  const result = SendRobotCommandResponse.parse({
    success: true,
    command: body.command,
    message: commandNames[body.command] || "أمر غير معروف",
  });

  return res.json(result);
});

router.get("/status", (_req, res) => {
  expireStaleConnection();
  const data = GetRobotStatusResponse.parse(robotStatus);
  res.json(data);
});

router.post("/status", (req, res) => {
  const body = UpdateRobotStatusBody.parse(req.body);

  if (!body.connected) {
    sensorState.hasRealData = false;
    robotStatus = {
      connected: false,
      obstacleDetected: false,
      movementProblem: false,
      systemError: false,
      cameraActive: false,
      lastSeen: new Date(),
    };
  } else {
    robotStatus = {
      ...body,
      lastSeen: new Date(),
    };
  }

  const data = UpdateRobotStatusResponse.parse(robotStatus);
  res.json(data);
});

export default router;
