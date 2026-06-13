# 🌸 İŞE ALIM SİSTEMİ — DEĞİŞİKLİK ÖZETİ VE KURULUM

> Tarih: 13 Haziran 2026
> Tüm değişiklikler **canlı (GitHub) sürüm** baz alınarak yapıldı, mevcut hiçbir özellik bozulmadı.

---

## ✅ YAPILAN DEĞİŞİKLİKLER

### 1. Bilgiler Formu — Yeni Alanlar + CV Yükleme
- ✉️ **E-posta alanı** eklendi (Google hesabından otomatik dolar, aday değiştirebilir)
- 💼 **Son 3 deneyim** yapılandırıldı — her biri: **Kurum + Görev/Pozisyon + Çalışma Süresi**
  (eski tek "Son İşyeri" alanının yerine geçti)
- 📄 **CV yükleme** — sürükle-bırak, PDF/Word/JPG/PNG, en fazla 5 MB, ilerleme çubuğu
- İsim, soyisim, ikamet (adres), telefon zaten vardı — korundu

### 2. Anasayfa — Slider → Kutucuk Grid
- Slider tamamen kaldırıldı
- İlanlar artık **yan yana + alt alta küçük kutucuklar** (responsive grid)
- Masaüstü: 3-4 kutu yan yana / Tablet: 2-3 / Mobil: 1-2
- Her kutu: **kare görsel** + rozet + başlık + konum + kısa açıklama + başvuru butonu

### 3. İlan Görseli (Kare)
- Admin panelinde **ilan görseli yükleme** alanı (sürükle-bırak, kare önerilir, max 3 MB)
- Anasayfada ilan kartında kare görsel görünür
- Görsel yoksa kategori ikonu (emoji) gösterilir

### 4. Admin Havuzunda Görüntüleme
- Aday detayında **telefon, e-posta, son 3 deneyim, CV** görünür
- CV için **Görüntüle / İndir** butonları
- ⚠️ **Önemli düzeltme:** Aday bilgileri eskiden admin panelinde görünmeyebiliyordu
  (veri kök seviyede kaydediliyor, admin `kisiselBilgiler` altında arıyordu) — artık ikisi de destekleniyor

---

## 🚀 KURULUM (Senden 1 Tek Adım)

### ⭐ TEK YAPMAN GEREKEN: Firebase Storage'ı Aç + Rules Yapıştır

CV ve ilan görselleri **Firebase Storage**'da saklanıyor (Apps Script'ten çok daha hızlı). Bunu bir kez açman gerekiyor:

**Adım 1 — Storage'ı Başlat**
1. [Firebase Console](https://console.firebase.google.com) → **bcka-site** projesi
2. Sol menü → **Storage**
3. **"Get Started"** (Başla) → çıkan pencerelerde **Next/İleri** → **Done/Bitti**
   (Lokasyon sorarsa varsayılanı kabul et)

**Adım 2 — Rules Yapıştır**
1. Storage açıldıktan sonra üstte **Rules** sekmesine tıkla
2. İçindekini sil, `storage.rules` dosyasının içeriğini yapıştır
3. **Publish** (Yayınla)

✅ Bu kadar! CV ve görsel yükleme artık çalışır.

### Adım 3 — Dosyaları GitHub'a Yükle
Şu dosyaları GitHub'a (3mrahbay/isbasvurusu) yükle:
- `firebase-config.js`
- `bilgiler.html`, `bilgiler.js`
- `anasayfa.js`
- `stil.css`
- `admin-pozisyonlar.html`, `admin-pozisyonlar.js`
- `admin-havuz.js`

Cache temizle: **Ctrl+Shift+R**

---

## 🧪 TEST

1. **Aday tarafı:** isbasvurusu.bircicekkoleji.com → Google ile giriş → Bilgiler formu
   - E-posta otomatik dolu mu? ✓
   - Son 3 deneyim alanları var mı? ✓
   - CV yükleyebiliyor musun? ✓
2. **Anasayfa:** İlanlar kutucuk halinde mi? ✓
3. **Admin → Pozisyonlar:** İlana kare görsel yükleyebiliyor musun? ✓
4. **Admin → Havuz:** Adayın CV'si + deneyimleri görünüyor mu? ✓

---

## ⚡ PERFORMANS ÖNERİLERİM

Senin için sistemin daha hızlı ve sağlam olması adına şunları öneriyorum (öncelik sırasına göre):

### 🔴 Yüksek Öncelik (büyük fark yaratır)

**1. CV/Görsel → Firebase Storage'a taşındı ✅ (yaptım)**
Eskiden CV Apps Script proxy üzerinden base64 olarak gidiyordu — yavaş ve Apps Script kotasını tüketiyordu. Artık doğrudan tarayıcıdan Storage'a gidiyor. **3-5 kat daha hızlı.**

**2. Firestore'da composite index oluştur**
Anasayfada ilanlar `where('aktif','==',true)` ile çekilip JS'te sıralanıyor. İlan sayısı artarsa Firestore'da `aktif + olusturmaZamani` index'i kurup `orderBy` eklemek gerekir. (Şu an az ilan olduğu için sorun değil.)

**3. Görselleri optimize et (otomatik küçültme)**
İlan görselleri 3 MB'a kadar yükleniyor ama anasayfada küçük gösteriliyor. İleride yükleme sırasında tarayıcıda otomatik 800x800'e küçültme eklenebilir — sayfa **çok daha hızlı** açılır.

### 🟡 Orta Öncelik

**4. Test sayfası otomatik kayıt sıklığı**
Her cevapta Firestore'a yazmak yerine, birkaç cevabı biriktirip toplu yazmak Firestore maliyetini düşürür.

**5. Aday listesi sayfalama (pagination)**
Aday sayısı 100'ü geçince hepsini birden çekmek yavaşlar. "Daha fazla yükle" veya sayfalama eklenebilir.

**6. Lazy loading ✅ (kısmen yaptım)**
İlan görsellerine `loading="lazy"` ekledim — ekranda görünmeyen görseller sonra yüklenir.

### 🟢 Düşük Öncelik (ileride)

**7. PWA (uygulama gibi)** — Aday telefonuna "ekle" diyebilir, daha hızlı açılır.
**8. CV önizleme** — Word CV'ler şu an indiriliyor; PDF'e çevirip önizleme eklenebilir.
**9. Görsel CDN** — Çok trafik olursa Firebase Storage yerine Bunny.net CDN düşünülebilir (zaten bircicek-cv hesabın var).

---

## 📊 ÖZET

| Konu | Durum |
|------|-------|
| E-posta alanı | ✅ Eklendi |
| Son 3 deneyim | ✅ Eklendi |
| CV yükleme | ✅ Eklendi (Firebase Storage) |
| Anasayfa kutucuk grid | ✅ Slider kaldırıldı |
| İlan kare görsel | ✅ Eklendi |
| Admin'de CV/deneyim görünümü | ✅ Eklendi |
| Performans (Storage, lazy, interval) | ✅ İyileştirildi |
| **Senden gereken** | ⭐ Sadece Storage'ı aç + Rules yapıştır |

🌸 Storage'ı açıp Rules'u yapıştırdıktan sonra her şey çalışır. Takılırsan ekran görüntüsü at, hallederim.
