import { Chess, Square, Move } from "chess.js";
import { AdaptiveStyle } from "../types";

// Standard Piece Values
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Positional Piece-Square Tables (White perspective; flipped for Black)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  5,  0,  0,  5,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  0, 10, 15, 15, 10,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0,
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];

const KING_MIDGAME_TABLE = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20,
];

function getSquareIndex(sq: Square): number {
  const file = sq.charCodeAt(0) - 97; // a=0, h=7
  const rank = 8 - parseInt(sq[1], 10); // rank 8=0, rank 1=7
  return rank * 8 + file;
}

// Evaluate board from perspective of White (positive = White ahead, negative = Black ahead)
export function evaluateBoard(game: Chess, adaptiveStyle: AdaptiveStyle = "tactical_blitz"): number {
  let score = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const pieceType = piece.type;
      const isWhite = piece.color === "w";
      const value = PIECE_VALUES[pieceType] || 0;

      // Positional table index
      const sqIdx = r * 8 + c;
      const flippedIdx = (7 - r) * 8 + c;
      const idx = isWhite ? sqIdx : flippedIdx;

      let positionBonus = 0;
      if (pieceType === "p") positionBonus = PAWN_TABLE[idx] || 0;
      else if (pieceType === "n") positionBonus = KNIGHT_TABLE[idx] || 0;
      else if (pieceType === "b") positionBonus = BISHOP_TABLE[idx] || 0;
      else if (pieceType === "r") positionBonus = ROOK_TABLE[idx] || 0;
      else if (pieceType === "q") positionBonus = QUEEN_TABLE[idx] || 0;
      else if (pieceType === "k") positionBonus = KING_MIDGAME_TABLE[idx] || 0;

      const totalPieceScore = value + positionBonus;
      score += isWhite ? totalPieceScore : -totalPieceScore;
    }
  }

  // Checkmate / Check bonuses
  if (game.isCheckmate()) {
    return game.turn() === "w" ? -50000 : 50000;
  }
  if (game.isDraw()) {
    return 0;
  }

  // Apply Adaptive Style Weights
  if (adaptiveStyle === "gambit_stress") {
    // Reward piece mobility and central control heavily
    const mobility = game.moves().length;
    score += game.turn() === "w" ? mobility * 3 : -mobility * 3;
  } else if (adaptiveStyle === "endgame_squeeze") {
    // Penalize keeping queen if behind, reward grinding
    if (game.isCheck()) {
      score += game.turn() === "w" ? -25 : 25;
    }
  } else if (adaptiveStyle === "anti_open_grind") {
    // Discourage symmetrical pawn structures
    if (game.isCheck()) {
      score += game.turn() === "w" ? -35 : 35;
    }
  }

  return score;
}

// Quiescence Search for quiet positions at search leaf nodes (avoids horizon effect on captures)
function quiescence(game: Chess, alpha: number, beta: number, isMaximizing: boolean, depthLimit = 2): number {
  const standPat = evaluateBoard(game);

  if (isMaximizing) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }

  if (depthLimit <= 0) return standPat;

  const captures = game.moves({ verbose: true }).filter((m) => m.captured);
  if (captures.length === 0) return standPat;

  if (isMaximizing) {
    for (const move of captures) {
      game.move(move);
      const score = quiescence(game, alpha, beta, false, depthLimit - 1);
      game.undo();
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  } else {
    for (const move of captures) {
      game.move(move);
      const score = quiescence(game, alpha, beta, true, depthLimit - 1);
      game.undo();
      if (score <= alpha) return alpha;
      if (score < beta) beta = score;
    }
    return beta;
  }
}

// Minimax with Alpha-Beta Pruning
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  adaptiveStyle: AdaptiveStyle
): number {
  if (depth === 0 || game.isGameOver()) {
    return quiescence(game, alpha, beta, isMaximizing, 1);
  }

  const moves = game.moves({ verbose: true });
  // Move ordering: sort captures and checks first to optimize alpha-beta cutoff
  moves.sort((a, b) => {
    const aVal = (a.captured ? PIECE_VALUES[a.captured] || 0 : 0) + (a.san.includes("+") ? 50 : 0);
    const bVal = (b.captured ? PIECE_VALUES[b.captured] || 0 : 0) + (b.san.includes("+") ? 50 : 0);
    return bVal - aVal;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const ev = minimax(game, depth - 1, alpha, beta, false, adaptiveStyle);
      game.undo();
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const ev = minimax(game, depth - 1, alpha, beta, true, adaptiveStyle);
      game.undo();
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Opening Book for Anti-Comfort Repertoire
const ANTI_COMFORT_BOOK: Record<string, string[]> = {
  // Start as White: If playing anti-open, play 1.c4 or 1.f4 (King's Gambit / Bird) or 1.d4
  start_anti_open: ["c4", "f4", "Nf3"],
  // Start as White: If playing gambit stress, play Evans Gambit or King's Gambit
  start_gambit: ["e4", "d4"],
  // After 1. e4 e5 as White:
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq -": ["f4", "Nf3", "Bc4"], // King's Gambit or Italian
  // After 1. e4 as Black against student:
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq -": ["c5", "e6", "c6"], // Sicilian, French, Caro-Kann (avoiding predictable 1...e5)
  // After 1. d4 as Black against student:
  "rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq -": ["Nf6", "g6", "c5"], // King's Indian or Benoni
};

export interface EngineResult {
  bestMove: Move | null;
  evalScore: number;
  depthUsed: number;
  coachComment?: string;
}

// Compute the best move for the AI Coach based on Elo and Adaptive Style
export function getCoachMove(
  game: Chess,
  coachElo: number,
  adaptiveStyle: AdaptiveStyle,
  moveNumber: number
): EngineResult {
  const possibleMoves = game.moves({ verbose: true });
  if (possibleMoves.length === 0) {
    return { bestMove: null, evalScore: 0, depthUsed: 0 };
  }

  // 1. Check opening book for early moves (< 6 moves)
  if (moveNumber <= 3) {
    const fenKey = game.fen().split(" ").slice(0, 4).join(" ");
    const bookOptions = ANTI_COMFORT_BOOK[fenKey];
    if (bookOptions && bookOptions.length > 0) {
      for (const optSan of bookOptions) {
        const found = possibleMoves.find((m) => m.san === optSan || m.to === optSan);
        if (found) {
          return {
            bestMove: found,
            evalScore: 0,
            depthUsed: 1,
            coachComment: `Playing the ${optSan} line to challenge your comfort zone!`,
          };
        }
      }
    }
  }

  // 2. Determine search depth and blunder rate based on Coach Elo
  let depth = 2;
  let blunderChance = 0.20; // Chance of picking a second-best or random move at lower Elo

  if (coachElo < 1000) {
    depth = 1;
    blunderChance = 0.30;
  } else if (coachElo < 1300) {
    depth = 2;
    blunderChance = 0.15;
  } else if (coachElo < 1600) {
    depth = 3;
    blunderChance = 0.05;
  } else if (coachElo < 1900) {
    depth = 3;
    blunderChance = 0.01;
  } else {
    // 1900+
    depth = 4;
    blunderChance = 0.0;
  }

  // Check if coach should intentionally play a sub-optimal move to match lower Elo
  if (blunderChance > 0 && Math.random() < blunderChance && possibleMoves.length > 1) {
    // Pick a playable, legal non-blunder or slightly imperfect move
    const randomPick = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    return {
      bestMove: randomPick,
      evalScore: 0,
      depthUsed: 1,
    };
  }

  const isWhite = game.turn() === "w";
  let bestMove: Move | null = null;
  let bestValue = isWhite ? -Infinity : Infinity;

  // Evaluate each candidate move
  for (const move of possibleMoves) {
    game.move(move);
    const value = minimax(game, depth - 1, -Infinity, Infinity, !isWhite, adaptiveStyle);
    game.undo();

    if (isWhite) {
      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    } else {
      if (value < bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }
  }

  return {
    bestMove: bestMove || possibleMoves[0],
    evalScore: bestValue,
    depthUsed: depth,
  };
}
