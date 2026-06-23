import { Terminal, Trash2, Copy, Crown, Cpu } from 'lucide-react';
import { parseLogMessage } from '../../lib/utils';

const ThoughtStream = ({ logs, clearLogs, terminalContainerRef, connectionStatus }) => {
  return (
    <>
      {/* AI THOUGHT STREAM HEADER */}
      <div className="bg-[#0b0c10]/90 border-b border-gray-855/80 px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono text-emerald-400">
            AI Thought Stream
          </span>
        </div>
        
        <div className="flex gap-2">
          <button 
            id="clear-terminal-btn"
            onClick={clearLogs} 
            className="p-1 rounded text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title="Очистити лог"
            aria-label="Очистити лог"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          
          <button 
            id="copy-terminal-btn"
            onClick={() => {
              const logText = logs.map(l => `[${l.timestamp}] ${l.text}`).join('\n');
              navigator.clipboard.writeText(logText);
            }}
            className="p-1 rounded text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            title="Скопіювати лог"
            aria-label="Скопіювати лог"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal console */}
      <div className="relative flex-grow overflow-hidden flex flex-col min-h-0 bg-black/90">
        <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-black to-transparent pointer-events-none z-10 opacity-80" />
        <div ref={terminalContainerRef} className="flex-grow p-4 overflow-y-auto font-mono text-xs leading-relaxed space-y-3 pt-6">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-gray-650 h-full">
              <Terminal className="w-8 h-8 mb-2 stroke-1 text-gray-700" />
              <p className="text-xs">Лог думок порожній.</p>
              <p className="text-[10px] text-gray-750">Очікування ходів ШІ-моделей...</p>
            </div>
          ) : (
            logs.map((log) => {
              const parsed = parseLogMessage(log.text);
              if (!parsed) return null;

              if (parsed.type === 'separator') {
                return (
                  <div key={log.id} className="flex items-center justify-center my-4 animate-fade-in">
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent flex-grow" />
                    <span className="px-2.5 py-0.5 bg-black/50 border border-gray-850 rounded-md text-[9px] text-gray-400 uppercase tracking-widest font-mono">
                      {parsed.text}
                    </span>
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent flex-grow" />
                  </div>
                );
              }

              if (parsed.type === 'winner') {
                return (
                  <div key={log.id} className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-3 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.1)] flex items-start gap-2 animate-pulse">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                    <div className="text-[11px] font-mono leading-relaxed">
                      <span className="font-extrabold uppercase tracking-widest block text-amber-400 mb-0.5 text-[9px]">ПЕРЕМОЖЕЦЬ РОЗДАЧІ</span>
                      {parsed.text}
                    </div>
                  </div>
                );
              }

              if (parsed.type === 'thought') {
                return (
                  <div key={log.id} className="flex flex-col bg-gray-950/60 border border-cyan-950/30 rounded-lg p-2.5 space-y-1 animate-fade-in">
                    <div className="flex justify-between items-center text-[9px] font-mono">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                        <Cpu className="w-3.5 h-3.5" />
                        <span>{parsed.name}</span>
                      </div>
                      <span className="text-[8px] bg-cyan-950/40 text-cyan-400 border border-cyan-850 px-1 py-0.2 rounded font-extrabold font-mono">ДУМКИ</span>
                    </div>
                    <p className="text-xs text-gray-300 italic font-sans leading-relaxed">"{parsed.content}"</p>
                  </div>
                );
              }

              if (parsed.type === 'action') {
                const actVal = parsed.content;
                const isFold = actVal.startsWith('FOLD');
                const isRaise = actVal.startsWith('RAISE') || actVal.startsWith('BET');
                
                return (
                  <div key={log.id} className="flex items-center justify-between bg-black/40 border border-gray-900/60 rounded-lg p-2 text-xs font-mono animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-650 font-black">➔</span>
                      <span className="text-gray-350 font-bold">{parsed.name}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${
                      isFold ? 'bg-red-955/50 text-red-400 border-red-900/30' :
                      isRaise ? 'bg-amber-955/50 text-amber-400 border-amber-900/30' :
                      'bg-emerald-950/50 text-emerald-400 border-emerald-900/30'
                    }`}>
                      {parsed.content}
                    </span>
                  </div>
                );
              }

              // Default fallback
              let colClass = "text-gray-500";
              if (log.type === 'success') colClass = "text-emerald-400";
              if (log.type === 'error') colClass = "text-red-400";

              return (
                <div key={log.id} className={`flex gap-1.5 items-start font-mono text-xs ${colClass}`}>
                  <span className="text-gray-650 select-none">[{log.timestamp}]</span>
                  <span>{parsed.content}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="bg-[#0b0c10]/90 border-t border-gray-850/80 px-4 py-2 flex items-center justify-between text-[10px] text-gray-500 font-mono shrink-0">
        <span>Логів: {logs.length}</span>
        <span>Стрім: {connectionStatus}</span>
      </div>
    </>
  );
};

export default ThoughtStream;
