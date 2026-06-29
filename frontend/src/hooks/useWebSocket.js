import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_SERVER_IP = typeof window !== 'undefined' ? window.location.hostname : "192.168.0.100";

const buildWsUrl = (ip) => {
  const cleanIP = ip.trim();
  if (!cleanIP) return '';
  if (cleanIP.startsWith('ws://') || cleanIP.startsWith('wss://')) {
    return cleanIP;
  }
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const protocol = isHttps ? 'wss' : 'ws';
  
  // Check if it's a local IP address or localhost
  const isIpOrLocalhost = 
    cleanIP === 'localhost' || 
    cleanIP === '127.0.0.1' || 
    /^[0-9.]+$/.test(cleanIP) || 
    cleanIP.startsWith('192.168.') || 
    cleanIP.startsWith('10.') || 
    cleanIP.startsWith('172.');
    
  if (isIpOrLocalhost) {
    return `${protocol}://${cleanIP}:8080/ws`;
  } else {
    // For domains like poker.aethel.beauty, route /ws on standard port
    if (cleanIP.includes(':')) {
      return `${protocol}://${cleanIP}/ws`;
    }
    return `${protocol}://${cleanIP}/ws`;
  }
};

export function useWebSocket({ setGameState, addLog, playSound, isSimulating, prevPotRef, setPotAnimKey, animatePotCounter, lastThoughtRef, lastActionRef, lastBlindsRef }) {
  const [serverIP, setServerIP] = useState(() => {
    return localStorage.getItem('poker_server_ip') || DEFAULT_SERVER_IP;
  });
  const [connectionStatus, setConnectionStatus] = useState("DISCONNECTED");
  const [wsUrl, setWsUrl] = useState(() => buildWsUrl(serverIP));

  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [isAutoReconnecting, setIsAutoReconnecting] = useState(false);
  const reconnectTimerRef = useRef(null);
  const socketRef = useRef(null);
  const maxReconnectAttempts = 3;
  const connectWebSocketRef = useRef(null);
  const isSimulatingRef = useRef(isSimulating);

  useEffect(() => {
    isSimulatingRef.current = isSimulating;
  }, [isSimulating]);

  const connectWebSocket = useCallback((targetUrl) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    addLog(`Підключення до WebSocket: ${targetUrl}...`, 'system');
    setConnectionStatus("CONNECTING");

    try {
      const socket = new WebSocket(targetUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setConnectionStatus("CONNECTED");
        setReconnectAttempt(0);
        setIsAutoReconnecting(false);
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        addLog("Успішно підключено до ігрового сервера!", "success");
        playSound('stage');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          setGameState(prev => {
            const prevBoardLength = prev.board?.length || 0;
            const newBoardLength = data.board?.length || 0;
            if (newBoardLength > prevBoardLength) {
              playSound('card');
            }

            const prevTotalPot = prev.total_pot || 0;
            const newTotalPot = data.total_pot || 0;
            if (newTotalPot > prevTotalPot) {
              playSound('chip');
            }

            if (newTotalPot !== prevPotRef.current) {
              prevPotRef.current = newTotalPot;
              setPotAnimKey(k => k + 1);
              animatePotCounter(prevTotalPot, newTotalPot);
            }

            if (data.stage && data.stage !== prev.stage) {
              playSound('stage');
            }

            if (data.stage === "Showdown" && prev.stage !== "Showdown") {
              playSound('winner');
            }

            if (data.active_player_index !== -1 && data.players && data.players[data.active_player_index]) {
              const prevPlayerTime = prev.players?.[data.active_player_index]?.time_left;
              const newPlayerTime = data.players[data.active_player_index].time_left;
              if (newPlayerTime <= 3 && newPlayerTime > 0 && newPlayerTime !== prevPlayerTime) {
                playSound('warning');
              }
            }

            return prev;
          });

          if (data.last_thought && data.last_thought !== lastThoughtRef.current) {
            lastThoughtRef.current = data.last_thought;
            addLog(data.last_thought, `p${data.active_player_index}`);
          }

          if (data.last_action && data.last_action !== lastActionRef.current) {
            lastActionRef.current = data.last_action;
            addLog(data.last_action, 'success');
          }

          if (data.current_blinds && data.current_blinds !== lastBlindsRef.current) {
            if (lastBlindsRef.current !== "") {
              addLog(`📈 Рівень блайндів підвищено до: ${data.current_blinds}!`, 'stage');
              playSound('stage');
            }
            lastBlindsRef.current = data.current_blinds;
          }

          setGameState(data);
        } catch (err) {
          console.error("Error parsing WebSocket JSON:", err);
        }
      };

      socket.onerror = () => {
        setConnectionStatus("DISCONNECTED");
        addLog("Помилка WebSocket-з'єднання.", "error");
      };

      socket.onclose = () => {
        setConnectionStatus("DISCONNECTED");
        addLog("WebSocket-з'єднання було закрите.", "error");
        if (!isSimulatingRef.current) {
          setReconnectAttempt(prev => {
            const nextAttempt = prev + 1;
            if (nextAttempt <= maxReconnectAttempts) {
              const delay = Math.min(1000 * Math.pow(1.5, nextAttempt - 1), 15000);
              setIsAutoReconnecting(true);
              addLog(`🔄 Авто-реконнект через ${(delay / 1000).toFixed(1)}с... (спроба ${nextAttempt}/${maxReconnectAttempts})`, 'system');
              reconnectTimerRef.current = setTimeout(() => {
                connectWebSocketRef.current(targetUrl);
              }, delay);
            } else {
              setIsAutoReconnecting(false);
              addLog('❌ Авто-реконнект вичерпано. Підключіться вручну.', 'error');
            }
            return nextAttempt;
          });
        }
      };
    } catch (e) {
      setConnectionStatus("DISCONNECTED");
      addLog(`Не вдалося ініціювати WebSocket: ${e.message}`, "error");
    }
  }, [addLog, playSound, setGameState, prevPotRef, setPotAnimKey, animatePotCounter, lastThoughtRef, lastActionRef, lastBlindsRef]);

  useEffect(() => {
    connectWebSocketRef.current = connectWebSocket;
  }, [connectWebSocket]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (connectWebSocketRef.current) {
        connectWebSocketRef.current(wsUrl);
      }
    }, 0);
    return () => {
      clearTimeout(timer);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
      }
    };
  }, [wsUrl]);

  const handleReconnect = useCallback((e) => {
    e.preventDefault();
    const cleanIP = serverIP.trim();
    if (!cleanIP) return;

    setReconnectAttempt(0);
    setIsAutoReconnecting(false);
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    localStorage.setItem('poker_server_ip', cleanIP);
    const newUrl = buildWsUrl(cleanIP);
    setWsUrl(newUrl);
    connectWebSocketRef.current(newUrl);
  }, [serverIP]);

  const sendAdminCommand = useCallback((action, value = null) => {
    const payload = { action };
    if (value !== null) {
      payload.value = value;
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
      addLog(`[АДМІН] Надіслано команду: ${action}${value !== null ? ' x' + value : ''}`, 'success');
    } else {
      addLog(`[АДМІН] Помилка: WebSocket відключено. Не вдалося надіслати: ${action}`, 'error');
    }
  }, [addLog]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    setConnectionStatus("DISCONNECTED");
  }, []);

  return {
    serverIP, setServerIP,
    connectionStatus,
    isAutoReconnecting, reconnectAttempt, maxReconnectAttempts,
    handleReconnect, sendAdminCommand, disconnectSocket
  };
}
