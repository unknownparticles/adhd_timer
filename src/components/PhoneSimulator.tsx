import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  TimerDirection, 
  DeviceFaceState, 
  SensorData, 
  TimerModeConfig 
} from "../types";
import { COLOR_MAP } from "../constants";
import { 
  Smartphone, 
  RotateCw, 
  CornerRightDown, 
  ChevronUp, 
  CornerUpLeft, 
  RotateCcw,
  Sparkles
} from "lucide-react";

interface PhoneSimulatorProps {
  sensorData: SensorData;
  setSensorData: (data: SensorData | ((prev: SensorData) => SensorData)) => void;
  activeDirection: TimerDirection | null;
  activeFaceState: DeviceFaceState;
  modes: Record<TimerDirection, TimerModeConfig>;
  timeLeft: number;
  formattedTime: string;
  isTimerRunning: boolean;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  sensorData,
  setSensorData,
  activeDirection,
  activeFaceState,
  modes,
  formattedTime,
  isTimerRunning,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Quick helper to apply simulation presets
  const applyPreset = (preset: { beta: number; gamma: number; label: string }) => {
    setSensorData({
      x: 0,
      y: 0,
      z: 0,
      alpha: 0,
      beta: preset.beta,
      gamma: preset.gamma,
      usingSimulator: true,
    });
  };

  const getPresetLabel = () => {
    if (activeFaceState === DeviceFaceState.FACE_DOWN) {
      return "📱 屏幕倒扣：计时中";
    }
    if (activeFaceState === DeviceFaceState.FACE_UP) {
      return "📱 屏幕朝上：已暂停";
    }
    switch (activeDirection) {
      case TimerDirection.PORTRAIT_UP:
        return `⏱️ 竖屏朝上：${modes[TimerDirection.PORTRAIT_UP].label}`;
      case TimerDirection.PORTRAIT_DOWN:
        return `⏱️ 竖屏向下：${modes[TimerDirection.PORTRAIT_DOWN].label}`;
      case TimerDirection.LANDSCAPE_LEFT:
        return `⏱️ 横屏朝左：${modes[TimerDirection.LANDSCAPE_LEFT].label}`;
      case TimerDirection.LANDSCAPE_RIGHT:
        return `⏱️ 横屏朝右：${modes[TimerDirection.LANDSCAPE_RIGHT].label}`;
      default:
        return "📱 处于倾斜过渡状态";
    }
  };

  // Compute 3D rotation angles based on sensor data for realism
  // beta controls rotateX, gamma controls rotateY (or rotateZ depending on view)
  const get3DRotation = () => {
    const { beta, gamma } = sensorData;

    if (activeFaceState === DeviceFaceState.FACE_DOWN) {
      // Rotate 180 on X to flip the phone flat face-down
      return { rotateX: 180, rotateY: 0, rotateZ: 0 };
    }

    if (activeFaceState === DeviceFaceState.FACE_UP) {
      // Completely flat face-up
      return { rotateX: 0, rotateY: 0, rotateZ: 0 };
    }

    // Map 4 tilt states nicely
    if (activeDirection === TimerDirection.PORTRAIT_UP) {
      return { rotateX: 60, rotateY: 0, rotateZ: 0 };
    }
    if (activeDirection === TimerDirection.PORTRAIT_DOWN) {
      return { rotateX: 60, rotateY: 0, rotateZ: 180 };
    }
    if (activeDirection === TimerDirection.LANDSCAPE_RIGHT) {
      return { rotateX: 60, rotateY: 0, rotateZ: 90 };
    }
    if (activeDirection === TimerDirection.LANDSCAPE_LEFT) {
      return { rotateX: 60, rotateY: 0, rotateZ: -90 };
    }

    // Default resting isometric view
    return { rotateX: beta, rotateY: gamma, rotateZ: 0 };
  };

  const currentMode = activeDirection ? modes[activeDirection] : null;

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-stone-200/80 p-4 sm:p-6 shadow-sm select-none">
      {/* Simulator Header */}
      <div className="flex items-center justify-between mb-2 md:mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-stone-400" />
          <h2 className="text-xs font-bold text-stone-800 tracking-wider uppercase">
            3D 物理姿态模拟器
          </h2>
        </div>
        <span className="text-[10px] bg-stone-100 text-stone-600 px-2.5 py-0.5 md:py-1 rounded-full font-mono">
          {sensorData.usingSimulator ? "虚拟模式" : "真机传感器"}
        </span>
      </div>

      {/* Simulator Viewport Container */}
      <div 
        className="relative flex-grow min-h-[180px] sm:min-h-[240px] bg-[#FAF9F6] rounded-2xl border border-stone-200/60 overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4"
        style={{ perspective: "1000px" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Virtual Table/Surface representation */}
        <div 
          className="absolute bottom-6 w-[85%] h-1 bg-gradient-to-r from-transparent via-stone-200 to-transparent blur-[1px]" 
          style={{ transform: "rotateX(75deg)" }}
        />

        {/* 3D Phone Body */}
        <motion.div
          animate={get3DRotation()}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          className="relative w-28 h-56 sm:w-36 sm:h-72 rounded-[20px] sm:rounded-[24px] shadow-lg cursor-grab active:cursor-grabbing preserve-3d"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* FRONT Side of the Phone (Screen) */}
          <div 
            className="absolute inset-0 bg-white border-[3px] sm:border-4 border-stone-300 rounded-[20px] sm:rounded-[24px] flex flex-col overflow-hidden backface-hidden shadow-inner"
            style={{ 
              backfaceVisibility: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.05)"
            }}
          >
            {/* Top Speaker / Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 sm:w-16 h-2 sm:h-3 bg-stone-200 rounded-b-lg z-20 flex items-center justify-center">
              <div className="w-3 sm:w-4 h-0.5 bg-stone-400 rounded-full" />
            </div>

            {/* Simulated Mobile Interface */}
            <div className="flex-1 flex flex-col justify-between p-2 sm:p-3 pt-4 sm:pt-5 pb-3 sm:pb-4 select-none relative">
              {/* Dynamic status line */}
              <div className="flex justify-between items-center text-[8px] sm:text-[9px] text-stone-400 font-mono">
                <span>09:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-stone-400" />
                  <span>GRAV</span>
                </div>
              </div>

              {/* Central Screen Area */}
              <div className="flex-1 flex flex-col justify-center items-center text-center">
                {activeFaceState === DeviceFaceState.FACE_UP ? (
                  <div className="space-y-0.5 sm:space-y-1">
                    <span className="text-[8px] sm:text-[9px] text-stone-400 font-bold uppercase tracking-wider block">
                      放置面朝上
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono tracking-wider text-stone-800">
                      PAUSED
                    </span>
                    <p className="text-[7px] sm:text-[8px] text-stone-400 leading-tight px-1">
                      翻转扣下即可开始
                    </p>
                  </div>
                ) : activeFaceState === DeviceFaceState.FACE_DOWN ? (
                  <div className="space-y-0.5 sm:space-y-1">
                    <span className="text-[8px] sm:text-[9px] text-stone-500 font-semibold uppercase tracking-wider block">
                      专注计时中
                    </span>
                    <span className="text-sm sm:text-base font-bold font-mono tracking-wider text-stone-700 animate-pulse">
                      Ticking
                    </span>
                  </div>
                ) : currentMode ? (
                  <div className="space-y-0.5 sm:space-y-1">
                    <span className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.5 rounded font-medium bg-stone-100 text-stone-700 inline-block uppercase tracking-wider">
                      {currentMode.label.split(" ")[0]}
                    </span>
                    <span className="text-sm sm:text-lg font-bold font-mono text-stone-800 block">
                      {formattedTime}
                    </span>
                    <span className="text-[7px] sm:text-[8px] text-stone-400 line-clamp-2 px-1">
                      {currentMode.description.split("：")[1] || currentMode.description}
                    </span>
                  </div>
                ) : (
                  <span className="text-[8px] sm:text-[9px] text-stone-400">倾斜选择模式</span>
                )}
              </div>

              {/* Bottom Home Indicator */}
              <div className="flex flex-col items-center gap-1 mt-auto">
                <div className="w-8 sm:w-10 h-0.5 bg-stone-300 rounded-full" />
              </div>
            </div>
          </div>

          {/* BACK Side of the Phone (Case) */}
          <div 
            className="absolute inset-0 bg-stone-100 border-[3px] sm:border-4 border-stone-200 rounded-[20px] sm:rounded-[24px] flex flex-col p-3 sm:p-4 justify-between items-center text-stone-400"
            style={{ 
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden" 
            }}
          >
            {/* Camera Module */}
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-stone-200 rounded-lg p-0.5 sm:p-1 flex items-center justify-center shadow-inner">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-stone-300 flex items-center justify-center">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-stone-400" />
              </div>
            </div>

            {/* Gravity Logo */}
            <div className="flex flex-col items-center gap-1 my-auto text-stone-500">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-stone-300 flex items-center justify-center bg-white shadow-sm">
                <Smartphone className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-stone-400" />
              </div>
              <span className="text-[7px] sm:text-[8px] uppercase font-bold tracking-widest text-stone-500">
                GRAVITY
              </span>
            </div>

            {/* Bottom Brand */}
            <span className="text-[6px] sm:text-[7px] font-mono tracking-wider text-stone-400">
              MINIMAL
            </span>
          </div>
        </motion.div>

        {/* Angle Readout */}
        <div className="absolute top-2 left-2 flex flex-col gap-0.5 text-[8px] sm:text-[9px] font-mono text-stone-400 bg-white/95 px-1.5 py-0.5 rounded border border-stone-200/60 shadow-sm select-text">
          <div>Pitch: {Math.round(sensorData.beta)}°</div>
          <div>Roll: {Math.round(sensorData.gamma)}°</div>
        </div>

        {/* Dynamic State Overlay Indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-[9px] sm:text-[10px] text-stone-600 font-medium px-2.5 py-0.5 md:py-1 bg-white border border-stone-200 rounded-full flex items-center gap-1 shadow-sm">
            <span>{getPresetLabel()}</span>
          </p>
        </div>
      </div>

      {/* Simulator Control Presets Grid */}
      <div className="mt-2.5 sm:mt-4 space-y-2 shrink-0">
        <span className="text-[10px] sm:text-[11px] font-bold text-stone-500 block px-1">
          状态预设（点击模拟旋转）：
        </span>

        <div className="grid grid-cols-2 gap-2">
          {/* Flat States */}
          <button
            onClick={() => applyPreset({ beta: 0, gamma: 0, label: "Face Up" })}
            className={`flex items-center justify-center gap-1.5 py-1 px-3 rounded-xl border text-xs font-medium transition-all ${
              activeFaceState === DeviceFaceState.FACE_UP
                ? "bg-stone-900 text-white border-stone-900"
                : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200"
            }`}
          >
            <Smartphone className="w-3 h-3 rotate-180" />
            面朝上 (暂停)
          </button>

          <button
            onClick={() => applyPreset({ beta: 180, gamma: 0, label: "Face Down" })}
            className={`flex items-center justify-center gap-1.5 py-1 px-3 rounded-xl border text-xs font-medium transition-all ${
              activeFaceState === DeviceFaceState.FACE_DOWN
                ? "bg-stone-900 text-white border-stone-900"
                : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200"
            }`}
          >
            <Smartphone className="w-3 h-3" />
            面朝下 (计时)
          </button>
        </div>

        {/* Cardinal Directions */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {/* Portrait Up */}
          <button
            onClick={() => applyPreset({ beta: 75, gamma: 0, label: "Portrait Up" })}
            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-xl border text-[10px] sm:text-[11px] font-medium transition-all ${
              activeDirection === TimerDirection.PORTRAIT_UP && activeFaceState === DeviceFaceState.TILTED
                ? "bg-stone-200 text-stone-800 border-stone-300"
                : "bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/80"
            }`}
          >
            <ChevronUp className="w-3 h-3" />
            竖屏向上 ({modes[TimerDirection.PORTRAIT_UP].duration}分)
          </button>

          {/* Landscape Right */}
          <button
            onClick={() => applyPreset({ beta: 0, gamma: 75, label: "Landscape Right" })}
            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-xl border text-[10px] sm:text-[11px] font-medium transition-all ${
              activeDirection === TimerDirection.LANDSCAPE_RIGHT && activeFaceState === DeviceFaceState.TILTED
                ? "bg-stone-200 text-stone-800 border-stone-300"
                : "bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/80"
            }`}
          >
            <CornerRightDown className="w-3 h-3" />
            横屏向右 ({modes[TimerDirection.LANDSCAPE_RIGHT].duration}分)
          </button>

          {/* Portrait Down */}
          <button
            onClick={() => applyPreset({ beta: -75, gamma: 0, label: "Portrait Down" })}
            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-xl border text-[10px] sm:text-[11px] font-medium transition-all ${
              activeDirection === TimerDirection.PORTRAIT_DOWN && activeFaceState === DeviceFaceState.TILTED
                ? "bg-stone-200 text-stone-800 border-stone-300"
                : "bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/80"
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            竖屏向下 ({modes[TimerDirection.PORTRAIT_DOWN].duration}分)
          </button>

          {/* Landscape Left */}
          <button
            onClick={() => applyPreset({ beta: 0, gamma: -75, label: "Landscape Left" })}
            className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-xl border text-[10px] sm:text-[11px] font-medium transition-all ${
              activeDirection === TimerDirection.LANDSCAPE_LEFT && activeFaceState === DeviceFaceState.TILTED
                ? "bg-stone-200 text-stone-800 border-stone-300"
                : "bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200/80"
            }`}
          >
            <CornerUpLeft className="w-3 h-3" />
            横屏向左 ({modes[TimerDirection.LANDSCAPE_LEFT].duration}分)
          </button>
        </div>

        {/* Tip */}
        <p className="text-[9px] text-stone-400 text-center flex items-center justify-center gap-1 pt-0.5 font-sans">
          <span>拖拽视窗可旋转物理手机，或点击预设按钮进行测试</span>
        </p>
      </div>
    </div>
  );
};
