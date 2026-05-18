'use client';
import {
  HiXMark,
  HiArrowRight,
  HiArrowDownTray,
  HiMicrophone,
  HiCheck,
  HiMapPin,
  HiChevronDown,
  HiChevronUp,
  HiBars3,
  HiPlay,
  HiPause,
  HiInformationCircle,
  HiMagnifyingGlass,
  HiHome,
  HiArchiveBox,
  HiStar,
  HiUser,
  HiCog6Tooth,
  HiArrowUpTray,
  HiArrowLongRight,
  HiBookOpen,
  HiOutlineBookOpen,
} from 'react-icons/hi2';

// Map name → component reference (NOT a JSX element).
// Previously the old code built an `iconMap` object with 25 instantiated JSX
// elements on *every render call*, even for icons not being used. This version
// only instantiates the single icon component that is actually requested.
// It also lets bundlers tree-shake unused icon imports.
const ICON_MAP = {
  'close':         HiXMark,
  'arrow':         HiArrowRight,
  'arrow-long':    HiArrowLongRight,
  'download':      HiArrowDownTray,
  'mic':           HiMicrophone,
  'check':         HiCheck,
  'pin':           HiMapPin,
  'pin-solid':     HiMapPin,
  'chevron-down':  HiChevronDown,
  'chevron-up':    HiChevronUp,
  'menu':          HiBars3,
  'x':             HiXMark,
  'play':          HiPlay,
  'pause':         HiPause,
  'info':          HiInformationCircle,
  'info-solid':    HiInformationCircle,
  'search':        HiMagnifyingGlass,
  'home':          HiHome,
  'home-solid':    HiHome,
  'archive':       HiArchiveBox,
  'archive-solid': HiArchiveBox,
  'star':          HiStar,
  'user':          HiUser,
  'settings':      HiCog6Tooth,
  'upload':        HiArrowUpTray,
  'book':          HiOutlineBookOpen,
  'book-solid':    HiBookOpen,
};

// Custom SVG icons — defined as stable functional components outside render
// so they are never re-created on every Icon call.
function WaveformIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" style={style} fill="currentColor">
      <rect x="3"  y="10" width="2" height="4"  rx="1" />
      <rect x="7"  y="6"  width="2" height="12" rx="1" />
      <rect x="11" y="3"  width="2" height="18" rx="1" />
      <rect x="15" y="7"  width="2" height="10" rx="1" />
      <rect x="19" y="10" width="2" height="4"  rx="1" />
    </svg>
  );
}
function HeartIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" style={style} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20s-8-5-8-11a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 6-8 11-8 11z"/>
    </svg>
  );
}
function ShareIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" style={style} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/>
      <path d="M8 11l8-4M8 13l8 4"/>
    </svg>
  );
}
function DotsIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" style={style} fill="currentColor" stroke="none">
      <circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>
    </svg>
  );
}
function DlIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" style={style} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>
    </svg>
  );
}
function SkipBwdIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" style={style} fill="currentColor" stroke="none">
      <path d="M19 5v14l-9-7 9-7z"/><rect x="5.5" y="5" width="2.5" height="14" rx="1"/>
    </svg>
  );
}
function SkipFwdIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" style={style} fill="currentColor" stroke="none">
      <path d="M5 5v14l9-7-9-7z"/><rect x="16" y="5" width="2.5" height="14" rx="1"/>
    </svg>
  );
}
function WaveLineIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" style={style} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M3 12h2M21 12h-2M7 8v8M11 5v14M15 8v8M19 10v4"/>
    </svg>
  );
}
function QuoteIcon({ style }) {
  return (
    <svg viewBox="0 0 24 24" style={style} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 7h4v4H7zM5 13h6V7M13 7h4v4h-4zM11 13h6V7"/>
    </svg>
  );
}

const CUSTOM_ICON_MAP = {
  'waveform':  WaveformIcon,
  'heart':     HeartIcon,
  'share':     ShareIcon,
  'dots':      DotsIcon,
  'dl':        DlIcon,
  'skip-bwd':  SkipBwdIcon,
  'skip-fwd':  SkipFwdIcon,
  'wave-line': WaveLineIcon,
  'quote':     QuoteIcon,
};

export default function Icon({ name, size = 18, style = {} }) {
  const baseStyle = {
    display: 'block',
    flexShrink: 0,
    width: size,
    height: size,
    ...style,
  };

  // Custom SVG icons (no Heroicon equivalent)
  const Custom = CUSTOM_ICON_MAP[name];
  if (Custom) return <Custom style={baseStyle} />;

  // Heroicon — only the selected component is instantiated
  const C = ICON_MAP[name] || HiXMark;
  return <C style={baseStyle} />;
}
