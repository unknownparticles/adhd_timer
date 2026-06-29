import { AppSettings, TimerDirection } from "./types";

export const LOCAL_STORAGE_SETTINGS_KEY = "gravity_timer_settings_v1";
export const LOCAL_STORAGE_HISTORY_KEY = "gravity_timer_history_v1";

export const DEFAULT_SETTINGS: AppSettings = {
  vibrationEnabled: true,
  soundEnabled: true,
  tickingSoundEnabled: false,
  autoSaveEnabled: true,
  modes: {
    [TimerDirection.PORTRAIT_UP]: {
      id: TimerDirection.PORTRAIT_UP,
      label: "深度专注 (Pomodoro)",
      duration: 25,
      color: "rose",
      description: "竖屏朝上：用于高强度的核心工作与学习，保持绝对专注。",
      iconName: "Flame"
    },
    [TimerDirection.LANDSCAPE_RIGHT]: {
      id: TimerDirection.LANDSCAPE_RIGHT,
      label: "舒适短休 (Short Break)",
      duration: 5,
      color: "emerald",
      description: "横屏朝右：短暂休息，站立拉伸，喝杯水，放松双眼。",
      iconName: "Coffee"
    },
    [TimerDirection.PORTRAIT_DOWN]: {
      id: TimerDirection.PORTRAIT_DOWN,
      label: "深度长休 (Long Break)",
      duration: 15,
      color: "indigo",
      description: "竖屏朝下：完成数轮专注后的彻底放松，恢复充沛精力。",
      iconName: "BatteryCharging"
    },
    [TimerDirection.LANDSCAPE_LEFT]: {
      id: TimerDirection.LANDSCAPE_LEFT,
      label: "轻度学习 (Quick Focus)",
      duration: 10,
      color: "amber",
      description: "横屏朝左：快速查阅资料、记笔记或进行日常零碎复习。",
      iconName: "BookOpen"
    }
  }
};

export const COLOR_MAP: Record<string, { bg: string; text: string; border: string; glow: string; accent: string }> = {
  rose: {
    bg: "bg-stone-100",
    text: "text-stone-800",
    border: "border-stone-200",
    glow: "shadow-none",
    accent: "bg-stone-800"
  },
  emerald: {
    bg: "bg-stone-100",
    text: "text-stone-800",
    border: "border-stone-200",
    glow: "shadow-none",
    accent: "bg-stone-800"
  },
  indigo: {
    bg: "bg-stone-100",
    text: "text-stone-800",
    border: "border-stone-200",
    glow: "shadow-none",
    accent: "bg-stone-800"
  },
  amber: {
    bg: "bg-stone-100",
    text: "text-stone-800",
    border: "border-stone-200",
    glow: "shadow-none",
    accent: "bg-stone-800"
  }
};
