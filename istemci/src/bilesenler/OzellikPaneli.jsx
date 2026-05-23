import React from 'react'
import { CIZIM_RENKLERI, DOLGU_RENKLERI } from '../yardimcilar/renkler.js'
import './OzellikPaneli.css'

// ozellikler paneli
export default function OzellikPaneli({
  seciliOge,
  stil,
  stilGuncelle,
  seciliOgeGuncelle,
  seciliOgeSil,
  seciliArac,
}) {
  const [katlanmis, katlanmisAyarla] = React.useState(false)

  // panel kontrol
  const cizimAraciMi = ['kalem', 'dikdortgen', 'elips', 'cizgi', 'ok', 'metin', 'baklava'].includes(seciliArac)
  const gosterilsinMi = seciliOge || cizimAraciMi

  if (!gosterilsinMi) return null

  if (katlanmis) {
    return (
      <button
        type="button"
        className="ozellik-paneli-tetikleyici cam-panel"
        onClick={() => katlanmisAyarla(false)}
        title={seciliOge ? 'Öğe Özelliklerini Göster' : 'Çizim Stilini Göster'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>
    )
  }

  // mevcut degerler
  const mevcutCizgiRengi = seciliOge ? seciliOge.cizgiRengi : stil.cizgiRengi
  const mevcutCizgiKalinligi = seciliOge ? seciliOge.cizgiKalinligi : stil.cizgiKalinligi
  const mevcutDolguRengi = seciliOge ? seciliOge.dolguRengi : stil.dolguRengi
  const mevcutOpaklık = seciliOge ? (seciliOge.opaklık ?? 1) : (stil.opaklık ?? 1)

  // cizgi rengi
  const cizgiRengiDegistir = (renk) => {
    if (seciliOge) {
      seciliOgeGuncelle({ cizgiRengi: renk })
    }
    stilGuncelle({ cizgiRengi: renk })
  }

  // cizgi kalinligi
  const cizgiKalinligiDegistir = (deger) => {
    const kalinlik = parseInt(deger)
    if (seciliOge) {
      seciliOgeGuncelle({ cizgiKalinligi: kalinlik })
    }
    stilGuncelle({ cizgiKalinligi: kalinlik })
  }

  // dolgu rengi
  const dolguRengiDegistir = (renk) => {
    if (seciliOge) {
      seciliOgeGuncelle({ dolguRengi: renk })
    }
    stilGuncelle({ dolguRengi: renk })
  }

  // opaklik
  const opaklikDegistir = (deger) => {
    const opaklık = parseFloat(deger)
    if (seciliOge) {
      seciliOgeGuncelle({ opaklık })
    }
    stilGuncelle({ opaklık })
  }

  return (
    <div className="ozellik-paneli cam-panel">
      <div className="panel-baslik">
        <span className="panel-baslik-metin">
          {seciliOge ? 'Öğe Özellikleri' : 'Çizim Stili'}
        </span>
        <button type="button" className="panel-kapat-dugme" onClick={() => katlanmisAyarla(true)} title="Gizle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* cizgi rengi */}
      <div className="panel-bolum">
        <label className="bolum-etiket">Çizgi Rengi</label>
        <div className="renk-izgarasi">
          {CIZIM_RENKLERI.map((renk) => (
            <button
              key={renk.deger}
              className={`renk-dugme ${mevcutCizgiRengi === renk.deger ? 'secili' : ''}`}
              style={{ background: renk.deger }}
              onClick={() => cizgiRengiDegistir(renk.deger)}
              title={renk.ad}
            />
          ))}
        </div>
      </div>

      {/* cizgi kalinligi */}
      <div className="panel-bolum">
        <label className="bolum-etiket">
          Çizgi Kalınlığı
          <span className="deger-etiketi">{mevcutCizgiKalinligi}px</span>
        </label>
        <input
          type="range"
          min="1"
          max="8"
          value={mevcutCizgiKalinligi}
          onChange={(e) => cizgiKalinligiDegistir(e.target.value)}
          className="kaydirici"
        />
      </div>

      {/* dolgu rengi */}
      <div className="panel-bolum">
        <label className="bolum-etiket">Dolgu Rengi</label>
        <div className="renk-izgarasi">
          {DOLGU_RENKLERI.map((renk) => (
            <button
              key={renk.deger}
              className={`renk-dugme dolgu-dugme ${mevcutDolguRengi === renk.deger ? 'secili' : ''} ${renk.deger === 'transparent' ? 'seffaf' : ''}`}
              style={{ background: renk.deger === 'transparent' ? undefined : renk.deger }}
              onClick={() => dolguRengiDegistir(renk.deger)}
              title={renk.ad}
            />
          ))}
        </div>
      </div>

      {/* opaklik */}
      <div className="panel-bolum">
        <label className="bolum-etiket">
          Opaklık
          <span className="deger-etiketi">{Math.round(mevcutOpaklık * 100)}%</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={mevcutOpaklık}
          onChange={(e) => opaklikDegistir(e.target.value)}
          className="kaydirici"
        />
      </div>

      {/* sil */}
      {seciliOge && (
        <div className="panel-bolum">
          <button className="sil-dugme" onClick={seciliOgeSil}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            <span>Öğeyi Sil</span>
          </button>
        </div>
      )}
    </div>
  )
}
