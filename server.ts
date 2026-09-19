import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily / safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.warn("Failed to initialize Gemini client:", err);
    }
  }
  return aiClient;
}

// Chess.com API User-Agent header (required by Chess.com API TOS)
const CHESS_COM_HEADERS = {
  "User-Agent": "GrandmasterAI-ChessCoach/1.0 (contact: chesscoach-app@example.com)",
  Accept: "application/json",
};

// API: Check Health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", geminiReady: Boolean(process.env.GEMINI_API_KEY) });
});

// API: Connect & Fetch Chess.com Account Data
app.get("/api/chesscom/profile/:username", async (req, res) => {
  const username = req.params.username.trim().toLowerCase();
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    // 1. Fetch Profile
    const profileRes = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username)}`, {
      headers: CHESS_COM_HEADERS,
    });

    if (!profileRes.ok) {
      if (profileRes.status === 404) {
        return res.status(404).json({ error: `Chess.com user "${username}" not found.` });
      }
      throw new Error(`Chess.com profile responded with status ${profileRes.status}`);
    }

    const profileData = await profileRes.json();

    // 2. Fetch Stats (Ratings for Rapid, Blitz, Bullet)
    let statsData: any = {};
    try {
      const statsRes = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username)}/stats`, {
        headers: CHESS_COM_HEADERS,
      });
      if (statsRes.ok) {
        statsData = await statsRes.json();
      }
    } catch (e) {
      console.warn("Failed to fetch stats:", e);
    }

    // 3. Fetch Recent Games Archive
    let games: any[] = [];
    try {
      const archivesRes = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`, {
        headers: CHESS_COM_HEADERS,
      });
      if (archivesRes.ok) {
        const archivesData = await archivesRes.json();
        const archiveList: string[] = archivesData.archives || [];
        if (archiveList.length > 0) {
          // Fetch the most recent month
          const latestArchiveUrl = archiveList[archiveList.length - 1];
          const gamesRes = await fetch(latestArchiveUrl, { headers: CHESS_COM_HEADERS });
          if (gamesRes.ok) {
            const monthData = await gamesRes.json();
            games = (monthData.games || []).slice(-30); // take up to 30 recent games
          }
        }
      }
    } catch (e) {
      console.warn("Failed to fetch games archives:", e);
    }

    // 4. Extract habits & metrics from game data
    const habits = analyzeHabitsFromGames(username, games, statsData);

    return res.json({
      player: {
        username: profileData.username,
        name: profileData.name || profileData.username,
        avatar: profileData.avatar || "",
        title: profileData.title || null,
        country: profileData.country || "",
        joined: profileData.joined,
        status: profileData.status || "basic",
        url: profileData.url,
      },
      stats: {
        rapid: statsData.chess_rapid?.last?.rating || statsData.chess_rapid?.best?.rating || 1200,
        blitz: statsData.chess_blitz?.last?.rating || statsData.chess_blitz?.best?.rating || 1150,
        bullet: statsData.chess_bullet?.last?.rating || statsData.chess_bullet?.best?.rating || 1100,
        rapidRecord: statsData.chess_rapid?.record || null,
        blitzRecord: statsData.chess_blitz?.record || null,
      },
      gamesCount: games.length,
      recentGames: games.slice(-15).map((g) => ({
        url: g.url,
        timeControl: g.time_control,
        white: { username: g.white.username, rating: g.white.rating, result: g.white.result },
        black: { username: g.black.username, rating: g.black.rating, result: g.black.result },
        rules: g.rules,
        endTime: g.end_time,
        pgn: g.pgn || "",
      })),
      habits,
    });
  } catch (error: any) {
    console.error("Error connecting Chess.com account:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch Chess.com player data." });
  }
});

// Helper to inspect openings and habits from raw Chess.com games
function analyzeHabitsFromGames(username: string, games: any[], statsData: any) {
  const userLower = username.toLowerCase();
  let whiteCount = 0;
  let blackCount = 0;
  let whiteWins = 0;
  let blackWins = 0;
  const openingsAsWhite: Record<string, number> = {};
  const responsesAsBlack: Record<string, number> = {};

  games.forEach((game) => {
    const isWhite = game.white?.username?.toLowerCase() === userLower;
    const isBlack = game.black?.username?.toLowerCase() === userLower;
    const pgn = game.pgn || "";

    if (isWhite) {
      whiteCount++;
      if (game.white?.result === "win") whiteWins++;
      // Check first move
      if (pgn.includes("1. e4") || pgn.includes("1.e4")) {
        openingsAsWhite["1. e4 (King's Pawn)"] = (openingsAsWhite["1. e4 (King's Pawn)"] || 0) + 1;
      } else if (pgn.includes("1. d4") || pgn.includes("1.d4")) {
        openingsAsWhite["1. d4 (Queen's Pawn)"] = (openingsAsWhite["1. d4 (Queen's Pawn)"] || 0) + 1;
      } else if (pgn.includes("1. c4") || pgn.includes("1.c4")) {
        openingsAsWhite["1. c4 (English)"] = (openingsAsWhite["1. c4 (English)"] || 0) + 1;
      } else if (pgn.includes("1. Nf3") || pgn.includes("1.Nf3")) {
        openingsAsWhite["1. Nf3 (Reti/Flank)"] = (openingsAsWhite["1. Nf3 (Reti/Flank)"] || 0) + 1;
      } else {
        openingsAsWhite["Other Variations"] = (openingsAsWhite["Other Variations"] || 0) + 1;
      }
    } else if (isBlack) {
      blackCount++;
      if (game.black?.result === "win") blackWins++;
      if (pgn.includes("1. e4 c5") || pgn.includes("1.e4 c5")) {
        responsesAsBlack["Sicilian Defense"] = (responsesAsBlack["Sicilian Defense"] || 0) + 1;
      } else if (pgn.includes("1. e4 e5") || pgn.includes("1.e4 e5")) {
        responsesAsBlack["Open Game (1...e5)"] = (responsesAsBlack["Open Game (1...e5)"] || 0) + 1;
      } else if (pgn.includes("1. e4 c6") || pgn.includes("1.e4 c6")) {
        responsesAsBlack["Caro-Kann Defense"] = (responsesAsBlack["Caro-Kann Defense"] || 0) + 1;
      } else if (pgn.includes("1. e4 e6") || pgn.includes("1.e4 e6")) {
        responsesAsBlack["French Defense"] = (responsesAsBlack["French Defense"] || 0) + 1;
      } else if (pgn.includes("1. d4 Nf6") || pgn.includes("1.d4 Nf6")) {
        responsesAsBlack["Indian Defenses"] = (responsesAsBlack["Indian Defenses"] || 0) + 1;
      } else if (pgn.includes("1. d4 d5") || pgn.includes("1.d4 d5")) {
        responsesAsBlack["Classical (1...d5)"] = (responsesAsBlack["Classical (1...d5)"] || 0) + 1;
      } else {
        responsesAsBlack["Flexible Defenses"] = (responsesAsBlack["Flexible Defenses"] || 0) + 1;
      }
    }
  });

  // Calculate predominant opening
  const topWhiteOpening = Object.entries(openingsAsWhite).sort((a, b) => b[1] - a[1])[0]?.[0] || "1. e4 (King's Pawn)";
  const topBlackDefense = Object.entries(responsesAsBlack).sort((a, b) => b[1] - a[1])[0]?.[0] || "Open Game (1...e5)";

  const rapidRating = statsData.chess_rapid?.last?.rating || 1200;
  const blitzRating = statsData.chess_blitz?.last?.rating || 1150;
  const effectiveRating = Math.max(rapidRating, blitzRating);

  // Formulate anti-comfort recommendation
  let antiComfortStrategy = "";
  let comfortZoneLabel = "";
  let tendency = "";

  if (topWhiteOpening.includes("1. e4") && topBlackDefense.includes("Open Game")) {
    comfortZoneLabel = "Classical Open Positions Lover";
    tendency = "Relies heavily on open tactical skirmishes and early central pawn clashes.";
    antiComfortStrategy = "Strict Prophylactic & Closed Structures: Force asymmetrical pawn chains (e.g. French / Closed Sicilian / King's Indian structures) to test patience, maneuvering, and endgame piece activity.";
  } else if (topWhiteOpening.includes("1. d4") || topBlackDefense.includes("Caro-Kann")) {
    comfortZoneLabel = "Solid Positional Grinder";
    tendency = "Prefers safe, solid pawn structures and dislikes sudden tactical mayhem.";
    antiComfortStrategy = "Sharp Gambit & Tactical Stress Test: Play razor-sharp gambits (e.g. Evans Gambit, King's Gambit, Sicilian Dragon) to stress-test your tactical calculation under fire.";
  } else if (topBlackDefense.includes("Sicilian")) {
    comfortZoneLabel = "Counter-Puncher";
    tendency = "Comfortable defending with imbalances but can be provoked into premature counter-attacks.";
    antiComfortStrategy = "Positional Squeeze & Heavy Piece Clamp: Lock down your counterplay avenues and force you to defend passive endgames without quick tactical rescues.";
  } else {
    comfortZoneLabel = "Flexible Generalist";
    tendency = "Switches openings frequently but can suffer from lack of deep endgame discipline.";
    antiComfortStrategy = "Dynamic Asymmetry: Alternating sharp gambits with technical pawn endgames to expose positional blindspots.";
  }

  return {
    gamesAnalyzed: games.length,
    whiteWinRate: whiteCount > 0 ? Math.round((whiteWins / whiteCount) * 100) : 50,
    blackWinRate: blackCount > 0 ? Math.round((blackWins / blackCount) * 100) : 50,
    topWhiteOpening,
    topBlackDefense,
    comfortZoneLabel,
    tendency,
    antiComfortStrategy,
    effectiveRating,
    recommendedCoachElo: effectiveRating + 25, // Start Coach slightly higher to challenge
  };
}

// API: Gemini-Powered Deep Coach Diagnosis & Adaptive Regimen
app.post("/api/coach/diagnose", async (req, res) => {
  const { username, stats, habits, recentGames } = req.body;

  const fallbackDiagnosis = {
    coachName: "Grandmaster Alexander",
    coachTitle: "Adaptive Chess Master & Tactical Strategist",
    comfortZoneSummary: habits?.comfortZoneLabel || "Habitual Openings Comfort Zone",
    habitsDiagnosis: [
      `Heavy reliance on ${habits?.topWhiteOpening || "1. e4"} when playing White.`,
      `Prefers predictable pawn structures in ${habits?.topBlackDefense || "symmetrical lines"}.`,
      "Tendency to seek immediate tactical relief rather than enduring uncomfortable pawn binds.",
      "Vulnerable to relentless flank attacks when central files are closed.",
    ],
    antiComfortRegimen: {
      headline: "Anti-Comfort Directive: Anti-Symmetry & Tactical Rigor",
      description: habits?.antiComfortStrategy || "Stress-test the player by rejecting standard symmetrical play.",
      tacticsToEnforce: [
        "Play unorthodox gambits against their favorite setups",
        "Refuse easy queen exchanges",
        "Target uncastled kings and overextended pawns",
      ],
    },
    coachQuote: `I have thoroughly analyzed your Chess.com games, ${username}. You play well when comfortable, but champions are forged in chaos. I will not let you sleepwalk through your usual routines today.`,
    targetStartingElo: habits?.recommendedCoachElo || 1250,
  };

  const ai = getGeminiClient();
  if (!ai) {
    return res.json(fallbackDiagnosis);
  }

  try {
    const prompt = `You are an elite, insightful, and slightly provocative Grandmaster Chess Coach.
The student has connected their Chess.com account:
- Username: ${username}
- Current Ratings: Rapid ${stats?.rapid || 1200}, Blitz ${stats?.blitz || 1150}
- Win Rates: White ${habits?.whiteWinRate || 50}%, Black ${habits?.blackWinRate || 50}%
- Preferred White Opening: ${habits?.topWhiteOpening || "1. e4"}
- Preferred Black Defense: ${habits?.topBlackDefense || "1...e5"}
- Identified Comfort Zone: ${habits?.comfortZoneLabel} (${habits?.tendency})
- Recent game samples: ${JSON.stringify(recentGames?.slice(0, 5) || [])}

Analyze their habits. Design an adaptive coaching regimen whose primary goal is: "DO NOT let the player rest in their comfort zone. Force them to confront their weaknesses, adapt their playing style, and level up their Elo."

Respond in valid JSON matching this exact structure:
{
  "coachName": "Grandmaster Alexander",
  "coachTitle": "Adaptive Chess Master & Tactical Strategist",
  "comfortZoneSummary": "string summary of what they over-rely on",
  "habitsDiagnosis": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
  "antiComfortRegimen": {
    "headline": "Directive title",
    "description": "How the coach will adaptively play to break their habits",
    "tacticsToEnforce": ["tactic 1", "tactic 2", "tactic 3"]
  },
  "coachQuote": "Personalized 2-sentence direct quote from the coach addressing the student directly.",
  "targetStartingElo": ${habits?.recommendedCoachElo || 1250}
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are an expert International Grandmaster chess trainer who diagnoses amateur habits from Chess.com game archives and creates rigorous adaptive training plans.",
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    }
    return res.json(fallbackDiagnosis);
  } catch (err: any) {
    console.warn("Gemini diagnosis fallback:", err.message);
    return res.json(fallbackDiagnosis);
  }
});

// API: Live In-Game Coach Commentary / Feedback
app.post("/api/coach/commentary", async (req, res) => {
  const { fen, lastMove, playerColor, moveNumber, coachElo, comfortZone, evaluation } = req.body;

  const fallbackQuotes = [
    `Interesting choice with ${lastMove}. Keep an eye on your piece coordination—don't neglect your kingside!`,
    `You're playing actively, but notice how my pieces are clamping down on the central squares.`,
    `In your Chess.com games you often rush these transitions. Calculate two moves deeper before striking!`,
    `Good move. Now prove you can maintain vigilance under tactical pressure!`,
  ];

  const ai = getGeminiClient();
  if (!ai) {
    const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    return res.json({ comment: randomQuote });
  }

  try {
    const prompt = `You are an interactive Grandmaster chess coach observing a live training game against your student.
- Board FEN: ${fen}
- Player's last move: ${lastMove} (Move #${moveNumber})
- Player plays: ${playerColor}
- Coach Elo: ${coachElo}
- Student's known comfort zone: ${comfortZone || "Prefers quiet open play"}
- Position context: ${evaluation || "Equal fight"}

Provide a sharp, educational, 1-2 sentence real-time reaction. Point out a tactical subtlety, remind them of their Chess.com habit (e.g. rushing, over-defending, leaving loose pieces), or challenge them to find the best continuation. Speak with authority, wit, and mentorship. Keep it under 35 words. Return raw text only.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a sharp Grandmaster chess coach giving brief live 1-2 sentence in-game commentary.",
        temperature: 0.8,
      },
    });

    const comment = response.text?.trim() || fallbackQuotes[0];
    return res.json({ comment });
  } catch (err: any) {
    console.warn("Gemini live commentary fallback:", err.message);
    return res.json({ comment: fallbackQuotes[0] });
  }
});

// API: Post-Game Adaptive Review & Elo Scaling
app.post("/api/coach/review", async (req, res) => {
  const { gameResult, movesCount, pgn, playerColor, currentCoachElo, comfortZone } = req.body;

  let eloDelta = 0;
  if (gameResult === "player_win") {
    eloDelta = +25; // Coach recognizes student overcame difficulty, scales up
  } else if (gameResult === "draw") {
    eloDelta = +10; // Student held their own
  } else {
    eloDelta = +5; // Coach stays challenging or nudges slightly
  }

  const newCoachElo = currentCoachElo + eloDelta;

  const fallbackReview = {
    summary: gameResult === "player_win"
      ? "Outstanding resilience! You adapted to my pressure and exploited the tactical opportunity."
      : "A tough, instructive battle. You fought hard against the unfamiliar structure.",
    keyLesson: "Control of critical squares matters more than material speed when pawn structures lock.",
    adaptationNote: `Coach Elo adjusted by ${eloDelta > 0 ? `+${eloDelta}` : eloDelta} (Now ${newCoachElo}). The engine will now calculate deeper in tactical skirmishes.`,
    newCoachElo,
    eloDelta,
  };

  const ai = getGeminiClient();
  if (!ai) {
    return res.json(fallbackReview);
  }

  try {
    const prompt = `The training game has just ended:
- Result: ${gameResult} (Player won / Coach won / Draw)
- Moves played: ${movesCount}
- Player Color: ${playerColor}
- PGN summary: ${pgn}
- Player's Chess.com comfort zone: ${comfortZone}
- Previous Coach Elo: ${currentCoachElo} -> New Coach Elo: ${newCoachElo} (Delta: +${eloDelta})

Provide an instructive post-game debrief in JSON:
{
  "summary": "2 sentences summarizing the match highlights and whether the student resisted or fell into their old habits",
  "keyLesson": "1 sharp golden rule or takeaway for their next game",
  "adaptationNote": "How the coach will adapt their opening repertoire or calculation depth in the next session to keep pushing them"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are a master chess instructor conducting a debrief after a training match.",
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      return res.json({
        ...parsed,
        newCoachElo,
        eloDelta,
      });
    }
    return res.json(fallbackReview);
  } catch (err: any) {
    return res.json(fallbackReview);
  }
});

// API: Game Theory & Move-by-Move Mistake Analysis
app.post("/api/coach/analyze-game", async (req, res) => {
  const { pgn, playerUsername, playerColor } = req.body;

  if (!pgn || typeof pgn !== "string") {
    return res.status(400).json({ error: "Valid PGN string is required for game analysis." });
  }

  try {
    const { Chess } = await import("chess.js");
    const game = new Chess();
    try {
      game.loadPgn(pgn);
    } catch {
      // If header-less or dirty PGN, try simple move load
    }

    const headers = game.header();
    const history = game.history({ verbose: true });

    if (history.length === 0) {
      return res.status(400).json({ error: "No moves could be parsed from this PGN." });
    }

    const whiteName = headers["White"] || "White";
    const blackName = headers["Black"] || "Black";
    const userLower = (playerUsername || "").toLowerCase();
    
    let targetColor: "w" | "b" = "w";
    if (playerColor === "black" || blackName.toLowerCase() === userLower) {
      targetColor = "b";
    } else if (playerColor === "white" || whiteName.toLowerCase() === userLower) {
      targetColor = "w";
    }

    // Call Gemini for Grandmaster Theory Analysis
    const ai = getGeminiClient();
    if (ai) {
      try {
        const movesSummary = history
          .map((m, idx) => {
            const moveNum = Math.floor(idx / 2) + 1;
            const prefix = idx % 2 === 0 ? `${moveNum}. ` : "";
            return `${prefix}${m.san}`;
          })
          .join(" ");

        const prompt = `You are a World-Class International Grandmaster and Head Opening Theorist.
Analyze this chess game with strict focus on CHESS THEORY and PLAYER MISTAKES:
- White: ${whiteName}
- Black: ${blackName}
- Target Player to diagnose: ${targetColor === "w" ? "White" : "Black"} (${playerUsername || "Student"})
- Full Moves: ${movesSummary}

Your task:
1. Identify the Opening name (e.g. "Sicilian Defense: Najdorf Variation", "Italian Game: Giuoco Pianissimo", "Queen's Gambit Declined: Exchange Variation") and ECO Code.
2. Identify the exact move/ply where the student DEVIATED from sound opening book theory, or where their first strategic mistake occurred.
3. Identify 2 to 5 specific critical moves where the student (${targetColor === "w" ? "White" : "Black"}) made an error (Inaccuracy, Mistake, or Blunder).
4. For EACH of these critical moves, provide:
   - "moveNumber": (e.g. 8)
   - "color": "${targetColor}"
   - "san": the exact move played (e.g. "d5", "Be6")
   - "classification": "blunder" | "mistake" | "inaccuracy"
   - "theoreticalMove": the sound theoretical grandmaster move that should have been played (e.g. "Re8", "Nf6")
   - "whyWrong": Clear, instructive explanation of why the played move is strategically or theoretically flawed (e.g. creates backward pawn, loses tempo, neglects king safety, premature counterattack).
   - "whyTheoreticalBest": Theoretical justification for the recommended move (e.g. secures central outpost, follows classic Nimzowitsch prophylaxis, prepares timely d5 break).
   - "principleTag": Short tag like "King Safety", "Central Pawn Control", "Opening Development", "Tactical Oversight", "Piece Harmony", "Pawn Structure".

5. Formulate a main opening theory lesson summary for the student.

Respond in strict JSON format:
{
  "openingName": "Sicilian Defense: Najdorf Variation",
  "ecoCode": "B90",
  "outOfBookMove": "6... e5",
  "mainOpeningTheoryLesson": "A 2-3 sentence grandmaster overview explaining the central theoretical battle in this game and what the student must remember.",
  "criticalMomentSummary": "Brief overview of the turning point of the game.",
  "criticalMistakes": [
    {
      "moveNumber": 8,
      "color": "${targetColor}",
      "san": "move played",
      "classification": "mistake",
      "theoreticalMove": "best move",
      "whyWrong": "Theoretical explanation of why this was bad",
      "whyTheoreticalBest": "Why the theoretical move is superior",
      "principleTag": "Central Pawn Control"
    }
  ]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            systemInstruction: "You are an elite chess grandmaster and opening theorist who provides clear, actionable move-by-move theory explanations.",
            temperature: 0.6,
          },
        });

        const text = response.text;
        if (text) {
          const parsed = JSON.parse(text);
          return res.json({
            openingName: parsed.openingName || "Standard Opening",
            ecoCode: parsed.ecoCode || "A00",
            outOfBookMove: parsed.outOfBookMove || null,
            mainOpeningTheoryLesson: parsed.mainOpeningTheoryLesson || "Focus on controlling the center and piece coordination.",
            criticalMomentSummary: parsed.criticalMomentSummary || "The match hinged on middle-game tactical precision.",
            criticalMistakes: parsed.criticalMistakes || [],
            historyCount: history.length,
          });
        }
      } catch (geminiErr: any) {
        console.warn("Gemini game analysis failed, falling back to rule engine:", geminiErr.message);
      }
    }

    // Fallback opening & theory heuristics
    return res.json({
      openingName: headers["ECO"] ? `Opening (${headers["ECO"]})` : "Standard Opening",
      ecoCode: headers["ECO"] || "B00",
      outOfBookMove: null,
      mainOpeningTheoryLesson: "Maintain King safety and fight for the central squares before embarking on flank excursions.",
      criticalMomentSummary: "A sharp tactical game where piece activity dictated the flow.",
      criticalMistakes: [],
      historyCount: history.length,
    });
  } catch (err: any) {
    console.error("Error analyzing game:", err);
    return res.status(500).json({ error: "Failed to parse and analyze game." });
  }
});

// Setup Vite or Static File Serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Grandmaster AI Chess Coach server running on port ${PORT}`);
  });
}

start();
