import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// Lib
import { RANK_MAP, THEME_CONFIGS } from './lib/constants';

// Hooks
import { useSoundEngine } from './hooks/useSoundEngine';
import { useWebSocket } from './hooks/useWebSocket';
import { useSimulation } from './hooks/useSimulation';

// Components
import Header from './components/header/Header';
import StatusBoard from './components/dashboard/StatusBoard';
import PokerTable from './components/table/PokerTable';
import Sidebar from './components/sidebar/Sidebar';
import AdminPanel from './components/admin/AdminPanel';

// ==========================================
// INITIAL GAME STATE
// ==========================================
const INITIAL_GAME_STATE = {
  stage: "Offline",
  total_pot: 0,
  current_blinds: "10/20",
  blinds_timer: 5,
  active_player_index: -1,
  players: [
    { name: "DeepSeek Flash", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0 },
    { name: "Gemini Lite", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0 },
    { name: "GPT-4o Mini", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0 },
    { name: "Qwen 2.5 72B", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0 },
    { name: "Llama 3 8B", stack: 1500, current_bet: 0, cards: [], is_active: false, time_left: 0 }
  ],
  board: [],
  result: ""
};

// ==========================================
// APP COMPONENT
// ==========================================
export default function App() {
  // Theme
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('poker_theme') || 'classic';
  });

  useEffect(() => {
    localStorage.setItem('poker_theme', theme);
  }, [theme]);

  // Game state
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [logs, setLogs] = useState([]);
  const [handHistory, setHandHistory] = useState([]);
  const [showHandHistory, setShowHandHistory] = useState(false);

  // Animated pot tracking
  const [displayPot, setDisplayPot] = useState(0);
  const [potAnimKey, setPotAnimKey] = useState(0);
  const prevPotRef = useRef(0);

  // Hand tracking
  const [handId, setHandId] = useState(0);
  const [flyingChips, setFlyingChips] = useState([]);
  const prevGameStateRef = useRef(null);

  // Refs for dedup
  const terminalContainerRef = useRef(null);
  const lastThoughtRef = useRef("");
  const lastActionRef = useRef("");
  const lastBlindsRef = useRef("");

  // Sound engine
  const { play: playSound, isMuted, setIsMuted, volume, setVolume } = useSoundEngine();

  // Log management
  const addLog = useCallback((message, type = 'system') => {
    if (!message) return;
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => {
      if (prev.length > 0 && prev[prev.length - 1].text === message) {
        return prev;
      }
      const newLog = {
        id: `${Date.now()}-${Math.random()}-${prev.length}`,
        timestamp,
        text: message,
        type
      };
      return [...prev, newLog];
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    addLog("Історію думок очищено.", "system");
  }, [addLog]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Animated pot counter
  const animatePotCounter = useCallback((from, to) => {
    const duration = 400;
    const start = performance.now();
    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplayPot(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, []);

  // Max stack for progress bars
  const maxStack = useMemo(() => {
    if (!gameState.players) return 1500;
    return Math.max(...gameState.players.map(p => p.stack || 0), 1);
  }, [gameState.players]);

  // Simulation
  const { isSimulating, isSimPaused, setIsSimPaused, toggleSimulation, handleNextSimStep } = useSimulation({
    setGameState,
    addLog,
    playSound,
    simSpeedMultiplier: 1
  });

  // WebSocket
  const {
    serverIP, setServerIP,
    connectionStatus,
    isAutoReconnecting, reconnectAttempt, maxReconnectAttempts,
    handleReconnect, sendAdminCommand, disconnectSocket
  } = useWebSocket({
    setGameState, addLog, playSound, isSimulating,
    prevPotRef, setPotAnimKey, animatePotCounter,
    lastThoughtRef, lastActionRef, lastBlindsRef
  });

  // Dynamic Flying Chips and Hand ID triggers
  useEffect(() => {
    const prev = prevGameStateRef.current;
    prevGameStateRef.current = gameState;

    if (!prev) return;

    const newChips = [];

    // 1. Detect if players' bets are gathered to the pot
    if (gameState.stage !== prev.stage) {
      gameState.players?.forEach((player, idx) => {
        const prevPlayer = prev.players?.[idx];
        if (prevPlayer && prevPlayer.current_bet > 0 && player.current_bet === 0) {
          newChips.push({
            id: `collect-${idx}-${Date.now()}-${Math.random()}`,
            type: 'collect',
            seat: idx
          });
        }
      });
    }

    // 2. Detect if winner takes the pot at Showdown
    if (gameState.stage === "Showdown" && prev.stage !== "Showdown" && gameState.result) {
      // The backend reports the winner inside the result string, so match by name.
      const winnerIdx = gameState.players?.findIndex(p => gameState.result.includes(p.name)) ?? -1;
      if (winnerIdx !== -1) {
        newChips.push({
          id: `win-${winnerIdx}-${Date.now()}-${Math.random()}`,
          type: 'win',
          seat: winnerIdx
        });
      }

      // Parse winner and combo
      const parseHandResult = (resultString, players = []) => {
        let winnerName = "???";
        let comboName = "";
        if (!resultString) return { winnerName, comboName };
        const found = players.find(p => resultString.includes(p.name));
        if (found) {
          winnerName = found.name;
        } else {
          const cleanStr = resultString.replace("🏆", "").trim();
          const match = cleanStr.match(/^(?:Переміг\s+)?([^\s]+(?:\s+[^\s]+)?)/);
          if (match) winnerName = match[1];
        }
        const comboMatch = resultString.match(/\(([^)]+)\)/);
        if (comboMatch) comboName = comboMatch[1];
        return { winnerName, comboName };
      };

      const { winnerName, comboName } = parseHandResult(gameState.result, gameState.players || []);

      // Record hand in history
      setHandHistory(h => [
        {
          id: Date.now(),
          result: gameState.result,
          pot: gameState.total_pot,
          winner: winnerName,
          combo: comboName,
          board: gameState.board?.map(c => `${RANK_MAP[c.Rank] || c.Rank}${c.Suit}`).join(' ') || '',
          blinds: gameState.current_blinds,
          timestamp: new Date().toLocaleTimeString()
        },
        ...h
      ].slice(0, 20));
    }

    // 3. Detect start of a new hand
    if (gameState.stage === "Pre-flop" && prev.stage !== "Pre-flop") {
      setHandId(h => h + 1);
    }

    if (newChips.length > 0) {
      setFlyingChips(current => [...current, ...newChips]);
      newChips.forEach(chip => {
        setTimeout(() => {
          setFlyingChips(current => current.filter(c => c.id !== chip.id));
        }, 750);
      });
    }
  }, [gameState]);

  const currentThemeConfig = THEME_CONFIGS[theme] || THEME_CONFIGS.classic;

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <main className={`min-h-screen w-full flex flex-col p-4 md:p-6 lg:p-8 relative transition-all duration-500 overflow-x-hidden ${currentThemeConfig.bodyClass}`}>

      {/* Background radial spotlights & overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none z-0" />
      <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] bg-fuchsia-600/18 rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[650px] h-[650px] bg-cyan-500/18 rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-[5%] left-[25%] w-[550px] h-[550px] bg-purple-600/12 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* HEADER */}
      <Header
        theme={theme}
        setTheme={setTheme}
        currentThemeConfig={currentThemeConfig}
        serverIP={serverIP}
        setServerIP={setServerIP}
        handleReconnect={handleReconnect}
        connectionStatus={connectionStatus}
        isAutoReconnecting={isAutoReconnecting}
        reconnectAttempt={reconnectAttempt}
        maxReconnectAttempts={maxReconnectAttempts}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        volume={volume}
        setVolume={setVolume}
        isSimulating={isSimulating}
        toggleSimulation={() => toggleSimulation(disconnectSocket)}
        handleNextSimStep={handleNextSimStep}
        addLog={addLog}
        playSound={playSound}
      />

      {/* DASHBOARD STATUS BOARD */}
      <StatusBoard
        gameState={gameState}
        displayPot={displayPot}
        potAnimKey={potAnimKey}
      />

      {/* MAIN LAYOUT GRID */}
      <div className="w-full flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch relative min-h-[500px] lg:h-[calc(100vh-280px)] z-10">

        {/* POKER TABLE */}
        <PokerTable
          gameState={gameState}
          setGameState={setGameState}
          theme={theme}
          currentThemeConfig={currentThemeConfig}
          displayPot={displayPot}
          potAnimKey={potAnimKey}
          handId={handId}
          flyingChips={flyingChips}
          maxStack={maxStack}
          isSimulating={isSimulating}
          setSimStep={() => {}}
        />

        {/* SIDEBAR */}
        <Sidebar
          players={gameState.players}
          activePlayerIndex={gameState.active_player_index}
          stage={gameState.stage}
          theme={theme}
          handHistory={handHistory}
          showHandHistory={showHandHistory}
          setShowHandHistory={setShowHandHistory}
          logs={logs}
          clearLogs={clearLogs}
          terminalContainerRef={terminalContainerRef}
          connectionStatus={connectionStatus}
        />
      </div>

      {/* ADMIN PANEL */}
      <AdminPanel
        theme={theme}
        gameState={gameState}
        isSimulating={isSimulating}
        isSimPaused={isSimPaused}
        setIsSimPaused={setIsSimPaused}
        sendAdminCommand={sendAdminCommand}
      />

      {/* FOOTER */}
      <footer className="w-full text-center mt-6 pt-4 border-t border-gray-900/40 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-600 font-mono">
        <p>© 2026 AI Sit&amp;Go Arena. Premium Edition. All rights reserved.</p>
        <p className="mt-1 md:mt-0">Таймінги веб-аудіо та таймерів підлаштовані під стандартний ігровий темп.</p>
      </footer>

    </main>
  );
}
