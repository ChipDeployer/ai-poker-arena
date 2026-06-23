import { useState, useEffect, useRef, useCallback } from 'react';
import { SIM_GAME_STEPS, BOT_THOUGHTS } from '../lib/simulation-data';

export function useSimulation({ setGameState, addLog, playSound, simSpeedMultiplier = 1 }) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSimPaused, setIsSimPaused] = useState(false);
  const simStepRef = useRef(0);

  const advanceSimulationStep = useCallback(() => {
    const prevStep = simStepRef.current;
    const nextStep = (prevStep + 1) % SIM_GAME_STEPS.length;
    simStepRef.current = nextStep;
    const mockState = SIM_GAME_STEPS[nextStep];

    setGameState(mockState);

    if (mockState.stage === 'Showdown') {
      playSound('winner');
    } else {
      playSound('card');
    }

    if (mockState.stage !== SIM_GAME_STEPS[prevStep]?.stage) {
      addLog(`=== ЕТАП: ${mockState.stage.toUpperCase()} ===`, 'stage');
    }

    const activeIdx = mockState.active_player_index;
    if (activeIdx !== -1 && mockState.players[activeIdx]) {
      const activePlayerName = mockState.players[activeIdx].name;
      const playerThoughts = BOT_THOUGHTS[`p${activeIdx}`] || [];
      const thought = playerThoughts[Math.floor(Math.random() * playerThoughts.length)];

      setTimeout(() => {
        addLog(`🤖 ${activePlayerName}: ${thought.split(': ')[1]}`, `p${activeIdx}`);

        setTimeout(() => {
          const act = mockState.players[activeIdx].status || "CALL";
          addLog(`➔ ${activePlayerName} робить: ${act}`, 'success');
          playSound('chip');
        }, 1200 / simSpeedMultiplier);

      }, 400 / simSpeedMultiplier);
    }

    if (mockState.stage === 'Showdown' && mockState.result) {
      addLog(mockState.result, 'winner');
    }
  }, [setGameState, addLog, playSound, simSpeedMultiplier]);

  // Timer tick for active player countdown
  useEffect(() => {
    if (isSimulating && isSimPaused) return;

    const tickInterval = 1000 / simSpeedMultiplier;

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.stage === "Offline" || prev.stage === "Idle") return prev;

        const activeIdx = prev.active_player_index;
        if (activeIdx !== -1 && prev.players && prev.players[activeIdx]) {
          const updatedPlayers = prev.players.map((p, idx) => {
            if (idx === activeIdx) {
              const newTimeLeft = Math.max(0, p.time_left - 1);
              return { ...p, time_left: newTimeLeft };
            }
            return p;
          });

          const activePlayer = updatedPlayers[activeIdx];
          if (activePlayer.time_left === 0 && isSimulating) {
            setTimeout(() => advanceSimulationStep(), 20);
          }

          return {
            ...prev,
            players: updatedPlayers
          };
        }

        return prev;
      });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [isSimulating, isSimPaused, simSpeedMultiplier, setGameState, advanceSimulationStep]);

  const toggleSimulation = useCallback((disconnectSocket) => {
    if (isSimulating) {
      setIsSimulating(false);
      addLog("Симуляцію зупинено.", "system");
    } else {
      if (disconnectSocket) disconnectSocket();
      setIsSimulating(true);
      setIsSimPaused(false);
      simStepRef.current = 0;
      setGameState(SIM_GAME_STEPS[0]);

      addLog("=== ЗАПУСК ЛОКАЛЬНОЇ СИМУЛЯЦІЇ ===", "stage");
      addLog("GPT-4o Mini думає...", "p2");
      playSound('stage');
    }
  }, [isSimulating, setGameState, addLog, playSound]);

  const handleNextSimStep = useCallback(() => {
    if (!isSimulating) return;
    advanceSimulationStep();
  }, [isSimulating, advanceSimulationStep]);

  return {
    isSimulating, isSimPaused, setIsSimPaused,
    toggleSimulation, handleNextSimStep
  };
}
