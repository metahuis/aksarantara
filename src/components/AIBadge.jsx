'use client';

/** @param {{ variant?: 'cloud'|'device'|'outline', size?: 'sm'|'lg', label?: string }} props */
export default function AIBadge({ variant = 'cloud', size, label }) {
  const text = label ?? (variant === 'device' ? 'Gemma E2B · Perangkat' : 'Gemma 4');
  const cls = [
    'ai-badge',
    size === 'lg' ? 'lg' : '',
    variant === 'outline' ? 'outline' : '',
  ].filter(Boolean).join(' ');
  return <span className={cls}>{text}</span>;
}
