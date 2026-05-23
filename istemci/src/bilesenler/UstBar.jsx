import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import './UstBar.css'

// üst bar bileşeni
export default function UstBar({
  tahtaBasligi,
  baglandi,
  kullanicilar,
  gorunumDurumu,
  yakinlastirmaAyarla,
  ekranaSigdir,
  geriAl,
  yenidenYap,
  gecmisRef,
  gelecekRef,
  tahtaVerisiDisa,
  paylasimKodu,
  paylasimDialogAc,
}) {
  const navigate = useNavigate()
  const yakinlastirmaYuzdesi = Math.round(gorunumDurumu.yakinlastirma * 100)

  const [cikisOnayAcik, cikisOnayAcikAyarla] = useState(false)

  // güvenli çıkış yap
  const guvenliCikis = () => {
    cikisOnayAcikAyarla(true)
  }

  const guvenliCikisOnayla = () => {
    localStorage.removeItem('pixboard_token')
    localStorage.removeItem('pixboard_kullanici_adi')
    sessionStorage.clear()
    window.location.href = '/'
  }

  // yakınlaştırma butonları
  const yakinlastir = () => yakinlastirmaAyarla(gorunumDurumu.yakinlastirma + 0.1)
  const uzaklastir = () => yakinlastirmaAyarla(gorunumDurumu.yakinlastirma - 0.1)

  // png olarak dışa aktar
  const pngDisa = () => {
    if (tahtaVerisiDisa) tahtaVerisiDisa()
  }

  return (
    <div className="ust-bar cam-panel">
      {/* sol kısım — logo ve başlık */}
      <div className="ust-bar-sol">
        <div className="logo-alani" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} title="Panolara Dön (Çıkış yapmadan)">
          <div className="logo-simge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="url(#logo-gradient)" />
              <path d="M7 8h10M7 12h6M7 16h8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="logo-gradient" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#7c5cff" />
                  <stop offset="1" stopColor="#00d4aa" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="logo-metin">Pixboard</span>
        </div>

        {tahtaBasligi && (
          <>
            <div className="ayirici-dikey" />
            <span className="tahta-basligi">{tahtaBasligi}</span>
          </>
        )}

        {/* bağlantı durumu */}
        <div className={`baglanti-durumu ${baglandi ? 'bagli' : 'kopuk'}`}>
          <div className="baglanti-noktasi" />
          <span>{baglandi ? 'Bağlı' : 'Bağlantı Kesildi'}</span>
        </div>
      </div>

      {/* orta kısım — yakınlaştırma */}
      <div className="ust-bar-orta">
        <button className="yakinlastirma-dugme" onClick={uzaklastir} title="Uzaklaştır">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <span className="yakinlastirma-yuzde">{yakinlastirmaYuzdesi}%</span>

        <button className="yakinlastirma-dugme" onClick={yakinlastir} title="Yakınlaştır">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <button className="yakinlastirma-dugme sigdir-dugme" onClick={ekranaSigdir} title="Ekrana Sığdır">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
          </svg>
        </button>
      </div>

      {/* sağ kısım — butonlar ve kullanıcılar */}
      <div className="ust-bar-sag">
        {/* geri al / yeniden yap */}
        <div className="islem-grubu">
          <button
            className="islem-dugme"
            onClick={geriAl}
            disabled={gecmisRef?.current?.length === 0}
            title="Geri Al (Ctrl+Z)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
          </button>

          <button
            className="islem-dugme"
            onClick={yenidenYap}
            disabled={gelecekRef?.current?.length === 0}
            title="Yeniden Yap (Ctrl+Shift+Z)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>

        {/* dışa aktar */}
        <button className="islem-dugme" onClick={pngDisa} title="PNG Olarak Dışa Aktar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>

        {/* paylaşım */}
        {paylasimKodu && (
          <button className="islem-dugme" onClick={paylasimDialogAc} title="Tahtayı Paylaş">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        )}

        {/* Güvenli Çıkış */}
        <button className="islem-dugme cikis-dugme" onClick={guvenliCikis} title="Güvenli Çıkış Yap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>

        {/* kullanıcılar */}
        {kullanicilar && kullanicilar.length > 0 && (
          <div className="kullanici-listesi">
            {kullanicilar.slice(0, 5).map((kullanici, indeks) => (
              <div
                key={kullanici.soketId || indeks}
                className="kullanici-avatar"
                style={{
                  background: kullanici.renk || '#7c5cff',
                  zIndex: kullanicilar.length - indeks,
                }}
                title={kullanici.kullaniciAdi || 'Kullanıcı'}
              >
                {(kullanici.kullaniciAdi || 'K')[0].toUpperCase()}
              </div>
            ))}
            {kullanicilar.length > 5 && (
              <div className="kullanici-avatar daha-fazla">
                +{kullanicilar.length - 5}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Güvenli Çıkış Onay Modalı */}
      {cikisOnayAcik && createPortal(
        <div className="modal-arkaplan" onClick={() => cikisOnayAcikAyarla(false)}>
          <div className="modal-icerik cam-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-baslik">Güvenli Çıkış</h2>
            <p className="modal-aciklama">
              Hesabınızdan ve tahtadan güvenli çıkış yapmak istediğinize emin misiniz?
            </p>
            <div className="modal-eylemler">
              <button
                className="modal-dugme iptal"
                onClick={() => cikisOnayAcikAyarla(false)}
              >
                İptal
              </button>
              <button
                className="modal-dugme onayla"
                onClick={guvenliCikisOnayla}
                style={{ background: 'linear-gradient(135deg, #7c5cff 0%, #00d4aa 100%)', boxShadow: '0 4px 15px rgba(124, 92, 255, 0.2)' }}
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
