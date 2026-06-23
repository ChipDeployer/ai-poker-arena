import Leaderboard from './Leaderboard';
import HandHistory from './HandHistory';
import ThoughtStream from './ThoughtStream';

const Sidebar = ({
  players,
  activePlayerIndex,
  stage,
  theme,
  handHistory,
  showHandHistory,
  setShowHandHistory,
  logs,
  clearLogs,
  terminalContainerRef,
  connectionStatus,
}) => {
  return (
    <div className="flex flex-col rounded-2xl glass-panel overflow-hidden h-full min-h-[500px]">
      
      {/* Standing Dashboard Leaderboard widget */}
      <Leaderboard
        players={players}
        activePlayerIndex={activePlayerIndex}
        stage={stage}
        theme={theme}
      />

      {/* HAND HISTORY PANEL */}
      <HandHistory
        handHistory={handHistory}
        showHandHistory={showHandHistory}
        setShowHandHistory={setShowHandHistory}
      />

      {/* AI THOUGHT STREAM */}
      <ThoughtStream
        logs={logs}
        clearLogs={clearLogs}
        terminalContainerRef={terminalContainerRef}
        connectionStatus={connectionStatus}
      />

    </div>
  );
};

export default Sidebar;
