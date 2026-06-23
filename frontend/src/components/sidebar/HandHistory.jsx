import { History, ChevronRight, Crown } from 'lucide-react';

const HandHistory = ({ handHistory, showHandHistory, setShowHandHistory }) => {
  return (
    <div className="bg-[#0b0c10]/80 border-b border-gray-850/80 shrink-0">
      <button
        id="hand-history-toggle"
        onClick={() => setShowHandHistory(!showHandHistory)}
        className="w-full px-4 py-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest font-mono text-purple-400 hover:bg-purple-950/20 transition-all"
      >
        <div className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" />
          <span>Історія роздач ({handHistory.length})</span>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${showHandHistory ? 'rotate-90' : ''}`} />
      </button>
      
      <div 
        className={`overflow-y-auto transition-all duration-500 ease-in-out ${
          showHandHistory ? 'max-h-[200px] opacity-100 px-3 pb-3 space-y-1.5' : 'max-h-0 opacity-0 px-3 py-0 pointer-events-none'
        }`}
      >
        {handHistory.length === 0 ? (
          <div className="text-center text-gray-600 text-[10px] py-3 font-mono">
            Ще жодної завершеної роздачі...
          </div>
        ) : (
          handHistory.map((hand, hIdx) => (
            <div 
              key={hand.id} 
              className="hand-history-item bg-black/40 border border-gray-900/50 rounded-lg p-2.5 text-[10px] font-mono hover:bg-purple-950/15 hover:border-purple-500/35 hover:shadow-[0_4px_12px_rgba(168,85,247,0.1)] transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer" 
              style={{ animationDelay: `${hIdx * 50}ms` }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  {hand.winner} {hand.combo && <span className="text-[9px] font-normal text-amber-500/80">({hand.combo})</span>}
                </span>
                <span className="text-gray-500">{hand.timestamp}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">
                  <span className="text-gray-500">Борд:</span> {hand.board || '—'}
                </span>
                <span className="text-amber-500 font-bold">🪙 {hand.pot}</span>
              </div>
              <div className="text-gray-500 mt-0.5">Блайнди: {hand.blinds}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HandHistory;
