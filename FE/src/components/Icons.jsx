/**
 * Small hand-drawn line icons, kept in one place so every icon in the app
 * shares the same stroke width and visual weight. Deliberately not Lucide —
 * that's the icon set every AI-generated frontend reaches for by default.
 */
const base = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconWifi({ className }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M3 7.5c3.9-3.6 10.1-3.6 14 0" />
      <path d="M5.8 10.6c2.4-2.1 6-2.1 8.4 0" />
      <path d="M8.4 13.6c1-.9 2.2-.9 3.2 0" />
      <circle cx="10" cy="16.2" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconWifiOff({ className }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M3 7.9c1.6-1.5 3.6-2.4 5.7-2.8" />
      <path d="M17 7.9a12.3 12.3 0 0 0-2.9-2" />
      <path d="M5.8 11c1-.9 2.2-1.5 3.4-1.7" />
      <path d="M14.2 11c-.4-.3-.8-.6-1.2-.9" />
      <path d="M8.4 13.9c1-.9 2.2-.9 3.2 0" />
      <circle cx="10" cy="16.4" r="0.9" fill="currentColor" stroke="none" />
      <path d="M3 3l14 14" />
    </svg>
  )
}

export function IconCheck({ className }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  )
}

export function IconX({ className }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  )
}

export function IconClock({ className }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="7.2" />
      <path d="M10 6.2V10l2.6 1.6" />
    </svg>
  )
}

export function IconRefresh({ className }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M15.5 6.5A6 6 0 1 0 16.8 11" />
      <path d="M15.2 3.2v3.6h-3.6" />
    </svg>
  )
}

export function IconAlert({ className }) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M10 3.5l7.5 13H2.5z" />
      <path d="M10 8.2v3.4" />
      <path d="M10 14.4h.01" strokeWidth="2.2" />
    </svg>
  )
}