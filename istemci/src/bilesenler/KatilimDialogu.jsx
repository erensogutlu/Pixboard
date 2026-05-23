import React, { useState } from 'react'
import './KatilimDialogu.css'

// paylasim dialogu
export default function KatilimDialogu({ acik, kapatHandler, tahtaId }) {
  const [kopyalandi, kopyalandiAyarla] = useState(false)

  if (!acik) return null

  // kodu kopyala
  const koduKopyala = async () => {
    try {
      await navigator.clipboard.writeText(tahtaId || '')
      kopyalandiAyarla(true)
      setTimeout(() => kopyalandiAyarla(false), 2000)
    } catch (hata) {
      console.log('// kopyalama başarısız oldu')
    }
  }

  // baglantiyi kopyala
  const baglantiKopyala = async () => {
    try {
      const baglanti = `${window.location.origin}/tahta/${tahtaId}`
      await navigator.clipboard.writeText(baglanti)
      kopyalandiAyarla(true)
      setTimeout(() => kopyalandiAyarla(false), 2000)
    } catch (hata) {
      console.log('// bağlantı kopyalama başarısız oldu')
    }
  }

  return (
    <div className="dialog-arkaplan" onClick={kapatHandler}>
      <div className="dialog-icerik cam-panel" onClick={(e) => e.stopPropagation()}>
        {/* kapat butonu */}
        <button className="dialog-kapat" onClick={kapatHandler}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* baslik */}
        <div className="dialog-baslik-alani">
          <div className="paylasim-simge">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <h2 className="dialog-baslik">Tahtayı Paylaş</h2>
          <p className="dialog-aciklama">
            Bu kodu paylaşarak diğer kişilerin tahtanıza katılmasını sağlayın.
          </p>
        </div>

        {/* paylasim kodu */}
        <div className="paylasim-kod-alani">
          <label className="alan-etiketi">Tahta Kodu</label>
          <div className="kod-satiri">
            <code className="kod-metin">{tahtaId || 'Bilinmiyor'}</code>
            <button className="kopyala-dugme" onClick={koduKopyala}>
              {kopyalandi ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--basari)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* baglanti kopyala */}
        <button className="baglanti-dugme" onClick={baglantiKopyala}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          <span>{kopyalandi ? 'Kopyalandı!' : 'Bağlantıyı Kopyala'}</span>
        </button>
      </div>
    </div>
  )
}
