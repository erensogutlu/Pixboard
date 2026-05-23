require("dotenv").config({
	path: require("path").resolve(__dirname, "../.env"),
});
const { Pool } = require("pg");

const baglantiDizesi = process.env.VERITABANI_URL || "";

const havuz = new Pool({
	connectionString: baglantiDizesi,
	ssl: { rejectUnauthorized: false },
	max: 20,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 10000,
});

havuz.on("error", (hata) => {
	console.error("beklenmeyen veritabanı hatası:", hata);
});

// sorgu yardımcı fonksiyonu
const sorgu = (metin, parametreler) => havuz.query(metin, parametreler);

module.exports = { havuz, sorgu };
