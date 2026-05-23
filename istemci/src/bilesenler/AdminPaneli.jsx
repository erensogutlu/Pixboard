import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPaneli.css';

export default function AdminPaneli() {
  const navigate = useNavigate();
  const [oturumKullanici, oturumKullaniciAyarla] = useState(null);
  const [yukleniyor, yukleniyorAyarla] = useState(true);
  const [aktifTab, aktifTabAyarla] = useState('istatistikler'); // 'istatistikler', 'kullanicilar', 'tahtalar'

  // istatistik durumlari
  const [istatistikler, istatistiklerAyarla] = useState({ toplamKullanici: 0, toplamTahta: 0 });
  const [istatistikYukleniyor, istatistikYukleniyorAyarla] = useState(false);

  // kullanici durumlari
  const [kullanicilar, kullanicilarAyarla] = useState([]);
  const [kullaniciArama, kullaniciAramaAyarla] = useState('');
  const [kullaniciYukleniyor, kullaniciYukleniyorAyarla] = useState(false);
  const [duzenlenenKullanici, duzenlenenKullaniciAyarla] = useState(null);
  const [yeniSifre, yeniSifreAyarla] = useState('');
  const [kullaniciModalHata, kullaniciModalHataAyarla] = useState('');

  // tahta durumlari
  const [tahtalar, tahtalarAyarla] = useState([]);
  const [tahtaArama, tahtaAramaAyarla] = useState('');
  const [tahtaYukleniyor, tahtaYukleniyorAyarla] = useState(false);
  const [duzenlenenTahta, duzenlenenTahtaAyarla] = useState(null);
  const [tahtaModalHata, tahtaModalHataAyarla] = useState('');

  // bildirimler
  const [genelHata, genelHataAyarla] = useState('');
  const [genelBasari, genelBasariAyarla] = useState('');

  // silme onay modal
  const [silmeTipi, silmeTipiAyarla] = useState(null); // 'kullanici' veya 'tahta'
  const [silinecekId, silinecekIdAyarla] = useState(null);
  const [silinecekIsim, silinecekIsimAyarla] = useState('');

  // profil kontrolu
  useEffect(() => {
    const kontrolEt = async () => {
      const token = localStorage.getItem('pixboard_token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const yanit = await fetch('/api/auth/profil', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (yanit.ok) {
          const veri = await yanit.json();
          if (veri.kullanici.rol === 'admin') {
            oturumKullaniciAyarla(veri.kullanici);
            yukleniyorAyarla(false);
          } else {
            navigate('/');
          }
        } else {
          localStorage.removeItem('pixboard_token');
          navigate('/');
        }
      } catch (hata) {
        console.error('Profil kontrol hatası:', hata);
        navigate('/');
      }
    };

    kontrolEt();
  }, [navigate]);

  // verileri yukle
  useEffect(() => {
    if (yukleniyor || !oturumKullanici) return;

    if (aktifTab === 'istatistikler') {
      istatistikYukle();
    } else if (aktifTab === 'kullanicilar') {
      kullanicilarYukle();
    } else if (aktifTab === 'tahtalar') {
      tahtalarYukle();
    }
  }, [aktifTab, yukleniyor, oturumKullanici]);

  const bildirimGoster = (mesaj, tip = 'basari') => {
    if (tip === 'basari') {
      genelBasariAyarla(mesaj);
      setTimeout(() => genelBasariAyarla(''), 4000);
    } else {
      genelHataAyarla(mesaj);
      setTimeout(() => genelHataAyarla(''), 4000);
    }
  };

  const istatistikYukle = async () => {
    istatistikYukleniyorAyarla(true);
    try {
      const token = localStorage.getItem('pixboard_token');
      const yanit = await fetch('/api/admin/istatistikler', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (yanit.ok) {
        const veri = await yanit.json();
        istatistiklerAyarla(veri);
      } else {
        bildirimGoster('İstatistikler yüklenemedi.', 'hata');
      }
    } catch (hata) {
      console.error(hata);
      bildirimGoster('Bağlantı hatası.', 'hata');
    } finally {
      istatistikYukleniyorAyarla(false);
    }
  };

  const kullanicilarYukle = async () => {
    kullaniciYukleniyorAyarla(true);
    try {
      const token = localStorage.getItem('pixboard_token');
      const yanit = await fetch('/api/admin/kullanicilar', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (yanit.ok) {
        const veri = await yanit.json();
        kullanicilarAyarla(veri);
      } else {
        bildirimGoster('Kullanıcı listesi yüklenemedi.', 'hata');
      }
    } catch (hata) {
      console.error(hata);
      bildirimGoster('Bağlantı hatası.', 'hata');
    } finally {
      kullaniciYukleniyorAyarla(false);
    }
  };

  const tahtalarYukle = async () => {
    tahtaYukleniyorAyarla(true);
    try {
      const token = localStorage.getItem('pixboard_token');
      const yanit = await fetch('/api/admin/tahtalar', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (yanit.ok) {
        const veri = await yanit.json();
        tahtalarAyarla(veri);
      } else {
        bildirimGoster('Tahta listesi yüklenemedi.', 'hata');
      }
    } catch (hata) {
      console.error(hata);
      bildirimGoster('Bağlantı hatası.', 'hata');
    } finally {
      tahtaYukleniyorAyarla(false);
    }
  };

  // kullanici guncelle
  const kullaniciDuzenleKaydet = async (e) => {
    e.preventDefault();
    kullaniciModalHataAyarla('');
    const token = localStorage.getItem('pixboard_token');
    
    try {
      const yanit = await fetch(`/api/admin/kullanicilar/${duzenlenenKullanici.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          kullaniciAdi: duzenlenenKullanici.kullaniciAdi,
          rol: duzenlenenKullanici.rol,
          sifre: yeniSifre
        })
      });

      const veri = await yanit.json();
      if (yanit.ok) {
        bildirimGoster('Kullanıcı başarıyla güncellendi.');
        duzenlenenKullaniciAyarla(null);
        yeniSifreAyarla('');
        kullanicilarYukle();
      } else {
        kullaniciModalHataAyarla(veri.mesaj || 'Güncelleme başarısız.');
      }
    } catch (hata) {
      kullaniciModalHataAyarla('Bağlantı hatası oluştu.');
    }
  };

  // tahta guncelle
  const tahtaDuzenleKaydet = async (e) => {
    e.preventDefault();
    tahtaModalHataAyarla('');
    const token = localStorage.getItem('pixboard_token');

    try {
      const yanit = await fetch(`/api/admin/tahtalar/${duzenlenenTahta.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          baslik: duzenlenenTahta.baslik,
          gizli: duzenlenenTahta.gizli,
          sifre: duzenlenenTahta.sifre
        })
      });

      const veri = await yanit.json();
      if (yanit.ok) {
        bildirimGoster('Tahta başarıyla güncellendi.');
        duzenlenenTahtaAyarla(null);
        tahtalarYukle();
      } else {
        tahtaModalHataAyarla(veri.mesaj || 'Güncelleme başarısız.');
      }
    } catch (hata) {
      tahtaModalHataAyarla('Bağlantı hatası oluştu.');
    }
  };

  // silme onayi baslat
  const silmeOnayiBaslat = (id, isim, tip) => {
    silmeTipiAyarla(tip);
    silinecekIdAyarla(id);
    silinecekIsimAyarla(isim);
  };

  // sil
  const silmeOnayla = async () => {
    const token = localStorage.getItem('pixboard_token');
    const id = silinecekId;
    const tip = silmeTipi;

    silmeTipiAyarla(null);
    silinecekIdAyarla(null);
    silinecekIsimAyarla('');

    try {
      const url = tip === 'kullanici' ? `/api/admin/kullanicilar/${id}` : `/api/admin/tahtalar/${id}`;
      const yanit = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const veri = await yanit.json();
      if (yanit.ok) {
        bildirimGoster(tip === 'kullanici' ? 'Kullanıcı silindi.' : 'Tahta silindi.');
        if (tip === 'kullanici') kullanicilarYukle();
        else tahtalarYukle();
      } else {
        bildirimGoster(veri.mesaj || 'Silme işlemi gerçekleştirilemedi.', 'hata');
      }
    } catch (hata) {
      bildirimGoster('Silme işlemi başarısız: Bağlantı hatası.', 'hata');
    }
  };

  // tarih formatla
  const tarihFormatla = (tarihStr) => {
    if (!tarihStr) return '-';
    return new Date(tarihStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (yukleniyor) {
    return (
      <div className="admin-yukleniyor-ekrani">
        <div className="arkaplan-efekt">
          <div className="efekt-daire efekt-daire-1" />
          <div className="efekt-daire efekt-daire-2" />
        </div>
        <div className="admin-spinner" />
        <span>Admin yetkileri doğrulanıyor...</span>
      </div>
    );
  }

  // filtrelenmis kullanicilar
  const filtrelenmisKullanicilar = kullanicilar.filter(k => 
    k.kullaniciAdi.toLowerCase().includes(kullaniciArama.toLowerCase()) ||
    k.rol.toLowerCase().includes(kullaniciArama.toLowerCase())
  );

  // filtrelenmis tahtalar
  const filtrelenmisTahtalar = tahtalar.filter(t => 
    (t.baslik || 'İsimsiz Tahta').toLowerCase().includes(tahtaArama.toLowerCase()) ||
    t.paylasimKodu.toLowerCase().includes(tahtaArama.toLowerCase()) ||
    (t.olusturanAdi || 'Anonim').toLowerCase().includes(tahtaArama.toLowerCase())
  );

  return (
    <div className="admin-paneli-sayfa">
      {/* glow efektleri */}
      <div className="arkaplan-efekt">
        <div className="efekt-daire efekt-daire-1" />
        <div className="efekt-daire efekt-daire-2" />
        <div className="efekt-daire efekt-daire-3" />
      </div>

      {/* bildirimler */}
      {genelBasari && <div className="admin-ust-bildirim basari">{genelBasari}</div>}
      {genelHata && <div className="admin-ust-bildirim hata">{genelHata}</div>}

      <div className="admin-icerik-konteyner">
        {/* ust bar */}
        <header className="admin-sayfa-basligi">
          <div className="admin-logo-bolumu">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="4" fill="url(#admin-logo-grad)" />
              <path d="M12 6V18M6 12H18" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="admin-logo-grad" x1="2" y1="2" x2="22" y2="22">
                  <stop stopColor="#ff5c7c" />
                  <stop offset="1" stopColor="#7c5cff" />
                </linearGradient>
              </defs>
            </svg>
            <div>
              <h1>Pixboard Admin</h1>
              <p>Yönetici Kontrol Paneli</p>
            </div>
          </div>

          <button className="admin-geri-butonu cam-panel" onClick={() => navigate('/')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Panolara Dön
          </button>
        </header>

        {/* tab menusu */}
        <div className="admin-tablar cam-panel">
          <button 
            className={`admin-tab-butonu ${aktifTab === 'istatistikler' ? 'aktif' : ''}`}
            onClick={() => aktifTabAyarla('istatistikler')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            İstatistikler
          </button>
          <button 
            className={`admin-tab-butonu ${aktifTab === 'kullanicilar' ? 'aktif' : ''}`}
            onClick={() => aktifTabAyarla('kullanicilar')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Kullanıcılar ({kullanicilar.length})
          </button>
          <button 
            className={`admin-tab-butonu ${aktifTab === 'tahtalar' ? 'aktif' : ''}`}
            onClick={() => aktifTabAyarla('tahtalar')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 17V7l7 5-7 5z" />
            </svg>
            Tahtalar ({tahtalar.length})
          </button>
        </div>

        {/* tab icerikleri */}
        <main className="admin-tab-icerigi">
          
          {/* 1. istatistikler tabi */}
          {aktifTab === 'istatistikler' && (
            <div className="istatistikler-tabi">
              {istatistikYukleniyor ? (
                <div className="admin-tab-yukleniyor"><div className="admin-spinner" /><span>Yükleniyor...</span></div>
              ) : (
                <div className="istatistik-kartlari">
                  <div className="istatistik-kart cam-panel">
                    <div className="istatistik-simge kullanici">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="istatistik-veri">
                      <h3>Kullanıcı Sayısı</h3>
                      <span className="istatistik-sayi">{istatistikler.toplamKullanici}</span>
                    </div>
                  </div>

                  <div className="istatistik-kart cam-panel">
                    <div className="istatistik-simge tahta">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M9 21V9" />
                      </svg>
                    </div>
                    <div className="istatistik-veri">
                      <h3>Oda / Tahta Sayısı</h3>
                      <span className="istatistik-sayi">{istatistikler.toplamTahta}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. kullanicilar tabi */}
          {aktifTab === 'kullanicilar' && (
            <div className="kullanicilar-tabi">
              <div className="arama-bar-konteyner cam-panel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="arama-simgesi">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input 
                  type="text" 
                  value={kullaniciArama} 
                  onChange={(e) => kullaniciAramaAyarla(e.target.value)} 
                  placeholder="Kullanıcı adı veya rolüne göre ara..." 
                  className="tab-arama-girdisi"
                />
              </div>

              {kullaniciYukleniyor ? (
                <div className="admin-tab-yukleniyor"><div className="admin-spinner" /><span>Yükleniyor...</span></div>
              ) : (
                <div className="tablo-konteyner cam-panel">
                  <table className="admin-tablo">
                    <thead>
                      <tr>
                        <th>Kullanıcı Adı</th>
                        <th>Rol</th>
                        <th>Kayıt Tarihi</th>
                        <th style={{ textAlign: 'right' }}>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrelenmisKullanicilar.length > 0 ? (
                        filtrelenmisKullanicilar.map(k => (
                          <tr key={k.id}>
                            <td className="kullanici-adi-sutun">
                              <div className="avatar-kucuk">{k.kullaniciAdi[0].toUpperCase()}</div>
                              {k.kullaniciAdi}
                              {k.id === oturumKullanici?.id && <span className="ben-rozet">Siz</span>}
                            </td>
                            <td>
                              <span className={`rol-rozet ${k.rol}`}>
                                {k.rol === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                              </span>
                            </td>
                            <td>{tarihFormatla(k.kayitTarihi)}</td>
                            <td className="aksiyonlar-sutun">
                              <button 
                                className="tablo-aksiyon-butonu duzenle" 
                                onClick={() => duzenlenenKullaniciAyarla(k)}
                                title="Düzenle"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button 
                                className="tablo-aksiyon-butonu sil" 
                                onClick={() => silmeOnayiBaslat(k.id, k.kullaniciAdi, 'kullanici')}
                                disabled={k.id === oturumKullanici?.id}
                                title={k.id === oturumKullanici?.id ? 'Kendi hesabınızı silemezsiniz' : 'Sil'}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="bos-tablo-mesaji">Kullanıcı bulunamadı.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. tahtalar tabi */}
          {aktifTab === 'tahtalar' && (
            <div className="tahtalar-tabi">
              <div className="arama-bar-konteyner cam-panel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="arama-simgesi">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input 
                  type="text" 
                  value={tahtaArama} 
                  onChange={(e) => tahtaAramaAyarla(e.target.value)} 
                  placeholder="Başlık, paylaşım kodu veya oluşturana göre ara..." 
                  className="tab-arama-girdisi"
                />
              </div>

              {tahtaYukleniyor ? (
                <div className="admin-tab-yukleniyor"><div className="admin-spinner" /><span>Yükleniyor...</span></div>
              ) : (
                <div className="tablo-konteyner cam-panel">
                  <table className="admin-tablo">
                    <thead>
                      <tr>
                        <th>Başlık</th>
                        <th>Paylaşım Kodu</th>
                        <th>Gizlilik</th>
                        <th>Öğe Sayısı</th>
                        <th>Oluşturan</th>
                        <th>Güncellenme Tarihi</th>
                        <th style={{ textAlign: 'right' }}>İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrelenmisTahtalar.length > 0 ? (
                        filtrelenmisTahtalar.map(t => (
                          <tr key={t.id}>
                            <td className="tahta-baslik-sutun">
                              <span className="tahta-adi">{t.baslik || 'İsimsiz Tahta'}</span>
                            </td>
                            <td>
                              <code className="paylasim-kod-etiketi">{t.paylasimKodu}</code>
                            </td>
                            <td>
                              <span className={`gizli-rozet ${t.gizli ? 'evet' : 'hayir'}`}>
                                {t.gizli ? 'Gizli' : 'Açık'}
                              </span>
                            </td>
                            <td>{t.ogeSayisi || 0}</td>
                            <td>{t.olusturanAdi || 'Anonim'}</td>
                            <td>{tarihFormatla(t.guncellenmeTarihi)}</td>
                            <td className="aksiyonlar-sutun">
                              <button 
                                className="tablo-aksiyon-butonu duzenle" 
                                onClick={() => duzenlenenTahtaAyarla(t)}
                                title="Düzenle"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button 
                                className="tablo-aksiyon-butonu sil" 
                                onClick={() => silmeOnayiBaslat(t.id, t.baslik || 'İsimsiz Tahta', 'tahta')}
                                title="Sil"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="bos-tablo-mesaji">Tahta bulunamadı.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* kullanici duzenleme */}
      {duzenlenenKullanici && (
        <div className="admin-modal-arkaplan" onClick={() => { duzenlenenKullaniciAyarla(null); yeniSifreAyarla(''); }}>
          <div className="admin-modal-icerik cam-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Kullanıcıyı Düzenle</h2>
            {kullaniciModalHata && <div className="modal-hata-kutusu">{kullaniciModalHata}</div>}
            
            <form onSubmit={kullaniciDuzenleKaydet} className="modal-form">
              <div className="form-grubu">
                <label>Kullanıcı Adı</label>
                <input 
                  type="text" 
                  value={duzenlenenKullanici.kullaniciAdi}
                  onChange={(e) => duzenlenenKullaniciAyarla({ ...duzenlenenKullanici, kullaniciAdi: e.target.value })}
                  required
                />
              </div>

              <div className="form-grubu">
                <label>Rolü</label>
                <select 
                  value={duzenlenenKullanici.rol} 
                  onChange={(e) => duzenlenenKullaniciAyarla({ ...duzenlenenKullanici, rol: e.target.value })}
                >
                  <option value="kullanici">Kullanıcı</option>
                  <option value="admin">Yönetici (Admin)</option>
                </select>
              </div>

              <div className="form-grubu">
                <label>Yeni Şifre (Sıfırlamak İstemiyorsanız Boş Bırakın)</label>
                <input 
                  type="password" 
                  placeholder="Yeni şifreyi girin..."
                  value={yeniSifre}
                  onChange={(e) => yeniSifreAyarla(e.target.value)}
                />
              </div>

              <div className="modal-butonlar">
                <button type="button" className="modal-butonu iptal" onClick={() => { duzenlenenKullaniciAyarla(null); yeniSifreAyarla(''); }}>
                  Vazgeç
                </button>
                <button type="submit" className="modal-butonu kaydet">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* tahta duzenleme */}
      {duzenlenenTahta && (
        <div className="admin-modal-arkaplan" onClick={() => duzenlenenTahtaAyarla(null)}>
          <div className="admin-modal-icerik cam-panel" onClick={(e) => e.stopPropagation()}>
            <h2>Tahtayı Düzenle</h2>
            {tahtaModalHata && <div className="modal-hata-kutusu">{tahtaModalHata}</div>}

            <form onSubmit={tahtaDuzenleKaydet} className="modal-form">
              <div className="form-grubu">
                <label>Tahta Başlığı</label>
                <input 
                  type="text" 
                  value={duzenlenenTahta.baslik}
                  onChange={(e) => duzenlenenTahtaAyarla({ ...duzenlenenTahta, baslik: e.target.value })}
                  required
                />
              </div>

              <div className="form-grubu checkbox-satiri">
                <input 
                  type="checkbox" 
                  id="modal-tahta-gizli"
                  checked={duzenlenenTahta.gizli}
                  onChange={(e) => duzenlenenTahtaAyarla({ ...duzenlenenTahta, gizli: e.target.checked })}
                />
                <label htmlFor="modal-tahta-gizli">Tahta Gizli (Şifreli) Olsun</label>
              </div>

              {duzenlenenTahta.gizli && (
                <div className="form-grubu">
                  <label>Oda Giriş Şifresi (Değiştirmek istiyorsanız yeni şifre girin)</label>
                  <input 
                    type="password" 
                    placeholder="Şifre yazın..."
                    value={duzenlenenTahta.sifre || ''}
                    onChange={(e) => duzenlenenTahtaAyarla({ ...duzenlenenTahta, sifre: e.target.value })}
                    required={duzenlenenTahta.gizli}
                  />
                </div>
              )}

              <div className="modal-butonlar">
                <button type="button" className="modal-butonu iptal" onClick={() => duzenlenenTahtaAyarla(null)}>
                  Vazgeç
                </button>
                <button type="submit" className="modal-butonu kaydet">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* silme onayi */}
      {silmeTipi && (
        <div className="admin-modal-arkaplan" onClick={() => { silmeTipiAyarla(null); silinecekIdAyarla(null); }}>
          <div className="admin-modal-icerik cam-panel sil-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Silme Onayı</h2>
            <p>
              <strong>"{silinecekIsim}"</strong> isimli {silmeTipi === 'kullanici' ? 'kullanıcıyı ve ona ait tüm verileri' : 'tahtayı'} silmek istediğinize emin misiniz?
            </p>
            <p className="sil-uyari-notu">Bu işlem geri alınamaz!</p>
            
            <div className="modal-butonlar">
              <button className="modal-butonu iptal" onClick={() => { silmeTipiAyarla(null); silinecekIdAyarla(null); }}>
                İptal Et
              </button>
              <button className="modal-butonu sil-onay" onClick={silmeOnayla}>
                Evet, Kalıcı Olarak Sil
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
