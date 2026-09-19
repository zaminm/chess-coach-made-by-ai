import React from "react";
import { Trophy, CheckCircle2, TrendingUp, Sparkles, RefreshCw, X, ArrowRight, Flame } from "lucide-react";

interface PostGameModalProps {
  isOpen: boolean;
  result: "player_win" | "coach_win" | "draw";
  movesCount: number;
  coachEloBefore: number;
  coachEloAfter: number;
  eloDelta: number;
  todayIsChecked: boolean;
  streakCount: number;
  reviewData: {
    summary: string;
    keyLesson: string;
    adaptationNote: string;
  } | null;
  onNewGame: () => void;
  onClose: () => void;
  onAnalyzeTheory?: () => void;
}

export const PostGameModal: React.FC<PostGameModalProps> = ({
  isOpen,
  result,
  movesCount,
  coachEloBefore,
  coachEloAfter,
  eloDelta,
  todayIsChecked,
  streakCount,
  reviewData,
  onNewGame,
  onClose,
  onAnalyzeTheory,
}) => {
  if (!isOpen) return null;

  const isWin = result === "player_win";
  const isDraw = result === "draw";

  const title = isWin
    ? "Victory Over Coach!"
    : isDraw
    ? "Hard-Fought Draw"
    : "Defeat - Instructive Game";

  const subtitle = isWin
    ? `You conquered the coach's adaptive strategy in ${movesCount} moves!`
    : isDraw
    ? `A balanced tactical fight across ${movesCount} moves.`
    : `The coach exploited your tactical pressure in ${movesCount} moves.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="post-game-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header with Trophy / Badge */}
        <div
          className={`p-6 text-center relative border-b ${
            isWin
              ? "bg-gradient-to-b from-emerald-950/60 to-slate-900 border-emerald-500/30"
              : isDraw
              ? "bg-gradient-to-b from-amber-950/40 to-slate-900 border-amber-500/30"
              : "bg-gradient-to-b from-rose-950/40 to-slate-900 border-rose-500/30"
          }`}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 shadow-xl ${
              isWin
                ? "bg-emerald-500 text-slate-950 shadow-emerald-950/80"
                : isDraw
                ? "bg-amber-500 text-slate-950 shadow-amber-950/80"
                : "bg-slate-800 text-slate-300 border border-slate-700 shadow-slate-950"
            }`}
          >
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black text-slate-100 tracking-tight">{title}</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">{subtitle}</p>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Daily Checked Day Celebration Pill */}
          <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-emerald-300 text-sm block">Checked Day Earned!</span>
                <span className="text-[11px] text-emerald-400/80">Daily training requirement fulfilled for today</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <Flame className="w-4 h-4 fill-amber-500/20" />
              <span>{streakCount} Day Streak</span>
            </div>
          </div>

          {/* Elo Progression Section */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Adaptive Elo Progression
              </span>
              <span className="text-emerald-400 font-bold font-mono">
                +{eloDelta} Elo
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300 pt-1">
              <div>
                <span className="text-[10px] text-slate-500 block">Coach Elo Before</span>
                <span className="font-mono text-base font-bold text-slate-400">{coachEloBefore}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
              <div className="text-right">
                <span className="text-[10px] text-emerald-500 font-medium block">New Coach Elo</span>
                <span className="font-mono text-lg font-black text-emerald-400">{coachEloAfter}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-1 leading-normal border-t border-slate-850">
              {isWin
                ? "The coach recognized your victory and leveled up! It will calculate deeper and punish mistakes harder in your next match."
                : "The coach adjusted slightly to keep your daily training right at the edge of your abilities."}
            </p>
          </div>

          {/* AI Coach Game Debrief */}
          {reviewData && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <span className="font-bold uppercase tracking-wider text-[11px] text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Grandmaster Post-Game Debrief
              </span>

              <p className="text-slate-300 leading-relaxed italic">
                "{reviewData.summary}"
              </p>

              <div className="bg-indigo-950/30 p-2.5 rounded-lg border border-indigo-500/20 text-indigo-200">
                <span className="font-semibold text-indigo-300 block mb-0.5 text-[11px]">Key Takeaway:</span>
                {reviewData.keyLesson}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2.5">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg transition"
          >
            Review Board
          </button>
          <div className="flex items-center gap-2">
            {onAnalyzeTheory && (
              <button
                onClick={onAnalyzeTheory}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-950"
              >
                <span>📖</span>
                <span>Analyze Game Theory</span>
              </button>
            )}
            <button
              id="btn-modal-new-game"
              onClick={onNewGame}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-950"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Next Match</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
