/* Pixboard – Online Çizim Platformu */

Pixboard, React, Rough.js ve Socket.io teknolojilerini kullanarak kullanıcıların odalar oluşturup gerçek zamanlı ortaklaşa çizim yapabilmesini, panolar oluşturup paylaşabilmesini ve odalarını profesyonelce yönetebilmesini sağlayan modern bir beyaz tahta platformudur.

* Özellikler : 

 -> Gerçek Zamanlı Ortaklaşa Çizim: Socket.io altyapısı ile düşük gecikmeli, senkronize ve pürüzsüz çizim deneyimi.
 -> Çok Yönlü Çizim Araçları: Kalem, dikdörtgen, elips, çizgi, ok, baklava ve metin ekleme ile silgi ve sürükle/bırak seçimi.
 -> Mobil Dokunmatik Desteği: Çift parmak ile kaydırma, yakınlaştırma (pinch-to-zoom) ve katlanabilir özellik paneli.
 -> Oda ve Paylaşım Yönetimi: Oda oluşturma, şifreli/gizli tahtalar, oda ismini güncelleme ve kurucuya özel oda silme yetkileri.
 -> Güvenli ve Sınırlı Veri Yapısı: Tahta başına maksimum 500 öğe limiti, 1.5 MB veri boyutu sınırı ve IP tabanlı hız sınırlama.
 -> Zırhlı API ve Soket Güvenliği: Rate Limit, Express JSON boyutu sınırlamaları ve 'admin' kullanıcı adı koruması ile güvenli yapı.
 -> Modern UI/UX: Karanlık tema odaklı, responsive, akıcı animasyonlar ve modern cam efekti (glassmorphism) ile premium arayüz.
 -> Admin Kontrol Paneli: Tüm kullanıcıları, tahtaları ve sistem istatistiklerini yöneten merkezi yönetim arayüzü.

* Kullanılan Teknolojiler :

    Frontend : 

   -> React.js (Vite)
   -> Vanilla CSS (Modern & Glassmorphism Dark UI)
   -> Socket.io Client (Çizim Senkronizasyonu)
   -> Rough.js (El Çizimi Efekti ve Modelleme)

    Backend :

   -> Node.js (Express)
   -> PostgreSQL (Veri Depolama)
   -> Socket.io (Gerçek Zamanlı İletişim)
   -> Express Rate Limit (Güvenlik)
   -> BcryptJS & JWT (Kimlik Doğrulama)

* Geliştirici : Eren Söğütlü

-----------------------------------------------------------------------------------------------------------------

/* Pixboard – Online Drawing Platform */

Pixboard is a modern whiteboard platform that utilizes React, Rough.js, and Socket.io technologies to enable users to create rooms for real-time collaborative drawing, share boards, and manage their rooms professionally.

* Features : 

 -> Real-Time Collaborative Drawing: Low-latency, synchronized, and smooth drawing experience with Socket.io infrastructure.
 -> Versatile Drawing Tools: Pencil, rectangle, ellipse, line, arrow, diamond, and text insertion, alongside eraser and select/drag tools.
 -> Mobile Touch Support: Two-finger panning, pinch-to-zoom, and a collapsible properties panel for responsive viewports.
 -> Room and Share Management: Room creation, password-protected/private boards, room renaming, and creator-specific deletion.
 -> Secure and Limited Data Structure: Maximum 500 items per board, 1.5 MB JSON size limits, and IP-based rate limits.
 -> Armored API and Socket Security: Secure structure with Rate Limiting, Express JSON payload limits, and 'admin' username protection.
 -> Modern UI/UX: Premium interface with dark theme focus, responsive glassmorphism design, and smooth animations.
 -> Admin Control Panel: A central management interface for controlling all users, boards, and system statistics.

* Technologies Used : 

    Frontend : 

   -> React.js (Vite)
   -> Vanilla CSS (Modern & Glassmorphism Dark UI)
   -> Socket.io Client (Drawing Sync)
   -> Rough.js (Hand-Drawn Effect Rendering)

    Backend : 

   -> Node.js (Express)
   -> PostgreSQL (Data Storage)
   -> Socket.io (Real-Time Events Sync)
   -> Express Rate Limit
   -> BcryptJS & JWT

* Developer : Eren Söğütlü

-----------------------------------------------------------------------------------------------------------------

## Kurulum ve Çalıştırma

### 1. Gerekli Paketlerin Yüklenmesi

Frontend için:

```bash
cd istemci
npm install
```

Backend için:

```bash
cd sunucu
npm install
```

---

### 2. Veritabanı Kurulumu

PostgreSQL veritabanı bağlantı bilgilerinizi `sunucu/veritabani/baglanti.js` veya ortam değişkenlerine girin, ardından tabloları oluşturmak için:

```bash
cd sunucu
node veritabani/sema.js
```

---

### 3. Projeyi Çalıştırma

Kurulum tamamlandıktan sonra iki ayrı terminal kullanın:

#### Backend (Sunucu)

```bash
cd sunucu
node sunucu.js
```

> Sunucu: http://localhost:3001

---

#### Frontend (Arayüz)

```bash
cd istemci
npm run dev
```

> Uygulama: http://localhost:5173

-----------------------------------------------------------------------------------------------------------------

## Installation and Operation

### 1. Installing Required Packages

For frontend:

```bash
cd istemci
npm install
```

For backend:

```bash
cd sunucu
npm install
```

---

### 2. Database Setup

Enter your PostgreSQL database connection details in `sunucu/veritabani/baglanti.js` or environment variables, then to create the tables:

```bash
cd sunucu
node veritabani/sema.js
```

---

### 3. Running the Project

Once the installation is complete, use two separate terminals:

#### Backend

```bash
cd sunucu
node sunucu.js
```

> Server: http://localhost:3001

---

#### Frontend

```bash
cd istemci
npm run dev
```

> Application: http://localhost:5173