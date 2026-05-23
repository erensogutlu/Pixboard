const hizSinirla = ({
	pencereSuresiMs = 60000,
	maksimumIstek = 30,
	mesaj = "Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.",
} = {}) => {
	const sayaclar = new Map(); // ip istek sayaçları

	// eski kayıtları 5 dakikada bir temizler
	setInterval(
		() => {
			const simdi = Date.now();
			for (const [anahtar, deger] of sayaclar) {
				if (simdi - deger.pencereBasi > pencereSuresiMs * 2) {
					sayaclar.delete(anahtar);
				}
			}
		},
		5 * 60 * 1000,
	);

	return (istek, yanit, sonraki) => {
		const ipAdresi =
			istek.ip || istek.connection?.remoteAddress || "bilinmeyen";
		const simdi = Date.now();

		let kayit = sayaclar.get(ipAdresi);

		if (!kayit || simdi - kayit.pencereBasi > pencereSuresiMs) {
			kayit = { istek: 1, pencereBasi: simdi };
			sayaclar.set(ipAdresi, kayit);
			return sonraki();
		}

		kayit.istek++;

		if (kayit.istek > maksimumIstek) {
			const kalanSureSn = Math.ceil(
				(pencereSuresiMs - (simdi - kayit.pencereBasi)) / 1000,
			);
			yanit.set("Retry-After", kalanSureSn);
			return yanit.status(429).json({
				mesaj,
				kalanSure: kalanSureSn,
			});
		}

		sonraki();
	};
};

// tanımlı sınırlayıcılar
const genel = hizSinirla({
	pencereSuresiMs: 60000,
	maksimumIstek: 60,
	mesaj: "Çok fazla istek gönderildi. Lütfen bir dakika bekleyin.",
});
const auth = hizSinirla({
	pencereSuresiMs: 15 * 60 * 1000,
	maksimumIstek: 20,
	mesaj: "Çok fazla giriş/kayıt denemesi. 15 dakika sonra tekrar deneyin.",
});
const olusturma = hizSinirla({
	pencereSuresiMs: 60 * 60 * 1000,
	maksimumIstek: 30,
	mesaj:
		"Saatlik tahta oluşturma sınırına ulaştınız. Bir saat sonra tekrar deneyin.",
});
const admin = hizSinirla({
	pencereSuresiMs: 60000,
	maksimumIstek: 40,
	mesaj: "Admin işlem sınırına ulaştınız. Lütfen bekleyin.",
});

module.exports = { hizSinirla, genel, auth, olusturma, admin };
