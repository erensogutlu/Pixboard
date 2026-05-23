const express = require('express');
const yonlendirici = express.Router();
const { sorgu } = require('../veritabani/baglanti');
const { kimlikDogrula } = require('./authRotalari');

// admin yetki kontrolü ara yazılımı
const adminKimlikDogrula = async (istek, yanit, sonraki) => {
  try {
    const kullaniciId = istek.kullanici.id;
    const sonuc = await sorgu('SELECT rol FROM kullanicilar WHERE id = $1', [kullaniciId]);
    if (sonuc.rows.length === 0 || sonuc.rows[0].rol !== 'admin') {
      return yanit.status(403).json({ mesaj: 'Bu işlem için admin yetkisi gereklidir' });
    }
    sonraki();
  } catch (hata) {
    console.error('Admin kontrol hatası:', hata);
    return yanit.status(500).json({ mesaj: 'Yetkilendirme kontrolünde sunucu hatası' });
  }
};

// admin istatistikleri
yonlendirici.get('/istatistikler', kimlikDogrula, adminKimlikDogrula, async (istek, yanit) => {
  try {
    const kullaniciSayisiSonuc = await sorgu('SELECT COUNT(*) FROM kullanicilar');
    const tahtaSayisiSonuc = await sorgu('SELECT COUNT(*) FROM tahtalar');
    
    yanit.json({
      toplamKullanici: parseInt(kullaniciSayisiSonuc.rows[0].count),
      toplamTahta: parseInt(tahtaSayisiSonuc.rows[0].count)
    });
  } catch (hata) {
    console.error('İstatistik getirme hatası:', hata);
    yanit.status(500).json({ mesaj: 'İstatistikler getirilirken hata oluştu' });
  }
});

// kullanıcıları getir
yonlendirici.get('/kullanicilar', kimlikDogrula, adminKimlikDogrula, async (istek, yanit) => {
  try {
    const sonuc = await sorgu(`
      SELECT 
        id, 
        kullanici_adi as "kullaniciAdi", 
        rol, 
        kayit_tarihi as "kayitTarihi" 
      FROM kullanicilar 
      ORDER BY kayit_tarihi DESC
    `);
    yanit.json(sonuc.rows);
  } catch (hata) {
    console.error('Kullanıcı listesi getirme hatası:', hata);
    yanit.status(500).json({ mesaj: 'Kullanıcılar getirilirken hata oluştu' });
  }
});

// kullanıcı güncelle
yonlendirici.put('/kullanicilar/:id', kimlikDogrula, adminKimlikDogrula, async (istek, yanit) => {
  try {
    const { id } = istek.params;
    const { kullaniciAdi, sifre, rol } = istek.body;

    if (!kullaniciAdi || !rol) {
      return yanit.status(400).json({ mesaj: 'Kullanıcı adı ve rol alanları zorunludur' });
    }

    // Kullanıcı adının benzersizliğini kontrol et (kendi id'si hariç)
    const benzersizlikKontrol = await sorgu(
      'SELECT id FROM kullanicilar WHERE kullanici_adi = $1 AND id <> $2',
      [kullaniciAdi, id]
    );
    if (benzersizlikKontrol.rows.length > 0) {
      return yanit.status(400).json({ mesaj: 'Bu kullanıcı adı başka bir hesap tarafından kullanılıyor' });
    }

    if (sifre && sifre.trim().length > 0) {
      if (sifre.length < 4) {
        return yanit.status(400).json({ mesaj: 'Şifre en az 4 karakter olmalıdır' });
      }
      const bcrypt = require('bcryptjs');
      const tuz = bcrypt.genSaltSync(10);
      const sifreHash = bcrypt.hashSync(sifre, tuz);

      await sorgu(
        'UPDATE kullanicilar SET kullanici_adi = $1, sifre = $2, rol = $3 WHERE id = $4',
        [kullaniciAdi, sifreHash, rol, id]
      );
    } else {
      await sorgu(
        'UPDATE kullanicilar SET kullanici_adi = $1, rol = $2 WHERE id = $3',
        [kullaniciAdi, rol, id]
      );
    }

    yanit.json({ mesaj: 'Kullanıcı başarıyla güncellendi' });
  } catch (hata) {
    console.error('Kullanıcı güncelleme hatası:', hata);
    yanit.status(500).json({ mesaj: 'Kullanıcı güncellenirken hata oluştu' });
  }
});

// kullanıcı sil
yonlendirici.delete('/kullanicilar/:id', kimlikDogrula, adminKimlikDogrula, async (istek, yanit) => {
  try {
    const { id } = istek.params;
    const oturumKullaniciId = istek.kullanici.id;

    if (id === oturumKullaniciId) {
      return yanit.status(400).json({ mesaj: 'Kendi admin hesabınızı silemezsiniz' });
    }

    await sorgu('DELETE FROM kullanicilar WHERE id = $1', [id]);
    yanit.json({ mesaj: 'Kullanıcı başarıyla silindi' });
  } catch (hata) {
    console.error('Kullanıcı silme hatası:', hata);
    yanit.status(500).json({ mesaj: 'Kullanıcı silinirken hata oluştu' });
  }
});

// tahtaları getir
yonlendirici.get('/tahtalar', kimlikDogrula, adminKimlikDogrula, async (istek, yanit) => {
  try {
    const sonuc = await sorgu(`
      SELECT 
        t.id, 
        t.baslik, 
        t.paylasim_kodu as "paylasimKodu", 
        t.gizli, 
        t.sifre, 
        t.olusturan_id as "olusturanId",
        k.kullanici_adi as "olusturanAdi",
        t.guncellenme_tarihi as "guncellenmeTarihi",
        jsonb_array_length(t.icerik) as "ogeSayisi"
      FROM tahtalar t
      LEFT JOIN kullanicilar k ON t.olusturan_id = k.id
      ORDER BY t.guncellenme_tarihi DESC
    `);
    yanit.json(sonuc.rows);
  } catch (hata) {
    console.error('Tahta listesi getirme hatası:', hata);
    yanit.status(500).json({ mesaj: 'Tahtalar getirilirken hata oluştu' });
  }
});

// tahta güncelle
yonlendirici.put('/tahtalar/:id', kimlikDogrula, adminKimlikDogrula, async (istek, yanit) => {
  try {
    const { id } = istek.params;
    const { baslik, gizli, sifre } = istek.body;

    if (!baslik) {
      return yanit.status(400).json({ mesaj: 'Tahta başlığı zorunludur' });
    }

    let sifreDegeri = sifre;
    if (gizli && sifre && sifre.trim().length > 0) {
      const bcrypt = require('bcryptjs');
      if (!sifre.startsWith('$2a$') && !sifre.startsWith('$2b$')) {
        const tuz = bcrypt.genSaltSync(10);
        sifreDegeri = bcrypt.hashSync(sifre, tuz);
      }
    } else if (!gizli) {
      sifreDegeri = null;
    }

    await sorgu(
      'UPDATE tahtalar SET baslik = $1, gizli = $2, sifre = $3, guncellenme_tarihi = NOW() WHERE id = $4',
      [baslik, gizli, sifreDegeri, id]
    );

    yanit.json({ mesaj: 'Tahta başarıyla güncellendi' });
  } catch (hata) {
    console.error('Tahta güncelleme hatası:', hata);
    yanit.status(500).json({ mesaj: 'Tahta güncellenirken hata oluştu' });
  }
});

// tahta sil
yonlendirici.delete('/tahtalar/:id', kimlikDogrula, adminKimlikDogrula, async (istek, yanit) => {
  try {
    const { id } = istek.params;
    await sorgu('DELETE FROM tahtalar WHERE id = $1', [id]);
    yanit.json({ mesaj: 'Tahta başarıyla silindi' });
  } catch (hata) {
    console.error('Tahta silme hatası:', hata);
    yanit.status(500).json({ mesaj: 'Tahta silinirken hata oluştu' });
  }
});

module.exports = yonlendirici;
