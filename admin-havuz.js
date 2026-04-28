// ═══════════════════════════════════════════════════════════
// ADMIN - ADAY HAVUZU
// ═══════════════════════════════════════════════════════════

import { 
  auth, db,
  onAuthStateChanged,
  signOut,
  collection, doc, getDoc, getDocs, updateDoc,
  query, orderBy,
  serverTimestamp,
  ADMIN_EPOSTA
} from './firebase-config.js';

import { 
  POZISYON_KATEGORILERI,
  pozisyonKategorisiBul,
  tarihSaatFormatla,
  tarihFormatla,
  alertGoster
} from './yardimci.js';

let tumAdaylar = [];
let aktifAday = null;

// ───────────────────────────────────────────────
// Auth kontrol
// ───────────────────────────────────────────────
onAuthStateChanged(auth, async (kullanici) => {
  if (!kullanici || kullanici.email !== ADMIN_EPOSTA) {
    document.getElementById('yukleniyor').classList.add('gizli');
    document.getElementById('yetkisiz').classList.remove('gizli');
    return;
  }
  
  document.getElementById('yukleniyor').classList.add('gizli');
  document.getElementById('adminLayout').classList.remove('gizli');
  
  kategoriFiltreDoldur();
  await adaylariYukle();
});

// ───────────────────────────────────────────────
// Kategori filtresini doldur
// ───────────────────────────────────────────────
function kategoriFiltreDoldur() {
  const select = document.getElementById('kategoriFiltre');
  POZISYON_KATEGORILERI.forEach(kat => {
    const opt = document.createElement('option');
    opt.value = kat.id;
    opt.textContent = `${kat.ikon} ${kat.ad}`;
    select.appendChild(opt);
  });
}

// ───────────────────────────────────────────────
// Adayları yükle
// ───────────────────────────────────────────────
async function adaylariYukle() {
  try {
    const ref = collection(db, 'isBasvurulari');
    const q = query(ref, orderBy('olusturmaZamani', 'desc'));
    const snapshot = await getDocs(q);
    
    tumAdaylar = [];
    snapshot.forEach(doc => {
      tumAdaylar.push({ id: doc.id, ...doc.data() });
    });
    
    document.getElementById('adaySayisi').textContent = `Toplam ${tumAdaylar.length} aday`;
    filtreUygula();
    
  } catch (hata) {
    console.error('Aday yükleme hatası:', hata);
    document.getElementById('tabloAlani').innerHTML = `
      <div class="alert hata">Yüklenemedi: ${hata.message}</div>
    `;
  }
}

// ───────────────────────────────────────────────
// Filtre uygula
// ───────────────────────────────────────────────
window.filtreUygula = function() {
  let liste = [...tumAdaylar];
  
  const arama = document.getElementById('aramaInput').value.toLowerCase().trim();
  const kategori = document.getElementById('kategoriFiltre').value;
  const durum = document.getElementById('durumFiltre').value;
  const siralama = document.getElementById('siralama').value;
  
  if (arama) {
    liste = liste.filter(a => 
      (a.adayAdi || '').toLowerCase().includes(arama) ||
      (a.adayEposta || '').toLowerCase().includes(arama) ||
      (a.pozisyonBaslik || '').toLowerCase().includes(arama)
    );
  }
  
  if (kategori) {
    liste = liste.filter(a => a.kategoriId === kategori);
  }
  
  if (durum) {
    liste = liste.filter(a => a.durum === durum);
  }
  
  // Sıralama
  if (siralama === 'eski') {
    liste.reverse();
  } else if (siralama === 'ad') {
    liste.sort((a, b) => (a.adayAdi || '').localeCompare(b.adayAdi || '', 'tr'));
  }
  // 'yeni' default zaten desc geldiğimiz için
  
  tabloyuCiz(liste);
};

// ───────────────────────────────────────────────
// Tabloyu çiz
// ───────────────────────────────────────────────
function tabloyuCiz(liste) {
  const tablo = document.getElementById('tabloAlani');
  
  if (liste.length === 0) {
    tablo.innerHTML = `
      <p style="text-align: center; padding: 40px; color: var(--gri);">
        🔍 Filtreye uygun aday bulunamadı.
      </p>
    `;
    return;
  }
  
  let html = `
    <div class="tablo">
      <table>
        <thead>
          <tr>
            <th>Aday</th>
            <th>Pozisyon</th>
            <th>Durum</th>
            <th>Tarih</th>
            <th>Eylem</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  liste.forEach(a => {
    const kategori = pozisyonKategorisiBul(a.kategoriId || 'okulOncesiOgretmen');
    const durumHTML = durumRozetHTML(a.durum);
    
    html += `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${a.googleFoto 
              ? `<img src="${a.googleFoto}" style="width:36px; height:36px; border-radius:50%;">` 
              : `<div style="width:36px; height:36px; border-radius:50%; background:#e8f5e9; 
                   display:flex; align-items:center; justify-content:center; color:#2c5530; 
                   font-weight:700;">${(a.adayAdi || '?').charAt(0).toUpperCase()}</div>`
            }
            <div>
              <div style="font-weight: 600;">${a.adayAdi || '(İsim yok)'}</div>
              <div style="font-size: 12px; color: var(--gri);">${a.adayEposta || ''}</div>
            </div>
          </div>
        </td>
        <td>${kategori.ikon} ${a.pozisyonBaslik || kategori.ad}</td>
        <td>${durumHTML}</td>
        <td>${a.olusturmaZamani ? tarihFormatla(a.olusturmaZamani) : '-'}</td>
        <td>
          <button class="btn btn-kucuk btn-ikincil" onclick="adayDetay('${a.id}')">
            📋 Detay
          </button>
        </td>
      </tr>
    `;
  });
  
  html += '</tbody></table></div>';
  html += `<div style="margin-top: 12px; font-size: 13px; color: var(--gri); text-align: right;">
    ${liste.length} aday gösteriliyor
  </div>`;
  
  tablo.innerHTML = html;
}

// ───────────────────────────────────────────────
// Durum rozeti
// ───────────────────────────────────────────────
function durumRozetHTML(durum) {
  const etiketler = {
    'bilgilerEksik': { ad: '⏸️ Bilgi bekleniyor', renk: '#999', bg: '#f5f5f5' },
    'testEksik': { ad: '🟡 Test bekleniyor', renk: '#f57c00', bg: '#fff3e0' },
    'tamamlandi': { ad: '✅ Tamamlandı', renk: '#2c5530', bg: '#d4f5d4' },
    'mulakat': { ad: '🎙️ Mülakat', renk: '#1976d2', bg: '#e3f2fd' },
    'kabul': { ad: '🎉 Kabul', renk: '#fff', bg: '#2c5530' },
    'red': { ad: '❌ Red', renk: '#fff', bg: '#d32f2f' },
    'havuz': { ad: '🌊 Havuz', renk: '#1976d2', bg: '#e3f2fd' }
  };
  const e = etiketler[durum] || { ad: durum || '-', renk: '#666', bg: '#f5f5f5' };
  return `<span style="background:${e.bg}; color:${e.renk}; padding:4px 10px; 
    border-radius:12px; font-size:12px; font-weight:600;">${e.ad}</span>`;
}

// ───────────────────────────────────────────────
// Aday detayını aç
// ───────────────────────────────────────────────
window.adayDetay = function(adayId) {
  aktifAday = tumAdaylar.find(a => a.id === adayId);
  if (!aktifAday) return;
  
  document.getElementById('detayBaslik').textContent = `📋 ${aktifAday.adayAdi || aktifAday.adayEposta}`;
  document.getElementById('listeGorunumu').classList.add('gizli');
  document.getElementById('detayGorunumu').classList.remove('gizli');
  
  detayCiz();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.listeyeDon = function() {
  document.getElementById('detayGorunumu').classList.add('gizli');
  document.getElementById('listeGorunumu').classList.remove('gizli');
  aktifAday = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ───────────────────────────────────────────────
// Detay görünümü
// ───────────────────────────────────────────────
function detayCiz() {
  const a = aktifAday;
  const kategori = pozisyonKategorisiBul(a.kategoriId || 'okulOncesiOgretmen');
  const detay = document.getElementById('detayIcerik');
  
  // Kişisel bilgiler (varsa)
  const k = a.kisiselBilgiler || {};
  
  let html = `
    <!-- ÜST KART: TEMEL BİLGİ -->
    <div class="kart">
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px; flex-wrap: wrap;">
        ${a.googleFoto 
          ? `<img src="${a.googleFoto}" style="width:64px; height:64px; border-radius:50%; flex-shrink:0;">` 
          : `<div style="width:64px; height:64px; border-radius:50%; background:#e8f5e9; 
               display:flex; align-items:center; justify-content:center; color:#2c5530; 
               font-weight:700; font-size:28px; flex-shrink:0;">
               ${(a.adayAdi || '?').charAt(0).toUpperCase()}
             </div>`
        }
        <div style="flex: 1; min-width: 200px;">
          <h2 style="color: var(--ana-yesil); margin: 0 0 6px;">${a.adayAdi || '(İsim yok)'}</h2>
          <div style="color: var(--gri); font-size: 14px;">📧 ${a.adayEposta || '-'}</div>
          ${k.telefon ? `<div style="color: var(--gri); font-size: 14px;">📱 0${k.telefon}</div>` : ''}
        </div>
        <div>${durumRozetHTML(a.durum)}</div>
      </div>
      
      <div style="background: var(--cok-acik-yesil); padding: 12px 16px; border-radius: 8px;">
        <strong>${kategori.ikon} Pozisyon:</strong> ${a.pozisyonBaslik || kategori.ad}<br>
        <small style="color: var(--gri);">
          Başvuru Tarihi: ${a.olusturmaZamani ? tarihSaatFormatla(a.olusturmaZamani) : '-'}
          ${a.tekrarBasvuruZamani ? '<br>Tekrar Başvuru: ' + tarihSaatFormatla(a.tekrarBasvuruZamani) : ''}
        </small>
      </div>
    </div>
    
    <!-- DURUM DEĞİŞTİRME -->
    <div class="kart">
      <h3>⚙️ Durumu Değiştir</h3>
      <p style="color: var(--gri); font-size: 14px;">
        Adayın durumunu değiştirdiğinizde, kullanıcı tekrar giriş yaptığında ona uygun bilgilendirme popup'ı gösterilecektir.
      </p>
      
      <div class="form-grup">
        <select id="yeniDurum">
          <option value="bilgilerEksik" ${a.durum === 'bilgilerEksik' ? 'selected' : ''}>⏸️ Bilgi bekleniyor</option>
          <option value="testEksik" ${a.durum === 'testEksik' ? 'selected' : ''}>🟡 Test bekleniyor</option>
          <option value="tamamlandi" ${a.durum === 'tamamlandi' ? 'selected' : ''}>✅ Tamamlandı (değerlendirme aşamasında)</option>
          <option value="mulakat" ${a.durum === 'mulakat' ? 'selected' : ''}>🎙️ Mülakat aşamasında</option>
          <option value="kabul" ${a.durum === 'kabul' ? 'selected' : ''}>🎉 Kabul edildi</option>
          <option value="red" ${a.durum === 'red' ? 'selected' : ''}>❌ Reddedildi</option>
          <option value="havuz" ${a.durum === 'havuz' ? 'selected' : ''}>🌊 Havuzda</option>
        </select>
      </div>
      
      <div class="form-grup">
        <label>Admin Notu (isteğe bağlı, sadece sizin görmeniz için)</label>
        <textarea id="adminNotu" rows="3" placeholder="Bu adayla ilgili notlarınız...">${a.adminNotu || ''}</textarea>
      </div>
      
      <button class="btn" onclick="durumGuncelle()">💾 Durumu Kaydet</button>
    </div>
  `;
  
  // Kişisel bilgiler
  if (Object.keys(k).length > 0) {
    html += `
    <div class="kart">
      <h3>👤 Kişisel Bilgiler</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${k.adSoyad ? `<tr><td style="padding:8px; color:#666; width:140px;">Ad Soyad:</td><td style="padding:8px;"><strong>${k.adSoyad}</strong></td></tr>` : ''}
        ${k.dogumTarihi ? `<tr><td style="padding:8px; color:#666;">Doğum Tarihi:</td><td style="padding:8px;">${k.dogumTarihi}</td></tr>` : ''}
        ${k.cinsiyet ? `<tr><td style="padding:8px; color:#666;">Cinsiyet:</td><td style="padding:8px;">${k.cinsiyet}</td></tr>` : ''}
        ${k.medeniDurum ? `<tr><td style="padding:8px; color:#666;">Medeni Durum:</td><td style="padding:8px;">${k.medeniDurum}</td></tr>` : ''}
        ${k.adres ? `<tr><td style="padding:8px; color:#666;">Adres:</td><td style="padding:8px;">${k.adres}</td></tr>` : ''}
        ${k.egitimDurumu ? `<tr><td style="padding:8px; color:#666;">Eğitim:</td><td style="padding:8px;">${k.egitimDurumu}</td></tr>` : ''}
        ${k.bolum ? `<tr><td style="padding:8px; color:#666;">Bölüm:</td><td style="padding:8px;">${k.bolum}</td></tr>` : ''}
        ${k.deneyimYil ? `<tr><td style="padding:8px; color:#666;">Deneyim:</td><td style="padding:8px;">${k.deneyimYil} yıl</td></tr>` : ''}
        ${k.aciklamaDeneyim ? `<tr><td style="padding:8px; color:#666; vertical-align:top;">Önceki Deneyim:</td><td style="padding:8px; white-space:pre-wrap;">${k.aciklamaDeneyim}</td></tr>` : ''}
      </table>
    </div>
    `;
  }
  
  // Eski başvuru uyarısı
  if (a.eskiBasvuruVarUyari) {
    html += `
    <div class="kart" style="background: #fff3cd;">
      <h3>⚠️ Bu Aday Tekrar Başvurdu</h3>
      <p>
        <strong>Eski pozisyon:</strong> ${a.eskiPozisyonBaslik || '-'}<br>
        <strong>Yeni pozisyon:</strong> ${a.pozisyonBaslik}<br>
        <small style="color: var(--gri);">
          Aday önce başka bir pozisyona başvurmuş, sonra bu pozisyonu seçmiş.
        </small>
      </p>
    </div>
    `;
  }
  
  // İletişim aksiyonları
  html += `
    <div class="kart">
      <h3>📞 Hızlı İletişim</h3>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <a href="mailto:${a.adayEposta}" class="btn btn-ikincil btn-kucuk">
          ✉️ Mail Gönder
        </a>
        ${k.telefon ? `
          <a href="tel:0${k.telefon}" class="btn btn-ikincil btn-kucuk">
            📞 Ara
          </a>
          <a href="https://wa.me/90${k.telefon}" target="_blank" class="btn btn-ikincil btn-kucuk">
            💬 WhatsApp
          </a>
        ` : ''}
      </div>
    </div>
  `;
  
  detay.innerHTML = html;
}

// ───────────────────────────────────────────────
// Durum güncelle
// ───────────────────────────────────────────────
window.durumGuncelle = async function() {
  if (!aktifAday) return;
  
  const yeniDurum = document.getElementById('yeniDurum').value;
  const adminNotu = document.getElementById('adminNotu').value.trim();
  
  try {
    await updateDoc(doc(db, 'isBasvurulari', aktifAday.id), {
      durum: yeniDurum,
      adminNotu: adminNotu || null,
      durumGuncellemeZamani: serverTimestamp()
    });
    
    // Local state'i güncelle
    aktifAday.durum = yeniDurum;
    aktifAday.adminNotu = adminNotu;
    
    const idx = tumAdaylar.findIndex(a => a.id === aktifAday.id);
    if (idx >= 0) {
      tumAdaylar[idx].durum = yeniDurum;
      tumAdaylar[idx].adminNotu = adminNotu;
    }
    
    alertGoster('basarili', '✅ Durum güncellendi! Aday tekrar giriş yaptığında bilgilendirilecek.', 'detayAlertAlani');
    
    detayCiz();
    
  } catch (hata) {
    alertGoster('hata', 'Güncellenemedi: ' + hata.message, 'detayAlertAlani');
  }
};

window.cikisYap = async function() {
  await signOut(auth);
  window.location.href = 'index.html';
};
