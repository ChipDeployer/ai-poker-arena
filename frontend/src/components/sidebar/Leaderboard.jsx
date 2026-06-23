import { Award } from 'lucide-react';

const Leaderboard = ({ players, activePlayerIndex, stage, theme }) => {
  return (
    <div className="bg-[#0b0c10]/70 border-b border-gray-850/80 p-4 shrink-0">
      <h3 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
        <Award className="w-4 h-4 text-amber-400" />
        Статус Гравців
      </h3>
      <div className="space-y-1.5 max-h-[170px] overflow-y-auto pr-1">
        {players && players.map((p, idx) => {
          const isPlayerActive = activePlayerIndex === idx;
          const isBusted = p.stack <= 0 || p.is_busted;
          const displayCards = p.cards && p.cards.length > 0;
          const hasFolded = p.status === "Fold" || (stage !== "Pre-flop" && !displayCards && p.status !== "Winner!" && p.status !== "Revealed" && stage !== "Offline" && !isBusted);
          
          let rowBg = "bg-black/30 border-gray-900/50 text-gray-400";
          if (isPlayerActive) {
            rowBg = theme === 'classic' ? 'bg-emerald-950/20 border-emerald-500/30 text-white' : theme === 'cyber' ? 'bg-cyan-950/20 border-cyan-500/30 text-white' : 'bg-pink-950/20 border-pink-500/30 text-white';
          } else if (isBusted) {
            rowBg = "bg-black/10 border-red-950/10 text-gray-600 line-through opacity-40";
          } else if (hasFolded) {
            rowBg = "bg-black/25 border-gray-955 text-gray-550";
          }

          return (
            <div 
              key={`leaderboard-${idx}`}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${rowBg}`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isPlayerActive 
                    ? theme === 'classic' ? 'bg-emerald-400 animate-ping' : theme === 'cyber' ? 'bg-cyan-400 animate-ping' : 'bg-pink-400 animate-ping'
                    : isBusted ? 'bg-red-805' : hasFolded ? 'bg-gray-700' : 'bg-emerald-500/60'
                }`} />
                <span className="font-bold">{p.name}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-amber-500 font-bold">{p.stack !== undefined ? p.stack.toLocaleString() : "0"} 🪙</span>
                <span className="text-[9px] text-gray-550 font-extrabold uppercase scale-90">
                  {isBusted ? 'Bust' : hasFolded ? 'Fold' : isPlayerActive ? 'Think' : 'Active'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Leaderboard;
