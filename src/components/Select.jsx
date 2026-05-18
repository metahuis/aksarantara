'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon.jsx';
import { useMediaQuery } from '../lib/useMediaQuery.js';

export default function Select({ value, onChange, options = [], placeholder = '— Pilih —', disabled, sm }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isMobile = useMediaQuery('(max-width: 720px)');

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', fn);
    return () => document.removeEventListener('pointerdown', fn);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`cs-root${sm ? ' sm' : ''}`}>
      <button
        type="button"
        className={`cs-trigger${open ? ' open' : ''}`}
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        disabled={disabled}
      >
        <span className={selected ? 'cs-val' : 'cs-ph'}>
          {selected ? selected.label : placeholder}
        </span>
        <motion.span
          className="cs-chevron"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <Icon name="chevron-down" size={16} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && !isMobile && (
          <motion.ul
            className="cs-menu"
            role="listbox"
            initial={{ opacity: 0, y: -8, scaleY: 0.94 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.94 }}
            style={{ originY: 0 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            {options.map(opt => (
              <li key={opt.value} role="option" aria-selected={opt.value === value}>
                <button
                  type="button"
                  className={`cs-item${opt.value === value ? ' active' : ''}`}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && <Icon name="check" size={13} />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {open && isMobile && (
          <>
            <motion.div
              className="cs-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              className="cs-sheet"
              initial={{ y: 400 }}
              animate={{ y: 0 }}
              exit={{ y: 400 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 && velocity.y > 300) setOpen(false);
              }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="cs-sheet-handle" />
              <ul className="cs-menu" role="listbox" style={{ position: 'relative', boxShadow: 'none' }}>
                {options.map(opt => (
                  <li key={opt.value} role="option" aria-selected={opt.value === value}>
                    <button
                      type="button"
                      className={`cs-item${opt.value === value ? ' active' : ''}`}
                      onClick={() => { onChange(opt.value); setOpen(false); }}
                    >
                      <span>{opt.label}</span>
                      {opt.value === value && <Icon name="check" size={13} />}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
