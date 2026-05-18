'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { audioMgr } from '../audio.js';

function upsample(data, target) {
  if (data.length >= target) return data;
  return Array.from({ length: target }, (_, i) => {
    const pos = (i / (target - 1)) * (data.length - 1);
    const lo  = Math.floor(pos);
    const hi  = Math.min(lo + 1, data.length - 1);
    return data[lo] * (1 - (pos - lo)) + data[hi] * (pos - lo);
  });
}

export default function Waveform({
  seed, data, height = 48, barWidth = 3, gap = 2,
  color = '#1cb0f6', interactive = true, duration = 1.6, animate = true,
  src = null, variant = 'bars',
  mirror = false, glow = false,
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef();
  const startRef = useRef();
  const audioRef = useRef(null);

  // Real audio path
  useEffect(() => {
    if (!src) return;
    const el = new Audio(src);
    audioRef.current = el;
    const onPlay    = () => setPlaying(true);
    const onPause   = () => setPlaying(false);
    const onEnded   = () => { setPlaying(false); setProgress(0); };
    const onTime    = () => { if (el.duration) setProgress(el.currentTime / el.duration); };
    el.addEventListener('play',       onPlay);
    el.addEventListener('pause',      onPause);
    el.addEventListener('ended',      onEnded);
    el.addEventListener('timeupdate', onTime);
    return () => {
      audioMgr.unregisterHtml(el);
      el.pause();
      el.removeEventListener('play',       onPlay);
      el.removeEventListener('pause',      onPause);
      el.removeEventListener('ended',      onEnded);
      el.removeEventListener('timeupdate', onTime);
    };
  }, [src]);

  // Simulated audio path
  useEffect(() => {
    if (src) return;
    return audioMgr.subscribe((cur) => {
      const isMe = cur?.seed === seed;
      setPlaying(isMe);
      if (!isMe) setProgress(0);
    });
  }, [seed, src]);

  useEffect(() => {
    if (src || !playing) { cancelAnimationFrame(rafRef.current); return; }
    startRef.current = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - startRef.current) / (duration * 1000));
      setProgress(p);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, duration, src]);

  const handleClick = (e) => {
    if (!interactive) return;
    e.stopPropagation();
    if (src) {
      const el = audioRef.current;
      if (!el) return;
      if (el.paused) { audioMgr.registerHtml(el); el.play(); }
      else el.pause();
    } else {
      if (audioMgr.isPlaying(seed)) audioMgr.stop();
      else audioMgr.play(seed, duration);
    }
  };

  const isMirror = mirror || variant === 'mirror';
  const bw   = isMirror ? 2   : barWidth;
  const gp   = isMirror ? 1.5 : gap;
  const mid  = height / 2;
  const bars = bw <= 2 ? upsample(data, 80) : data;
  const total = bars.length * (bw + gp);

  // Fast path — skip Framer Motion for static display waveforms.
  // When not interactive and not animated, render plain SVG rects.
  // Eliminates ~32-80 motion.rect + IntersectionObserver callbacks per instance.
  if (!interactive && !animate && !playing) {
    return (
      <svg
        viewBox={`0 0 ${total} ${height}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height, cursor: 'default', display: 'block', overflow: 'visible' }}
      >
        {bars.map((v, i) => {
          if (isMirror) {
            const halfH = Math.max(2, v * (mid - 2));
            return (
              <g key={i}>
                <rect x={i*(bw+gp)} width={bw} rx={bw/2} fill={color} y={mid - halfH} height={halfH} opacity={0.85} />
                <rect x={i*(bw+gp)} width={bw} rx={bw/2} fill={color} y={mid + 1}      height={halfH} opacity={0.43} />
              </g>
            );
          }
          const h = Math.max(3, v * height);
          const y = (height - h) / 2;
          return <rect key={i} x={i*(bw+gp)} width={bw} rx={bw/2} fill={color} y={y} height={h} opacity={0.85} />;
        })}
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${total} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height, cursor: interactive ? 'pointer' : 'default', display: 'block', overflow: 'visible' }}
      onClick={handleClick}
    >
      {bars.map((v, i) => {
        const x       = i * (bw + gp);
        const isPast  = i / bars.length < progress;
        const opacity = playing ? (isPast ? 1 : 0.25) : 0.85;

        if (isMirror) {
          const halfH = Math.max(2, v * (mid - 2));
          return (
            <g key={i}>
              {/* top arm */}
              <motion.rect
                x={x} width={bw} rx={bw / 2} fill={color}
                initial={animate ? { height: 0, y: mid, opacity: 0 } : false}
                whileInView={animate ? { height: halfH, y: mid - halfH, opacity } : undefined}
                animate={{ opacity }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.006, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* bottom arm (mirror) */}
              <motion.rect
                x={x} width={bw} rx={bw / 2} fill={color}
                initial={animate ? { height: 0, y: mid, opacity: 0 } : false}
                whileInView={animate ? { height: halfH, y: mid + 1, opacity: opacity * 0.5 } : undefined}
                animate={{ opacity: opacity * 0.5 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: i * 0.006, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </g>
          );
        }

        const h = Math.max(3, v * height);
        const y = (height - h) / 2;
        return (
          <motion.rect
            key={i}
            x={x} width={bw} rx={bw / 2} fill={color}
            style={{ filter: glow && isPast ? `drop-shadow(0 0 4px ${color}aa)` : 'none' }}
            initial={animate ? { height: 2, y: mid - 1, opacity: 0 } : false}
            whileInView={animate ? { height: h, y, opacity } : undefined}
            animate={{ opacity }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: i * 0.008, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        );
      })}
    </svg>
  );
}
