// ==========================================
// STATEFUL SOUND SYNTHESIZER
// ==========================================
class SoundSynth {
  constructor() {
    this.audioCtx = null;
    this.volume = 0.5;
    this.muted = false;
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  setVolume(vol) {
    this.volume = Number(vol);
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
  }

  play(type) {
    if (this.muted) return;
    try {
      this.init();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gainNode = this.audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);

      if (type === 'card') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        gainNode.gain.setValueAtTime(this.volume * 0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'chip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        gainNode.gain.setValueAtTime(this.volume * 0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1900, now + 0.04);
        gain2.gain.setValueAtTime(this.volume * 0.08, now + 0.04);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.06);
        osc2.start(now + 0.04);
        osc2.stop(now + 0.1);
      } else if (type === 'stage') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(293.66, now); // D4
        osc.frequency.setValueAtTime(370.01, now + 0.06); // F#4
        osc.frequency.setValueAtTime(440.00, now + 0.12); // A4
        osc.frequency.setValueAtTime(587.33, now + 0.18); // D5
        gainNode.gain.setValueAtTime(this.volume * 0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'winner') {
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const o = this.audioCtx.createOscillator();
          const g = this.audioCtx.createGain();
          o.connect(g);
          g.connect(this.audioCtx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + idx * 0.05);
          g.gain.setValueAtTime(this.volume * 0.07, now + idx * 0.05);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.22);
          o.start(now + idx * 0.05);
          o.stop(now + idx * 0.05 + 0.22);
        });
      } else if (type === 'warning') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        gainNode.gain.setValueAtTime(this.volume * 0.1, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      }
    } catch (e) {
      console.log("Audio synthesis blocked or unsupported", e);
    }
  }
}

export default SoundSynth;
