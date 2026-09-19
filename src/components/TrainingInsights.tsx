import React from "react";
import { ChessComPlayer, ChessComStats, HabitsAnalysis } from "../types";
import { Activity, ArrowUpRight, BrainCircuit, Crosshair, Swords, Trophy } from "lucide-react";

interface TrainingInsightsProps {
  player: ChessComPlayer | null;
  stats: ChessComStats | null;
  habits: HabitsAnalysis | null;
  recentGames: any[];
  coachElo: number;
}

export const TrainingInsights: React.FC<TrainingInsightsProps> = ({
  player,
  stats,
  habits,
  recentGames,
  coachElo,
}) => {
  if (!player || !stats) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <BrainCircuit className="w-4 h-4 text-cyan-400" />
          <span className="text-[11px] uppercase tracking-wider font-bold text-slate-300">Training Intelligence</span>
        </div>
        <p className="text-xs text-slate-500">Connect Chess.com to turn your game history into a training plan.</p>
      </div>
    );
  }

  const games = recentGames || [];
  const username = player.username.toLowerCase();
  let wins = 0, losses = 0, draws = 0;

  for (const g of games) {
    const isWhite = g.white?.username?.toLowerCase() === username;
    const result = isWhite ? g.white?.result : g.black?.result;
    if (result === "win") wins++;
    else if (["checkmated", "resigned", "timeout", "lose"].includes(result)) losses++;
    else if (["agreed", "stalemate", "repetition", "50move", "insufficient"].includes(result)) draws++;
  }

  const total = wins + losses + draws;
  const winRate = total ? Math.round((wins / total) * 100) : 0;
  const coachGap = coachElo - Math.max(stats.rapid || 0, stats.blitz || 0);
  const focus = habits?.comfortZoneLabel || "Build a larger sample before prescribing a specific weakness.";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-300">Training Intelligence</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Your coach adapts from actual games, not generic drills.</p>
        </div>
        <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-2 py-1">LIVE PROFILE</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric icon={<Trophy className="w-3.5 h-3.5" />} label="Wins" value={String(wins)} />
        <Metric icon={<Crosshair className="w-3.5 h-3.5" />} label="Win rate" value={winRate + "%"} />
        <Metric icon={<Swords className="w-3.5 h-3.5" />} label="Sample" value={String(games.length)} />
      </div>

      <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Current target</span>
          <span className="text-[10px] font-mono text-emerald-400">{coachGap >= 0 ? "+" : ""}{coachGap} Elo</span>
        </div>
        <p className="text-xs font-semibold text-slate-200">{focus}</p>
        <p className="text-[11px] text-slate-500 mt-1">The next games should deliberately attack this pattern rather than simply chase wins.</p>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className="text-slate-500">Rapid <b className="text-slate-300">{stats.rapid}</b> · Blitz <b className="text-slate-300">{stats.blitz}</b></span>
        <span className="text-emerald-400 font-semibold flex items-center gap-1">Adaptive <ArrowUpRight className="w-3 h-3" /></span>
      </div>
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-2.5">
    <div className="text-cyan-400 mb-1">{icon}</div>
    <div className="text-sm font-black text-slate-100">{value}</div>
    <div className="text-[10px] text-slate-500">{label}</div>
  </div>
);
