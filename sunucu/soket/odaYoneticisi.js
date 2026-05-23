const RENKLER = [
	"#7c5cff",
	"#00d4aa",
	"#ff6b6b",
	"#ffd93d",
	"#6bcb77",
	"#4d96ff",
	"#ff6b9d",
	"#c084fc",
	"#fb923c",
	"#22d3ee",
	"#a78bfa",
	"#34d399",
	"#f472b6",
	"#60a5fa",
];

class OdaYoneticisi {
	constructor() {
		// odalar haritası
		this.odalar = new Map();
	}

	// isme göre renk belirler
	kullaniciRengiBelirle(kullaniciAdi) {
		if (!kullaniciAdi) return RENKLER[0];
		let hash = 0;
		for (let i = 0; i < kullaniciAdi.length; i++) {
			hash = kullaniciAdi.charCodeAt(i) + ((hash << 5) - hash);
		}
		const index = Math.abs(hash) % RENKLER.length;
		return RENKLER[index];
	}

	// odaya katılma
	odayaKatil(tahtaId, soketId, kullaniciAdi) {
		if (!this.odalar.has(tahtaId)) {
			this.odalar.set(tahtaId, new Set());
		}

		const kullanicilar = this.odalar.get(tahtaId);

		// eski veya mükerrer bağlantıyı temizle
		for (const kullanici of kullanicilar) {
			if (kullanici.kullaniciAdi === kullaniciAdi) {
				kullanicilar.delete(kullanici);
			}
		}

		const renk = this.kullaniciRengiBelirle(kullaniciAdi);

		const kullanici = {
			soketId,
			kullaniciAdi,
			renk,
		};

		kullanicilar.add(kullanici);

		return kullanici;
	}

	// odadan ayrılma
	odadanAyril(soketId) {
		let ayrilanKullanici = null;
		let ayrilanTahtaId = null;

		for (const [tahtaId, kullanicilar] of this.odalar.entries()) {
			for (const kullanici of kullanicilar) {
				if (kullanici.soketId === soketId) {
					ayrilanKullanici = kullanici;
					ayrilanTahtaId = tahtaId;
					kullanicilar.delete(kullanici);

					// oda boşsa sil
					if (kullanicilar.size === 0) {
						this.odalar.delete(tahtaId);
					}
					break;
				}
			}
			if (ayrilanKullanici) break;
		}

		return { kullanici: ayrilanKullanici, tahtaId: ayrilanTahtaId };
	}

	// odadaki kullanıcıları getir
	odaKullanicilari(tahtaId) {
		if (!this.odalar.has(tahtaId)) {
			return [];
		}
		return Array.from(this.odalar.get(tahtaId));
	}

	// soket id ile kullanıcıyı bul
	kullaniciBul(soketId) {
		for (const [tahtaId, kullanicilar] of this.odalar.entries()) {
			for (const kullanici of kullanicilar) {
				if (kullanici.soketId === soketId) {
					return { ...kullanici, tahtaId };
				}
			}
		}
		return null;
	}
}

module.exports = new OdaYoneticisi();
