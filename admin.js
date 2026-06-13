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
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
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
    
    // Arşivlenenleri gizle (varsayılan)
    basvurular = basvurular.filter(b => !b.arsivlendi);
    
    // Son 15 başvuru
    basvurular = basvurular.slice(0, 15);
    
    // AI analizlerini topluca çek (puanları göstermek için)
    const analizSkorlari = {};
    try {
      const analizSnap = await getDocs(collection(db, 'analizler'));
      analizSnap.forEach(d => {
        const veri = d.data();
        const skor = veri.analiz?.genelUyumSkoru;
        if (skor !== undefined && skor !== null) analizSkorlari[d.id] = skor;
      });
    } catch (e) { console.warn('Analiz skorları çekilemedi:', e); }
    
    let html = `
      <div class="tablo">
        <table>
          <thead>
            <tr>
              <th>Aday</th>
              <th>Pozisyon</th>
              <th>Durum</th>
              <th>AI Puanı</th>
              <th>Tarih</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    basvurular.forEach(b => {
      const kategori = pozisyonKategorisiBul(b.kategoriId || 'okulOncesiOgretmen');
      const durumRozet = durumRozetHTML(b.durum);
      
      // AI puanı
      const skor = analizSkorlari[b.adayEposta];
      let aiPuanHTML;
      if (skor !== undefined) {
        let renk = '#2e7d32';
        if (skor < 50) renk = '#d32f2f';
        else if (skor < 70) renk = '#f57c00';
        aiPuanHTML = `<span style="display:inline-block; min-width:42px; text-align:center; background:${renk}; color:white; padding:4px 8px; border-radius:12px; font-weight:700; font-size:13px;">${skor}</span>`;
      } else if (b.durum === 'tamamlandi') {
        aiPuanHTML = `<span style="color:#f57c00; font-size:12px;">⏳ bekliyor</span>`;
      } else {
        aiPuanHTML = `<span style="color:#bbb; font-size:12px;">—</span>`;
      }
      
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
          <td>${aiPuanHTML}</td>
          <td style="font-size:13px;">${b.olusturmaZamani ? tarihSaatFormatla(b.olusturmaZamani) : '-'}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button onclick="basvuruArsivle('${b.adayEposta}')" title="Arşivle"
                style="background:#fff3e0; color:#e65100; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; font-size:12px;">📦</button>
              <button onclick="basvuruSil('${b.adayEposta}', '${(b.adayAdi||'').replace(/'/g,'')}')" title="Sil"
                style="background:#ffebee; color:#d32f2f; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; font-size:12px;">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
      <div style="margin-top:12px; text-align:right;">
        <button onclick="arsivGoster()" style="background:none; border:1px solid #ddd; color:#666; padding:8px 14px; border-radius:8px; cursor:pointer; font-size:13px;">📦 Arşivi Göster</button>
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
// Başvuru arşivle / arşivden çıkar / sil
// ───────────────────────────────────────────────
window.basvuruArsivle = async function(eposta) {
  if (!confirm('Bu başvuru arşive taşınsın mı?\n\nArşivlenen başvurular listeden gizlenir ama silinmez, istediğinizde geri alabilirsiniz.')) return;
  try {
    await updateDoc(doc(db, 'isBasvurulari', eposta), {
      arsivlendi: true,
      arsivlenmeZamani: serverTimestamp()
    });
    await sonBasvurulariYukle();
  } catch (hata) {
    alert('Arşivlenemedi: ' + hata.message);
  }
};

window.basvuruArsivdenCikar = async function(eposta) {
  try {
    await updateDoc(doc(db, 'isBasvurulari', eposta), { arsivlendi: false });
    await arsivGoster();
  } catch (hata) {
    alert('İşlem başarısız: ' + hata.message);
  }
};

window.basvuruSil = async function(eposta, ad) {
  if (!confirm(`⚠️ DİKKAT — KALICI SİLME\n\n"${ad || eposta}" adayının başvurusu, test cevapları ve AI analizi KALICI olarak silinecek. Bu işlem geri alınamaz.\n\nDevam etmek istiyor musunuz?`)) return;
  if (!confirm('Son kez soruyorum: Bu adayı tamamen silmek istediğinize emin misiniz?')) return;
  try {
    // İlişkili tüm verileri sil
    await deleteDoc(doc(db, 'isBasvurulari', eposta));
    try { await deleteDoc(doc(db, 'testCevaplari', eposta)); } catch(e) {}
    try { await deleteDoc(doc(db, 'analizler', eposta)); } catch(e) {}
    try { await deleteDoc(doc(db, 'mulakatNotlari', eposta)); } catch(e) {}
    await sonBasvurulariYukle();
    alert('✅ Başvuru ve ilişkili tüm veriler silindi.');
  } catch (hata) {
    alert('Silinemedi: ' + hata.message);
  }
};

// ───────────────────────────────────────────────
// Arşivlenmiş başvuruları göster
// ───────────────────────────────────────────────
window.arsivGoster = async function() {
  const alan = document.getElementById('sonBasvurular');
  alan.innerHTML = '<p style="padding:20px; color:#666;">Arşiv yükleniyor...</p>';
  try {
    const snapshot = await getDocs(query(collection(db, 'isBasvurulari'), orderBy('olusturmaZamani', 'desc')));
    const arsiv = [];
    snapshot.forEach(d => {
      const v = { id: d.id, ...d.data() };
      if (v.arsivlendi) arsiv.push(v);
    });
    
    if (arsiv.length === 0) {
      alan.innerHTML = `
        <p style="text-align:center; color:var(--gri); padding:30px;">📦 Arşivde başvuru yok.</p>
        <div style="text-align:right;"><button onclick="sonBasvurulariYukle()" style="background:none; border:1px solid #ddd; color:#666; padding:8px 14px; border-radius:8px; cursor:pointer; font-size:13px;">← Aktif Başvurulara Dön</button></div>
      `;
      return;
    }
    
    let html = `<div class="tablo"><table><thead><tr>
      <th>Aday</th><th>Pozisyon</th><th>Durum</th><th>İşlem</th>
    </tr></thead><tbody>`;
    arsiv.forEach(b => {
      const kategori = pozisyonKategorisiBul(b.kategoriId || 'okulOncesiOgretmen');
      html += `
        <tr style="opacity:0.75;">
          <td><div style="font-weight:600;">${b.adayAdi || '(İsim yok)'}</div><div style="font-size:12px; color:var(--gri);">${b.adayEposta}</div></td>
          <td>${kategori.ikon} ${b.pozisyonBaslik || kategori.ad}</td>
          <td>${durumRozetHTML(b.durum)}</td>
          <td>
            <div style="display:flex; gap:6px;">
              <button onclick="basvuruArsivdenCikar('${b.adayEposta}')" title="Geri al"
                style="background:#e8f5e9; color:#2e7d32; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; font-size:12px;">↩️ Geri Al</button>
              <button onclick="basvuruSil('${b.adayEposta}', '${(b.adayAdi||'').replace(/'/g,'')}')" title="Sil"
                style="background:#ffebee; color:#d32f2f; border:none; padding:6px 10px; border-radius:8px; cursor:pointer; font-size:12px;">🗑️</button>
            </div>
          </td>
        </tr>`;
    });
    html += `</tbody></table></div>
      <div style="margin-top:12px; text-align:right;"><button onclick="sonBasvurulariYukle()" style="background:none; border:1px solid #ddd; color:#666; padding:8px 14px; border-radius:8px; cursor:pointer; font-size:13px;">← Aktif Başvurulara Dön</button></div>`;
    alan.innerHTML = html;
  } catch (hata) {
    alan.innerHTML = `<div class="alert hata">Arşiv yüklenemedi: ${hata.message}</div>`;
  }
};

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
