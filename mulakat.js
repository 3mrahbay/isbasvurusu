// ═══════════════════════════════════════════════════════════
// MÜLAKAT PROFİLİ - ANA JS
// Admin için canlı mülakat aracı
// ═══════════════════════════════════════════════════════════

import { 
  auth, db,
  onAuthStateChanged,
  signOut,
  doc, getDoc, setDoc,
  serverTimestamp,
  ADMIN_EPOSTA
} from './firebase-config.js';

import { 
  ozetTabHTML,
  uyarilarTabHTML,
  sorularTabHTML,
  cevaplarTabHTML,
  notTabHTML,
  cubukChart
} from './mulakat-render.js';

import { tarihSaatFormatla } from './yardimci.js';

// ───────────────────────────────────────────────
// STATE
// ───────────────────────────────────────────────
let aktifAdayEposta = null;
let aktifAday = null;
let aktifAnaliz = null;
let aktifTestCevaplari = null;
let aktifMulakatNotu = null;
let aktifTab = 'ozet';

// ───────────────────────────────────────────────
// Auth kontrol
// ───────────────────────────────────────────────
onAuthStateChanged(auth, async (kullanici) => {
  if (!kullanici || kullanici.email !== ADMIN_EPOSTA) {
    document.getElementById('yukleniyor').classList.add('gizli');
    document.getElementById('yetkisiz').classList.remove('gizli');
    return;
  }
  
  // URL'den aday email'i al
  const urlParams = new URLSearchParams(window.location.search);
  aktifAdayEposta = urlParams.get('aday');
  
  if (!aktifAdayEposta) {
    document.getElementById('yukleniyor').classList.add('gizli');
    document.getElementById('yetkisiz').innerHTML = `
      <h2>⚠️ Aday Belirtilmemiş</h2>
      <p>Mülakat profili açmak için aday seçmelisiniz.</p>
      <a href="admin-havuz.html" class="btn">Aday Havuzuna Dön</a>
    `;
    document.getElementById('yetkisiz').classList.remove('gizli');
    return;
  }
  
  await tumVeriyiYukle();
});

// ───────────────────────────────────────────────
// Tüm veriyi paralel yükle
// ───────────────────────────────────────────────
async function tumVeriyiYukle() {
  try {
    // Paralel yükleme
    const [basvuruSnap, analizSnap, testSnap, notSnap] = await Promise.all([
      getDoc(doc(db, 'isBasvurulari', aktifAdayEposta)),
      getDoc(doc(db, 'analizler', aktifAdayEposta)),
      getDoc(doc(db, 'testCevaplari', aktifAdayEposta)),
      getDoc(doc(db, 'mulakatNotlari', aktifAdayEposta))
    ]);
    
    if (!basvuruSnap.exists()) {
      throw new Error('Aday bulunamadı');
    }
    
    aktifAday = basvuruSnap.data();
    aktifAnaliz = analizSnap.exists() ? analizSnap.data().analiz : null;
    aktifTestCevaplari = testSnap.exists() ? (testSnap.data().cevaplar || {}) : {};
    aktifMulakatNotu = notSnap.exists() ? notSnap.data() : {};
    
    // Sayfayı doldur
    document.getElementById('adayBaslik').textContent = aktifAday.adayAdi || aktifAdayEposta;
    document.getElementById('yukleniyor').classList.add('gizli');
    document.getElementById('anaIcerik').classList.remove('gizli');
    
    // Tüm tabları render et
    renderTumTablar();
    
    // Otomatik kayıt göstergesi
    otomatikKayitGostergesiOlustur();
    
  } catch (hata) {
    console.error('Yükleme hatası:', hata);
    document.getElementById('yukleniyor').classList.add('gizli');
    document.getElementById('yetkisiz').innerHTML = `
      <h2>⚠️ Yüklenemedi</h2>
      <p>${hata.message}</p>
      <a href="admin-havuz.html" class="btn">Aday Havuzuna Dön</a>
    `;
    document.getElementById('yetkisiz').classList.remove('gizli');
  }
}

// ───────────────────────────────────────────────
// Tüm tabları render et
// ───────────────────────────────────────────────
function renderTumTablar() {
  document.getElementById('tab-ozet').innerHTML = ozetTabHTML(aktifAday, aktifAnaliz, aktifTestCevaplari);
  document.getElementById('tab-uyarilar').innerHTML = uyarilarTabHTML(aktifAday, aktifAnaliz);
  document.getElementById('tab-sorular').innerHTML = sorularTabHTML(aktifAday, aktifAnaliz, aktifMulakatNotu);
  document.getElementById('tab-cevaplar').innerHTML = cevaplarTabHTML(aktifTestCevaplari);
  document.getElementById('tab-not').innerHTML = notTabHTML(aktifAday, aktifMulakatNotu);
  
  // Event listenerlar
  baglaListenerlar();
}

// ───────────────────────────────────────────────
// Tab değiştirme
// ───────────────────────────────────────────────
window.tabDegistir = function(tabId) {
  aktifTab = tabId;
  
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('aktif'));
  document.querySelectorAll('.tab-icerik-alani').forEach(el => el.classList.add('gizli'));
  
  // Aktif tabı bul
  const aktifBtn = document.querySelector(`.tab-btn[onclick*="${tabId}"]`);
  if (aktifBtn) aktifBtn.classList.add('aktif');
  
  document.getElementById(`tab-${tabId}`).classList.remove('gizli');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ───────────────────────────────────────────────
// Event listenerlar (textareas, butonlar)
// ───────────────────────────────────────────────
function baglaListenerlar() {
  // Tüm textarea'lara otomatik kayıt
  document.querySelectorAll('textarea[data-not-key]').forEach(ta => {
    ta.addEventListener('input', (e) => {
      const key = e.target.dataset.notKey;
      const deger = e.target.value;
      otomatikNotKaydet(key, deger);
    });
  });
  
  // Karar butonları
  document.querySelectorAll('.karar-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const karar = e.currentTarget.dataset.karar;
      kararSec(karar);
    });
  });
  
  // Mevcut karar varsa butonu işaretle
  if (aktifMulakatNotu.karar) {
    const btn = document.querySelector(`.karar-btn[data-karar="${aktifMulakatNotu.karar}"]`);
    if (btn) {
      btn.classList.add('secili', aktifMulakatNotu.karar);
    }
  }
}

// ───────────────────────────────────────────────
// Karar seç
// ───────────────────────────────────────────────
async function kararSec(karar) {
  // Görsel
  document.querySelectorAll('.karar-btn').forEach(btn => {
    btn.classList.remove('secili', 'kabul', 'red', 'beklemede');
  });
  
  const btn = document.querySelector(`.karar-btn[data-karar="${karar}"]`);
  if (btn) {
    btn.classList.add('secili', karar);
  }
  
  // Kaydet
  await mulakatNotuKaydet({ karar: karar, kararZamani: serverTimestamp() });
}

// ───────────────────────────────────────────────
// Otomatik not kaydet (debounced)
// ───────────────────────────────────────────────
let otoKayitTimer = null;
function otomatikNotKaydet(key, deger) {
  if (otoKayitTimer) clearTimeout(otoKayitTimer);
  
  otoKayitTimer = setTimeout(async () => {
    const guncelleme = {};
    
    if (key.startsWith('derinSoru_')) {
      // Derin soru notu - subdocument
      const idx = key.replace('derinSoru_', '');
      guncelleme[`derinSoruNotlari.${idx}`] = deger;
    } else if (key.startsWith('soru_')) {
      // Mülakat sorusu notu
      const idx = key.replace('soru_', '');
      guncelleme[`soruNotlari.${idx}`] = deger;
    } else {
      // Genel notlar
      guncelleme[key] = deger;
    }
    
    await mulakatNotuKaydet(guncelleme);
  }, 1000);
}

// ───────────────────────────────────────────────
// Firestore'a kaydet
// ───────────────────────────────────────────────
async function mulakatNotuKaydet(guncelleme) {
  try {
    await setDoc(doc(db, 'mulakatNotlari', aktifAdayEposta), {
      adayEposta: aktifAdayEposta,
      adayAdi: aktifAday.adayAdi || '',
      pozisyonId: aktifAday.pozisyonId || null,
      ...guncelleme,
      sonGuncelleme: serverTimestamp()
    }, { merge: true });
    
    // Local state'i güncelle
    Object.keys(guncelleme).forEach(k => {
      if (k.includes('.')) {
        // Nested update
        const parts = k.split('.');
        if (!aktifMulakatNotu[parts[0]]) aktifMulakatNotu[parts[0]] = {};
        aktifMulakatNotu[parts[0]][parts[1]] = guncelleme[k];
      } else {
        aktifMulakatNotu[k] = guncelleme[k];
      }
    });
    
    otomatikKayitGoster();
    
  } catch (hata) {
    console.error('Kayıt hatası:', hata);
  }
}

// ───────────────────────────────────────────────
// Otomatik kayıt göstergesi
// ───────────────────────────────────────────────
function otomatikKayitGostergesiOlustur() {
  if (document.getElementById('otoKayit')) return;
  const div = document.createElement('div');
  div.id = 'otoKayit';
  div.className = 'otomatik-kayit';
  div.textContent = '✓ Kaydedildi';
  document.body.appendChild(div);
}

function otomatikKayitGoster() {
  const el = document.getElementById('otoKayit');
  if (!el) return;
  el.classList.add('gorunur');
  setTimeout(() => el.classList.remove('gorunur'), 1500);
}

// ───────────────────────────────────────────────
// Yazdırma
// ───────────────────────────────────────────────
window.yazdir = function() {
  // Tüm tabları görünür yap, sonra yazdır
  const tablar = document.querySelectorAll('.tab-icerik-alani');
  tablar.forEach(t => t.classList.remove('gizli'));
  window.print();
  // Yazdırma sonrası ilk tabı göster
  setTimeout(() => {
    tablar.forEach(t => t.classList.add('gizli'));
    document.getElementById(`tab-${aktifTab}`).classList.remove('gizli');
  }, 1000);
};

// ───────────────────────────────────────────────
// Çıkış
// ───────────────────────────────────────────────
window.cikisYap = async function() {
  await signOut(auth);
  window.location.href = 'index.html';
};
