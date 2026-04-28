// ═══════════════════════════════════════════════════════════
// KİŞİSEL BİLGİLER SAYFASI MANTIĞI
// ═══════════════════════════════════════════════════════════

import { 
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onAuthStateChanged,
  signOut
} from './firebase-config.js';

import { 
  telefonFormatla, 
  telefonGecerli, 
  hataGoster, 
  hataTemizle,
  tumHatalariTemizle,
  butonYukle,
  butonNormal
} from './yardimci.js';

let mevcutKullanici = null;
let mevcutVeri = null;

// ───────────────────────────────────────────────
// Auth kontrol
// ───────────────────────────────────────────────
onAuthStateChanged(auth, async (kullanici) => {
  if (!kullanici) {
    // Giriş yapılmamışsa ana sayfaya yönlendir
    window.location.href = 'index.html';
    return;
  }
  
  mevcutKullanici = kullanici;
  
  // Kullanıcı bilgilerini göster
  document.getElementById('kullaniciFoto').src = kullanici.photoURL || 
    'https://3mrahbay.github.io/yenikayit/logo_bcka.png';
  document.getElementById('kullaniciAd').textContent = kullanici.displayName || 'Aday';
  document.getElementById('kullaniciEposta').textContent = kullanici.email;
  document.getElementById('kullaniciBar').classList.remove('gizli');
  
  // Mevcut başvuru verisi var mı?
  await mevcutVeriyiYukle();
  
  // Yükleniyor gizle, formu göster
  document.getElementById('yukleniyor').classList.add('gizli');
  document.getElementById('formAlani').classList.remove('gizli');
});

// ───────────────────────────────────────────────
// Mevcut veriyi yükle (varsa form'u doldur)
// ───────────────────────────────────────────────
async function mevcutVeriyiYukle() {
  try {
    const ref = doc(db, 'isBasvurulari', mevcutKullanici.email);
    const snap = await getDoc(ref);
    
    if (snap.exists()) {
      mevcutVeri = snap.data();
      
      // Google'dan gelen ad/soyadı parçala
      if (mevcutVeri.ad) {
        document.getElementById('ad').value = mevcutVeri.ad;
      } else if (mevcutKullanici.displayName) {
        const parcalar = mevcutKullanici.displayName.split(' ');
        document.getElementById('ad').value = parcalar[0] || '';
        document.getElementById('soyad').value = parcalar.slice(1).join(' ') || '';
      }
      
      // Diğer alanları doldur
      const alanlar = [
        'soyad', 'telefon', 'dogumTarihi', 'cinsiyet', 'adres',
        'medeniDurum', 'cocukSayisi', 'egitimDurumu', 'bolum', 
        'okul', 'mezuniyetYili', 'deneyimYili', 'sonIsyeri',
        'ozelEgitim', 'yabanciDil', 'sertifikalar', 'baslamaTarihi',
        'ucretBeklenti', 'mevcutIsDurumu', 'duyumKaynagi', 'nedenBCK'
      ];
      
      alanlar.forEach(alan => {
        if (mevcutVeri[alan] !== undefined && mevcutVeri[alan] !== null) {
          const el = document.getElementById(alan);
          if (el) el.value = mevcutVeri[alan];
        }
      });
    }
  } catch (hata) {
    console.error('Veri yükleme hatası:', hata);
  }
}

// ───────────────────────────────────────────────
// Telefon formatlama (canlı)
// ───────────────────────────────────────────────
document.getElementById('telefon').addEventListener('input', (e) => {
  e.target.value = telefonFormatla(e.target.value);
  hataTemizle('telefon');
});

// Hata temizleme - input değiştiğinde
['ad', 'soyad', 'dogumTarihi', 'cinsiyet', 'adres', 'egitimDurumu', 
 'bolum', 'okul', 'mezuniyetYili', 'deneyimYili', 'baslamaTarihi',
 'mevcutIsDurumu', 'nedenBCK'].forEach(alan => {
  const el = document.getElementById(alan);
  if (el) {
    el.addEventListener('input', () => hataTemizle(alan));
    el.addEventListener('change', () => hataTemizle(alan));
  }
});

// ───────────────────────────────────────────────
// Formu kaydet
// ───────────────────────────────────────────────
window.bilgileriKaydet = async function() {
  tumHatalariTemizle();
  
  // Form verilerini topla
  const veri = {
    ad: document.getElementById('ad').value.trim(),
    soyad: document.getElementById('soyad').value.trim(),
    telefon: document.getElementById('telefon').value.trim(),
    dogumTarihi: document.getElementById('dogumTarihi').value,
    cinsiyet: document.getElementById('cinsiyet').value,
    adres: document.getElementById('adres').value.trim(),
    medeniDurum: document.getElementById('medeniDurum').value,
    cocukSayisi: document.getElementById('cocukSayisi').value || '0',
    
    egitimDurumu: document.getElementById('egitimDurumu').value,
    bolum: document.getElementById('bolum').value.trim(),
    okul: document.getElementById('okul').value.trim(),
    mezuniyetYili: document.getElementById('mezuniyetYili').value,
    deneyimYili: document.getElementById('deneyimYili').value,
    sonIsyeri: document.getElementById('sonIsyeri').value.trim(),
    ozelEgitim: document.getElementById('ozelEgitim').value || 'hicbiri',
    yabanciDil: document.getElementById('yabanciDil').value || 'hicbiri',
    sertifikalar: document.getElementById('sertifikalar').value.trim(),
    
    baslamaTarihi: document.getElementById('baslamaTarihi').value,
    ucretBeklenti: document.getElementById('ucretBeklenti').value || '',
    mevcutIsDurumu: document.getElementById('mevcutIsDurumu').value,
    duyumKaynagi: document.getElementById('duyumKaynagi').value || '',
    nedenBCK: document.getElementById('nedenBCK').value.trim()
  };
  
  // VALIDASYON
  let hataVar = false;
  
  // Zorunlu alanlar
  const zorunluAlanlar = {
    'ad': 'Adınızı giriniz',
    'soyad': 'Soyadınızı giriniz',
    'telefon': 'Telefon numaranızı giriniz',
    'dogumTarihi': 'Doğum tarihinizi giriniz',
    'cinsiyet': 'Cinsiyet seçiniz',
    'adres': 'Adresinizi giriniz',
    'egitimDurumu': 'Eğitim durumunuzu seçiniz',
    'bolum': 'Mezun olduğunuz bölümü giriniz',
    'okul': 'Mezun olduğunuz okulu giriniz',
    'mezuniyetYili': 'Mezuniyet yılınızı giriniz',
    'deneyimYili': 'Deneyim yılınızı seçiniz',
    'baslamaTarihi': 'Başlama tarihini seçiniz',
    'mevcutIsDurumu': 'Mevcut iş durumunuzu seçiniz',
    'nedenBCK': 'Bu alanı doldurmanız gerekmektedir'
  };
  
  for (const [alan, mesaj] of Object.entries(zorunluAlanlar)) {
    if (!veri[alan]) {
      hataGoster(alan, mesaj);
      hataVar = true;
    }
  }
  
  // Telefon validasyonu
  if (veri.telefon && !telefonGecerli(veri.telefon)) {
    hataGoster('telefon', 'Geçerli bir cep telefonu numarası giriniz (5XX...)');
    hataVar = true;
  }
  
  // Yaş validasyonu (18+)
  if (veri.dogumTarihi) {
    const dogum = new Date(veri.dogumTarihi);
    const bugun = new Date();
    let yas = bugun.getFullYear() - dogum.getFullYear();
    const ayFark = bugun.getMonth() - dogum.getMonth();
    if (ayFark < 0 || (ayFark === 0 && bugun.getDate() < dogum.getDate())) yas--;
    
    if (yas < 18) {
      hataGoster('dogumTarihi', 'En az 18 yaşında olmalısınız');
      hataVar = true;
    }
    if (yas > 75) {
      hataGoster('dogumTarihi', 'Lütfen geçerli bir doğum tarihi giriniz');
      hataVar = true;
    }
  }
  
  // Mezuniyet yılı validasyonu
  if (veri.mezuniyetYili) {
    const yil = parseInt(veri.mezuniyetYili);
    const buYil = new Date().getFullYear();
    if (yil < 1980 || yil > buYil + 4) {
      hataGoster('mezuniyetYili', 'Geçerli bir mezuniyet yılı giriniz');
      hataVar = true;
    }
  }
  
  // Neden BCK uzunluk
  if (veri.nedenBCK && veri.nedenBCK.length < 50) {
    hataGoster('nedenBCK', 'Lütfen en az 50 karakter yazınız');
    hataVar = true;
  }
  
  // Başlama tarihi validasyonu (geçmiş tarih olmasın)
  if (veri.baslamaTarihi) {
    const baslama = new Date(veri.baslamaTarihi);
    const bugun = new Date();
    bugun.setHours(0, 0, 0, 0);
    if (baslama < bugun) {
      hataGoster('baslamaTarihi', 'Başlama tarihi bugünden ileri olmalıdır');
      hataVar = true;
    }
  }
  
  if (hataVar) {
    // İlk hatalı alana scroll
    const ilkHata = document.querySelector('.form-grup.hata');
    if (ilkHata) {
      ilkHata.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  
  // KAYDET
  const buton = document.getElementById('btnDevamEt');
  butonYukle(buton, 'Kaydediliyor...');
  
  try {
    const ref = doc(db, 'isBasvurulari', mevcutKullanici.email);
    
    await setDoc(ref, {
      ...veri,
      adayEposta: mevcutKullanici.email,
      adayAdi: `${veri.ad} ${veri.soyad}`,
      googleAdi: mevcutKullanici.displayName,
      googleFoto: mevcutKullanici.photoURL,
      pozisyon: 'Okul Öncesi Öğretmeni',
      durum: 'testEksik',
      bilgilerTamamlanmaZamani: serverTimestamp(),
      sonGuncellemeZamani: serverTimestamp()
    }, { merge: true });
    
    // Test sayfasına yönlendir
    window.location.href = 'test.html';
    
  } catch (hata) {
    console.error('Kaydetme hatası:', hata);
    butonNormal(buton);
    alert('Bilgiler kaydedilemedi. Lütfen tekrar deneyin.\n\nHata: ' + hata.message);
  }
};

// ───────────────────────────────────────────────
// Çıkış yap
// ───────────────────────────────────────────────
window.cikisYap = async function() {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (hata) {
    console.error('Çıkış hatası:', hata);
  }
};
