import { getStroke } from 'perfect-freehand'

// serbest çizim için vuruş noktalarını svg yoluna çevir
function noktalarSvgYolunaCevir(noktalar) {
  if (!noktalar || noktalar.length === 0) return ''

  const d = []
  const [ilkNokta, ...kalanNoktalar] = noktalar

  d.push(`M ${ilkNokta[0].toFixed(2)} ${ilkNokta[1].toFixed(2)}`)

  for (let i = 0; i < kalanNoktalar.length; i++) {
    const [x, y] = kalanNoktalar[i]
    d.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`)
  }

  d.push('Z')
  return d.join(' ')
}

// rough.js seçeneklerini oluştur
function roughSecenekleriOlustur(oge) {
  return {
    roughness: 1.2,
    stroke: oge.cizgiRengi || '#e8e8f0',
    strokeWidth: oge.cizgiKalinligi || 2,
    fill: oge.dolguRengi && oge.dolguRengi !== 'transparent' ? oge.dolguRengi : undefined,
    fillStyle: 'hachure',
    seed: oge.tohum || 1,
    bowing: 1,
  }
}

// dikdörtgen çiz
export function dikdortgenCiz(roughTuval, oge) {
  if (!roughTuval) return null
  const secenekler = roughSecenekleriOlustur(oge)
  return roughTuval.rectangle(
    oge.x,
    oge.y,
    oge.genislik || 0,
    oge.yukseklik || 0,
    secenekler
  )
}

// elips çiz
export function elipsCiz(roughTuval, oge) {
  if (!roughTuval) return null
  const secenekler = roughSecenekleriOlustur(oge)
  const merkezX = oge.x + (oge.genislik || 0) / 2
  const merkezY = oge.y + (oge.yukseklik || 0) / 2
  return roughTuval.ellipse(
    merkezX,
    merkezY,
    Math.abs(oge.genislik || 0),
    Math.abs(oge.yukseklik || 0),
    secenekler
  )
}

// çizgi çiz
export function cizgiCiz(roughTuval, oge) {
  if (!roughTuval) return null
  const secenekler = roughSecenekleriOlustur(oge)
  return roughTuval.line(
    oge.x,
    oge.y,
    oge.x + (oge.genislik || 0),
    oge.y + (oge.yukseklik || 0),
    secenekler
  )
}

// ok çiz
export function okCiz(ctx, roughTuval, oge) {
  if (!roughTuval || !ctx) return null

  // çizgi kısmını çiz
  const secenekler = roughSecenekleriOlustur(oge)
  const cizgiSonucu = roughTuval.line(
    oge.x,
    oge.y,
    oge.x + (oge.genislik || 0),
    oge.y + (oge.yukseklik || 0),
    secenekler
  )

  // ok başı çiz
  const bitisX = oge.x + (oge.genislik || 0)
  const bitisY = oge.y + (oge.yukseklik || 0)
  const aci = Math.atan2(oge.yukseklik || 0, oge.genislik || 0)
  const okBoyutu = 16 + (oge.cizgiKalinligi || 2) * 2

  ctx.save()
  ctx.strokeStyle = oge.cizgiRengi || '#e8e8f0'
  ctx.fillStyle = oge.cizgiRengi || '#e8e8f0'
  ctx.lineWidth = oge.cizgiKalinligi || 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(
    bitisX - okBoyutu * Math.cos(aci - Math.PI / 6),
    bitisY - okBoyutu * Math.sin(aci - Math.PI / 6)
  )
  ctx.lineTo(bitisX, bitisY)
  ctx.lineTo(
    bitisX - okBoyutu * Math.cos(aci + Math.PI / 6),
    bitisY - okBoyutu * Math.sin(aci + Math.PI / 6)
  )
  ctx.stroke()
  ctx.restore()

  return cizgiSonucu
}

// baklava (elmas) çiz
export function baklavaCiz(roughTuval, oge) {
  if (!roughTuval) return null
  const secenekler = roughSecenekleriOlustur(oge)

  const merkezX = oge.x + (oge.genislik || 0) / 2
  const merkezY = oge.y + (oge.yukseklik || 0) / 2
  const yarimG = Math.abs(oge.genislik || 0) / 2
  const yarimY = Math.abs(oge.yukseklik || 0) / 2

  return roughTuval.polygon(
    [
      [merkezX, merkezY - yarimY],     // üst
      [merkezX + yarimG, merkezY],     // sağ
      [merkezX, merkezY + yarimY],     // alt
      [merkezX - yarimG, merkezY],     // sol
    ],
    secenekler
  )
}

// serbest çizim çiz (perfect-freehand kullanarak)
export function serbestCiz(ctx, oge) {
  if (!ctx || !oge.noktalar || oge.noktalar.length < 2) return

  const vurusNoktalar = getStroke(oge.noktalar, {
    size: (oge.cizgiKalinligi || 2) * 2.5,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t) => t,
    start: {
      taper: 0,
      cap: true,
    },
    end: {
      taper: 0,
      cap: true,
    },
  })

  const yolVerisi = noktalarSvgYolunaCevir(vurusNoktalar)
  if (!yolVerisi) return

  const yol = new Path2D(yolVerisi)
  ctx.save()
  ctx.fillStyle = oge.cizgiRengi || '#e8e8f0'
  ctx.globalAlpha = oge.opaklık ?? 1
  ctx.fill(yol)
  ctx.restore()
}

// metin çiz
export function metinCiz(ctx, oge) {
  if (!ctx || !oge.metin) return

  ctx.save()
  const yaziBoyutu = (oge.cizgiKalinligi || 2) * 8 + 8
  ctx.font = `${yaziBoyutu}px 'Inter', sans-serif`
  ctx.fillStyle = oge.cizgiRengi || '#e8e8f0'
  ctx.globalAlpha = oge.opaklık ?? 1
  ctx.textBaseline = 'top'

  // çok satırlı metin desteği
  const satirlar = oge.metin.split('\n')
  const satirYuksekligi = yaziBoyutu * 1.4

  satirlar.forEach((satir, indeks) => {
    ctx.fillText(satir, oge.x, oge.y + indeks * satirYuksekligi)
  })

  ctx.restore()
}

// seçim kutusunu çiz
export function secimKutusuCiz(ctx, oge) {
  if (!ctx || !oge) return


  // sınır kutusunu dinamik olarak hesapla
  let kutu
  if (oge.tip === 'kalem') {
    if (!oge.noktalar || oge.noktalar.length === 0) return
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const [nx, ny] of oge.noktalar) {
      minX = Math.min(minX, nx)
      minY = Math.min(minY, ny)
      maxX = Math.max(maxX, nx)
      maxY = Math.max(maxY, ny)
    }
    const bosluk = (oge.cizgiKalinligi || 2) + 4
    kutu = { x: minX - bosluk, y: minY - bosluk, genislik: maxX - minX + bosluk * 2, yukseklik: maxY - minY + bosluk * 2 }
  } else if (oge.tip === 'metin') {
    kutu = { x: oge.x - 4, y: oge.y - 4, genislik: (oge.genislik || 100) + 8, yukseklik: (oge.yukseklik || 28) + 8 }
  } else {
    const bosluk = 4
    kutu = {
      x: Math.min(oge.x, oge.x + (oge.genislik || 0)) - bosluk,
      y: Math.min(oge.y, oge.y + (oge.yukseklik || 0)) - bosluk,
      genislik: Math.abs(oge.genislik || 0) + bosluk * 2,
      yukseklik: Math.abs(oge.yukseklik || 0) + bosluk * 2,
    }
  }

  ctx.save()

  // seçim çerçevesi
  ctx.strokeStyle = '#7c5cff'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.strokeRect(kutu.x, kutu.y, kutu.genislik, kutu.yukseklik)
  ctx.setLineDash([])

  // tutamacları çiz
  const tutamacBoyutu = 7
  const tutamacKonumlari = [
    { x: kutu.x, y: kutu.y },
    { x: kutu.x + kutu.genislik, y: kutu.y },
    { x: kutu.x, y: kutu.y + kutu.yukseklik },
    { x: kutu.x + kutu.genislik, y: kutu.y + kutu.yukseklik },
  ]

  tutamacKonumlari.forEach(({ x, y }) => {
    ctx.fillStyle = '#0a0a0f'
    ctx.strokeStyle = '#7c5cff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, tutamacBoyutu, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })

  ctx.restore()
}

// ana çizim fonksiyonu — tüm öğe tiplerini yönlendirir
export function ogeCiz(ctx, roughTuval, oge) {
  if (!oge) return

  ctx.save()
  ctx.globalAlpha = oge.opaklık ?? 1

  switch (oge.tip) {
    case 'dikdortgen':
      dikdortgenCiz(roughTuval, oge)
      break
    case 'elips':
      elipsCiz(roughTuval, oge)
      break
    case 'cizgi':
      cizgiCiz(roughTuval, oge)
      break
    case 'ok':
      okCiz(ctx, roughTuval, oge)
      break
    case 'baklava':
      baklavaCiz(roughTuval, oge)
      break
    case 'kalem':
      ctx.globalAlpha = 1 // serbest çizim kendi opaklığını yönetir
      serbestCiz(ctx, oge)
      break
    case 'metin':
      ctx.globalAlpha = 1 // metin kendi opaklığını yönetir
      metinCiz(ctx, oge)
      break
    default:
      break
  }

  ctx.restore()
}
