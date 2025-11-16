import { DetectedPattern, NotelertSettings } from "./types";

export interface INotelertPlugin {
  app: any;
  settings: NotelertSettings;
  log(message: string): void;
  createNotificationAndMarkProcessed(pattern: DetectedPattern): Promise<void>;
  saveSettings(): Promise<void>;
  loadSettings?(): Promise<void>; // Opcional para compatibilidad
}

