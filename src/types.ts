export interface ChessComPlayer {
  username: string;
  name?: string;
  avatar?: string;
  title?: string | null;
  country?: string;
  joined?: number;
  status?: string;
  url?: string;
}

export interface ChessComStats {
  rapid: number;
  blitz: number;
  bullet: number;
  rapidRecord?: { win: number; loss: number; draw: number } | null;
  blitzRecord?: { win: number; loss: number; draw: number } | null;
}

export interface HabitsAnalysis {
  gamesAnalyzed: number;
  whiteWinRate: number;
  blackWinRate: number;
  topWhiteOpening: string;
  topBlackDefense: string;
  comfortZoneLabel: string;
  tendency: string;
  antiComfortStrategy: string;
  effectiveRating: number;
  recommendedCoachElo: number;
}

export interface CoachDiagnosis {
  coachName: string;
  coachTitle: string;
  comfortZoneSummary: string;
  habitsDiagnosis: string[];
  antiComfortRegimen: {
    headline: string;
    description: string;
    tacticsToEnforce: string[];
  };
  coachQuote: string;
  targetStartingElo: number;
}

export interface DailyStreakData {
  checkedDays: string[]; // ISO date strings e.g. "2026-09-18"
  currentStreak: number;
  bestStreak: number;
  lastPlayedDate: string | null;
  reminderEnabled: boolean;
  reminderTime: string; // "18:00"
}

export type AdaptiveStyle =
  | "anti_open_grind"
  | "gambit_stress"
  | "endgame_squeeze"
  | "prophylaxis_strangle"
  | "tactical_blitz";

export interface GameRecord {
  id: string;
  date: string;
  result: "player_win" | "coach_win" | "draw";
  movesCount: number;
  coachEloAtStart: number;
  coachEloAtEnd: number;
  playerColor: "white" | "black";
  pgn: string;
  lesson: string;
}

export type MoveClassification =
  | "book"
  | "best"
  | "excellent"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder"
  | "missed_win";

export interface AnalyzedMove {
  ply: number;
  moveNumber: number;
  color: "w" | "b";
  san: string;
  from: string;
  to: string;
  fenBefore: string;
  fenAfter: string;
  classification: MoveClassification;
  evalBefore: number; // in centipawns or pawns
  evalAfter: number;
  evalDelta: number; // loss in eval
  theoreticalMove?: {
    san: string;
    from: string;
    to: string;
  };
  theoryExplanation?: string;
  whyWrong?: string;
  whyTheoreticalBest?: string;
  principleTag?: string;
  openingName?: string;
}

export interface GameTheoryAnalysis {
  id: string;
  openingName: string;
  ecoCode: string;
  white: { username: string; rating?: number };
  black: { username: string; rating?: number };
  result: string;
  date?: string;
  movesCount: number;
  analyzedMoves: AnalyzedMove[];
  summary: {
    accuracyWhite: number;
    accuracyBlack: number;
    blundersCount: number;
    mistakesCount: number;
    inaccuraciesCount: number;
    bookMovesCount: number;
    mainOpeningTheoryLesson: string;
    criticalMomentSummary: string;
  };
}

export interface RecentChessComGame {
  url: string;
  timeControl: string;
  white: { username: string; rating: number; result: string };
  black: { username: string; rating: number; result: string };
  rules: string;
  endTime: number;
  pgn: string;
}
