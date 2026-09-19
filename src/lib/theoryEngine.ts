import { Chess, Square, Move } from "chess.js";
import { AnalyzedMove, GameTheoryAnalysis, MoveClassification } from "../types";
import { evaluateBoard } from "./chessEngine";

// Comprehensive Opening Book Database with ECO and Main Lines
export interface OpeningBookEntry {
  eco: string;
  name: string;
  moves: string[]; // SAN array
  principles: string;
}

export const OPENING_BOOK: OpeningBookEntry[] = [
  // King's Pawn Openings
  {
    eco: "B90",
    name: "Sicilian Defense: Najdorf Variation",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"],
    principles: "Black fights for dynamic counterplay with ...a6 and queenside expansion, while White seeks central dominance or rapid kingside aggression.",
  },
  {
    eco: "B70",
    name: "Sicilian Defense: Dragon Variation",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"],
    principles: "Black fianchettoes the dark-squared bishop onto the long diagonal h8-a1. High tactical stakes with mutual opposite-side castling attacks.",
  },
  {
    eco: "B20",
    name: "Sicilian Defense: Open",
    moves: ["e4", "c5", "Nf3", "d6", "d4", "cxd4"],
    principles: "Asymmetrical struggle where Black trades a flank c-pawn for White's central d-pawn, creating counterplay along the semi-open c-file.",
  },
  {
    eco: "C50",
    name: "Italian Game: Giuoco Piano",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
    principles: "Both sides target the vulnerable f7/f2 pawns while battling for control of the central d4 and d5 squares.",
  },
  {
    eco: "C55",
    name: "Italian Game: Two Knights Defense",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],
    principles: "Sharp tactical counter-attack by Black against e4, forcing White to decide between 4. Ng5 Fried Liver lines or 4. d3 quiet setups.",
  },
  {
    eco: "C60",
    name: "Ruy Lopez: Spanish Opening",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
    principles: "White exerts indirect pressure on e5 by pinning the defending knight on c6, aiming for sustained strategic maneuvering.",
  },
  {
    eco: "C00",
    name: "French Defense",
    moves: ["e4", "e6", "d4", "d5"],
    principles: "Black establishes a solid pawn wedge on d5. White often closes the center with e5, leading to classic pawn chain battles.",
  },
  {
    eco: "B10",
    name: "Caro-Kann Defense",
    moves: ["e4", "c6", "d4", "d5"],
    principles: "Black prepares ...d5 without trapping the light-squared bishop (unlike the French), trading tempo for solid structural health.",
  },
  {
    eco: "B01",
    name: "Scandinavian Defense",
    moves: ["e4", "d5"],
    principles: "Immediate challenge to White's central e4 pawn, leading to open lines at the expense of early queen development.",
  },

  // Queen's Pawn Openings
  {
    eco: "D30",
    name: "Queen's Gambit Declined",
    moves: ["d4", "d5", "c4", "e6"],
    principles: "Black refuses the pawn sacrifice to firmly anchor the center, accepting a temporarily passive bishop on c8 in exchange for rock-solid stability.",
  },
  {
    eco: "D02",
    name: "London System",
    moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"],
    principles: "White develops the dark-squared bishop outside the pawn chain before building a sturdy pawn pyramid (c3-d4-e3).",
  },
  {
    eco: "E60",
    name: "King's Indian Defense",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"],
    principles: "Black yields the center initially to build a hypermodern pawn fortress, preparing fierce flank pawn storms like ...f5.",
  },
  {
    eco: "E20",
    name: "Nimzo-Indian Defense",
    moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"],
    principles: "Black pins the c3 knight to control e4 and threaten doubled c-pawns, creating long-term structural compromises for White.",
  },
  {
    eco: "A10",
    name: "English Opening",
    moves: ["c4"],
    principles: "Flank attack targeting d5 from a distance, frequently transposing into reversed Sicilian or hypermodern setups.",
  },
];

// Identify opening from moves
export function identifyOpening(movesSan: string[]): { eco: string; name: string; principles: string; outOfBookPly: number } {
  let bestMatch: OpeningBookEntry = {
    eco: "A00",
    name: "Unorthodox / Custom Opening",
    moves: [],
    principles: "Both sides adopted non-standard opening setups, prioritizing immediate piece activity over classic textbook theoretical lines.",
  };
  let maxMatchedMoves = 0;

  for (const book of OPENING_BOOK) {
    let matched = 0;
    for (let i = 0; i < book.moves.length && i < movesSan.length; i++) {
      if (book.moves[i] === movesSan[i]) {
        matched++;
      } else {
        break;
      }
    }
    if (matched > maxMatchedMoves) {
      maxMatchedMoves = matched;
      bestMatch = book;
    }
  }

  return {
    eco: bestMatch.eco,
    name: bestMatch.name,
    principles: bestMatch.principles,
    outOfBookPly: maxMatchedMoves,
  };
}

// Generate theory explanation for a mistake based on board state and piece interaction
function generateTheoryExplanation(
  move: Move,
  bestMove: Move | null,
  classification: MoveClassification,
  gameBefore: Chess,
  ply: number
): { whyWrong: string; whyTheoreticalBest: string; principleTag: string } {
  const isWhite = move.color === "w";
  const moveNumber = Math.floor(ply / 2) + 1;
  const pieceName =
    move.piece === "p"
      ? "pawn"
      : move.piece === "n"
      ? "knight"
      : move.piece === "b"
      ? "bishop"
      : move.piece === "r"
      ? "rook"
      : move.piece === "q"
      ? "queen"
      : "king";

  // Check if uncastled king is compromised
  const hasCastled = !gameBefore.getCastlingRights(move.color).k && !gameBefore.getCastlingRights(move.color).q;

  // 1. Blunder cases
  if (classification === "blunder") {
    if (move.piece === "q" && moveNumber < 10) {
      return {
        whyWrong: `Theoretical blunder: Launching your Queen out so early (${move.san}) exposes it to relentless tempo gains by minor pieces, leaving your development severely retarded.`,
        whyTheoreticalBest: bestMove
          ? `Sound theoretical approach: ${bestMove.san} prioritizes rapid minor piece mobilization and king safety before initiating queen skirmishes.`
          : "Focus on piece development first.",
        principleTag: "Premature Queen Excursion",
      };
    }

    return {
      whyWrong: `Tactical & theoretical blunder: Playing ${move.san} leaves key squares compromised and critically neglects defensive harmony. The opponent can immediately punish this tactical oversight.`,
      whyTheoreticalBest: bestMove
        ? `Theoretical requirement: ${bestMove.san} maintains structural balance and keeps the defense coordinated without gifting free tactical counterplay.`
        : "Defensive vigilance required.",
      principleTag: "Tactical Blunder",
    };
  }

  // 2. Mistake cases
  if (classification === "mistake") {
    if (move.piece === "p" && (move.to === "a6" || move.to === "h6" || move.to === "a3" || move.to === "h3")) {
      return {
        whyWrong: `Loss of tempo in opening theory: Playing ${move.san} is an unnecessary edge pawn push. In classical theory, edge moves without concrete threats simply hand central initiative to the opponent.`,
        whyTheoreticalBest: bestMove
          ? `Principled alternative: ${bestMove.san} fights directly for the vital central squares (d4, e4, d5, e5) and accelerates development.`
          : "Control the center first.",
        principleTag: "Tempo & Central Neglect",
      };
    }

    if (!hasCastled && moveNumber > 8) {
      return {
        whyWrong: `King safety violation: Advancing or trading with ${move.san} while your King is still lingering in the open center leaves you vulnerable to devastating central breakthrough sacrifices.`,
        whyTheoreticalBest: bestMove
          ? `Grandmaster principle: ${bestMove.san} prioritizes castling and securing the monarch before opening lines.`
          : "Castle into safety first.",
        principleTag: "King Safety",
      };
    }

    return {
      whyWrong: `Positional mistake: ${move.san} concedes control of critical central outposts and compromises your piece coordination, allowing the opponent to seize the initiative.`,
      whyTheoreticalBest: bestMove
        ? `Theoretical recommendation: ${bestMove.san} preserves piece harmony, guards key outposts, and maintains active central counterplay.`
        : "Maintain piece harmony.",
      principleTag: "Positional Concession",
    };
  }

  // 3. Inaccuracies
  return {
    whyWrong: `Theoretical inaccuracy: While ${move.san} is playable, it is sub-optimal and allows the opponent to equalize or coordinate their forces too easily.`,
    whyTheoreticalBest: bestMove
      ? `More accurate line: ${bestMove.san} keeps maximum tension and creates stricter tactical questions for your opponent to answer.`
      : "Preserve opening tension.",
    principleTag: "Sub-Optimal Coordination",
  };
}

// Analyze a game move by move
export async function analyzeGamePgn(
  pgn: string,
  targetUsername?: string,
  targetColorOverride?: "white" | "black"
): Promise<GameTheoryAnalysis> {
  const game = new Chess();
  try {
    game.loadPgn(pgn);
  } catch {
    // If dirty, still try
  }

  const headers = game.header();
  const history = game.history({ verbose: true });

  const whiteName = headers["White"] || "White";
  const blackName = headers["Black"] || "Black";
  const whiteRating = parseInt(headers["WhiteElo"] || "0", 10) || undefined;
  const blackRating = parseInt(headers["BlackElo"] || "0", 10) || undefined;
  const result = headers["Result"] || "*";
  const date = headers["Date"] || new Date().toISOString().split("T")[0];

  const userLower = (targetUsername || "").toLowerCase();
  let studentColor: "w" | "b" = "w";
  if (targetColorOverride === "black" || blackName.toLowerCase() === userLower) {
    studentColor = "b";
  } else if (targetColorOverride === "white" || whiteName.toLowerCase() === userLower) {
    studentColor = "w";
  }

  // Identify Opening
  const movesSan = history.map((m) => m.san);
  const openingInfo = identifyOpening(movesSan);

  // Fetch AI annotations from server if available
  let serverAnalysis: any = null;
  try {
    const res = await fetch("/api/coach/analyze-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pgn,
        playerUsername: targetUsername,
        playerColor: studentColor === "w" ? "white" : "black",
      }),
    });
    if (res.ok) {
      serverAnalysis = await res.json();
    }
  } catch (err) {
    console.warn("Could not fetch server Gemini analysis:", err);
  }

  // Replay moves step by step to evaluate
  const replayGame = new Chess();
  const analyzedMoves: AnalyzedMove[] = [];

  let blundersCount = 0;
  let mistakesCount = 0;
  let inaccuraciesCount = 0;
  let bookMovesCount = 0;
  let whiteGoodCount = 0;
  let blackGoodCount = 0;

  for (let i = 0; i < history.length; i++) {
    const rawMove = history[i];
    const ply = i;
    const moveNumber = Math.floor(i / 2) + 1;
    const color = rawMove.color;
    const isStudentMove = color === studentColor;

    const fenBefore = replayGame.fen();
    const evalBefore = evaluateBoard(replayGame);

    // Compute best move from position before
    const legalMoves = replayGame.moves({ verbose: true });
    let bestLegalMove: Move | null = null;
    let bestMoveEval = color === "w" ? -Infinity : Infinity;

    // Fast 1-ply search to find best theoretical move
    for (const cand of legalMoves) {
      replayGame.move(cand);
      const ev = evaluateBoard(replayGame);
      replayGame.undo();

      if (color === "w") {
        if (ev > bestMoveEval) {
          bestMoveEval = ev;
          bestLegalMove = cand;
        }
      } else {
        if (ev < bestMoveEval) {
          bestMoveEval = ev;
          bestLegalMove = cand;
        }
      }
    }

    // Execute actual move
    replayGame.move(rawMove);
    const fenAfter = replayGame.fen();
    const evalAfter = evaluateBoard(replayGame);

    // Calculate evaluation delta from moving player's perspective
    // centipawns lost
    const delta = color === "w" ? bestMoveEval - evalAfter : evalAfter - bestMoveEval;

    // Check if within book
    const isBook = i < openingInfo.outOfBookPly;

    let classification: MoveClassification = "good";
    if (isBook) {
      classification = "book";
      bookMovesCount++;
    } else if (delta <= 15) {
      classification = "best";
      if (color === "w") whiteGoodCount++;
      else blackGoodCount++;
    } else if (delta <= 40) {
      classification = "excellent";
      if (color === "w") whiteGoodCount++;
      else blackGoodCount++;
    } else if (delta <= 75) {
      classification = "good";
      if (color === "w") whiteGoodCount++;
      else blackGoodCount++;
    } else if (delta <= 150) {
      classification = "inaccuracy";
      if (isStudentMove) inaccuraciesCount++;
    } else if (delta <= 280) {
      classification = "mistake";
      if (isStudentMove) mistakesCount++;
    } else {
      classification = "blunder";
      if (isStudentMove) blundersCount++;
    }

    // Check if server returned a critical mistake for this specific move
    const serverMistake = serverAnalysis?.criticalMistakes?.find(
      (m: any) => m.moveNumber === moveNumber && m.color === color
    );

    let theoryExp = "";
    let whyWrong = "";
    let whyBest = "";
    let principle = "";

    if (serverMistake) {
      classification = serverMistake.classification || classification;
      whyWrong = serverMistake.whyWrong;
      whyBest = serverMistake.whyTheoreticalBest;
      principle = serverMistake.principleTag || "Grandmaster Theory";
      theoryExp = `${whyWrong} Theoretical remedy: ${whyBest}`;
    } else if (classification === "blunder" || classification === "mistake" || classification === "inaccuracy") {
      const generated = generateTheoryExplanation(rawMove, bestLegalMove, classification, new Chess(fenBefore), ply);
      whyWrong = generated.whyWrong;
      whyBest = generated.whyTheoreticalBest;
      principle = generated.principleTag;
      theoryExp = `${whyWrong} ${whyBest}`;
    }

    analyzedMoves.push({
      ply,
      moveNumber,
      color,
      san: rawMove.san,
      from: rawMove.from,
      to: rawMove.to,
      fenBefore,
      fenAfter,
      classification,
      evalBefore,
      evalAfter,
      evalDelta: Math.max(0, delta),
      theoreticalMove: bestLegalMove
        ? {
            san: bestLegalMove.san,
            from: bestLegalMove.from,
            to: bestLegalMove.to,
          }
        : undefined,
      theoryExplanation: theoryExp || undefined,
      whyWrong: whyWrong || undefined,
      whyTheoreticalBest: whyBest || undefined,
      principleTag: principle || undefined,
      openingName: isBook ? openingInfo.name : undefined,
    });
  }

  // Compute accuracy estimate (0-100%)
  const whiteMoves = analyzedMoves.filter((m) => m.color === "w");
  const blackMoves = analyzedMoves.filter((m) => m.color === "b");

  const calcAcc = (moves: AnalyzedMove[]) => {
    if (moves.length === 0) return 80;
    const totalPenalties = moves.reduce((acc, m) => {
      if (m.classification === "blunder") return acc + 20;
      if (m.classification === "mistake") return acc + 10;
      if (m.classification === "inaccuracy") return acc + 4;
      return acc;
    }, 0);
    return Math.max(45, Math.min(98, Math.round(100 - totalPenalties / moves.length)));
  };

  const accuracyWhite = calcAcc(whiteMoves);
  const accuracyBlack = calcAcc(blackMoves);

  return {
    id: `analysis-${Date.now()}`,
    openingName: serverAnalysis?.openingName || openingInfo.name,
    ecoCode: serverAnalysis?.ecoCode || openingInfo.eco,
    white: { username: whiteName, rating: whiteRating },
    black: { username: blackName, rating: blackRating },
    result,
    date,
    movesCount: history.length,
    analyzedMoves,
    summary: {
      accuracyWhite,
      accuracyBlack,
      blundersCount,
      mistakesCount,
      inaccuraciesCount,
      bookMovesCount,
      mainOpeningTheoryLesson:
        serverAnalysis?.mainOpeningTheoryLesson ||
        openingInfo.principles ||
        "Control key central squares and coordinate minor pieces before launching premature flank attacks.",
      criticalMomentSummary:
        serverAnalysis?.criticalMomentSummary ||
        `The opening was contested in the ${openingInfo.name}. Key deviations occurred in the middle-game transition.`,
    },
  };
}
