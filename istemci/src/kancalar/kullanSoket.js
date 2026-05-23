import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

// soket bağlantı kancası
export function kullanSoket(geriCagirmalar = {}) {
  const soketRef = useRef(null)
  const [baglandi, baglandiAyarla] = useState(false)
  const [kullanicilar, kullanicilarAyarla] = useState([])
  const [imlecler, imleclerAyarla] = useState({})
  const geriCagirmaRef = useRef(geriCagirmalar)

  // geri çağırma referansını güncelle
  useEffect(() => {
    geriCagirmaRef.current = geriCagirmalar
  }, [geriCagirmalar])

  // soket bağlantısını başlat
  useEffect(() => {
    // backend baglantisi
    const varsayilanHedef = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:3001'
      : window.location.origin;

    const soketHedef = import.meta.env.VITE_API_URL || varsayilanHedef;

    const soket = io(soketHedef, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    soketRef.current = soket

    soket.on('connect', () => {
      baglandiAyarla(true)
      console.log('// soket bağlantısı kuruldu');
    })

    soket.on('disconnect', () => {
      baglandiAyarla(false)
      console.log('// soket bağlantısı kesildi');
    })

    // oda durumu
    soket.on('oda-durumu', (veri) => {
      const { kullanicilar: odaKullanicilari, mevcutIcerik } = veri
      kullanicilarAyarla(odaKullanicilari)
      if (geriCagirmaRef.current.tahtaVerileriAlindi) {
        geriCagirmaRef.current.tahtaVerileriAlindi(mevcutIcerik || [])
      }
    })

    // yeni kullanıcı katıldı
    soket.on('kullanici-katildi', (veri) => {
      const { kullanicilar: odaKullanicilari } = veri
      kullanicilarAyarla(odaKullanicilari)
    })

    // kullanıcı ayrıldı
    soket.on('kullanici-ayrildi', (veri) => {
      const { soketId, kullanicilar: odaKullanicilari } = veri
      kullanicilarAyarla(odaKullanicilari)
      imleclerAyarla((onceki) => {
        const yeni = { ...onceki }
        delete yeni[soketId]
        return yeni
      })
    })

    // yeni öğe eklendi
    soket.on('oge-eklendi', (veri) => {
      const { oge } = veri
      if (geriCagirmaRef.current.ogeEklendi) {
        geriCagirmaRef.current.ogeEklendi(oge)
      }
    })

    // öğe güncellendi
    soket.on('oge-guncellendi', (veri) => {
      const { ogeId, degisiklikler } = veri
      if (geriCagirmaRef.current.ogeGuncellendi) {
        geriCagirmaRef.current.ogeGuncellendi({ ogeId, degisiklikler })
      }
    })

    // öğe silindi
    soket.on('oge-silindi', (veri) => {
      const { ogeId } = veri
      if (geriCagirmaRef.current.ogeSilindi) {
        geriCagirmaRef.current.ogeSilindi(ogeId)
      }
    })

    // tahta guncellendi
    soket.on('tahta-guncellendi', (icerik) => {
      if (geriCagirmaRef.current.tahtaVerileriAlindi) {
        geriCagirmaRef.current.tahtaVerileriAlindi(icerik || [])
      }
    })

    // imleç güncellendi
    soket.on('imlec-guncellendi', (veri) => {
      const { soketId, kullaniciAdi, renk, x, y } = veri
      imleclerAyarla((onceki) => ({
        ...onceki,
        [soketId]: { x, y, kullaniciAdi, renk },
      }))
    })

    return () => {
      soket.disconnect()
    }
  }, [])

  // odaya katıl
  const odayaKatil = useCallback((tahtaId, kullaniciAdi, sifre, token) => {
    if (soketRef.current) {
      soketRef.current.emit('odaya-katil', { tahtaId, kullaniciAdi, sifre, token })
    }
  }, [])

  // öğe gönder
  const ogeGonder = useCallback((tahtaId, oge) => {
    if (soketRef.current) {
      soketRef.current.emit('oge-ekle', { tahtaId, oge })
    }
  }, [])

  // öğe güncelle
  const ogeGuncelle = useCallback((tahtaId, ogeId, degisiklikler) => {
    if (soketRef.current) {
      soketRef.current.emit('oge-guncelle', { tahtaId, ogeId, degisiklikler })
    }
  }, [])

  // öğe sil
  const ogeSil = useCallback((tahtaId, ogeId) => {
    if (soketRef.current) {
      soketRef.current.emit('oge-sil', { tahtaId, ogeId })
    }
  }, [])

  // imleç gönder
  const imlecGonder = useCallback((tahtaId, x, y) => {
    if (soketRef.current) {
      soketRef.current.emit('imlec-hareket', { tahtaId, x, y })
    }
  }, [])

  // tahta kaydet
  const tahtaKaydet = useCallback((tahtaId, icerik) => {
    if (soketRef.current) {
      soketRef.current.emit('tahta-kaydet', { tahtaId, icerik })
    }
  }, [])

  return {
    soket: soketRef.current,
    baglandi,
    kullanicilar,
    imlecler,
    odayaKatil,
    ogeGonder,
    ogeGuncelle,
    ogeSil,
    imlecGonder,
    tahtaKaydet,
  }
}

