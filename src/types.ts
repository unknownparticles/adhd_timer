export enum TimerDirection {
  PORTRAIT_UP = "PORTRAIT_UP",       // Mode A (e.g., Pomodoro)
  PORTRAIT_DOWN = "PORTRAIT_DOWN",   // Mode B (e.g., Rest/Long Break)
  LANDSCAPE_LEFT = "LANDSCAPE_LEFT",  // Mode C (e.g., Short Focus)
  LANDSCAPE_RIGHT = "LANDSCAPE_RIGHT" // Mode D (e.g., Short Break)
}

export interface TimerModeConfig {
  id: TimerDirection;
  label: string;
  duration: number; // in minutes
  color: string;    // Tailwind color classes (e.g., "bg-rose-500", "text-rose-500")
  description: string;
  iconName: string; // Lucide icon identifier
}

export enum DeviceFaceState {
  FACE_UP = "FACE_UP",
  FACE_DOWN = "FACE_DOWN",
  TILTED = "TILTED"
}

export interface SensorData {
  x: number;
  y: number;
  z: number;
  alpha: number;
  beta: number;
  gamma: number;
  usingSimulator: boolean;
}

export interface HistoryLog {
  id: string;
  timestamp: string; // ISO string
  durationMinutes: number;
  modeLabel: string;
  direction: TimerDirection;
  completed: boolean;
}

export interface AppSettings {
  vibrationEnabled: boolean;
  soundEnabled: boolean;
  tickingSoundEnabled: boolean;
  autoSaveEnabled: boolean;
  modes: Record<TimerDirection, TimerModeConfig>;
  volume: number;
}
