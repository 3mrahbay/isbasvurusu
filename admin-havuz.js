// ═══════════════════════════════════════════════════════════
// ADMIN - ADAY HAVUZU
// ═══════════════════════════════════════════════════════════

import { 
  auth, db,
  onAuthStateChanged,
  signOut,
  collection, doc, getDoc, getDocs, updateDoc, setDoc, deleteDoc,
  query, orderBy,
  serverTimestamp,
  PROXY_URL,
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
            <th>💰 Maaş Bek.</th>
            <th>Tarih</th>
            <th>Eylem</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  liste.forEach(a => {
    const kategori = pozisyonKategorisiBul(a.kategoriId || 'okulOncesiOgretmen');
    const durumHTML = durumRozetHTML(a.durum);
    
    // Maaş beklentisi
    const maas = a.kisiselBilgiler?.ucretBeklenti;
    const maasHTML = maas 
      ? `<strong style="color:#2c5530;">${parseInt(maas).toLocaleString('tr-TR')} TL</strong>` 
      : '<span style="color:#bbb;">-</span>';
    
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
        <td>${maasHTML}</td>
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
  
  // Kişisel bilgiler — yeni kayıtlar kök seviyede, eski kayıtlar kisiselBilgiler altında olabilir
  const k = (a.kisiselBilgiler && Object.keys(a.kisiselBilgiler).length > 0) ? a.kisiselBilgiler : a;
  
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
          ${(k.telefon || a.telefon) ? `<div style="color: var(--gri); font-size: 14px;">📱 0${k.telefon || a.telefon}</div>` : ''}
          ${(k.eposta && k.eposta !== a.adayEposta) ? `<div style="color: var(--gri); font-size: 13px;">✉️ İletişim: ${k.eposta}</div>` : ''}
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
    
    <!-- 🔄 TEST SIFIRLAMA -->
    <div class="kart" style="background: #fff3e0; border-left: 4px solid #f57c00;">
      <h3 style="color: #e65100;">🔄 Adayın Testini Sıfırla</h3>
      <p style="color: var(--gri); font-size: 14px;">
        Adayın test cevaplarını ve AI analizini SİLER. Aday tekrar giriş yaptığında 
        baştan test çözmek zorunda kalır. Bu adayın cevaplarında problem varsa kullanın.
      </p>
      <button class="btn" onclick="testiSifirla('${a.adayEposta}')" 
              style="background: #f57c00;">
        🗑️ Test Cevaplarını ve Analizi Sil
      </button>
    </div>
  `;
  
  // Kişisel bilgiler
  if (Object.keys(k).length > 0) {
    // Maaş için TL formatı
    const maasFormat = (v) => v ? `<strong style="color:#2c5530; font-size:15px;">${parseInt(v).toLocaleString('tr-TR')} TL</strong>` : '-';
    
    // Mevcut iş durumu çevirisi
    const isDurumlari = {
      'issiz': '🔍 İş arıyor (çalışmıyor)',
      'aktif': '💼 Çalışıyor, geçiş arıyor',
      'staj': '🎓 Stajda',
      'ogrenci': '📚 Öğrenci'
    };
    
    html += `
    <div class="kart">
      <h3>👤 Kişisel Bilgiler</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${(a.adayAdi || (k.ad && k.soyad)) ? `<tr><td style="padding:8px; color:#666; width:160px;">Ad Soyad:</td><td style="padding:8px;"><strong>${a.adayAdi || (k.ad + ' ' + k.soyad)}</strong></td></tr>` : ''}
        ${(k.telefon || a.telefon) ? `<tr><td style="padding:8px; color:#666;">Telefon:</td><td style="padding:8px;">0${k.telefon || a.telefon}</td></tr>` : ''}
        ${k.eposta ? `<tr><td style="padding:8px; color:#666;">E-posta:</td><td style="padding:8px;">${k.eposta}</td></tr>` : ''}
        ${k.dogumTarihi ? `<tr><td style="padding:8px; color:#666;">Doğum Tarihi:</td><td style="padding:8px;">${k.dogumTarihi}</td></tr>` : ''}
        ${k.cinsiyet ? `<tr><td style="padding:8px; color:#666;">Cinsiyet:</td><td style="padding:8px;">${k.cinsiyet}</td></tr>` : ''}
        ${k.medeniDurum ? `<tr><td style="padding:8px; color:#666;">Medeni Durum:</td><td style="padding:8px;">${k.medeniDurum}</td></tr>` : ''}
        ${k.adres ? `<tr><td style="padding:8px; color:#666;">İkamet:</td><td style="padding:8px;">${k.adres}</td></tr>` : ''}
        ${k.egitimDurumu ? `<tr><td style="padding:8px; color:#666;">Eğitim:</td><td style="padding:8px;">${k.egitimDurumu}${k.bolum ? ' — ' + k.bolum : ''}${k.okul ? ' (' + k.okul + ')' : ''}</td></tr>` : ''}
        ${(k.deneyimYili || k.deneyimYil) ? `<tr><td style="padding:8px; color:#666;">Toplam Deneyim:</td><td style="padding:8px;">${k.deneyimYili || k.deneyimYil} yıl</td></tr>` : ''}
        ${k.sertifikalar ? `<tr><td style="padding:8px; color:#666; vertical-align:top;">Sertifikalar:</td><td style="padding:8px; white-space:pre-wrap;">${k.sertifikalar}</td></tr>` : ''}
      </table>
      ${deneyimGecmisiHTML(k)}
    </div>
    
    ${cvKartiHTML(a, k)}
    
    <!-- 💰 ÇALIŞMA TERCİHLERİ - VURGULU KART -->
    <div class="kart" style="background: linear-gradient(135deg, #f8fffa 0%, white 100%); border-left: 4px solid var(--ana-yesil);">
      <h3>💰 Çalışma Tercihleri</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding:10px; color:#666; width:160px;">Maaş Beklentisi:</td>
          <td style="padding:10px;">${maasFormat(k.ucretBeklenti)}</td>
        </tr>
        ${k.baslamaTarihi ? `<tr><td style="padding:10px; color:#666;">Başlama Tarihi:</td><td style="padding:10px;"><strong>${k.baslamaTarihi}</strong></td></tr>` : ''}
        ${k.mevcutIsDurumu ? `<tr><td style="padding:10px; color:#666;">Mevcut Durum:</td><td style="padding:10px;">${isDurumlari[k.mevcutIsDurumu] || k.mevcutIsDurumu}</td></tr>` : ''}
        ${k.duyumKaynagi ? `<tr><td style="padding:10px; color:#666;">Bizi Nereden Duydu:</td><td style="padding:10px;">${k.duyumKaynagi}</td></tr>` : ''}
        ${k.nedenBCK ? `<tr><td style="padding:10px; color:#666; vertical-align:top;">Neden BCK?</td><td style="padding:10px; white-space:pre-wrap; font-style:italic; color:#444;">"${k.nedenBCK}"</td></tr>` : ''}
      </table>
    </div>
    
    ${(k.ozelEgitim && k.ozelEgitim !== 'hicbiri') || k.yabanciDil || k.sertifikalar ? `
    <div class="kart">
      <h3>🎓 Yetkinlikler</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${k.ozelEgitim && k.ozelEgitim !== 'hicbiri' ? `<tr><td style="padding:8px; color:#666; width:160px;">Özel Eğitim:</td><td style="padding:8px;"><strong>${k.ozelEgitim}</strong></td></tr>` : ''}
        ${k.yabanciDil && k.yabanciDil !== 'hicbiri' ? `<tr><td style="padding:8px; color:#666;">Yabancı Dil:</td><td style="padding:8px;">${k.yabanciDil}</td></tr>` : ''}
        ${k.sertifikalar ? `<tr><td style="padding:8px; color:#666; vertical-align:top;">Sertifikalar:</td><td style="padding:8px; white-space:pre-wrap;">${k.sertifikalar}</td></tr>` : ''}
      </table>
    </div>
    ` : ''}
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
    
    ${mulakatProfiliButonHTML(a)}
    
    <!-- 🤖 AI ANALİZ RAPORU - Async yüklenecek -->
    <div id="aiRaporAlani"></div>
    
    <!-- 📝 TEST CEVAPLARI - Async yüklenecek -->
    <div id="testCevaplariAlani"></div>
  `;
  
  detay.innerHTML = html;
  
  // AI rapor ve test cevaplarını async yükle
  aiRaporYukle(a.adayEposta);
  testCevaplariYukle(a.adayEposta);
}

// ───────────────────────────────────────────────
// AI RAPORUNU YÜKLE
// ───────────────────────────────────────────────
async function aiRaporYukle(adayEposta) {
  const alani = document.getElementById('aiRaporAlani');
  if (!alani) return;
  
  alani.innerHTML = `
    <div class="kart">
      <h3>🤖 AI Analiz Raporu</h3>
      <div class="yukleniyor" style="padding: 20px;">
        <div class="donme" style="width: 30px; height: 30px;"></div>
        <p style="font-size: 14px;">AI raporu yükleniyor...</p>
      </div>
    </div>
  `;
  
  try {
    const ref = doc(db, 'analizler', adayEposta);
    const snap = await getDoc(ref);
    
    if (!snap.exists()) {
      alani.innerHTML = `
        <div class="kart">
          <h3>🤖 AI Analiz Raporu</h3>
          <p style="color: var(--gri); margin-bottom: 16px;">
            Bu aday için henüz AI analizi oluşturulmamış. Test tamamlanmış ancak analiz arka planda 
            başarısız olmuş olabilir veya henüz tetiklenmemiş.
          </p>
          <button class="btn" onclick="aiAnaliziManuelTetikle('${adayEposta}')">
            🚀 AI Analizini Şimdi Çalıştır
          </button>
          <div id="aiManuelDurum" style="margin-top: 12px;"></div>
        </div>
      `;
      return;
    }
    
    const veri = snap.data();
    const analiz = veri.analiz;
    
    if (!analiz) {
      alani.innerHTML = `<div class="kart"><h3>🤖 AI Raporu</h3><p>Analiz verisi boş.</p></div>`;
      return;
    }
    
    // 🔍 Davranış analizi için test cevaplarını da yükle
    let davranisAnalizi = null;
    try {
      const testRef = doc(db, 'testCevaplari', adayEposta);
      const testSnap = await getDoc(testRef);
      if (testSnap.exists()) {
        davranisAnalizi = testSnap.data().davranisAnalizi || null;
      }
    } catch (e) {
      console.warn('Test cevapları yüklenemedi:', e);
    }
    
    alani.innerHTML = aiRaporHTML(analiz, veri, davranisAnalizi);
    
  } catch (hata) {
    console.error('AI rapor yükleme hatası:', hata);
    alani.innerHTML = `
      <div class="kart">
        <h3>🤖 AI Analiz Raporu</h3>
        <div class="alert hata">Yüklenemedi: ${hata.message}</div>
      </div>
    `;
  }
}

// ───────────────────────────────────────────────
// AI Raporu HTML
// ───────────────────────────────────────────────
function aiRaporHTML(analiz, veri, davranisAnalizi) {
  const skor = analiz.genelUyumSkoru || 0;
  const etiket = analiz.tavsiyeEtiketi || 'degerlendirilmeli';
  
  // Etiket renk ve metin
  const etiketler = {
    'guclu': { renk: '#2c5530', bg: '#d4f5d4', metin: '🟢 GÜÇLÜ ADAY', emoji: '🌟' },
    'degerlendirilmeli': { renk: '#f57c00', bg: '#fff3e0', metin: '🟡 DEĞERLENDİRİLMELİ', emoji: '🤔' },
    'uygunDegil': { renk: '#d32f2f', bg: '#ffebee', metin: '🔴 UYGUN DEĞİL', emoji: '⚠️' }
  };
  const e = etiketler[etiket] || etiketler['degerlendirilmeli'];
  
  // Kırmızı bayraklar
  let bayraklarHTML = '';
  if (analiz.kirmiziBayraklar && analiz.kirmiziBayraklar.length > 0) {
    bayraklarHTML = `
      <div class="kart" style="background: #ffebee; border-left: 4px solid #d32f2f;">
        <h3 style="color: #d32f2f;">🚨 Kırmızı Bayraklar (${analiz.kirmiziBayraklar.length})</h3>
        <ul style="padding-left: 20px;">
          ${analiz.kirmiziBayraklar.map(b => {
            if (typeof b === 'string') return `<li style="margin-bottom: 8px;">${b}</li>`;
            return `<li style="margin-bottom: 8px;">
              <strong>${b.soruId || 'Bayrak'}:</strong> 
              ${b.aciklama || `Seçim: ${b.secilen}, Doğru: ${b.dogru || '?'}`}
              ${b.kritiklik === 'cokYuksek' ? ' <span style="color:#d32f2f;font-weight:700;">[ÇOK KRİTİK]</span>' : ''}
            </li>`;
          }).join('')}
        </ul>
      </div>
    `;
  }
  
  // Big Five
  const bigFive = analiz.bigFive || {};
  const bigFiveHTML = `
    <div class="kart">
      <h3>🧠 Kişilik Profili (Big Five)</h3>
      <div class="bigFive-grid">
        ${cubukChart('Açıklık', bigFive.aciklik || 0, '#9c27b0')}
        ${cubukChart('Sorumluluk', bigFive.sorumluluk || 0, '#1976d2')}
        ${cubukChart('Dışa Dönüklük', bigFive.disaDonukluk || 0, '#f57c00')}
        ${cubukChart('Uyumluluk ⭐', bigFive.uyumluluk || 0, '#2c5530')}
        ${cubukChart('Duygusal Denge', bigFive.duygusalDenge || 0, '#0097a7')}
      </div>
      <p style="font-size: 12px; color: var(--gri); margin-top: 12px;">
        ⭐ Uyumluluk öğretmenler için en kritik boyuttur (empati, işbirliği)
      </p>
    </div>
  `;
  
  // 8 Yetkinlik
  const yet = analiz.yetkinlikler || {};
  const yetkinliklerHTML = `
    <div class="kart">
      <h3>🎯 8 Yetkinlik Analizi</h3>
      <div class="bigFive-grid">
        ${cubukChart('💚 Empati', yet.empati || 0, '#2c5530')}
        ${cubukChart('🧘 Sabır', yet.sabir || 0, '#4a7c59')}
        ${cubukChart('📚 Pedagojik Yaklaşım', yet.pedagojikYaklasim || 0, '#1976d2')}
        ${cubukChart('🛡️ Çocuk Koruma', yet.cocukKorumaFarkindaligi || 0, '#d32f2f')}
        ${cubukChart('🤝 Ekip Çalışması', yet.ekipCalismasi || 0, '#f57c00')}
        ${cubukChart('💬 İletişim', yet.iletisim || 0, '#9c27b0')}
        ${cubukChart('🌪️ Stres Yönetimi', yet.stresYonetimi || 0, '#0097a7')}
        ${cubukChart('🌱 Montessori Uyumu', yet.montessoriUyumu || 0, '#2c5530')}
      </div>
    </div>
  `;
  
  // Güçlü yönler / gelişim alanları
  const gucluHTML = (analiz.gucluYonler && analiz.gucluYonler.length > 0)
    ? `<div class="kart" style="background: #e8f5e9;">
        <h3 style="color: var(--ana-yesil);">✨ Güçlü Yönler</h3>
        <ul style="padding-left: 20px;">
          ${analiz.gucluYonler.map(y => `<li style="margin-bottom: 8px;">${y}</li>`).join('')}
        </ul>
      </div>`
    : '';
  
  const gelisimHTML = (analiz.gelisimAlanlari && analiz.gelisimAlanlari.length > 0)
    ? `<div class="kart" style="background: #fff3e0;">
        <h3 style="color: var(--turuncu);">🌱 Gelişim Alanları</h3>
        <ul style="padding-left: 20px;">
          ${analiz.gelisimAlanlari.map(g => `<li style="margin-bottom: 8px;">${g}</li>`).join('')}
        </ul>
      </div>`
    : '';
  
  // AI Yorumu
  const yorumHTML = analiz.aiYorumu
    ? `<div class="kart">
        <h3>📝 AI Değerlendirmesi</h3>
        <div style="line-height: 1.8; white-space: pre-wrap;">${analiz.aiYorumu}</div>
      </div>`
    : '';
  
  // Hikaye analizi
  const hik = analiz.hikayeAnalizi || {};
  const hikayeAnalizHTML = (hik.h01_anisamimi || hik.h02_yaklasim || hik.h03_motivasyon)
    ? `<div class="kart">
        <h3>📖 Hikaye Analizi</h3>
        ${hik.h01_anisamimi ? `<p><strong>1️⃣ Çocuk Anısı:</strong> ${hik.h01_anisamimi}</p>` : ''}
        ${hik.h02_yaklasim ? `<p><strong>2️⃣ "Ben Kötüyüm" Diyen Çocuğa Yaklaşım:</strong> ${hik.h02_yaklasim}</p>` : ''}
        ${hik.h03_motivasyon ? `<p><strong>3️⃣ Mesleğe Geliş Motivasyonu:</strong> ${hik.h03_motivasyon}</p>` : ''}
      </div>`
    : '';
  
  // Mülakat önerileri
  const mulakatHTML = (analiz.mulakatOnerileri && analiz.mulakatOnerileri.length > 0)
    ? `<div class="kart" style="background: #e3f2fd;">
        <h3 style="color: #1976d2;">🎙️ Mülakat Soru Önerileri</h3>
        <p style="color: var(--gri); font-size: 13px;">Adayın cevaplarına göre özel olarak hazırlanmış sorular:</p>
        <ol style="padding-left: 20px;">
          ${analiz.mulakatOnerileri.map(s => `<li style="margin-bottom: 12px; line-height: 1.6;">${s}</li>`).join('')}
        </ol>
      </div>`
    : '';
  
  // Diğer pozisyon uyumu
  const diger = analiz.digerPozisyonUyumu || {};
  const digerHTML = (diger.egitimKoordinatoru || diger.bransOgretmeni || diger.yardimciOgretmen)
    ? `<div class="kart">
        <h3>🎯 Diğer Pozisyonlara Uyum</h3>
        <p style="color: var(--gri); font-size: 13px;">Bu aday başvurduğu pozisyonun yanında diğer rollere de uygun olabilir:</p>
        ${diger.egitimKoordinatoru ? cubukChart('🎓 Eğitim Koordinatörü', diger.egitimKoordinatoru, '#7b1fa2') : ''}
        ${diger.bransOgretmeni ? cubukChart('🎨 Branş Öğretmeni', diger.bransOgretmeni, '#f57c00') : ''}
        ${diger.yardimciOgretmen ? cubukChart('🌱 Yardımcı Öğretmen', diger.yardimciOgretmen, '#0097a7') : ''}
      </div>`
    : '';
  
  return `
    <!-- GENEL SKOR KARTI -->
    <div class="kart" style="background: linear-gradient(135deg, ${e.bg} 0%, #fff 100%); border-left: 4px solid ${e.renk};">
      <h3>🤖 AI Analiz Raporu</h3>
      
      <div style="display: flex; align-items: center; gap: 24px; margin: 20px 0; flex-wrap: wrap;">
        <!-- Skor Çemberi -->
        <div style="
          width: 120px; height: 120px; border-radius: 50%;
          background: conic-gradient(${e.renk} ${skor * 3.6}deg, #e0e0e0 0deg);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        ">
          <div style="
            width: 100px; height: 100px; border-radius: 50%;
            background: white; display: flex; flex-direction: column;
            align-items: center; justify-content: center;
          ">
            <div style="font-size: 28px; font-weight: 800; color: ${e.renk};">${skor}</div>
            <div style="font-size: 10px; color: #666;">/ 100</div>
          </div>
        </div>
        
        <!-- Etiket ve Bilgi -->
        <div style="flex: 1; min-width: 200px;">
          <div style="
            display: inline-block; background: ${e.bg}; color: ${e.renk};
            padding: 6px 16px; border-radius: 16px; font-weight: 700;
            font-size: 14px; margin-bottom: 12px;
          ">
            ${e.metin}
          </div>
          <div style="font-size: 14px; color: var(--metin); line-height: 1.6;">
            <div><strong>Tavsiye:</strong> ${etiketAciklama(etiket)}</div>
            ${veri.olusturmaZamani ? `<div style="color: var(--gri); font-size: 12px; margin-top: 4px;">
              Analiz tarihi: ${tarihSaatFormatla(veri.olusturmaZamani)}
            </div>` : ''}
          </div>
        </div>
      </div>
      
      <button class="btn btn-ikincil btn-kucuk" onclick="aiAnaliziManuelTetikle('${veri.adayEposta}')">
        🔄 Analizi Yeniden Çalıştır
      </button>
    </div>
    
    ${bayraklarHTML}
    ${bigFiveHTML}
    ${yetkinliklerHTML}
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;" class="iki-kolon-grid">
      ${gucluHTML}
      ${gelisimHTML}
    </div>
    
    ${yorumHTML}
    ${hikayeAnalizHTML}
    ${mulakatHTML}
    ${digerHTML}
    ${davranisAnaliziKartHTML(davranisAnalizi, analiz.sahtekarlikTespiti)}
  `;
}

// ───────────────────────────────────────────────
// 🔍 Davranış Analizi Kartı (Süre + Paste + AI Tespiti)
// ───────────────────────────────────────────────
function davranisAnaliziKartHTML(davranis, sahtekarlik) {
  if (!davranis && !sahtekarlik) return '';
  
  const da = davranis || {};
  const st = sahtekarlik || { yapilan: 'yok', aiKullanimIhtimali: 0 };
  
  // Toplam süre
  const toplamDk = Math.floor((da.toplamSureSn || 0) / 60);
  const toplamSn = (da.toplamSureSn || 0) % 60;
  const sureMetin = `${toplamDk} dakika ${toplamSn} saniye`;
  
  // İdeal süre kontrolü
  let sureRenk = '#2c5530';
  let sureIkon = '✅';
  let sureUyari = 'İdeal aralıkta';
  if (da.toplamSureSn < 8 * 60) {
    sureRenk = '#d32f2f'; sureIkon = '⚠️'; sureUyari = 'Çok hızlı! Acele cevap riski';
  } else if (da.toplamSureSn < 20 * 60) {
    sureRenk = '#f57c00'; sureIkon = '🟡'; sureUyari = 'Biraz hızlı';
  } else if (da.toplamSureSn > 60 * 60) {
    sureRenk = '#f57c00'; sureIkon = '🟡'; sureUyari = 'Çok yavaş - aşırı dikkat veya AI kullanımı?';
  }
  
  // Paste sayısı
  let toplamPaste = 0;
  let toplamPasteKarakter = 0;
  Object.values(da.pasteOlaylari || {}).forEach(arr => {
    arr.forEach(o => { toplamPaste++; toplamPasteKarakter += o.karakter; });
  });
  
  // Bölüm süreleri
  let bolumHTML = '';
  if (da.bolumSureleri) {
    const bolumAdlari = {
      1: 'Kişilik (Big Five)',
      2: 'Çocuk Değerleri',
      3: 'Sınıf Senaryoları',
      4: 'Hikayeler ✏️',
      5: 'Çocuk Koruma',
      6: 'Hızlı Tepkiler'
    };
    bolumHTML = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-top: 10px;">';
    Object.keys(da.bolumSureleri).forEach(no => {
      const sn = da.bolumSureleri[no];
      const dk = Math.floor(sn/60);
      bolumHTML += `
        <div style="background: white; padding: 10px; border-radius: 8px; border: 1px solid #e0e0e0;">
          <div style="font-size: 11px; color: #666;">${bolumAdlari[no] || 'Bölüm '+no}</div>
          <div style="font-weight: 700; color: #2c5530;">${dk}dk ${sn%60}sn</div>
        </div>
      `;
    });
    bolumHTML += '</div>';
  }
  
  // AI Tespit Seviyesi
  const aiSeviyeKonfig = {
    'yok': { renk: '#2c5530', bg: '#e8f5e9', emoji: '✅', metin: 'AI Kullanımı Tespit Edilmedi' },
    'supheli': { renk: '#f57c00', bg: '#fff3e0', emoji: '🟡', metin: 'Hafif Şüpheli - Mülakatta Sorulmalı' },
    'yuksekIhtimal': { renk: '#e65100', bg: '#ffe0b2', emoji: '🟠', metin: 'Yüksek İhtimal AI Kullanımı' },
    'kesin': { renk: '#d32f2f', bg: '#ffcdd2', emoji: '🚨', metin: 'KESIN AI / Kopya Yapıştırma!' }
  };
  const aiKonfig = aiSeviyeKonfig[st.yapilan] || aiSeviyeKonfig['yok'];
  
  return `
    <!-- 🔍 DAVRANIŞ ANALİZİ KARTI -->
    <div class="kart" style="background: linear-gradient(to right, #f5f0ff 0%, white 60%); border-left: 4px solid #764ba2; margin-top: 16px;">
      <h3 style="color: #764ba2;">🔍 Test Davranış Analizi & Sahtekarlık Tespiti</h3>
      <p style="color: var(--gri); font-size: 14px; margin-bottom: 16px;">
        Adayın test sırasındaki davranışları, AI/kopya kullanım ihtimali
      </p>
      
      <!-- AI TESPİT SEVİYESİ - VURGULU -->
      <div style="background: ${aiKonfig.bg}; padding: 16px; border-radius: 12px; margin-bottom: 16px; 
                  border-left: 4px solid ${aiKonfig.renk};">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="font-size: 13px; color: ${aiKonfig.renk}; font-weight: 600; margin-bottom: 4px;">
              🤖 AI / KOPYA TESPİT DURUMU
            </div>
            <div style="font-size: 18px; font-weight: 800; color: ${aiKonfig.renk};">
              ${aiKonfig.emoji} ${aiKonfig.metin}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: ${aiKonfig.renk};">AI KULLANIM İHTİMALİ</div>
            <div style="font-size: 32px; font-weight: 800; color: ${aiKonfig.renk};">
              %${st.aiKullanimIhtimali || 0}
            </div>
          </div>
        </div>
        ${st.yorumu ? `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.1); 
                      font-size: 14px; line-height: 1.6; color: ${aiKonfig.renk};">
            <strong>Yorum:</strong> ${st.yorumu}
          </div>
        ` : ''}
        ${st.kanitlar && st.kanitlar.length > 0 ? `
          <div style="margin-top: 12px;">
            <strong style="color: ${aiKonfig.renk}; font-size: 13px;">📋 Kanıtlar:</strong>
            <ul style="margin: 6px 0 0 20px; color: ${aiKonfig.renk}; font-size: 14px;">
              ${st.kanitlar.map(k => `<li style="margin-bottom: 4px;">${k}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
      
      <!-- METRIKLER GRID -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
        
        <!-- Toplam Süre -->
        <div style="background: white; padding: 16px; border-radius: 10px; border: 1px solid #e0e0e0; text-align: center;">
          <div style="font-size: 11px; color: #666; margin-bottom: 4px;">⏱️ TOPLAM SÜRE</div>
          <div style="font-size: 22px; font-weight: 700; color: ${sureRenk};">${sureMetin}</div>
          <div style="font-size: 12px; color: ${sureRenk}; margin-top: 4px;">${sureIkon} ${sureUyari}</div>
        </div>
        
        <!-- Paste Olayları -->
        <div style="background: white; padding: 16px; border-radius: 10px; border: 1px solid #e0e0e0; text-align: center;">
          <div style="font-size: 11px; color: #666; margin-bottom: 4px;">📋 YAPIŞTIRMA</div>
          <div style="font-size: 22px; font-weight: 700; color: ${toplamPaste > 0 ? '#d32f2f' : '#2c5530'};">
            ${toplamPaste > 0 ? `${toplamPaste} olay` : '✅ Yok'}
          </div>
          ${toplamPaste > 0 ? `
            <div style="font-size: 12px; color: #d32f2f; margin-top: 4px;">
              ${toplamPasteKarakter} karakter yapıştırıldı!
            </div>
          ` : `
            <div style="font-size: 12px; color: #2c5530; margin-top: 4px;">
              Tüm cevaplar yazılı
            </div>
          `}
        </div>
        
      </div>
      
      <!-- Bölüm Süreleri -->
      ${bolumHTML ? `
        <div style="margin-top: 16px;">
          <strong style="font-size: 13px; color: #666;">📊 Her Bölümde Geçirdiği Süre:</strong>
          ${bolumHTML}
        </div>
      ` : ''}
      
      <!-- Paste Detayları (varsa) -->
      ${toplamPaste > 0 ? `
        <div style="background: #fff3e0; padding: 12px; border-radius: 8px; margin-top: 16px; border-left: 3px solid #f57c00;">
          <strong style="color: #e65100; font-size: 13px;">⚠️ Yapıştırılan İçerikler:</strong>
          <div style="margin-top: 6px; font-size: 13px;">
            ${Object.keys(da.pasteOlaylari).map(soruId => {
              const olaylar = da.pasteOlaylari[soruId];
              return olaylar.map(o => `
                <div style="background: white; padding: 8px; border-radius: 6px; margin-top: 6px;">
                  <strong>${soruId}:</strong> ${o.karakter} karakter
                  ${o.ilkSatir ? `<div style="color: #666; font-style: italic; margin-top: 4px;">"${o.ilkSatir}..."</div>` : ''}
                </div>
              `).join('');
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

// ───────────────────────────────────────────────
// Çubuk grafik (skor görsel)
// ───────────────────────────────────────────────
function cubukChart(etiket, skor, renk = '#2c5530') {
  return `
    <div style="margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
        <span style="font-size: 14px; font-weight: 500;">${etiket}</span>
        <span style="font-size: 14px; font-weight: 700; color: ${renk};">${skor}</span>
      </div>
      <div style="background: #f0f0f0; height: 10px; border-radius: 5px; overflow: hidden;">
        <div style="
          width: ${skor}%; height: 100%; background: ${renk};
          border-radius: 5px; transition: width 0.6s;
        "></div>
      </div>
    </div>
  `;
}

function etiketAciklama(etiket) {
  const aciklamalar = {
    'guclu': 'Mülakata davet edilmesi tavsiye edilir',
    'degerlendirilmeli': 'Mülakatta detaylı görüşme önerilir',
    'uygunDegil': 'Bu pozisyon için uygun bulunmadı'
  };
  return aciklamalar[etiket] || '-';
}

// ───────────────────────────────────────────────
// Mülakat Profili Butonu (sadece test tamamlanmış adaylarda)
// ───────────────────────────────────────────────
function mulakatProfiliButonHTML(aday) {
  const testTamamlanmisDurumlar = ['tamamlandi', 'mulakat', 'kabul', 'red', 'havuz'];
  if (!testTamamlanmisDurumlar.includes(aday.durum)) {
    return ''; // Test henüz tamamlanmamış
  }
  
  return `
    <div class="kart" style="background: linear-gradient(135deg, #2c5530 0%, #4a7c59 100%); color: white; text-align: center;">
      <h3 style="color: white; margin-bottom: 12px;">🎙️ Mülakat Profili Hazır</h3>
      <p style="color: rgba(255,255,255,0.9); margin-bottom: 16px; line-height: 1.6;">
        Mülakat sırasında kullanmak üzere özel hazırlanmış profil:<br>
        <small style="opacity: 0.8;">
          ✓ AI'ın hazırladığı kişiselleştirilmiş sorular<br>
          ✓ Tutarsızlık ve manipülasyon uyarıları<br>
          ✓ Canlı not alma alanları<br>
          ✓ Final karar paneli
        </small>
      </p>
      <a href="mulakat.html?aday=${encodeURIComponent(aday.adayEposta)}" 
         class="btn btn-buyuk" 
         target="_blank"
         style="background: white; color: var(--ana-yesil);">
        🎙️ Mülakat Profilini Aç
      </a>
    </div>
    
    <!-- 🔄 TESTI SIFIRLAMA - Tehlikeli alan -->
    <div class="kart" style="background: #fff3e0; border-left: 4px solid var(--turuncu);">
      <h3 style="color: var(--turuncu);">🔄 Test Sıfırlama</h3>
      <p style="color: var(--gri); font-size: 14px; line-height: 1.6;">
        Eğer adayın test cevapları bozuksa veya yeniden test alması gerekiyorsa, 
        cevapları ve AI analizini silebilirsiniz. Bu işlem <strong>geri alınamaz</strong>.
      </p>
      <button class="btn btn-tehlike btn-kucuk" onclick="testiSifirla('${aday.adayEposta}')">
        🗑️ Test Cevaplarını ve AI Analizini Sil (Yeniden Test)
      </button>
    </div>
  `;
}

// ───────────────────────────────────────────────
// Testi Sıfırla (admin için)
// ───────────────────────────────────────────────
window.testiSifirla = async function(adayEposta) {
  const onay = confirm(
    '⚠️ DİKKAT: BU İŞLEM GERİ ALINAMAZ!\n\n' +
    'Bu adayın TÜM test cevapları, AI analizi ve mülakat notları silinecek.\n' +
    'Aday durumu "testEksik" olarak değişecek ve baştan test alabilecek.\n\n' +
    'Devam etmek istiyor musunuz?'
  );
  if (!onay) return;
  
  const onay2 = prompt(
    'Onaylamak için aday email\'ini yazınız:\n\n' + adayEposta
  );
  if (onay2 !== adayEposta) {
    alertGoster('uyari', 'Email eşleşmedi, işlem iptal edildi.', 'detayAlertAlani');
    return;
  }
  
  try {
    // testCevaplari sil
    try {
      await deleteDoc(doc(db, 'testCevaplari', adayEposta));
      console.log('✅ Test cevapları silindi');
    } catch (e) { console.warn('Test cevapları silinemedi:', e); }
    
    // analizler sil
    try {
      await deleteDoc(doc(db, 'analizler', adayEposta));
      console.log('✅ AI analizi silindi');
    } catch (e) { console.warn('AI analizi silinemedi:', e); }
    
    // mulakatNotlari sil
    try {
      await deleteDoc(doc(db, 'mulakatNotlari', adayEposta));
      console.log('✅ Mülakat notları silindi');
    } catch (e) { console.warn('Mülakat notları silinemedi:', e); }
    
    // Aday durumunu testEksik'e çevir
    await updateDoc(doc(db, 'isBasvurulari', adayEposta), {
      durum: 'testEksik',
      testTamamlanmaZamani: null,
      adminSifirlamaZamani: serverTimestamp()
    });
    
    alertGoster(
      'basarili', 
      '✅ Test verileri başarıyla silindi! Aday giriş yaptığında yeni baştan test alabilecek.', 
      'detayAlertAlani'
    );
    
    // 2 saniye sonra listeye dön
    setTimeout(() => {
      listeyeDon();
      adaylariYukle();
    }, 2000);
    
  } catch (hata) {
    console.error('Sıfırlama hatası:', hata);
    alertGoster('hata', 'İşlem başarısız: ' + hata.message, 'detayAlertAlani');
  }
};

// ───────────────────────────────────────────────
// AI Analizini manuel tetikle
// ───────────────────────────────────────────────
window.aiAnaliziManuelTetikle = async function(adayEposta) {
  const onay = confirm(
    'AI analizi başlatılacak. Yaklaşık 15-30 saniye sürer.\n\n' +
    'Mevcut analiz varsa üzerine yazılır. Devam edilsin mi?'
  );
  if (!onay) return;
  
  const durumEl = document.getElementById('aiManuelDurum') || document.getElementById('aiRaporAlani');
  durumEl.innerHTML = `
    <div class="alert bilgi">
      ⏳ <strong>AI analizi yapılıyor...</strong><br>
      <small>Lütfen bekleyin, sayfayı kapatmayın. (~15-30 saniye)</small>
    </div>
  `;
  
  try {
    // Aday bilgileri ve test cevaplarını al
    const basvuruSnap = await getDoc(doc(db, 'isBasvurulari', adayEposta));
    const testSnap = await getDoc(doc(db, 'testCevaplari', adayEposta));
    
    if (!basvuruSnap.exists() || !testSnap.exists()) {
      durumEl.innerHTML = `<div class="alert hata">❌ Aday başvurusu veya test cevapları bulunamadı.</div>`;
      return;
    }
    
    const basvuru = basvuruSnap.data();
    const testCevaplari = testSnap.data().cevaplar || {};
    
    // Apps Script proxy'ye gönder
    const yanit = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        islem: 'aiAnaliz',
        adayBilgileri: basvuru,
        testCevaplari: testCevaplari
      })
    });
    
    const sonuc = await yanit.json();
    
    if (!sonuc.basarili) {
      durumEl.innerHTML = `<div class="alert hata">❌ AI analiz hatası: ${sonuc.hata || 'Bilinmeyen hata'}</div>`;
      return;
    }
    
    // Firestore'a kaydet
    await setDoc(doc(db, 'analizler', adayEposta), {
      adayEposta: adayEposta,
      adayAdi: basvuru.adayAdi || '',
      analiz: sonuc.analiz,
      tokenKullanimi: sonuc.tokenKullanimi || null,
      olusturmaZamani: serverTimestamp()
    });
    
    durumEl.innerHTML = `<div class="alert basarili">✅ Analiz tamamlandı! Sayfayı yenileyin...</div>`;
    
    // 1.5 sn sonra raporu yeniden yükle
    setTimeout(() => aiRaporYukle(adayEposta), 1500);
    
  } catch (hata) {
    console.error('Manuel analiz hatası:', hata);
    durumEl.innerHTML = `<div class="alert hata">❌ Hata: ${hata.message}</div>`;
  }
};

// ───────────────────────────────────────────────
// Test cevaplarını yükle (toggle ile)
// ───────────────────────────────────────────────
async function testCevaplariYukle(adayEposta) {
  const alani = document.getElementById('testCevaplariAlani');
  if (!alani) return;
  
  try {
    const snap = await getDoc(doc(db, 'testCevaplari', adayEposta));
    
    if (!snap.exists()) {
      alani.innerHTML = `
        <div class="kart">
          <h3>📝 Test Cevapları</h3>
          <p style="color: var(--gri);">Bu aday için test cevabı bulunmadı.</p>
        </div>
      `;
      return;
    }
    
    const veri = snap.data();
    const cevaplar = veri.cevaplar || {};
    
    alani.innerHTML = `
      <div class="kart">
        <h3>📝 Test Cevapları</h3>
        <p style="color: var(--gri); font-size: 14px;">
          Toplam ${Object.keys(cevaplar).length} cevap • 
          ${veri.tamamlandi ? '✅ Tamamlandı' : '⏳ Devam ediyor'}
        </p>
        <button class="btn btn-ikincil btn-kucuk" onclick="testCevaplariToggle()">
          📂 Tüm Cevapları Göster/Gizle
        </button>
        <div id="cevaplarDetay" class="gizli" style="margin-top: 16px;">
          ${cevaplarDetayHTML(cevaplar)}
        </div>
      </div>
    `;
  } catch (hata) {
    console.error('Test cevap yükleme hatası:', hata);
  }
}

window.testCevaplariToggle = function() {
  const el = document.getElementById('cevaplarDetay');
  if (el) el.classList.toggle('gizli');
};

// ───────────────────────────────────────────────
// Son 3 deneyim geçmişi HTML
// ───────────────────────────────────────────────
function deneyimGecmisiHTML(k) {
  const deneyimler = [];
  for (let i = 1; i <= 3; i++) {
    const kurum = k['deneyim' + i + 'Kurum'];
    const pozisyon = k['deneyim' + i + 'Pozisyon'];
    const sure = k['deneyim' + i + 'Sure'];
    if (kurum || pozisyon || sure) {
      deneyimler.push({ kurum, pozisyon, sure });
    }
  }
  
  // Eski format (tek sonIsyeri) fallback
  if (deneyimler.length === 0 && k.sonIsyeri) {
    deneyimler.push({ kurum: k.sonIsyeri, pozisyon: '', sure: '' });
  }
  
  if (deneyimler.length === 0) return '';
  
  let html = `<div style="margin-top: 14px;">
    <div style="font-weight:600; color:#2c5530; margin-bottom:8px; font-size:14px;">💼 Son Deneyimler</div>`;
  deneyimler.forEach((d, idx) => {
    html += `
      <div style="background:#f8faf9; border-left:3px solid var(--ana-yesil); border-radius:6px; padding:10px 12px; margin-bottom:8px;">
        <div style="font-weight:600; color:#1a1a1a; font-size:14px;">${d.kurum || '(Kurum belirtilmemiş)'}</div>
        <div style="color:#666; font-size:13px; margin-top:2px;">
          ${d.pozisyon ? d.pozisyon : ''}${d.pozisyon && d.sure ? ' • ' : ''}${d.sure ? '⏱ ' + d.sure : ''}
        </div>
      </div>`;
  });
  html += '</div>';
  return html;
}

// ───────────────────────────────────────────────
// CV kartı HTML (görüntüle / indir)
// ───────────────────────────────────────────────
function cvKartiHTML(a, k) {
  const cvUrl = a.cvUrl || k.cvUrl;
  const cvAd = a.cvDosyaAdi || k.cvDosyaAdi || 'CV';
  const cvBoyut = a.cvBoyut || k.cvBoyut;
  
  if (cvUrl) {
    return `
    <div class="kart" style="background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%); border-left: 4px solid var(--ana-yesil);">
      <h3>📄 Özgeçmiş (CV)</h3>
      <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:14px 18px; border-radius:10px; flex-wrap:wrap; gap:12px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-size:32px;">📄</div>
          <div>
            <div style="font-weight:600; color:#1a1a1a; word-break:break-all;">${cvAd}</div>
            ${cvBoyut ? `<div style="font-size:12px; color:#888;">${(cvBoyut/1024/1024).toFixed(2)} MB</div>` : ''}
          </div>
        </div>
        <div style="display:flex; gap:8px;">
          <a href="${cvUrl}" target="_blank" class="btn btn-kucuk" style="background:var(--ana-yesil); color:white;">🔍 Görüntüle</a>
          <a href="${cvUrl}" download="${cvAd}" class="btn btn-ikincil btn-kucuk">⬇️ İndir</a>
        </div>
      </div>
    </div>`;
  }
  return `
    <div class="kart" style="background:#fff3e0; border-left:4px solid #f57c00;">
      <h3>📄 Özgeçmiş (CV)</h3>
      <p style="color:#e65100; margin:0; font-size:13px;">⚠️ Bu aday henüz CV yüklememiş.</p>
    </div>`;
}

function cevaplarDetayHTML(cevaplar) {
  // Bölümlere göre grupla
  const gruplar = {
    'Kişilik (Big Five)': [],
    'Çocuk Değerleri': [],
    'Senaryolar': [],
    'Hikayeler': [],
    'Etik & Çocuk Koruma': [],
    'Hızlı Tepkiler': []
  };
  
  Object.keys(cevaplar).forEach(soruId => {
    const cevap = cevaplar[soruId];
    if (soruId.startsWith('k')) gruplar['Kişilik (Big Five)'].push({ id: soruId, cevap });
    else if (soruId.startsWith('d')) gruplar['Çocuk Değerleri'].push({ id: soruId, cevap });
    else if (soruId.startsWith('s')) gruplar['Senaryolar'].push({ id: soruId, cevap });
    else if (soruId.startsWith('h')) gruplar['Hikayeler'].push({ id: soruId, cevap });
    else if (soruId.startsWith('e')) gruplar['Etik & Çocuk Koruma'].push({ id: soruId, cevap });
    else if (soruId.startsWith('r')) gruplar['Hızlı Tepkiler'].push({ id: soruId, cevap });
  });
  
  let html = '';
  Object.keys(gruplar).forEach(grup => {
    if (gruplar[grup].length === 0) return;
    
    html += `<h4 style="color: var(--ana-yesil); margin-top: 20px; margin-bottom: 8px;">${grup}</h4>`;
    html += '<div style="background: #fafafa; padding: 12px; border-radius: 8px;">';
    
    gruplar[grup].forEach(({ id, cevap }) => {
      let cevapMetni = '';
      if (typeof cevap === 'object' && cevap !== null) {
        cevapMetni = `<strong>Seçim:</strong> ${cevap.secim}`;
        if (cevap.neden) {
          cevapMetni += `<br><em style="color:var(--gri);">"${cevap.neden}"</em>`;
        }
      } else if (typeof cevap === 'string' && cevap.length > 50) {
        // Hikaye - uzun metin
        cevapMetni = `<div style="white-space: pre-wrap; padding: 8px; background: white; border-radius: 4px; margin-top: 4px; font-size: 13px;">${cevap}</div>`;
      } else {
        cevapMetni = `<strong>${cevap}</strong>`;
      }
      
      html += `
        <div style="margin-bottom: 8px; font-size: 13px;">
          <span style="color: var(--gri); font-weight: 600;">${id}:</span> ${cevapMetni}
        </div>
      `;
    });
    
    html += '</div>';
  });
  
  return html || '<p style="color: var(--gri);">Cevap yok</p>';
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

// ───────────────────────────────────────────────
// 🔄 Adayın testini sıfırla (cevap + analiz + mülakat notu sil)
// ───────────────────────────────────────────────
window.testiSifirla = async function(adayEposta) {
  const onay = confirm(
    '⚠️ Bu adayın TÜM TEST VERİLERİ silinecek:\n\n' +
    '• Test cevapları\n' +
    '• AI analizi\n' +
    '• Mülakat notları\n\n' +
    'Aday tekrar giriş yaptığında baştan test çözmek zorunda kalacak.\n\n' +
    'Devam etmek istiyor musunuz?'
  );
  if (!onay) return;
  
  try {
    // testCevaplari, analizler, mulakatNotlari koleksiyonlarından sil
    await deleteDoc(doc(db, 'testCevaplari', adayEposta));
    
    try { await deleteDoc(doc(db, 'analizler', adayEposta)); } catch(e) { console.warn('Analiz yok:', e); }
    try { await deleteDoc(doc(db, 'mulakatNotlari', adayEposta)); } catch(e) { console.warn('Mülakat notu yok:', e); }
    
    // Başvuru durumunu testEksik'e döndür
    await updateDoc(doc(db, 'isBasvurulari', adayEposta), {
      durum: 'testEksik',
      testTamamlanmaZamani: null,
      adminNotu: (aktifAday?.adminNotu || '') + '\n[Admin tarafından test sıfırlandı: ' + new Date().toLocaleDateString('tr-TR') + ']'
    });
    
    alertGoster('basarili', 
      '✅ Test verileri başarıyla silindi! Aday "Test Bekleniyor" durumuna alındı. ' +
      'Aday tekrar giriş yaptığında baştan test çözebilir.', 
      'detayAlertAlani'
    );
    
    // Listeyi yenile
    await adaylariYukle();
    
    // Sayfayı 2 saniye sonra listeye döndür
    setTimeout(() => {
      listeyeDon();
    }, 2000);
    
  } catch (hata) {
    console.error('Test sıfırlama hatası:', hata);
    alertGoster('hata', 'Sıfırlama başarısız: ' + hata.message, 'detayAlertAlani');
  }
};
