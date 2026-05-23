import React from 'react'
import './KullaniciImlecleri.css'

// imlecler
export default function KullaniciImlecleri({ imlecler, gorunumDurumu }) {
  const imlecListesi = Object.entries(imlecler || {})

  if (imlecListesi.length === 0) return null

  return (
    <div className="imlec-katmani">
      {imlecListesi.map(([kullaniciId, veri]) => {
        // ekran koordinatlari
        const ekranX = veri.x * gorunumDurumu.yakinlastirma + gorunumDurumu.kaydirmaX
        const ekranY = veri.y * gorunumDurumu.yakinlastirma + gorunumDurumu.kaydirmaY

        return (
          <div
            key={kullaniciId}
            className="kullanici-imleci"
            style={{
              transform: `translate(${ekranX}px, ${ekranY}px)`,
            }}
          >
            {/* imlec oku */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              className="imlec-ok"
              style={{ color: veri.renk || '#7c5cff' }}
            >
              <path
                d="M5 3L19 12L12 13L9 20L5 3Z"
                fill="currentColor"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1"
              />
            </svg>

            {/* kullanici adi */}
            <div
              className="imlec-etiket"
              style={{ background: veri.renk || '#7c5cff' }}
            >
              {veri.kullaniciAdi || 'Anonim'}
            </div>
          </div>
        )
      })}
    </div>
  )
}
