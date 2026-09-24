# Sessiz Seçim
I Want to create EV cars choosing site for buying an EV car. 
# Sessiz Seçim

Türkiye'de satılan elektrikli araçları menzil, fiyat ve kasa tipine göre
karşılaştırmak; beğenilenleri kısa listeye almak, elenenleri işaretlemek
için basit bir seçim rehberi.

TÜBİTAK stajı kapsamında, 4 haftalık full-stack yol haritasının (bkz.
`docs/roadmap-orijinal.pdf`) bu projeye uyarlanmış hali.

**Canlı link:** _(deploy sonrası eklenecek)_

---

## Teknoloji seçimleri

| Katman | Seçim | Not |
|---|---|---|
| Frontend | Vanilla HTML / CSS / JS | Framework yok, roadmap gereği |
| Backend | Node.js + Express | ASP.NET Core bilgisiyle hızlı adapte olunacak |
| Veritabanı | MongoDB Atlas | Ücretsiz katman |
| AI asistan | GitHub Copilot | Kod yazdırmak için değil, hata anlama ve refactor için |
| Barındırma | Vercel (frontend) + Render (backend) | İkisi de ücretsiz katman |

---

## Veri modeli

Detaylı şema ve kararların gerekçesi: [`docs/schema.md`](docs/schema.md)

Tek varlık: `Car` (marka, model, güç (BG), kasa tipi, çekiş, menzil, batarya,
fiyat, durum, fotoğraf, link, not).

---

## Mimari kararlar

- **Filtreleme, sıralama ve sayfalama şimdilik client-side.** 20-30
  kayıtlık bir katalogda gerekli değil; 3. haftada backend gelince
  `GET /api/cars` query parametreleriyle server-side'a taşınacak
  (`?bodyType=SUV&status=catalog&sort=price`).
- **Form varsayılan olarak gizli.** Sayfa önce liste, üstte "Araç ekle"
  butonu; butona basınca form açılıp kapanıyor (JS ile, Hafta 2).
- **Tablo, 768px altında karta dönüşüyor.** `data-label` özellikleri ve
  media query ile, JavaScript kullanmadan.

---

## Yol haritası

### Hazırlık (tamamlandı)

- [x] GitHub Student Developer Pack başvurusu
- [x] Git kurulumu ve `user.name` / `user.email` yapılandırması
- [x] VS Code kurulumu
- [x] Repo oluşturuldu, `main` branch koruması

### Hafta 1 — Temeller, Git, Arayüz (frontend statik)

- [x] `index.html` — karşılama sayfası
- [x] `app.html` — form, filtreler, tablo iskeleti
- [x] `docs/schema.md` — veri modeli ve kararlar
- [x] CSS: renk teması (lacivert), grid düzeni, form stilleri, badge
      renkleri, elenen satır görünümü
- [x] Mobil uyum: media query ile form/özet/filtre tek sütuna iniyor,
      tablo karta dönüşüyor
- [x] Form varsayılan gizli, "Araç ekle" butonu ile aç/kapa mimarisi
      (yapı hazır, davranış Hafta 2'de)
- [ ] Statik sayfayı Vercel/GitHub Pages üzerinden canlıya alma
- [ ] İlk haftanın özetini mentöre raporlama

### Hafta 2 — JavaScript ve dinamik yapı

- [ ] `js/app.js` dosyasını oluştur
- [ ] "Araç ekle" butonuna tıklanınca formu aç/kapat (`hidden` özelliğini
      JS ile değiştirerek)
- [ ] Form gönderildiğinde (`submit` event), verileri oku
      (`FormData` veya `id` bazlı okuma)
- [ ] Yeni aracı bir diziye (array) ekle, tabloyu bu diziden yeniden çiz
      (`renderCars()` gibi bir fonksiyon)
- [ ] Veriyi `localStorage`'a kaydet, sayfa yenilenince kaybolmasın
- [ ] Sil butonuna işlev kazandır (diziden çıkar, yeniden çiz,
      localStorage güncelle)
- [ ] Durum değiştirme (badge'e tıklayınca veya ayrı bir kontrol ile)
- [ ] Özet kartlarını (toplam, kısa liste, elenen) gerçek veriye göre
      güncelle
- [ ] Filtreleri **geçici olarak** frontend'de çalıştır (backend'e kadar)

### Hafta 3 — Backend ve RESTful API

- [ ] `backend/` klasörü, `npm init`, Express kurulumu
- [ ] `GET /api/ping` ile ilk endpoint testi (Postman/Thunder Client)
- [ ] REST endpoint'leri (veriler şimdilik RAM'de, array içinde):
  - `GET /api/cars` — listele, query parametreleriyle filtrele/sırala
  - `POST /api/cars` — yeni araç ekle
  - `PUT /api/cars/:id` — güncelle
  - `PATCH /api/cars/:id/status` — sadece durumu değiştir
  - `DELETE /api/cars/:id` — sil
- [ ] CORS ayarları (`cors` paketi)
- [ ] Frontend'i `localStorage`'dan bu API'ye bağla (`fetch` ile)
- [ ] Filtreleme/sıralama mantığını backend'e taşı (bkz. Mimari Kararlar)
- [ ] Hata yönetimi: API hata dönerse frontend'de kullanıcıya mesaj göster
---

Backend tarafında `Node.js` ve `Express` kullanılarak hazırlanan REST API uç noktaları (Endpoints) aşağıdadır:

**Temel URL:** `http://localhost:3000/api`

| Metod | Endpoint | Açıklama | Gönderilecek Veri (Body) |
|---|---|---|---|
| `GET` | `/ping` | Sunucunun çalışıp çalışmadığını test eder. | - |
| `GET` | `/cars` | Sistemdeki tüm araçların listesini getirir. | - |
| `POST` | `/cars` | Sisteme yeni bir araç ekler. | `{ brand, model, horsepower, price, ... }` |
| `PATCH` | `/cars/:id/status` | Belirtilen ID'ye sahip aracın durumunu günceller. | `{ status: "shortlist" }` |
| `DELETE` | `/cars/:id` | Belirtilen ID'ye sahip aracı sistemden tamamen siler. | - |

### Hafta 4 — Veritabanı, Docker, Deployment

- [ ] MongoDB Atlas'ta ücretsiz cluster oluştur
- [ ] Mongoose ile bağlantı, `Car` şeması (`docs/schema.md`'ye birebir)
- [ ] RAM'deki array'i gerçek veritabanı sorgularıyla değiştir
- [ ] `Dockerfile` yaz (backend için)
- [ ] `docker-compose.yml` ile frontend + backend birlikte ayağa kalksın
- [ ] Backend'i Render/Railway'e, frontend'i Vercel/Netlify'a deploy et
- [ ] Canlı linki test et (ekle/sil/güncelle, mobilden de dene)
- [ ] Kısa bir sunum hazırla: mimari, karşılaşılan 3 zorluk/çözüm
- [ ] `README.md`'yi ekran görüntüleri ve canlı linkle güncelle

---

## Bilinçli olarak kapsam dışı bırakılanlar

- Gerçek dosya yükleme (sadece resim linki/URL destekleniyor)
- Kullanıcı girişi / kimlik doğrulama
- Karşılaştırma ekranı, fiyat geçmişi, grafik
- İkinci varlık (marka/model ayrı tablo)
- Dış API'den canlı veri çekme

Gerekçeler için `docs/schema.md` içindeki "Kararlar ve gerekçeleri"
bölümüne bakılabilir.

---

## Günlük rutin (roadmap gereği, hafta içi her gün)

- Günlük algoritma pratiği (LeetCode/HackerRank, ~45 dk),
  `leetcode-diary` reposuna commit
- Günlük dokümantasyon (~30 dk): öğrenilen kavram veya çözülen hata
- Stand-up notu: dün ne yaptım / bugün ne yapacağım / engel var mı
- 2 saat kuralı: bir hatada 2 saatten fazla takılırsam mentöre sor

---

## Kurulum (proje tamamlandığında)

```bash
# Frontend
# index.html'i doğrudan tarayıcıda aç, veya bir local server ile çalıştır

# Backend (Hafta 3'ten sonra)
cd backend
npm install
npm start
```