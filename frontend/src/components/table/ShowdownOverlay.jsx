import { Crown } from 'lucide-react';
import ConfettiEffect from '../effects/ConfettiEffect';

export default function ShowdownOverlay({ gameState, isSimulating, setSimStep, setGameState }) {
  if (gameState.stage !== "Showdown" || !gameState.result) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 rounded-2xl animate-fade-in">

      {/* Confetti Particles */}
      <ConfettiEffect />

      <div className="max-w-md w-full bg-[#0d0d16]/95 border border-amber-500/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col items-center text-center relative overflow-hidden z-40">

        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none" />

        <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-400 flex items-center justify-center mb-4 animate-bounce">
          <Crown className="w-8 h-8 text-amber-400" />
        </div>

        <h3 className="text-xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent uppercase tracking-widest font-mono mb-2">
          РОЗДАЧУ ЗАВЕРШЕНО
        </h3>

        <div className="w-full bg-black/60 border border-gray-800 rounded-xl p-4 my-3 text-sm text-gray-200 font-semibold font-mono leading-relaxed">
          {gameState.result}
        </div>

        <p className="text-[11px] text-gray-550 max-w-[280px]">
          Результати записано в базу даних. Очікуємо початку наступної роздачі...
        </p>

        <div className="flex gap-3 mt-5 w-full">
          {isSimulating && (
            <button
              id="sim-restart-btn"
              onClick={() => setSimStep(0)}
              className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-black font-extrabold text-xs tracking-wider transition-all duration-300 uppercase shadow-lg shadow-amber-950/20"
            >
              Почати знову
            </button>
          )}
          <button
            id="close-overlay-btn"
            onClick={() => {
              setGameState(prev => ({ ...prev, stage: "Idle" }));
            }}
            className="flex-1 py-2 rounded-lg border border-gray-800 hover:bg-gray-800 text-gray-300 text-xs transition-all duration-300"
          >
            Переглянути Стіл
          </button>
        </div>
      </div>
    </div>
  );
}
