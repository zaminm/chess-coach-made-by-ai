import React from "react";
import { ChessComPlayer, ChessComStats } from "../types";
import { Brain, Volume2, VolumeX, User, Sparkles, Flame, CheckCircle2, RefreshCw } from "lucide-react";
import { soundManager } from "../lib/sound";

interface HeaderProps {
  player: ChessComPlayer | null;
  stats: ChessComStats | null;
  coachElo: number;
  currentStreak: number;
  isCheckedToday: boolean;
  onOpenConnectModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeTab: "game" | "theory";
  onSelectTab: (tab: "game" | "theory") => void;
}

export const Header: React.FC<HeaderProps> = ({
  player,
  stats,
  coachElo,
  currentStreak,
  isCheckedToday,
  onOpenConnectModal,
  soundEnabled,
  onToggleSound,
  activeTab,
  onSelectTab,
}) => {
  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 px-4 lg:px-8 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Brand Logo & Navigation Tabs */}
        <div className="flex items-center justify-between md:justify-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-950">
              <Brain className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-100 tracking-tight">Grandmaster AI</h1>
                <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded tracking-wide">
                  Coach
                </span>
              </div>
            </div>
          </div>

          {/* Primary View Switcher: Training Game vs Theory Section */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectTab("game")}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                activeTab === "game"
                  ? "bg-slate-800 text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>⚔️</span>
              <span>Training Game</span>
            </button>
            <button
              onClick={() => onSelectTab("theory")}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                activeTab === "theory"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>📖</span>
              <span>Theory Section</span>
            </button>
          </div>
        </div>

        {/* Right Stats & Controls */}
        <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3.5">
          {/* Daily Streak & Checked Status */}
          <div className="hidden md:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-1 text-amber-400 font-bold">
              <Flame className="w-4 h-4 fill-amber-500/20" />
              <span>{currentStreak}d</span>
            </div>
            <span className="text-slate-700">•</span>
            {isCheckedToday ? (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> Checked
              </span>
            ) : (
              <span className="text-amber-400/90 text-[11px]">Pending Today</span>
            )}
          </div>

          {/* Coach Elo Badge */}
          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Coach:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{coachElo}</span>
          </div>

          {/* Connected Chess.com Account Button */}
          {player ? (
            <button
              onClick={onOpenConnectModal}
              title="Click to view habits or switch account"
              className="flex items-center gap-2 bg-slate-950 hover:bg-slate-850 px-2.5 py-1.5 rounded-xl border border-slate-700/80 transition text-xs"
            >
              {player.avatar ? (
                <img src={player.avatar} alt={player.username} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-[11px]">
                  {player.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <span className="font-semibold text-slate-200 block leading-tight truncate max-w-[100px]">
                  {player.username}
                </span>
                <span className="text-[10px] text-slate-400 leading-none">
                  Blitz {stats?.blitz || 1200}
                </span>
              </div>
            </button>
          ) : (
            <button
              id="btn-header-connect"
              onClick={onOpenConnectModal}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-emerald-950"
            >
              <User className="w-3.5 h-3.5" />
              <span>Connect Chess.com</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? "Mute audio effects" : "Unmute audio effects"}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
