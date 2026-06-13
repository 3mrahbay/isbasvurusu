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
  
  // ✨ Animasyonlu kelime değişimini başlat
  baslatKelimeAnimasyonu();
  
  // 🥚 Logo'ya 5 tıklama → admin gizli giriş
  baslatGizliAdminGiris();
});

// ───────────────────────────────────────────────
// 🥚 GİZLİ ADMİN GİRİŞ
// Logo'ya 3 saniye içinde 5 kez tıklayınca admin paneline yönlendirir
// ───────────────────────────────────────────────
function baslatGizliAdminGiris() {
  const logo = document.getElementById('navLogo');
  if (!logo) return;
  
  let tiklamaSayisi = 0;
  let zamanasimi = null;
  
  logo.addEventListener('click', (e) => {
    // 5. tıklamada admin paneline git, normalde sayfayı yukarı kaydırma
    e.preventDefault();
    
    tiklamaSayisi++;
    
    // Görsel feedback (her tıklamada hafif büyüme)
    logo.querySelector('img').style.transform = `scale(${1 + tiklamaSayisi * 0.05})`;
    setTimeout(() => {
      if (logo.querySelector('img')) {
        logo.querySelector('img').style.transform = 'scale(1)';
      }
    }, 150);
    
    // 3 saniye içinde 5 tıklama olmazsa sıfırla
    if (zamanasimi) clearTimeout(zamanasimi);
    zamanasimi = setTimeout(() => {
      tiklamaSayisi = 0;
    }, 3000);
    
    // 5. tıklamada git
    if (tiklamaSayisi >= 5) {
      tiklamaSayisi = 0;
      clearTimeout(zamanasimi);
      
      // Hafif animasyon + yönlendirme
      logo.style.transition = 'transform 0.3s ease';
      logo.style.transform = 'rotate(360deg)';
      
      setTimeout(() => {
        window.location.href = 'admin.html';
      }, 400);
    } else if (tiklamaSayisi >= 3) {
      // 3+ tıklamada ipucu göster (sadece adminin bildiği bilgi)
      console.log(`🔐 Admin girişi: ${5 - tiklamaSayisi} tıklama daha...`);
    }
  });
}

// ───────────────────────────────────────────────
// ✨ ANİMASYONLU CÜMLE DEĞİŞİMİ
// "Sevgili [Öğretmen/Koordinatör/Uzman/Danışman/Aşçı] Adayımız"
// ───────────────────────────────────────────────
function baslatKelimeAnimasyonu() {
  const cumleler = document.querySelectorAll('.degisen-cumle');
  if (cumleler.length === 0) return;
  
  let aktifIndex = 0;
  const sureMs = 2800; // Her cümle 2.8 saniye ekranda kalır
  
  setInterval(() => {
    // Mevcut cümleyi gizle
    cumleler[aktifIndex].classList.remove('aktif');
    
    // Sıradaki cümleyi göster
    aktifIndex = (aktifIndex + 1) % cumleler.length;
    
    // Animasyonu yeniden başlatmak için reflow zorla
    void cumleler[aktifIndex].offsetWidth;
    cumleler[aktifIndex].classList.add('aktif');
  }, sureMs);
}

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
    
    // Sayaç başlat (varsa) - kompakt kartta sadece gün gösterildiği için dakikada bir yeterli
    if (pozisyonlar.some(p => p.sonBasvuruTarihi && !p.havuzModu)) {
      sayacInterval = setInterval(sayaclariGuncelle, 60000);
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

  console.log('🎨 pozisyonlariCiz çağrıldı, pozisyon sayısı:', pozisyonlar.length);

  if (pozisyonlar.length === 0) {
    liste.classList.remove('slider-mod');
    liste.classList.add('pozisyon-grid');
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

  // 📐 KUTUCUK GRID — yan yana + alt alta (slider yok)
  liste.classList.remove('slider-mod');
  liste.classList.add('pozisyon-grid');
  liste.innerHTML = pozisyonlar.map(p => pozisyonKartHTML(p)).join('');

  console.log(`✅ ${pozisyonlar.length} ilan grid olarak çizildi`);

  // Sayaç güncellemesi için (varsa) interval zaten pozisyonlariYukle'de başlatılıyor
}


// ───────────────────────────────────────────────
// Tek bir pozisyon kartı HTML'i
// ───────────────────────────────────────────────
function pozisyonKartHTML(p) {
  const kategori = pozisyonKategorisiBul(p.kategoriId || 'okulOncesiOgretmen');
  
  let rozetHTML = '';
  let sayacKompaktHTML = '';
  
  if (p.havuzModu) {
    rozetHTML = '<span class="pozisyon-rozet havuz">🌊 Sürekli Açık</span>';
    sayacKompaktHTML = '<div class="pozisyon-mini-bilgi havuz">🌊 Sürekli açık pozisyon</div>';
  } else if (p.sonBasvuruTarihi) {
    const kalan = geriSayimHesapla(p.sonBasvuruTarihi);
    if (!kalan) {
      rozetHTML = '<span class="pozisyon-rozet" style="background:#ffebee; color:#c62828;">⏰ Süre Doldu</span>';
      sayacKompaktHTML = '<div class="pozisyon-mini-bilgi suredoldu">⏰ Başvuru süresi doldu</div>';
    } else {
      const acilMi = kalan.gun <= 7;
      rozetHTML = acilMi 
        ? '<span class="pozisyon-rozet acil">🔥 Son Günler!</span>'
        : '<span class="pozisyon-rozet aktif">✨ Aktif</span>';
      sayacKompaktHTML = `
        <div class="pozisyon-mini-bilgi ${acilMi ? 'acil' : ''}" data-sayac-id="${p.id}">
          ${acilMi ? '🔥' : '📅'} Son başvuru: 
          <strong><span class="sayac-gun">${kalan.gun}</span> gün</strong>
        </div>`;
    }
  } else {
    rozetHTML = '<span class="pozisyon-rozet aktif">✨ Aktif</span>';
  }
  
  const lokasyon = p.lokasyon || 'Tuzla / İstanbul';
  const calismaTipi = p.calismaTipi || 'Tam zamanlı';
  // Lokasyonu kısalt (kompakt kart için)
  const lokasyonKisa = lokasyon.length > 30 ? lokasyon.split(',')[0].split('/').slice(-2).join('/').trim() : lokasyon;
  
  // Kare resim alanı (resim varsa göster, yoksa kategori ikonlu placeholder)
  const resimHTML = p.resimUrl
    ? `<div class="pozisyon-resim"><img src="${p.resimUrl}" alt="${p.baslik || kategori.ad}" loading="lazy"></div>`
    : `<div class="pozisyon-resim pozisyon-resim-bos"><span class="placeholder-ikon">${kategori.ikon}</span></div>`;
  
  // Kısa açıklamayı düz metne çevir ve kırp
  let aciklamaMetni = '';
  if (p.kisaAciklama) {
    const tmp = document.createElement('div');
    tmp.innerHTML = p.kisaAciklama;
    aciklamaMetni = (tmp.textContent || tmp.innerText || '').trim();
  }
  
  return `
    <div class="pozisyon-kart-kompakt">
      ${resimHTML}
      <div class="pozisyon-rozet-katman">${rozetHTML}</div>
      <div class="pozisyon-kart-govde">
        <h3 class="pozisyon-kart-baslik">${kategori.ikon} ${p.baslik || kategori.ad}</h3>
        <div class="pozisyon-kart-meta">
          <span>📍 ${lokasyonKisa}</span>
          <span>💼 ${calismaTipi}</span>
        </div>
        ${aciklamaMetni ? `<p class="pozisyon-kart-aciklama">${aciklamaMetni}</p>` : ''}
        ${sayacKompaktHTML}
        <div class="pozisyon-kart-butonlar">
          <a href="basvuru.html?pozisyon=${p.id}" class="btn btn-kompakt">🚀 Başvur</a>
          ${p.detayAciklama ? `<button class="btn btn-ikincil btn-kompakt" onclick="pozisyonDetayGoster('${p.id}')">📖 Detay</button>` : ''}
        </div>
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
      pozisyonlariCiz();
      return;
    }
    
    const gunEl = sayacEl.querySelector('.sayac-gun');
    if (gunEl) gunEl.textContent = kalan.gun;
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
