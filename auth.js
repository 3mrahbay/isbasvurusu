// ═══════════════════════════════════════════════════════════
// GOOGLE AUTHENTICATION
// Pop-up + Redirect fallback (iOS Safari için)
// ═══════════════════════════════════════════════════════════

import { 
  auth, 
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  db,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from './firebase-config.js';

import { mailGonder } from './yardimci.js';

let girisIsleniyor = false;

// ───────────────────────────────────────────────
// Sayfa yüklendiğinde redirect sonucunu yakala
// ───────────────────────────────────────────────
window.addEventListener('load', async () => {
  try {
    const sonuc = await getRedirectResult(auth);
    if (sonuc && sonuc.user) {
      await girisYapildi(sonuc.user);
    }
  } catch (hata) {
    console.error('Redirect sonuç hatası:', hata);
  }
});

// ───────────────────────────────────────────────
// Auth state değişimi - sayfa yönlendirme
// ───────────────────────────────────────────────
onAuthStateChanged(auth, async (kullanici) => {
  const yukleniyorEl = document.getElementById('yukleniyor');
  const girisAlani = document.getElementById('girisAlani');
  
  if (kullanici) {
    // Giriş yapıldı - başvuru durumunu kontrol et
    await girisYapildi(kullanici);
  } else {
    // Giriş yapılmadı - giriş ekranını göster
    if (yukleniyorEl) yukleniyorEl.classList.add('gizli');
    if (girisAlani) girisAlani.classList.remove('gizli');
  }
});

// ───────────────────────────────────────────────
// Giriş başarılı olunca yönlendirme
// ───────────────────────────────────────────────
async function girisYapildi(kullanici) {
  if (girisIsleniyor) return;
  girisIsleniyor = true;
  
  try {
    const eposta = kullanici.email;
    const ad = kullanici.displayName || eposta.split('@')[0];
    
    // Başvuru kaydı var mı?
    const basvuruRef = doc(db, 'isBasvurulari', eposta);
    const basvuruSnap = await getDoc(basvuruRef);
    
    if (!basvuruSnap.exists()) {
      // İlk giriş - yeni başvuru kaydı oluştur
      await setDoc(basvuruRef, {
        adayEposta: eposta,
        adayAdi: ad,
        googleAdi: kullanici.displayName,
        googleFoto: kullanici.photoURL,
        olusturmaZamani: serverTimestamp(),
        sonGirisZamani: serverTimestamp(),
        durum: 'bilgilerEksik', // bilgilerEksik | testEksik | tamamlandi
        pozisyon: 'Okul Öncesi Öğretmeni' // Faz 1: sadece bu pozisyon
      });
      
      // Hoş geldin maili gönder (asenkron, beklemiyoruz)
      mailGonder(eposta, ad, 'hosgeldin').catch(e => console.error('Mail hatası:', e));
      
      // Kişisel bilgiler sayfasına yönlendir
      window.location.href = 'bilgiler.html';
      return;
    }
    
    // Mevcut başvuru var - durumuna göre yönlendir
    await setDoc(basvuruRef, { sonGirisZamani: serverTimestamp() }, { merge: true });
    
    const veri = basvuruSnap.data();
    
    if (veri.durum === 'bilgilerEksik') {
      window.location.href = 'bilgiler.html';
    } else if (veri.durum === 'testEksik') {
      // Faz 2'de test sayfasına yönlendirilecek
      // Şimdilik tamamlandi sayfasına gidiyoruz
      window.location.href = 'tamamlandi.html';
    } else if (veri.durum === 'tamamlandi') {
      window.location.href = 'tamamlandi.html';
    }
    
  } catch (hata) {
    console.error('Giriş işleme hatası:', hata);
    girisIsleniyor = false;
    alert('Bir hata oluştu, lütfen sayfayı yenileyin.');
  }
}

// ───────────────────────────────────────────────
// Google ile Giriş Yap butonu
// ───────────────────────────────────────────────
window.googleIleGiris = async function() {
  const buton = document.getElementById('btnGoogleGiris');
  if (buton) {
    buton.disabled = true;
    buton.textContent = 'Giriş yapılıyor...';
  }
  
  try {
    // Önce popup dene
    await signInWithPopup(auth, googleProvider);
  } catch (hata) {
    console.warn('Popup başarısız, redirect deneniyor:', hata.code);
    
    // Popup başarısız olursa redirect kullan (iOS Safari, popup engelli)
    if (hata.code === 'auth/popup-blocked' || 
        hata.code === 'auth/popup-closed-by-user' ||
        hata.code === 'auth/cancelled-popup-request') {
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectHata) {
        console.error('Redirect de başarısız:', redirectHata);
        alert('Giriş yapılamadı. Lütfen tekrar deneyin veya farklı bir tarayıcı kullanın.');
        if (buton) {
          buton.disabled = false;
          buton.textContent = 'Google ile Giriş Yap';
        }
      }
    } else {
      console.error('Giriş hatası:', hata);
      alert('Giriş yapılamadı: ' + hata.message);
      if (buton) {
        buton.disabled = false;
        buton.textContent = 'Google ile Giriş Yap';
      }
    }
  }
};

// ───────────────────────────────────────────────
// Çıkış Yap
// ───────────────────────────────────────────────
window.cikisYap = async function() {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (hata) {
    console.error('Çıkış hatası:', hata);
  }
};
