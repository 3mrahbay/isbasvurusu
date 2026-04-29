// ═══════════════════════════════════════════════════════════
// ANA SAYFA MANTIĞI
// Açık pozisyonları Firestore'dan çekip listele + geri sayım
// ═══════════════════════════════════════════════════════════

import { 
  db,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc
} from './firebase-config.js';

import { 
  geriSayimHesapla,
  pozisyonKategorisiBul,
  tarihFormatla
} from './yardimci.js';

import { metniRender } from './metin-editor.js';

let pozisyonlar = [];
let sayacInterval = null;

// ───────────────────────────────────────────────
// Sayfa yüklendiğinde
// ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await pozisyonlariYukle();
  await siteIcerikYukle();
});

// ───────────────────────────────────────────────
// Pozisyonları Firestore'dan çek
// ───────────────────────────────────────────────
async function pozisyonlariYukle() {
  try {
    const pozisyonRef = collection(db, 'pozisyonlar');
    // Sadece aktif olanları çek (composite index gerektirmesin diye orderBy yok)
    const q = query(
      pozisyonRef,
      where('aktif', '==', true)
    );
    
    const snapshot = await getDocs(q);
    pozisyonlar = [];
    
    snapshot.forEach(doc => {
      pozisyonlar.push({ id: doc.id, ...doc.data() });
    });
    
    // 🔍 HATA AYIKLAMA: Console'da bilgi göster
    console.log(`✅ ${pozisyonlar.length} aktif pozisyon yüklendi`);
    if (pozisyonlar.length > 0) {
      console.table(pozisyonlar.map(p => ({
        id: p.id,
        baslik: p.baslik,
        kategoriId: p.kategoriId,
        aktif: p.aktif,
        havuzModu: p.havuzModu,
        olusturmaZamani: p.olusturmaZamani?.seconds 
          ? new Date(p.olusturmaZamani.seconds * 1000).toLocaleString('tr-TR') 
          : '-'
      })));
    } else {
      console.warn('⚠️ Aktif pozisyon yok! Firebase Console > pozisyonlar koleksiyonunu kontrol edin. "aktif" alanı true olmalı.');
    }
    
    // JS tarafında sırala - olusturmaZamani'na göre azalan (yeni en üstte)
    pozisyonlar.sort((a, b) => {
      const aZaman = a.olusturmaZamani?.seconds || 0;
      const bZaman = b.olusturmaZamani?.seconds || 0;
      return bZaman - aZaman;
    });
    
    pozisyonlariCiz();
    
    // Sayaç başlat (varsa)
    if (pozisyonlar.some(p => p.sonBasvuruTarihi && !p.havuzModu)) {
      sayacInterval = setInterval(sayaclariGuncelle, 1000);
    }
    
  } catch (hata) {
    console.error('Pozisyon yükleme hatası:', hata);
    pozisyonHataGoster();
  }
}

// ───────────────────────────────────────────────
// Pozisyonları ekrana çiz
// ───────────────────────────────────────────────
function pozisyonlariCiz() {
  const liste = document.getElementById('pozisyonListesi');
  
  if (pozisyonlar.length === 0) {
    liste.innerHTML = `
      <div class="pozisyon-yok-mesaj">
        <div class="ikon">🌱</div>
        <h3>Şu An Aktif Bir İlanımız Yok</h3>
        <p>
          Ama merak etmeyin! Aday havuzumuza katılarak ilerideki açılışlardan 
          ilk siz haberdar olabilirsiniz. Sizinle uygun bir pozisyon açıldığında 
          mail göndererek haber vereceğiz.
        </p>
        <a href="basvuru.html?havuz=true" class="btn">
          🌸 Aday Havuzuna Katıl
        </a>
      </div>
    `;
    return;
  }
  
  liste.innerHTML = pozisyonlar.map(p => pozisyonKartHTML(p)).join('');
}

// ───────────────────────────────────────────────
// Tek bir pozisyon kartı HTML'i
// ───────────────────────────────────────────────
function pozisyonKartHTML(p) {
  const kategori = pozisyonKategorisiBul(p.kategoriId || 'okulOncesiOgretmen');
  
  let rozetHTML = '';
  let sayacHTML = '';
  
  if (p.havuzModu) {
    rozetHTML = '<span class="pozisyon-rozet havuz">🌊 Sürekli Açık</span>';
    sayacHTML = `
      <div class="pozisyon-sayac">
        <span class="ikon">🌊</span>
        <div class="metin">
          <strong>Sürekli açık pozisyon</strong> — Başvuru havuzuna katılın, 
          ihtiyaç olduğunda size dönüş yapalım.
        </div>
      </div>
    `;
  } else if (p.sonBasvuruTarihi) {
    const kalan = geriSayimHesapla(p.sonBasvuruTarihi);
    
    if (!kalan) {
      rozetHTML = '<span class="pozisyon-rozet" style="background:#ffebee; color:#c62828;">⏰ Süre Doldu</span>';
      sayacHTML = `
        <div class="pozisyon-sayac acil">
          <span class="ikon">⏰</span>
          <div class="metin">Bu pozisyona başvuru süresi sona erdi.</div>
        </div>
      `;
    } else {
      const acilMi = kalan.gun <= 7;
      rozetHTML = acilMi 
        ? '<span class="pozisyon-rozet acil">🔥 Son Günler!</span>'
        : '<span class="pozisyon-rozet aktif">✨ Aktif İlan</span>';
      
      sayacHTML = `
        <div class="pozisyon-sayac ${acilMi ? 'acil' : ''}">
          <span class="ikon">${acilMi ? '🔥' : '📅'}</span>
          <div class="metin">
            <strong>Son başvuru tarihi:</strong> ${tarihFormatla(p.sonBasvuruTarihi)}
          </div>
          <div class="sayac-grid" data-sayac-id="${p.id}">
            <div class="sayac-birim">
              <div class="deger sayac-gun">${kalan.gun}</div>
              <div class="etiket">Gün</div>
            </div>
            <div class="sayac-birim">
              <div class="deger sayac-saat">${String(kalan.saat).padStart(2,'0')}</div>
              <div class="etiket">Saat</div>
            </div>
            <div class="sayac-birim">
              <div class="deger sayac-dakika">${String(kalan.dakika).padStart(2,'0')}</div>
              <div class="etiket">Dakika</div>
            </div>
            <div class="sayac-birim">
              <div class="deger sayac-saniye">${String(kalan.saniye).padStart(2,'0')}</div>
              <div class="etiket">Saniye</div>
            </div>
          </div>
        </div>
      `;
    }
  } else {
    rozetHTML = '<span class="pozisyon-rozet aktif">✨ Aktif İlan</span>';
  }
  
  // Aktif çalışan sayısı/lokasyon gibi meta
  const lokasyon = p.lokasyon || 'Tuzla Aydınlı / İstanbul';
  const calismaTipi = p.calismaTipi || 'Tam zamanlı';
  
  return `
    <div class="pozisyon-kart">
      <div class="pozisyon-ust">
        <div class="pozisyon-baslik">
          <h3>${kategori.ikon} ${p.baslik || kategori.ad}</h3>
          <div class="meta">
            <span>📍 ${lokasyon}</span>
            <span>💼 ${calismaTipi}</span>
            ${p.olusturmaZamani ? `<span>📅 ${tarihFormatla(p.olusturmaZamani)}</span>` : ''}
          </div>
        </div>
        <div>${rozetHTML}</div>
      </div>
      
      <div class="pozisyon-aciklama zengin-icerik">${p.kisaAciklama ? metniRender(p.kisaAciklama) : '<p>Bu pozisyon hakkında daha fazla bilgi için detaya tıklayın.</p>'}</div>
      
      ${sayacHTML}
      
      <div class="pozisyon-altbutonlar">
        <a href="basvuru.html?pozisyon=${p.id}" class="btn">
          🚀 Bu Pozisyona Başvur
        </a>
        ${p.detayAciklama ? `
          <button class="btn btn-ikincil" onclick="pozisyonDetayGoster('${p.id}')">
            📖 Detayları Gör
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// ───────────────────────────────────────────────
// Sayaçları her saniye güncelle
// ───────────────────────────────────────────────
function sayaclariGuncelle() {
  pozisyonlar.forEach(p => {
    if (!p.sonBasvuruTarihi || p.havuzModu) return;
    
    const kalan = geriSayimHesapla(p.sonBasvuruTarihi);
    const sayacEl = document.querySelector(`[data-sayac-id="${p.id}"]`);
    if (!sayacEl) return;
    
    if (!kalan) {
      // Süre doldu, kartı yeniden çiz
      pozisyonlariCiz();
      return;
    }
    
    sayacEl.querySelector('.sayac-gun').textContent = kalan.gun;
    sayacEl.querySelector('.sayac-saat').textContent = String(kalan.saat).padStart(2, '0');
    sayacEl.querySelector('.sayac-dakika').textContent = String(kalan.dakika).padStart(2, '0');
    sayacEl.querySelector('.sayac-saniye').textContent = String(kalan.saniye).padStart(2, '0');
  });
}

// ───────────────────────────────────────────────
// Pozisyon detayı modal göster (basit)
// ───────────────────────────────────────────────
window.pozisyonDetayGoster = function(pozisyonId) {
  const p = pozisyonlar.find(x => x.id === pozisyonId);
  if (!p) return;
  
  const detay = p.detayAciklama || 'Detay bilgisi mevcut değil.';
  
  // Basit modal - geliştirilebilir
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6); z-index: 1000;
    display: flex; align-items: center; justify-content: center;
    padding: 20px; backdrop-filter: blur(4px);
  `;
  modal.innerHTML = `
    <div style="background: white; max-width: 600px; width: 100%; max-height: 80vh; 
                overflow-y: auto; border-radius: 16px; padding: 32px;">
      <h2 style="color: var(--ana-yesil); margin-bottom: 16px;">
        ${pozisyonKategorisiBul(p.kategoriId).ikon} ${p.baslik}
      </h2>
      <div class="zengin-icerik" style="margin-bottom: 24px;">
        ${metniRender(detay)}
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <a href="basvuru.html?pozisyon=${p.id}" class="btn">🚀 Hemen Başvur</a>
        <button class="btn btn-ikincil" onclick="this.closest('div[style*=\\'fixed\\']').remove()">
          Kapat
        </button>
      </div>
    </div>
  `;
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  document.body.appendChild(modal);
};

// ───────────────────────────────────────────────
// Site içeriğini Firestore'dan yükle (admin tarafından düzenlenebilir)
// ───────────────────────────────────────────────
async function siteIcerikYukle() {
  try {
    // Hero metni
    const heroRef = doc(db, 'siteIcerik', 'hero');
    const heroSnap = await getDoc(heroRef);
    if (heroSnap.exists()) {
      const veri = heroSnap.data();
      if (veri.baslik) document.getElementById('heroBaslik').textContent = veri.baslik;
      if (veri.altBaslik) {
        // Hero alt başlığı: HTML render
        const altBaslikEl = document.getElementById('heroAltBaslik');
        altBaslikEl.innerHTML = metniRender(veri.altBaslik);
        altBaslikEl.classList.add('zengin-icerik');
      }
    }
    
    // Hakkımızda
    const hakRef = doc(db, 'siteIcerik', 'hakkimizda');
    const hakSnap = await getDoc(hakRef);
    if (hakSnap.exists() && hakSnap.data().icerik) {
      const el = document.getElementById('hakkimizdaIcerik');
      el.innerHTML = metniRender(hakSnap.data().icerik);
      el.classList.add('zengin-icerik');
    }
    
    // Değerler
    const degRef = doc(db, 'siteIcerik', 'degerler');
    const degSnap = await getDoc(degRef);
    if (degSnap.exists() && degSnap.data().icerik) {
      const el = document.getElementById('degerlerIcerik');
      el.innerHTML = metniRender(degSnap.data().icerik);
      el.classList.add('zengin-icerik');
    }
  } catch (hata) {
    console.log('Site içerik yüklenemedi (varsayılan kullanılıyor):', hata.message);
  }
}

// ───────────────────────────────────────────────
// Pozisyon yükleme hatası
// ───────────────────────────────────────────────
function pozisyonHataGoster() {
  const liste = document.getElementById('pozisyonListesi');
  liste.innerHTML = `
    <div class="pozisyon-yok-mesaj">
      <div class="ikon">⚠️</div>
      <h3>Pozisyonlar Yüklenemedi</h3>
      <p>Lütfen sayfayı yenileyin veya birkaç dakika sonra tekrar deneyin.</p>
      <button class="btn" onclick="location.reload()">🔄 Sayfayı Yenile</button>
    </div>
  `;
}

// Cleanup
window.addEventListener('beforeunload', () => {
  if (sayacInterval) clearInterval(sayacInterval);
});
