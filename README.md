# 🌸 Bir Çiçek Koleji - İş Başvurusu Sistemi

Bir Çiçek Koleji Anaokulu için AI destekli aday değerlendirme ve iş başvurusu sistemi.

## 🌐 Canlı Site

[https://isbasvurusu.bircicekkoleji.com](https://isbasvurusu.bircicekkoleji.com)

## 🛠️ Teknolojiler

- **Frontend:** Vanilla JS (ES Modules), HTML5, CSS3
- **Backend:** Firebase Firestore + Authentication
- **AI Analiz:** Claude API (Anthropic) via Apps Script proxy
- **Mail:** Brevo via Apps Script proxy
- **Hosting:** GitHub Pages

## 📁 Yapı

```
isbasvurusu/
├── index.html           # Karşılama + Google Login
├── bilgiler.html        # Kişisel bilgiler formu
├── tamamlandi.html      # Geçici teşekkür sayfası
├── stil.css             # Tüm stiller
├── firebase-config.js   # Firebase yapılandırma
├── auth.js              # Authentication mantığı
├── bilgiler.js          # Bilgiler form mantığı
├── yardimci.js          # Ortak fonksiyonlar
└── CNAME                # GitHub Pages domain
```

## 🚀 Faz Planı

- [x] **Faz 0:** Altyapı (Apps Script, Firestore Rules)
- [x] **Faz 1:** Aday giriş + kişisel bilgiler
- [ ] **Faz 2:** Test soruları + ara kayıt
- [ ] **Faz 3:** Claude AI analizi
- [ ] **Faz 4:** Admin panel + raporlama
- [ ] **Faz 5:** Aday havuzu + karşılaştırma
- [ ] **Faz 6:** Tekrar başvuru + gelişim analizi
- [ ] **Faz 7:** Mail otomasyonu

## 📞 İletişim

Bir Çiçek Koleji Anaokulu  
Aydınlı, Tuzla / İstanbul  
📧 eposta@bircicekkoleji.com  
📱 0555 103 54 57
