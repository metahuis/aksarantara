'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Icon from './Icon.jsx';

const STORAGE_KEY = 'aksarantara_onboarded_v1';

const SLIDES = [
  {
    key: 'welcome',
    accent: '#58cc02',
    eyebrow: 'Selamat datang',
    title: (
      <>
        Suara yang <span style={{ color: '#ce82ff' }}>tak hilang</span>.
      </>
    ),
    body:
      'Aksarantara adalah arsip terbuka untuk bahasa-bahasa daerah Indonesia — direkam langsung dari penutur aslinya, tanpa terjemahan otomatis.',
    illust: 'wave',
    pills: ['Bugis', 'Massenrempulu', 'Konjo', 'Minangkabau', 'Melayu Jambi'],
  },
  {
    key: 'navigate',
    accent: '#1cb0f6',
    eyebrow: 'Cara menjelajah',
    title: (
      <>
        Empat tab, <span style={{ color: '#1cb0f6' }}>satu arsip</span>.
      </>
    ),
    body:
      'Gunakan navigasi bawah untuk berpindah antara Beranda, Arsip, Wilayah, dan Koleksi. Tombol mikrofon di tengah membawa Anda langsung ke kontribusi.',
    illust: 'nav',
  },
  {
    key: 'contribute',
    accent: '#ff4b4b',
    eyebrow: 'Berkontribusi',
    title: (
      <>
        Setiap kata punya <span style={{ color: '#ff9600' }}>penutur</span>.
      </>
    ),
    body:
      'Jika Anda penutur asli — atau mengenal seorang tetua — rekam satu kata, satu frasa, satu cerita. Setiap entri ditinjau koordinator wilayah sebelum masuk arsip.',
    illust: 'mic',
  },
];

function Illustration({ kind, accent }) {
  if (kind === 'wave') {
    const bars = [
      0.2, 0.4, 0.65, 0.85, 0.95, 0.7, 0.45, 0.6, 0.8, 0.95, 0.75, 0.5, 0.3, 0.5,
      0.7, 0.9, 0.7, 0.45, 0.3, 0.5, 0.7, 0.85, 0.6, 0.4, 0.55, 0.75, 0.9, 0.6,
      0.35, 0.5, 0.7, 0.85,
    ];
    return (
      <svg viewBox="0 0 320 140" className="ob-illust" preserveAspectRatio="none">
        {bars.map((h, i) => {
          const w = 6, gap = 4, x = i * (w + gap) + 4;
          const barH = h * 110;
          const y = (140 - barH) / 2;
          return (
            <motion.rect
              key={i}
              x={x} width={w} rx={3}
              fill={accent}
              initial={{ y: 70, height: 0 }}
              animate={{ y, height: barH }}
              transition={{
                duration: 0.5,
                delay: i * 0.025,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          );
        })}
      </svg>
    );
  }
  if (kind === 'nav') {
    return (
      <svg viewBox="0 0 320 140" className="ob-illust">
        <rect x="20" y="40" width="280" height="80" rx="40" fill="#fff" stroke="#e5e5e5" strokeWidth="2" />
        {[
          { cx: 60, label: 'home' },
          { cx: 110, label: 'arc' },
          { cx: 210, label: 'pin' },
          { cx: 260, label: 'star' },
        ].map((it, i) => (
          <motion.circle
            key={i}
            cx={it.cx} cy={80} r={4}
            fill="#777"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
          />
        ))}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 18 }}
          style={{ transformOrigin: '160px 56px' }}
        >
          <circle cx="160" cy="56" r="32" fill={accent} />
          <rect x="155" y="44" width="10" height="18" rx="5" fill="#fff" />
          <path d="M148 60 a12 12 0 0 0 24 0" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="160" y1="68" x2="160" y2="74" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </motion.g>
        <motion.path
          d="M160 96 L160 110"
          stroke={accent} strokeWidth="2" strokeLinecap="round"
          strokeDasharray="3 3"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        />
      </svg>
    );
  }
  if (kind === 'mic') {
    return (
      <svg viewBox="0 0 320 140" className="ob-illust">
        <motion.g
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: '160px 70px' }}
        >
          <motion.circle
            cx="160" cy="70" r="56"
            fill={accent} opacity="0.12"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '160px 70px' }}
          />
          <motion.circle
            cx="160" cy="70" r="40"
            fill={accent} opacity="0.22"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            style={{ transformOrigin: '160px 70px' }}
          />
          <circle cx="160" cy="70" r="28" fill={accent} />
          <rect x="153" y="56" width="14" height="22" rx="7" fill="#fff" />
          <path d="M144 74 a16 16 0 0 0 32 0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <line x1="160" y1="86" x2="160" y2="94" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </motion.g>
      </svg>
    );
  }
  return null;
}

export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const router = useRouter();

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch (e) {
      // localStorage unavailable — skip onboarding silently
    }
  }, []);

  const finish = (action) => {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
    setOpen(false);
    if (action === 'contribute') {
      setTimeout(() => router.push('/contribute'), 240);
    }
  };

  const next = () => {
    if (idx < SLIDES.length - 1) setIdx(idx + 1);
    else finish('contribute');
  };
  const prev = () => { if (idx > 0) setIdx(idx - 1); };
  const skip = () => finish('skip');

  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <AnimatePresence>
      {open && (
      <motion.div
        key="ob-backdrop"
        className="ob-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ob-title"
      >
        <motion.div
          className="ob-sheet"
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            className="ob-skip"
            onClick={skip}
            aria-label="Lewati onboarding"
          >
            Lewati
          </button>

          <div className="ob-art" style={{ '--ob-accent': slide.accent }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.key}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="ob-art-inner"
              >
                <Illustration kind={slide.illust} accent={slide.accent} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="ob-body">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${slide.key}-text`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <div className="ob-eyebrow" style={{ color: slide.accent }}>
                  <span className="ob-eyebrow-dot" style={{ background: slide.accent }} />
                  {slide.eyebrow}
                </div>
                <h2 className="ob-title" id="ob-title">{slide.title}</h2>
                <p className="ob-text">{slide.body}</p>
                {slide.pills && (
                  <div className="ob-pills">
                    {slide.pills.map((p) => (
                      <span key={p} className="ob-pill">{p}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="ob-foot">
            <div className="ob-dots" role="tablist" aria-label="Langkah onboarding">
              {SLIDES.map((s, i) => (
                <button
                  key={s.key}
                  className={`ob-dot${i === idx ? ' active' : ''}`}
                  onClick={() => setIdx(i)}
                  aria-label={`Pindah ke langkah ${i + 1}`}
                  aria-selected={i === idx}
                  role="tab"
                  style={i === idx ? { background: slide.accent } : undefined}
                />
              ))}
            </div>
            <div className="ob-actions">
              {idx > 0 && (
                <button
                  className="ob-btn ghost"
                  onClick={prev}
                  aria-label="Sebelumnya"
                >
                  Kembali
                </button>
              )}
              <button
                className="ob-btn primary"
                onClick={next}
                style={{
                  background: slide.accent,
                  boxShadow: `0 4px 0 ${slide.accent}99`,
                }}
              >
                {isLast ? (
                  <>Mulai berkontribusi <Icon name="arrow" size={16} /></>
                ) : (
                  <>Lanjut <Icon name="arrow" size={16} /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
