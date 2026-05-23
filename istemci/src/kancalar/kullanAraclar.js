import { useState, useCallback } from 'react'
import { varsayilanStil } from '../yardimcilar/renkler.js'

// mevcut araçlar
export const ARACLAR = [
  { id: 'secim', ad: 'Seçim', kisayol: 'V' },
  { id: 'kalem', ad: 'Kalem', kisayol: 'P' },
  { id: 'dikdortgen', ad: 'Dikdörtgen', kisayol: 'R' },
  { id: 'elips', ad: 'Elips', kisayol: 'O' },
  { id: 'cizgi', ad: 'Çizgi', kisayol: 'L' },
  { id: 'ok', ad: 'Ok', kisayol: 'A' },
  { id: 'metin', ad: 'Metin', kisayol: 'T' },
  { id: 'baklava', ad: 'Baklava', kisayol: 'D' },
  { id: 'silgi', ad: 'Silgi', kisayol: 'E' },
]

// araç yönetimi kancası
export function kullanAraclar() {
  const [seciliArac, seciliAracAyarla] = useState('secim')
  const [stil, stilAyarla] = useState({ ...varsayilanStil })

  // stil güncelle (kısmi güncelleme)
  const stilGuncelle = useCallback((yeniStil) => {
    stilAyarla((onceki) => ({ ...onceki, ...yeniStil }))
  }, [])

  // aracı seç
  const aracSec = useCallback((aracId) => {
    seciliAracAyarla(aracId)
  }, [])

  // çizim aracı mı kontrolü
  const cizimAraciMi = useCallback((arac) => {
    return ['kalem', 'dikdortgen', 'elips', 'cizgi', 'ok', 'metin', 'baklava'].includes(arac || seciliArac)
  }, [seciliArac])

  return {
    seciliArac,
    seciliAracAyarla: aracSec,
    stil,
    stilAyarla,
    stilGuncelle,
    cizimAraciMi,
  }
}
