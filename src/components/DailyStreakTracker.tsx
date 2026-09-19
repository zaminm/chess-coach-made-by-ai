import React, { useState } from "react";
import { DailyStreakData } from "../types";
import { Calendar, CheckCircle2, Flame, Bell, BellRing, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { soundManager } from "../lib/sound";

interface DailyStreakTrackerProps {
  streakData: DailyStreakData;
  onToggleReminder: () => void;
  onStartTraining: () => void;
  isGameActive: boolean;
}

export const DailyStreakTracker: React.FC<DailyStreakTrackerProps> = ({
  streakData,
  onToggleReminder,
  onStartTraining,
  isGameActive,
}) => {
  const [showFullCalendar, setShowFullCalendar] = useState(false);

  // Today's date string YYYY-MM-DD in local time
  const today = new Date().toISOString().split("T")[0];
  const isCheckedToday = streakData.checkedDays.includes(today);

  // Last 7 days representation
  const last7Days: { dateStr: string; dayLabel: string; isChecked: boolean; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLabel = d.toLocaleDateString(undefined, { weekday: "short" });
    last7Days.push({
      dateStr,
      dayLabel,
      isChecked: streakData.checkedDays.includes(dateStr),
      isToday: dateStr === today,
    });
  }

  // Monthly calendar generation for current month
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const monthName = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const handleTestChime = () => {
    soundManager.playReminderChime();
    onToggleReminder();
  };

  return (
    <div id="daily-streak-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      {/* Top Bar: Streak Header & Daily Status */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5 fill-amber-500/20" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-slate-100">{streakData.currentStreak} Day Streak</span>
              <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Best: {Math.max(streakData.bestStreak, streakData.currentStreak)}
              </span>
            </div>
            <p className="text-xs text-slate-400">Daily Training Habit Requirement</p>
          </div>
        </div>

        {/* Daily Reminder Toggle */}
        <button
          onClick={handleTestChime}
          title={streakData.reminderEnabled ? "Daily reminders active" : "Enable daily reminder chime"}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition ${
            streakData.reminderEnabled
              ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
              : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
          }`}
        >
          {streakData.reminderEnabled ? <BellRing className="w-3.5 h-3.5 text-amber-400" /> : <Bell className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{streakData.reminderEnabled ? "Reminder Active" : "Remind Me"}</span>
        </button>
      </div>

      {/* Daily Reminder Alert Banner */}
      {!isCheckedToday ? (
        <div className="bg-amber-950/30 border border-amber-600/40 rounded-xl p-3 mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <div>
              <p className="text-xs font-semibold text-amber-200">Daily Training Pending</p>
              <p className="text-[11px] text-amber-300/80">Play a training game with your coach today to mark it as a Checked Day!</p>
            </div>
          </div>
          {!isGameActive && (
            <button
              onClick={onStartTraining}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition shrink-0 shadow-md"
            >
              Play Today
            </button>
          )}
        </div>
      ) : (
        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-300">Checked Day Complete!</p>
              <p className="text-[11px] text-emerald-400/80">Great job! You checked off your daily training for today.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-1 rounded border border-emerald-500/20">
            ✓ Checked
          </span>
        </div>
      )}

      {/* 7-Day Rolling Streak View */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {last7Days.map((item) => (
          <div
            key={item.dateStr}
            className={`p-2 rounded-xl flex flex-col items-center justify-center border transition ${
              item.isChecked
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : item.isToday
                ? "bg-amber-950/30 border-amber-500/40 text-amber-300"
                : "bg-slate-950/40 border-slate-800 text-slate-500"
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider mb-1">{item.dayLabel}</span>
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                item.isChecked
                  ? "bg-emerald-500 text-slate-950"
                  : item.isToday
                  ? "border border-amber-400 text-amber-300"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {item.isChecked ? "✓" : item.dateStr.split("-")[2]}
            </div>
          </div>
        ))}
      </div>

      {/* Toggle Expandable Monthly Calendar */}
      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="text-[11px]">
          Checked Days this month: <strong className="text-slate-200">{streakData.checkedDays.length}</strong>
        </span>
        <button
          onClick={() => setShowFullCalendar(!showFullCalendar)}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 text-xs py-1 transition"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>{showFullCalendar ? "Hide Calendar" : "View Month"}</span>
          {showFullCalendar ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Full Monthly Calendar View */}
      {showFullCalendar && (
        <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 animate-in fade-in duration-200">
          <div className="text-xs font-semibold text-slate-300 text-center mb-2.5">{monthName}</div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500 font-bold mb-1">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isChecked = streakData.checkedDays.includes(dateStr);
              const isCurrentDay = dateStr === today;

              return (
                <div
                  key={dateStr}
                  className={`h-7 rounded flex items-center justify-center text-xs font-medium ${
                    isChecked
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                      : isCurrentDay
                      ? "border border-amber-400 text-amber-300 font-bold"
                      : "text-slate-400 hover:bg-slate-900"
                  }`}
                  title={`${dateStr}: ${isChecked ? "Checked Day" : "Not played"}`}
                >
                  {isChecked ? "✓" : dayNum}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
