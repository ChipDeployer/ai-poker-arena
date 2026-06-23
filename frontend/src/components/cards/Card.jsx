import { RANK_MAP, SUIT_MAP } from '../../lib/constants';
import CardBack from './CardBack';

function Card({ suit, rank, isFaceUp = true, theme = 'classic', size = 'lg' }) {
  const isRed = SUIT_MAP[suit]?.isRed || false;
  const suitDetails = SUIT_MAP[suit] || { symbol: suit, colorClass: 'text-gray-300' };

  if (!isFaceUp) {
    return <CardBack theme={theme} size={size} />;
  }

  const displayRank = RANK_MAP[rank] || rank;

  let cardClass;
  let suitColorClass;
  let textClass;

  if (theme === 'cyber') {
    cardClass = "bg-[#0a0a0f] border-cyan-500/35 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]";
    suitColorClass = isRed ? "text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.7)]" : "text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.7)]";
    textClass = isRed ? "text-fuchsia-400" : "text-cyan-400";
  } else if (theme === 'vice') {
    cardClass = "bg-[#140a25] border-pink-500/35 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.25)]";
    suitColorClass = isRed ? "text-pink-500 drop-shadow-[0_0_5px_rgba(236,72,153,0.7)]" : "text-purple-400 drop-shadow-[0_0_5px_rgba(168,85,247,0.7)]";
    textClass = isRed ? "text-pink-500" : "text-purple-450";
  } else {
    cardClass = "bg-white border-gray-300 text-gray-900 shadow-[0_8px_16px_rgba(0,0,0,0.45)]";
    suitColorClass = isRed ? "text-red-650" : "text-gray-950";
    textClass = isRed ? "text-red-650" : "text-gray-950";
  }

  const sizeClasses = size === 'sm'
    ? "w-[30px] h-[42px] min-[400px]:w-[40px] min-[400px]:h-[56px] md:w-[52px] md:h-[73px] rounded-lg border text-[8px] md:text-xs"
    : "w-[44px] h-[62px] min-[400px]:w-[60px] min-[400px]:h-[84px] md:w-[84px] md:h-[118px] rounded-xl border-2 text-[9px] md:text-base";

  return (
    <div className={`${sizeClasses} flex flex-col justify-between p-0.5 md:p-1 relative select-none shrink-0 transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl transition-all duration-300 ${cardClass}`}>

      {/* Top Left Rank & Suit */}
      <div className="absolute top-0.5 left-0.5 flex flex-col items-center leading-none">
        <span className={`font-black font-mono leading-none ${size === 'sm' ? 'text-[7px] min-[400px]:text-[9px] md:text-[10px]' : 'text-[9px] min-[400px]:text-xs md:text-base'} ${textClass}`}>
          {displayRank}
        </span>
        <span className={`leading-none ${size === 'sm' ? 'text-[6px] min-[400px]:text-[8px] md:text-[10px]' : 'text-[8px] min-[400px]:text-[10px] md:text-xs'} ${suitColorClass}`}>
          {suitDetails.symbol}
        </span>
      </div>

      {/* Center Large Suit */}
      <div className="w-full h-full flex items-center justify-center">
        <span className={`leading-none ${size === 'sm' ? 'text-xs min-[400px]:text-base md:text-2xl' : 'text-lg min-[400px]:text-2xl md:text-4xl'} ${suitColorClass}`}>
          {suitDetails.symbol}
        </span>
      </div>

      {/* Bottom Right Rank & Suit (Inverted) */}
      <div className="absolute bottom-0.5 right-0.5 flex flex-col items-center leading-none rotate-180">
        <span className={`font-black font-mono leading-none ${size === 'sm' ? 'text-[7px] min-[400px]:text-[9px] md:text-[10px]' : 'text-[9px] min-[400px]:text-xs md:text-base'} ${textClass}`}>
          {displayRank}
        </span>
        <span className={`leading-none ${size === 'sm' ? 'text-[6px] min-[400px]:text-[8px] md:text-[10px]' : 'text-[8px] min-[400px]:text-[10px] md:text-xs'} ${suitColorClass}`}>
          {suitDetails.symbol}
        </span>
      </div>
    </div>
  );
}

export default Card;
