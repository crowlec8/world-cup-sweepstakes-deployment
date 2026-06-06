import React, { useEffect, useMemo, useRef, useState } from "react";

import "./styles/main.css";

import NamePage from "./pages/NamePage";
import LeagueChoicePage from "./pages/LeagueChoicePage";
import CreateLeaguePage from "./pages/CreateLeaguePage";
import JoinLeaguePage from "./pages/JoinLeaguePage";
import ViewExistingLeaguePage from "./pages/ViewExistingLeaguePage";
import DrawPage from "./pages/DrawPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import CountriesPage from "./pages/CountriesPage";
import AdminPage from "./pages/AdminPage";
import AdminLoginPage from "./pages/AdminLoginPage";

import ScoringRules from "./components/ScoringRules";

import {
  createLeagueDB,
  getLeagueByCode,
  getPlayersByLeagueId,
  addPlayerToLeague,
  clearLeaguePlayers,
} from "./lib/leagueService";

type View =
  | "name"
  | "leagueChoice"
  | "createLeague"
  | "joinLeague"
  | "viewExistingLeague"
  | "draw"
  | "leaderboard"
  | "countries"
  | "admin"
  | "adminLogin";

type Entry = {
  name: string;
  teams: string[];
  createdAt: string;
};

const POOLS: string[][] = [
  [
    "Spain",
    "France",
    "England",
    "Brazil",
    "Argentina",
    "Portugal",
    "Netherlands",
    "Germany",
  ],
  [
    "Norway",
    "Belgium",
    "Colombia",
    "Japan",
    "Morocco",
    "USA",
    "Uruguay",
    "Switzerland",
    "Mexico",
    "Croatia",
    "Turkey",
    "Ecuador",
  ],
  [
    "Senegal",
    "Sweden",
    "Canada",
    "Austria",
    "Paraguay",
    "Scotland",
    "Bosnia and Herzegovina",
    "Ivory Coast",
    "Egypt",
    "Czechia",
    "Ghana",
    "Algeria",
    "South Korea",
    "Tunisia",
    "Australia",
    "Iran",
    "DR Congo",
  ],
  [
    "South Africa",
    "Saudi Arabia",
    "Panama",
    "Iraq",
    "Uzbekistan",
    "Qatar",
    "Cape Verde",
    "New Zealand",
    "Jordan",
    "Haiti",
    "Curacao",
  ],
];

const SLOT_LABELS = ["Pool 1", "Pool 2", "Pool 3", "Pool 4"];

const TOTAL_POSSIBLE_COMBINATIONS = POOLS.reduce(
  (acc, pool) => acc * pool.length,
  1
);

function combinationKey(teams: string[]) {
  return teams.join("|");
}

export default function App() {
  const [view, setView] = useState<View>("name");
  const [nameInput, setNameInput] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [leaguePassword, setLeaguePassword] = useState<string | null>(null);
  const [leagueName, setLeagueName] = useState("");
  const [leagueId, setLeagueId] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<Entry[]>([]);
  const [displayIndexes, setDisplayIndexes] = useState<number[]>([0, 0, 0, 0]);
  const [selectedTeams, setSelectedTeams] = useState<(string | null)[]>([
    null,
    null,
    null,
    null,
  ]);
  const [spinning, setSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const intervalRefs = useRef<number[]>([]);

  const canContinue = nameInput.trim().length > 0;

  const currentEntry = useMemo(() => {
    if (!playerName || !selectedTeams.every(Boolean)) return null;

    return {
      name: playerName,
      teams: selectedTeams as string[],
      createdAt: new Date().toISOString(),
    };
  }, [playerName, selectedTeams]);

  useEffect(() => {
    return () => {
      intervalRefs.current.forEach((id) => window.clearInterval(id));
    };
  }, []);

  // Secret admin URL handling
  useEffect(() => {
    const syncPathToView = () => {
      if (window.location.pathname === "/admin23") {
        setView(isAdminAuthenticated ? "admin" : "adminLogin");
      }
    };

    syncPathToView();

    window.addEventListener("popstate", syncPathToView);

    return () => {
      window.removeEventListener("popstate", syncPathToView);
    };
  }, [isAdminAuthenticated]);

  // Prevent direct access to admin view unless logged in
  useEffect(() => {
    if (view === "admin" && !isAdminAuthenticated) {
      setView("adminLogin");
    }
  }, [view, isAdminAuthenticated]);

  // ---------------------------------
  // Titles
  // ---------------------------------
  const pageTitle =
    view === "leaderboard"
      ? leagueName
        ? `${leagueName} Leaderboard`
        : "Leaderboard"
      : view === "countries"
      ? "All Teams"
      : view === "admin"
      ? "Admin"
      : view === "adminLogin"
      ? "Admin Login"
      : view === "leagueChoice"
      ? `Welcome, ${playerName}`
      : view === "createLeague"
      ? "Create a League"
      : view === "joinLeague"
      ? "Join a League"
      : view === "viewExistingLeague"
      ? "View Existing League"
      : view === "draw"
      ? leagueName
        ? `${leagueName} Sweepstakes Draw`
        : `Welcome, ${playerName}`
      : "";

  // ---------------------------------
  // Back behaviour
  // ---------------------------------
  const handleBack = () => {
    if (view === "admin" || view === "adminLogin") {
      window.history.replaceState(null, "", "/");

      setView(
        playerName && leaguePassword
          ? "draw"
          : playerName
          ? "leagueChoice"
          : "name"
      );

      return;
    }

    if (view === "countries" || view === "leaderboard") {
      setView(
        playerName && leaguePassword
          ? "draw"
          : playerName
          ? "leagueChoice"
          : "name"
      );

      return;
    }

    if (view === "draw") {
      setView("leagueChoice");
      return;
    }

    if (
      view === "createLeague" ||
      view === "joinLeague" ||
      view === "viewExistingLeague"
    ) {
      setView(playerName ? "leagueChoice" : "name");
      return;
    }

    if (view === "leagueChoice") {
      setView("name");
    }
  };

  // ---------------------------------
  // Start
  // ---------------------------------
  const startGame = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = nameInput.trim();

    if (!cleanName) return;

    setPlayerName(cleanName);
    setView("leagueChoice");
  };

  // ---------------------------------
  // Admin login
  // ---------------------------------
  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    setView("admin");
  };

  // ---------------------------------
  // Create league (Supabase)
  // ---------------------------------
  const handleCreateLeague = async (
    leagueNameInput: string,
    passwordInput: string
  ) => {
    const cleanName = leagueNameInput.trim();
    const cleanPassword = passwordInput.trim();

    if (!cleanName || !cleanPassword) {
      return;
    }

    try {
      const existingLeague = await getLeagueByCode(cleanPassword);

      if (existingLeague) {
        return "exists";
      }

      const newLeague = await createLeagueDB(cleanName, cleanPassword);

      setLeagueId(newLeague.id);
      setLeaguePassword(cleanPassword);
      setLeagueName(newLeague.name);
      setLeaderboard([]);
      setSelectedTeams([null, null, null, null]);
      setDisplayIndexes([0, 0, 0, 0]);
      setHasSpun(false);
      setSpinning(false);
      setView("draw");

      return "success";
    } catch (error) {
      console.error(error);
      return "error";
    }
  };

  // ---------------------------------
  // Join league (Supabase)
  // ---------------------------------
  const handleJoinLeague = async (passwordInput: string) => {
    const cleanPassword = passwordInput.trim();

    try {
      const league = await getLeagueByCode(cleanPassword);

      if (!league) {
        return "not_found";
      }

      const players = await getPlayersByLeagueId(league.id);

      const existingPlayer = players.find(
        (player: Entry) =>
          player.name.toLowerCase() === playerName.toLowerCase()
      );

      if (existingPlayer) {
        return "already_joined";
      }

      setLeagueId(league.id);
      setLeaguePassword(cleanPassword);
      setLeagueName(league.name);
      setLeaderboard(players);
      setSelectedTeams([null, null, null, null]);
      setDisplayIndexes([0, 0, 0, 0]);
      setHasSpun(false);
      setSpinning(false);
      setView("draw");

      return "success";
    } catch (error) {
      console.error(error);
      alert("There was a problem joining the league.");
      return "error";
    }
  };

  // ---------------------------------
  // View existing league
  // ---------------------------------
  const handleViewExistingLeague = async (
    nameInputValue: string,
    passwordInput: string
  ) => {
    const cleanName = nameInputValue.trim();
    const cleanPassword = passwordInput.trim();

    if (!cleanName || !cleanPassword) {
      return "missing";
    }

    try {
      const league = await getLeagueByCode(cleanPassword);

      if (!league) {
        return "not_found";
      }

      const players = await getPlayersByLeagueId(league.id);

      const existingPlayer = players.find(
        (player: Entry) => player.name.toLowerCase() === cleanName.toLowerCase()
      );

      if (!existingPlayer) {
        return "player_not_found";
      }

      setPlayerName(existingPlayer.name);
      setNameInput(existingPlayer.name);
      setLeagueId(league.id);
      setLeaguePassword(cleanPassword);
      setLeagueName(league.name);
      setLeaderboard(players);
      setSelectedTeams(existingPlayer.teams || [null, null, null, null]);
      setHasSpun(true);
      setSpinning(false);

      setDisplayIndexes(
        (existingPlayer.teams || []).map((team, poolIndex) => {
          const idx = POOLS[poolIndex]?.indexOf(team);
          return idx >= 0 ? idx : 0;
        })
      );

      setView("leaderboard");

      return "success";
    } catch (error) {
      console.error(error);
      return "error";
    }
  };

  // ---------------------------------
  // Find a unique team combination within a league
  // ---------------------------------
  const getUniqueCombinationForLeague = (players: Entry[]) => {
    const usedCombinations = new Set(
      (players || [])
        .filter(
          (player) => Array.isArray(player.teams) && player.teams.length === 4
        )
        .map((player) => combinationKey(player.teams))
    );

    if (usedCombinations.size >= TOTAL_POSSIBLE_COMBINATIONS) {
      return null;
    }

    let finalIndexes: number[] = [];
    let finalTeamsLocal: string[] = [];
    let combo = "";
    let attempts = 0;

    const maxAttempts = 10000;

    do {
      finalIndexes = POOLS.map((pool) =>
        Math.floor(Math.random() * pool.length)
      );

      finalTeamsLocal = finalIndexes.map(
        (idx, poolIndex) => POOLS[poolIndex][idx]
      );

      combo = combinationKey(finalTeamsLocal);
      attempts += 1;
    } while (usedCombinations.has(combo) && attempts < maxAttempts);

    if (usedCombinations.has(combo)) {
      for (let i = 0; i < POOLS[0].length; i++) {
        for (let j = 0; j < POOLS[1].length; j++) {
          for (let k = 0; k < POOLS[2].length; k++) {
            for (let l = 0; l < POOLS[3].length; l++) {
              const teams = [
                POOLS[0][i],
                POOLS[1][j],
                POOLS[2][k],
                POOLS[3][l],
              ];

              const key = combinationKey(teams);

              if (!usedCombinations.has(key)) {
                return {
                  finalIndexes: [i, j, k, l],
                  finalTeamsLocal: teams,
                };
              }
            }
          }
        }
      }

      return null;
    }

    return { finalIndexes, finalTeamsLocal };
  };

  // ---------------------------------
  // Spin logic (Supabase)
  // ---------------------------------
  const spinSlots = async () => {
    if (spinning || !playerName || !leagueId) return;

    try {
      const players = await getPlayersByLeagueId(leagueId);

      const alreadyExists = players.find(
        (player: Entry) =>
          player.name.toLowerCase() === playerName.toLowerCase()
      );

      if (alreadyExists) {
        setLeaderboard(players);
        setSelectedTeams(alreadyExists.teams || [null, null, null, null]);
        setHasSpun(true);
        setDisplayIndexes(
          (alreadyExists.teams || []).map((team, poolIndex) => {
            const idx = POOLS[poolIndex]?.indexOf(team);
            return idx >= 0 ? idx : 0;
          })
        );
        setView("leaderboard");
        return;
      }

      const uniqueResult = getUniqueCombinationForLeague(players);

      if (!uniqueResult) {
        alert(
          "All possible team combinations have already been assigned in this league."
        );
        return;
      }

      const { finalIndexes, finalTeamsLocal } = uniqueResult;

      setSpinning(true);

      intervalRefs.current.forEach((id) => window.clearInterval(id));
      intervalRefs.current = [];

      const maxSpinDuration = 1400 + (POOLS.length - 1) * 450;

      POOLS.forEach((pool, slotIndex) => {
        const intervalId = window.setInterval(() => {
          setDisplayIndexes((prev) => {
            const next = [...prev];
            next[slotIndex] = (next[slotIndex] + 1) % pool.length;
            return next;
          });
        }, 90 + slotIndex * 10);

        intervalRefs.current[slotIndex] = intervalId;

        window.setTimeout(() => {
          window.clearInterval(intervalId);

          setDisplayIndexes((prev) => {
            const next = [...prev];
            next[slotIndex] = finalIndexes[slotIndex];
            return next;
          });
        }, 1400 + slotIndex * 450);
      });

      window.setTimeout(async () => {
        try {
          setSelectedTeams(finalTeamsLocal);
          setHasSpun(true);
          setSpinning(false);

          await addPlayerToLeague(leagueId, playerName, finalTeamsLocal);

          const updatedPlayers = await getPlayersByLeagueId(leagueId);

          setLeaderboard(updatedPlayers);
        } catch (error) {
          console.error(error);
          alert("There was a problem saving your teams.");
          setSpinning(false);
        }
      }, maxSpinDuration + 50);
    } catch (error) {
      console.error(error);
      alert("There was a problem loading league data.");
      setSpinning(false);
    }
  };

  // ---------------------------------
  // Clear only this league leaderboard
  // ---------------------------------
  const clearLocalLeaderboard = async () => {
    if (!leagueId) return;

    try {
      await clearLeaguePlayers(leagueId);
      setLeaderboard([]);
    } catch (error) {
      console.error(error);
      alert("There was a problem clearing the leaderboard.");
    }
  };

  return (
    <div className="app-shell">
      <div className="container">
        {/* Header */}
        <div className="header-row">
          <div className="title-area">
            <div className="site-title-block">
              <p className="site-kicker">FIFA World Cup 2026</p>
              <h1 className="site-title">World Cup Sweepstakes</h1>
            </div>

            {pageTitle && <h2 className="page-heading">{pageTitle}</h2>}
          </div>

          <div className="toolbar">
            {view !== "leaderboard" && leagueId && (
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  try {
                    const players = await getPlayersByLeagueId(leagueId);
                    setLeaderboard(players);
                    setView("leaderboard");
                  } catch (error) {
                    console.error(error);
                    alert("There was a problem loading the leaderboard.");
                  }
                }}
              >
                Leaderboard
              </button>
            )}

            <button
              className="btn btn-secondary"
              onClick={() => setShowRules(true)}
            >
              Rules
            </button>

            {view !== "countries" && (
              <button
                className="btn btn-secondary"
                onClick={() => setView("countries")}
              >
                Teams
              </button>
            )}

            {view !== "name" && view !== "leaderboard" && (
              <button className="btn btn-secondary" onClick={handleBack}>
                Back
              </button>
            )}
          </div>
        </div>

        {/* Routing */}
        {view === "name" && (
          <NamePage
            nameInput={nameInput}
            setNameInput={setNameInput}
            startGame={startGame}
            canContinue={canContinue}
          />
        )}

        {view === "leagueChoice" && (
          <LeagueChoicePage
            onCreate={() => setView("createLeague")}
            onJoin={() => setView("joinLeague")}
          />
        )}

        {view === "createLeague" && (
          <CreateLeaguePage
            onCreate={handleCreateLeague}
            playerName={playerName}
          />
        )}

        {view === "joinLeague" && (
          <JoinLeaguePage
            onJoin={handleJoinLeague}
            playerName={playerName}
            onViewExistingLeague={() => setView("viewExistingLeague")}
          />
        )}

        {view === "viewExistingLeague" && (
          <ViewExistingLeaguePage
            initialName={playerName || nameInput}
            onViewExistingLeague={handleViewExistingLeague}
          />
        )}

        {view === "draw" && (
          <DrawPage
            spinSlots={spinSlots}
            spinning={spinning}
            hasSpun={hasSpun}
            displayIndexes={displayIndexes}
            pools={POOLS}
            slotLabels={SLOT_LABELS}
            currentEntry={currentEntry}
          />
        )}

        {view === "leaderboard" && (
          <LeaderboardPage leaderboard={leaderboard} playerName={playerName} />
        )}

        {view === "countries" && (
          <CountriesPage pools={POOLS} goBack={handleBack} />
        )}

        {view === "adminLogin" && <AdminLoginPage onLogin={handleAdminLogin} />}

        {view === "admin" && isAdminAuthenticated && (
          <AdminPage goBack={handleBack} />
        )}
      </div>

      {showRules && (
        <div
          className="rules-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rules-modal-title"
          onClick={() => setShowRules(false)}
        >
          <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="rules-close-button"
              aria-label="Close rules"
              onClick={() => setShowRules(false)}
            >
              ×
            </button>

            <h2 id="rules-modal-title">How the Sweepstakes Works</h2>

            <ScoringRules />
          </div>
        </div>
      )}
    </div>
  );
}