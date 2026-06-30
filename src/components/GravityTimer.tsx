import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TimerDirection, 
  DeviceFaceState, 
  TimerModeConfig, 
  AppSettings,
  SensorData
} from "../types";
import { COLOR_MAP } from "../constants";
import { playTick, playChime, playModeTrigger, playPauseBeep, playStartMelody } from "../utils/audio";
import { triggerVibrate } from "../utils/vibration";
import { GravityParticlesCanvas } from "./GravityParticlesCanvas";
import { 
  Flame, 
  Coffee, 
  BatteryCharging, 
  BookOpen, 
  Play, 
  Pause, 
  RotateCcw,
  Volume2,
  VolumeX,
  Compass,
  ArrowDownCircle,
  HelpCircle,
  Sparkles
} from "lucide-react";

interface GravityTimerProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  activeDirection: TimerDirection | null;
  activeFaceState: DeviceFaceState;
  timeLeft: number;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  isTimerRunning: boolean;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
  addHistoryLog: (durationMinutes: number, modeLabel: string, direction: TimerDirection, completed: boolean) => void;
  requestSensorPermissions: () => void;
  sensorPermissionState: "prompt" | "granted" | "denied" | "unsupported";
  sensorData: SensorData;
  isEasterEggActive?: boolean;
}

export const GravityTimer: React.FC<GravityTimerProps> = ({
  settings,
  setSettings,
  activeDirection,
  activeFaceState,
  timeLeft,
  setTimeLeft,
  isTimerRunning,
  setIsTimerRunning,
  addHistoryLog,
  requestSensorPermissions,
  sensorPermissionState,
  sensorData,
  isEasterEggActive = false,
}) => {
  const previousDirectionRef = useRef<TimerDirection | null>(null);
  const previousFaceStateRef = useRef<DeviceFaceState | null>(null);

  const currentMode: TimerModeConfig = activeDirection 
    ? settings.modes[activeDirection] 
    : settings.modes[TimerDirection.PORTRAIT_UP]; // Fallback to portrait up

  const themeColors = COLOR_MAP[currentMode.color] || COLOR_MAP.rose;

  // Track mode change and trigger audio/vibration feedback
  useEffect(() => {
    if (activeDirection && activeDirection !== previousDirectionRef.current) {
      if (settings.soundEnabled) {
        playModeTrigger(settings.volume);
      }
      triggerVibrate(30, settings);
      
      // Reset timer to the new mode's duration
      const modeDuration = settings.modes[activeDirection].duration * 60;
      setTimeLeft(modeDuration);
      setIsTimerRunning(false); // Stop running on mode change, wait for face-down

      previousDirectionRef.current = activeDirection;
    }
  }, [activeDirection, settings, setTimeLeft, setIsTimerRunning]);

  // Track face state change: FACE_DOWN -> starts timer, FACE_UP -> pauses timer
  useEffect(() => {
    if (activeFaceState !== previousFaceStateRef.current) {
      if (activeFaceState === DeviceFaceState.FACE_DOWN) {
        setIsTimerRunning(true);
        if (settings.soundEnabled && previousFaceStateRef.current === DeviceFaceState.FACE_UP) {
          playStartMelody(settings.volume);
        }
        if (previousFaceStateRef.current === DeviceFaceState.FACE_UP) {
          triggerVibrate(100, settings);
        }
      } else if (activeFaceState === DeviceFaceState.FACE_UP) {
        setIsTimerRunning(false);
        if (settings.soundEnabled && previousFaceStateRef.current === DeviceFaceState.FACE_DOWN) {
          playPauseBeep(settings.volume);
        }
        if (previousFaceStateRef.current === DeviceFaceState.FACE_DOWN) {
          triggerVibrate([50, 50, 50], settings);
        }
      }
      previousFaceStateRef.current = activeFaceState;
    }
  }, [activeFaceState, setIsTimerRunning, settings]);

  // Handle active countdown logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isTimerRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          const nextVal = prev - 1;
          
          // Optional subtle tick sound on odd seconds for productivity feedback
          if (settings.soundEnabled && settings.tickingSoundEnabled && nextVal % 2 === 0) {
            playTick(nextVal % 4 === 0 ? "tick" : "tock", settings.volume);
          }

          if (nextVal <= 0) {
            // Timer Finished!
            if (settings.soundEnabled) {
              playChime(settings.volume);
            }
            if (activeDirection) {
              addHistoryLog(
                settings.modes[activeDirection].duration,
                settings.modes[activeDirection].label,
                activeDirection,
                true
              );
            }
            setIsTimerRunning(false);
            return 0;
          }
          return nextVal;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isTimerRunning, timeLeft, activeDirection, settings, addHistoryLog, setIsTimerRunning, setTimeLeft]);

  // Render correct icon based on mode
  const renderModeIcon = (iconName: string, className = "w-5 h-5") => {
    switch (iconName) {
      case "Flame": return <Flame className={className} />;
      case "Coffee": return <Coffee className={className} />;
      case "BatteryCharging": return <BatteryCharging className={className} />;
      case "BookOpen": return <BookOpen className={className} />;
      default: return <Flame className={className} />;
    }
  };

  const totalSeconds = (activeDirection ? settings.modes[activeDirection].duration : 25) * 60;
  const progressPercentage = totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 0;

  // Circle properties for countdown progress ring
  const circleRadius = 120;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedSeconds = seconds.toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center justify-between h-full bg-white rounded-3xl border border-stone-200/80 p-4 sm:p-6 md:p-8 shadow-sm">
      
      {/* Top Banner: Gravity Sensor Status & Fast Settings */}
      <div className="w-full flex justify-between items-center mb-3 md:mb-6 shrink-0">
        <div className="flex items-center gap-2">
          {sensorPermissionState === "granted" ? (
            <span className="flex items-center gap-1.5 text-[10px] text-stone-700 bg-stone-100 px-2 py-0.5 md:py-1 rounded-full font-medium border border-stone-200/60">
              <Compass className="w-3 h-3 animate-spin" style={{ animationDuration: '10s' }} />
              物理传感器已连接
            </span>
          ) : sensorPermissionState === "denied" ? (
            <button 
              onClick={requestSensorPermissions}
              className="flex items-center gap-1.5 text-[10px] text-stone-600 bg-stone-50 px-2 py-0.5 md:py-1 rounded-full font-medium hover:bg-stone-100 transition-all border border-stone-200"
            >
              <Compass className="w-3 h-3 text-stone-400" />
              点击激活重力感应
            </button>
          ) : sensorPermissionState === "prompt" ? (
            <button 
              onClick={requestSensorPermissions}
              className="flex items-center gap-1.5 text-[10px] text-stone-900 bg-stone-100 px-2 py-0.5 md:py-1 rounded-full font-medium hover:bg-stone-200 transition-all cursor-pointer border border-stone-300 animate-pulse"
            >
              <Compass className="w-3 h-3" />
              激活重力感应
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] text-stone-500 bg-stone-50 px-2 py-0.5 md:py-1 rounded-full font-medium border border-stone-200/60">
              <Compass className="w-3 h-3" />
              模拟器已激活
            </span>
          )}
        </div>

        {/* Audio Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSettings(prev => ({ ...prev, tickingSoundEnabled: !prev.tickingSoundEnabled }))}
            className={`px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[10px] font-mono border transition-all ${
              settings.tickingSoundEnabled
                ? "bg-stone-900 text-stone-100 border-stone-900"
                : "bg-transparent text-stone-400 border-stone-200 hover:text-stone-700"
            }`}
            title="秒针滴答声反馈"
          >
            滴答声: {settings.tickingSoundEnabled ? "开" : "关"}
          </button>
          
          <button
            onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            className="p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-all border border-stone-200"
            title={settings.soundEnabled ? "关闭声音" : "开启声音"}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-stone-800" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-stone-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Gravity Circle Visualizer */}
      <div className="relative flex-1 flex flex-col items-center justify-center py-2 md:py-6 w-full max-w-[360px] min-h-0 overflow-hidden">
        <svg 
          viewBox="0 0 300 300"
          className="w-72 h-72 sm:w-[340px] sm:h-[340px] transform -rotate-90 select-none pointer-events-none shrink-0 z-10"
        >
          {/* Outer Track Circle */}
          <circle
            cx="150"
            cy="150"
            r="120"
            className="stroke-stone-100 fill-none"
            strokeWidth="6"
          />

          {/* Dynamic Progress Arc */}
          <motion.circle
            cx="150"
            cy="150"
            r="120"
            className="fill-none stroke-stone-800"
            strokeWidth="6"
            strokeDasharray={2 * Math.PI * 120}
            animate={{ strokeDashoffset: (2 * Math.PI * 120) - (progressPercentage / 100) * (2 * Math.PI * 120) }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.5 }}
            strokeLinecap="round"
          />
        </svg>

        {/* Gravity beads interactive simulation canvas */}
        <GravityParticlesCanvas
          sensorData={sensorData}
          activeDirection={activeDirection}
          settings={settings}
          isEasterEggActive={isEasterEggActive}
        />

        {/* Central Display overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-8 select-none pointer-events-none z-20">
          <AnimatePresence mode="wait">
            {isEasterEggActive ? (
              <motion.div
                key="easter-egg-title"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: [1, 1.15, 1], rotate: [-3, 3, -3], opacity: 1 }}
                transition={{ 
                  scale: { repeat: Infinity, duration: 0.6, ease: "easeInOut" },
                  rotate: { repeat: Infinity, duration: 0.8, ease: "easeInOut" }
                }}
                className="flex flex-col items-center gap-1"
              >
                <div className="p-1 rounded-lg bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 text-white shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                </div>
                <span className="text-[11px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 uppercase filter drop-shadow-sm block">
                  ✨ SHAKE IT OFF! ✨
                </span>
              </motion.div>
            ) : (
              <motion.div
                key={currentMode.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.97, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center gap-0.5 sm:gap-1"
              >
                <div className="p-1.5 rounded-lg bg-stone-100 text-stone-800 border border-stone-200/60 shadow-none">
                  {renderModeIcon(currentMode.iconName, "w-3.5 h-3.5")}
                </div>
                <h3 className="text-[10px] font-bold text-stone-500 mt-1 uppercase tracking-wider">
                  {currentMode.label}
                </h3>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Countdown Clock Face */}
          {isEasterEggActive ? (
            <motion.span
              animate={{ scale: [1, 1.06, 1], y: [0, -2, 0] }}
              transition={{ repeat: Infinity, duration: 0.38, ease: "easeInOut" }}
              className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 my-1.5 sm:my-2.5"
            >
              {formattedMinutes}:{formattedSeconds}
            </motion.span>
          ) : (
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-stone-900 my-1.5 sm:my-2.5">
              {formattedMinutes}:{formattedSeconds}
            </span>
          )}

          {/* Device Face Feedback Statement */}
          <div className="h-5">
            {isEasterEggActive ? (
              <span className="text-[10px] text-purple-600 font-bold animate-pulse">
                🤪 压力消散中... 呼~
              </span>
            ) : activeFaceState === DeviceFaceState.FACE_DOWN ? (
              <span className="text-[10px] text-stone-600 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-800 animate-ping" />
                正在计时中...
              </span>
            ) : activeFaceState === DeviceFaceState.FACE_UP ? (
              <span className="text-[10px] text-stone-400 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                屏幕向上：暂停中
              </span>
            ) : (
              <span className="text-[10px] text-stone-400 flex items-center gap-1 justify-center">
                <ArrowDownCircle className="w-3.5 h-3.5" />
                倒扣手机开始专注
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Instruction Cards */}
      <div className="w-full mt-2 md:mt-4 shrink-0">
        {/* Quick Help Tip */}
        <div className="bg-[#FAF9F6] rounded-xl p-2.5 md:p-4 border border-stone-200/60 text-center">
          <h4 className="text-[10px] md:text-[11px] font-bold text-stone-700 flex items-center justify-center gap-1 mb-1">
            操作指南
          </h4>
          <p className="text-[9px] md:text-[10px] text-stone-500 leading-relaxed font-sans max-w-[280px] mx-auto">
            1. 旋转/倾斜手机（或右上角仿真器）选择计时模式<br />
            2. 屏幕<strong className="text-stone-700">倒扣面朝下</strong>，即可开始或恢复计时<br />
            3. 屏幕<strong className="text-stone-700">面朝上放置</strong>，计时器自动暂停
          </p>
        </div>

        <div className="flex justify-center items-center gap-3 mt-3 md:mt-4 pt-2 md:pt-3 border-t border-stone-100">
          <button
            onClick={() => {
              const nextRunningState = !isTimerRunning;
              setIsTimerRunning(nextRunningState);
              if (nextRunningState) {
                if (settings.soundEnabled) playStartMelody(settings.volume);
                triggerVibrate(100, settings);
              } else {
                if (settings.soundEnabled) playPauseBeep(settings.volume);
                triggerVibrate([50, 50, 50], settings);
              }
            }}
            className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all border ${
              isTimerRunning 
                ? "bg-white hover:bg-stone-50 text-stone-700 border-stone-200"
                : "bg-stone-900 hover:bg-stone-800 text-stone-50 border-stone-900"
            }`}
          >
            {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isTimerRunning ? "手动暂停" : "手动开始"}
          </button>

          <button
            onClick={() => {
              setTimeLeft(currentMode.duration * 60);
              setIsTimerRunning(false);
              triggerVibrate(40, settings);
            }}
            className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all border border-transparent"
          >
            <RotateCcw className="w-3 h-3" />
            重置
          </button>
        </div>
      </div>

    </div>
  );
};
