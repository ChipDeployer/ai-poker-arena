import { useEffect, useState, useCallback } from 'react';
import SoundSynth from '../lib/sounds';

export function useSoundEngine() {
  const [soundSynth] = useState(() => new SoundSynth());

  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('poker_muted') === 'true';
  });

  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('poker_volume');
    return saved !== null ? Number(saved) : 0.5;
  });

  useEffect(() => {
    soundSynth.setMuted(isMuted);
    localStorage.setItem('poker_muted', isMuted);
  }, [isMuted, soundSynth]);

  useEffect(() => {
    soundSynth.setVolume(volume);
    localStorage.setItem('poker_volume', volume);
  }, [volume, soundSynth]);

  const play = useCallback((type) => soundSynth.play(type), [soundSynth]);

  return { play, isMuted, setIsMuted, volume, setVolume };
}
