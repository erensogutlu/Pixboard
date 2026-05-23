import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Routes, Route, useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { kullanSoket } from './kancalar/kullanSoket'
import { kullanTuval } from './kancalar/kullanTuval'
import { kullanAraclar } from './kancalar/kullanAraclar'
import TahtaListesi from './bilesenler/TahtaListesi'
import Tuval from './bilesenler/Tuval'
import AracCubugu from './bilesenler/AracCubugu'
import OzellikPaneli from './bilesenler/OzellikPaneli'
import UstBar from './bilesenler/UstBar'
import KatilimDialogu from './bilesenler/KatilimDialogu'
import AdminPaneli from './bilesenler/AdminPaneli'
import { API_URL } from './config'
import './App.css'

// pano editör bileşeni
function PanoEditor() {
  const { tahtaId } = useParams()
  const [aramaParametreleri] = useSearchParams()
  const yonlendir = useNavigate()
  const konum = useLocation()
  const [tahtaBasligi, tahtaBasligiAyarla] = useState(aramaParametreleri.get('baslik') || 'İsimsiz Tahta')

  // sifreli oda durumlari
  const [sifreGerekli, sifreGerekliAyarla] = useState(false)
  // tahta bulunamadi
  const [tahtaBulunamadi, tahtaBulunamadiAyarla] = useState(false)
  const [odaSifresi, odaSifresiAyarla] = useState(() => sessionStorage.getItem(`tahta_sifre_${tahtaId}`) || '')
  const [sifreHatasi, sifreHatasiAyarla] = useState('')

  // kullanici adi girisi
  const [kullaniciAdiDialogAcik, kullaniciAdiDialogAcikAyarla] = useState(false)

  // paylasim kodu durumlari
  const [paylasimKodu, paylasimKoduAyarla] = useState('')
  const [paylasimDialogAcik, paylasimDialogAcikAyarla] = useState(false)

  // metin girisi durumlari
  const [metinModaliAcik, metinModaliAcikAyarla] = useState(false)
  const [metinEklemeKonum, metinEklemeKonumAyarla] = useState(null)
  const [girilenMetin, girilenMetinAyarla] = useState('')

  const { seciliArac, seciliAracAyarla, stil, stilGuncelle } = kullanAraclar()
  const {
    ogeler,
    ogeleriAyarla,
    seciliOgeId,
    seciliOgeIdAyarla,
    cizimDurumu,
    gorunumDurumu,
    gorunumDurumuAyarla,
    fareBastiHandler,
    fareHareketHandler,
    fareBiraktiHandler,
    tekerlekHandler,
    tusBastiHandler,
    tusBiraktiHandler,
    geriAl,
    yenidenYap,
    tumunuTemizle,
    secimiKaldir,
    yakinlastirmaAyarla,
    ekranaSigdir,
    seciliOgeGuncelle,
    seciliOgeSil,
    gecmisRef,
    gelecekRef,
    yeniOgeOlustur,
    gecmiseKaydet,
  } = kullanTuval(seciliArac, stil)

  // soket dinleyicileri
  const {
    baglandi,
    kullanicilar,
    imlecler,
    odayaKatil,
    ogeGonder,
    ogeGuncelle,
    ogeSil,
    imlecGonder,
    tahtaKaydet,
  } = kullanSoket({
    tahtaVerileriAlindi: (veri) => {
      ogeleriAyarla(veri || [])
    },
    ogeEklendi: (oge) => {
      ogeleriAyarla((onceki) => {
        if (onceki.some((o) => o.id === oge.id)) return onceki
        return [...onceki, oge]
      })
    },
    ogeGuncellendi: (veri) => {
      const { ogeId, degisiklikler } = veri
      ogeleriAyarla((onceki) =>
        onceki.map((o) => (o.id === ogeId ? { ...o, ...degisiklikler } : o))
      )
    },
    ogeSilindi: (ogeId) => {
      ogeleriAyarla((onceki) => onceki.filter((o) => o.id !== ogeId))
      if (seciliOgeId === ogeId) {
        seciliOgeIdAyarla(null)
      }
    },
  })

  // detay yukle ve katil
  const tahtaDetayYukleVeKatil = useCallback(async (sifre = '') => {
    try {
      const token = localStorage.getItem('pixboard_token')
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      if (sifre) headers['X-Room-Password'] = sifre

      const yanit = await fetch(`${API_URL}/api/tahtalar/${tahtaId}`, { headers })

      if (yanit.status === 404) {
        tahtaBulunamadiAyarla(true)
        return false
      }

      if (yanit.status === 403) {
        // yetkisiz erisim
        sifreGerekliAyarla(true)
        if (sifre) {
          sifreHatasiAyarla('Hatalı oda şifresi. Lütfen tekrar deneyin.')
        }
        return false
      }

      if (yanit.ok) {
        const veri = await yanit.json()

        // tahta bulunamadiysa
        if (veri.bulunamadi) {
          tahtaBulunamadiAyarla(true)
          return false
        }
        // sifre gerekliyse
        if (veri.sifreGerekli) {
          sifreGerekliAyarla(true)
          if (sifre) {
            sifreHatasiAyarla('Hatalı oda şifresi. Lütfen tekrar deneyin.')
          }
          return false
        }

        // yonlendir
        if (tahtaId !== veri.id) {
          if (sifre) {
            sessionStorage.setItem(`tahta_sifre_${veri.id}`, sifre)
          }
          yonlendir(`/tahta/${veri.id}`, { replace: true })
          return true
        }

        tahtaBasligiAyarla(veri.baslik)
        paylasimKoduAyarla(veri.paylasim_kodu || '')
        sifreGerekliAyarla(false)
        sifreHatasiAyarla('')

        // oda şifresini kaydet
        if (sifre) {
          sessionStorage.setItem(`tahta_sifre_${tahtaId}`, sifre)
          odaSifresiAyarla(sifre)
        }

        // kullanici adi
        let kullaniciAdi = localStorage.getItem('pixboard_kullanici_adi')
        // tokendan kullanici adi
        const token = localStorage.getItem('pixboard_token')
        if (token) {
          try {
            const payload = token.split('.')[1]
            const cozulen = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
            if (cozulen && cozulen.kullaniciAdi) {
              kullaniciAdi = cozulen.kullaniciAdi
              localStorage.setItem('pixboard_kullanici_adi', cozulen.kullaniciAdi)
            }
          } catch (e) {
            // hatali token
          }
        }

        if (!kullaniciAdi) {
          kullaniciAdiDialogAcikAyarla(true)
          return true
        }

        // sokete katil
        odayaKatil(tahtaId, kullaniciAdi, sifre, token)
        return true
      }
    } catch (hata) {
      console.log('// tahta detayları sunucudan çekilemedi')
    }
    return false
  }, [tahtaId, odayaKatil])

  // kullanici adi onayla
  const kullaniciAdiBelirle = useCallback((yeniAd) => {
    const temizAd = yeniAd.trim() || 'Anonim'
    localStorage.setItem('pixboard_kullanici_adi', temizAd)
    kullaniciAdiDialogAcikAyarla(false)
    const token = localStorage.getItem('pixboard_token')
    odayaKatil(tahtaId, temizAd, odaSifresi, token)
  }, [tahtaId, odaSifresi, odayaKatil])

  // ilk acilista kontrol
  useEffect(() => {
    if (!tahtaId) return
    const kayitliSifre = sessionStorage.getItem(`tahta_sifre_${tahtaId}`) || ''
    tahtaBulunamadiAyarla(false)
    tahtaDetayYukleVeKatil(kayitliSifre)
  }, [tahtaId, tahtaDetayYukleVeKatil])

  // paylasim modalini ac
  useEffect(() => {
    if (konum.state?.yeniOlusturuldu) {
      paylasimDialogAcikAyarla(true)
      // state temizle
      yonlendir(konum.pathname, { replace: true, state: {} })
    }
  }, [konum, yonlendir])

  // imlec gonder
  const sonImlecGondermeZamaniRef = useRef(0)
  const imlecGonderSarmal = useCallback((x, y) => {
    const simdi = Date.now()
    if (simdi - sonImlecGondermeZamaniRef.current > 50) {
      imlecGonder(tahtaId, x, y)
      sonImlecGondermeZamaniRef.current = simdi
    }
  }, [tahtaId, imlecGonder])

  // fare tiklama
  const fareBastiSarmal = useCallback((e, tuvalRef) => {
    const sonuc = fareBastiHandler(e, tuvalRef)
    if (sonuc) {
      if (sonuc.metinEklemeBaslat) {
        metinEklemeKonumAyarla(sonuc.koordinat)
        girilenMetinAyarla('')
        metinModaliAcikAyarla(true)
      } else if (sonuc.silinenId && sonuc.yeniOgeler) {
        ogeSil(tahtaId, sonuc.silinenId)
        tahtaKaydet(tahtaId, sonuc.yeniOgeler)
      } else if (sonuc.eklenenOge && sonuc.yeniOgeler) {
        ogeGonder(tahtaId, sonuc.eklenenOge)
        tahtaKaydet(tahtaId, sonuc.yeniOgeler)
      }
    }
  }, [fareBastiHandler, tahtaId, ogeSil, ogeGonder, tahtaKaydet])

  const metinEkleOnayla = useCallback((e) => {
    e.preventDefault()
    if (!metinEklemeKonum) return

    const temizMetin = girilenMetin.trim()
    if (temizMetin) {
      const yeniOge = yeniOgeOlustur('metin', metinEklemeKonum.x, metinEklemeKonum.y, stil)
      yeniOge.metin = temizMetin

      // metin boyutu
      const geciciTuval = document.createElement('canvas')
      const geciciCtx = geciciTuval.getContext('2d')
      const yaziBoyutu = (yeniOge.cizgiKalinligi || 2) * 8 + 8
      geciciCtx.font = `${yaziBoyutu}px 'Inter', sans-serif`
      const satirlar = temizMetin.split('\n')
      let maxGenislik = 0
      satirlar.forEach((satir) => {
        const olcum = geciciCtx.measureText(satir)
        maxGenislik = Math.max(maxGenislik, olcum.width)
      })
      yeniOge.genislik = maxGenislik + 16
      yeniOge.yukseklik = satirlar.length * yaziBoyutu * 1.4 + 8

      gecmiseKaydet()
      const yeniOgeler = [...ogeler, yeniOge]
      ogeleriAyarla(yeniOgeler)

      // soket ve db gonder
      ogeGonder(tahtaId, yeniOge)
      tahtaKaydet(tahtaId, yeniOgeler)
    }

    metinModaliAcikAyarla(false)
    metinEklemeKonumAyarla(null)
    girilenMetinAyarla('')
  }, [metinEklemeKonum, girilenMetin, yeniOgeOlustur, stil, gecmiseKaydet, ogeler, ogeleriAyarla, ogeGonder, tahtaKaydet, tahtaId])

  const metinEkleIptal = useCallback(() => {
    metinModaliAcikAyarla(false)
    metinEklemeKonumAyarla(null)
    girilenMetinAyarla('')
  }, [])

  // fare birakma
  const fareBiraktiSarmal = useCallback(() => {
    const sonuc = fareBiraktiHandler()
    if (sonuc && sonuc.tamamlananOge) {
      const { tamamlananOge, guncelOgeler, cizimDurumu } = sonuc
      if (cizimDurumu === 'ciziliyor') {
        ogeGonder(tahtaId, tamamlananOge)
        tahtaKaydet(tahtaId, guncelOgeler)
      } else if (cizimDurumu === 'tasiyor' || cizimDurumu === 'boyutlandiriyor') {
        ogeGuncelle(tahtaId, tamamlananOge.id, tamamlananOge)
        tahtaKaydet(tahtaId, guncelOgeler)
      }
    }
  }, [fareBiraktiHandler, tahtaId, ogeGonder, ogeGuncelle, tahtaKaydet])

  // ozellik panelinden guncelleme
  const seciliOgeGuncelleSarmal = useCallback((degisiklikler) => {
    const yeniOgeler = seciliOgeGuncelle(degisiklikler)
    if (yeniOgeler && seciliOgeId) {
      ogeGuncelle(tahtaId, seciliOgeId, degisiklikler)
      tahtaKaydet(tahtaId, yeniOgeler)
    }
  }, [seciliOgeGuncelle, seciliOgeId, tahtaId, ogeGuncelle, tahtaKaydet])

  // ozellik panelinden silme
  const seciliOgeSilSarmal = useCallback(() => {
    const sonuc = seciliOgeSil()
    if (sonuc && sonuc.silinenId && sonuc.yeniOgeler) {
      ogeSil(tahtaId, sonuc.silinenId)
      tahtaKaydet(tahtaId, sonuc.yeniOgeler)
    }
  }, [seciliOgeSil, tahtaId, ogeSil, tahtaKaydet])

  // geri al ve yeniden yap
  const geriAlSarmal = useCallback(() => {
    const yeniOgeler = geriAl()
    if (yeniOgeler) {
      tahtaKaydet(tahtaId, yeniOgeler)
    }
  }, [geriAl, tahtaId, tahtaKaydet])

  const yenidenYapSarmal = useCallback(() => {
    const yeniOgeler = yenidenYap()
    if (yeniOgeler) {
      tahtaKaydet(tahtaId, yeniOgeler)
    }
  }, [yenidenYap, tahtaId, tahtaKaydet])

  // klavye kisayollari
  useEffect(() => {
    const tusBasmaSarmal = (e) => {
      const sonuc = tusBastiHandler(e)
      if (sonuc) {
        if (sonuc.silinenId && sonuc.yeniOgeler) {
          ogeSil(tahtaId, sonuc.silinenId)
          tahtaKaydet(tahtaId, sonuc.yeniOgeler)
        } else if (sonuc.geriAlindi && sonuc.yeniOgeler) {
          tahtaKaydet(tahtaId, sonuc.yeniOgeler)
        } else if (sonuc.yenidenYapildi && sonuc.yeniOgeler) {
          tahtaKaydet(tahtaId, sonuc.yeniOgeler)
        }
      }
    }

    window.addEventListener('keydown', tusBasmaSarmal)
    window.addEventListener('keyup', tusBiraktiHandler)
    return () => {
      window.removeEventListener('keydown', tusBasmaSarmal)
      window.removeEventListener('keyup', tusBiraktiHandler)
    }
  }, [tusBastiHandler, tusBiraktiHandler, tahtaId, ogeSil, tahtaKaydet])

  // png disa aktar
  const pngDisaAktar = () => {
    const tuval = document.querySelector('.ana-tuval')
    if (!tuval) return
    const veriUrl = tuval.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `${tahtaBasligi || 'pixboard'}.png`
    link.href = veriUrl
    link.click()
  }

  const seciliOge = ogeler.find((o) => o.id === seciliOgeId)

  // tahta bulunamadi
  if (tahtaBulunamadi) {
    return (
      <div className="sifre-giris-sayfa">
        <div className="arkaplan-efekt">
          <div className="efekt-daire efekt-daire-1" />
          <div className="efekt-daire efekt-daire-2" />
        </div>
        <div className="sifre-kutu cam-panel">
          <div className="sifre-logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="url(#hata-logo-grad)" />
              <path d="M12 6.5L18.5 17.5C18.8 18 18.5 18.7 17.9 18.7H6.1C5.5 18.7 5.2 18 5.5 17.5L12 6.5Z" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 10V13" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="12" cy="16" r="0.75" fill="#fff" />
              <defs>
                <linearGradient id="hata-logo-grad" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#ff4b4b" />
                  <stop offset="1" stopColor="#ff8585" />
                </linearGradient>
              </defs>
            </svg>
            <h2>Pixboard</h2>
          </div>
          <div className="sifre-baslik">
            <h3>Tahta Bulunamadı</h3>
            <p>Aradığınız çizim tahtası silinmiş olabilir veya paylaşım kodu hatalıdır.</p>
          </div>
          <div className="sifre-eylemler" style={{ justifyContent: 'center', marginTop: '24px' }}>
            <button type="button" className="sifre-buton onayla" onClick={() => yonlendir('/')} style={{ width: '100%' }}>
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    )
  }

  // sifre giris
  if (sifreGerekli) {
    return (
      <div className="sifre-giris-sayfa">
        <div className="arkaplan-efekt">
          <div className="efekt-daire efekt-daire-1" />
          <div className="efekt-daire efekt-daire-2" />
        </div>
        <div className="sifre-kutu cam-panel">
          <div className="sifre-logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="url(#sifre-logo-grad)" />
              <rect x="7" y="11" width="10" height="7" rx="1.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9.5 11V8.5a2.5 2.5 0 0 1 5 0V11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="sifre-logo-grad" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#7c5cff" />
                  <stop offset="1" stopColor="#00d4aa" />
                </linearGradient>
              </defs>
            </svg>
            <h2>Pixboard</h2>
          </div>
          <div className="sifre-baslik">
            <h3>Oda Girişi Şifreli</h3>
            <p>Bu tahta gizlidir. Devam etmek için şifreyi giriniz.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const veri = new FormData(e.target)
              const sf = veri.get('sifreInput')
              tahtaDetayYukleVeKatil(sf)
            }}
            className="sifre-form"
          >
            {sifreHatasi && <div className="sifre-hata">{sifreHatasi}</div>}
            <div className="sifre-alan">
              <input
                type="password"
                name="sifreInput"
                placeholder="Oda şifresini yazın..."
                className="sifre-girdi"
                required
                autoFocus
              />
            </div>
            <div className="sifre-eylemler">
              <button type="button" className="sifre-buton iptal" onClick={() => yonlendir('/')}>
                Ana Sayfaya Dön
              </button>
              <button type="submit" className="sifre-buton onayla">
                Tahtayı Aç
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // kullanici adi girisi
  if (kullaniciAdiDialogAcik) {
    return (
      <div className="sifre-giris-sayfa">
        <div className="arkaplan-efekt">
          <div className="efekt-daire efekt-daire-1" />
          <div className="efekt-daire efekt-daire-2" />
        </div>
        <div className="sifre-kutu cam-panel">
          <div className="sifre-logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="url(#isim-logo-grad)" />
              <circle cx="12" cy="8.5" r="3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M6 18v-1.5c0-1.65 1.35-3 3-3h6c1.65 0 3 1.35 3 3V18" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="isim-logo-grad" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#7c5cff" />
                  <stop offset="1" stopColor="#00d4aa" />
                </linearGradient>
              </defs>
            </svg>
            <h2>Pixboard</h2>
          </div>
          <div className="sifre-baslik">
            <h3>Kullanıcı Adı Gerekli</h3>
            <p>Lütfen tahtaya katılmak için isminizi girin.</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const veri = new FormData(e.target)
              const ad = veri.get('kullaniciAdiInput')
              kullaniciAdiBelirle(ad)
            }}
            className="sifre-form"
          >
            <div className="sifre-alan">
              <input
                type="text"
                name="kullaniciAdiInput"
                placeholder="Rumuzunuzu yazın..."
                className="sifre-girdi"
                required
                maxLength={20}
                minLength={2}
                autoFocus
              />
            </div>
            <div className="sifre-eylemler">
              <button type="button" className="sifre-buton iptal" onClick={() => yonlendir('/')}>
                Ana Sayfaya Dön
              </button>
              <button type="submit" className="sifre-buton onayla">
                Tahtaya Katıl
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="tahta-gorunumu">
      {/* üst menü barı */}
      <UstBar
        tahtaBasligi={tahtaBasligi}
        baglandi={baglandi}
        kullanicilar={kullanicilar}
        gorunumDurumu={gorunumDurumu}
        yakinlastirmaAyarla={yakinlastirmaAyarla}
        ekranaSigdir={ekranaSigdir}
        geriAl={geriAlSarmal}
        yenidenYap={yenidenYapSarmal}
        gecmisRef={gecmisRef}
        gelecekRef={gelecekRef}
        tahtaVerisiDisa={pngDisaAktar}
        paylasimKodu={paylasimKodu}
        paylasimDialogAc={() => paylasimDialogAcikAyarla(true)}
      />

      {/* sol araç çubuğu */}
      <AracCubugu seciliArac={seciliArac} seciliAracAyarla={seciliAracAyarla} />

      {/* ana tuval alanı */}
      <Tuval
        ogeler={ogeler}
        seciliOgeId={seciliOgeId}
        gorunumDurumu={gorunumDurumu}
        gorunumDurumuAyarla={gorunumDurumuAyarla}
        cizimDurumu={cizimDurumu}
        seciliArac={seciliArac}
        fareBastiHandler={fareBastiSarmal}
        fareHareketHandler={fareHareketHandler}
        fareBiraktiHandler={fareBiraktiSarmal}
        tekerlekHandler={tekerlekHandler}
        imlecler={imlecler}
        imlecGonder={imlecGonderSarmal}
      />

      {/* sağ özellikler paneli */}
      <OzellikPaneli
        seciliOge={seciliOge}
        stil={stil}
        stilGuncelle={stilGuncelle}
        seciliOgeGuncelle={seciliOgeGuncelleSarmal}
        seciliOgeSil={seciliOgeSilSarmal}
        seciliArac={seciliArac}
      />

      {/* paylaşım dialogu */}
      <KatilimDialogu
        acik={paylasimDialogAcik}
        kapatHandler={() => paylasimDialogAcikAyarla(false)}
        tahtaId={paylasimKodu}
      />

      {/* metin giriş modalı */}
      {metinModaliAcik && (
        <div className="auth-modal-arkaplan">
          <div className="auth-modal-icerik cam-panel" style={{ maxWidth: '450px' }}>
            <button type="button" className="auth-kapat" onClick={metinEkleIptal}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="auth-logo-alani" style={{ marginBottom: '20px' }}>
              <div className="auth-logo-simge" style={{ width: '48px', height: '48px', marginBottom: '12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 7 4 4 20 4 20 7" />
                  <line x1="9" y1="20" x2="15" y2="20" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
              </div>
              <h2>Metin Ekle</h2>
              <p>Tuvale yerleştirmek istediğiniz metni yazın.</p>
            </div>
            <form onSubmit={metinEkleOnayla} className="auth-form">
              <div className="auth-alan">
                <textarea
                  value={girilenMetin}
                  onChange={(e) => girilenMetinAyarla(e.target.value)}
                  placeholder="Metninizi buraya yazın..."
                  className="auth-girdi-konteyner"
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px 16px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  required
                  autoFocus
                />
              </div>
              <div className="sifre-eylemler" style={{ marginTop: '10px' }}>
                <button type="button" className="sifre-buton iptal" onClick={metinEkleIptal}>
                  Vazgeç
                </button>
                <button type="submit" className="sifre-buton onayla">
                  Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ana uygulama bileşeni
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TahtaListesi />} />
      <Route path="/tahta/:tahtaId" element={<PanoEditor />} />
      <Route path="/admin" element={<AdminPaneli />} />
    </Routes>
  )
}
