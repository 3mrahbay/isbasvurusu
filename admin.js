// ═══════════════════════════════════════════════════════════
// ADMIN PANEL - GENEL BAKIŞ
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
  orderBy,
  ADMIN_EPOSTA
} from './firebase-config.js';

import { tarihSaatFormatla, pozisyonKategorisiBul } from './yardimci.js';

// ───────────────────────────────────────────────
// Auth kontrol
// ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Önce redirect sonucunu kontrol et
  try {
    await getRedirectResult(auth);
  } catch (hata) {
    console.error('Redirect hatası:', hata);
  }
});

onAuthStateChanged(auth, async (kullanici) => {
  const yukleniyor = document.getElementById('yukleniyor');
  const yetkisiz = document.getElementById('yetkisiz');
  const adminLayout = document.getElementById('adminLayout');
  
  if (!kullanici) {
    // Giriş yapılmadı - Google login dene
    yukleniyor.classList.add('gizli');
    yetkisiz.innerHTML = `
      <h2>🔐 Admin Girişi</h2>
      <p>Bu sayfaya erişmek için Google hesabınızla giriş yapmanız gerekir.</p>
      <button class="btn btn-google" onclick="adminGirisi()" style="display: inline-flex;">
        <img src="https://www.google.com/favicon.ico" alt="Google">
        <span>Google ile Giriş Yap</span>
      </button>
    `;
    yetkisiz.classList.remove('gizli');
    return;
  }
  
  if (kullanici.email !== ADMIN_EPOSTA) {
    // Yetkili değil
    yukleniyor.classList.add('gizli');
    yetkisiz.classList.remove('gizli');
    return;
  }
  
  // Admin onaylandı
  yukleniyor.classList.add('gizli');
  adminLayout.classList.remove('gizli');
  
  document.getElementById('kullaniciInfo').textContent = `${kullanici.email}`;
  
  await istatistikleriYukle();
  await sonBasvurulariYukle();
});

// ───────────────────────────────────────────────
// Admin girişi (yetkisiz sayfasından)
// ───────────────────────────────────────────────
window.adminGirisi = async function() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (hata) {
    if (hata.code === 'auth/popup-blocked' || hata.code === 'auth/popup-closed-by-user') {
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (e) {
        alert('Giriş yapılamadı: ' + e.message);
      }
    } else {
      alert('Giriş hatası: ' + hata.message);
    }
  }
};

// ───────────────────────────────────────────────
// İstatistikleri yükle
// ───────────────────────────────────────────────
async function istatistikleriYukle() {
  try {
    // Toplam başvuru sayısı
    const basvuruRef = collection(db, 'isBasvurulari');
    const basvuruSnap = await getDocs(basvuruRef);
    const toplam = basvuruSnap.size;
    document.getElementById('statToplamBasvuru').textContent = toplam;
    
    // Bu ay yeni başvurular
    const bugun = new Date();
    const buAyBaslangic = new Date(bugun.getFullYear(), bugun.getMonth(), 1);
    let buAyYeni = 0;
    basvuruSnap.forEach(doc => {
      const olusturma = doc.data().olusturmaZamani;
      if (olusturma && olusturma.toDate() >= buAyBaslangic) {
        buAyYeni++;
      }
    });
    document.getElementById('statBuAyYeni').textContent = buAyYeni;
    
    // Aktif pozisyon sayısı
    const pozisyonRef = collection(db, 'pozisyonlar');
    const pozisyonQ = query(pozisyonRef, where('aktif', '==', true));
    const pozisyonSnap = await getDocs(pozisyonQ);
    document.getElementById('statAktifPozisyon').textContent = pozisyonSnap.size;
    
    // Havuzdaki aday sayısı (mail bildirimi açık olanlar)
    const havuzRef = collection(db, 'havuzMailTercihleri');
    const havuzQ = query(havuzRef, where('mailAlmakIstiyor', '==', true));
    const havuzSnap = await getDocs(havuzQ);
    document.getElementById('statHavuzAday').textContent = havuzSnap.size;
    
  } catch (hata) {
    console.error('İstatistik yükleme hatası:', hata);
    document.getElementById('alertAlani').innerHTML = `
      <div class="alert hata">İstatistikler yüklenemedi: ${hata.message}</div>
    `;
  }
}

// ───────────────────────────────────────────────
// Son başvuruları listele
// ───────────────────────────────────────────────
async function sonBasvurulariYukle() {
  try {
    const basvuruRef = collection(db, 'isBasvurulari');
    const q = query(basvuruRef, orderBy('olusturmaZamani', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      document.getElementById('sonBasvurular').innerHTML = `
        <p style="text-align: center; color: var(--gri); padding: 40px 20px;">
          Henüz başvuru yapılmamış. İlk başvurunun gelmesini bekliyoruz! 🌱
        </p>
      `;
      return;
    }
    
    let basvurular = [];
    snapshot.forEach(doc => {
      basvurular.push({ id: doc.id, ...doc.data() });
    });
    
    // Son 10 başvuru
    basvurular = basvurular.slice(0, 10);
    
    let html = `
      <div class="tablo">
        <table>
          <thead>
            <tr>
              <th>Aday</th>
              <th>Pozisyon</th>
              <th>Durum</th>
              <th>Başvuru Tarihi</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    basvurular.forEach(b => {
      const kategori = pozisyonKategorisiBul(b.kategoriId || 'okulOncesiOgretmen');
      const durumRozet = durumRozetHTML(b.durum);
      
      html += `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              ${b.googleFoto ? `<img src="${b.googleFoto}" style="width:32px; height:32px; border-radius:50%;">` : ''}
              <div>
                <div style="font-weight: 600;">${b.adayAdi || '(İsim yok)'}</div>
                <div style="font-size: 12px; color: var(--gri);">${b.adayEposta}</div>
              </div>
            </div>
          </td>
          <td>${kategori.ikon} ${b.pozisyonBaslik || kategori.ad}</td>
          <td>${durumRozet}</td>
          <td>${b.olusturmaZamani ? tarihSaatFormatla(b.olusturmaZamani) : '-'}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    document.getElementById('sonBasvurular').innerHTML = html;
    
  } catch (hata) {
    console.error('Başvuru yükleme hatası:', hata);
    document.getElementById('sonBasvurular').innerHTML = `
      <div class="alert hata">Başvurular yüklenemedi: ${hata.message}</div>
    `;
  }
}

// ───────────────────────────────────────────────
// Durum rozet HTML
// ───────────────────────────────────────────────
function durumRozetHTML(durum) {
  const etiketler = {
    'bilgilerEksik': { ad: '⏸️ Bilgi bekleniyor', renk: '#999', bg: '#f5f5f5' },
    'testEksik': { ad: '🟡 Test bekleniyor', renk: '#f57c00', bg: '#fff3e0' },
    'tamamlandi': { ad: '✅ Tamamlandı', renk: '#2c5530', bg: '#d4f5d4' },
    'mulakat': { ad: '🎙️ Mülakat aşamasında', renk: '#1976d2', bg: '#e3f2fd' },
    'kabul': { ad: '🎉 Kabul edildi', renk: '#fff', bg: '#2c5530' },
    'red': { ad: '❌ Reddedildi', renk: '#fff', bg: '#d32f2f' },
    'havuz': { ad: '🌊 Havuzda', renk: '#1976d2', bg: '#e3f2fd' }
  };
  
  const etiket = etiketler[durum] || { ad: durum || 'Bilinmeyen', renk: '#666', bg: '#f5f5f5' };
  
  return `<span style="background: ${etiket.bg}; color: ${etiket.renk}; padding: 4px 10px; 
    border-radius: 12px; font-size: 12px; font-weight: 600;">${etiket.ad}</span>`;
}

// ───────────────────────────────────────────────
// Çıkış
// ───────────────────────────────────────────────
window.cikisYap = async function() {
  await signOut(auth);
  window.location.href = 'index.html';
};
