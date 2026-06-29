import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TimerDirection, 
  DeviceFaceState, 
  SensorData, 
  HistoryLog, 
  AppSettings 
} from "./types";
import { 
  DEFAULT_SETTINGS, 
  LOCAL_STORAGE_SETTINGS_KEY, 
  LOCAL_STORAGE_HISTORY_KEY 
} from "./constants";
import { PhoneSimulator } from "./components/PhoneSimulator";
import { GravityTimer } from "./components/GravityTimer";
import { HistoryStats } from "./components/HistoryStats";
import { SettingsPanel } from "./components/SettingsPanel";
import { classifyDeviceState } from "./utils/gravity";
import { resumeAudio } from "./utils/audio";
import { 
  Timer as TimerIcon, 
  BarChart3, 
  Settings as SettingsIcon, 
  Sparkles,
  Smartphone
} from "lucide-react";

export default function App() {
  // 1. Core States
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error loading settings:", e);
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error loading history:", e);
        }
      }
    }
    return [];
  });

  // 2. Sensor States
  // Default to using the 3D simulator on desktop, or flat face up
  const [sensorData, setSensorData] = useState<SensorData>({
    x: 0,
    y: 0,
    z: 0,
    alpha: 0,
    beta: 0,
    gamma: 0,
    usingSimulator: true // Important for desktop iframe compatibility
  });

  const [sensorPermissionState, setSensorPermissionState] = useState<"prompt" | "granted" | "denied" | "unsupported">("prompt");

  // 3. Derived & Retained Gravity States
  const [activeDirection, setActiveDirection] = useState<TimerDirection>(TimerDirection.PORTRAIT_UP);
  const [activeFaceState, setActiveFaceState] = useState<DeviceFaceState>(DeviceFaceState.FACE_UP);

  // 4. Timer Running State
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    return settings.modes[TimerDirection.PORTRAIT_UP].duration * 60;
  });
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // 5. Mobile Tab State ("timer" | "simulator" | "stats" | "settings")
  const [activeTab, setActiveTab] = useState<"timer" | "simulator" | "stats" | "settings">("timer");

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Save history logs when changed
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(historyLogs));
  }, [historyLogs]);

  // Request Device Sensor Permissions (specifically for iOS Safari)
  const requestSensorPermissions = async () => {
    // Unlock Web Audio context first as part of user gesture
    await resumeAudio();

    const DeviceOrientationEventClass = (window as any).DeviceOrientationEvent;
    if (
      DeviceOrientationEventClass && 
      typeof DeviceOrientationEventClass.requestPermission === "function"
    ) {
      try {
        const permission = await DeviceOrientationEventClass.requestPermission();
        if (permission === "granted") {
          setSensorPermissionState("granted");
          setSensorData((prev) => ({ ...prev, usingSimulator: false }));
        } else {
          setSensorPermissionState("denied");
        }
      } catch (err) {
        console.error("Error requesting orientation permissions:", err);
        setSensorPermissionState("denied");
      }
    } else {
      // Android / generic mobile browser (doesn't require prompt if served via HTTPS)
      // Test if orientation is available
      if ("ondeviceorientation" in window || "DeviceOrientationEvent" in window) {
        setSensorPermissionState("granted");
        setSensorData((prev) => ({ ...prev, usingSimulator: false }));
      } else {
        setSensorPermissionState("unsupported");
      }
    }
  };

  // Real-time classification listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // If user selected simulator mode, completely bypass physical sensor feed
      if (sensorData.usingSimulator) return;

      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;
      const alpha = e.alpha ?? 0;

      // Update sensor data
      setSensorData((prev) => ({
        ...prev,
        alpha,
        beta,
        gamma,
        usingSimulator: false
      }));
    };

    window.addEventListener("deviceorientation", handleOrientation);
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [sensorData.usingSimulator]);

  // Dynamically map alpha, beta, gamma to logical Gravity states (Direction & FaceState)
  useEffect(() => {
    const classified = classifyDeviceState(sensorData.beta, sensorData.gamma);
    
    // Set active face state
    setActiveFaceState(classified.faceState);

    // If a cardinal direction is detected, update the active focus direction
    if (classified.direction) {
      setActiveDirection(classified.direction);
    }
  }, [sensorData.beta, sensorData.gamma]);

  // History adding helper
  const addHistoryLog = useCallback((
    durationMinutes: number, 
    modeLabel: string, 
    direction: TimerDirection, 
    completed: boolean
  ) => {
    const newLog: HistoryLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      durationMinutes,
      modeLabel,
      direction,
      completed
    };

    setHistoryLogs((prev) => [newLog, ...prev]);

    // Optional physical device vibration feedback
    if (settings.vibrationEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [settings.vibrationEnabled]);

  const clearHistory = () => {
    setHistoryLogs([]);
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setTimeLeft(DEFAULT_SETTINGS.modes[activeDirection].duration * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-[#FDFBF7] text-stone-800 font-sans overflow-hidden">
      
      {/* 1. Header Navigation - Ultra Minimalist & Compact */}
      <header className="border-b border-stone-200/50 bg-[#FDFBF7]/90 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TimerIcon className="w-4 h-4 text-stone-800" />
            <h1 className="text-xs font-bold tracking-wider text-stone-900 uppercase">
              adhd_timer adhd计时器
            </h1>
            <span className="text-[8px] font-mono bg-stone-100 text-stone-500 border border-stone-200/60 px-1 py-0.5 rounded uppercase font-semibold">
              PWA
            </span>
          </div>

          {/* Quick mode indicators */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSensorData(prev => ({
                  ...prev,
                  usingSimulator: !prev.usingSimulator
                }));
                resumeAudio();
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide transition-all border ${
                sensorData.usingSimulator
                  ? "bg-stone-900 text-stone-50 border-stone-900"
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
            >
              <Smartphone className="w-3 h-3" />
              {sensorData.usingSimulator ? "虚拟模式" : "3D 仿真"}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Body - Single Screen Contained */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-6 lg:p-8 flex flex-col min-h-0 overflow-hidden justify-center">
        
        {/* DESKTOP VIEWPORT: Gorgeous Bento dashboard displaying all modules together */}
        <div className="hidden md:grid md:grid-cols-12 md:gap-6 lg:gap-8 items-stretch flex-1 min-h-0 overflow-hidden">
          
          {/* Left Column: 3D Phone Simulator */}
          <section className="col-span-4 flex flex-col min-h-0 overflow-hidden">
            <PhoneSimulator
              sensorData={sensorData}
              setSensorData={setSensorData}
              activeDirection={activeDirection}
              activeFaceState={activeFaceState}
              modes={settings.modes}
              timeLeft={timeLeft}
              formattedTime={formattedTime}
              isTimerRunning={isTimerRunning}
            />
          </section>

          {/* Center Column: Gravity Timer Clock Face */}
          <section className="col-span-4 flex flex-col min-h-0 overflow-hidden">
            <GravityTimer
              settings={settings}
              setSettings={setSettings}
              activeDirection={activeDirection}
              activeFaceState={activeFaceState}
              timeLeft={timeLeft}
              setTimeLeft={setTimeLeft}
              isTimerRunning={isTimerRunning}
              setIsTimerRunning={setIsTimerRunning}
              addHistoryLog={addHistoryLog}
              requestSensorPermissions={requestSensorPermissions}
              sensorPermissionState={sensorPermissionState}
              sensorData={sensorData}
            />
          </section>

          {/* Right Column: Dynamic Tabs for Stats or Settings */}
          <section className="col-span-4 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-hidden">
              <div className="grid grid-cols-2 p-1 bg-stone-100 border border-stone-200/60 rounded-xl shrink-0">
                <button
                  onClick={() => setActiveTab("stats")}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "stats" || activeTab === "timer" || activeTab === "simulator"
                      ? "bg-white text-stone-900 shadow-sm border border-stone-200/40"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-stone-600" />
                  历史统计
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "settings"
                      ? "bg-white text-stone-900 shadow-sm border border-stone-200/40"
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-stone-600" />
                  模式配置
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === "settings" ? (
                  <SettingsPanel
                    settings={settings}
                    setSettings={setSettings}
                    resetToDefaults={resetToDefaults}
                  />
                ) : (
                  <HistoryStats
                    historyLogs={historyLogs}
                    clearHistory={clearHistory}
                  />
                )}
              </div>
            </div>
          </section>
        </div>

        {/* MOBILE VIEWPORT: Single interactive focus pane with responsive bottom navbar */}
        <div className="md:hidden flex-1 flex flex-col min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0 overflow-hidden justify-center"
            >
              {activeTab === "timer" && (
                <GravityTimer
                  settings={settings}
                  setSettings={setSettings}
                  activeDirection={activeDirection}
                  activeFaceState={activeFaceState}
                  timeLeft={timeLeft}
                  setTimeLeft={setTimeLeft}
                  isTimerRunning={isTimerRunning}
                  setIsTimerRunning={setIsTimerRunning}
                  addHistoryLog={addHistoryLog}
                  requestSensorPermissions={requestSensorPermissions}
                  sensorPermissionState={sensorPermissionState}
                  sensorData={sensorData}
                />
              )}

              {activeTab === "simulator" && (
                <PhoneSimulator
                  sensorData={sensorData}
                  setSensorData={setSensorData}
                  activeDirection={activeDirection}
                  activeFaceState={activeFaceState}
                  modes={settings.modes}
                  timeLeft={timeLeft}
                  formattedTime={formattedTime}
                  isTimerRunning={isTimerRunning}
                />
              )}

              {activeTab === "stats" && (
                <HistoryStats
                  historyLogs={historyLogs}
                  clearHistory={clearHistory}
                />
              )}

              {activeTab === "settings" && (
                <SettingsPanel
                  settings={settings}
                  setSettings={setSettings}
                  resetToDefaults={resetToDefaults}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 3. Mobile Bottom Tab Bar - Ultra Minimalist Segmented Panel */}
      <footer className="md:hidden border-t border-stone-200/40 bg-[#FDFBF7]/90 backdrop-blur-md sticky bottom-0 z-40 pb-safe-bottom">
        <nav className="flex justify-around items-center py-2 px-2 max-w-md mx-auto">
          {/* Timer Tab */}
          <button
            onClick={() => setActiveTab("timer")}
            className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
              activeTab === "timer" 
                ? "text-stone-950 scale-105 font-bold" 
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <TimerIcon className={`w-4 h-4 transition-transform duration-300 ${activeTab === "timer" ? "stroke-[2.5px] text-stone-900" : "stroke-2"}`} />
            <span className="text-[9px] tracking-wider">计时</span>
          </button>

          {/* Simulator Tab */}
          <button
            onClick={() => setActiveTab("simulator")}
            className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
              activeTab === "simulator" 
                ? "text-stone-950 scale-105 font-bold" 
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <Smartphone className={`w-4 h-4 transition-transform duration-300 ${activeTab === "simulator" ? "stroke-[2.5px] text-stone-900" : "stroke-2"}`} />
            <span className="text-[9px] tracking-wider">模拟</span>
          </button>

          {/* Stats Tab */}
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
              activeTab === "stats" 
                ? "text-stone-950 scale-105 font-bold" 
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <BarChart3 className={`w-4 h-4 transition-transform duration-300 ${activeTab === "stats" ? "stroke-[2.5px] text-stone-900" : "stroke-2"}`} />
            <span className="text-[9px] tracking-wider">统计</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
              activeTab === "settings" 
                ? "text-stone-950 scale-105 font-bold" 
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <SettingsIcon className={`w-4 h-4 transition-transform duration-300 ${activeTab === "settings" ? "stroke-[2.5px] text-stone-900" : "stroke-2"}`} />
            <span className="text-[9px] tracking-wider">配置</span>
          </button>
        </nav>
      </footer>
    </div>
  );
}
