import { RotateCcw, Play, Pause, ChevronRight, Volume1, Volume2, VolumeX, Sparkles, RefreshCw } from 'lucide-react';
import { THEME_CONFIGS } from '../../lib/constants';

function Header({
  theme, setTheme, currentThemeConfig,
  serverIP, setServerIP, handleReconnect,
  connectionStatus, isAutoReconnecting, reconnectAttempt, maxReconnectAttempts,
  isMuted, setIsMuted, volume, setVolume,
  isSimulating, toggleSimulation, handleNextSimStep,
  addLog, playSound
}) {
  return (
    <header className="w-full flex flex-col gap-4 mb-6 z-10 glass-header p-4 md:p-5 rounded-2xl border border-white/10 shadow-2xl">
      {/* ROW 1: Brand logo/title and Theme selector */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full border-b border-gray-900/45 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr flex items-center justify-center shadow-lg ${theme === 'classic' ? 'from-emerald-700 to-amber-500 shadow-amber-500/25' : 'from-fuchsia-500 to-cyan-500 shadow-fuchsia-500/25'}`}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
          </div>
          <div>
            <h1 id="main-title" className={`text-xl font-black tracking-widest bg-gradient-to-r ${currentThemeConfig.titleGradient} bg-clip-text text-transparent uppercase font-sans italic`}>
              POKER ARENA
            </h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-widest">5-MAX AI TOURNAMENT STAGE</p>
          </div>
        </div>

        {/* Theme Switcher */}
        <div className="flex items-center gap-1 bg-black/50 border border-white/5 rounded-xl p-1 shadow-inner">
          {Object.keys(THEME_CONFIGS).map((tKey) => (
            <button
              key={tKey}
              id={`theme-btn-${tKey}`}
              type="button"
              onClick={() => {
                setTheme(tKey);
                addLog(`Тему змінено на: ${THEME_CONFIGS[tKey].name}`, 'system');
                playSound('stage');
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold font-mono uppercase transition-all duration-300 ${
                theme === tKey
                  ? tKey === 'classic'
                    ? 'bg-emerald-900/45 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] border border-emerald-500/30'
                    : tKey === 'cyber'
                    ? 'bg-cyan-900/45 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] border border-cyan-500/30'
                    : 'bg-pink-900/45 text-pink-400 shadow-[0_0_12px_rgba(236,72,153,0.25)] border border-pink-500/30'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {THEME_CONFIGS[tKey].name}
            </button>
          ))}
        </div>
      </div>

      {/* ROW 2: Connection Controls, Volume and Simulator controls */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4 w-full">
        {/* Connection block */}
        <form onSubmit={handleReconnect} className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2 bg-black/50 border border-white/5 rounded-xl px-3 py-1.5 w-full sm:w-auto shadow-inner">
            <span className="text-[10px] text-gray-500 uppercase font-mono font-bold">Server IP:</span>
            <input 
              id="server-ip-input"
              type="text" 
              value={serverIP}
              onChange={(e) => setServerIP(e.target.value)}
              className={`bg-transparent border-none outline-none font-mono text-xs w-32 placeholder-gray-750 focus:ring-0 focus:outline-none ${theme === 'classic' ? 'text-amber-300' : 'text-cyan-400'}`}
              placeholder="localhost"
            />
          </div>

          <button 
            id="reconnect-btn"
            type="submit" 
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer shrink-0 ${theme === 'classic' ? 'bg-emerald-950/50 text-amber-300 border border-amber-700/50 hover:bg-emerald-900/60 hover:border-amber-400 hover:text-white' : 'bg-cyan-950/40 text-cyan-400 border border-cyan-800/60 hover:bg-cyan-900/50 hover:border-cyan-400 hover:text-white'}`}
          >
            З'єднати
          </button>

          {/* Connection status badge */}
          <div id="conn-status-badge" className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-mono font-bold uppercase border shrink-0 ${
            connectionStatus === "CONNECTED" 
              ? "bg-emerald-950/45 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              : connectionStatus === "CONNECTING"
              ? "bg-amber-950/45 text-amber-400 border-amber-500/30 animate-pulse"
              : "bg-red-950/45 text-red-400 border-red-500/30"
          }`}>
            {connectionStatus === "CONNECTED" ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>ONLINE</span>
              </>
            ) : connectionStatus === "CONNECTING" ? (
              <>
                <RotateCcw className="w-3 h-3 text-amber-400 animate-spin" />
                <span>CONNECTING</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span>OFFLINE</span>
              </>
            )}
          </div>

          {/* Auto-reconnect indicator */}
          {isAutoReconnecting && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[9px] font-mono font-bold bg-amber-950/30 text-amber-400 border border-amber-800/25 reconnect-overlay shrink-0">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Реконнект ({reconnectAttempt}/{maxReconnectAttempts})</span>
            </div>
          )}
        </form>

        {/* Media & Simulator grouped block */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end">
          {/* Volume Group */}
          <div className="flex items-center gap-2 bg-black/50 border border-white/5 rounded-xl px-3 py-1.5 shadow-inner">
            <button
              id="sound-toggle-btn"
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="text-gray-400 hover:text-white transition-colors"
              title={isMuted ? "Увімкнути звук" : "Вимкнути звук"}
              aria-label={isMuted ? "Увімкнути звук" : "Вимкнути звук"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : volume > 0.6 ? <Volume2 className="w-4 h-4" /> : <Volume1 className="w-4 h-4" />}
            </button>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className={`w-16 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer ${theme === 'classic' ? 'accent-amber-500' : 'accent-fuchsia-500'}`}
              title="Гучність"
            />
          </div>

          {/* Simulation Group */}
          <div className="flex gap-1.5 items-center">
            <button
              id="simulation-toggle-btn"
              type="button"
              onClick={toggleSimulation}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-300 cursor-pointer ${
                isSimulating
                  ? theme === 'classic'
                    ? "bg-emerald-950/60 text-amber-300 border-amber-600/50 shadow-[0_0_15px_rgba(212,175,55,0.25)] animate-pulse"
                    : "bg-purple-950/60 text-purple-400 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.25)] animate-pulse"
                  : "bg-gray-900/40 text-gray-300 border-gray-850 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} /> : <Play className="w-3.5 h-3.5" />}
              <span>{isSimulating ? "Симуляція: ON" : "Симулятор"}</span>
            </button>

            {isSimulating && (
              <button
                id="sim-next-step-btn"
                type="button"
                onClick={handleNextSimStep}
                className="px-3 py-2 rounded-xl border border-purple-500/45 bg-purple-900/25 text-purple-300 hover:bg-purple-800/50 hover:text-white text-xs font-mono font-bold transition-all"
                title="Наступний хід симулятора"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
