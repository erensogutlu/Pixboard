import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import GirisKayit from "./GirisKayit";
import { API_URL } from "../config";
import "./TahtaListesi.css";

// tahta listesi
export default function TahtaListesi() {
	const yonlendir = useNavigate();
	const [tahtalar, tahtalariAyarla] = useState([]);
	const [yukleniyor, yukleniyorAyarla] = useState(true);
	const [modalAcik, modalAcikAyarla] = useState(false);
	const [yeniTahtaAdi, yeniTahtaAdiAyarla] = useState("");

	// gizlilik ve sifre
	const [yeniOdaGizli, yeniOdaGizliAyarla] = useState(false);
	const [yeniOdaSifre, yeniOdaSifreAyarla] = useState("");

	// kullanici ve auth
	const [oturumKullanici, oturumKullaniciAyarla] = useState(null);
	const [authModalAcik, authModalAcikAyarla] = useState(false);
	const [kullaniciAdi, kullaniciAdiAyarla] = useState(
		() => localStorage.getItem("pixboard_kullanici_adi") || "",
	);
	const [katilimKodu, katilimKoduAyarla] = useState("");

	// profil cek
	const profilCek = async () => {
		const token = localStorage.getItem("pixboard_token");
		if (!token) {
			oturumKullaniciAyarla(null);
			return;
		}
		try {
			const yanit = await fetch(`${API_URL}/api/auth/profil`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (yanit.ok) {
				const veri = await yanit.json();
				oturumKullaniciAyarla(veri.kullanici);
				kullaniciAdiAyarla(veri.kullanici.kullaniciAdi);
				localStorage.setItem(
					"pixboard_kullanici_adi",
					veri.kullanici.kullaniciAdi,
				);
			} else {
				// token gecersizse temizle
				localStorage.removeItem("pixboard_token");
				oturumKullaniciAyarla(null);
			}
		} catch (hata) {
			console.log("// Profil bilgisi sunucudan alınamadı");
		}
	};

	// tahtalari yukle
	const tahtalariYukle = async () => {
		yukleniyorAyarla(true);
		try {
			const token = localStorage.getItem("pixboard_token");
			const headers = {};
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}
			const yanit = await fetch(`${API_URL}/api/tahtalar`, { headers });
			if (yanit.ok) {
				const veri = await yanit.json();
				tahtalariAyarla(veri);
			}
		} catch (hata) {
			console.log("// tahtalar yüklenemedi, yerel modda çalışılıyor");
		} finally {
			yukleniyorAyarla(false);
		}
	};

	useEffect(() => {
		profilCek().then(() => {
			tahtalariYukle();
		});
	}, []);

	// cikis yap
	const cikisYap = () => {
		localStorage.removeItem("pixboard_token");
		localStorage.removeItem("pixboard_kullanici_adi");
		oturumKullaniciAyarla(null);
		kullaniciAdiAyarla("");
		tahtalariYukle();
	};

	// yeni tahta
	const yeniTahtaOlustur = async () => {
		if (!yeniTahtaAdi.trim()) return;

		// kullanici adini kaydet
		if (!oturumKullanici && kullaniciAdi.trim()) {
			localStorage.setItem("pixboard_kullanici_adi", kullaniciAdi.trim());
		}

		if (yeniOdaGizli && !yeniOdaSifre) {
			alert("Gizli oda için lütfen şifre belirleyin!");
			return;
		}

		try {
			const token = localStorage.getItem("pixboard_token");
			const headers = { "Content-Type": "application/json" };
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const yanit = await fetch(`${API_URL}/api/tahtalar`, {
				method: "POST",
				headers,
				body: JSON.stringify({
					baslik: yeniTahtaAdi.trim(),
					gizli: yeniOdaGizli,
					sifre: yeniOdaGizli ? yeniOdaSifre : null,
					olusturan: kullaniciAdi.trim() || "Anonim",
				}),
			});

			if (yanit.ok) {
				const yeniTahta = await yanit.json();

				// Modal durumlarını sıfırla
				modalAcikAyarla(false);
				yeniTahtaAdiAyarla("");
				yeniOdaGizliAyarla(false);
				yeniOdaSifreAyarla("");

				// gizli oda sifresi
				if (yeniOdaGizli) {
					sessionStorage.setItem(`tahta_sifre_${yeniTahta.id}`, yeniOdaSifre);
				}

				yonlendir(`/tahta/${yeniTahta.id}`, {
					state: { yeniOlusturuldu: true },
				});
				return;
			}
		} catch (hata) {
			console.log("// sunucuya bağlanılamadı, yerel tahta oluşturuluyor");
		}

		// yerel tahta
		const yerelId = crypto.randomUUID();
		yonlendir(
			`/tahta/${yerelId}?baslik=${encodeURIComponent(yeniTahtaAdi.trim())}`,
		);
	};

	// tahtaya katil
	const tahtayaKatil = () => {
		if (!katilimKodu.trim()) return;
		if (!oturumKullanici && kullaniciAdi.trim()) {
			localStorage.setItem("pixboard_kullanici_adi", kullaniciAdi.trim());
		}
		yonlendir(`/tahta/${katilimKodu.trim()}`);
	};

	// silme onay durumu
	const [silmeOnayAcik, silmeOnayAcikAyarla] = useState(false);
	const [silinecekTahtaId, silinecekTahtaIdAyarla] = useState(null);

	// silme baslat
	const tahtaSilTiklandi = (id, e) => {
		e.stopPropagation();
		silinecekTahtaIdAyarla(id);
		silmeOnayAcikAyarla(true);
	};

	// silme onayla
	const tahtaSilOnayla = async () => {
		if (!silinecekTahtaId) return;
		const id = silinecekTahtaId;
		silmeOnayAcikAyarla(false);
		silinecekTahtaIdAyarla(null);

		try {
			const token = localStorage.getItem("pixboard_token");
			const headers = {};
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const yanit = await fetch(`${API_URL}/api/tahtalar/${id}`, {
				method: "DELETE",
				headers,
			});

			if (yanit.ok) {
				// listeyi yenile
				tahtalariYukle();
			} else {
				const veri = await yanit.json();
				alert(veri.mesaj || "Silme işlemi başarısız oldu.");
			}
		} catch (hata) {
			console.error("Silme hatası:", hata);
			alert("Bağlantı hatası nedeniyle silme işlemi gerçekleştirilemedi.");
		}
	};

	// tarih formatla
	const tarihFormatla = (tarih) => {
		if (!tarih) return "";
		return new Date(tarih).toLocaleDateString("tr-TR", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	return (
		<div className="tahta-listesi-sayfa">
			{/* arka plan efekti */}
			<div className="arkaplan-efekt">
				<div className="efekt-daire efekt-daire-1" />
				<div className="efekt-daire efekt-daire-2" />
				<div className="efekt-daire efekt-daire-3" />
			</div>

			<div className="tahta-listesi-icerik">
				{/* profil bari */}
				<div className="profil-ust-bar">
					{oturumKullanici ? (
						<div className="kullanici-profil-kart cam-panel">
							<div className="kullanici-profil-avatar">
								{oturumKullanici.kullaniciAdi[0].toUpperCase()}
							</div>
							<span className="kullanici-profil-adi">
								{oturumKullanici.kullaniciAdi}
							</span>
							{oturumKullanici.rol === "admin" && (
								<button
									className="profil-aksiyon-dugme admin-git"
									onClick={() => yonlendir("/admin")}
									style={{
										background:
											"linear-gradient(135deg, rgba(124, 92, 255, 0.15) 0%, rgba(0, 212, 170, 0.15) 100%)",
										borderColor: "rgba(124, 92, 255, 0.3)",
										color: "var(--vurgu-parlak)",
										marginLeft: "8px",
									}}
								>
									<svg
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										style={{ marginRight: "6px" }}
									>
										<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
										<path d="M12 16v-4" />
										<path d="M12 8h.01" />
									</svg>
									Admin Paneli
								</button>
							)}
							<button className="profil-aksiyon-dugme cikis" onClick={cikisYap}>
								Çıkış Yap
							</button>
						</div>
					) : (
						<button
							className="profil-aksiyon-dugme giris cam-panel"
							onClick={() => authModalAcikAyarla(true)}
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								style={{ marginRight: "6px" }}
							>
								<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
							</svg>
							Giriş Yap / Üye Ol
						</button>
					)}
				</div>

				{/* baslik alani */}
				<header className="sayfa-baslik">
					<div className="logo-buyuk">
						<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
							<rect
								x="2"
								y="2"
								width="20"
								height="20"
								rx="4"
								fill="url(#logo-grad-buyuk)"
							/>
							<path
								d="M7 8h10M7 12h6M7 16h8"
								stroke="#fff"
								strokeWidth="1.5"
								strokeLinecap="round"
							/>
							<defs>
								<linearGradient
									id="logo-grad-buyuk"
									x1="2"
									y1="2"
									x2="22"
									y2="22"
								>
									<stop stopColor="#7c5cff" />
									<stop offset="1" stopColor="#00d4aa" />
								</linearGradient>
							</defs>
						</svg>
						<div>
							<h1 className="baslik-metin">Pixboard</h1>
							<p className="alt-baslik">Online Çizim Platformu</p>
						</div>
					</div>
				</header>

				{/* kullanici adi girisi */}
				{!oturumKullanici && (
					<div className="kullanici-adi-alan cam-panel">
						<label className="alan-etiketi">
							Ziyaretçi Adınız (Anonim Katılım İçin)
						</label>
						<input
							type="text"
							value={kullaniciAdi}
							onChange={(e) => kullaniciAdiAyarla(e.target.value)}
							placeholder="Adınızı girin..."
							className="kullanici-adi-girdi"
						/>
					</div>
				)}

				{/* eylem butonlari */}
				<div className="eylem-alani">
					<button
						className="eylem-dugme birincil"
						onClick={() => modalAcikAyarla(true)}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="12" y1="5" x2="12" y2="19" />
							<line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						<span>Yeni Tahta Oluştur</span>
					</button>

					<div className="katilim-alani">
						<input
							type="text"
							value={katilimKodu}
							onChange={(e) => katilimKoduAyarla(e.target.value)}
							placeholder="Tahta veya Paylaşım Kodunu girin..."
							className="katilim-girdi"
							onKeyDown={(e) => e.key === "Enter" && tahtayaKatil()}
						/>
						<button className="eylem-dugme ikincil" onClick={tahtayaKatil}>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
								<polyline points="10 17 15 12 10 7" />
								<line x1="15" y1="12" x2="3" y2="12" />
							</svg>
							<span>Katıl</span>
						</button>
					</div>
				</div>

				{/* tahta listesi */}
				{yukleniyor ? (
					<div className="yukleniyor-alan">
						<div className="yukleniyor-animasyon" />
						<span>Tahtalar yükleniyor...</span>
					</div>
				) : tahtalar.length > 0 ? (
					<div className="tahta-izgarasi">
						{tahtalar.map((tahta) => (
							<div
								key={tahta.id}
								className="tahta-kart cam-panel"
								onClick={() => yonlendir(`/tahta/${tahta.id}`)}
							>
								<div className="kart-ust">
									<div className="kart-simge">
										{tahta.gizli ? (
											<svg
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												stroke="#ff6b6b"
												strokeWidth="1.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<rect
													x="3"
													y="11"
													width="18"
													height="11"
													rx="2"
													ry="2"
												/>
												<path d="M7 11V7a5 5 0 0 1 10 0v4" />
											</svg>
										) : (
											<svg
												width="24"
												height="24"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="1.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<rect x="3" y="3" width="18" height="18" rx="3" />
												<path d="M7 7h4M7 11h8M7 15h6" />
											</svg>
										)}
									</div>
									<h3 className="kart-baslik">
										{tahta.baslik || "İsimsiz Tahta"}
										{tahta.gizli && <span className="kilit-rozet">Gizli</span>}
									</h3>
								</div>
								<div className="kart-alt">
									<span className="kart-tarih">
										{tarihFormatla(tahta.olusturulma_tarihi)}
									</span>
									<div className="kart-eylemler">
										{oturumKullanici &&
											tahta.olusturan_id === oturumKullanici.id && (
												<button
													className="kart-sil-dugme"
													onClick={(e) => tahtaSilTiklandi(tahta.id, e)}
													title="Tahtayı Sil"
												>
													<svg
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<polyline points="3 6 5 6 21 6"></polyline>
														<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
													</svg>
												</button>
											)}
										<button className="kart-ac-dugme">
											Aç
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
											>
												<polyline points="9 18 15 12 9 6" />
											</svg>
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="bos-durum">
						<div className="bos-durum-simge">
							<svg
								width="64"
								height="64"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="1"
								strokeLinecap="round"
								strokeLinejoin="round"
								opacity="0.3"
							>
								<rect x="2" y="2" width="20" height="20" rx="4" />
								<path d="M8 8h8M8 12h4M8 16h6" />
							</svg>
						</div>
						<h3 className="bos-durum-baslik">Henüz tahta yok</h3>
						<p className="bos-durum-aciklama">
							İlk tahtanızı oluşturarak başlayın veya bir tahta koduna katılın.
						</p>
					</div>
				)}

				<footer
					className="liste-footer"
					style={{
						textAlign: "center",
						marginTop: "40px",
						padding: "16px",
						fontSize: "13px",
						color: "var(--metin-ikincil)",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						gap: "8px",
					}}
				>
					<span>Geliştirici:</span>
					<a
						href="https://github.com/erensogutlu"
						target="_blank"
						rel="noopener noreferrer"
						style={{
							color: "var(--vurgu-ikincil-parlak)",
							textDecoration: "none",
							fontWeight: "600",
							display: "inline-flex",
							alignItems: "center",
							gap: "4px",
							transition: "color var(--gecis-hizli)",
						}}
						className="github-link"
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
						</svg>
						Eren Söğütlü
					</a>
				</footer>
			</div>

			{/* yeni tahta modalı */}
			{modalAcik && (
				<div
					className="modal-arkaplan"
					onClick={() => {
						modalAcikAyarla(false);
						yeniOdaGizliAyarla(false);
						yeniOdaSifreAyarla("");
					}}
				>
					<div
						className="modal-icerik cam-panel"
						onClick={(e) => e.stopPropagation()}
					>
						<h2 className="modal-baslik">Yeni Tahta Oluştur</h2>

						<div className="modal-alan">
							<label className="alan-etiketi">Tahta Adı</label>
							<input
								type="text"
								value={yeniTahtaAdi}
								onChange={(e) => yeniTahtaAdiAyarla(e.target.value)}
								placeholder="Tahta adını girin..."
								className="modal-girdi"
								autoFocus
								onKeyDown={(e) => e.key === "Enter" && yeniTahtaOlustur()}
							/>
						</div>

						{/* gizli oda secimi */}
						{oturumKullanici ? (
							<div className="modal-gizlilik-grubu">
								<div className="modal-checkbox-satir">
									<input
										type="checkbox"
										id="yeniOdaGizli"
										checked={yeniOdaGizli}
										onChange={(e) => yeniOdaGizliAyarla(e.target.checked)}
										className="modal-checkbox"
									/>
									<label htmlFor="yeniOdaGizli" className="alan-etiketi-satir">
										Oda gizli (şifreli) olsun
									</label>
								</div>

								{yeniOdaGizli && (
									<div className="modal-alan" style={{ marginTop: "12px" }}>
										<label className="alan-etiketi">Oda Giriş Şifresi</label>
										<input
											type="password"
											value={yeniOdaSifre}
											onChange={(e) => yeniOdaSifreAyarla(e.target.value)}
											placeholder="Şifreyi belirleyin..."
											className="modal-girdi"
										/>
									</div>
								)}
							</div>
						) : (
							<div className="modal-uyari-notu">
								💡{" "}
								<em>Gizli (şifreli) oda kurabilmek için lütfen giriş yapın.</em>
							</div>
						)}

						<div className="modal-eylemler">
							<button
								className="modal-dugme iptal"
								onClick={() => {
									modalAcikAyarla(false);
									yeniOdaGizliAyarla(false);
									yeniOdaSifreAyarla("");
								}}
							>
								İptal
							</button>
							<button
								className="modal-dugme onayla"
								onClick={yeniTahtaOlustur}
								disabled={
									!yeniTahtaAdi.trim() || (yeniOdaGizli && !yeniOdaSifre)
								}
							>
								Oluştur
							</button>
						</div>
					</div>
				</div>
			)}

			{/* giris kayit modali */}
			{authModalAcik && (
				<GirisKayit
					onClose={() => authModalAcikAyarla(false)}
					onAuthSuccess={(kullaniciInfo, token) => {
						oturumKullaniciAyarla(kullaniciInfo);
						kullaniciAdiAyarla(kullaniciInfo.kullaniciAdi);
						tahtalariYukle();
					}}
				/>
			)}

			{/* tahta silme onay modali */}
			{silmeOnayAcik &&
				createPortal(
					<div
						className="modal-arkaplan"
						onClick={() => {
							silmeOnayAcikAyarla(false);
							silinecekTahtaIdAyarla(null);
						}}
					>
						<div
							className="modal-icerik cam-panel"
							onClick={(e) => e.stopPropagation()}
						>
							<h2 className="modal-baslik">Tahtayı Sil</h2>
							<p className="modal-aciklama">
								Bu tahtayı tamamen silmek istediğinizden emin misiniz? Bu işlem
								geri alınamaz.
							</p>
							<div className="modal-eylemler">
								<button
									className="modal-dugme iptal"
									onClick={() => {
										silmeOnayAcikAyarla(false);
										silinecekTahtaIdAyarla(null);
									}}
								>
									İptal
								</button>
								<button
									className="modal-dugme onayla"
									onClick={tahtaSilOnayla}
									style={{
										background:
											"linear-gradient(135deg, #ff4b4b 0%, #ff8585 100%)",
										boxShadow: "0 4px 15px rgba(255, 75, 75, 0.2)",
									}}
								>
									Sil
								</button>
							</div>
						</div>
					</div>,
					document.body,
				)}
		</div>
	);
}
