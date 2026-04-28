// ═══════════════════════════════════════════════════════════
// BAŞVURU SAYFASI MANTIĞI
// Pozisyon seçimi + mail tercih + Google login
// ═══════════════════════════════════════════════════════════

import { 
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from './firebase-config.js';

import { 
  POZISYON_KATEGORILERI,
  pozisyonKategorisiBul,
  urlParametreAl,
  mailGonder,
  tokenUret
} from './yardimci.js';

let aktifPozisyonlar = [];
let secilenPozisyon = null;
let girisIsleniyor = false;

// ───────────────────────────────────────────────
// Sayfa yüklendiğinde
// ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Önce redirect sonucunu kontrol et (iOS Safari)
  try {
    const sonuc = await getRedirectResult(auth);
    if (sonuc && sonuc.user) {
      await girisYapildi(sonuc.user);
      return;
    }
  } catch (hata) {
    console.error('Redirect sonuç hatası:', hata);
  }
  
  // Mail tercih checkboxlarını oluştur
  mailTercihListesiniOlustur();
  
  // Pozisyonları yükle
  await pozisyonlariYukle();
  
  // Yükleniyor gizle
  document.getElementById('yukleniyor').classList.add('gizli');
  document.getElementById('anaIcerik').classList.remove('gizli');
});

// ───────────────────────────────────────────────
// Auth state değişikliği
// ───────────────────────────────────────────────
onAuthStateChanged(auth, async (kullanici) => {
  if (kullanici && !girisIsleniyor) {
    await girisYapildi(kullanici);
  }
});

// ───────────────────────────────────────────────
// Aktif pozisyonları yükle
// ───────────────────────────────────────────────
async function pozisyonlariYukle() {
  try {
    const pozisyonRef = collection(db, 'pozisyonlar');
    const q = query(pozisyonRef, where('aktif', '==', true));
    const snapshot = await getDocs(q);
    
    aktifPozisyonlar = [];
    snapshot.forEach(doc => {
      aktifPozisyonlar.push({ id: doc.id, ...doc.data() });
    });
    
    // Select'i doldur
    pozisyonSelectDoldur();
    
    // URL'den pozisyon parametresi varsa otomatik seç
    const urlPozisyon = urlParametreAl('pozisyon');
    const havuzMu = urlParametreAl('havuz') === 'true';
    
    if (urlPozisyon) {
      document.getElementById('pozisyonSecim').value = urlPozisyon;
      pozisyonSecildi();
    } else if (havuzMu) {
      // Havuz başvurusu - özel seçenek
      document.getElementById('pozisyonSecim').value = '__havuz__';
      pozisyonSecildi();
    }
    
  } catch (hata) {
    console.error('Pozisyon yükleme hatası:', hata);
  }
}

// ───────────────────────────────────────────────
// Select kutusunu doldur
// ───────────────────────────────────────────────
function pozisyonSelectDoldur() {
  const select = document.getElementById('pozisyonSecim');
  
  let html = '<option value="">Pozisyon seçiniz...</option>';
  
  // Aktif pozisyonlar
  if (aktifPozisyonlar.length > 0) {
    html += '<optgroup label="✨ Aktif İlanlar">';
    aktifPozisyonlar.forEach(p => {
      const kategori = pozisyonKategorisiBul(p.kategoriId);
      html += `<option value="${p.id}">${kategori.ikon} ${p.baslik || kategori.ad}</option>`;
    });
    html += '</optgroup>';
  }
  
  // Havuz başvurusu seçeneği
  html += `
    <optgroup label="🌊 Aday Havuzu">
      <option value="__havuz__">Havuza katıl (aktif ilan beklemiyorum)</option>
    </optgroup>
  `;
  
  select.innerHTML = html;
  select.addEventListener('change', pozisyonSecildi);
}

// ───────────────────────────────────────────────
// Pozisyon seçildi
// ───────────────────────────────────────────────
function pozisyonSecildi() {
  const select = document.getElementById('pozisyonSecim');
  const aciklamaEl = document.getElementById('pozisyonAciklama');
  const havuzBildirim = document.getElementById('havuzBildirim');
  const buton = document.getElementById('btnGoogleGiris');
  
  const deger = select.value;
  
  if (!deger) {
    secilenPozisyon = null;
    aciklamaEl.textContent = '';
    havuzBildirim.classList.add('gizli');
    buton.disabled = true;
    buton.querySelector('span').textContent = 'Önce pozisyon seçin';
    return;
  }
  
  if (deger === '__havuz__') {
    secilenPozisyon = { id: '__havuz__', baslik: 'Aday Havuzu', havuzBasvurusu: true };
    aciklamaEl.textContent = '';
    havuzBildirim.classList.remove('gizli');
  } else {
    secilenPozisyon = aktifPozisyonlar.find(p => p.id === deger);
    aciklamaEl.textContent = secilenPozisyon.kisaAciklama || '';
    havuzBildirim.classList.add('gizli');
    
    // Otomatik olarak ilgili kategoriyi mail tercihinde işaretle
    const kategoriCheckbox = document.querySelector(`input[data-kategori-id="${secilenPozisyon.kategoriId}"]`);
    if (kategoriCheckbox) kategoriCheckbox.checked = true;
  }
  
  buton.disabled = false;
  buton.querySelector('span').textContent = 'Google ile Giriş Yap ve Başvuruya Başla';
}

// ───────────────────────────────────────────────
// Mail tercih checkboxlarını oluştur
// ───────────────────────────────────────────────
function mailTercihListesiniOlustur() {
  const liste = document.getElementById('mailTercihListesi');
  
  liste.innerHTML = POZISYON_KATEGORILERI.map(kat => `
    <div class="checkbox-grup">
      <input type="checkbox" id="kat_${kat.id}" data-kategori-id="${kat.id}" value="${kat.id}">
      <label for="kat_${kat.id}">
        ${kat.ikon} ${kat.ad}
      </label>
    </div>
  `).join('');
}

// ───────────────────────────────────────────────
// Mail tercihlerini topla
// ───────────────────────────────────────────────
function mailTercihleriniTopla() {
  const checkboxlar = document.querySelectorAll('#mailTercihListesi input[type="checkbox"]:checked');
  return Array.from(checkboxlar).map(cb => cb.value);
}

// ───────────────────────────────────────────────
// Google ile Giriş
// ───────────────────────────────────────────────
window.googleIleGiris = async function() {
  if (!secilenPozisyon) {
    alert('Lütfen önce başvurmak istediğiniz pozisyonu seçin.');
    return;
  }
  
  // Pozisyon ve mail tercihlerini sessionStorage'a kaydet 
  // (login sonrası kullanmak için)
  const tercihler = mailTercihleriniTopla();
  sessionStorage.setItem('basvuruPozisyon', JSON.stringify(secilenPozisyon));
  sessionStorage.setItem('basvuruMailTercihleri', JSON.stringify(tercihler));
  
  const buton = document.getElementById('btnGoogleGiris');
  buton.disabled = true;
  buton.querySelector('span').textContent = 'Giriş yapılıyor...';
  
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (hata) {
    console.warn('Popup başarısız, redirect deneniyor:', hata.code);
    
    if (hata.code === 'auth/popup-blocked' || 
        hata.code === 'auth/popup-closed-by-user' ||
        hata.code === 'auth/cancelled-popup-request') {
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectHata) {
        console.error('Redirect de başarısız:', redirectHata);
        alert('Giriş yapılamadı. Lütfen tekrar deneyin.');
        buton.disabled = false;
        buton.querySelector('span').textContent = 'Google ile Giriş Yap';
      }
    } else {
      console.error('Giriş hatası:', hata);
      alert('Giriş yapılamadı: ' + hata.message);
      buton.disabled = false;
      buton.querySelector('span').textContent = 'Google ile Giriş Yap';
    }
  }
};

// ───────────────────────────────────────────────
// Giriş başarılı
// ───────────────────────────────────────────────
async function girisYapildi(kullanici) {
  if (girisIsleniyor) return;
  girisIsleniyor = true;
  
  try {
    const eposta = kullanici.email;
    const ad = kullanici.displayName || eposta.split('@')[0];
    
    // SessionStorage'dan pozisyon ve tercihleri al
    const pozisyonStr = sessionStorage.getItem('basvuruPozisyon');
    const tercihlerStr = sessionStorage.getItem('basvuruMailTercihleri');
    
    const pozisyon = pozisyonStr ? JSON.parse(pozisyonStr) : null;
    const tercihler = tercihlerStr ? JSON.parse(tercihlerStr) : [];
    
    // Mevcut başvuru var mı?
    const basvuruRef = doc(db, 'isBasvurulari', eposta);
    const basvuruSnap = await getDoc(basvuruRef);
    
    let yeniBasvuru = !basvuruSnap.exists();
    
    if (yeniBasvuru) {
      // Yeni başvuru
      await setDoc(basvuruRef, {
        adayEposta: eposta,
        adayAdi: ad,
        googleAdi: kullanici.displayName || null,
        googleFoto: kullanici.photoURL || null,
        olusturmaZamani: serverTimestamp(),
        sonGirisZamani: serverTimestamp(),
        durum: 'bilgilerEksik',
        pozisyonId: pozisyon?.id || null,
        pozisyonBaslik: pozisyon?.baslik || 'Aday Havuzu',
        kategoriId: pozisyon?.kategoriId || null,
        havuzBasvurusu: pozisyon?.havuzBasvurusu === true
      });
      
      // Mail tercihlerini kaydet (token ile)
      const optOutToken = tokenUret();
      
      await setDoc(doc(db, 'havuzMailTercihleri', eposta), {
        adayEposta: eposta,
        adayAdi: ad,
        ilgiliKategoriler: tercihler || [],
        mailAlmakIstiyor: true,
        optOutToken: optOutToken,
        olusturmaZamani: serverTimestamp(),
        guncellemeZamani: serverTimestamp()
      });
      
      // Hoş geldin maili gönder (asenkron)
      mailGonder(eposta, ad, 'hosgeldin', { 
        pozisyonAdi: pozisyon?.baslik || 'Aday Havuzu'
      }).catch(e => console.error('Mail hatası:', e));
      
    } else {
      // Mevcut başvuru var - güncelle
      const mevcut = basvuruSnap.data();
      const guncellemeler = {
        sonGirisZamani: serverTimestamp(),
        googleFoto: kullanici.photoURL || null
      };
      
      // Pozisyon değiştiyse güncelle (eski başvuruyu siler değil, sadece günceller)
      if (pozisyon && pozisyon.id !== (mevcut.pozisyonId || null)) {
        guncellemeler.eskiBasvuruVarUyari = true;
        // Eski sistemden gelen kayıtlarda bu alanlar olmayabilir, null'a çevir
        guncellemeler.eskiPozisyonBaslik = mevcut.pozisyonBaslik || null;
        guncellemeler.eskiPozisyonId = mevcut.pozisyonId || null;
        guncellemeler.pozisyonId = pozisyon.id || null;
        guncellemeler.pozisyonBaslik = pozisyon.baslik || null;
        guncellemeler.kategoriId = pozisyon.kategoriId || null;
        guncellemeler.havuzBasvurusu = pozisyon.havuzBasvurusu === true;
        guncellemeler.tekrarBasvuruZamani = serverTimestamp();
      }
      
      // Mail tercihlerini de güncelle (yeni tercihler veya yeniden başvuru)
      if (tercihler && tercihler.length > 0) {
        try {
          const tercihRef = doc(db, 'havuzMailTercihleri', eposta);
          const tercihSnap = await getDoc(tercihRef);
          
          if (tercihSnap.exists()) {
            // Mevcut tercihleri yeni seçimle birleştir (tekrar etmesin)
            const eskiTercihler = tercihSnap.data().ilgiliKategoriler || [];
            const birlesik = [...new Set([...eskiTercihler, ...tercihler])];
            await setDoc(tercihRef, {
              ilgiliKategoriler: birlesik,
              guncellemeZamani: serverTimestamp(),
              mailAlmakIstiyor: true
            }, { merge: true });
          } else {
            // Yeni tercih kaydı oluştur
            await setDoc(tercihRef, {
              adayEposta: eposta,
              adayAdi: ad,
              ilgiliKategoriler: tercihler,
              mailAlmakIstiyor: true,
              optOutToken: tokenUret(),
              olusturmaZamani: serverTimestamp(),
              guncellemeZamani: serverTimestamp()
            });
          }
        } catch (e) {
          console.warn('Mail tercihleri güncellenemedi:', e);
        }
      }
      
      await setDoc(basvuruRef, guncellemeler, { merge: true });
    }
    
    // SessionStorage temizle
    sessionStorage.removeItem('basvuruPozisyon');
    sessionStorage.removeItem('basvuruMailTercihleri');
    
    // Güncel veriyi al
    const veri = (await getDoc(basvuruRef)).data();
    
    // YENİ BAŞVURU → Direkt bilgiler sayfasına git (popup yok)
    if (yeniBasvuru) {
      window.location.href = 'bilgiler.html';
      return;
    }
    
    // MEVCUT BAŞVURU → Durum popup'ı göster
    durumPopupGoster(veri, ad);
    
  } catch (hata) {
    console.error('Giriş işleme hatası:', hata);
    girisIsleniyor = false;
    alert('Bir hata oluştu, lütfen sayfayı yenileyin.\n\n' + hata.message);
  }
}

// ───────────────────────────────────────────────
// DURUM POPUP'I - Mevcut başvuru için güzel bilgilendirme
// ───────────────────────────────────────────────
function durumPopupGoster(veri, adayAdi) {
  const durumlar = {
    'bilgilerEksik': {
      ikon: '🌱',
      renk: '#f57c00',
      bgRenk: '#fff8e1',
      baslik: 'Hoş Geldiniz, ' + (adayAdi.split(' ')[0]) + '!',
      mesaj: 'Başvurunuza kaldığımız yerden devam edelim. Kişisel bilgilerinizi tamamlamanız gerekiyor.',
      butonMetin: '✏️ Bilgileri Tamamla',
      butonHedef: 'bilgiler.html',
      ekstraMesaj: 'Yaklaşık 3-5 dakika sürer.'
    },
    'testEksik': {
      ikon: '🌿',
      renk: '#1976d2',
      bgRenk: '#e3f2fd',
      baslik: 'Sırada Değerlendirme Var',
      mesaj: 'Kişisel bilgilerinizi başarıyla aldık. Şimdi sizi tanımak istiyoruz — 20-25 dakikalık değerlendirme sürecimize davetlisiniz.',
      butonMetin: '🌟 Değerlendirmeye Başla',
      butonHedef: 'tamamlandi.html', // Faz 2'de test.html olacak
      ekstraMesaj: 'Yaklaşık 20-25 dakika sürer. Yarıda bırakırsanız devam edebilirsiniz.'
    },
    'tamamlandi': {
      ikon: '🌸',
      renk: '#2c5530',
      bgRenk: '#e8f5e9',
      baslik: 'Başvurunuz Bizde!',
      mesaj: 'Başvurunuz değerlendirme aşamasında. Ekibimiz başvurunuzu özenle inceliyor. <strong>5-7 iş günü içinde</strong> size dönüş yapacağız.',
      butonMetin: '🏠 Ana Sayfaya Dön',
      butonHedef: 'index.html',
      ekstraMesaj: 'Sabırsızlığınızı anlıyoruz, ama her başvuruyu hak ettiği önemle değerlendiriyoruz. 💚'
    },
    'mulakat': {
      ikon: '🌟',
      renk: '#1976d2',
      bgRenk: '#e3f2fd',
      baslik: 'Tebrikler! Mülakat Aşamasındasınız',
      mesaj: 'Başvurunuz çok beğenildi! Sizi daha yakından tanımak istiyoruz. <strong>Çok yakında</strong> sizinle iletişime geçeceğiz.',
      butonMetin: '🏠 Ana Sayfaya Dön',
      butonHedef: 'index.html',
      ekstraMesaj: 'WhatsApp veya telefon yoluyla aranacaksınız. Lütfen bildirimlerinizi açık tutun.'
    },
    'kabul': {
      ikon: '🎉',
      renk: '#2c5530',
      bgRenk: '#d4f5d4',
      baslik: 'TEBRİKLER! 🌸',
      mesaj: '<strong>Başvurunuz kabul edildi!</strong> Bir Çiçek Koleji ailesine adım attınız. Yüz yüze görüşmeye davet edileceksiniz — yakında sizinle iletişime geçilecek.',
      butonMetin: '🏠 Ana Sayfaya Dön',
      butonHedef: 'index.html',
      ekstraMesaj: 'Hoş geldiniz! Birlikte çocukların hayatına dokunacağız. 💚'
    },
    'red': {
      ikon: '🌾',
      renk: '#6b4f3a',
      bgRenk: '#f5e6d3',
      baslik: 'Sevgili ' + (adayAdi.split(' ')[0]),
      mesaj: 'Başvurunuz şu an için uygun bulunmadı, ancak <strong>aday havuzumuzdasınız</strong>. İlerleyen pozisyonlarda yeniden değerlendirilebilirsiniz.',
      butonMetin: '🌊 Havuz Tercihlerimi Gör',
      butonHedef: 'index.html',
      ekstraMesaj: 'Her başvuruyu kıymetli buluyoruz. Sizi unutmuyoruz. 🌸'
    },
    'havuz': {
      ikon: '🌊',
      renk: '#1976d2',
      bgRenk: '#e3f2fd',
      baslik: 'Aday Havuzumuzdasınız',
      mesaj: 'Başvurunuz başarıyla aday havuzumuza alındı. <strong>Bir sonraki işe alım ilanında size haber vereceğiz.</strong>',
      butonMetin: '🏠 Ana Sayfaya Dön',
      butonHedef: 'index.html',
      ekstraMesaj: 'Mail bildirimlerinden çıkmak isterseniz alttaki "Mail Tercihleri" sayfasını kullanabilirsiniz.'
    }
  };
  
  const durum = veri.durum || 'bilgilerEksik';
  const config = durumlar[durum] || durumlar['bilgilerEksik'];
  
  // Pozisyon bilgisi
  const pozisyonBilgi = veri.pozisyonBaslik 
    ? `<div style="font-size: 14px; color: #666; margin-top: 12px; padding: 12px; background: rgba(0,0,0,0.04); border-radius: 8px;">
         <strong>📋 Başvurduğunuz Pozisyon:</strong><br>${veri.pozisyonBaslik}
       </div>`
    : '';
  
  // Modal HTML
  const modal = document.createElement('div');
  modal.id = 'durumPopup';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6); z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    padding: 20px; backdrop-filter: blur(8px);
    animation: fadeIn 0.3s ease;
  `;
  
  modal.innerHTML = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.85); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes ciceklenme {
        0% { transform: scale(0) rotate(-180deg); opacity: 0; }
        50% { transform: scale(1.15) rotate(10deg); opacity: 1; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes parla {
        0%, 100% { box-shadow: 0 0 0 0 rgba(44,85,48,0.4); }
        50% { box-shadow: 0 0 30px 12px rgba(44,85,48,0.15); }
      }
      .durum-popup-cicek {
        animation: ciceklenme 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards,
                   parla 2.5s ease-in-out 0.8s infinite;
      }
    </style>
    
    <div style="
      background: white; max-width: 500px; width: 100%;
      border-radius: 24px; padding: 0; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    ">
      
      <!-- ÜST RENKLİ BÖLGE -->
      <div style="
        background: ${config.bgRenk};
        padding: 40px 30px 30px;
        text-align: center;
        position: relative;
      ">
        <!-- Çiçek ikonu (animasyonlu) -->
        <div class="durum-popup-cicek" style="
          width: 110px; height: 110px;
          background: white;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex; align-items: center; justify-content: center;
          font-size: 60px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          border: 4px solid ${config.renk};
        ">
          ${config.ikon}
        </div>
        
        <h2 style="
          color: ${config.renk};
          font-size: 24px; font-weight: 700;
          margin: 0 0 8px; line-height: 1.3;
        ">
          ${config.baslik}
        </h2>
      </div>
      
      <!-- ALT İÇERİK BÖLGESİ -->
      <div style="padding: 24px 30px 30px;">
        <p style="
          color: #2d2d2d; font-size: 16px;
          line-height: 1.7; margin: 0 0 16px;
        ">
          ${config.mesaj}
        </p>
        
        ${pozisyonBilgi}
        
        <div style="
          font-size: 13px; color: #666;
          font-style: italic; text-align: center;
          margin: 16px 0 24px;
        ">
          ${config.ekstraMesaj}
        </div>
        
        <button onclick="durumPopupKapat('${config.butonHedef}')" style="
          width: 100%;
          background: ${config.renk};
          color: white;
          border: none;
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s;
          font-family: inherit;
        " onmouseover="this.style.transform='translateY(-2px)'"
           onmouseout="this.style.transform='translateY(0)'">
          ${config.butonMetin}
        </button>
        
        <button onclick="durumPopupCikis()" style="
          width: 100%;
          background: transparent;
          color: #999;
          border: none;
          padding: 12px;
          font-size: 13px;
          cursor: pointer;
          margin-top: 8px;
          font-family: inherit;
        ">
          🚪 Çıkış yap
        </button>
      </div>
      
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Popup butonları
window.durumPopupKapat = function(hedef) {
  document.getElementById('durumPopup')?.remove();
  if (hedef && hedef !== 'index.html') {
    window.location.href = hedef;
  } else {
    // Ana sayfaya dön ama önce çıkış yap (temizlik)
    window.location.href = 'index.html';
  }
};

window.durumPopupCikis = async function() {
  try {
    await signOut(auth);
    document.getElementById('durumPopup')?.remove();
    window.location.href = 'index.html';
  } catch (e) {
    console.error('Çıkış hatası:', e);
  }
};
