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
        googleAdi: kullanici.displayName,
        googleFoto: kullanici.photoURL,
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
        ilgiliKategoriler: tercihler,
        mailAlmakIstiyor: true,
        optOutToken: optOutToken,
        olusturmaZamani: serverTimestamp(),
        guncellemeZamani: serverTimestamp()
      });
      
      // Hoş geldin maili gönder (asenkron)
      mailGonder(eposta, ad, 'hosgeldin', { 
        pozisyonAdi: pozisyon?.baslik 
      }).catch(e => console.error('Mail hatası:', e));
      
    } else {
      // Mevcut başvuru var - güncelle
      const mevcut = basvuruSnap.data();
      const guncellemeler = {
        sonGirisZamani: serverTimestamp(),
        googleFoto: kullanici.photoURL
      };
      
      // Pozisyon değiştiyse güncelle (eski başvuruyu siler değil, sadece günceller)
      if (pozisyon && pozisyon.id !== mevcut.pozisyonId) {
        guncellemeler.eskiBasvuruVarUyari = true;
        guncellemeler.eskiPozisyonBaslik = mevcut.pozisyonBaslik;
        guncellemeler.eskiPozisyonId = mevcut.pozisyonId;
        guncellemeler.pozisyonId = pozisyon.id;
        guncellemeler.pozisyonBaslik = pozisyon.baslik;
        guncellemeler.kategoriId = pozisyon.kategoriId || null;
        guncellemeler.tekrarBasvuruZamani = serverTimestamp();
      }
      
      await setDoc(basvuruRef, guncellemeler, { merge: true });
    }
    
    // SessionStorage temizle
    sessionStorage.removeItem('basvuruPozisyon');
    sessionStorage.removeItem('basvuruMailTercihleri');
    
    // Bilgiler sayfasına yönlendir
    const veri = (await getDoc(basvuruRef)).data();
    
    if (veri.durum === 'bilgilerEksik') {
      window.location.href = 'bilgiler.html';
    } else if (veri.durum === 'testEksik') {
      window.location.href = 'tamamlandi.html'; // Faz 2'de test.html olacak
    } else {
      window.location.href = 'tamamlandi.html';
    }
    
  } catch (hata) {
    console.error('Giriş işleme hatası:', hata);
    girisIsleniyor = false;
    alert('Bir hata oluştu, lütfen sayfayı yenileyin.\n\n' + hata.message);
  }
}
