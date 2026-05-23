import React, { useState } from 'react'
import './GirisKayit.css'

export default function GirisKayit({ onClose, onAuthSuccess }) {
  const [aktifTab, aktifTabAyarla] = useState('giris') // 'giris' veya 'kayit'
  const [kullaniciAdi, kullaniciAdiAyarla] = useState('')
  const [sifre, sifreAyarla] = useState('')
  const [sifreTekrar, sifreTekrarAyarla] = useState('')
  const [sifreGoster, sifreGosterAyarla] = useState(false)
  const [sifreTekrarGoster, sifreTekrarGosterAyarla] = useState(false)
  const [yukleniyor, yukleniyorAyarla] = useState(false)
  const [hataMesaji, hataMesajiAyarla] = useState('')
  const [basariMesaji, basariMesajiAyarla] = useState('')

  const formuGonder = async (e) => {
    e.preventDefault()
    hataMesajiAyarla('')
    basariMesajiAyarla('')

    if (!kullaniciAdi.trim() || !sifre) {
      hataMesajiAyarla('Lütfen tüm alanları doldurun.')
      return
    }

    if (aktifTab === 'kayit') {
      if (kullaniciAdi.trim().length < 3) {
        hataMesajiAyarla('Kullanıcı adı en az 3 karakter olmalıdır.')
        return
      }
      if (sifre.length < 4) {
        hataMesajiAyarla('Şifre en az 4 karakter olmalıdır.')
        return
      }
      if (sifre !== sifreTekrar) {
        hataMesajiAyarla('Şifreler eşleşmiyor.')
        return
      }
    }

    yukleniyorAyarla(true)
    const endpoint = aktifTab === 'giris' ? '/api/auth/giris' : '/api/auth/kayit'

    try {
      const yanit = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kullaniciAdi: kullaniciAdi.trim(), sifre }),
      })

      const veri = await yanit.json()

      if (!yanit.ok) {
        throw new Error(veri.mesaj || 'İşlem başarısız oldu.')
      }

      if (aktifTab === 'kayit') {
        basariMesajiAyarla('Kayıt başarılı! Giriş yapılıyor...')
        // otomatik giris
        setTimeout(() => {
          localStorage.setItem('pixboard_token', veri.token)
          localStorage.setItem('pixboard_kullanici_adi', veri.kullanici.kullaniciAdi)
          onAuthSuccess(veri.kullanici, veri.token)
          if (onClose) onClose()
        }, 1000)
      } else {
        localStorage.setItem('pixboard_token', veri.token)
        localStorage.setItem('pixboard_kullanici_adi', veri.kullanici.kullaniciAdi)
        onAuthSuccess(veri.kullanici, veri.token)
        if (onClose) onClose()
      }
    } catch (hata) {
      hataMesajiAyarla(hata.message)
    } finally {
      yukleniyorAyarla(false)
    }
  }

  return (
    <div className="auth-modal-arkaplan" onClick={onClose}>
      <div className="auth-modal-icerik cam-panel" onClick={(e) => e.stopPropagation()}>
        {/* kapat butonu */}
        <button className="auth-kapat" onClick={onClose} aria-label="Kapat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* logo */}
        <div className="auth-logo-alani">
          <div className="auth-logo-simge">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="url(#auth-logo-grad)" />
              <path d="M7 8h10M7 12h6M7 16h8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="auth-logo-grad" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#7c5cff" />
                  <stop offset="1" stopColor="#00d4aa" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h2>Pixboard Hesabı</h2>
          <p>Çizimlerinizi kaydetmek ve gizli odalar oluşturmak için giriş yapın.</p>
        </div>

        {/* tab secenekleri */}
        <div className="auth-tablar">
          <button
            className={`auth-tab ${aktifTab === 'giris' ? 'aktif' : ''}`}
            onClick={() => {
              aktifTabAyarla('giris')
              hataMesajiAyarla('')
              basariMesajiAyarla('')
            }}
          >
            Giriş Yap
          </button>
          <button
            className={`auth-tab ${aktifTab === 'kayit' ? 'aktif' : ''}`}
            onClick={() => {
              aktifTabAyarla('kayit')
              hataMesajiAyarla('')
              basariMesajiAyarla('')
            }}
          >
            Kayıt Ol
          </button>
        </div>

        {/* form alani */}
        <form onSubmit={formuGonder} className="auth-form">
          {hataMesaji && <div className="auth-hata">{hataMesaji}</div>}
          {basariMesaji && <div className="auth-basari">{basariMesaji}</div>}

          <div className="auth-alan">
            <label htmlFor="auth-username">Kullanıcı Adı</label>
            <div className="auth-girdi-konteyner">
              <svg className="auth-girdi-simge" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="auth-username"
                type="text"
                value={kullaniciAdi}
                onChange={(e) => kullaniciAdiAyarla(e.target.value)}
                placeholder="Kullanıcı adınızı girin..."
                required
              />
            </div>
          </div>

          <div className="auth-alan">
            <label htmlFor="auth-password">Şifre</label>
            <div className="auth-girdi-konteyner">
              <svg className="auth-girdi-simge" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="auth-password"
                type={sifreGoster ? 'text' : 'password'}
                value={sifre}
                onChange={(e) => sifreAyarla(e.target.value)}
                placeholder="Şifrenizi girin..."
                required
              />
              <button
                type="button"
                className="auth-sifre-goster-butonu"
                onClick={() => sifreGosterAyarla(!sifreGoster)}
                aria-label={sifreGoster ? 'Şifreyi gizle' : 'Şifreyi göster'}
              >
                {sifreGoster ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {aktifTab === 'kayit' && (
            <div className="auth-alan">
              <label htmlFor="auth-password-confirm">Şifre Tekrar</label>
              <div className="auth-girdi-konteyner">
                <svg className="auth-girdi-simge" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="auth-password-confirm"
                  type={sifreTekrarGoster ? 'text' : 'password'}
                  value={sifreTekrar}
                  onChange={(e) => sifreTekrarAyarla(e.target.value)}
                  placeholder="Şifrenizi tekrar girin..."
                  required
                />
                <button
                  type="button"
                  className="auth-sifre-goster-butonu"
                  onClick={() => sifreTekrarGosterAyarla(!sifreTekrarGoster)}
                  aria-label={sifreTekrarGoster ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {sifreTekrarGoster ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="auth-gonder-butonu" disabled={yukleniyor}>
            {yukleniyor ? (
              <span className="auth-yukleniyor-spinner"></span>
            ) : aktifTab === 'giris' ? (
              'Giriş Yap'
            ) : (
              'Kayıt Ol'
            )}
          </button>
        </form>

        {/* ornek hesaplar */}
        {aktifTab === 'giris' && (
          <div className="auth-ornek-hesaplar">
            <div className="auth-ornek-baslik">💡 Hızlı Giriş (Deneme Hesapları):</div>
            <div className="auth-ornek-liste">
              <button
                type="button"
                className="auth-ornek-kart"
                onClick={() => {
                  kullaniciAdiAyarla('eren')
                  sifreAyarla('password123')
                }}
              >
                <span>eren</span> / <span>password123</span>
              </button>
              <button
                type="button"
                className="auth-ornek-kart"
                onClick={() => {
                  kullaniciAdiAyarla('demo')
                  sifreAyarla('demo1234')
                }}
              >
                <span>demo</span> / <span>demo1234</span>
              </button>
              <button
                type="button"
                className="auth-ornek-kart admin-ornek-kart"
                onClick={() => {
                  kullaniciAdiAyarla('admin')
                  sifreAyarla('admin123')
                }}
              >
                <span>admin</span> / <span>admin123</span>
                <span className="admin-rozet-kucuk">Admin</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
