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

let sensorData = {
  temperature: 28.5,
  humidity: 65,
  soilMoisture: 45,
  soilStatus: "التربة تحتاج ماء",
  plantHealth: "medium" as "healthy" | "medium" | "unhealthy",
  updatedAt: new Date(),
};

let robotStatus = {
  connected: false,
  obstacleDetected: false,
  movementProblem: false,
  systemError: false,
  cameraActive: false,
  lastSeen: new Date(),
};

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
  const data = GetSensorDataResponse.parse(sensorData);
  res.json(data);
});

router.post("/sensor-data", (req, res) => {
  const body = UpdateSensorDataBody.parse(req.body);
  const soilStatus = getSoilStatus(body.soilMoisture);
  const plantHealth = getPlantHealth(
    body.soilMoisture,
    body.temperature,
    body.humidity
  );

  sensorData = {
    ...body,
    soilStatus,
    plantHealth,
    updatedAt: new Date(),
  };

  const data = UpdateSensorDataResponse.parse(sensorData);
  res.json(data);
});

router.post("/command", (req, res) => {
  const body = SendRobotCommandBody.parse(req.body);

  if (body.command === "K") {
    robotStatus.cameraActive = !robotStatus.cameraActive;
    robotStatus.lastSeen = new Date();
  } else {
    robotStatus.lastSeen = new Date();
  }

  const commandNames: Record<string, string> = {
    F: "تحرك للأمام",
    B: "تحرك للخلف",
    L: "دوران لليسار",
    R: "دوران لليمين",
    K: "تفعيل الكاميرا",
    S: "توقف",
  };

  const result = SendRobotCommandResponse.parse({
    success: true,
    command: body.command,
    message: commandNames[body.command] || "أمر غير معروف",
  });

  res.json(result);
});

router.get("/status", (_req, res) => {
  const data = GetRobotStatusResponse.parse(robotStatus);
  res.json(data);
});

router.post("/status", (req, res) => {
  const body = UpdateRobotStatusBody.parse(req.body);
  robotStatus = {
    ...body,
    lastSeen: new Date(),
  };
  const data = UpdateRobotStatusResponse.parse(robotStatus);
  res.json(data);
});

export default router;
