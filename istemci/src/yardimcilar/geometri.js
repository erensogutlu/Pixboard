// iki nokta arasındaki mesafe
export function noktaMesafesi(n1, n2) {
  return Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2))
}

// noktanın dikdörtgen içinde olup olmadığını kontrol et
export function noktaDikdortgenIcinde(nokta, dikdortgen) {
  const minX = Math.min(dikdortgen.x, dikdortgen.x + dikdortgen.genislik)
  const maxX = Math.max(dikdortgen.x, dikdortgen.x + dikdortgen.genislik)
  const minY = Math.min(dikdortgen.y, dikdortgen.y + dikdortgen.yukseklik)
  const maxY = Math.max(dikdortgen.y, dikdortgen.y + dikdortgen.yukseklik)

  return nokta.x >= minX && nokta.x <= maxX && nokta.y >= minY && nokta.y <= maxY
}

// noktanın elips içinde olup olmadığını kontrol et
export function noktaElipsIcinde(nokta, elips) {
  const merkezX = elips.x + elips.genislik / 2
  const merkezY = elips.y + elips.yukseklik / 2
  const yaricapX = Math.abs(elips.genislik) / 2
  const yaricapY = Math.abs(elips.yukseklik) / 2

  if (yaricapX === 0 || yaricapY === 0) return false

  const normalX = (nokta.x - merkezX) / yaricapX
  const normalY = (nokta.y - merkezY) / yaricapY

  return normalX * normalX + normalY * normalY <= 1
}

// noktanın çizgi üzerinde olup olmadığını kontrol et
export function noktaCizgiUzerinde(nokta, baslangic, bitis, tolerans = 5) {
  const mesafe =
    Math.abs(
      (bitis.y - baslangic.y) * nokta.x -
      (bitis.x - baslangic.x) * nokta.y +
      bitis.x * baslangic.y -
      bitis.y * baslangic.x
    ) / noktaMesafesi(baslangic, bitis)

  // çizgi uzunluğu çok kısa ise nokta mesafesini kontrol et
  const cizgiUzunlugu = noktaMesafesi(baslangic, bitis)
  if (cizgiUzunlugu < 1) {
    return noktaMesafesi(nokta, baslangic) <= tolerans
  }

  // noktanın çizginin sınırları içinde olduğunu kontrol et
  const minX = Math.min(baslangic.x, bitis.x) - tolerans
  const maxX = Math.max(baslangic.x, bitis.x) + tolerans
  const minY = Math.min(baslangic.y, bitis.y) - tolerans
  const maxY = Math.max(baslangic.y, bitis.y) + tolerans

  return mesafe <= tolerans && nokta.x >= minX && nokta.x <= maxX && nokta.y >= minY && nokta.y <= maxY
}

// noktanın serbest çizim noktaları üzerinde olup olmadığını kontrol et
export function noktaSerbestCizimUzerinde(nokta, noktalar, tolerans = 8) {
  if (!noktalar || noktalar.length < 2) return false

  for (let i = 0; i < noktalar.length - 1; i++) {
    const baslangic = { x: noktalar[i][0], y: noktalar[i][1] }
    const bitis = { x: noktalar[i + 1][0], y: noktalar[i + 1][1] }

    if (noktaCizgiUzerinde(nokta, baslangic, bitis, tolerans)) {
      return true
    }
  }
  return false
}

// noktanın baklava (elmas) içinde olup olmadığını kontrol et
export function noktaBaklavaIcinde(nokta, oge) {
  const merkezX = oge.x + oge.genislik / 2
  const merkezY = oge.y + oge.yukseklik / 2
  const yarimGenislik = Math.abs(oge.genislik) / 2
  const yarimYukseklik = Math.abs(oge.yukseklik) / 2

  if (yarimGenislik === 0 || yarimYukseklik === 0) return false

  const normalX = Math.abs(nokta.x - merkezX) / yarimGenislik
  const normalY = Math.abs(nokta.y - merkezY) / yarimYukseklik

  return normalX + normalY <= 1
}

// öğenin sınır kutusunu al
export function sinirKutusuAl(oge) {
  if (!oge) return null

  switch (oge.tip) {
    case 'kalem': {
      if (!oge.noktalar || oge.noktalar.length === 0) return null
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const [nx, ny] of oge.noktalar) {
        minX = Math.min(minX, nx)
        minY = Math.min(minY, ny)
        maxX = Math.max(maxX, nx)
        maxY = Math.max(maxY, ny)
      }
      const bosluk = (oge.cizgiKalinligi || 2) + 4
      return {
        x: minX - bosluk,
        y: minY - bosluk,
        genislik: maxX - minX + bosluk * 2,
        yukseklik: maxY - minY + bosluk * 2,
      }
    }
    case 'cizgi':
    case 'ok': {
      const minX = Math.min(oge.x, oge.x + (oge.genislik || 0))
      const minY = Math.min(oge.y, oge.y + (oge.yukseklik || 0))
      const maxX = Math.max(oge.x, oge.x + (oge.genislik || 0))
      const maxY = Math.max(oge.y, oge.y + (oge.yukseklik || 0))
      const bosluk = (oge.cizgiKalinligi || 2) + 4
      return {
        x: minX - bosluk,
        y: minY - bosluk,
        genislik: maxX - minX + bosluk * 2,
        yukseklik: maxY - minY + bosluk * 2,
      }
    }
    case 'metin': {
      return {
        x: oge.x - 4,
        y: oge.y - 4,
        genislik: (oge.genislik || 100) + 8,
        yukseklik: (oge.yukseklik || 28) + 8,
      }
    }
    default: {
      const bosluk = 4
      return {
        x: Math.min(oge.x, oge.x + (oge.genislik || 0)) - bosluk,
        y: Math.min(oge.y, oge.y + (oge.yukseklik || 0)) - bosluk,
        genislik: Math.abs(oge.genislik || 0) + bosluk * 2,
        yukseklik: Math.abs(oge.yukseklik || 0) + bosluk * 2,
      }
    }
  }
}

// noktanın öğe üzerinde olup olmadığını kontrol et
export function noktaOgeUzerinde(nokta, oge) {
  if (!oge) return false

  switch (oge.tip) {
    case 'dikdortgen':
      return noktaDikdortgenIcinde(nokta, oge)

    case 'elips':
      return noktaElipsIcinde(nokta, oge)

    case 'cizgi':
      return noktaCizgiUzerinde(
        nokta,
        { x: oge.x, y: oge.y },
        { x: oge.x + (oge.genislik || 0), y: oge.y + (oge.yukseklik || 0) },
        8
      )

    case 'ok':
      return noktaCizgiUzerinde(
        nokta,
        { x: oge.x, y: oge.y },
        { x: oge.x + (oge.genislik || 0), y: oge.y + (oge.yukseklik || 0) },
        8
      )

    case 'kalem':
      return noktaSerbestCizimUzerinde(nokta, oge.noktalar)

    case 'metin': {
      const metinKutusu = {
        x: oge.x,
        y: oge.y,
        genislik: oge.genislik || 100,
        yukseklik: oge.yukseklik || 28,
      }
      return noktaDikdortgenIcinde(nokta, metinKutusu)
    }

    case 'baklava':
      return noktaBaklavaIcinde(nokta, oge)

    default:
      return false
  }
}

// boyutlandırma tutamacı konumunu kontrol et
export function tutamacKontrolu(nokta, oge, tutamacBoyutu = 8) {
  const kutu = sinirKutusuAl(oge)
  if (!kutu) return null

  const tutamaclar = [
    { ad: 'sol-ust', x: kutu.x, y: kutu.y },
    { ad: 'sag-ust', x: kutu.x + kutu.genislik, y: kutu.y },
    { ad: 'sol-alt', x: kutu.x, y: kutu.y + kutu.yukseklik },
    { ad: 'sag-alt', x: kutu.x + kutu.genislik, y: kutu.y + kutu.yukseklik },
  ]

  for (const tutamac of tutamaclar) {
    if (
      Math.abs(nokta.x - tutamac.x) <= tutamacBoyutu &&
      Math.abs(nokta.y - tutamac.y) <= tutamacBoyutu
    ) {
      return tutamac.ad
    }
  }

  return null
}

// ekran koordinatlarını tuval koordinatlarına dönüştür
export function ekranToTuval(ekranX, ekranY, gorunumDurumu) {
  return {
    x: (ekranX - gorunumDurumu.kaydirmaX) / gorunumDurumu.yakinlastirma,
    y: (ekranY - gorunumDurumu.kaydirmaY) / gorunumDurumu.yakinlastirma,
  }
}

// tuval koordinatlarını ekran koordinatlarına dönüştür
export function tuvalToEkran(tuvalX, tuvalY, gorunumDurumu) {
  return {
    x: tuvalX * gorunumDurumu.yakinlastirma + gorunumDurumu.kaydirmaX,
    y: tuvalY * gorunumDurumu.yakinlastirma + gorunumDurumu.kaydirmaY,
  }
}
