import React, { useState } from "react";
import { ChessComPlayer, ChessComStats, HabitsAnalysis } from "../types";
import { CheckCircle2, Search, Sparkles, User, Trophy, ShieldAlert, ArrowRight, X } from "lucide-react";

interface ConnectModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
  onConnected: (player: ChessComPlayer, stats: ChessComStats, habits: HabitsAnalysis, recentGames: any[]) => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  canClose = false,
  onConnected,
}) => {
  const [usernameInput, setUsernameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{
    player: ChessComPlayer;
    stats: ChessComStats;
    habits: HabitsAnalysis;
    recentGames: any[];
  } | null>(null);

  if (!isOpen) return null;

  const handleFetch = async (unameToFetch?: string) => {
    const targetName = (unameToFetch || usernameInput).trim();
    if (!targetName) {
      setError("Please enter your Chess.com username.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/chesscom/profile/${encodeURIComponent(targetName)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Could not find Chess.com player.");
      }

      setPreviewData(data);
    } catch (err: any) {
      setError(err.message || "Failed to connect with Chess.com. Please check username.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (previewData) {
      onConnected(previewData.player, previewData.stats, previewData.habits, previewData.recentGames);
      if (onClose) onClose();
    }
  };

  // Demo fallback for instant tryout
  const handleQuickSample = (sampleName: string) => {
    setUsernameInput(sampleName);
    handleFetch(sampleName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div
        id="connect-chesscom-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 relative">
          {canClose && onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Step 1: Account Connection</span>
          </div>

          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Connect Your Chess.com Account</h2>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed">
            Your Grandmaster coach will extract your recent game archives to detect your opening habits, comfort zones, and weaknesses.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Input Form */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Chess.com Username
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="input-chesscom-username"
                  type="text"
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                  placeholder="e.g., your_username"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-100 rounded-xl px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-600 font-mono"
                />
              </div>
              <button
                id="btn-fetch-chesscom"
                onClick={() => handleFetch()}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-950"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Analyze Account
              </button>
            </div>

            {error && (
              <div className="mt-2 text-rose-400 text-xs flex items-center gap-1.5 bg-rose-950/30 p-2.5 rounded-lg border border-rose-800/40">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Quick Demo Shortcuts */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">Or test immediately with popular accounts:</span>
            <div className="flex flex-wrap gap-2">
              {["DanielNaroditsky", "GothamChess", "Hikaru", "MagnusCarlsen"].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleQuickSample(sample)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition flex items-center gap-1.5"
                >
                  <User className="w-3 h-3 text-slate-400" />
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Preview of Connected Account Data & Habits */}
          {previewData && (
            <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4.5 space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-3.5">
                {previewData.player.avatar ? (
                  <img
                    src={previewData.player.avatar}
                    alt={previewData.player.username}
                    className="w-12 h-12 rounded-full border-2 border-emerald-500 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center text-slate-300 font-bold text-lg">
                    {previewData.player.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-base">{previewData.player.username}</span>
                    {previewData.player.title && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {previewData.player.title}
                      </span>
                    )}
                    <span className="text-emerald-400 text-xs flex items-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span>Rapid: <strong className="text-slate-200">{previewData.stats.rapid}</strong></span>
                    <span>•</span>
                    <span>Blitz: <strong className="text-slate-200">{previewData.stats.blitz}</strong></span>
                    <span>•</span>
                    <span>Games parsed: <strong className="text-slate-200">{previewData.habits.gamesAnalyzed}</strong></span>
                  </div>
                </div>
              </div>

              {/* Extracted Habits Summary */}
              <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Opening Comfort Zone:</span>
                  <span className="font-semibold text-amber-300">{previewData.habits.topWhiteOpening}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Response as Black:</span>
                  <span className="font-semibold text-indigo-300">{previewData.habits.topBlackDefense}</span>
                </div>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-slate-400">Playing Habit Archetype:</span>
                  <span className="font-semibold text-emerald-300">{previewData.habits.comfortZoneLabel}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 leading-normal">
                  <span className="text-rose-400 font-semibold block mb-0.5">Coach Adaptive Directive:</span>
                  {previewData.habits.antiComfortStrategy}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Recommended Coach Starting Elo:</span>
                <span className="font-bold text-emerald-400 text-sm">~{previewData.habits.recommendedCoachElo} Elo</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-3">
          {canClose && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-3.5 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          )}
          <button
            id="btn-confirm-connect"
            onClick={handleConfirm}
            disabled={!previewData}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-medium text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-950"
          >
            <span>Activate Personalized Coach</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
