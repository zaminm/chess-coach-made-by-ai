import React from "react";
import { HabitsAnalysis, CoachDiagnosis, AdaptiveStyle } from "../types";
import { Shield, Brain, Zap, Target, TrendingUp, AlertTriangle, BookOpen, MessageSquareQuote } from "lucide-react";

interface AdaptiveHabitsCardProps {
  habits: HabitsAnalysis | null;
  diagnosis: CoachDiagnosis | null;
  currentCoachElo: number;
  activeStyle: AdaptiveStyle;
  onChangeStyle: (style: AdaptiveStyle) => void;
  coachLiveComment: string | null;
}

const STYLE_DESCRIPTIONS: Record<AdaptiveStyle, { name: string; tag: string; desc: string }> = {
  anti_open_grind: {
    name: "Anti-Open Position Grind",
    tag: "Prophylaxis & Maneuvering",
    desc: "Refuses open symmetrical tactical trades. Locks the pawn center and tests your positional maneuvering.",
  },
  gambit_stress: {
    name: "Razor-Sharp Gambit Test",
    tag: "Tactical Chaos",
    desc: "Launches aggressive gambits (King's / Evans / Dragon) to stress-test your defensive calculation under fire.",
  },
  endgame_squeeze: {
    name: "Endgame Technical Squeeze",
    tag: "Pawn Structure Mastery",
    desc: "Trades early attack chances into complex endgames to punish sloppy pawn structures and passive kings.",
  },
  prophylaxis_strangle: {
    name: "Iron Prophylaxis Strangle",
    tag: "Counter-Intuitive Defense",
    desc: "Anticipates all your habitual attack plans and clamps down on key breakout squares.",
  },
  tactical_blitz: {
    name: "Tactical Opportunist",
    tag: "Punishing Inaccuracies",
    desc: "Quickly seizes on hanging pieces, pins, and tactical oversights with aggressive counter-strikes.",
  },
};

export const AdaptiveHabitsCard: React.FC<AdaptiveHabitsCardProps> = ({
  habits,
  diagnosis,
  currentCoachElo,
  activeStyle,
  onChangeStyle,
  coachLiveComment,
}) => {
  // Determine Elo Tier
  let tierLabel = "Novice Apprentice";
  let tierColor = "text-blue-400 border-blue-500/30 bg-blue-500/10";
  if (currentCoachElo >= 1800) {
    tierLabel = "Grandmaster AI";
    tierColor = "text-rose-400 border-rose-500/30 bg-rose-500/10";
  } else if (currentCoachElo >= 1500) {
    tierLabel = "Master Candidate";
    tierColor = "text-amber-400 border-amber-500/30 bg-amber-500/10";
  } else if (currentCoachElo >= 1200) {
    tierLabel = "Club Contender";
    tierColor = "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  }

  return (
    <div id="adaptive-habits-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Coach Header & Dynamic Elo */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-950">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 text-base">{diagnosis?.coachName || "Grandmaster Alexander"}</h3>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${tierColor}`}>
                {tierLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {diagnosis?.coachTitle || "Personalized AI Chess Coach"}
            </p>
          </div>
        </div>

        {/* Coach Elo Gauge */}
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Coach Elo</div>
          <div className="text-xl font-black text-emerald-400 font-mono tracking-tight flex items-center justify-end gap-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>{currentCoachElo}</span>
          </div>
          <span className="text-[10px] text-slate-400 block">Gradually scales with wins</span>
        </div>
      </div>

      {/* Live Coach Commentary Speech Bubble */}
      {coachLiveComment && (
        <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-950 border border-indigo-500/30 rounded-xl p-3 relative shadow-inner">
          <div className="flex items-start gap-2.5">
            <MessageSquareQuote className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider block mb-0.5">
                Live Coach Advice
              </span>
              <p className="text-xs text-slate-200 italic leading-relaxed">
                "{coachLiveComment}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detected Habits from Chess.com */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            Chess.com Habit Diagnosis
          </span>
          {habits && (
            <span className="text-[11px] text-slate-400 font-mono">
              {habits.gamesAnalyzed} games analyzed
            </span>
          )}
        </div>

        {habits ? (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Identified Comfort Zone</span>
              <span className="font-semibold text-amber-300 block truncate">{habits.comfortZoneLabel}</span>
              <span className="text-[10px] text-slate-400 mt-1 block">White Opening: {habits.topWhiteOpening}</span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Win Rate Tendencies</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-emerald-400 font-mono font-bold">W: {habits.whiteWinRate}%</span>
                <span className="text-slate-600">|</span>
                <span className="text-sky-400 font-mono font-bold">B: {habits.blackWinRate}%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Black Response: {habits.topBlackDefense}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
            Connect your Chess.com account above to analyze your playing habits.
          </div>
        )}
      </div>

      {/* Anti-Comfort Protocol: Adaptive Style Selector */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-rose-400" />
            Adaptive Anti-Comfort Protocol
          </span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            Targeting Habits
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-normal">
          {STYLE_DESCRIPTIONS[activeStyle].desc}
        </p>

        {/* Style Selector Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {(Object.keys(STYLE_DESCRIPTIONS) as AdaptiveStyle[]).map((st) => {
            const isSelected = activeStyle === st;
            return (
              <button
                key={st}
                onClick={() => onChangeStyle(st)}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition border ${
                  isSelected
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {STYLE_DESCRIPTIONS[st].name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
