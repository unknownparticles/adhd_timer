import React from "react";
import { HistoryLog, TimerDirection } from "../types";
import { COLOR_MAP, DEFAULT_SETTINGS } from "../constants";
import { 
  Trophy, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  BarChart3, 
  Zap, 
  Clock,
  Sparkles
} from "lucide-react";

interface HistoryStatsProps {
  historyLogs: HistoryLog[];
  clearHistory: () => void;
}

export const HistoryStats: React.FC<HistoryStatsProps> = ({
  historyLogs,
  clearHistory,
}) => {
  // Calculations
  const completedLogs = historyLogs.filter((log) => log.completed);
  const totalCompletedCount = completedLogs.length;

  const totalFocusMinutes = completedLogs.reduce(
    (acc, curr) => acc + curr.durationMinutes,
    0
  );

  // Compute stats grouped by mode
  const modeStats = completedLogs.reduce((acc, curr) => {
    acc[curr.direction] = (acc[curr.direction] || 0) + curr.durationMinutes;
    return acc;
  }, {} as Record<TimerDirection, number>);

  const getModePercentage = (direction: TimerDirection) => {
    if (totalFocusMinutes === 0) return 0;
    const minutes = modeStats[direction] || 0;
    return Math.round((minutes / totalFocusMinutes) * 100);
  };

  // Streaks calculation: consecutive days with at least 1 completed session
  const calculateStreak = () => {
    if (completedLogs.length === 0) return 0;
    
    // Sort unique dates descending
    const dates = completedLogs
      .map((log) => new Date(log.timestamp).toDateString())
      .filter((value, index, self) => self.indexOf(value) === index)
      .map((d) => new Date(d).getTime())
      .sort((a, b) => b - a);

    if (dates.length === 0) return 0;

    let currentStreak = 0;
    const oneDay = 24 * 60 * 60 * 1000;
    const today = new Date().toDateString();
    const todayTime = new Date(today).getTime();

    // Check if user has focused today or yesterday to maintain streak
    const latestDate = dates[0];
    if (todayTime - latestDate > oneDay) {
      return 0; // Streak broken
    }

    currentStreak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const diff = dates[i] - dates[i + 1];
      if (diff === oneDay) {
        currentStreak++;
      } else if (diff > oneDay) {
        break; // Streak interrupted
      }
    }
    return currentStreak;
  };

  const currentStreak = calculateStreak();

  // Helper to format timestamps relative to current day
  const formatTimeStr = (isoStr: string) => {
    const d = new Date(isoStr);
    const hour = d.getHours().toString().padStart(2, "0");
    const min = d.getMinutes().toString().padStart(2, "0");
    return `${hour}:${min}`;
  };

  const formatDateStr = (isoStr: string) => {
    const d = new Date(isoStr);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const date = d.getDate().toString().padStart(2, "0");
    return `${month}-${date}`;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-stone-200/80 p-4 sm:p-6 shadow-sm min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-5 shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-stone-700" />
          <h2 className="text-xs font-bold text-stone-800 tracking-wider uppercase">
            专注数据与统计
          </h2>
        </div>
        {historyLogs.length > 0 && (
          <button
            onClick={() => {
              if (confirm("确定要清空所有专注历史记录吗？此操作不可撤销。")) {
                clearHistory();
              }
            }}
            className="text-stone-400 hover:text-stone-900 p-1 rounded hover:bg-stone-100 transition-all"
            title="清空历史记录"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Bento Grid Stats Cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-3 sm:mb-5 shrink-0">
        {/* Total Sessions Card */}
        <div className="bg-[#FAF9F6] border border-stone-200/60 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-stone-500">完成轮次</span>
          <div className="flex items-baseline gap-1 mt-1 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-stone-850">
              {totalCompletedCount}
            </span>
            <span className="text-[9px] sm:text-[10px] text-stone-400">次</span>
          </div>
        </div>

        {/* Total Minutes Card */}
        <div className="bg-[#FAF9F6] border border-stone-200/60 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-stone-500">累计专注</span>
          <div className="flex items-baseline gap-1 mt-1 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-stone-850">
              {totalFocusMinutes}
            </span>
            <span className="text-[9px] sm:text-[10px] text-stone-400">分钟</span>
          </div>
        </div>

        {/* Streaks Card */}
        <div className="bg-[#FAF9F6] border border-stone-200/60 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-stone-500">连续天数</span>
          <div className="flex items-baseline gap-1 mt-1 sm:mt-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-stone-850 flex items-center gap-0.5">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-stone-700 text-stone-700 inline" />
              {currentStreak}
            </span>
            <span className="text-[9px] sm:text-[10px] text-stone-400">天</span>
          </div>
        </div>
      </div>

      {/* Mode Distribution Chart */}
      <div className="bg-[#FAF9F6] border border-stone-200/60 rounded-2xl p-3 sm:p-4 mb-3 sm:mb-5 shrink-0">
        <h3 className="text-[10px] sm:text-[11px] font-bold text-stone-700 mb-2 sm:mb-3 flex items-center gap-1.5 uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5 text-stone-500" />
          专注时长分布
        </h3>

        {totalFocusMinutes === 0 ? (
          <div className="text-center py-2 sm:py-4 text-xs text-stone-400">
            暂无专注数据。倒扣手机开始积累！
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-3">
            {/* Mode PORTRAIT_UP */}
            <div>
              <div className="flex justify-between text-[10px] sm:text-[11px] text-stone-500 mb-0.5">
                <span>深度专注 (Pomodoro)</span>
                <span className="font-mono text-stone-800 font-semibold">
                  {modeStats[TimerDirection.PORTRAIT_UP] || 0}分 ({getModePercentage(TimerDirection.PORTRAIT_UP)}%)
                </span>
              </div>
              <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-stone-800 rounded-full" 
                  style={{ width: `${getModePercentage(TimerDirection.PORTRAIT_UP)}%` }}
                />
              </div>
            </div>

            {/* Mode LANDSCAPE_RIGHT */}
            <div>
              <div className="flex justify-between text-[10px] sm:text-[11px] text-stone-500 mb-0.5">
                <span>舒适短休 (Short Break)</span>
                <span className="font-mono text-stone-800 font-semibold">
                  {modeStats[TimerDirection.LANDSCAPE_RIGHT] || 0}分 ({getModePercentage(TimerDirection.LANDSCAPE_RIGHT)}%)
                </span>
              </div>
              <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-stone-800 rounded-full" 
                  style={{ width: `${getModePercentage(TimerDirection.LANDSCAPE_RIGHT)}%` }}
                />
              </div>
            </div>

            {/* Mode PORTRAIT_DOWN */}
            <div>
              <div className="flex justify-between text-[10px] sm:text-[11px] text-stone-500 mb-0.5">
                <span>深度长休 (Long Break)</span>
                <span className="font-mono text-stone-800 font-semibold">
                  {modeStats[TimerDirection.PORTRAIT_DOWN] || 0}分 ({getModePercentage(TimerDirection.PORTRAIT_DOWN)}%)
                </span>
              </div>
              <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-stone-800 rounded-full" 
                  style={{ width: `${getModePercentage(TimerDirection.PORTRAIT_DOWN)}%` }}
                />
              </div>
            </div>

            {/* Mode LANDSCAPE_LEFT */}
            <div>
              <div className="flex justify-between text-[10px] sm:text-[11px] text-stone-500 mb-0.5">
                <span>轻度学习 (Quick Focus)</span>
                <span className="font-mono text-stone-800 font-semibold">
                  {modeStats[TimerDirection.LANDSCAPE_LEFT] || 0}分 ({getModePercentage(TimerDirection.LANDSCAPE_LEFT)}%)
                </span>
              </div>
              <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-stone-800 rounded-full" 
                  style={{ width: `${getModePercentage(TimerDirection.LANDSCAPE_LEFT)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History Log Timeline list */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <h3 className="text-xs font-bold text-stone-700 mb-2 flex items-center gap-1.5 uppercase tracking-wider shrink-0">
          <Clock className="w-3.5 h-3.5 text-stone-600" />
          最近专注时间轴
        </h3>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-stone-200">
          {historyLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-stone-400">
              <p className="text-xs">记录空空如也，专注后将自动归档</p>
            </div>
          ) : (
            historyLogs.slice(0, 15).map((log) => {
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#FAF9F6] border border-stone-200/60 hover:border-stone-300/80 transition-all"
                >
                  <div className="flex items-center gap-2">
                    {log.completed ? (
                      <CheckCircle className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    )}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-stone-800">
                        {log.modeLabel}
                      </span>
                      <span className="text-[9px] text-stone-400 font-mono">
                        {formatDateStr(log.timestamp)} @ {formatTimeStr(log.timestamp)}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white text-stone-800 border border-stone-200">
                    +{log.durationMinutes}分
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
