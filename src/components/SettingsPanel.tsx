import React from "react";
import { AppSettings, TimerDirection, TimerModeConfig } from "../types";
import { COLOR_MAP } from "../constants";
import { 
  Settings, 
  Flame, 
  Coffee, 
  BatteryCharging, 
  BookOpen,
  Volume2,
  VolumeX,
  Compass,
  ArrowRight
} from "lucide-react";

interface SettingsPanelProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings | ((prev: AppSettings) => AppSettings)) => void;
  resetToDefaults: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  setSettings,
  resetToDefaults,
}) => {

  const handleDurationChange = (direction: TimerDirection, duration: number) => {
    setSettings((prev) => ({
      ...prev,
      modes: {
        ...prev.modes,
        [direction]: {
          ...prev.modes[direction],
          duration: Math.max(1, Math.min(120, duration)) // Bound between 1 and 120 mins
        }
      }
    }));
  };

  const handleLabelChange = (direction: TimerDirection, label: string) => {
    setSettings((prev) => ({
      ...prev,
      modes: {
        ...prev.modes,
        [direction]: {
          ...prev.modes[direction],
          label: label
        }
      }
    }));
  };

  const renderIcon = (iconName: string, className = "w-4 h-4") => {
    switch (iconName) {
      case "Flame": return <Flame className={className} />;
      case "Coffee": return <Coffee className={className} />;
      case "BatteryCharging": return <BatteryCharging className={className} />;
      case "BookOpen": return <BookOpen className={className} />;
      default: return <Flame className={className} />;
    }
  };

  const directionLabels: Record<TimerDirection, string> = {
    [TimerDirection.PORTRAIT_UP]: "手机竖立向上 倾斜",
    [TimerDirection.LANDSCAPE_RIGHT]: "手机向右旋转 倾斜",
    [TimerDirection.PORTRAIT_DOWN]: "手机竖立向下 倾斜",
    [TimerDirection.LANDSCAPE_LEFT]: "手机向左旋转 倾斜",
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-stone-200/80 p-4 sm:p-6 shadow-sm min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-5 shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-stone-700" />
          <h2 className="text-xs font-bold text-stone-800 tracking-wider uppercase">
            模式与体验配置
          </h2>
        </div>
        <button
          onClick={() => {
            if (confirm("确定要恢复默认预设的计时配置吗？")) {
              resetToDefaults();
            }
          }}
          className="text-[10px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-0.5 sm:py-1 rounded-lg font-semibold transition-all border border-stone-200/50"
        >
          恢复默认
        </button>
      </div>

      {/* 4 Directions Mode Customization List */}
      <div className="flex-1 space-y-3 overflow-y-auto min-h-0 pr-1 scrollbar-thin scrollbar-thumb-stone-200 mb-3 sm:mb-4">
        {(Object.values(settings.modes) as TimerModeConfig[]).map((mode) => {
          return (
            <div 
              key={mode.id}
              className="bg-[#FAF9F6] border border-stone-200/60 rounded-2xl p-3 space-y-2.5"
            >
              {/* Direction Indicator Row */}
              <div className="flex justify-between items-center pb-1.5 border-b border-stone-200/50">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-stone-200/60 text-stone-800">
                    {renderIcon(mode.iconName)}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-stone-400 font-mono tracking-wider font-bold uppercase">
                      {directionLabels[mode.id]}
                    </span>
                    <input
                      type="text"
                      value={mode.label}
                      onChange={(e) => handleLabelChange(mode.id, e.target.value)}
                      className="text-xs font-bold text-stone-800 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-850 focus:outline-none py-0.5 max-w-[150px] transition-all"
                      placeholder="模式名称"
                    />
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm font-bold font-mono text-stone-800">
                    {mode.duration}
                  </span>
                  <span className="text-[10px] text-stone-400">分钟</span>
                </div>
              </div>

              {/* Slider Input */}
              <div className="space-y-0.5">
                <div className="flex justify-between text-[9px] text-stone-400">
                  <span>时长调控</span>
                  <span>1 ~ 120 分钟</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={mode.duration}
                  onChange={(e) => handleDurationChange(mode.id, parseInt(e.target.value))}
                  className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
                />
              </div>

              {/* Description Input */}
              <p className="text-[10px] text-stone-500 italic">
                {mode.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Global Application Preferences */}
      <div className="bg-[#FAF9F6] border border-stone-200/60 rounded-2xl p-3 space-y-2 shrink-0">
        <h3 className="text-[10px] sm:text-[11px] font-bold text-stone-700 uppercase tracking-wider">全局配置</h3>

        {/* Preference Toggles */}
        <div className="flex flex-col gap-2">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] text-stone-700 font-bold">音效铃声反馈</span>
              <span className="text-[8px] sm:text-[9px] text-stone-400">开启转换和计时结束提示旋律</span>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              className={`w-8 h-4 rounded-full p-0.5 transition-all duration-300 ${
                settings.soundEnabled ? "bg-stone-800 flex justify-end" : "bg-stone-200 flex justify-start"
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Volume Slider - show when soundEnabled is true */}
          {settings.soundEnabled && (
            <div className="flex flex-col gap-1 pl-2 py-1 border-l-2 border-stone-200 ml-1.5 mt-0.5 mb-1.5 transition-all">
              <div className="flex justify-between text-[9px] text-stone-500 font-medium">
                <span>音量调节</span>
                <span>{Math.round((settings.volume ?? 0.8) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.volume ?? 0.8}
                onChange={(e) => setSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
              />
            </div>
          )}

          {/* Vibration Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] text-stone-700 font-bold">物理触觉震动</span>
              <span className="text-[8px] sm:text-[9px] text-stone-400">开始、暂停、计时结束时提供震动反馈</span>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, vibrationEnabled: !prev.vibrationEnabled }))}
              className={`w-8 h-4 rounded-full p-0.5 transition-all duration-300 ${
                settings.vibrationEnabled ? "bg-stone-800 flex justify-end" : "bg-stone-200 flex justify-start"
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
            </button>
          </div>

          {/* Auto-Save Records */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-[11px] text-stone-700 font-bold">自动保存历史记录</span>
              <span className="text-[8px] sm:text-[9px] text-stone-400">计时结束时自动记录到本地</span>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, autoSaveEnabled: !prev.autoSaveEnabled }))}
              className={`w-8 h-4 rounded-full p-0.5 transition-all duration-300 ${
                settings.autoSaveEnabled ? "bg-stone-800 flex justify-end" : "bg-stone-200 flex justify-start"
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
