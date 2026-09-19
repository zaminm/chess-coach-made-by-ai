import React from "react";
import { Chess } from "chess.js";
import { RotateCw, Flag, Handshake, HelpCircle, Copy, Check } from "lucide-react";

interface GameControlsProps {
  game: Chess;
  moveHistory: { white: string; black?: string }[];
  isCoachThinking: boolean;
  playerColor: "white" | "black";
  onNewGame: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  onFlipBoard: () => void;
  onRequestHint: () => void;
  hintLoading: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  game,
  moveHistory,
  isCoachThinking,
  playerColor,
  onNewGame,
  onResign,
  onOfferDraw,
  onFlipBoard,
  onRequestHint,
  hintLoading,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyPgn = () => {
    const pgn = game.pgn();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pgn).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const isGameOver = game.isGameOver();

  return (
    <div id="game-controls-card" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full min-h-[320px]">
      {/* Top Header: Move History & Copy */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Move Log</span>
        <button
          onClick={handleCopyPgn}
          title="Copy game PGN notation"
          className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 hover:bg-slate-800 px-2 py-1 rounded transition"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span className="text-[11px]">{copied ? "Copied" : "Copy PGN"}</span>
        </button>
      </div>

      {/* Move History Table */}
      <div className="flex-1 overflow-y-auto max-h-56 pr-1 space-y-1 font-mono text-xs">
        {moveHistory.length === 0 ? (
          <div className="h-28 flex items-center justify-center text-slate-500 text-xs italic font-sans">
            Make your first move to start the training session.
          </div>
        ) : (
          moveHistory.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between px-2 py-1 rounded text-xs ${
                idx % 2 === 0 ? "bg-slate-950/40" : "bg-transparent"
              }`}
            >
              <span className="text-slate-500 w-8">{idx + 1}.</span>
              <span className="text-slate-200 font-semibold flex-1 pl-2">{item.white}</span>
              <span className="text-slate-300 flex-1 pl-2">{item.black || ""}</span>
            </div>
          ))
        )}
      </div>

      {/* In-Game Status Notice */}
      <div className="py-2 text-center text-xs">
        {game.isCheckmate() ? (
          <span className="text-rose-400 font-bold bg-rose-950/50 px-3 py-1 rounded-full border border-rose-800/40">
            Checkmate!
          </span>
        ) : game.inCheck() ? (
          <span className="text-amber-400 font-bold animate-pulse bg-amber-950/50 px-3 py-1 rounded-full border border-amber-800/40">
            Check!
          </span>
        ) : game.isDraw() ? (
          <span className="text-slate-400 font-bold bg-slate-800 px-3 py-1 rounded-full">
            Drawn Game (Stalemate / Repetition)
          </span>
        ) : null}
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2">
        <button
          onClick={onNewGame}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>New Game</span>
        </button>

        <button
          onClick={onRequestHint}
          disabled={isCoachThinking || isGameOver || hintLoading}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-medium text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>{hintLoading ? "Thinking..." : "Coach Hint"}</span>
        </button>

        <button
          onClick={onFlipBoard}
          className="bg-slate-950 hover:bg-slate-850 text-slate-300 text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-800"
        >
          <RotateCw className="w-3.5 h-3.5 text-slate-400" />
          <span>Flip ({playerColor === "white" ? "White" : "Black"})</span>
        </button>

        <button
          onClick={onResign}
          disabled={isGameOver}
          className="bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-800 disabled:opacity-40"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Resign</span>
        </button>
      </div>
    </div>
  );
};
