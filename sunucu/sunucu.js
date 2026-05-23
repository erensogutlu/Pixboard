require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const tahtaRotalari = require("./rotalar/tahtaRotalari");
const { yonlendirici: authRotalari } = require("./rotalar/authRotalari");
const adminRotalari = require("./rotalar/adminRotalari");
const soketYoneticisiniBaslat = require("./soket/soketYoneticisi");
const semaOlustur = require("./veritabani/sema");
const hizSinirlayici = require("./guvenlik/hizSinirla");

const uygulama = express();

// cors ayarları
uygulama.use(
	cors({
		origin: "*",
		methods: ["GET", "POST", "PUT", "DELETE"],
		credentials: true,
	}),
);

// gövde ayrıştırıcı ve limit
uygulama.use(express.json({ limit: "2mb" }));

// rotaları bağla
uygulama.use("/api/tahtalar", hizSinirlayici.genel, tahtaRotalari);
uygulama.use("/api/auth", hizSinirlayici.auth, authRotalari);
uygulama.use("/api/admin", hizSinirlayici.admin, adminRotalari);

// sağlık kontrolü
uygulama.get("/api/saglik", (istek, yanit) => {
	yanit.json({ durum: "çalışıyor", zaman: new Date().toISOString() });
});

// ana sayfa durum kontrolü
uygulama.get("/", (istek, yanit) => {
	yanit.send("<h1>Pixboard API Sunucusu</h1><p>Sunucu aktif ve calisiyor. Saglik kontrolu icin <a href='/api/saglik'>/api/saglik</a> adresini ziyaret edebilirsiniz.</p>");
});

// http sunucusu
const sunucu = http.createServer(uygulama);

// socket.io sunucusu
const io = new Server(sunucu, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
	maxHttpBufferSize: 2 * 1024 * 1024, // 2 MB - büyük payload'ları engelle
});

// soket yöneticisi
soketYoneticisiniBaslat(io);

// port ayarı
const PORT = process.env.PORT || 3001;

// sunucuyu başlat
const basla = async () => {
	try {
		// veritabanı şeması
		await semaOlustur();
		console.log("veritabanı şeması hazır");

		sunucu.listen(PORT, () => {
			console.log(`pixboard sunucusu ${PORT} portunda çalışıyor`);
			console.log(`api adresi: http://localhost:${PORT}/api/tahtalar`);
			console.log(`sağlık kontrolü: http://localhost:${PORT}/api/saglik`);
		});
	} catch (hata) {
		console.error("sunucu başlatma hatası:", hata);
		process.exit(1);
	}
};

basla();
