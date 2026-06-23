import { useState } from 'react';
import { Play, Pause, Sliders, ShieldAlert, Swords, Lock, ChevronDown, ChevronUp } from 'lucide-react';

function AdminPanel({ theme, gameState, isSimulating, isSimPaused, setIsSimPaused, sendAdminCommand }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mt-6 z-10 flex flex-col items-center">
      {/* Subtle trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/5 hover:border-cyan-500/35 hover:text-cyan-400 text-gray-500 text-[10px] font-bold font-mono uppercase tracking-widest transition-all duration-300 shadow-md cursor-pointer mb-2"
      >
        <Lock className="w-3.5 h-3.5" />
        <span>Адмін-Контроль</span>
        {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
      </button>

      {/* Collapsible panel with transition */}
      <div 
        className={`w-full overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <section className={`w-full p-4 rounded-2xl glass-panel border ${
          theme === 'classic' ? 'border-emerald-800/25' : theme === 'cyber' ? 'border-cyan-800/25' : 'border-pink-900/25'
        } flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl bg-black/40`}>
          
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div>
              <h3 className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-widest">Адмін-панель керування турніром (Admin Control)</h3>
              <p className="text-[10px] text-gray-500 font-mono">Надсилання сигналів паузи та старту через вебсокет до Go-бекенду</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Start Tournament Trigger */}
            <div className="flex items-center gap-2 bg-black/50 border border-white/5 rounded-xl p-1">
              <button
                type="button"
                onClick={() => sendAdminCommand('start_tournament')}
                disabled={gameState?.stage !== 'Waiting' && gameState?.stage !== 'Tournament Over'}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-300 uppercase flex items-center gap-1.5 cursor-pointer ${
                  (gameState?.stage === 'Waiting' || gameState?.stage === 'Tournament Over')
                    ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-500/50 hover:bg-indigo-900 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:text-white'
                    : 'bg-gray-900/50 text-gray-600 border border-gray-800 cursor-not-allowed opacity-50'
                }`}
              >
                <Swords className="w-4 h-4" />
                Новий Турнір
              </button>
            </div>
            
            {/* Pause / Play Trigger */}
            <div className="flex items-center gap-2 bg-black/50 border border-white/5 rounded-xl p-1">
              <button
                id="admin-btn-resume"
                type="button"
                onClick={() => {
                  sendAdminCommand('resume');
                  setIsSimPaused(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-300 uppercase flex items-center gap-1.5 cursor-pointer ${
                  !isSimPaused 
                    ? theme === 'classic' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50' : theme === 'cyber' ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/50' : 'bg-pink-950/80 text-pink-400 border border-pink-500/50'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Play className="w-3 h-3" />
                Старт
              </button>
              <button
                id="admin-btn-pause"
                type="button"
                onClick={() => {
                  sendAdminCommand('pause');
                  setIsSimPaused(true);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all duration-300 uppercase flex items-center gap-1.5 cursor-pointer ${
                  isSimPaused 
                    ? 'bg-red-950/80 text-red-400 border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.25)]' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Pause className="w-3 h-3" />
                Пауза
              </button>
            </div>

            {isSimulating && (
              <div className="flex items-center gap-1.5 text-[9px] font-bold font-mono text-purple-400 bg-purple-950/20 border border-purple-800/30 px-3 py-1.5 rounded-lg animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>SIMULATING</span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminPanel;
