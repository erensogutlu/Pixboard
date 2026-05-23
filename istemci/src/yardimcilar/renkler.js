export const CIZIM_RENKLERI = [
	{ ad: "Beyaz", deger: "#e8e8f0" },
	{ ad: "Açık Gri", deger: "#a0a0b8" },
	{ ad: "Koyu Gri", deger: "#555570" },
	{ ad: "Siyah", deger: "#1a1a2e" },
	{ ad: "Kırmızı", deger: "#ff4466" },
	{ ad: "Turuncu", deger: "#ff8844" },
	{ ad: "Sarı", deger: "#ffd93d" },
	{ ad: "Yeşil", deger: "#44ff88" },
	{ ad: "Turkuaz", deger: "#00d4aa" },
	{ ad: "Camgöbeği", deger: "#00c8ff" },
	{ ad: "Mavi", deger: "#4488ff" },
	{ ad: "Mor", deger: "#7c5cff" },
	{ ad: "Pembe", deger: "#ff66aa" },
	{ ad: "Lavanta", deger: "#b388ff" },
	{ ad: "Nane", deger: "#69f0ae" },
	{ ad: "Mercan", deger: "#ff6e6e" },
];

// kullanıcı imleç renkleri
export const KULLANICI_RENKLERI = [
	"#7c5cff",
	"#ff4466",
	"#00d4aa",
	"#ffd93d",
	"#ff8844",
	"#4488ff",
	"#ff66aa",
	"#44ff88",
	"#00c8ff",
	"#b388ff",
	"#69f0ae",
	"#ff6e6e",
];

// dolgu renkleri (şeffaf dahil)
export const DOLGU_RENKLERI = [
	{ ad: "Şeffaf", deger: "transparent" },
	{ ad: "Beyaz", deger: "rgba(232, 232, 240, 0.15)" },
	{ ad: "Kırmızı", deger: "rgba(255, 68, 102, 0.15)" },
	{ ad: "Turuncu", deger: "rgba(255, 136, 68, 0.15)" },
	{ ad: "Sarı", deger: "rgba(255, 217, 61, 0.15)" },
	{ ad: "Yeşil", deger: "rgba(68, 255, 136, 0.15)" },
	{ ad: "Turkuaz", deger: "rgba(0, 212, 170, 0.15)" },
	{ ad: "Mavi", deger: "rgba(68, 136, 255, 0.15)" },
	{ ad: "Mor", deger: "rgba(124, 92, 255, 0.15)" },
	{ ad: "Pembe", deger: "rgba(255, 102, 170, 0.15)" },
];

// varsayılan çizim stili
export const varsayilanStil = {
	cizgiRengi: "#e8e8f0",
	cizgiKalinligi: 2,
	dolguRengi: "transparent",
	opaklık: 1,
};

// rastgele kullanıcı rengi al
export function rastgeleKullaniciRengiAl() {
	const indeks = Math.floor(Math.random() * KULLANICI_RENKLERI.length);
	return KULLANICI_RENKLERI[indeks];
}

// renk adını bul
export function renkAdiniBul(deger) {
	const bulunan = CIZIM_RENKLERI.find((r) => r.deger === deger);
	return bulunan ? bulunan.ad : deger;
}
