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
  signOut,
  storage,
  storageRef,
  uploadBytesResumable,
  getDownloadURL
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
let yuklenenCV = null;  // { url, dosyaAdi, boyut, tip }

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
  
  // E-posta alanını Google hesabından otomatik doldur
  const epostaInput = document.getElementById('eposta');
  if (epostaInput && !epostaInput.value) {
    epostaInput.value = kullanici.email || '';
  }
  
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
        'soyad', 'telefon', 'eposta', 'dogumTarihi', 'cinsiyet', 'adres',
        'medeniDurum', 'cocukSayisi', 'egitimDurumu', 'bolum', 
        'okul', 'mezuniyetYili', 'deneyimYili',
        'deneyim1Kurum', 'deneyim1Pozisyon', 'deneyim1Sure',
        'deneyim2Kurum', 'deneyim2Pozisyon', 'deneyim2Sure',
        'deneyim3Kurum', 'deneyim3Pozisyon', 'deneyim3Sure',
        'ozelEgitim', 'yabanciDil', 'sertifikalar', 'baslamaTarihi',
        'ucretBeklenti', 'mevcutIsDurumu', 'duyumKaynagi', 'nedenBCK'
      ];
      
      alanlar.forEach(alan => {
        if (mevcutVeri[alan] !== undefined && mevcutVeri[alan] !== null) {
          const el = document.getElementById(alan);
          if (el) el.value = mevcutVeri[alan];
        }
      });
      
      // E-posta hala boşsa Google'dan al
      const epostaEl = document.getElementById('eposta');
      if (epostaEl && !epostaEl.value) epostaEl.value = mevcutKullanici.email || '';
      
      // CV daha önce yüklenmişse göster
      if (mevcutVeri.cvUrl) {
        yuklenenCV = {
          url: mevcutVeri.cvUrl,
          dosyaAdi: mevcutVeri.cvDosyaAdi || 'CV',
          boyut: mevcutVeri.cvBoyut || 0,
          tip: mevcutVeri.cvTip || ''
        };
        cvGosterDolu(yuklenenCV.dosyaAdi, yuklenenCV.boyut);
      }
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

// ───────────────────────────────────────────────
// CV YÜKLEME (Firebase Storage)
// ───────────────────────────────────────────────
const KABUL_TIPLER = ['application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg', 'image/png', 'image/jpg'];
const KABUL_UZANTI = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
const MAX_CV = 5 * 1024 * 1024; // 5 MB

// Dosya seçildiğinde
document.getElementById('cvDosya').addEventListener('change', (e) => {
  if (e.target.files.length > 0) cvYukle(e.target.files[0]);
});

// Sürükle-bırak
const cvAlani = document.getElementById('cvAlani');
if (cvAlani) {
  cvAlani.addEventListener('dragover', (e) => {
    e.preventDefault();
    cvAlani.classList.add('surukleniyor');
  });
  cvAlani.addEventListener('dragleave', () => cvAlani.classList.remove('surukleniyor'));
  cvAlani.addEventListener('drop', (e) => {
    e.preventDefault();
    cvAlani.classList.remove('surukleniyor');
    if (e.dataTransfer.files.length > 0) cvYukle(e.dataTransfer.files[0]);
  });
}

async function cvYukle(dosya) {
  // Doğrulama
  const uzanti = '.' + dosya.name.split('.').pop().toLowerCase();
  if (!KABUL_TIPLER.includes(dosya.type) && !KABUL_UZANTI.includes(uzanti)) {
    alert('Bu dosya tipi kabul edilmiyor.\n\nKabul edilen: PDF, Word, JPG, PNG');
    return;
  }
  if (dosya.size > MAX_CV) {
    alert(`Dosya çok büyük! En fazla 5 MB olabilir.\nSizin dosyanız: ${(dosya.size/1024/1024).toFixed(1)} MB`);
    return;
  }
  
  const bar = document.getElementById('cvYuklemeBar');
  const dolgu = document.getElementById('cvYuklemeDolgu');
  const durum = document.getElementById('cvYuklemeDurum');
  
  bar.classList.remove('gizli');
  durum.textContent = 'Yükleniyor...';
  durum.style.color = 'var(--gri, #666)';
  
  try {
    // Storage yolu: cv/{email_temiz}/{timestamp}.{uzanti}
    const emailTemiz = (mevcutKullanici.email || 'aday').replace(/[^a-zA-Z0-9]/g, '_');
    const zaman = Date.now();
    const yol = `cv/${emailTemiz}/${zaman}${uzanti}`;
    const ref = storageRef(storage, yol);
    
    const gorev = uploadBytesResumable(ref, dosya, { contentType: dosya.type });
    
    gorev.on('state_changed',
      (snapshot) => {
        const yuzde = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        dolgu.style.width = yuzde + '%';
        durum.textContent = `Yükleniyor... %${yuzde}`;
      },
      (hata) => {
        console.error('CV yükleme hatası:', hata);
        durum.textContent = '❌ Yükleme başarısız: ' + (hata.code || hata.message);
        durum.style.color = 'var(--hata, #d32f2f)';
        bar.classList.add('gizli');
      },
      async () => {
        const url = await getDownloadURL(gorev.snapshot.ref);
        yuklenenCV = { url, dosyaAdi: dosya.name, boyut: dosya.size, tip: dosya.type };
        dolgu.style.width = '100%';
        durum.textContent = '✅ CV başarıyla yüklendi';
        durum.style.color = 'var(--basari, #2e7d32)';
        cvGosterDolu(dosya.name, dosya.size);
        setTimeout(() => bar.classList.add('gizli'), 1500);
      }
    );
  } catch (hata) {
    console.error('CV yükleme hatası:', hata);
    durum.textContent = '❌ Hata: ' + hata.message;
    durum.style.color = 'var(--hata, #d32f2f)';
    bar.classList.add('gizli');
  }
}

function cvGosterDolu(ad, boyut) {
  document.getElementById('cvBos').classList.add('gizli');
  document.getElementById('cvDolu').classList.remove('gizli');
  document.getElementById('cvDosyaAd').textContent = ad;
  document.getElementById('cvDosyaBoyut').textContent = boyut 
    ? (boyut/1024/1024).toFixed(2) + ' MB' : '';
}

window.cvKaldir = function() {
  yuklenenCV = null;
  document.getElementById('cvDosya').value = '';
  document.getElementById('cvBos').classList.remove('gizli');
  document.getElementById('cvDolu').classList.add('gizli');
  document.getElementById('cvYuklemeBar').classList.add('gizli');
  document.getElementById('cvYuklemeDurum').textContent = '';
};

// Hata temizleme - input değiştiğinde
['ad', 'soyad', 'eposta', 'dogumTarihi', 'cinsiyet', 'adres', 'egitimDurumu', 
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
    eposta: document.getElementById('eposta').value.trim(),
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
    
    // Son 3 deneyim (yapılandırılmış)
    deneyim1Kurum: document.getElementById('deneyim1Kurum').value.trim(),
    deneyim1Pozisyon: document.getElementById('deneyim1Pozisyon').value.trim(),
    deneyim1Sure: document.getElementById('deneyim1Sure').value.trim(),
    deneyim2Kurum: document.getElementById('deneyim2Kurum').value.trim(),
    deneyim2Pozisyon: document.getElementById('deneyim2Pozisyon').value.trim(),
    deneyim2Sure: document.getElementById('deneyim2Sure').value.trim(),
    deneyim3Kurum: document.getElementById('deneyim3Kurum').value.trim(),
    deneyim3Pozisyon: document.getElementById('deneyim3Pozisyon').value.trim(),
    deneyim3Sure: document.getElementById('deneyim3Sure').value.trim(),
    
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
    'eposta': 'E-posta adresinizi giriniz',
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
  
  // E-posta format kontrolü
  if (veri.eposta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(veri.eposta)) {
    hataGoster('eposta', 'Geçerli bir e-posta adresi giriniz');
    hataVar = true;
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
      // CV bilgileri
      cvUrl: yuklenenCV ? yuklenenCV.url : (mevcutVeri?.cvUrl || null),
      cvDosyaAdi: yuklenenCV ? yuklenenCV.dosyaAdi : (mevcutVeri?.cvDosyaAdi || null),
      cvBoyut: yuklenenCV ? yuklenenCV.boyut : (mevcutVeri?.cvBoyut || null),
      cvTip: yuklenenCV ? yuklenenCV.tip : (mevcutVeri?.cvTip || null),
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
