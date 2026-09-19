import React, { useState } from "react";
import { Chess, Square, Move } from "chess.js";
import { ChessPiece } from "./ChessPieces";

interface ChessBoardProps {
  game: Chess;
  playerColor: "white" | "black";
  isCoachThinking: boolean;
  onPlayerMove: (from: Square, to: Square, promotion?: string) => boolean;
  lastMove: { from: Square; to: Square } | null;
  disabled?: boolean;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  game,
  playerColor,
  isCoachThinking,
  onPlayerMove,
  lastMove,
  disabled = false,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargetSquares, setLegalTargetSquares] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);

  const board = game.board();
  const isWhitePerspective = playerColor === "white";
  const files = isWhitePerspective ? ["a", "b", "c", "d", "e", "f", "g", "h"] : ["h", "g", "f", "e", "d", "c", "b", "a"];
  const ranks = isWhitePerspective ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];

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

  // Calculate captured pieces
  const capturedWhite: string[] = [];
  const capturedBlack: string[] = [];
  const initialCounts: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
  const currentWhite: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
  const currentBlack: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type !== "k") {
        if (p.color === "w") currentWhite[p.type] = (currentWhite[p.type] || 0) + 1;
        else currentBlack[p.type] = (currentBlack[p.type] || 0) + 1;
      }
    }
  }

  const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  let whiteMaterial = 0;
  let blackMaterial = 0;

  Object.keys(initialCounts).forEach((type) => {
    const diffW = initialCounts[type] - (currentWhite[type] || 0);
    const diffB = initialCounts[type] - (currentBlack[type] || 0);
    for (let i = 0; i < diffW; i++) capturedWhite.push(type);
    for (let i = 0; i < diffB; i++) capturedBlack.push(type);

    whiteMaterial += (currentWhite[type] || 0) * pieceValues[type];
    blackMaterial += (currentBlack[type] || 0) * pieceValues[type];
  });

  const materialDiff = playerColor === "white" ? whiteMaterial - blackMaterial : blackMaterial - whiteMaterial;

  const handleSquareClick = (sq: Square) => {
    if (disabled || isCoachThinking) return;

    // Is it player's turn?
    const isPlayerTurn = (playerColor === "white" && game.turn() === "w") || (playerColor === "black" && game.turn() === "b");
    if (!isPlayerTurn) return;

    // If already clicked a piece and clicked a legal destination
    if (selectedSquare) {
      if (legalTargetSquares.includes(sq)) {
        // Check for promotion
        const piece = game.get(selectedSquare);
        const isPromotion =
          piece &&
          piece.type === "p" &&
          ((piece.color === "w" && sq.endsWith("8")) || (piece.color === "b" && sq.endsWith("1")));

        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: sq });
          return;
        }

        onPlayerMove(selectedSquare, sq);
        setSelectedSquare(null);
        setLegalTargetSquares([]);
        return;
      }

      // If clicked on another own piece, switch selection
      const clickedPiece = game.get(sq);
      if (clickedPiece && ((playerColor === "white" && clickedPiece.color === "w") || (playerColor === "black" && clickedPiece.color === "b"))) {
        setSelectedSquare(sq);
        const moves = game.moves({ square: sq, verbose: true }) as Move[];
        setLegalTargetSquares(moves.map((m) => m.to as Square));
        return;
      }

      // Deselect
      setSelectedSquare(null);
      setLegalTargetSquares([]);
      return;
    }

    // Select piece
    const piece = game.get(sq);
    if (!piece) return;
    const isOwnPiece = (playerColor === "white" && piece.color === "w") || (playerColor === "black" && piece.color === "b");
    if (isOwnPiece) {
      setSelectedSquare(sq);
      const moves = game.moves({ square: sq, verbose: true }) as Move[];
      setLegalTargetSquares(moves.map((m) => m.to as Square));
    }
  };

  const handlePromotionSelect = (promoPiece: "q" | "r" | "b" | "n") => {
    if (pendingPromotion) {
      onPlayerMove(pendingPromotion.from, pendingPromotion.to, promoPiece);
      setPendingPromotion(null);
      setSelectedSquare(null);
      setLegalTargetSquares([]);
    }
  };

  return (
    <div id="chess-board-container" className="flex flex-col items-center select-none">
      {/* Top Bar: Opponent / Coach Captured pieces */}
      <div className="w-full max-w-[500px] flex items-center justify-between py-2 px-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-medium mr-1">Coach:</span>
          {(playerColor === "white" ? capturedWhite : capturedBlack).map((p, i) => (
            <div key={i} className="w-4 h-4 opacity-80">
              <ChessPiece type={p as any} color={playerColor === "white" ? "w" : "b"} />
            </div>
          ))}
          {materialDiff < 0 && (
            <span className="ml-1 text-emerald-400 font-semibold text-[11px] bg-emerald-950/60 px-1.5 py-0.5 rounded">
              +{Math.abs(materialDiff)}
            </span>
          )}
        </div>
        {isCoachThinking && (
          <div className="flex items-center gap-1.5 text-amber-400 font-sans text-xs animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Coach calculating...
          </div>
        )}
      </div>

      {/* Main Board Grid */}
      <div className="relative border-4 border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-slate-900 w-full max-w-[500px] aspect-square">
        <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
          {ranks.map((rank, rIdx) =>
            files.map((file, fIdx) => {
              const sq = `${file}${rank}` as Square;
              const isLight = (fIdx + rIdx) % 2 === 0;
              const piece = game.get(sq);
              const isSelected = selectedSquare === sq;
              const isLegalTarget = legalTargetSquares.includes(sq);
              const isLastMoveSquare = lastMove && (lastMove.from === sq || lastMove.to === sq);
              const isKingInCheck = checkKingSquare === sq;

              // Theme square colors
              let bgClass = isLight ? "bg-[#e8ebef]" : "bg-[#718290]";

              if (isLastMoveSquare) {
                bgClass = isLight ? "bg-[#cbdc98]" : "bg-[#9db85e]";
              }
              if (isSelected) {
                bgClass = "bg-[#f5ee82]";
              }
              if (isKingInCheck) {
                bgClass = "bg-rose-500/80 animate-pulse";
              }

              return (
                <div
                  key={sq}
                  id={`square-${sq}`}
                  onClick={() => handleSquareClick(sq)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors duration-100 ${bgClass}`}
                >
                  {/* Rank / File Coordinate Labels */}
                  {fIdx === 0 && (
                    <span
                      className={`absolute top-0.5 left-1 text-[10px] font-bold pointer-events-none ${
                        isLight ? "text-slate-500" : "text-slate-300"
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                  {rIdx === 7 && (
                    <span
                      className={`absolute bottom-0.5 right-1 text-[10px] font-bold pointer-events-none ${
                        isLight ? "text-slate-500" : "text-slate-300"
                      }`}
                    >
                      {file}
                    </span>
                  )}

                  {/* Piece */}
                  {piece && (
                    <div className="w-[82%] h-[82%] z-10 drop-shadow-md transform transition-transform duration-100 hover:scale-105 active:scale-95">
                      <ChessPiece type={piece.type} color={piece.color} />
                    </div>
                  )}

                  {/* Legal Move Indicators */}
                  {isLegalTarget && !piece && (
                    <div className="absolute w-3.5 h-3.5 bg-slate-900/30 rounded-full pointer-events-none z-20" />
                  )}
                  {isLegalTarget && piece && (
                    <div className="absolute inset-0.5 border-4 border-slate-900/35 rounded-full pointer-events-none z-20" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Promotion Selection Modal Overlay */}
        {pendingPromotion && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
            <h4 className="text-white font-semibold mb-3 text-sm tracking-wide">Pawn Promotion</h4>
            <div className="flex gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-xl">
              {(["q", "r", "b", "n"] as const).map((promo) => (
                <button
                  key={promo}
                  id={`btn-promo-${promo}`}
                  onClick={() => handlePromotionSelect(promo)}
                  className="w-14 h-14 bg-slate-700/80 hover:bg-emerald-600/60 rounded-lg p-1.5 transition-colors border border-slate-600 flex items-center justify-center"
                >
                  <ChessPiece type={promo} color={playerColor === "white" ? "w" : "b"} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Player Captured pieces */}
      <div className="w-full max-w-[500px] flex items-center justify-between py-2 px-3 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-500 font-medium mr-1">You:</span>
          {(playerColor === "white" ? capturedBlack : capturedWhite).map((p, i) => (
            <div key={i} className="w-4 h-4 opacity-80">
              <ChessPiece type={p as any} color={playerColor === "white" ? "b" : "w"} />
            </div>
          ))}
          {materialDiff > 0 && (
            <span className="ml-1 text-emerald-400 font-semibold text-[11px] bg-emerald-950/60 px-1.5 py-0.5 rounded">
              +{materialDiff}
            </span>
          )}
        </div>
        <div className="text-slate-400 font-sans text-xs">
          Turn: <span className="font-semibold text-slate-200">{game.turn() === "w" ? "White" : "Black"}</span>
        </div>
      </div>
    </div>
  );
};
