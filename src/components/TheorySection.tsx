import React, { useState, useEffect, useRef } from "react";
import { Chess, Square } from "chess.js";
import {
  GameTheoryAnalysis,
  AnalyzedMove,
  RecentChessComGame,
  MoveClassification,
} from "../types";
import { TheoryAnalysisBoard } from "./TheoryAnalysisBoard";
import { analyzeGamePgn } from "../lib/theoryEngine";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
  RotateCw,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  FileText,
  Clock,
  User,
  ArrowRight,
  Zap,
} from "lucide-react";
import { soundManager } from "../lib/sound";

interface TheorySectionProps {
  recentGames: RecentChessComGame[];
  lastTrainingGamePgn: string | null;
  connectedUsername: string | null;
  onBackToGame?: () => void;
}

export const TheorySection: React.FC<TheorySectionProps> = ({
  recentGames,
  lastTrainingGamePgn,
  connectedUsername,
  onBackToGame,
}) => {
  // Selection state
  const [selectedSource, setSelectedSource] = useState<"chesscom" | "last_training" | "custom">("chesscom");
  const [selectedGameIndex, setSelectedGameIndex] = useState<number>(0);
  const [customPgnInput, setCustomPgnInput] = useState("");

  // Analysis state
  const [analysis, setAnalysis] = useState<GameTheoryAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentPly, setCurrentPly] = useState<number>(0);
  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");
  const [isPlaying, setIsPlaying] = useState(false);
  const [mistakesOnlyFilter, setMistakesOnlyFilter] = useState(false);
  const [showAlternativeMove, setShowAlternativeMove] = useState(false);

  // Auto-play timer
  const autoPlayRef = useRef<any>(null);

  // Default sample PGN in case no games exist yet
  const samplePgn = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2026.09.18"]
[White "${connectedUsername || "HeroPlayer"}"]
[Black "Grandmaster_Opponent"]
[Result "0-1"]
[ECO "B90"]
[WhiteElo "1350"]
[BlackElo "1420"]

1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6 6. Be3 e5 7. Nb3 Be6 8. Qd2 Nbd7 9. f3 h5 10. O-O-O Rc8 11. Kb1 Be7 12. h3 b5 13. Bd3 h4 14. f4 b4 15. Ne2 a5 16. f5 Bc4 17. Bxc4 Rxc4 18. Qd3 Rxe4 19. Nd2 Rxe3 20. Qxe3 d5 21. Nf3 Qc7 22. Rhe1 O-O 23. Nxh4 Rc8 24. Rc1 Ne4 25. Nf3 a4 26. g4 a3 27. b3 Bc5 28. Qd3 Nb6 29. c3 bxc3 30. Nxc3 Nxc3+ 31. Qxc3 e4 32. Nd4 Qe5 33. Red1 e3 34. Ne2 Qe4+ 35. Qd3 Qe5 36. Rc2 d4 37. Nxd4 Rd8 0-1`;

  // Run analysis on chosen game
  const handleRunAnalysis = async (pgnToAnalyze: string) => {
    setAnalyzing(true);
    setIsPlaying(false);
    setShowAlternativeMove(false);
    try {
      const result = await analyzeGamePgn(
        pgnToAnalyze,
        connectedUsername || undefined,
        boardOrientation
      );
      setAnalysis(result);
      // Auto-orient board to student's perspective
      if (
        connectedUsername &&
        result.black.username.toLowerCase() === connectedUsername.toLowerCase()
      ) {
        setBoardOrientation("black");
      } else {
        setBoardOrientation("white");
      }

      // Jump to first mistake or first move
      const firstMistakeIdx = result.analyzedMoves.findIndex(
        (m) =>
          m.classification === "blunder" ||
          m.classification === "mistake" ||
          m.classification === "inaccuracy"
      );
      setCurrentPly(firstMistakeIdx >= 0 ? firstMistakeIdx : 0);
    } catch (e) {
      console.error("Analysis failed:", e);
    } finally {
      setAnalyzing(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (recentGames.length > 0 && recentGames[0].pgn) {
      handleRunAnalysis(recentGames[0].pgn);
    } else if (lastTrainingGamePgn) {
      setSelectedSource("last_training");
      handleRunAnalysis(lastTrainingGamePgn);
    } else {
      handleRunAnalysis(samplePgn);
    }
  }, []);

  // Handle auto-play
  useEffect(() => {
    if (isPlaying && analysis) {
      autoPlayRef.current = setInterval(() => {
        setCurrentPly((prev) => {
          if (prev >= analysis.analyzedMoves.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1400);
    } else {
      clearInterval(autoPlayRef.current);
    }
    return () => clearInterval(autoPlayRef.current);
  }, [isPlaying, analysis]);

  // Construct board instance at current ply
  const currentBoard = new Chess();
  if (analysis && analysis.analyzedMoves.length > 0) {
    const targetMove = analysis.analyzedMoves[currentPly];
    if (targetMove) {
      if (showAlternativeMove && targetMove.theoreticalMove) {
        // Load before move, then execute theoretical move
        try {
          currentBoard.load(targetMove.fenBefore);
          currentBoard.move(targetMove.theoreticalMove.san);
        } catch {
          currentBoard.load(targetMove.fenAfter);
        }
      } else {
        try {
          currentBoard.load(targetMove.fenAfter);
        } catch {}
      }
    }
  }

  const activeMove: AnalyzedMove | null =
    analysis && analysis.analyzedMoves[currentPly]
      ? analysis.analyzedMoves[currentPly]
      : null;

  // Filter mistakes list
  const mistakesList =
    analysis?.analyzedMoves.filter(
      (m) =>
        m.classification === "blunder" ||
        m.classification === "mistake" ||
        m.classification === "inaccuracy"
    ) || [];

  // Classification styling
  const getBadge = (c: MoveClassification) => {
    switch (c) {
      case "blunder":
        return {
          label: "Blunder (??)",
          style: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
        };
      case "mistake":
        return {
          label: "Mistake (?)",
          style: "bg-orange-500/20 text-orange-300 border-orange-500/40",
          icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />,
        };
      case "inaccuracy":
        return {
          label: "Inaccuracy (?!)",
          style: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          icon: <HelpCircle className="w-3.5 h-3.5 text-amber-400" />,
        };
      case "book":
        return {
          label: "Opening Book",
          style: "bg-sky-500/20 text-sky-300 border-sky-500/40",
          icon: <BookOpen className="w-3.5 h-3.5 text-sky-400" />,
        };
      case "best":
        return {
          label: "Theoretical Best",
          style: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      default:
        return {
          label: "Good Move",
          style: "bg-slate-800 text-slate-300 border-slate-700",
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  return (
    <div id="theory-section-container" className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Game Selection & Analysis Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Left: Source Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => {
              setSelectedSource("chesscom");
              if (recentGames[selectedGameIndex]?.pgn) {
                handleRunAnalysis(recentGames[selectedGameIndex].pgn);
              }
            }}
            className={`text-xs px-3 py-2 rounded-xl font-medium transition flex items-center gap-1.5 border whitespace-nowrap ${
              selectedSource === "chesscom"
                ? "bg-emerald-600/25 text-emerald-300 border-emerald-500/50 shadow-sm"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chess.com Games ({recentGames.length})</span>
          </button>

          {lastTrainingGamePgn && (
            <button
              onClick={() => {
                setSelectedSource("last_training");
                handleRunAnalysis(lastTrainingGamePgn);
              }}
              className={`text-xs px-3 py-2 rounded-xl font-medium transition flex items-center gap-1.5 border whitespace-nowrap ${
                selectedSource === "last_training"
                  ? "bg-emerald-600/25 text-emerald-300 border-emerald-500/50 shadow-sm"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Last Coach Match</span>
            </button>
          )}

          <button
            onClick={() => setSelectedSource("custom")}
            className={`text-xs px-3 py-2 rounded-xl font-medium transition flex items-center gap-1.5 border whitespace-nowrap ${
              selectedSource === "custom"
                ? "bg-emerald-600/25 text-emerald-300 border-emerald-500/50 shadow-sm"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Custom PGN</span>
          </button>
        </div>

        {/* Right: Quick Game Switcher or Custom PGN trigger */}
        <div className="flex items-center gap-2">
          {selectedSource === "chesscom" && recentGames.length > 0 && (
            <select
              value={selectedGameIndex}
              onChange={(e) => {
                const idx = parseInt(e.target.value, 10);
                setSelectedGameIndex(idx);
                if (recentGames[idx]?.pgn) {
                  handleRunAnalysis(recentGames[idx].pgn);
                }
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none max-w-[280px] truncate"
            >
              {recentGames.map((g, i) => (
                <option key={i} value={i}>
                  vs {g.white.username === connectedUsername ? g.black.username : g.white.username} (
                  {g.timeControl})
                </option>
              ))}
            </select>
          )}

          {onBackToGame && (
            <button
              onClick={onBackToGame}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl transition flex items-center gap-1 border border-slate-700"
            >
              <span>Back to Match</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Custom PGN Input Panel if selected */}
      {selectedSource === "custom" && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-400" />
              Paste PGN for Theory Diagnostics
            </span>
            <button
              onClick={() => handleRunAnalysis(samplePgn)}
              className="text-xs text-sky-400 hover:text-sky-300 underline"
            >
              Load Master Sample PGN
            </button>
          </div>
          <textarea
            value={customPgnInput}
            onChange={(e) => setCustomPgnInput(e.target.value)}
            placeholder="Paste your standard PGN notation here (e.g. 1. e4 c5 2. Nf3 d6...)"
            rows={4}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="flex justify-end">
            <button
              onClick={() => handleRunAnalysis(customPgnInput || samplePgn)}
              disabled={analyzing}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-md shadow-emerald-950"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{analyzing ? "Analyzing Theory..." : "Analyze Custom Game"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {analyzing && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="font-bold text-slate-100 text-sm">Engine Parsing Game & Opening Theory</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Classifying every move, identifying ECO book departures, calculating centipawn deltas,
            and formulating Grandmaster theory explanations alongside mistakes...
          </p>
        </div>
      )}

      {/* 2. Opening & Theory Diagnostics Overview */}
      {analysis && !analyzing && (
        <div
          id="theory-overview-banner"
          className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
        >
          {/* Header Row: Opening Title + ECO + Accuracy */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded">
                  {analysis.ecoCode}
                </span>
                <h2 className="text-lg font-bold text-slate-100">{analysis.openingName}</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {analysis.white.username} ({analysis.white.rating || 1200}) vs{" "}
                {analysis.black.username} ({analysis.black.rating || 1200}) • Result:{" "}
                <span className="font-semibold text-slate-200">{analysis.result}</span>
              </p>
            </div>

            {/* Accuracy Pill */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  White Acc
                </span>
                <span className="text-base font-mono font-black text-slate-200">
                  {analysis.summary.accuracyWhite}%
                </span>
              </div>
              <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Black Acc
                </span>
                <span className="text-base font-mono font-black text-slate-200">
                  {analysis.summary.accuracyBlack}%
                </span>
              </div>
            </div>
          </div>

          {/* Stat Badges: Blunders, Mistakes, Inaccuracies, Book Moves */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-rose-950/40 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 font-mono font-bold text-xs">
                ??
              </div>
              <div>
                <span className="text-xs font-bold text-rose-300 block">
                  {analysis.summary.blundersCount} Blunders
                </span>
                <span className="text-[10px] text-slate-500">Decisive Errors</span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-orange-950/40 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 font-mono font-bold text-xs">
                ?
              </div>
              <div>
                <span className="text-xs font-bold text-orange-300 block">
                  {analysis.summary.mistakesCount} Mistakes
                </span>
                <span className="text-[10px] text-slate-500">Tactical Losses</span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-amber-950/40 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono font-bold text-xs">
                ?!
              </div>
              <div>
                <span className="text-xs font-bold text-amber-300 block">
                  {analysis.summary.inaccuraciesCount} Inaccuracies
                </span>
                <span className="text-[10px] text-slate-500">Sub-Optimal</span>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-sky-950/40 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-sky-300 block">
                  {analysis.summary.bookMovesCount} Book Moves
                </span>
                <span className="text-[10px] text-slate-500">Theoretical Depth</span>
              </div>
            </div>
          </div>

          {/* Grandmaster Theory Summary Card */}
          <div className="bg-gradient-to-r from-sky-950/30 via-indigo-950/20 to-slate-950 border border-sky-500/20 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-300 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Opening Theory Diagnosis & Critical Turning Point</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed italic">
              "{analysis.summary.mainOpeningTheoryLesson}"
            </p>
          </div>
        </div>
      )}

      {/* 3. Main Interactive Board & Theory-Alongside-The-Move Stage */}
      {analysis && !analyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Center-Left: Chessboard & Navigation Controls */}
          <div className="lg:col-span-6 flex flex-col items-center space-y-4">
            <TheoryAnalysisBoard
              game={currentBoard}
              playerColor={boardOrientation}
              currentMove={activeMove}
              showTheoreticalArrow={true}
            />

            {/* Stepper & Playback Controls Bar */}
            <div className="w-full max-w-[480px] bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPly(0)}
                  disabled={currentPly === 0}
                  title="First Move"
                  className="p-2 text-slate-400 hover:text-slate-100 disabled:opacity-30 rounded-lg hover:bg-slate-800 transition"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPly((prev) => Math.max(0, prev - 1))}
                  disabled={currentPly === 0}
                  title="Previous Move"
                  className="p-2 text-slate-400 hover:text-slate-100 disabled:opacity-30 rounded-lg hover:bg-slate-800 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  title={isPlaying ? "Pause replay" : "Auto-play replay"}
                  className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-md shadow-emerald-950"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() =>
                    setCurrentPly((prev) => Math.min(analysis.analyzedMoves.length - 1, prev + 1))
                  }
                  disabled={currentPly >= analysis.analyzedMoves.length - 1}
                  title="Next Move"
                  className="p-2 text-slate-400 hover:text-slate-100 disabled:opacity-30 rounded-lg hover:bg-slate-800 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPly(analysis.analyzedMoves.length - 1)}
                  disabled={currentPly >= analysis.analyzedMoves.length - 1}
                  title="Last Move"
                  className="p-2 text-slate-400 hover:text-slate-100 disabled:opacity-30 rounded-lg hover:bg-slate-800 transition"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>

              {/* Board Flip */}
              <button
                onClick={() =>
                  setBoardOrientation((prev) => (prev === "white" ? "black" : "white"))
                }
                className="text-xs text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800 transition flex items-center gap-1.5"
                title="Flip board perspective"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flip ({boardOrientation})</span>
              </button>
            </div>
          </div>

          {/* Right: The Theory Breakdown Alongside The Move */}
          <div className="lg:col-span-6 space-y-4">
            {activeMove ? (
              <div
                id="theory-breakdown-card"
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
              >
                {/* Header: Move Played vs Theoretical Move */}
                <div className="border-b border-slate-800 pb-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                      Move {activeMove.moveNumber} • {activeMove.color === "w" ? "White" : "Black"}
                    </span>
                    {activeMove.principleTag && (
                      <span className="text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                        {activeMove.principleTag}
                      </span>
                    )}
                  </div>

                  {/* Big Move Comparison Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">Move Played</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-mono font-black text-slate-100">
                          {activeMove.san}
                        </span>
                        {(() => {
                          const b = getBadge(activeMove.classification);
                          return (
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border flex items-center gap-1 ${b.style}`}
                            >
                              {b.icon}
                              <span>{b.label}</span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {activeMove.theoreticalMove && (
                      <div>
                        <span className="text-[10px] text-emerald-400 font-semibold block mb-0.5">
                          Theoretical Best Move
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-mono font-black text-emerald-400">
                            {activeMove.theoreticalMove.san}!
                          </span>
                          <button
                            onClick={() => setShowAlternativeMove(!showAlternativeMove)}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition ${
                              showAlternativeMove
                                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md"
                                : "bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50"
                            }`}
                          >
                            {showAlternativeMove ? "Viewing Best Move" : "Show on Board"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specific Theory of Where You Were Wrong */}
                {activeMove.whyWrong ? (
                  <div className="bg-rose-950/20 border border-rose-600/30 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300 uppercase tracking-wider">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Theory of Where You Were Wrong</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {activeMove.whyWrong}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sound Theoretical Execution
                    </span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {activeMove.classification === "book"
                        ? `Matches established theoretical book line in the ${activeMove.openingName || analysis.openingName}.`
                        : "Accurate continuation that preserves piece harmony and central pressure."}
                    </p>
                  </div>
                )}

                {/* Grandmaster Theoretical Recommendation */}
                {activeMove.whyTheoreticalBest && (
                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>The Theoretical Remedy & Plan</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {activeMove.whyTheoreticalBest}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
                Select a move to see the theory analysis.
              </div>
            )}

            {/* 4. Quick-Jump Mistakes & Theory Errors Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                  Jump to Critical Mistakes ({mistakesList.length})
                </span>
                <button
                  onClick={() => setMistakesOnlyFilter(!mistakesOnlyFilter)}
                  className={`text-[11px] px-2 py-0.5 rounded border transition ${
                    mistakesOnlyFilter
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                  }`}
                >
                  {mistakesOnlyFilter ? "Showing Errors Only" : "Show All Moves"}
                </button>
              </div>

              {/* Chips for jumping straight to mistakes */}
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {(mistakesOnlyFilter ? mistakesList : analysis.analyzedMoves).map((m) => {
                  const isCurrent = m.ply === currentPly;
                  const isMistake =
                    m.classification === "blunder" ||
                    m.classification === "mistake" ||
                    m.classification === "inaccuracy";

                  let btnColor = "bg-slate-950 text-slate-400 border-slate-800";
                  if (m.classification === "blunder") {
                    btnColor = "bg-rose-950/40 text-rose-300 border-rose-800/50";
                  } else if (m.classification === "mistake") {
                    btnColor = "bg-orange-950/40 text-orange-300 border-orange-800/50";
                  } else if (m.classification === "inaccuracy") {
                    btnColor = "bg-amber-950/40 text-amber-300 border-amber-800/50";
                  } else if (m.classification === "book") {
                    btnColor = "bg-sky-950/30 text-sky-300 border-sky-800/40";
                  }

                  if (isCurrent) {
                    btnColor = "ring-2 ring-emerald-400 ring-offset-1 ring-offset-slate-900 font-bold";
                  }

                  return (
                    <button
                      key={m.ply}
                      onClick={() => {
                        setCurrentPly(m.ply);
                        setShowAlternativeMove(false);
                      }}
                      className={`text-xs font-mono px-2 py-1 rounded-lg border transition ${btnColor}`}
                    >
                      {m.color === "w" ? `${m.moveNumber}.` : `${m.moveNumber}...`} {m.san}
                      {m.classification === "blunder"
                        ? "??"
                        : m.classification === "mistake"
                        ? "?"
                        : m.classification === "inaccuracy"
                        ? "?!"
                        : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
