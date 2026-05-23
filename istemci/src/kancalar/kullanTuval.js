import { useState, useRef, useCallback } from 'react'
import { noktaOgeUzerinde, tutamacKontrolu, ekranToTuval } from '../yardimcilar/geometri.js'

// tuval durum yönetimi kancası
export function kullanTuval(seciliArac, stil) {
  const [ogeler, ogeleriAyarla] = useState([])
  const [seciliOgeId, seciliOgeIdAyarla] = useState(null)
  const [cizimDurumu, cizimDurumuAyarla] = useState('bosta') // 'bosta' | 'ciziliyor' | 'tasiyor' | 'boyutlandiriyor'
  const [gorunumDurumu, gorunumDurumuAyarla] = useState({
    kaydirmaX: 0,
    kaydirmaY: 0,
    yakinlastirma: 1,
  })

  // geri al / yeniden yap yığınları
  const gecmisRef = useRef([])
  const gelecekRef = useRef([])

  // çizim durumu referansları
  const cizimBaslangicRef = useRef(null)
  const suruklemeBaslangicRef = useRef(null)
  const aktifOgeRef = useRef(null)
  const boyutlandirmaYonuRef = useRef(null)
  const kaydiriyorRef = useRef(false)
  const kaydirmaBaslangicRef = useRef(null)
  const sonOgelerRef = useRef(ogeler)

  // referansı güncelle
  sonOgelerRef.current = ogeler

  // geçmişe kaydet
  const gecmiseKaydet = useCallback(() => {
    gecmisRef.current = [...gecmisRef.current, JSON.parse(JSON.stringify(sonOgelerRef.current))]
    if (gecmisRef.current.length > 50) {
      gecmisRef.current = gecmisRef.current.slice(-50)
    }
    gelecekRef.current = []
  }, [])

  // geri al
  const geriAl = useCallback(() => {
    if (gecmisRef.current.length === 0) return null
    const onceki = gecmisRef.current.pop()
    gelecekRef.current.push(JSON.parse(JSON.stringify(sonOgelerRef.current)))
    ogeleriAyarla(onceki)
    seciliOgeIdAyarla(null)
    return onceki
  }, [])

  // yeniden yap
  const yenidenYap = useCallback(() => {
    if (gelecekRef.current.length === 0) return null
    const sonraki = gelecekRef.current.pop()
    gecmisRef.current.push(JSON.parse(JSON.stringify(sonOgelerRef.current)))
    ogeleriAyarla(sonraki)
    seciliOgeIdAyarla(null)
    return sonraki
  }, [])

  // tümünü temizle
  const tumunuTemizle = useCallback(() => {
    gecmiseKaydet()
    ogeleriAyarla([])
    seciliOgeIdAyarla(null)
    return []
  }, [gecmiseKaydet])

  // seçimi kaldır
  const secimiKaldir = useCallback(() => {
    seciliOgeIdAyarla(null)
  }, [])

  // yeni öğe oluştur
  const yeniOgeOlustur = useCallback((tip, x, y, mevcutStil) => {
    return {
      id: crypto.randomUUID(),
      tip,
      x,
      y,
      genislik: 0,
      yukseklik: 0,
      noktalar: tip === 'kalem' ? [[x, y]] : [],
      metin: '',
      cizgiRengi: mevcutStil.cizgiRengi || '#e8e8f0',
      cizgiKalinligi: mevcutStil.cizgiKalinligi || 2,
      dolguRengi: mevcutStil.dolguRengi || 'transparent',
      opaklık: mevcutStil.opaklık ?? 1,
      tohum: Math.floor(Math.random() * 2 ** 31),
      olusturanId: null,
    }
  }, [])

  // öğe seç
  const ogeSecHandler = useCallback((ogeId) => {
    seciliOgeIdAyarla(ogeId)
  }, [])

  // fare bastı
  const fareBastiHandler = useCallback((e, tuvalRef) => {
    if (!tuvalRef.current) return

    const dikdortgen = tuvalRef.current.getBoundingClientRect()
    const ekranX = e.clientX - dikdortgen.left
    const ekranY = e.clientY - dikdortgen.top
    const tuvalKoord = ekranToTuval(ekranX, ekranY, gorunumDurumu)

    // kaydirma
    if (e.button === 1 || kaydiriyorRef.current) {
      kaydiriyorRef.current = true
      kaydirmaBaslangicRef.current = { x: e.clientX, y: e.clientY }
      cizimDurumuAyarla('tasiyor')
      return
    }

    // silgi aracı
    if (seciliArac === 'silgi') {
      gecmiseKaydet()
      const tiklananOge = sonOgelerRef.current.find(
        (oge) => noktaOgeUzerinde(tuvalKoord, oge)
      )
      if (tiklananOge) {
        const silinecekler = sonOgelerRef.current.filter(
          (oge) => oge.id !== tiklananOge.id
        )
        ogeleriAyarla(silinecekler)
        return { silinenId: tiklananOge.id, yeniOgeler: silinecekler }
      }
      return null
    }

    // seçim aracı
    if (seciliArac === 'secim') {
      // secili oge tutamaci
      if (seciliOgeId) {
        const seciliOge = sonOgelerRef.current.find((o) => o.id === seciliOgeId)
        if (seciliOge) {
          const tutamac = tutamacKontrolu(tuvalKoord, seciliOge)
          if (tutamac) {
            boyutlandirmaYonuRef.current = tutamac
            suruklemeBaslangicRef.current = { ...tuvalKoord }
            aktifOgeRef.current = JSON.parse(JSON.stringify(seciliOge))
            cizimDurumuAyarla('boyutlandiriyor')
            gecmiseKaydet()
            return
          }
        }
      }

      // oge secimi
      for (let i = sonOgelerRef.current.length - 1; i >= 0; i--) {
        const oge = sonOgelerRef.current[i]
        if (noktaOgeUzerinde(tuvalKoord, oge)) {
          seciliOgeIdAyarla(oge.id)
          suruklemeBaslangicRef.current = { ...tuvalKoord }
          aktifOgeRef.current = JSON.parse(JSON.stringify(oge))
          cizimDurumuAyarla('tasiyor')
          gecmiseKaydet()
          return
        }
      }

      // secimi kaldir
      seciliOgeIdAyarla(null)
      return
    }

    // metin aracı
    if (seciliArac === 'metin') {
      return { metinEklemeBaslat: true, koordinat: tuvalKoord }
    }

    // çizim araçları
    gecmiseKaydet()
    const yeniOge = yeniOgeOlustur(seciliArac, tuvalKoord.x, tuvalKoord.y, stil)
    cizimBaslangicRef.current = { x: tuvalKoord.x, y: tuvalKoord.y }
    aktifOgeRef.current = yeniOge

    ogeleriAyarla((onceki) => [...onceki, yeniOge])
    cizimDurumuAyarla('ciziliyor')
  }, [seciliArac, stil, gorunumDurumu, seciliOgeId, yeniOgeOlustur, gecmiseKaydet])

  // fare hareket
  const fareHareketHandler = useCallback((e, tuvalRef) => {
    if (!tuvalRef.current) return

    const dikdortgen = tuvalRef.current.getBoundingClientRect()
    const ekranX = e.clientX - dikdortgen.left
    const ekranY = e.clientY - dikdortgen.top
    const tuvalKoord = ekranToTuval(ekranX, ekranY, gorunumDurumu)

    // kaydırma
    if (kaydiriyorRef.current && kaydirmaBaslangicRef.current) {
      const dx = e.clientX - kaydirmaBaslangicRef.current.x
      const dy = e.clientY - kaydirmaBaslangicRef.current.y
      kaydirmaBaslangicRef.current = { x: e.clientX, y: e.clientY }
      gorunumDurumuAyarla((onceki) => ({
        ...onceki,
        kaydirmaX: onceki.kaydirmaX + dx,
        kaydirmaY: onceki.kaydirmaY + dy,
      }))
      return tuvalKoord
    }

    // çizim yapılıyor
    if (cizimDurumu === 'ciziliyor' && aktifOgeRef.current) {
      const oge = aktifOgeRef.current

      if (oge.tip === 'kalem') {
        // serbest cizim nokta ekle
        oge.noktalar = [...oge.noktalar, [tuvalKoord.x, tuvalKoord.y]]
        ogeleriAyarla((onceki) =>
          onceki.map((o) => (o.id === oge.id ? { ...oge } : o))
        )
      } else {
        // sekil cizim boyutlari
        oge.genislik = tuvalKoord.x - cizimBaslangicRef.current.x
        oge.yukseklik = tuvalKoord.y - cizimBaslangicRef.current.y
        ogeleriAyarla((onceki) =>
          onceki.map((o) => (o.id === oge.id ? { ...oge } : o))
        )
      }
    }

    // taşıma
    if (cizimDurumu === 'tasiyor' && aktifOgeRef.current && suruklemeBaslangicRef.current) {
      const dx = tuvalKoord.x - suruklemeBaslangicRef.current.x
      const dy = tuvalKoord.y - suruklemeBaslangicRef.current.y
      const oge = aktifOgeRef.current

      if (oge.tip === 'kalem') {
        const tasinanNoktalar = oge.noktalar.map(([nx, ny]) => [nx + dx, ny + dy])
        ogeleriAyarla((onceki) =>
          onceki.map((o) =>
            o.id === oge.id ? { ...oge, noktalar: tasinanNoktalar } : o
          )
        )
        aktifOgeRef.current = { ...oge, noktalar: tasinanNoktalar }
      } else {
        ogeleriAyarla((onceki) =>
          onceki.map((o) =>
            o.id === oge.id
              ? { ...oge, x: oge.x + dx, y: oge.y + dy }
              : o
          )
        )
        aktifOgeRef.current = { ...oge, x: oge.x + dx, y: oge.y + dy }
      }
      suruklemeBaslangicRef.current = { ...tuvalKoord }
    }

    // boyutlandırma
    if (cizimDurumu === 'boyutlandiriyor' && aktifOgeRef.current && suruklemeBaslangicRef.current) {
      const dx = tuvalKoord.x - suruklemeBaslangicRef.current.x
      const dy = tuvalKoord.y - suruklemeBaslangicRef.current.y
      const oge = { ...aktifOgeRef.current }
      const yon = boyutlandirmaYonuRef.current

      if (yon === 'sag-alt') {
        oge.genislik += dx
        oge.yukseklik += dy
      } else if (yon === 'sag-ust') {
        oge.y += dy
        oge.genislik += dx
        oge.yukseklik -= dy
      } else if (yon === 'sol-alt') {
        oge.x += dx
        oge.genislik -= dx
        oge.yukseklik += dy
      } else if (yon === 'sol-ust') {
        oge.x += dx
        oge.y += dy
        oge.genislik -= dx
        oge.yukseklik -= dy
      }

      ogeleriAyarla((onceki) =>
        onceki.map((o) => (o.id === oge.id ? { ...oge } : o))
      )
      aktifOgeRef.current = oge
      suruklemeBaslangicRef.current = { ...tuvalKoord }
    }

    return tuvalKoord
  }, [cizimDurumu, gorunumDurumu])

  // fare bıraktı
  const fareBiraktiHandler = useCallback(() => {
    if (kaydiriyorRef.current) {
      kaydiriyorRef.current = false
      kaydirmaBaslangicRef.current = null
      cizimDurumuAyarla('bosta')
      return null
    }

    const tamamlananOge = aktifOgeRef.current

    let silindi = false
    if (cizimDurumu === 'ciziliyor' && tamamlananOge) {
      // kucuk sekilleri sil
      if (
        tamamlananOge.tip !== 'kalem' &&
        tamamlananOge.tip !== 'metin' &&
        Math.abs(tamamlananOge.genislik || 0) < 3 &&
        Math.abs(tamamlananOge.yukseklik || 0) < 3
      ) {
        silindi = true
      }
    }

    let guncelOgeler = [...sonOgelerRef.current]
    if (tamamlananOge) {
      if (silindi) {
        guncelOgeler = guncelOgeler.filter((o) => o.id !== tamamlananOge.id)
        ogeleriAyarla(guncelOgeler)
      } else {
        // ogeyi guncelle veya ekle
        const index = guncelOgeler.findIndex((o) => o.id === tamamlananOge.id)
        const kopyaOge = JSON.parse(JSON.stringify(tamamlananOge))
        if (index !== -1) {
          guncelOgeler[index] = kopyaOge
        } else {
          guncelOgeler.push(kopyaOge)
        }
        ogeleriAyarla(guncelOgeler)
      }
    }

    const eskiCizimDurumu = cizimDurumu

    cizimDurumuAyarla('bosta')
    cizimBaslangicRef.current = null
    suruklemeBaslangicRef.current = null
    aktifOgeRef.current = null
    boyutlandirmaYonuRef.current = null

    return { tamamlananOge: silindi ? null : tamamlananOge, guncelOgeler, cizimDurumu: eskiCizimDurumu }
  }, [cizimDurumu])

  // tekerlek yakinlastirma
  const tekerlekHandler = useCallback((e) => {
    e.preventDefault()

    const yakınlastirmaCarpani = 0.1
    const yuksekMi = e.deltaY < 0
    const yeniYakinlastirma = yuksekMi
      ? Math.min(gorunumDurumu.yakinlastirma * (1 + yakınlastirmaCarpani), 5)
      : Math.max(gorunumDurumu.yakinlastirma * (1 - yakınlastirmaCarpani), 0.1)

    // fareye yakinlas
    const fareX = e.clientX
    const fareY = e.clientY
    const oran = yeniYakinlastirma / gorunumDurumu.yakinlastirma

    gorunumDurumuAyarla({
      yakinlastirma: yeniYakinlastirma,
      kaydirmaX: fareX - (fareX - gorunumDurumu.kaydirmaX) * oran,
      kaydirmaY: fareY - (fareY - gorunumDurumu.kaydirmaY) * oran,
    })
  }, [gorunumDurumu])

  // tuş bastı handler
  const tusBastiHandler = useCallback((e) => {
    // ctrl+z geri al
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      const yeniOgeler = geriAl()
      return { geriAlindi: true, yeniOgeler }
    }

    // ctrl+shift+z yeniden yap
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || e.key === 'y')) {
      e.preventDefault()
      const yeniOgeler = yenidenYap()
      return { yenidenYapildi: true, yeniOgeler }
    }

    // delete secili ogeyi sil
    if ((e.key === 'Delete' || e.key === 'Backspace') && seciliOgeId) {
      // girdi alani ise isleme
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      e.preventDefault()
      gecmiseKaydet()
      const silinenId = seciliOgeId
      const yeniOgeler = sonOgelerRef.current.filter((o) => o.id !== seciliOgeId)
      ogeleriAyarla(yeniOgeler)
      seciliOgeIdAyarla(null)
      return { silinenId, yeniOgeler }
    }

    // space kaydir
    if (e.key === ' ' && !e.repeat) {
      e.preventDefault()
      kaydiriyorRef.current = true
    }

    // escape secimi kaldir
    if (e.key === 'Escape') {
      seciliOgeIdAyarla(null)
    }

    return null
  }, [seciliOgeId, geriAl, yenidenYap, gecmiseKaydet])

  // tuş bıraktı handler
  const tusBiraktiHandler = useCallback((e) => {
    if (e.key === ' ') {
      kaydiriyorRef.current = false
    }
  }, [])

  // yakınlaştırmayı ayarla
  const yakinlastirmaAyarla = useCallback((yeniDeger) => {
    gorunumDurumuAyarla((onceki) => ({
      ...onceki,
      yakinlastirma: Math.max(0.1, Math.min(5, yeniDeger)),
    }))
  }, [])

  // sığdır
  const ekranaSigdir = useCallback(() => {
    gorunumDurumuAyarla({
      kaydirmaX: 0,
      kaydirmaY: 0,
      yakinlastirma: 1,
    })
  }, [])

  // seçili öğeyi güncelle
  const seciliOgeGuncelle = useCallback((guncellemeler) => {
    if (!seciliOgeId) return null
    gecmiseKaydet()
    const yeniOgeler = sonOgelerRef.current.map((o) =>
      o.id === seciliOgeId ? { ...o, ...guncellemeler } : o
    )
    ogeleriAyarla(yeniOgeler)
    return yeniOgeler
  }, [seciliOgeId, gecmiseKaydet])

  // seçili öğeyi sil
  const seciliOgeSil = useCallback(() => {
    if (!seciliOgeId) return null
    gecmiseKaydet()
    const silinenId = seciliOgeId
    const yeniOgeler = sonOgelerRef.current.filter((o) => o.id !== seciliOgeId)
    ogeleriAyarla(yeniOgeler)
    seciliOgeIdAyarla(null)
    return { silinenId, yeniOgeler }
  }, [seciliOgeId, gecmiseKaydet])

  return {
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
    ogeSecHandler,
    yakinlastirmaAyarla,
    ekranaSigdir,
    seciliOgeGuncelle,
    seciliOgeSil,
    gecmisRef,
    gelecekRef,
    yeniOgeOlustur,
    gecmiseKaydet,
  }
}
