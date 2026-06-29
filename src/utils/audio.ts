// Custom synthesized Web Audio effects to prevent loading external assets and support offline PWA usage.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

export function resumeAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    return ctx.resume();
  }
  return Promise.resolve();
}

// Automatically attempt to unlock AudioContext on first user interaction to bypass browser autoplay restrictions.
if (typeof window !== "undefined") {
  const unlock = () => {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === "suspended") {
        ctx.resume().then(() => {
          removeListeners();
        }).catch((err) => {
          console.warn("Failed to resume AudioContext:", err);
        });
      } else {
        removeListeners();
      }
    }
  };

  const removeListeners = () => {
    window.removeEventListener("click", unlock);
    window.removeEventListener("touchstart", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("click", unlock, { passive: true });
  window.addEventListener("touchstart", unlock, { passive: true });
  window.addEventListener("keydown", unlock, { passive: true });
}


/**
 * Synthesizes a subtle, mechanical clock "tick" or "tock"
 */
export function playTick(pitch: "tick" | "tock" = "tick") {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === "suspended") return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Very fast decay for crisp mechanical sound
  const freq = pitch === "tick" ? 1200 : 900;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.04);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

/**
 * Synthesizes a beautiful Zen temple chime/bell
 */
export function playChime() {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === "suspended") return;

  const now = ctx.currentTime;
  
  // Layer multiple oscillators for a rich harmonic chime
  const frequencies = [261.63, 329.63, 392.00, 523.25]; // C major chord harmonics
  const volumes = [0.15, 0.1, 0.08, 0.05];

  frequencies.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Deep chime with long release
    const vol = volumes[index];
    const duration = 2.5 - index * 0.4; // higher harmonics decay faster

    gainNode.gain.setValueAtTime(vol, now);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + duration);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  });
}

/**
 * Synthesizes a clean toggle/selection sweep
 */
export function playModeTrigger() {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === "suspended") return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  gainNode.gain.setValueAtTime(0.05, now);
  gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.15);

  osc.start(now);
  osc.stop(now + 0.16);
}

/**
 * Synthesizes a simple buzzer/alert if the user cancels or pauses
 */
export function playPauseBeep() {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === "suspended") return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(330, now);
  osc.frequency.setValueAtTime(220, now + 0.1);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  gainNode.gain.setValueAtTime(0.04, now);
  gainNode.gain.setValueAtTime(0.04, now + 0.1);
  gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.2);

  osc.start(now);
  osc.stop(now + 0.22);
}
