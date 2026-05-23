const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const odaYoneticisi = require("./odaYoneticisi");
const { sorgu } = require("../veritabani/baglanti");
const { JWT_SECRET } = require("../rotalar/authRotalari");

const soketYoneticisiniBaslat = (io) => {
	io.on("connection", (soket) => {
		console.log("yeni soket bağlantısı:", soket.id);

		// odaya katılma
		soket.on("odaya-katil", async (veri) => {
			try {
				const { tahtaId, kullaniciAdi, sifre, token } = veri;

				// tokendan kullanıcıyı çözümle
				let dogrulanmisKullanici = null;
				if (token) {
					try {
						dogrulanmisKullanici = jwt.verify(token, JWT_SECRET);
					} catch (e) {
						// geçersiz token
					}
				}

				// giriş yapmışsa orijinal ismi al
				const aktifKullaniciAdi =
					(dogrulanmisKullanici && dogrulanmisKullanici.kullaniciAdi) ||
					kullaniciAdi;

				// tahtayı yükle ve şifre kontrolü yap
				let mevcutIcerik = [];
				let gercekTahtaId = tahtaId;

				try {
					const uuidRegex =
						/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
					const sorguMetni = uuidRegex.test(tahtaId)
						? "SELECT * FROM tahtalar WHERE id = $1"
						: "SELECT * FROM tahtalar WHERE paylasim_kodu = $1";

					const sonuc = await sorgu(sorguMetni, [tahtaId]);
					if (sonuc.rows.length > 0) {
						const tahta = sonuc.rows[0];
						mevcutIcerik = tahta.icerik || [];
						gercekTahtaId = tahta.id; // uuidyi oda kimliği yap

						// oda gizli ise şifreyi kontrol et
						if (tahta.gizli) {
							// kurucu kontrolü
							const isCreator =
								dogrulanmisKullanici &&
								tahta.olusturan_id &&
								dogrulanmisKullanici.id === tahta.olusturan_id;

							if (!isCreator) {
								if (!sifre) {
									soket.emit("hata", {
										kod: "SIFRE_GEREKLI",
										mesaj: "Bu oda şifrelidir. Şifre girmelisiniz.",
									});
									return;
								}
								const sifreDogru = bcrypt.compareSync(sifre, tahta.sifre);
								if (!sifreDogru) {
									soket.emit("hata", {
										kod: "SIFRE_HATALI",
										mesaj: "Hatalı oda şifresi.",
									});
									return;
								}
							}
						}
					}
				} catch (dbHata) {
					console.error("tahta bilgisi yükleme hatası:", dbHata);
				}

				// başka odadaysa ayrıl
				const eskiOda = odaYoneticisi.kullaniciBul(soket.id);
				if (eskiOda && eskiOda.tahtaId !== gercekTahtaId) {
					soket.leave(eskiOda.tahtaId);
					odaYoneticisi.odadanAyril(soket.id);
					// eski odaya bildir
					const kalanKullanicilar = odaYoneticisi.odaKullanicilari(
						eskiOda.tahtaId,
					);
					soket.to(eskiOda.tahtaId).emit("kullanici-ayrildi", {
						soketId: soket.id,
						kullaniciAdi: eskiOda.kullaniciAdi,
						kullanicilar: kalanKullanicilar,
					});
				}

				// kullanıcıyı odaya ekle
				const kullanici = odaYoneticisi.odayaKatil(
					gercekTahtaId,
					soket.id,
					aktifKullaniciAdi,
				);

				// soket odasına katıl
				soket.join(gercekTahtaId);

				// odadaki kullanıcıları getir
				const kullanicilar = odaYoneticisi.odaKullanicilari(gercekTahtaId);

				// katılan kullanıcıya oda durumunu gönder
				soket.emit("oda-durumu", {
					kullanicilar,
					mevcutIcerik,
				});

				// odadaki diğer kullanıcılara bildir
				soket.to(gercekTahtaId).emit("kullanici-katildi", {
					kullanici,
					kullanicilar,
				});

				console.log(`${aktifKullaniciAdi} tahtaya katıldı: ${gercekTahtaId}`);
			} catch (hata) {
				console.error("odaya katılma hatası:", hata);
				soket.emit("hata", { mesaj: "odaya katılma başarısız" });
			}
		});

		// öge ekleme
		soket.on("oge-ekle", (veri) => {
			const { tahtaId, oge } = veri;
			soket.to(tahtaId).emit("oge-eklendi", { oge });
		});

		// öge güncelleme
		soket.on("oge-guncelle", (veri) => {
			const { tahtaId, ogeId, degisiklikler } = veri;
			soket.to(tahtaId).emit("oge-guncellendi", { ogeId, degisiklikler });
		});

		// öge silme
		soket.on("oge-sil", (veri) => {
			const { tahtaId, ogeId } = veri;
			soket.to(tahtaId).emit("oge-silindi", { ogeId });
		});

		// imleç hareketi
		soket.on("imlec-hareket", (veri) => {
			const { tahtaId, x, y } = veri;
			const kullanici = odaYoneticisi.kullaniciBul(soket.id);

			if (kullanici) {
				soket.to(tahtaId).emit("imlec-guncellendi", {
					soketId: soket.id,
					kullaniciAdi: kullanici.kullaniciAdi,
					renk: kullanici.renk,
					x,
					y,
				});
			}
		});

		// tahtayı kaydetme
		soket.on("tahta-kaydet", async (veri) => {
			try {
				const { tahtaId, icerik } = veri;

				// güvenlik doğrulaması
				if (!Array.isArray(icerik)) {
					soket.emit("hata", { mesaj: "Geçersiz içerik formatı." });
					return;
				}
				if (icerik.length > 500) {
					soket.emit("hata", {
						mesaj: "Tahta öğe sayısı sınırı aşıldı (maks: 500).",
					});
					return;
				}
				const icerikStr = JSON.stringify(icerik);
				if (icerikStr.length > 1.5 * 1024 * 1024) {
					soket.emit("hata", {
						mesaj: "Tahta içerik boyutu sınırı aşıldı (maks: 1.5 MB).",
					});
					return;
				}

				const uuidRegex =
					/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
				const sorguMetni = uuidRegex.test(tahtaId)
					? "UPDATE tahtalar SET icerik = $1, guncellenme_tarihi = NOW() WHERE id = $2"
					: "UPDATE tahtalar SET icerik = $1, guncellenme_tarihi = NOW() WHERE paylasim_kodu = $2";

				await sorgu(sorguMetni, [icerikStr, tahtaId]);

				// diğer kullanıcılara içeriği bildir
				let gercekId = tahtaId;
				if (!uuidRegex.test(tahtaId)) {
					const sonuc = await sorgu(
						"SELECT id FROM tahtalar WHERE paylasim_kodu = $1",
						[tahtaId],
					);
					if (sonuc.rows.length > 0) {
						gercekId = sonuc.rows[0].id;
					}
				}
				soket.to(gercekId).emit("tahta-guncellendi", icerik);

				console.log(`tahta kaydedildi: ${tahtaId}`);
			} catch (hata) {
				console.error("tahta kaydetme hatası:", hata);
				soket.emit("hata", { mesaj: "tahta kaydetme başarısız" });
			}
		});

		// bağlantı kesilme
		soket.on("disconnect", () => {
			const { kullanici, tahtaId } = odaYoneticisi.odadanAyril(soket.id);

			if (kullanici && tahtaId) {
				const kalanKullanicilar = odaYoneticisi.odaKullanicilari(tahtaId);

				io.to(tahtaId).emit("kullanici-ayrildi", {
					soketId: soket.id,
					kullaniciAdi: kullanici.kullaniciAdi,
					kullanicilar: kalanKullanicilar,
				});

				console.log(`${kullanici.kullaniciAdi} tahtadan ayrıldı: ${tahtaId}`);
			}

			console.log("soket bağlantısı kesildi:", soket.id);
		});
	});
};

module.exports = soketYoneticisiniBaslat;
