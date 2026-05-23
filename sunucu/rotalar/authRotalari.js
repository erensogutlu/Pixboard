const express = require("express");
const yonlendirici = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sorgu } = require("../veritabani/baglanti");

const JWT_SECRET = process.env.JWT_SECRET || "pixboard-gizli-anahtar-123";

// kimlik doğrulama ara yazılımı
const kimlikDogrula = (istek, yanit, sonraki) => {
	try {
		const baslik = istek.headers.authorization;
		if (!baslik || !baslik.startsWith("Bearer ")) {
			return yanit
				.status(401)
				.json({ mesaj: "Yetkilendirme başlığı eksik veya geçersiz" });
		}

		const token = baslik.split(" ")[1];
		const cozulen = jwt.verify(token, JWT_SECRET);
		istek.kullanici = cozulen;
		sonraki();
	} catch (hata) {
		return yanit
			.status(401)
			.json({ mesaj: "Geçersiz veya süresi dolmuş token" });
	}
};

// isteğe bağlı kimlik doğrulama
// giriş yaptıysa kullanıcıyı doldurur
const isteyeBagliKimlikDogrula = (istek, yanit, sonraki) => {
	try {
		const baslik = istek.headers.authorization;
		if (baslik && baslik.startsWith("Bearer ")) {
			const token = baslik.split(" ")[1];
			const cozulen = jwt.verify(token, JWT_SECRET);
			istek.kullanici = cozulen;
		}
	} catch (hata) {
		// hatayı yut
	}
	sonraki();
};

// kullanıcı kaydı
yonlendirici.post("/kayit", async (istek, yanit) => {
	try {
		const { kullaniciAdi, sifre } = istek.body;

		if (!kullaniciAdi || !sifre) {
			return yanit
				.status(400)
				.json({ mesaj: "Kullanıcı adı ve şifre gereklidir" });
		}

		if (kullaniciAdi.length < 3 || sifre.length < 4) {
			return yanit
				.status(400)
				.json({
					mesaj: "Kullanıcı adı en az 3, şifre en az 4 karakter olmalıdır",
				});
		}

		if (kullaniciAdi.length > 30) {
			return yanit
				.status(400)
				.json({ mesaj: "Kullanıcı adı en fazla 30 karakter olabilir" });
		}

		if (sifre.length > 72) {
			return yanit
				.status(400)
				.json({ mesaj: "Şifre en fazla 72 karakter olabilir" });
		}

		// sadece harf, rakam ve alt çizgi
		if (!/^[a-zA-Z0-9_]+$/.test(kullaniciAdi)) {
			return yanit
				.status(400)
				.json({
					mesaj:
						"Kullanıcı adı yalnızca harf, rakam ve alt çizgi (_) içerebilir",
				});
		}

		// kullanıcı adı zaten var mı kontrol et
		const mevcutKullanici = await sorgu(
			"SELECT id FROM kullanicilar WHERE kullanici_adi = $1",
			[kullaniciAdi],
		);
		if (mevcutKullanici.rows.length > 0) {
			return yanit
				.status(400)
				.json({ mesaj: "Bu kullanıcı adı zaten alınmış" });
		}

		// şifreyi hashle
		const tuz = bcrypt.genSaltSync(10);
		const sifreHash = bcrypt.hashSync(sifre, tuz);

		// kullanıcıyı ekle
		const yeniKullaniciSonuc = await sorgu(
			"INSERT INTO kullanicilar (kullanici_adi, sifre) VALUES ($1, $2) RETURNING id, kullanici_adi, rol",
			[kullaniciAdi, sifreHash],
		);

		const user = yeniKullaniciSonuc.rows[0];

		// jwt üret
		const token = jwt.sign(
			{ id: user.id, kullaniciAdi: user.kullanici_adi, rol: user.rol },
			JWT_SECRET,
			{ expiresIn: "7d" },
		);

		yanit.status(201).json({
			mesaj: "Kayıt başarıyla tamamlandı",
			token,
			kullanici: {
				id: user.id,
				kullaniciAdi: user.kullanici_adi,
				rol: user.rol,
			},
		});
	} catch (hata) {
		console.error("Kayıt hatası:", hata);
		yanit.status(500).json({ mesaj: "Sunucu hatası" });
	}
});

// kullanıcı girişi
yonlendirici.post("/giris", async (istek, yanit) => {
	try {
		const { kullaniciAdi, sifre } = istek.body;

		if (!kullaniciAdi || !sifre) {
			return yanit
				.status(400)
				.json({ mesaj: "Kullanıcı adı ve şifre gereklidir" });
		}

		// kullanıcıyı sorgula
		const sonuc = await sorgu(
			"SELECT * FROM kullanicilar WHERE kullanici_adi = $1",
			[kullaniciAdi],
		);
		if (sonuc.rows.length === 0) {
			return yanit
				.status(401)
				.json({ mesaj: "Kullanıcı adı veya şifre hatalı" });
		}

		const user = sonuc.rows[0];

		// şifre kontrolü
		const sifreDogru = bcrypt.compareSync(sifre, user.sifre);
		if (!sifreDogru) {
			return yanit
				.status(401)
				.json({ mesaj: "Kullanıcı adı veya şifre hatalı" });
		}

		// jwt üret
		const token = jwt.sign(
			{ id: user.id, kullaniciAdi: user.kullanici_adi, rol: user.rol },
			JWT_SECRET,
			{ expiresIn: "7d" },
		);

		yanit.json({
			mesaj: "Giriş başarılı",
			token,
			kullanici: {
				id: user.id,
				kullaniciAdi: user.kullanici_adi,
				rol: user.rol,
			},
		});
	} catch (hata) {
		console.error("Giriş hatası:", hata);
		yanit.status(500).json({ mesaj: "Sunucu hatası" });
	}
});

// profil bilgisi getir
yonlendirici.get("/profil", kimlikDogrula, async (istek, yanit) => {
	try {
		const sonuc = await sorgu(
			"SELECT id, kullanici_adi, rol FROM kullanicilar WHERE id = $1",
			[istek.kullanici.id],
		);
		if (sonuc.rows.length === 0) {
			return yanit.status(404).json({ mesaj: "Kullanıcı bulunamadı" });
		}
		const user = sonuc.rows[0];
		yanit.json({
			kullanici: {
				id: user.id,
				kullaniciAdi: user.kullanici_adi,
				rol: user.rol,
			},
		});
	} catch (hata) {
		yanit.status(500).json({ mesaj: "Sunucu hatası" });
	}
});

module.exports = {
	yonlendirici,
	kimlikDogrula,
	isteyeBagliKimlikDogrula,
	JWT_SECRET,
};
