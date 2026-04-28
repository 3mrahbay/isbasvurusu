// ═══════════════════════════════════════════════════════════
// ADMIN - SİTE İÇERİK YÖNETİMİ
// ═══════════════════════════════════════════════════════════

import { 
  auth, db,
  onAuthStateChanged,
  signOut,
  doc, getDoc, setDoc, deleteDoc,
  serverTimestamp,
  ADMIN_EPOSTA
} from './firebase-config.js';

import { alertGoster } from './yardimci.js';

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
  
  await icerikleriYukle();
});

// ───────────────────────────────────────────────
// Mevcut içerikleri yükle
// ───────────────────────────────────────────────
async function icerikleriYukle() {
  try {
    // Hero
    const heroSnap = await getDoc(doc(db, 'siteIcerik', 'hero'));
    if (heroSnap.exists()) {
      const v = heroSnap.data();
      document.getElementById('heroBaslik').value = v.baslik || '';
      document.getElementById('heroAltBaslik').value = v.altBaslik || '';
    }
    
    // Hakkımızda
    const hakSnap = await getDoc(doc(db, 'siteIcerik', 'hakkimizda'));
    if (hakSnap.exists()) {
      document.getElementById('hakkimizdaIcerik').value = hakSnap.data().icerik || '';
    }
    
    // Değerler
    const degSnap = await getDoc(doc(db, 'siteIcerik', 'degerler'));
    if (degSnap.exists()) {
      document.getElementById('degerlerIcerik').value = degSnap.data().icerik || '';
    }
  } catch (hata) {
    console.error('İçerik yükleme hatası:', hata);
    alertGoster('hata', 'İçerikler yüklenemedi: ' + hata.message);
  }
}

// ───────────────────────────────────────────────
// Hero kaydet
// ───────────────────────────────────────────────
window.heroKaydet = async function() {
  const baslik = document.getElementById('heroBaslik').value.trim();
  const altBaslik = document.getElementById('heroAltBaslik').value.trim();
  
  if (!baslik && !altBaslik) {
    alertGoster('uyari', 'En az bir alanı doldurun.');
    return;
  }
  
  try {
    await setDoc(doc(db, 'siteIcerik', 'hero'), {
      baslik: baslik || null,
      altBaslik: altBaslik || null,
      guncellemeZamani: serverTimestamp()
    });
    alertGoster('basarili', '✅ Hero bölümü kaydedildi!');
  } catch (hata) {
    alertGoster('hata', 'Kaydedilemedi: ' + hata.message);
  }
};

// ───────────────────────────────────────────────
// Hakkımızda kaydet
// ───────────────────────────────────────────────
window.hakkimizdaKaydet = async function() {
  const icerik = document.getElementById('hakkimizdaIcerik').value.trim();
  if (!icerik) {
    alertGoster('uyari', 'İçerik boş olamaz.');
    return;
  }
  
  try {
    await setDoc(doc(db, 'siteIcerik', 'hakkimizda'), {
      icerik: icerik,
      guncellemeZamani: serverTimestamp()
    });
    alertGoster('basarili', '✅ Hakkımızda bölümü kaydedildi!');
  } catch (hata) {
    alertGoster('hata', 'Kaydedilemedi: ' + hata.message);
  }
};

// ───────────────────────────────────────────────
// Değerler kaydet
// ───────────────────────────────────────────────
window.degerlerKaydet = async function() {
  const icerik = document.getElementById('degerlerIcerik').value.trim();
  if (!icerik) {
    alertGoster('uyari', 'İçerik boş olamaz.');
    return;
  }
  
  try {
    await setDoc(doc(db, 'siteIcerik', 'degerler'), {
      icerik: icerik,
      guncellemeZamani: serverTimestamp()
    });
    alertGoster('basarili', '✅ Değerler bölümü kaydedildi!');
  } catch (hata) {
    alertGoster('hata', 'Kaydedilemedi: ' + hata.message);
  }
};

// ───────────────────────────────────────────────
// Varsayılana sıfırla (tüm dokümanları sil → varsayılan içerik gösterilir)
// ───────────────────────────────────────────────
window.sifirla = async function() {
  const onay = confirm(
    '⚠️ TÜM özelleştirmeler silinecek!\n\n' +
    'Site varsayılan içeriklere dönecek.\n\n' +
    'Devam etmek istiyor musunuz?'
  );
  if (!onay) return;
  
  try {
    await deleteDoc(doc(db, 'siteIcerik', 'hero'));
    await deleteDoc(doc(db, 'siteIcerik', 'hakkimizda'));
    await deleteDoc(doc(db, 'siteIcerik', 'degerler'));
    
    document.getElementById('heroBaslik').value = '';
    document.getElementById('heroAltBaslik').value = '';
    document.getElementById('hakkimizdaIcerik').value = '';
    document.getElementById('degerlerIcerik').value = '';
    
    alertGoster('basarili', '✅ Tüm özelleştirmeler silindi. Site varsayılana döndü.');
  } catch (hata) {
    alertGoster('hata', 'Silinirken hata: ' + hata.message);
  }
};

window.cikisYap = async function() {
  await signOut(auth);
  window.location.href = 'index.html';
};
