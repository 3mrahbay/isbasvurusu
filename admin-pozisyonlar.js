// ═══════════════════════════════════════════════════════════
// ADMIN - POZİSYON YÖNETİMİ
// CRUD: Listele, Ekle, Düzenle, Sil
// ═══════════════════════════════════════════════════════════

import { 
  auth,
  db,
  googleProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
  ADMIN_EPOSTA
} from './firebase-config.js';

import { 
  POZISYON_KATEGORILERI,
  pozisyonKategorisiBul,
  tarihSaatFormatla,
  alertGoster
} from './yardimci.js';

import { editorOlustur } from './metin-editor.js';

let tumPozisyonlar = [];
let aktifFiltre = 'hepsi';
let duzenlemeMod = null; // null, 'yeni', veya pozisyonId

// ───────────────────────────────────────────────
// Auth kontrol
// ───────────────────────────────────────────────
onAuthStateChanged(auth, async (kullanici) => {
  if (!kullanici) {
    document.getElementById('yukleniyor').classList.add('gizli');
    document.getElementById('yetkisiz').classList.remove('gizli');
    return;
  }
  
  if (kullanici.email !== ADMIN_EPOSTA) {
    document.getElementById('yukleniyor').classList.add('gizli');
    document.getElementById('yetkisiz').classList.remove('gizli');
    return;
  }
  
  document.getElementById('yukleniyor').classList.add('gizli');
  document.getElementById('adminLayout').classList.remove('gizli');
  
  kategoriSelectDoldur();
  await pozisyonlariYukle();
  filtreButonlariBaglA();
});

// ───────────────────────────────────────────────
// Kategori select kutusu
// ───────────────────────────────────────────────
function kategoriSelectDoldur() {
  const select = document.getElementById('kategoriId');
  let html = '<option value="">Kategori seçiniz...</option>';
  POZISYON_KATEGORILERI.forEach(kat => {
    html += `<option value="${kat.id}">${kat.ikon} ${kat.ad}</option>`;
  });
  select.innerHTML = html;
}

// ───────────────────────────────────────────────
// Pozisyonları yükle
// ───────────────────────────────────────────────
async function pozisyonlariYukle() {
  try {
    const pozisyonRef = collection(db, 'pozisyonlar');
    const q = query(pozisyonRef, orderBy('olusturmaZamani', 'desc'));
    const snapshot = await getDocs(q);
    
    tumPozisyonlar = [];
    snapshot.forEach(doc => {
      tumPozisyonlar.push({ id: doc.id, ...doc.data() });
    });
    
    pozisyonlariCiz();
    
  } catch (hata) {
    console.error('Pozisyon yükleme hatası:', hata);
    alertGoster('hata', 'Pozisyonlar yüklenemedi: ' + hata.message);
  }
}

// ───────────────────────────────────────────────
// Filtre butonları
// ───────────────────────────────────────────────
function filtreButonlariBaglA() {
  document.querySelectorAll('.filtre-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filtre-btn').forEach(b => b.classList.remove('aktif'));
      btn.classList.add('aktif');
      aktifFiltre = btn.dataset.filtre;
      pozisyonlariCiz();
    });
  });
}

// ───────────────────────────────────────────────
// Pozisyonları çiz
// ───────────────────────────────────────────────
function pozisyonlariCiz() {
  let pozisyonlar = [...tumPozisyonlar];
  
  // Filtreleme
  if (aktifFiltre === 'aktif') {
    pozisyonlar = pozisyonlar.filter(p => p.aktif === true);
  } else if (aktifFiltre === 'pasif') {
    pozisyonlar = pozisyonlar.filter(p => p.aktif !== true);
  } else if (aktifFiltre === 'havuz') {
    pozisyonlar = pozisyonlar.filter(p => p.havuzModu === true);
  }
  
  const tablo = document.getElementById('pozisyonTablosu');
  
  if (pozisyonlar.length === 0) {
    tablo.innerHTML = `
      <p style="text-align: center; padding: 40px 20px; color: var(--gri);">
        ${aktifFiltre === 'hepsi' ? 'Henüz pozisyon eklenmemiş.' : 'Bu filtreye uygun pozisyon yok.'}
      </p>
    `;
    return;
  }
  
  let html = `
    <div class="tablo">
      <table>
        <thead>
          <tr>
            <th>Pozisyon</th>
            <th>Durum</th>
            <th>Son Tarih</th>
            <th>Eklendi</th>
            <th>Eylemler</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  pozisyonlar.forEach(p => {
    const kategori = pozisyonKategorisiBul(p.kategoriId);
    
    let durumHTML = '';
    if (p.aktif && p.havuzModu) {
      durumHTML = '<span class="pozisyon-rozet havuz">🌊 Havuz</span>';
    } else if (p.aktif) {
      durumHTML = '<span class="pozisyon-rozet aktif">✨ Aktif</span>';
    } else {
      durumHTML = '<span class="pozisyon-rozet" style="background:#f5f5f5; color:#666;">⏸️ Pasif</span>';
    }
    
    let sonTarihHTML = '-';
    if (p.havuzModu) {
      sonTarihHTML = '<em style="color:#1976d2;">Sürekli açık</em>';
    } else if (p.sonBasvuruTarihi) {
      sonTarihHTML = tarihSaatFormatla(p.sonBasvuruTarihi);
    }
    
    html += `
      <tr>
        <td>
          <div style="font-weight: 600;">${kategori.ikon} ${p.baslik || kategori.ad}</div>
          <div style="font-size: 12px; color: var(--gri); margin-top: 2px;">
            ${(p.kisaAciklama || '').substring(0, 80)}${p.kisaAciklama && p.kisaAciklama.length > 80 ? '...' : ''}
          </div>
        </td>
        <td>${durumHTML}</td>
        <td>${sonTarihHTML}</td>
        <td>${p.olusturmaZamani ? tarihSaatFormatla(p.olusturmaZamani) : '-'}</td>
        <td>
          <div class="eylem-butonlar">
            <button class="btn btn-kucuk btn-ikincil" onclick="pozisyonDuzenle('${p.id}')">
              ✏️ Düzenle
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  tablo.innerHTML = html;
}

// ───────────────────────────────────────────────
// Yeni pozisyon - formu temizle ve aç
// ───────────────────────────────────────────────
window.yeniPozisyon = function() {
  duzenlemeMod = 'yeni';
  document.getElementById('duzenlemeBaslik').textContent = '➕ Yeni Pozisyon Ekle';
  document.getElementById('silBtn').classList.add('gizli');
  
  // Formu temizle
  document.getElementById('kategoriId').value = '';
  document.getElementById('baslik').value = '';
  document.getElementById('kisaAciklama').value = '';
  document.getElementById('detayAciklama').value = '';
  document.getElementById('lokasyon').value = 'Aydınlı Mah. Bahçeler Sk. No:45 Tuzla / İstanbul';
  document.getElementById('calismaTipi').value = 'Tam zamanlı';
  document.getElementById('havuzModu').checked = false;
  document.getElementById('sonBasvuruTarihi').value = '';
  document.getElementById('aktif').checked = true;
  
  // Varsayılan tarih: 30 gün sonrası
  const sonra = new Date();
  sonra.setDate(sonra.getDate() + 30);
  sonra.setHours(23, 59);
  document.getElementById('sonBasvuruTarihi').value = sonra.toISOString().slice(0, 16);
  
  havuzModuDegisti();
  
  // Görünümü değiştir
  document.getElementById('listeGorunumu').classList.add('gizli');
  document.getElementById('duzenlemeGorunumu').classList.remove('gizli');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Editörleri etkinleştir
  setTimeout(() => {
    editorOlustur('kisaAciklama', { onizleme: false });
    editorOlustur('detayAciklama', { onizleme: true });
  }, 100);
};

// ───────────────────────────────────────────────
// Pozisyon düzenle
// ───────────────────────────────────────────────
window.pozisyonDuzenle = function(pozisyonId) {
  const p = tumPozisyonlar.find(x => x.id === pozisyonId);
  if (!p) return;
  
  duzenlemeMod = pozisyonId;
  document.getElementById('duzenlemeBaslik').textContent = '✏️ Pozisyon Düzenle';
  document.getElementById('silBtn').classList.remove('gizli');
  
  document.getElementById('kategoriId').value = p.kategoriId || '';
  document.getElementById('baslik').value = p.baslik || '';
  document.getElementById('kisaAciklama').value = p.kisaAciklama || '';
  document.getElementById('detayAciklama').value = p.detayAciklama || '';
  document.getElementById('lokasyon').value = p.lokasyon || 'Aydınlı Mah. Bahçeler Sk. No:45 Tuzla / İstanbul';
  document.getElementById('calismaTipi').value = p.calismaTipi || 'Tam zamanlı';
  document.getElementById('havuzModu').checked = p.havuzModu === true;
  document.getElementById('aktif').checked = p.aktif !== false;
  
  if (p.sonBasvuruTarihi) {
    const tarih = p.sonBasvuruTarihi.toDate ? p.sonBasvuruTarihi.toDate() : new Date(p.sonBasvuruTarihi);
    // Yerel saat dilimi formatına çevir
    const ofset = tarih.getTimezoneOffset();
    const yerelTarih = new Date(tarih.getTime() - ofset * 60 * 1000);
    document.getElementById('sonBasvuruTarihi').value = yerelTarih.toISOString().slice(0, 16);
  } else {
    document.getElementById('sonBasvuruTarihi').value = '';
  }
  
  havuzModuDegisti();
  
  document.getElementById('listeGorunumu').classList.add('gizli');
  document.getElementById('duzenlemeGorunumu').classList.remove('gizli');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  // Editörleri etkinleştir
  setTimeout(() => {
    editorOlustur('kisaAciklama', { onizleme: false });
    editorOlustur('detayAciklama', { onizleme: true });
  }, 100);
};

// ───────────────────────────────────────────────
// Havuz modu değişti - son tarih alanını gizle/göster
// ───────────────────────────────────────────────
window.havuzModuDegisti = function() {
  const havuz = document.getElementById('havuzModu').checked;
  const sonTarihAlani = document.getElementById('sonTarihAlani');
  
  if (havuz) {
    sonTarihAlani.style.opacity = '0.5';
    sonTarihAlani.style.pointerEvents = 'none';
    document.getElementById('sonBasvuruTarihi').required = false;
  } else {
    sonTarihAlani.style.opacity = '1';
    sonTarihAlani.style.pointerEvents = 'auto';
    document.getElementById('sonBasvuruTarihi').required = true;
  }
};

// ───────────────────────────────────────────────
// Listeye dön
// ───────────────────────────────────────────────
window.listeyeDon = function() {
  duzenlemeMod = null;
  document.getElementById('duzenlemeGorunumu').classList.add('gizli');
  document.getElementById('listeGorunumu').classList.remove('gizli');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ───────────────────────────────────────────────
// Pozisyon kaydet
// ───────────────────────────────────────────────
window.pozisyonKaydet = async function() {
  const kategoriId = document.getElementById('kategoriId').value;
  const baslik = document.getElementById('baslik').value.trim();
  const kisaAciklama = document.getElementById('kisaAciklama').value.trim();
  const detayAciklama = document.getElementById('detayAciklama').value.trim();
  const lokasyon = document.getElementById('lokasyon').value.trim();
  const calismaTipi = document.getElementById('calismaTipi').value;
  const havuzModu = document.getElementById('havuzModu').checked;
  const sonBasvuruTarihi = document.getElementById('sonBasvuruTarihi').value;
  const aktif = document.getElementById('aktif').checked;
  
  // Validasyon
  if (!kategoriId) {
    alertGoster('hata', 'Lütfen kategori seçiniz.', 'formAlertAlani');
    return;
  }
  if (!baslik) {
    alertGoster('hata', 'Lütfen ilan başlığı giriniz.', 'formAlertAlani');
    return;
  }
  if (!kisaAciklama) {
    alertGoster('hata', 'Lütfen kısa açıklama giriniz.', 'formAlertAlani');
    return;
  }
  if (!havuzModu && !sonBasvuruTarihi) {
    alertGoster('hata', 'Son başvuru tarihi giriniz veya havuz modunu işaretleyin.', 'formAlertAlani');
    return;
  }
  
  try {
    const veri = {
      kategoriId,
      baslik,
      kisaAciklama,
      detayAciklama: detayAciklama || null,
      lokasyon: lokasyon || 'Aydınlı Mah. Bahçeler Sk. No:45 Tuzla / İstanbul',
      calismaTipi,
      havuzModu,
      aktif,
      sonBasvuruTarihi: havuzModu ? null : Timestamp.fromDate(new Date(sonBasvuruTarihi)),
      guncellemeZamani: serverTimestamp()
    };
    
    if (duzenlemeMod === 'yeni') {
      veri.olusturmaZamani = serverTimestamp();
      const yeniDoc = await addDoc(collection(db, 'pozisyonlar'), veri);
      alertGoster('basarili', `✅ Yeni pozisyon eklendi: ${baslik}`, 'formAlertAlani');
    } else {
      // Mevcut güncellemede olusturmaZamani değiştirme
      const docRef = doc(db, 'pozisyonlar', duzenlemeMod);
      await updateDoc(docRef, veri);
      alertGoster('basarili', `✅ Pozisyon güncellendi: ${baslik}`, 'formAlertAlani');
    }
    
    // 1 saniye sonra listeye dön
    setTimeout(async () => {
      await pozisyonlariYukle();
      listeyeDon();
    }, 1200);
    
  } catch (hata) {
    console.error('Kaydetme hatası:', hata);
    alertGoster('hata', 'Kaydedilemedi: ' + hata.message, 'formAlertAlani');
  }
};

// ───────────────────────────────────────────────
// Pozisyon sil
// ───────────────────────────────────────────────
window.pozisyonSil = async function() {
  if (!duzenlemeMod || duzenlemeMod === 'yeni') return;
  
  const onay = confirm(
    '⚠️ Bu pozisyonu silmek istediğinize emin misiniz?\n\n' +
    'Bu işlem geri alınamaz.\n\n' +
    'Not: Bu pozisyona zaten başvuran adaylar etkilenmez, ' +
    'sadece ilan listeden kalkar.'
  );
  
  if (!onay) return;
  
  try {
    await deleteDoc(doc(db, 'pozisyonlar', duzenlemeMod));
    alertGoster('basarili', '✅ Pozisyon silindi.', 'formAlertAlani');
    
    setTimeout(async () => {
      await pozisyonlariYukle();
      listeyeDon();
    }, 1000);
    
  } catch (hata) {
    console.error('Silme hatası:', hata);
    alertGoster('hata', 'Silinemedi: ' + hata.message, 'formAlertAlani');
  }
};

// ───────────────────────────────────────────────
// Çıkış
// ───────────────────────────────────────────────
window.cikisYap = async function() {
  await signOut(auth);
  window.location.href = 'index.html';
};
