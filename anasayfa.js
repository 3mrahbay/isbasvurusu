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
let sliderInterval = null;
let aktifGrupIndex = 0;
let toplamGrupSayisi = 0;

function pozisyonlariCiz() {
  const liste = document.getElementById('pozisyonListesi');
  
  // Önceki slider'ı temizle
  if (sliderInterval) {
    clearInterval(sliderInterval);
    sliderInterval = null;
  }
  
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
  
  // 📱 Mobilde 1, desktop'ta 2 ilan/grup
  const mobilMi = window.innerWidth <= 768;
  const grupBoyu = mobilMi ? 1 : 2;
  
  // Slider'a gerek yok mu? (yeterli ilan yoksa düz göster)
  if (pozisyonlar.length <= grupBoyu) {
    liste.classList.remove('slider-mod');
    liste.innerHTML = pozisyonlar.map(p => pozisyonKartHTML(p)).join('');
    return;
  }
  
  // 3+ ise SLIDER MOD
  liste.classList.add('slider-mod');
  
  // Gruplara böl (mobilde 1'er, desktop'ta 2'şer)
  const gruplar = [];
  for (let i = 0; i < pozisyonlar.length; i += grupBoyu) {
    gruplar.push(pozisyonlar.slice(i, i + grupBoyu));
  }
  
  toplamGrupSayisi = gruplar.length;
  aktifGrupIndex = 0;
  
  // Slider HTML
  liste.innerHTML = `
    <div class="pozisyon-slider-pencere" id="pozisyonSliderPencere">
      <div class="pozisyon-slider-track" id="pozisyonSliderTrack">
        ${gruplar.map((grup, idx) => `
          <div class="pozisyon-slider-grup" data-grup-index="${idx}">
            ${grup.map(p => pozisyonKartHTML(p)).join('')}
          </div>
        `).join('')}
      </div>
      
      <div class="slider-pause-uyari">⏸ Otomatik geçiş duraklatıldı</div>
    </div>
    
    <!-- 🔘 SAĞ ORTA - DİKEY BUTONLAR -->
    <div class="slider-nav-grup">
      <button class="slider-ok-btn" onclick="sliderOnceki()" aria-label="Önceki" title="Önceki">
        ‹
      </button>
      <button class="slider-ok-btn" onclick="sliderSonraki()" aria-label="Sonraki" title="Sonraki">
        ›
      </button>
    </div>
    
    <!-- Nokta göstergeler -->
    <div class="pozisyon-slider-noktalar">
      ${gruplar.map((_, idx) => `
        <button class="slider-nokta ${idx === 0 ? 'aktif' : ''}" 
                onclick="sliderManuelDegistir(${idx})"
                aria-label="Grup ${idx + 1}"></button>
      `).join('')}
    </div>
    
    <!-- Sayaç -->
    <div class="pozisyon-slider-sayac">
      <span id="sliderSayacAktif">1</span> / ${gruplar.length} 
      <span style="color: var(--gri); font-size: 12px;">
        (${pozisyonlar.length} aktif ilan)
      </span>
    </div>
  `;
  
  // Touch + Hover desteği başlat
  setTimeout(() => {
    sliderTouchKurulum();
    baslatPozisyonSlider();
  }, 100);
  
  // Pencere boyutu değişirse → tekrar render et (mobilden desktop'a geçiş için)
  window.addEventListener('resize', sliderEkranDegisimi);
}

// ───────────────────────────────────────────────
// 📐 EKRAN BOYUTU DEĞİŞİMİ - Mobil/Desktop geçişi
// ───────────────────────────────────────────────
let resizeRenderTimer = null;
function sliderEkranDegisimi() {
  if (resizeRenderTimer) clearTimeout(resizeRenderTimer);
  resizeRenderTimer = setTimeout(() => {
    // Eğer grup sayısı değişmesi gereken bir geçişte ise tamamen render et
    const mobilMi = window.innerWidth <= 768;
    const yeniGrupBoyu = mobilMi ? 1 : 2;
    const yeniGrupSayisi = Math.ceil(pozisyonlar.length / yeniGrupBoyu);
    
    if (yeniGrupSayisi !== toplamGrupSayisi) {
      // Grup sayısı değişti, tamamen yeniden render et
      pozisyonlariCiz();
    } else {
      // Sadece pozisyonu güncelle
      sliderGrubaGit(aktifGrupIndex);
    }
  }, 200);
}

// ───────────────────────────────────────────────
// 🎠 OTOMATİK DÖNGÜ
// ───────────────────────────────────────────────
function baslatPozisyonSlider() {
  if (toplamGrupSayisi <= 1) return;
  
  if (sliderInterval) {
    clearInterval(sliderInterval);
  }
  
  sliderInterval = setInterval(() => {
    aktifGrupIndex = (aktifGrupIndex + 1) % toplamGrupSayisi;
    sliderGrubaGit(aktifGrupIndex);
  }, 3000); // 3 saniyede bir
}

function sliderDuraklat() {
  if (sliderInterval) {
    clearInterval(sliderInterval);
    sliderInterval = null;
  }
}

// ───────────────────────────────────────────────
// 📍 BELLİ BİR GRUBA GİT - YATAY HAREKET
// ───────────────────────────────────────────────
function sliderGrubaGit(grupIndex) {
  const track = document.getElementById('pozisyonSliderTrack');
  if (!track) return;
  
  // Track'in parent'ı (pencere) iç genişliği = bir grubun genişliği
  // İç padding düşülmüş net iç alan
  const ilkGrup = track.querySelector('.pozisyon-slider-grup');
  if (!ilkGrup) return;
  
  const grupGenislik = ilkGrup.offsetWidth;
  
  // YATAY hareket - donanım ivmesiyle
  track.style.transform = `translate3d(-${grupIndex * grupGenislik}px, 0, 0)`;
  
  // Nokta göstergeleri güncelle
  document.querySelectorAll('.slider-nokta').forEach((n, i) => {
    n.classList.toggle('aktif', i === grupIndex);
  });
  
  // Sayaç
  const sayac = document.getElementById('sliderSayacAktif');
  if (sayac) sayac.textContent = grupIndex + 1;
}

// ───────────────────────────────────────────────
// 🎮 MANUEL KONTROLLER
// ───────────────────────────────────────────────
window.sliderManuelDegistir = function(grupIndex) {
  sliderDuraklat();
  aktifGrupIndex = grupIndex;
  sliderGrubaGit(grupIndex);
  
  // 8 saniye sonra otomatik döngüyü tekrar başlat
  setTimeout(() => {
    if (toplamGrupSayisi > 1 && !sliderInterval) {
      baslatPozisyonSlider();
    }
  }, 8000);
};

window.sliderSonraki = function() {
  const yeniIndex = (aktifGrupIndex + 1) % toplamGrupSayisi;
  sliderManuelDegistir(yeniIndex);
};

window.sliderOnceki = function() {
  const yeniIndex = aktifGrupIndex - 1 < 0 ? toplamGrupSayisi - 1 : aktifGrupIndex - 1;
  sliderManuelDegistir(yeniIndex);
};

// ───────────────────────────────────────────────
// 👆 TOUCH (Dokunma) DESTEĞİ - Telefon için
// ───────────────────────────────────────────────
function sliderTouchKurulum() {
  const pencere = document.getElementById('pozisyonSliderPencere');
  const track = document.getElementById('pozisyonSliderTrack');
  if (!pencere || !track) return;
  
  let baslangicX = 0;
  let mevcutX = 0;
  let surukleniyor = false;
  let baslangicGenislik = 0;
  
  // Hover'da duraklatma (desktop)
  pencere.addEventListener('mouseenter', () => {
    sliderDuraklat();
  });
  
  pencere.addEventListener('mouseleave', () => {
    if (!sliderInterval && toplamGrupSayisi > 1 && !surukleniyor) {
      baslatPozisyonSlider();
    }
  });
  
  // ─── DOKUNMATIK BAŞLANGIÇ ───
  const baslangicEvent = (e) => {
    surukleniyor = true;
    
    const dokunma = e.touches ? e.touches[0] : e;
    baslangicX = dokunma.clientX;
    mevcutX = dokunma.clientX;
    
    // Mevcut grup genişliğini al (pencere değil!)
    const ilkGrup = track.querySelector('.pozisyon-slider-grup');
    baslangicGenislik = ilkGrup ? ilkGrup.offsetWidth : pencere.clientWidth;
    
    track.classList.add('suruklenirken');
    sliderDuraklat();
  };
  
  // ─── DOKUNMATIK HAREKET ───
  const hareketEvent = (e) => {
    if (!surukleniyor) return;
    
    const dokunma = e.touches ? e.touches[0] : e;
    mevcutX = dokunma.clientX;
    
    const fark = mevcutX - baslangicX;
    const aktifPozisyon = -aktifGrupIndex * baslangicGenislik;
    
    // Sürükleme sırasında manuel transform
    track.style.transform = `translate3d(${aktifPozisyon + fark}px, 0, 0)`;
  };
  
  // ─── DOKUNMATIK BİTİŞ ───
  const bitisEvent = () => {
    if (!surukleniyor) return;
    surukleniyor = false;
    track.classList.remove('suruklenirken');
    
    const fark = mevcutX - baslangicX;
    const esik = baslangicGenislik * 0.2; // %20 sürükleme yeterli
    
    if (Math.abs(fark) > esik) {
      // Yeterli sürükleme yapıldı
      if (fark < 0) {
        // Sola sürüklendi → sonraki
        sliderSonraki();
      } else {
        // Sağa sürüklendi → önceki
        sliderOnceki();
      }
    } else {
      // Yetersiz sürükleme → mevcut grupta kal
      sliderGrubaGit(aktifGrupIndex);
    }
    
    // 8 sn sonra otomatik başlat
    setTimeout(() => {
      if (!sliderInterval && toplamGrupSayisi > 1) {
        baslatPozisyonSlider();
      }
    }, 8000);
  };
  
  // Touch events (mobil)
  pencere.addEventListener('touchstart', baslangicEvent, { passive: true });
  pencere.addEventListener('touchmove', hareketEvent, { passive: true });
  pencere.addEventListener('touchend', bitisEvent);
  pencere.addEventListener('touchcancel', bitisEvent);
  
  // Mouse events (desktop)
  pencere.addEventListener('mousedown', baslangicEvent);
  pencere.addEventListener('mousemove', hareketEvent);
  pencere.addEventListener('mouseup', bitisEvent);
  pencere.addEventListener('mouseleave', () => {
    if (surukleniyor) bitisEvent();
  });
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
  const lokasyon = p.lokasyon || 'Aydınlı Mah. Bahçeler Sk. No:45 Tuzla / İstanbul';
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
