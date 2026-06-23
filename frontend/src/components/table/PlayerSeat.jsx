import Card from '../cards/Card';
import CardBack from '../cards/CardBack';
import { Coins, Zap, Sparkles, Crown, ShieldAlert, Cpu } from 'lucide-react';
import { AVATAR_STYLING, AVATAR_STYLING_CLASSIC } from '../../lib/constants';

const SEAT_LAYOUT_CONFIGS = [
  { // Seat 0: Top-Left
    coords: "top-[2%] left-[10%] sm:left-[16%]",
    flexClass: "flex-col-reverse",
    betChipPos: "bottom-[-30px] right-[-20px]"
  },
  { // Seat 1: Left-Middle
    coords: "top-[42%] left-[-45px] sm:left-[-55px] -translate-y-1/2",
    flexClass: "flex-row-reverse",
    betChipPos: "top-[50%] right-[-50px] -translate-y-1/2"
  },
  { // Seat 2: Bottom-Center
    coords: "bottom-[-45px] left-1/2 -translate-x-1/2",
    flexClass: "flex-col",
    betChipPos: "top-[-35px] left-1/2 -translate-x-1/2"
  },
  { // Seat 3: Right-Middle
    coords: "top-[42%] right-[-45px] sm:right-[-55px] -translate-y-1/2",
    flexClass: "flex-row",
    betChipPos: "top-[50%] left-[-50px] -translate-y-1/2"
  },
  { // Seat 4: Top-Right
    coords: "top-[2%] right-[10%] sm:right-[16%]",
    flexClass: "flex-col-reverse",
    betChipPos: "bottom-[-30px] left-[-20px]"
  }
];

function getPlayerIcon(name, isActive) {
  if (name.includes("DeepSeek")) return <Zap className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />;
  if (name.includes("Gemini")) return <Sparkles className={`w-5 h-5 ${isActive ? 'animate-spin' : ''}`} />;
  if (name.includes("GPT")) return <Crown className={`w-5 h-5 ${isActive ? 'animate-bounce' : ''}`} />;
  if (name.includes("Qwen")) return <ShieldAlert className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />;
  return <Cpu className={`w-5 h-5 ${isActive ? 'animate-pulse' : ''}`} />;
}

export default function PlayerSeat({ player, idx, gameState, theme, maxStack, handId, chipUrl, dIdx, sbIdx, bbIdx }) {
  const seatConfig = SEAT_LAYOUT_CONFIGS[idx] || SEAT_LAYOUT_CONFIGS[2];
  const isPlayerActive = gameState.active_player_index === idx;
  const avatarSet = theme === 'classic' ? AVATAR_STYLING_CLASSIC : AVATAR_STYLING;
  const avatarStyle = avatarSet[idx % avatarSet.length];
  const displayCards = player.cards && player.cards.length > 0 && player.cards.every(c => c.Rank > 0);
  const isBusted = player.stack <= 0 || player.is_busted;
  const isActiveStage = ["Pre-flop", "Flop", "Turn", "River", "Showdown"].includes(gameState.stage);
  const hasFolded = player.status === "Fold" || (isActiveStage && !displayCards && player.status !== "Winner!" && player.status !== "Revealed" && !isBusted);
  const isInactive = hasFolded || isBusted;

  // Timer glow ring calculations
  const radius = 22;
  const strokeWidth = 3;
  const dashArray = 2 * Math.PI * radius;
  const timeLeft = player.time_left !== undefined ? player.time_left : 0;
  const dashOffset = dashArray * (1 - timeLeft / 20);

  return (
    <div
      key={`player-${idx}`}
      id={`player-seat-${idx}`}
      className={`absolute z-15 flex items-center gap-2 ${seatConfig.flexClass} ${seatConfig.coords}`}
    >

      {/* Pocket cards block with Showdown Winner Glow & Dimming */}
      <div className={`flex gap-1 items-center justify-center relative min-h-[46px] md:min-h-[75px] z-10 select-none transition-all duration-500 ${
        gameState.stage === "Showdown"
          ? player.status === "Winner!"
            ? "winner-card-glow border-2 border-amber-400 scale-110 rounded-xl p-1 z-30 bg-amber-500/10"
            : "opacity-30 blur-[0.5px] scale-90"
          : ""
      }`}>

        {displayCards ? (
          player.cards.map((card, cardIdx) => {
            const pCardKey = `pcard-${handId}-${idx}-${cardIdx}-${card.Suit}${card.Rank}`;
            return (
              <div key={pCardKey} className={`deal-card-${idx}`}>
                <Card suit={card.Suit} rank={card.Rank} isFaceUp={true} theme={theme} size="sm" />
              </div>
            );
          })
        ) : hasFolded ? (
          <span className="text-[10px] text-gray-550 font-mono italic bg-black/55 px-1.5 py-0.5 rounded border border-gray-900/40">Folded</span>
        ) : isBusted ? (
          <span className="text-[10px] text-red-500/80 font-mono font-bold uppercase tracking-widest animate-pulse bg-black/55 px-1.5 py-0.5 rounded border border-red-950/20">BUSTED</span>
        ) : gameState.stage !== "Offline" ? (
          <>
            <div className={`deal-card-${idx}`} style={{ animationDelay: '0ms' }}><CardBack theme={theme} size="sm" /></div>
            <div className={`deal-card-${idx}`} style={{ animationDelay: '100ms' }}><CardBack theme={theme} size="sm" /></div>
          </>
        ) : (
          // Dimmed card backs for Offline / waiting states
          <div className="flex gap-1 opacity-20">
            <CardBack theme={theme} size="sm" />
            <CardBack theme={theme} size="sm" />
          </div>
        )}
      </div>

      {/* Player info card badge */}
      <div className={`flex flex-col items-center p-2 rounded-xl bg-black/95 border transition-all duration-300 w-28 sm:w-32 shadow-[0_10px_25px_rgba(0,0,0,0.85)] relative ${
        isPlayerActive
          ? theme === 'classic'
            ? 'border-amber-400 shadow-[0_0_16px_rgba(212,175,55,0.5)] scale-105'
            : theme === 'cyber'
            ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.45)] scale-105'
            : 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.45)] scale-105'
          : isInactive
          ? "border-gray-950 opacity-40 scale-95 grayscale"
          : "border-gray-800 hover:border-gray-650"
      }`}>

        {/* Active turn visual ping */}
        {isPlayerActive && (
          <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full animate-ping ${
            theme === 'classic' ? 'bg-amber-400' : theme === 'cyber' ? 'bg-cyan-400' : 'bg-pink-500'
          }`} />
        )}

        {/* Circular Avatar Timer Ring */}
        <div className="relative w-14 h-14 mb-1 flex items-center justify-center">

          {/* Dynamic Position Badges (D, SB, BB) */}
          {dIdx === idx && (
            <div 
              className="absolute top-[-4px] left-[-4px] z-30 w-5.5 h-5.5 rounded-full flex items-center justify-center font-mono text-[9px] font-extrabold badge-d select-none"
              style={{ animation: 'spin 8s linear infinite' }}
            >
              D
            </div>
          )}
          {sbIdx === idx && (
            <div className="absolute top-[-4px] left-[-4px] z-30 w-5.5 h-5.5 rounded-full flex items-center justify-center font-mono text-[9px] font-extrabold badge-sb select-none">
              SB
            </div>
          )}
          {bbIdx === idx && (
            <div className="absolute top-[-4px] left-[-4px] z-30 w-5.5 h-5.5 rounded-full flex items-center justify-center font-mono text-[9px] font-extrabold badge-bb select-none">
              BB
            </div>
          )}

          {isPlayerActive && (
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none scale-[1.15]">
              <circle cx="28" cy="28" r={radius} className="stroke-gray-900/50 fill-none" strokeWidth={strokeWidth} />
              <circle
                cx="28"
                cy="28"
                r={radius}
                className={`${
                  timeLeft > 10
                    ? theme === 'classic' ? 'stroke-amber-400' : theme === 'cyber' ? 'stroke-cyan-400' : 'stroke-pink-400'
                    : timeLeft > 5
                    ? 'stroke-amber-400'
                    : 'stroke-red-500 animate-pulse'
                } fill-none transition-all duration-1000 ease-linear`}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
              />
            </svg>
          )}

          {/* Avatar center */}
          <div className={`w-11 h-11 rounded-full bg-gradient-to-br border-2 flex items-center justify-center shadow-inner ${avatarStyle}`}>
            {getPlayerIcon(player.name || "", isPlayerActive)}
          </div>

          {/* Countdown text bubble */}
          {isPlayerActive && (
            <div className={`absolute bottom-[-2px] right-[-2px] bg-gray-950 border w-5 h-5 rounded-full flex items-center justify-center font-mono text-[9px] font-bold shadow-md ${
              theme === 'classic' ? 'border-amber-400 text-amber-300' : theme === 'cyber' ? 'border-cyan-500 text-cyan-400' : 'border-pink-500 text-pink-400'
            }`}>
              {timeLeft}
            </div>
          )}
        </div>

        {/* Name and Stack */}
        <span className="text-[10px] sm:text-xs font-bold font-mono tracking-wider text-gray-200 truncate max-w-full">
          {player.name}
        </span>

        <div className="flex items-center gap-1 mt-0.5 text-[10px] sm:text-xs font-mono font-semibold text-amber-500">
          <Coins className="w-3 h-3" />
          <span>{player.stack !== undefined ? player.stack.toLocaleString() : "0"}</span>
        </div>

        {/* Stack Progress Bar */}
        {(() => {
          const stackPct = maxStack > 0 ? ((player.stack || 0) / maxStack) * 100 : 0;
          const barClass = stackPct > 60 ? 'stack-bar stack-bar-healthy' : stackPct > 20 ? 'stack-bar' : 'stack-bar stack-bar-danger';
          return (
            <div className="w-full mt-1 bg-gray-900/60 rounded-full h-[3px] overflow-hidden">
              <div className={barClass} style={{ width: `${stackPct}%` }} />
            </div>
          );
        })()}

        {/* Action badge */}
        {player.status && (
          <span className={`absolute bottom-[-10px] text-[8px] font-extrabold px-2 py-0.5 rounded-full border shadow-md font-mono ${
            player.status === "Winner!"
              ? "bg-amber-950 text-amber-300 border-amber-500/50 shadow-neon-gold animate-bounce"
              : player.status === "Fold"
              ? "bg-gray-900 text-gray-550 border-gray-805"
              : player.status === "Revealed"
              ? "bg-purple-950/80 text-purple-300 border-purple-800/40"
              : "bg-cyan-955/80 text-cyan-300 border-cyan-800/40"
          }`}>
            {player.status}
          </span>
        )}

      </div>

      {/* 3D-effect floating bet chip badge */}
      {player.current_bet > 0 && (
        <div className={`absolute z-20 flex items-center gap-1 bg-black/95 border border-amber-500/35 rounded-full pl-0.5 pr-2 py-0.5 text-[10px] font-black font-mono text-amber-400 shadow-lg animate-chip-float bet-chip-entry ${seatConfig.betChipPos}`}>
          <img
            src={chipUrl}
            alt="Bet Chip"
            className="w-5 h-5 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
          />
          <span>{player.current_bet}</span>
        </div>
      )}

    </div>
  );
}
