import { Layers, TrendingUp, Clock, Coins } from 'lucide-react';

function StatusBoard({ gameState, displayPot, potAnimKey }) {
  const getBlindLevel = () => {
    const blinds = gameState.current_blinds || "10/20";
    if (blinds === "10/20") return 1;
    if (blinds === "20/40") return 2;
    if (blinds === "50/100") return 3;
    return 4;
  };

  const level = getBlindLevel();

  return (
    <section className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 z-10">
      
      {/* Stage panel */}
      <div 
        className="p-4 rounded-xl dashboard-item flex items-center justify-between shadow-lg animate-slide-up"
        style={{ animationDelay: '50ms' }}
      >
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-indigo-400" />
          <div>
            <p className="text-[10px] uppercase font-mono text-gray-400 tracking-wider">Етап гри</p>
            <h3 id="stage-label" className="text-sm font-bold font-mono text-white tracking-wide uppercase">
              {gameState.stage ? gameState.stage : "OFFLINE"}
            </h3>
          </div>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
      </div>

      {/* Blinds panel */}
      <div 
        className="p-4 rounded-xl dashboard-item flex items-center justify-between shadow-lg animate-slide-up"
        style={{ animationDelay: '150ms' }}
      >
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-[10px] uppercase font-mono text-gray-400 tracking-wider">Поточні блайнди</p>
            <h3 id="blinds-label" className="text-sm font-bold font-mono text-white tracking-wide">
              {gameState.current_blinds ? gameState.current_blinds : "10/20"}
            </h3>
            {/* Blind Level Sparkline Dots */}
            <div className="flex gap-1 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full transition-all ${level >= 1 ? 'bg-emerald-400' : 'bg-gray-700'}`} />
              <span className={`w-1.5 h-1.5 rounded-full transition-all ${level >= 2 ? 'bg-emerald-400 shadow-[0_0_5px_#10b981]' : 'bg-gray-700'}`} />
              <span className={`w-1.5 h-1.5 rounded-full transition-all ${level >= 3 ? 'bg-emerald-400 shadow-[0_0_5px_#10b981]' : 'bg-gray-700'}`} />
              <span className={`w-1.5 h-1.5 rounded-full transition-all ${level >= 4 ? 'bg-emerald-400 shadow-[0_0_5px_#10b981]' : 'bg-gray-700'}`} />
            </div>
          </div>
        </div>
        <span className="text-xs font-mono bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/30 font-bold">LEVEL {level}</span>
      </div>

      {/* Blinds timer/hands counter panel */}
      <div 
        className="p-4 rounded-xl dashboard-item flex items-center justify-between shadow-lg animate-slide-up"
        style={{ animationDelay: '250ms' }}
      >
        <div className="flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-[10px] uppercase font-mono text-gray-400 tracking-wider">Роздач до зростання блайндів</p>
            <h3 id="blinds-timer-label" className="text-sm font-bold font-mono text-white tracking-wide">
              {gameState.blinds_timer !== undefined ? gameState.blinds_timer : 5}
            </h3>
          </div>
        </div>
        <div className="relative w-6 h-6">
          <svg className="w-full h-full -rotate-90">
            <circle cx="12" cy="12" r="10" className="stroke-gray-800 fill-none" strokeWidth="2" />
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              className="stroke-amber-400 fill-none transition-all duration-1000" 
              strokeWidth="2" 
              strokeDasharray="62.8"
              strokeDashoffset={62.8 * (1 - (gameState.blinds_timer !== undefined ? gameState.blinds_timer : 5) / 5)}
            />
          </svg>
        </div>
      </div>

      {/* Total Pot panel */}
      <div 
        className="p-4 rounded-xl dashboard-item flex items-center justify-between shadow-xl border border-amber-500/40 bg-amber-950/10 animate-slide-up shadow-amber-500/5 transition-all duration-300 scale-[1.02] hover:scale-[1.04]"
        style={{ animationDelay: '350ms' }}
      >
        <div className="flex items-center gap-2.5">
          <Coins className="w-5 h-5 text-amber-500 animate-bounce" style={{ animationDuration: '3s' }} />
          <div>
            <p className="text-[10px] uppercase font-mono text-gray-400 tracking-wider">Загальний Банк</p>
            <h3 id="pot-label" className="text-sm font-bold font-mono text-amber-400 tracking-wider">
              <span key={`toppot-${potAnimKey}`} className="number-roll">{displayPot > 0 ? displayPot.toLocaleString() : (gameState.total_pot || 0)}</span> 🪙
            </h3>
          </div>
        </div>
        <span className="text-xs font-mono font-bold bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/40 animate-pulse">
          POT
        </span>
      </div>

    </section>
  );
}

export default StatusBoard;
