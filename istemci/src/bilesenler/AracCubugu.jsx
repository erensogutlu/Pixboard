import React from 'react'
import { ARACLAR } from '../kancalar/kullanAraclar.js'
import './AracCubugu.css'

// arac simgeleri
const AracSimgeleri = {
  secim: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="M13 13l6 6" />
    </svg>
  ),
  kalem: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  ),
  dikdortgen: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  ),
  elips: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
    </svg>
  ),
  cizgi: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  ),
  ok: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="9 5 19 5 19 15" />
    </svg>
  ),
  metin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 7 4 4 20 4 20 7" />
      <line x1="9" y1="20" x2="15" y2="20" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  baklava: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="17" height="17" rx="1" transform="rotate(45 12 12)" />
    </svg>
  ),
  silgi: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20H7L3 16l9-9 9 9-4 4z" />
      <path d="M6.5 13.5L14.5 5.5" />
    </svg>
  ),
}

// arac cubugu
export default function AracCubugu({ seciliArac, seciliAracAyarla }) {
  return (
    <div className="arac-cubugu cam-panel">
      <div className="arac-listesi">
        {ARACLAR.map((arac) => (
          <button
            key={arac.id}
            className={`arac-dugme ipucu-sag ${seciliArac === arac.id ? 'aktif' : ''}`}
            data-ipucu={`${arac.ad} (${arac.kisayol})`}
            onClick={() => seciliAracAyarla(arac.id)}
            title={arac.ad}
          >
            {AracSimgeleri[arac.id]}
          </button>
        ))}
      </div>
    </div>
  )
}
