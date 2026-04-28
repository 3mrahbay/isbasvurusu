// ═══════════════════════════════════════════════════════════
// ADMIN - TOPLU MAIL GÖNDERİM
// ═══════════════════════════════════════════════════════════

import { 
  auth, db,
  onAuthStateChanged,
  signOut,
  collection, doc, getDocs, setDoc, addDoc,
  query, where,
  serverTimestamp,
  PROXY_URL,
  ADMIN_EPOSTA
} from './firebase-config.js';

import { 
  POZISYON_KATEGORILERI,
  pozisyonKategorisiBul,
  tarihFormatla,
  alertGoster
} from './yardimci.js';

let aktifPozisyonlar = [];
let secilenPozisyon = null;
let hedefAdaylar = [];

onAuthStateChanged(auth, async (kullanici) => {
  if (!kullanici || kullanici.email !== ADMIN_EPOSTA) {
    document.getElementById('yukleniyor').classList.add('gizli');
    document.getElementById('yetkisiz').classList.remove('gizli');
    return;
  }
  
  document.getElementById('yukleniyor').classList.add('gizli');
  document.getElementById('adminLayout').classList.remove('gizli');
  
  await pozisyonlariYukle();
});

// ───────────────────────────────────────────────
// Aktif pozisyonları yükle
// ───────────────────────────────────────────────
async function pozisyonlariYukle() {
  try {
    const ref = collection(db, 'pozisyonlar');
    const q = query(ref, where('aktif', '==', true));
    const snapshot = await getDocs(q);
    
    aktifPozisyonlar = [];
    snapshot.forEach(doc => {
      aktifPozisyonlar.push({ id: doc.id, ...doc.data() });
    });
    
    const select = document.getElementById('pozisyonSecim');
    if (aktifPozisyonlar.length === 0) {
      select.innerHTML = '<option value="">Aktif pozisyon yok - önce pozisyon açın</option>';
      return;
    }
    
    let html = '<option value="">Pozisyon seçiniz...</option>';
    aktifPozisyonlar.forEach(p => {
      const k = pozisyonKategorisiBul(p.kategoriId);
      html += `<option value="${p.id}">${k.ikon} ${p.baslik}</option>`;
    });
    select.innerHTML = html;
  } catch (hata) {
    console.error('Hata:', hata);
    alertGoster('hata', 'Pozisyonlar yüklenemedi: ' + hata.message);
  }
}

// ───────────────────────────────────────────────
// Pozisyon seçildi
// ───────────────────────────────────────────────
window.pozisyonSecildi = function() {
  const id = document.getElementById('pozisyonSecim').value;
  
  if (!id) {
    secilenPozisyon = null;
    document.getElementById('pozisyonOnizleme').classList.add('gizli');
    kartiKilitle('hedefKitleKart');
    kartiKilitle('onizlemeKart');
    kartiKilitle('gonderKart');
    return;
  }
  
  secilenPozisyon = aktifPozisyonlar.find(p => p.id === id);
  if (!secilenPozisyon) return;
  
  const kategori = pozisyonKategorisiBul(secilenPozisyon.kategoriId);
  
  const onizleme = document.getElementById('pozisyonOnizleme');
  onizleme.innerHTML = `
    <div style="font-size: 16px; margin-bottom: 4px;">
      <strong>${kategori.ikon} ${secilenPozisyon.baslik}</strong>
    </div>
    <div style="color: var(--gri); font-size: 14px;">
      ${secilenPozisyon.kisaAciklama || ''}
    </div>
    <div style="margin-top: 8px; font-size: 13px;">
      ${secilenPozisyon.havuzModu 
        ? '🌊 <strong>Sürekli açık</strong>' 
        : `📅 Son tarih: <strong>${tarihFormatla(secilenPozisyon.sonBasvuruTarihi)}</strong>`
      }
    </div>
  `;
  onizleme.classList.remove('gizli');
  
  kartiAc('hedefKitleKart');
};

// ───────────────────────────────────────────────
// Kart kilit/aç
// ───────────────────────────────────────────────
function kartiKilitle(id) {
  const k = document.getElementById(id);
  k.style.opacity = '0.5';
  k.style.pointerEvents = 'none';
}

function kartiAc(id) {
  const k = document.getElementById(id);
  k.style.opacity = '1';
  k.style.pointerEvents = 'auto';
}

// ───────────────────────────────────────────────
// Hedef kitle hesapla
// ───────────────────────────────────────────────
window.hedefHesapla = async function() {
  if (!secilenPozisyon) return;
  
  const kategoriyeUyan = document.getElementById('kategoriyeUyan').checked;
  const havuzdakiAdaylar = document.getElementById('havuzdakiAdaylar').checked;
  
  if (!kategoriyeUyan && !havuzdakiAdaylar) {
    alertGoster('uyari', 'En az bir hedef seçin.');
    return;
  }
  
  const sayiEl = document.getElementById('hedefSayisi');
  sayiEl.innerHTML = '⏳ Hesaplanıyor...';
  
  try {
    hedefAdaylar = []; // {eposta, ad, optOutToken}
    const eklenenler = new Set(); // duplicate önleme
    
    // 1. Mail tercihinde bu kategoriyi seçen adaylar
    if (kategoriyeUyan) {
      const tercihSnap = await getDocs(collection(db, 'havuzMailTercihleri'));
      tercihSnap.forEach(doc => {
        const t = doc.data();
        if (t.mailAlmakIstiyor === false) return; // opt-out yapmış
        if (!t.ilgiliKategoriler || !Array.isArray(t.ilgiliKategoriler)) return;
        
        if (t.ilgiliKategoriler.includes(secilenPozisyon.kategoriId)) {
          if (!eklenenler.has(t.adayEposta)) {
            hedefAdaylar.push({
              eposta: t.adayEposta,
              ad: t.adayAdi || t.adayEposta.split('@')[0],
              optOutToken: t.optOutToken || ''
            });
            eklenenler.add(t.adayEposta);
          }
        }
      });
    }
    
    // 2. Bu kategoriye başvuran ama henüz havuzda olan adaylar
    if (havuzdakiAdaylar) {
      const basvuruRef = collection(db, 'isBasvurulari');
      const q = query(basvuruRef, where('kategoriId', '==', secilenPozisyon.kategoriId));
      const basSnap = await getDocs(q);
      
      // Mail tercih dokümanlarını bir kez al
      const tercihMap = new Map();
      const tercihSnap = await getDocs(collection(db, 'havuzMailTercihleri'));
      tercihSnap.forEach(doc => {
        tercihMap.set(doc.id, doc.data());
      });
      
      basSnap.forEach(doc => {
        const a = doc.data();
        // Sadece havuz/red durumundakiler (zaten kabul/mülakatda olan tekrar mail almasın)
        if (a.durum === 'kabul' || a.durum === 'mulakat') return;
        
        const tercih = tercihMap.get(a.adayEposta);
        if (tercih && tercih.mailAlmakIstiyor === false) return; // opt-out
        
        if (!eklenenler.has(a.adayEposta)) {
          hedefAdaylar.push({
            eposta: a.adayEposta,
            ad: a.adayAdi || a.adayEposta.split('@')[0],
            optOutToken: tercih?.optOutToken || ''
          });
          eklenenler.add(a.adayEposta);
        }
      });
    }
    
    sayiEl.innerHTML = `
      <strong style="color: var(--ana-yesil);">📊 ${hedefAdaylar.length} adaya mail gönderilecek</strong>
      ${hedefAdaylar.length === 0 
        ? '<br><small>Bu kriterlere uyan aday bulunamadı.</small>' 
        : ''
      }
    `;
    
    if (hedefAdaylar.length > 0) {
      kartiAc('onizlemeKart');
    }
    
  } catch (hata) {
    console.error('Hedef hesaplama hatası:', hata);
    sayiEl.innerHTML = `<span class="alert hata">Hata: ${hata.message}</span>`;
  }
};

// ───────────────────────────────────────────────
// Mail önizleme
// ───────────────────────────────────────────────
window.onizlemeYap = function() {
  if (!secilenPozisyon || hedefAdaylar.length === 0) return;
  
  const ekMesaj = document.getElementById('ekMesaj').value.trim();
  const ornekAday = hedefAdaylar[0];
  const kategori = pozisyonKategorisiBul(secilenPozisyon.kategoriId);
  
  const onizleme = document.getElementById('mailOnizleme');
  onizleme.innerHTML = `
    <div style="background: white; border-radius: 8px; padding: 20px; max-height: 500px; overflow-y: auto;">
      <div style="color: var(--gri); font-size: 13px; margin-bottom: 12px;">
        <strong>Kime:</strong> ${ornekAday.eposta} (örnek)<br>
        <strong>Konu:</strong> 🌸 Yeni Pozisyon: ${secilenPozisyon.baslik}
      </div>
      <hr style="margin: 12px 0;">
      <div style="font-family: Arial, sans-serif;">
        <h3 style="color: var(--ana-yesil);">Sevgili ${ornekAday.ad},</h3>
        <p>Bir Çiçek Koleji'nde <strong>${kategori.ikon} ${secilenPozisyon.baslik}</strong> 
        pozisyonu için ilanımız açıldı! Daha önce ilgi gösterdiğiniz için ilk size haber veriyoruz. 🌸</p>
        
        <div style="background: var(--cok-acik-yesil); padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>${secilenPozisyon.baslik}</strong><br>
          <small style="color: var(--gri);">${secilenPozisyon.kisaAciklama || ''}</small><br>
          ${secilenPozisyon.havuzModu 
            ? '🌊 Sürekli açık' 
            : `📅 Son başvuru: <strong>${tarihFormatla(secilenPozisyon.sonBasvuruTarihi)}</strong>`
          }
        </div>
        
        ${ekMesaj ? `<div style="background: #faf3e8; padding: 16px; border-radius: 8px; margin: 16px 0; font-style: italic;">${ekMesaj.replace(/\n/g, '<br>')}</div>` : ''}
        
        <p>Başvurmak için aşağıdaki butona tıklayabilirsiniz:</p>
        
        <div style="text-align: center; margin: 24px 0;">
          <a href="https://isbasvurusu.bircicekkoleji.com/basvuru.html?pozisyon=${secilenPozisyon.id}" 
             style="background: var(--ana-yesil); color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
            🚀 Başvuru Yap
          </a>
        </div>
        
        <p style="color: var(--gri); font-size: 13px; margin-top: 24px;">
          Sevgiyle,<br>
          <strong>Bir Çiçek Koleji Ailesi</strong>
        </p>
        
        <hr style="margin: 20px 0;">
        <p style="font-size: 11px; color: var(--acik-gri); text-align: center;">
          Bu mailler için <a href="#">tercihlerinizi değiştirebilir</a> veya 
          <a href="#">listeden çıkabilirsiniz</a>.
        </p>
      </div>
    </div>
  `;
  
  kartiAc('gonderKart');
};

// ───────────────────────────────────────────────
// Maili gerçekten gönder
// ───────────────────────────────────────────────
window.mailGonder = async function() {
  if (!secilenPozisyon || hedefAdaylar.length === 0) return;
  
  const onay = confirm(
    `📬 ${hedefAdaylar.length} adaya mail gönderilecek.\n\n` +
    `Pozisyon: ${secilenPozisyon.baslik}\n\n` +
    `Devam etmek istiyor musunuz?`
  );
  if (!onay) return;
  
  const ekMesaj = document.getElementById('ekMesaj').value.trim();
  const durumEl = document.getElementById('gonderimDurum');
  
  durumEl.innerHTML = `
    <div class="alert bilgi">
      ⏳ <strong>Gönderim başlıyor...</strong> Bu birkaç dakika sürebilir, sayfayı kapatmayın.
    </div>
  `;
  
  let basarili = 0;
  let hatali = 0;
  let log = [];
  
  for (let i = 0; i < hedefAdaylar.length; i++) {
    const aday = hedefAdaylar[i];
    
    durumEl.innerHTML = `
      <div class="alert bilgi">
        ⏳ Gönderiliyor: <strong>${i+1} / ${hedefAdaylar.length}</strong><br>
        Şu anda: ${aday.eposta}
      </div>
      <div style="margin-top: 8px; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
        <div style="height: 100%; background: var(--ana-yesil); width: ${(i/hedefAdaylar.length)*100}%; transition: width 0.3s;"></div>
      </div>
    `;
    
    try {
      const yanit = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          islem: 'mailGonder',
          alici: aday.eposta,
          aliciAdi: aday.ad,
          tip: 'pozisyonDuyuru',
          parametreler: {
            pozisyonBaslik: secilenPozisyon.baslik,
            pozisyonAciklama: secilenPozisyon.kisaAciklama || '',
            pozisyonId: secilenPozisyon.id,
            sonTarih: secilenPozisyon.havuzModu 
              ? null 
              : tarihFormatla(secilenPozisyon.sonBasvuruTarihi),
            havuzModu: secilenPozisyon.havuzModu || false,
            ekMesaj: ekMesaj || '',
            optOutToken: aday.optOutToken || ''
          }
        })
      });
      
      const sonuc = await yanit.json();
      if (sonuc.basarili) {
        basarili++;
        log.push({ eposta: aday.eposta, durum: 'basarili' });
      } else {
        hatali++;
        log.push({ eposta: aday.eposta, durum: 'hata', hata: sonuc.hata });
      }
    } catch (hata) {
      hatali++;
      log.push({ eposta: aday.eposta, durum: 'hata', hata: hata.message });
    }
    
    // Brevo rate limit için 200ms bekle
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Mail gönderim logunu kaydet
  try {
    await addDoc(collection(db, 'mailGonderimleri'), {
      pozisyonId: secilenPozisyon.id,
      pozisyonBaslik: secilenPozisyon.baslik,
      kategoriId: secilenPozisyon.kategoriId,
      hedefSayisi: hedefAdaylar.length,
      basariliSayi: basarili,
      hataliSayi: hatali,
      ekMesaj: ekMesaj || null,
      log: log.slice(0, 100), // İlk 100 log
      gonderimZamani: serverTimestamp()
    });
  } catch (e) {
    console.warn('Log kaydedilemedi:', e);
  }
  
  durumEl.innerHTML = `
    <div class="alert ${hatali === 0 ? 'basarili' : 'uyari'}">
      <h3 style="margin-top: 0;">📊 Gönderim Tamamlandı!</h3>
      <p>
        ✅ <strong>Başarılı:</strong> ${basarili} mail<br>
        ${hatali > 0 ? `❌ <strong>Hatalı:</strong> ${hatali} mail<br>` : ''}
        <small>Toplam: ${hedefAdaylar.length} mail</small>
      </p>
    </div>
  `;
};

window.cikisYap = async function() {
  await signOut(auth);
  window.location.href = 'index.html';
};
