const express = require("express");
const yonlendirici = express.Router();
const bcrypt = require("bcryptjs");
const { sorgu } = require("../veritabani/baglanti");
const { isteyeBagliKimlikDogrula } = require("./authRotalari");

// güvenlik limitleri
const MAKS_TAHTA_SAYISI = 20; // maks tahta limiti
const MAKS_OGE_SAYISI = 500; // maks öğe limiti
const MAKS_BASLIK_UZUNLUGU = 100; // maks başlık karakteri
const MAKS_ICERIK_BOYUTU_MB = 1.5; // maks json boyutu

// rastgele paylaşım kodu
const paylasimKoduOlustur = () => {
	const karakterler =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let kod = "";
	for (let i = 0; i < 8; i++) {
		kod += karakterler.charAt(Math.floor(Math.random() * karakterler.length));
	}
	return kod;
};

// tahta bulma yardımcısı
const uuidRegex =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const tahtaBul = async (idOrKod) => {
	if (uuidRegex.test(idOrKod)) {
		return await sorgu("SELECT * FROM tahtalar WHERE id = $1", [idOrKod]);
	} else {
		return await sorgu("SELECT * FROM tahtalar WHERE paylasim_kodu = $1", [
			idOrKod,
		]);
	}
};

// tahtaları listele
yonlendirici.get("/", isteyeBagliKimlikDogrula, async (istek, yanit) => {
	try {
		const kullaniciId = istek.kullanici ? istek.kullanici.id : null;
		const sonuc = await sorgu(
			`SELECT id, baslik, paylasim_kodu, olusturan, olusturulma_tarihi, gizli, olusturan_id 
       FROM tahtalar 
       WHERE gizli = FALSE OR olusturan_id = $1 
       ORDER BY olusturulma_tarihi DESC`,
			[kullaniciId],
		);
		yanit.json(sonuc.rows);
	} catch (hata) {
		console.error("tahtaları listeleme hatası:", hata);
		yanit.status(500).json({ mesaj: "sunucu hatası" });
	}
});

// yeni tahta oluştur
yonlendirici.post("/", isteyeBagliKimlikDogrula, async (istek, yanit) => {
	try {
		const { baslik, olusturan, gizli, sifre } = istek.body;

		// başlık uzunluğu kontrolü
		const temizBaslik = (baslik || "İsimsiz Tahta").substring(
			0,
			MAKS_BASLIK_UZUNLUGU,
		);

		// tahta sayısı limiti
		const olusturanId = istek.kullanici ? istek.kullanici.id : null;
		if (olusturanId) {
			const sayac = await sorgu(
				"SELECT COUNT(*) FROM tahtalar WHERE olusturan_id = $1",
				[olusturanId],
			);
			if (parseInt(sayac.rows[0].count) >= MAKS_TAHTA_SAYISI) {
				return yanit
					.status(429)
					.json({
						mesaj: `En fazla ${MAKS_TAHTA_SAYISI} tahta oluşturabilirsiniz. Lütfen eskilerini silin.`,
					});
			}
		}

		const paylasimKodu = paylasimKoduOlustur();
		const olusturanAdi = istek.kullanici
			? istek.kullanici.kullaniciAdi
			: olusturan || "anonim";
		const isGizli = gizli === true;
		const odaSifresi = isGizli && sifre ? bcrypt.hashSync(sifre, 10) : null;

		const sonuc = await sorgu(
			`INSERT INTO tahtalar (baslik, paylasim_kodu, olusturan, gizli, sifre, olusturan_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, baslik, paylasim_kodu, olusturan, gizli, olusturulma_tarihi`,
			[
				temizBaslik,
				paylasimKodu,
				olusturanAdi,
				isGizli,
				odaSifresi,
				olusturanId,
			],
		);

		yanit.status(201).json(sonuc.rows[0]);
	} catch (hata) {
		console.error("tahta oluşturma hatası:", hata);
		// kod çakışırsa tekrar dene
		if (hata.code === "23505") {
			try {
				const yeniKod = paylasimKoduOlustur();
				const { baslik, olusturan, gizli, sifre } = istek.body;
				const temizBaslik2 = (baslik || "İsimsiz Tahta").substring(
					0,
					MAKS_BASLIK_UZUNLUGU,
				);
				const olusturanId = istek.kullanici ? istek.kullanici.id : null;
				const olusturanAdi = istek.kullanici
					? istek.kullanici.kullaniciAdi
					: olusturan || "anonim";
				const isGizli = gizli === true;
				const odaSifresi = isGizli && sifre ? bcrypt.hashSync(sifre, 10) : null;

				const sonuc = await sorgu(
					`INSERT INTO tahtalar (baslik, paylasim_kodu, olusturan, gizli, sifre, olusturan_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, baslik, paylasim_kodu, olusturan, gizli, olusturulma_tarihi`,
					[
						temizBaslik2,
						yeniKod,
						olusturanAdi,
						isGizli,
						odaSifresi,
						olusturanId,
					],
				);
				return yanit.status(201).json(sonuc.rows[0]);
			} catch (ikinciHata) {
				console.error("tahta oluşturma ikinci deneme hatası:", ikinciHata);
				return yanit.status(500).json({ mesaj: "sunucu hatası" });
			}
		}
		yanit.status(500).json({ mesaj: "sunucu hatası" });
	}
});

// şifre doğrulama yardımcı fonksiyonu
const tahtaErisimKontrol = (tahta, kullanici, istekSifre) => {
	if (!tahta.gizli) return { erisim: true };

	// kurucu şifresiz girebilir
	if (kullanici && tahta.olusturan_id && kullanici.id === tahta.olusturan_id) {
		return { erisim: true };
	}

	// şifre kontrolü
	if (!istekSifre) {
		return {
			erisim: false,
			kod: "SIFRE_GEREKLI",
			mesaj: "Bu oda gizlidir, şifre girilmelidir.",
		};
	}

	const sifreDogru = bcrypt.compareSync(istekSifre, tahta.sifre);
	if (!sifreDogru) {
		return { erisim: false, kod: "SIFRE_HATALI", mesaj: "Hatalı oda şifresi." };
	}

	return { erisim: true };
};

// oda şifresini doğrula
yonlendirici.post(
	"/:id/dogrula",
	isteyeBagliKimlikDogrula,
	async (istek, yanit) => {
		try {
			const { id } = istek.params;
			const { sifre } = istek.body;

			const sonuc = await tahtaBul(id);
			if (sonuc.rows.length === 0) {
				return yanit.status(404).json({ mesaj: "tahta bulunamadı" });
			}

			const tahta = sonuc.rows[0];
			const kontrol = tahtaErisimKontrol(tahta, istek.kullanici, sifre);

			if (!kontrol.erisim) {
				return yanit
					.status(401)
					.json({ kod: kontrol.kod, mesaj: kontrol.mesaj });
			}

			yanit.json({ dogrulandi: true });
		} catch (hata) {
			console.error("tahta şifre doğrulama hatası:", hata);
			yanit.status(500).json({ mesaj: "sunucu hatası" });
		}
	},
);

// id veya kodla tahta getir
yonlendirici.get("/:id", isteyeBagliKimlikDogrula, async (istek, yanit) => {
	try {
		const { id } = istek.params;
		const istekSifre = istek.headers["x-room-password"] || istek.query.sifre;

		const sonuc = await tahtaBul(id);

		if (sonuc.rows.length === 0) {
			return yanit
				.status(200)
				.json({ bulunamadi: true, mesaj: "tahta bulunamadı" });
		}

		const tahta = sonuc.rows[0];
		const kontrol = tahtaErisimKontrol(tahta, istek.kullanici, istekSifre);

		if (!kontrol.erisim) {
			// şifre gerekliyse 200 dön
			if (kontrol.kod === "SIFRE_GEREKLI") {
				return yanit.status(200).json({
					sifreGerekli: true,
					kod: kontrol.kod,
					mesaj: kontrol.mesaj,
					tahta: {
						id: tahta.id,
						baslik: tahta.baslik,
						gizli: true,
						olusturan: tahta.olusturan,
					},
				});
			}

			// şifre hatalıysa 403 dön
			return yanit.status(403).json({
				kod: kontrol.kod,
				mesaj: kontrol.mesaj,
				tahta: {
					id: tahta.id,
					baslik: tahta.baslik,
					gizli: true,
					olusturan: tahta.olusturan,
				},
			});
		}

		// şifre doğruysa bilgileri dön
		yanit.json(tahta);
	} catch (hata) {
		console.error("tahta getirme hatası:", hata);
		yanit.status(500).json({ mesaj: "sunucu hatası" });
	}
});

// paylaşım koduyla tahta getir
yonlendirici.get(
	"/kod/:kod",
	isteyeBagliKimlikDogrula,
	async (istek, yanit) => {
		try {
			const { kod } = istek.params;
			const istekSifre = istek.headers["x-room-password"] || istek.query.sifre;

			const sonuc = await sorgu(
				"SELECT * FROM tahtalar WHERE paylasim_kodu = $1",
				[kod],
			);

			if (sonuc.rows.length === 0) {
				return yanit
					.status(200)
					.json({ bulunamadi: true, mesaj: "tahta bulunamadı" });
			}

			const tahta = sonuc.rows[0];
			const kontrol = tahtaErisimKontrol(tahta, istek.kullanici, istekSifre);

			if (!kontrol.erisim) {
				if (kontrol.kod === "SIFRE_GEREKLI") {
					return yanit.status(200).json({
						sifreGerekli: true,
						kod: kontrol.kod,
						mesaj: kontrol.mesaj,
						tahta: {
							id: tahta.id,
							baslik: tahta.baslik,
							gizli: true,
							olusturan: tahta.olusturan,
						},
					});
				}
				return yanit.status(403).json({
					kod: kontrol.kod,
					mesaj: kontrol.mesaj,
					tahta: {
						id: tahta.id,
						baslik: tahta.baslik,
						gizli: true,
						olusturan: tahta.olusturan,
					},
				});
			}

			yanit.json(tahta);
		} catch (hata) {
			console.error("tahta kodu ile getirme hatası:", hata);
			yanit.status(500).json({ mesaj: "sunucu hatası" });
		}
	},
);

// tahtayı güncelle
yonlendirici.put("/:id", isteyeBagliKimlikDogrula, async (istek, yanit) => {
	try {
		const { id } = istek.params;
		const { icerik, baslik } = istek.body;
		const istekSifre = istek.headers["x-room-password"] || istek.query.sifre;

		// içerik boyutu kontrolü
		if (icerik !== undefined) {
			// öğe sayısı limiti
			if (Array.isArray(icerik) && icerik.length > MAKS_OGE_SAYISI) {
				return yanit
					.status(400)
					.json({
						mesaj: `Bir tahtada en fazla ${MAKS_OGE_SAYISI} öğe olabilir.`,
					});
			}

			// json boyutu limiti
			const icerikBoyutu = JSON.stringify(icerik).length;
			if (icerikBoyutu > MAKS_ICERIK_BOYUTU_MB * 1024 * 1024) {
				return yanit
					.status(400)
					.json({
						mesaj: `Tahta içeriği ${MAKS_ICERIK_BOYUTU_MB} MB sınırını aşıyor.`,
					});
			}
		}

		// başlık uzunluğu kontrolü
		const temizBaslik =
			baslik !== undefined
				? baslik.substring(0, MAKS_BASLIK_UZUNLUGU)
				: undefined;

		const tahtaSonuc = await tahtaBul(id);
		if (tahtaSonuc.rows.length === 0) {
			return yanit.status(404).json({ mesaj: "tahta bulunamadı" });
		}

		const tahta = tahtaSonuc.rows[0];
		const kontrol = tahtaErisimKontrol(tahta, istek.kullanici, istekSifre);
		if (!kontrol.erisim) {
			return yanit
				.status(403)
				.json({ mesaj: "Yetkisiz erişim: Şifre geçersiz." });
		}

		let sonuc;

		if (icerik !== undefined && temizBaslik !== undefined) {
			sonuc = await sorgu(
				`UPDATE tahtalar SET icerik = $1, baslik = $2, guncellenme_tarihi = NOW()
         WHERE id = $3 RETURNING *`,
				[JSON.stringify(icerik), temizBaslik, tahta.id],
			);
		} else if (icerik !== undefined) {
			sonuc = await sorgu(
				`UPDATE tahtalar SET icerik = $1, guncellenme_tarihi = NOW()
         WHERE id = $2 RETURNING *`,
				[JSON.stringify(icerik), tahta.id],
			);
		} else if (temizBaslik !== undefined) {
			sonuc = await sorgu(
				`UPDATE tahtalar SET baslik = $1, guncellenme_tarihi = NOW()
         WHERE id = $2 RETURNING *`,
				[temizBaslik, tahta.id],
			);
		} else {
			return yanit
				.status(400)
				.json({ mesaj: "güncellenecek alan belirtilmedi" });
		}

		yanit.json(sonuc.rows[0]);
	} catch (hata) {
		console.error("tahta güncelleme hatası:", hata);
		yanit.status(500).json({ mesaj: "sunucu hatası" });
	}
});

// tahtayı sil
yonlendirici.delete("/:id", isteyeBagliKimlikDogrula, async (istek, yanit) => {
	try {
		const { id } = istek.params;

		const tahtaSonuc = await tahtaBul(id);
		if (tahtaSonuc.rows.length === 0) {
			return yanit.status(404).json({ mesaj: "tahta bulunamadı" });
		}

		const tahta = tahtaSonuc.rows[0];

		// kurucu kontrolü
		if (!istek.kullanici || tahta.olusturan_id !== istek.kullanici.id) {
			return yanit
				.status(403)
				.json({ mesaj: "Bu tahtayı yalnızca oluşturan kişi silebilir." });
		}

		const sonuc = await sorgu(
			"DELETE FROM tahtalar WHERE id = $1 RETURNING id",
			[tahta.id],
		);
		yanit.json({ mesaj: "tahta başarıyla silindi", id: sonuc.rows[0].id });
	} catch (hata) {
		console.error("tahta silme hatası:", hata);
		yanit.status(500).json({ mesaj: "sunucu hatası" });
	}
});

module.exports = yonlendirici;
