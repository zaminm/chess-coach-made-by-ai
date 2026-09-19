import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chess, Square, Move } from "chess.js";
import {
  ChessComPlayer,
  ChessComStats,
  HabitsAnalysis,
  CoachDiagnosis,
  DailyStreakData,
  AdaptiveStyle,
} from "./types";
import { Header } from "./components/Header";
import { ChessBoard } from "./components/ChessBoard";
import { ConnectModal } from "./components/ConnectModal";
import { DailyStreakTracker } from "./components/DailyStreakTracker";
import { AdaptiveHabitsCard } from "./components/AdaptiveHabitsCard";
import { GameControls } from "./components/GameControls";
import { PostGameModal } from "./components/PostGameModal";
import { TheorySection } from "./components/TheorySection";
import { soundManager } from "./lib/sound";
import { getCoachMove } from "./lib/chessEngine";

export default function App() {
  // 1. Account & Habit State
  const [activeTab, setActiveTab] = useState<"game" | "theory">("game");
  const [player, setPlayer] = useState<ChessComPlayer | null>(null);
  const [stats, setStats] = useState<ChessComStats | null>(null);
  const [habits, setHabits] = useState<HabitsAnalysis | null>(null);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [diagnosis, setDiagnosis] = useState<CoachDiagnosis | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  // 2. Daily Streak & Reminder State ("Checked Days")
  const [streakData, setStreakData] = useState<DailyStreakData>(() => {
    try {
      const saved = localStorage.getItem("gm_chess_streak");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      checkedDays: [],
      currentStreak: 0,
      bestStreak: 0,
      lastPlayedDate: null,
      reminderEnabled: true,
      reminderTime: "18:00",
    };
  });

  // 3. Elo & Adaptive Style State
  const [coachElo, setCoachElo] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("gm_chess_coach_elo");
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 1250;
  });

  const [activeStyle, setActiveStyle] = useState<AdaptiveStyle>("gambit_stress");
  const [coachLiveComment, setCoachLiveComment] = useState<string | null>(null);

  // 4. Interactive Chess Game State
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [isCoachThinking, setIsCoachThinking] = useState(false);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [moveHistory, setMoveHistory] = useState<{ white: string; black?: string }[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hintLoading, setHintLoading] = useState(false);

  // 5. Post-Game Modal State
  const [postGameModalOpen, setPostGameModalOpen] = useState(false);
  const [postGameResult, setPostGameResult] = useState<"player_win" | "coach_win" | "draw">("player_win");
  const [eloDelta, setEloDelta] = useState(0);
  const [coachEloBefore, setCoachEloBefore] = useState(1250);
  const [postGameReview, setPostGameReview] = useState<{
    summary: string;
    keyLesson: string;
    adaptationNote: string;
  } | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];
  const isCheckedToday = streakData.checkedDays.includes(todayStr);

  // Check saved profile on mount or open ConnectModal if first time
  useEffect(() => {
    try {
      const savedPlayer = localStorage.getItem("gm_chess_player");
      const savedStats = localStorage.getItem("gm_chess_stats");
      const savedHabits = localStorage.getItem("gm_chess_habits");
      const savedDiagnosis = localStorage.getItem("gm_chess_diagnosis");

      if (savedPlayer && savedStats && savedHabits) {
        setPlayer(JSON.parse(savedPlayer));
        setStats(JSON.parse(savedStats));
        setHabits(JSON.parse(savedHabits));
        if (savedDiagnosis) setDiagnosis(JSON.parse(savedDiagnosis));
        const savedGames = localStorage.getItem("gm_chess_recent_games");
        if (savedGames) setRecentGames(JSON.parse(savedGames));
      } else {
        // Requirement 1: "When i open it, it should ask me to connect with my chess.com account."
        setIsConnectModalOpen(true);
      }
    } catch {
      setIsConnectModalOpen(true);
    }
  }, []);

  // Save streak and Elo to localStorage
  useEffect(() => {
    localStorage.setItem("gm_chess_streak", JSON.stringify(streakData));
  }, [streakData]);

  useEffect(() => {
    localStorage.setItem("gm_chess_coach_elo", coachElo.toString());
  }, [coachElo]);

  // Handle Account Connection
  const handleConnected = async (
    newPlayer: ChessComPlayer,
    newStats: ChessComStats,
    newHabits: HabitsAnalysis,
    games: any[]
  ) => {
    setPlayer(newPlayer);
    setStats(newStats);
    setHabits(newHabits);
    setRecentGames(games);

    localStorage.setItem("gm_chess_player", JSON.stringify(newPlayer));
    localStorage.setItem("gm_chess_stats", JSON.stringify(newStats));
    localStorage.setItem("gm_chess_habits", JSON.stringify(newHabits));
    localStorage.setItem("gm_chess_recent_games", JSON.stringify(games));

    // Peg initial Coach Elo to user's rating + 25
    const initialCoachElo = Math.max(newHabits.recommendedCoachElo, 1000);
    setCoachElo(initialCoachElo);
    localStorage.setItem("gm_chess_coach_elo", initialCoachElo.toString());

    // Auto-select initial adaptive style based on habits
    if (newHabits.topWhiteOpening.includes("1. e4") && newHabits.topBlackDefense.includes("Open Game")) {
      setActiveStyle("anti_open_grind");
    } else if (newHabits.topWhiteOpening.includes("1. d4") || newHabits.topBlackDefense.includes("Caro-Kann")) {
      setActiveStyle("gambit_stress");
    } else {
      setActiveStyle("endgame_squeeze");
    }

    // Call server to generate Gemini Grandmaster Diagnosis
    try {
      const diagRes = await fetch("/api/coach/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newPlayer.username,
          stats: newStats,
          habits: newHabits,
          recentGames: games,
        }),
      });
      if (diagRes.ok) {
        const diagData = await diagRes.json();
        setDiagnosis(diagData);
        localStorage.setItem("gm_chess_diagnosis", JSON.stringify(diagData));
        if (diagData.coachQuote) {
          setCoachLiveComment(diagData.coachQuote);
        }
      }
    } catch (e) {
      console.warn("Could not fetch diagnosis:", e);
    }
  };

  // Re-sync Move History list
  const updateMoveHistoryList = (currentGame: Chess) => {
    const history = currentGame.history();
    const pairs: { white: string; black?: string }[] = [];
    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        white: history[i],
        black: history[i + 1],
      });
    }
    setMoveHistory(pairs);
  };

  // Trigger Coach Response Move
  const makeCoachMove = useCallback(
    async (currentGame: Chess) => {
      if (currentGame.isGameOver()) return;

      setIsCoachThinking(true);

      // Brief thinking delay for realistic human feel (350ms - 800ms)
      await new Promise((resolve) => setTimeout(resolve, 450));

      const moveNumber = Math.ceil(currentGame.history().length / 2);
      const engineRes = getCoachMove(currentGame, coachElo, activeStyle, moveNumber);

      if (engineRes.bestMove) {
        const moveResult = currentGame.move(engineRes.bestMove);
        if (moveResult) {
          // Play sound
          if (moveResult.captured) {
            soundManager.playCapture();
          } else {
            soundManager.playMove();
          }

          if (currentGame.inCheck()) {
            soundManager.playCheck();
          }

          setLastMove({ from: moveResult.from as Square, to: moveResult.to as Square });
          setGame(new Chess(currentGame.fen()));
          updateMoveHistoryList(currentGame);

          // Trigger Live Coach Commentary periodically
          if (engineRes.coachComment) {
            setCoachLiveComment(engineRes.coachComment);
          } else if (moveNumber % 4 === 0 || currentGame.inCheck()) {
            fetchLiveCommentary(currentGame, moveResult.san, moveNumber);
          }
        }
      }

      setIsCoachThinking(false);

      // Check if game ended after coach move
      if (currentGame.isGameOver()) {
        handleGameOver(currentGame);
      }
    },
    [coachElo, activeStyle]
  );

  // Fetch AI Live commentary
  const fetchLiveCommentary = async (currentGame: Chess, lastMoveSan: string, moveNum: number) => {
    try {
      const res = await fetch("/api/coach/commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fen: currentGame.fen(),
          lastMove: lastMoveSan,
          playerColor,
          moveNumber: moveNum,
          coachElo,
          comfortZone: habits?.comfortZoneLabel,
          evaluation: currentGame.inCheck() ? "Check!" : "Middle-game fight",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.comment) setCoachLiveComment(data.comment);
      }
    } catch {
      // ignore
    }
  };

  // Handle Player Move
  const handlePlayerMove = (from: Square, to: Square, promotion?: string): boolean => {
    if (isCoachThinking || game.isGameOver()) return false;

    try {
      const move = game.move({
        from,
        to,
        promotion: promotion || "q",
      });

      if (!move) return false;

      // Play Move Sound
      if (move.captured) {
        soundManager.playCapture();
      } else {
        soundManager.playMove();
      }

      if (game.inCheck()) {
        soundManager.playCheck();
      }

      setLastMove({ from, to });
      const newGameInstance = new Chess(game.fen());
      setGame(newGameInstance);
      updateMoveHistoryList(newGameInstance);

      // Check game over
      if (newGameInstance.isGameOver()) {
        handleGameOver(newGameInstance);
      } else {
        // Coach turn
        setTimeout(() => {
          makeCoachMove(newGameInstance);
        }, 200);
      }

      return true;
    } catch {
      return false;
    }
  };

  // Handle Game Over: Mark Checked Day & Gradually Scale Elo
  const handleGameOver = async (finalGame: Chess) => {
    let result: "player_win" | "coach_win" | "draw" = "draw";

    if (finalGame.isCheckmate()) {
      // The side whose turn it is got mated
      const turn = finalGame.turn();
      const playerTurn = playerColor === "white" ? "w" : "b";
      result = turn === playerTurn ? "coach_win" : "player_win";
    } else if (finalGame.isDraw()) {
      result = "draw";
    }

    if (result === "player_win") {
      soundManager.playVictory();
    } else {
      soundManager.playDefeat();
    }

    // 1. Mark Checked Day for Today (Requirement 3)
    const today = new Date().toISOString().split("T")[0];
    const isNewCheck = !streakData.checkedDays.includes(today);
    const updatedCheckedDays = isNewCheck ? [...streakData.checkedDays, today] : streakData.checkedDays;
    const newStreak = isNewCheck ? streakData.currentStreak + 1 : streakData.currentStreak;
    const newBest = Math.max(newStreak, streakData.bestStreak);

    setStreakData({
      ...streakData,
      checkedDays: updatedCheckedDays,
      currentStreak: newStreak,
      bestStreak: newBest,
      lastPlayedDate: today,
    });

    // 2. Gradually Increase Elo (Requirement 5)
    let delta = 0;
    if (result === "player_win") {
      delta = 25; // Coach scales up to challenge the improving player
    } else if (result === "draw") {
      delta = 10;
    } else {
      delta = 5; // Coach maintains or slightly tests
    }

    const previousElo = coachElo;
    const newElo = previousElo + delta;
    setCoachElo(newElo);
    setCoachEloBefore(previousElo);
    setEloDelta(delta);
    setPostGameResult(result);

    // 3. Post-Game AI Debrief
    try {
      const revRes = await fetch("/api/coach/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameResult: result,
          movesCount: finalGame.history().length,
          pgn: finalGame.pgn(),
          playerColor,
          currentCoachElo: previousElo,
          comfortZone: habits?.comfortZoneLabel || "General",
        }),
      });

      if (revRes.ok) {
        const revData = await revRes.json();
        setPostGameReview(revData);
      }
    } catch {
      setPostGameReview(null);
    }

    setPostGameModalOpen(true);
  };

  // Start New Game
  const handleNewGame = () => {
    const newG = new Chess();
    setGame(newG);
    setLastMove(null);
    setMoveHistory([]);
    setPostGameModalOpen(false);

    // If player is Black, Coach plays first move as White
    if (playerColor === "black") {
      setTimeout(() => {
        makeCoachMove(newG);
      }, 300);
    }
  };

  // Flip board perspective
  const handleFlipBoard = () => {
    const nextColor = playerColor === "white" ? "black" : "white";
    setPlayerColor(nextColor);

    const newG = new Chess();
    setGame(newG);
    setLastMove(null);
    setMoveHistory([]);

    if (nextColor === "black") {
      setTimeout(() => {
        makeCoachMove(newG);
      }, 300);
    }
  };

  // Resign
  const handleResign = () => {
    if (game.isGameOver()) return;
    handleGameOver(game);
  };

  // Draw Offer
  const handleOfferDraw = () => {
    if (game.isGameOver()) return;
    setPostGameResult("draw");
    handleGameOver(game);
  };

  // Request Coach Tactical Hint
  const handleRequestHint = async () => {
    if (hintLoading || game.isGameOver()) return;
    setHintLoading(true);

    try {
      const bestMoveRes = getCoachMove(game, 2000, activeStyle, 10);
      if (bestMoveRes.bestMove) {
        setCoachLiveComment(
          `Grandmaster Hint: Consider examining ${bestMoveRes.bestMove.san}. Look for piece harmony and control of open lines!`
        );
      }
    } finally {
      setHintLoading(false);
    }
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setEnabled(next);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Global Navigation Header */}
      <Header
        player={player}
        stats={stats}
        coachElo={coachElo}
        currentStreak={streakData.currentStreak}
        isCheckedToday={isCheckedToday}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* 2. Main Workspace: Switch between Training Game and Theory Section */}
      {activeTab === "theory" ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
          <TheorySection
            recentGames={recentGames}
            lastTrainingGamePgn={game.history().length > 0 ? game.pgn() : null}
            connectedUsername={player?.username || null}
            onBackToGame={() => setActiveTab("game")}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Habits & Daily Streak Reminders */}
          <aside className="lg:col-span-4 space-y-5 order-2 lg:order-1">
            {/* Daily Streak & Reminder Banner (Requirement 3) */}
            <DailyStreakTracker
              streakData={streakData}
              onToggleReminder={() => {
                setStreakData({ ...streakData, reminderEnabled: !streakData.reminderEnabled });
              }}
              onStartTraining={handleNewGame}
              isGameActive={!game.isGameOver() && game.history().length > 0}
            />

            {/* Adaptive Habits & Coach Profile (Requirements 2, 4, 5) */}
            <AdaptiveHabitsCard
              habits={habits}
              diagnosis={diagnosis}
              currentCoachElo={coachElo}
              activeStyle={activeStyle}
              onChangeStyle={(style) => setActiveStyle(style)}
              coachLiveComment={coachLiveComment}
            />
          </aside>

          {/* Center Column: Interactive Chess Board */}
          <section className="lg:col-span-5 flex flex-col items-center order-1 lg:order-2">
            <ChessBoard
              game={game}
              playerColor={playerColor}
              isCoachThinking={isCoachThinking}
              onPlayerMove={handlePlayerMove}
              lastMove={lastMove}
            />
          </section>

          {/* Right Column: Move History & Game Controls */}
          <aside className="lg:col-span-3 space-y-4 order-3">
            <GameControls
              game={game}
              moveHistory={moveHistory}
              isCoachThinking={isCoachThinking}
              playerColor={playerColor}
              onNewGame={handleNewGame}
              onResign={handleResign}
              onOfferDraw={handleOfferDraw}
              onFlipBoard={handleFlipBoard}
              onRequestHint={handleRequestHint}
              hintLoading={hintLoading}
            />
          </aside>
        </main>
      )}

      {/* Connect Modal (Requirement 1) */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        canClose={Boolean(player)}
        onClose={() => setIsConnectModalOpen(false)}
        onConnected={handleConnected}
      />

      {/* Post-Game Modal: Checked Day Celebration & Elo Progression (Requirements 3, 5) */}
      <PostGameModal
        isOpen={postGameModalOpen}
        result={postGameResult}
        movesCount={game.history().length}
        coachEloBefore={coachEloBefore}
        coachEloAfter={coachElo}
        eloDelta={eloDelta}
        todayIsChecked={isCheckedToday}
        streakCount={streakData.currentStreak}
        reviewData={postGameReview}
        onNewGame={handleNewGame}
        onClose={() => setPostGameModalOpen(false)}
        onAnalyzeTheory={() => {
          setPostGameModalOpen(false);
          setActiveTab("theory");
        }}
      />
    </div>
  );
}
