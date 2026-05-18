let __sharedCtx = null;
const getCtx = () => {
  if (!__sharedCtx) {
    __sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (__sharedCtx.state === 'suspended') __sharedCtx.resume();
  return __sharedCtx;
};

const hash = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

function synth(seed, duration = 1.2) {
  const ctx = getCtx();
  const now = ctx.currentTime;
  const h = hash(seed);
  const base = 180 + (h % 80);
  const master = ctx.createGain();
  master.gain.value = 0.0001;
  master.connect(ctx.destination);

  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.25, now + 0.04);
  master.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const syllables = 3 + (h % 3);
  const nodes = [];
  for (let i = 0; i < syllables; i++) {
    const t = now + (i / syllables) * duration * 0.9;
    const dur = (duration * 0.9) / syllables;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = i % 2 ? 'triangle' : 'sine';
    const pitch = base * (1 + ((h >> (i * 3)) & 0x7) * 0.05);
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * (0.85 + ((h >> i) & 3) * 0.1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
    nodes.push(osc);

    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(pitch * 2.2, t);
    g2.gain.setValueAtTime(0.0001, t);
    g2.gain.exponentialRampToValueAtTime(0.08, t + 0.03);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900 + ((h >> (i * 2)) & 0xf) * 60;
    filter.Q.value = 4;
    osc2.connect(filter).connect(g2).connect(master);
    osc2.start(t);
    osc2.stop(t + dur + 0.02);
    nodes.push(osc2);
  }

  return {
    duration,
    stop: () => nodes.forEach(n => { try { n.stop(); } catch (e) {} }),
    startedAt: now,
    ctx,
  };
}

export const audioMgr = {
  current: null,
  _htmlAudio: null,
  listeners: new Set(),
  // Call before playing any HTMLAudioElement — stops synth + previous HTML audio
  registerHtml(el) {
    if (this._htmlAudio && this._htmlAudio !== el) this._htmlAudio.pause();
    if (this.current) { this.current.handle.stop(); this.current = null; this._emit(); }
    this._htmlAudio = el;
  },
  unregisterHtml(el) {
    if (this._htmlAudio === el) this._htmlAudio = null;
  },
  play(seed, duration) {
    if (this._htmlAudio) { this._htmlAudio.pause(); this._htmlAudio = null; }
    this.stop();
    const handle = synth(seed, duration);
    this.current = { seed, handle, startTime: Date.now(), duration };
    this._emit();
    setTimeout(() => {
      if (this.current && this.current.seed === seed) {
        this.current = null;
        this._emit();
      }
    }, duration * 1000);
    return handle;
  },
  stop() {
    if (this.current) {
      this.current.handle.stop();
      this.current = null;
      this._emit();
    }
  },
  isPlaying(seed) {
    return this.current?.seed === seed;
  },
  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },
  _emit() {
    this.listeners.forEach(fn => fn(this.current));
  },
};
