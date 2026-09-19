import React, { useState } from "react";
import { Chess, Square } from "chess.js";
import { ChessPiece } from "./ChessPieces";
import { AnalyzedMove } from "../types";

interface TheoryAnalysisBoardProps {
  game: Chess;
  playerColor: "white" | "black";
  currentMove: AnalyzedMove | null;
  showTheoreticalArrow?: boolean;
}

export const TheoryAnalysisBoard: React.FC<TheoryAnalysisBoardProps> = ({
  game,
  playerColor,
  currentMove,
  showTheoreticalArrow = true,
}) => {
  const isWhitePerspective = playerColor === "white";
  const files = isWhitePerspective ? ["a", "b", "c", "d", "e", "f", "g", "h"] : ["h", "g", "f", "e", "d", "c", "b", "a"];
  const ranks = isWhitePerspective ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

  const board = game.board();

  // Find King square if in check
  let checkKingSquare: Square | null = null;
  if (game.inCheck()) {
    const turn = game.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === "k" && p.color === turn) {
          checkKingSquare = `${String.fromCharCode(97 + c)}${8 - r}` as Square;
        }
      }
    }
  }

  // Calculate coordinates for SVG overlay (0 to 800)
  const getSquareCoords = (sq: string) => {
    const f = sq[0];
    const r = parseInt(sq[1], 10);
    const colIdx = files.indexOf(f);
    const rowIdx = ranks.indexOf(r);
    return {
      x: colIdx * 100 + 50,
      y: rowIdx * 100 + 50,
    };
  };

  const isMistakeMove =
    currentMove &&
    (currentMove.classification === "blunder" ||
      currentMove.classification === "mistake" ||
      currentMove.classification === "inaccuracy");

  const playedFrom = currentMove?.from;
  const playedTo = currentMove?.to;
  const theoreticalFrom = currentMove?.theoreticalMove?.from;
  const theoreticalTo = currentMove?.theoreticalMove?.to;

  return (
    <div id="theory-board-wrapper" className="relative select-none w-full max-w-[480px] aspect-square mx-auto">
      {/* Main 8x8 Board */}
      <div className="relative border-4 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-slate-900 w-full h-full">
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {ranks.map((rank, rIdx) =>
            files.map((file, fIdx) => {
              const sq = `${file}${rank}` as Square;
              const isLight = (fIdx + rIdx) % 2 === 0;
              const piece = game.get(sq);

              const isPlayedFrom = playedFrom === sq;
              const isPlayedTo = playedTo === sq;
              const isTheoryFrom = isMistakeMove && theoreticalFrom === sq;
              const isTheoryTo = isMistakeMove && theoreticalTo === sq;
              const isKingInCheck = checkKingSquare === sq;

              // Base color
              let bgClass = isLight ? "bg-[#e8ebef]" : "bg-[#718290]";

              if (isPlayedTo || isPlayedFrom) {
                if (currentMove?.classification === "blunder") {
                  bgClass = isLight ? "bg-rose-200/90" : "bg-rose-700/80";
                } else if (currentMove?.classification === "mistake") {
                  bgClass = isLight ? "bg-orange-200/90" : "bg-orange-600/80";
                } else if (currentMove?.classification === "inaccuracy") {
                  bgClass = isLight ? "bg-amber-100" : "bg-amber-600/70";
                } else if (currentMove?.classification === "book") {
                  bgClass = isLight ? "bg-sky-200/90" : "bg-sky-600/70";
                } else {
                  bgClass = isLight ? "bg-[#cbdc98]" : "bg-[#9db85e]";
                }
              }

              if (isTheoryTo) {
                bgClass = isLight ? "bg-emerald-200" : "bg-emerald-600/80";
              }

              if (isKingInCheck) {
                bgClass = "bg-rose-500/85 animate-pulse";
              }

              return (
                <div
                  key={sq}
                  className={`relative flex items-center justify-center transition-colors ${bgClass}`}
                >
                  {/* Coordinates */}
                  {fIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] font-bold font-mono pointer-events-none ${
                        isLight ? "text-slate-500" : "text-slate-300"
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  {rIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] font-bold font-mono pointer-events-none ${
                        isLight ? "text-slate-500" : "text-slate-300"
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Move Target Indicator Badge */}
                  {isPlayedTo && currentMove && (
                    <div className="absolute top-1 right-1 z-10">
                      {currentMove.classification === "blunder" && (
                        <span className="bg-rose-600 text-white text-[10px] font-mono font-black px-1 rounded shadow">
                          ??
                        </span>
                      )}
                      {currentMove.classification === "mistake" && (
                        <span className="bg-orange-500 text-white text-[10px] font-mono font-black px-1 rounded shadow">
                          ?
                        </span>
                      )}
                      {currentMove.classification === "inaccuracy" && (
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-mono font-black px-1 rounded shadow">
                          ?!
                        </span>
                      )}
                      {currentMove.classification === "book" && (
                        <span className="bg-sky-500 text-white text-[9px] font-mono font-bold px-1 rounded shadow">
                          Book
                        </span>
                      )}
                      {currentMove.classification === "best" && (
                        <span className="bg-emerald-500 text-slate-950 text-[10px] font-mono font-bold px-1 rounded shadow">
                          ★
                        </span>
                      )}
                    </div>
                  )}

                  {/* Theoretical Best Move Target Marker */}
                  {isTheoryTo && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <div className="w-9 h-9 rounded-full border-2 border-emerald-400 border-dashed bg-emerald-500/20 flex items-center justify-center shadow-lg">
                        <span className="text-xs font-bold text-emerald-300 font-mono">✓</span>
                      </div>
                    </div>
                  )}

                  {/* Piece Rendering */}
                  {piece && (
                    <div className="relative z-0 w-full h-full p-1.5 flex items-center justify-center">
                      <ChessPiece type={piece.type} color={piece.color} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* SVG Arrow Overlay for Theoretical Best Move */}
        {showTheoreticalArrow && isMistakeMove && theoreticalFrom && theoreticalTo && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
            viewBox="0 0 800 800"
          >
            <defs>
              <marker
                id="theory-arrowhead"
                markerWidth="6"
                markerHeight="6"
                refX="4"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 6 3, 0 6" fill="#10b981" />
              </marker>
            </defs>
            {(() => {
              const start = getSquareCoords(theoreticalFrom);
              const end = getSquareCoords(theoreticalTo);
              return (
                <line
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#10b981"
                  strokeWidth="12"
                  strokeOpacity="0.85"
                  strokeLinecap="round"
                  markerEnd="url(#theory-arrowhead)"
                />
              );
            })()}
          </svg>
        )}
      </div>
    </div>
  );
};
