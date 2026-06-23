import Card from '../cards/Card';
import CardPlaceholder from '../cards/CardPlaceholder';
import { Coins } from 'lucide-react';

export default function BoardCards({ board, theme, displayPot, potAnimKey, gameState }) {
  return (
    <div id="board-center-cards" className="flex flex-col items-center gap-3.5 z-10 px-4 transform translate-y-[-10px]">

      {/* Total Pot display centered on Felt - ANIMATED */}
      <div className="flex items-center gap-2 bg-black/90 border border-amber-500/30 rounded-full px-5 py-1.5 shadow-lg select-none">
        <Coins key={`chip-${potAnimKey}`} className="w-4 h-4 text-amber-500 pot-chip-anim" />
        <span className="text-[10px] uppercase font-mono text-gray-400 font-bold tracking-wider">Pot:</span>
        <span key={`pot-${potAnimKey}`} className="text-base font-black font-mono text-amber-400 number-roll">
          {displayPot > 0 ? displayPot.toLocaleString() : (gameState.total_pot || 0)}
        </span>
      </div>

      {/* Shared Board Cards */}
      <div className="flex gap-2 sm:gap-3 items-center justify-center min-h-[96px] sm:min-h-[128px] p-2.5 sm:p-3.5 bg-black/60 rounded-2xl border border-white/5 backdrop-blur-md shadow-inner">
        {[0, 1, 2, 3, 4].map((index) => {
          const card = board && board[index];
          if (card) {
            const boardCardKey = `board-c-${index}-${card.Suit}${card.Rank}`;
            return (
              <div key={boardCardKey} className="deal-card-board" style={{ animationDelay: `${index * 100}ms` }}>
                <Card suit={card.Suit} rank={card.Rank} isFaceUp={true} theme={theme} />
              </div>
            );
          } else {
            return <CardPlaceholder key={`empty-board-${index}`} index={index} />;
          }
        })}
      </div>
    </div>
  );
}
