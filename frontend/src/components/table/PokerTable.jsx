
import BoardCards from './BoardCards';
import PlayerSeat from './PlayerSeat';
import ShowdownOverlay from './ShowdownOverlay';
import FlyingChips from '../effects/FlyingChips';

function computePositions(gameState) {
  let sbIdx = -1;
  let bbIdx = -1;
  let dIdx = -1;

  if (gameState.players) {
    // Find SB/BB based on Pre-flop bets
    if (gameState.stage === "Pre-flop") {
      const activeBets = gameState.players
        .map((p, i) => ({ idx: i, bet: p.current_bet }))
        .filter(p => p.bet > 0)
        .sort((a, b) => a.bet - b.bet);
      if (activeBets.length >= 2) {
        sbIdx = activeBets[0].idx;
        bbIdx = activeBets[1].idx;
      } else if (activeBets.length === 1) {
        bbIdx = activeBets[0].idx;
      }
    }

    // Fallback: estimate based on first active players
    if (sbIdx === -1) {
      let activeIdxs = [];
      gameState.players.forEach((p, i) => {
        if (!p.is_busted && p.stack > 0) activeIdxs.push(i);
      });
      if (activeIdxs.length >= 2) {
        sbIdx = activeIdxs[0];
        bbIdx = activeIdxs[1];
      } else if (activeIdxs.length === 1) {
        sbIdx = activeIdxs[0];
      }
    }

    // Dealer sits counter-clockwise behind Small Blind
    let activeIdxs = [];
    gameState.players.forEach((p, i) => {
      if (!p.is_busted && p.stack > 0) activeIdxs.push(i);
    });
    if (activeIdxs.length > 0) {
      const sbPosInActive = activeIdxs.indexOf(sbIdx);
      if (sbPosInActive !== -1) {
        const dPosInActive = (sbPosInActive - 1 + activeIdxs.length) % activeIdxs.length;
        dIdx = activeIdxs[dPosInActive];
      } else {
        dIdx = activeIdxs[0];
      }
    }
  }

  return { sbIdx, bbIdx, dIdx };
}

export default function PokerTable({ gameState, setGameState, theme, currentThemeConfig, displayPot, potAnimKey, handId, flyingChips, maxStack, isSimulating, setSimStep }) {
  const { sbIdx, bbIdx, dIdx } = computePositions(gameState);

  return (
    <div className="lg:col-span-2 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 rounded-3xl glass-panel relative overflow-visible">

      <div className="absolute inset-0 bg-radial-table pointer-events-none opacity-20" />

      {/* The Poker Felt Oval Table Container */}
      <div
        className="premium-table-container w-full max-w-[1200px] min-h-[400px] aspect-[2/1] relative flex items-center justify-center overflow-visible my-auto bg-cover bg-center scale-[0.8] min-[400px]:scale-[0.88] md:scale-100 transition-all duration-300"
        style={{
          ...currentThemeConfig.feltStyle,
          backgroundSize: 'cover'
        }}
      >
        {/* Felt tint overlay */}
        <div className={`absolute inset-0 rounded-[280px] pointer-events-none ${currentThemeConfig.feltOverlay}`} />
        <div className="absolute inset-0 rounded-[280px] bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
        <div className="absolute inset-1 rounded-[278px] border-4 border-[#1f0e06]/60 shadow-[inset_0_0_35px_rgba(0,0,0,0.8)] pointer-events-none" />

        {/* Subtle center watermark */}
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-[0.07]">
          <span className="font-serif uppercase tracking-[0.5em] text-amber-200 text-xl md:text-2xl">
            AI Poker Arena
          </span>
        </div>

        {/* AI Croupier (Dealer) Character Widget */}
        <div className="absolute top-[-65px] left-1/2 -translate-x-1/2 flex flex-col items-center mb-0.5 select-none animate-fade-in z-20">
          <div className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/90 border border-amber-500/25 shadow-[0_5px_15px_rgba(0,0,0,0.5)] transition-all duration-300 ${
            gameState.stage === "Showdown" ? "border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)] scale-105" : ""
          }`}>
            {/* Glowing active state border */}
            <span className={`absolute inset-0 rounded-full border border-amber-400/30 animate-pulse pointer-events-none ${
              gameState.stage !== "Offline" && gameState.stage !== "Idle" && gameState.stage !== "Showdown" ? "" : "hidden"
            }`} />

            {/* Dealer Avatar */}
            <div className={`w-7 h-7 rounded-full overflow-hidden border border-amber-400 shadow-inner bg-gray-950 flex items-center justify-center ${
              gameState.stage !== "Offline" && gameState.stage !== "Idle" && gameState.stage !== "Showdown" ? "animate-bounce" : ""
            }`}>
              <img src="/croupier_avatar.png" alt="Croupier" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[9px] font-black font-mono text-amber-400 uppercase tracking-wider">
                Круп'є (AI Dealer)
              </span>
              <span className="text-[8px] font-mono text-gray-400 font-bold uppercase">
                {(() => {
                  if (gameState.stage === "Offline") return "Сервер офлайн";
                  if (gameState.stage === "Idle") return "Очікування гри";
                  if (gameState.stage === "Showdown") return "Роздачу завершено";
                  return `Роздаю ${gameState.stage}`;
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* BOARD CARDS & POT (Center) */}
        <BoardCards
          key={`board-${gameState.stage}-${gameState.board?.length || 0}`}
          board={gameState.board}
          theme={theme}
          displayPot={displayPot}
          potAnimKey={potAnimKey}
          gameState={gameState}
        />

        {/* RENDER 5 PLAYERS AT THEIR ASSIGNED COORDINATES */}
        {gameState.players && gameState.players.map((player, idx) => (
          <PlayerSeat
            key={`player-${idx}`}
            player={player}
            idx={idx}
            gameState={gameState}
            theme={theme}
            maxStack={maxStack}
            handId={handId}
            chipUrl={currentThemeConfig.chipUrl}
            dIdx={dIdx}
            sbIdx={sbIdx}
            bbIdx={bbIdx}
          />
        ))}

        {/* FLYING CHIPS ANIMATIONS */}
        <FlyingChips flyingChips={flyingChips} chipUrl={currentThemeConfig.chipUrl} />

        {/* Global Felt overlay lighting */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/35 pointer-events-none rounded-[300px]" />
      </div>

      {/* SHOWDOWN WINNER DISPLAY OVERLAY */}
      <ShowdownOverlay
        gameState={gameState}
        isSimulating={isSimulating}
        setSimStep={setSimStep}
        setGameState={setGameState}
      />
    </div>
  );
}
