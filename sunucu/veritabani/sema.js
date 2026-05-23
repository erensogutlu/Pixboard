const { havuz, sorgu } = require("./baglanti");

const semaOlustur = async () => {
	try {
		// kullanicilar tablosunu oluştur
		await sorgu(`
      CREATE TABLE IF NOT EXISTS kullanicilar (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        kullanici_adi VARCHAR(50) UNIQUE NOT NULL,
        sifre VARCHAR(255) NOT NULL,
        kayit_tarihi TIMESTAMPTZ DEFAULT NOW()
      );
    `);

		// tahtalar tablosunu oluştur
		await sorgu(`
      CREATE TABLE IF NOT EXISTS tahtalar (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        baslik VARCHAR(255) DEFAULT 'İsimsiz Tahta',
        paylasim_kodu VARCHAR(8) UNIQUE NOT NULL,
        olusturan VARCHAR(100),
        icerik JSONB DEFAULT '[]'::jsonb,
        olusturulma_tarihi TIMESTAMPTZ DEFAULT NOW(),
        guncellenme_tarihi TIMESTAMPTZ DEFAULT NOW()
      );
    `);

		// tahtalar tablosuna yeni sütunları ekle (eğer yoksa)
		await sorgu(`
      ALTER TABLE kullanicilar ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'kullanici';
    `);

		// tahtalar tablosuna yeni sütunları ekle (eğer yoksa)
		await sorgu(`
      ALTER TABLE tahtalar ADD COLUMN IF NOT EXISTS gizli BOOLEAN DEFAULT FALSE;
      ALTER TABLE tahtalar ADD COLUMN IF NOT EXISTS sifre VARCHAR(255) DEFAULT NULL;
      ALTER TABLE tahtalar ADD COLUMN IF NOT EXISTS olusturan_id UUID REFERENCES kullanicilar(id) ON DELETE SET NULL;
    `);

		// örnek kullanıcıları ekle
		const kullaniciSayisi = await sorgu("SELECT COUNT(*) FROM kullanicilar");
		if (parseInt(kullaniciSayisi.rows[0].count) === 0) {
			const bcrypt = require("bcryptjs");
			const erenSifre = bcrypt.hashSync("password123", 10);
			const demoSifre = bcrypt.hashSync("demo1234", 10);

			await sorgu(
				`
        INSERT INTO kullanicilar (kullanici_adi, sifre, rol) VALUES 
        ($1, $2, $3),
        ($4, $5, $6)
      `,
				["eren", erenSifre, "kullanici", "demo", demoSifre, "kullanici"],
			);

			console.log("örnek kullanıcı hesapları veritabanına eklendi");
		}

		// varsayılan admin ekle
		const adminSayisi = await sorgu(
			"SELECT COUNT(*) FROM kullanicilar WHERE kullanici_adi = 'admin'",
		);
		if (parseInt(adminSayisi.rows[0].count) === 0) {
			const bcrypt = require("bcryptjs");
			const adminSifre = bcrypt.hashSync("admin123", 10);
			await sorgu(
				"INSERT INTO kullanicilar (kullanici_adi, sifre, rol) VALUES ($1, $2, $3)",
				["admin", adminSifre, "admin"],
			);
			console.log(
				"varsayılan admin kullanıcısı oluşturuldu (admin / admin123)",
			);
		}

		console.log("veritabanı şeması başarıyla oluşturuldu/güncellendi");
	} catch (hata) {
		console.error("şema oluşturma/güncelleme hatası:", hata);
		throw hata;
	}
};

// doğrudan çalıştırılırsa şemayı oluştur ve bağlantıyı kapat
if (require.main === module) {
	semaOlustur()
		.then(() => {
			console.log("şema betiği tamamlandı");
			return havuz.end();
		})
		.then(() => process.exit(0))
		.catch((hata) => {
			console.error("şema betiği başarısız:", hata);
			process.exit(1);
		});
}

module.exports = semaOlustur;
