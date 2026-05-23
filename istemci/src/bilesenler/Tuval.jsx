import React, { useRef, useEffect, useCallback } from 'react'
import rough from 'roughjs'
import { ogeCiz, secimKutusuCiz } from '../yardimcilar/cizimYardimcilari.js'
import KullaniciImlecleri from './KullaniciImlecleri.jsx'
import './Tuval.css'

// ızgara çiz
function izgaraCiz(ctx, gorunumDurumu, genislik, yukseklik) {
  const { kaydirmaX, kaydirmaY, yakinlastirma } = gorunumDurumu
  const izgaraBoyutu = 40

  ctx.save()
  ctx.strokeStyle = 'rgba(42, 42, 61, 0.5)'
  ctx.lineWidth = 1

  // görünür alanı hesapla
  const solUst = {
    x: -kaydirmaX / yakinlastirma,
    y: -kaydirmaY / yakinlastirma,
  }
  const sagAlt = {
    x: (genislik - kaydirmaX) / yakinlastirma,
    y: (yukseklik - kaydirmaY) / yakinlastirma,
  }

  const baslangicX = Math.floor(solUst.x / izgaraBoyutu) * izgaraBoyutu
  const baslangicY = Math.floor(solUst.y / izgaraBoyutu) * izgaraBoyutu

  // ızgara çizgilerini çiz
  ctx.beginPath()
  for (let x = baslangicX; x <= sagAlt.x; x += izgaraBoyutu) {
    ctx.moveTo(x, solUst.y)
    ctx.lineTo(x, sagAlt.y)
  }
  for (let y = baslangicY; y <= sagAlt.y; y += izgaraBoyutu) {
    ctx.moveTo(solUst.x, y)
    ctx.lineTo(sagAlt.x, y)
  }
  ctx.stroke()

  // ana eksenler
  ctx.strokeStyle = 'rgba(42, 42, 61, 0.8)'
  ctx.lineWidth = 1.5
  ctx.beginPath()

  // x ekseni
  if (solUst.y <= 0 && sagAlt.y >= 0) {
    ctx.moveTo(solUst.x, 0)
    ctx.lineTo(sagAlt.x, 0)
  }
  // y ekseni
  if (solUst.x <= 0 && sagAlt.x >= 0) {
    ctx.moveTo(0, solUst.y)
    ctx.lineTo(0, sagAlt.y)
  }
  ctx.stroke()

  ctx.restore()
}

// ana tuval bileşeni
export default function Tuval({
  ogeler,
  seciliOgeId,
  gorunumDurumu,
  gorunumDurumuAyarla,
  cizimDurumu,
  seciliArac,
  fareBastiHandler,
  fareHareketHandler,
  fareBiraktiHandler,
  tekerlekHandler,
  imlecler,
  imlecGonder,
}) {
  const tuvalRef = useRef(null)
  const roughTuvalRef = useRef(null)
  const animasyonRef = useRef(null)
  const ikiDokunmaRef = useRef({
    mesafe: 0,
    ortaX: 0,
    ortaY: 0,
    kaydirmaX: 0,
    kaydirmaY: 0,
    yakinlastirma: 1,
  })

  // tuval boyutunu ayarla
  const tuvalBoyutAyarla = useCallback(() => {
    const tuval = tuvalRef.current
    if (!tuval) return

    const oran = window.devicePixelRatio || 1
    const genislik = window.innerWidth
    const yukseklik = window.innerHeight

    tuval.width = genislik * oran
    tuval.height = yukseklik * oran
    tuval.style.width = `${genislik}px`
    tuval.style.height = `${yukseklik}px`

    const ctx = tuval.getContext('2d')
    ctx.scale(oran, oran)
  }, [])

  // ilk yükleme ve boyut değişikliği
  useEffect(() => {
    tuvalBoyutAyarla()
    window.addEventListener('resize', tuvalBoyutAyarla)
    return () => window.removeEventListener('resize', tuvalBoyutAyarla)
  }, [tuvalBoyutAyarla])

  // Pasif olmayan olay dinleyicilerini (touchmove, wheel) manuel olarak kaydet
  useEffect(() => {
    const tuval = tuvalRef.current
    if (!tuval) return

    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        e.preventDefault()
        const dokunma = e.touches[0]
        const yapilanOlay = {
          clientX: dokunma.clientX,
          clientY: dokunma.clientY,
          preventDefault: () => {},
        }
        const tuvalKoord = fareHareketHandler(yapilanOlay, tuvalRef)
        if (tuvalKoord && imlecGonder) {
          imlecGonder(tuvalKoord.x, tuvalKoord.y)
        }
      } else if (e.touches.length === 2 && gorunumDurumuAyarla) {
        e.preventDefault()
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2

        const baslangic = ikiDokunmaRef.current
        if (baslangic.mesafe === 0) return

        const oran = d / baslangic.mesafe
        const yeniYakinlastirma = Math.max(0.1, Math.min(5, baslangic.yakinlastirma * oran))

        const dx = mx - baslangic.ortaX
        const dy = my - baslangic.ortaY

        const olcekOrani = yeniYakinlastirma / baslangic.yakinlastirma
        const yeniKaydirmaX = mx - (mx - baslangic.kaydirmaX) * olcekOrani + dx
        const yeniKaydirmaY = my - (my - baslangic.kaydirmaY) * olcekOrani + dy

        gorunumDurumuAyarla({
          yakinlastirma: yeniYakinlastirma,
          kaydirmaX: yeniKaydirmaX,
          kaydirmaY: yeniKaydirmaY,
        })
      }
    }

    const handleWheel = (e) => {
      e.preventDefault()
      tekerlekHandler(e)
    }

    tuval.addEventListener('touchmove', handleTouchMove, { passive: false })
    tuval.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      tuval.removeEventListener('touchmove', handleTouchMove)
      tuval.removeEventListener('wheel', handleWheel)
    }
  }, [fareHareketHandler, tekerlekHandler, gorunumDurumuAyarla, imlecGonder])

  // rough.js tuval oluştur
  useEffect(() => {
    if (tuvalRef.current) {
      roughTuvalRef.current = rough.canvas(tuvalRef.current)
    }
  }, [])

  // çizim döngüsü
  useEffect(() => {
    const ciz = () => {
      const tuval = tuvalRef.current
      if (!tuval) return

      const ctx = tuval.getContext('2d')
      const genislik = window.innerWidth
      const yukseklik = window.innerHeight
      const roughTuval = roughTuvalRef.current

      // tuvali temizle
      ctx.clearRect(0, 0, genislik, yukseklik)

      // görüntü dönüşümü uygula
      ctx.save()
      ctx.translate(gorunumDurumu.kaydirmaX, gorunumDurumu.kaydirmaY)
      ctx.scale(gorunumDurumu.yakinlastirma, gorunumDurumu.yakinlastirma)

      // ızgara çiz
      izgaraCiz(ctx, gorunumDurumu, genislik, yukseklik)

      // öğeleri çiz
      if (roughTuval) {
        ogeler.forEach((oge) => {
          ogeCiz(ctx, roughTuval, oge)
        })
      }

      // seçili öğenin seçim kutusunu çiz
      if (seciliOgeId) {
        const seciliOge = ogeler.find((o) => o.id === seciliOgeId)
        if (seciliOge) {
          secimKutusuCiz(ctx, seciliOge)
        }
      }

      ctx.restore()

      animasyonRef.current = requestAnimationFrame(ciz)
    }

    animasyonRef.current = requestAnimationFrame(ciz)

    return () => {
      if (animasyonRef.current) {
        cancelAnimationFrame(animasyonRef.current)
      }
    }
  }, [ogeler, seciliOgeId, gorunumDurumu])

  // fare olayları
  const fareBastiIsleyici = useCallback((e) => {
    fareBastiHandler(e, tuvalRef)
  }, [fareBastiHandler])

  const fareHareketIsleyici = useCallback((e) => {
    const tuvalKoord = fareHareketHandler(e, tuvalRef)
    // imleç konumunu gönder (throttle olmadan basit hali)
    if (tuvalKoord && imlecGonder) {
      imlecGonder(tuvalKoord.x, tuvalKoord.y)
    }
  }, [fareHareketHandler, imlecGonder])

  const fareBiraktiIsleyici = useCallback(() => {
    fareBiraktiHandler()
  }, [fareBiraktiHandler])

  // dokunma olayları — mobil destek
  const dokunmaBaslangicIsleyici = useCallback((e) => {
    if (e.touches.length === 1) {
      const dokunma = e.touches[0]
      const yapilanOlay = {
        clientX: dokunma.clientX,
        clientY: dokunma.clientY,
        button: 0,
        preventDefault: () => {},
      }
      fareBastiHandler(yapilanOlay, tuvalRef)
    } else if (e.touches.length === 2) {
      // Çizimi veya işlemi bitir/iptal et
      fareBiraktiHandler()
      
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2
      
      ikiDokunmaRef.current = {
        mesafe: d,
        ortaX: mx,
        ortaY: my,
        kaydirmaX: gorunumDurumu.kaydirmaX,
        kaydirmaY: gorunumDurumu.kaydirmaY,
        yakinlastirma: gorunumDurumu.yakinlastirma
      }
    }
  }, [fareBastiHandler, fareBiraktiHandler, gorunumDurumu])

  const dokunmaBitisIsleyici = useCallback((e) => {
    fareBiraktiHandler()
    if (e.touches.length < 2) {
      ikiDokunmaRef.current.mesafe = 0
    }
  }, [fareBiraktiHandler])

  // imleç stili
  const imlecStili = () => {
    switch (seciliArac) {
      case 'secim': return cizimDurumu === 'tasiyor' ? 'grabbing' : 'default'
      case 'kalem': return 'crosshair'
      case 'dikdortgen': return 'crosshair'
      case 'elips': return 'crosshair'
      case 'cizgi': return 'crosshair'
      case 'ok': return 'crosshair'
      case 'metin': return 'text'
      case 'baklava': return 'crosshair'
      case 'silgi': return 'not-allowed'
      default: return 'default'
    }
  }

  return (
    <div className="tuval-kapsayici">
      <canvas
        ref={tuvalRef}
        className="ana-tuval"
        style={{ cursor: imlecStili() }}
        onMouseDown={fareBastiIsleyici}
        onMouseMove={fareHareketIsleyici}
        onMouseUp={fareBiraktiIsleyici}
        onMouseLeave={fareBiraktiIsleyici}
        onTouchStart={dokunmaBaslangicIsleyici}
        onTouchEnd={dokunmaBitisIsleyici}
        tabIndex={0}
      />

      {/* diğer kullanıcıların imleçleri */}
      <KullaniciImlecleri imlecler={imlecler} gorunumDurumu={gorunumDurumu} />
    </div>
  )
}
