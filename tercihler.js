// ═══════════════════════════════════════════════════════════
// MAIL TERCİH YÖNETİMİ
// Token tabanlı - login gerektirmez (KVKK uyumlu)
// ═══════════════════════════════════════════════════════════

import { 
  db,
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where,
  serverTimestamp
} from './firebase-config.js';

import { 
  POZISYON_KATEGORILERI,
  urlParametreAl,
  alertGoster
} from './yardimci.js';

let aktifTercih = null;
let aktifTercihId = null; // doc ID = email

// ───────────────────────────────────────────────
// Sayfa yüklendiğinde
// ───────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  const token = urlParametreAl('token');
  const eposta = urlParametreAl('eposta');
  const cikis = urlParametreAl('cikis'); // Eğer ?cikis=true ile gelirse direk opt-out
  
  if (!token) {
    hataGoster(
      'Geçersiz Link',
      'Bu sayfaya erişim için size gönderdiğimiz mail içindeki linki kullanmalısınız. Eğer mail bulunmuyorsa, ana sayfadan başvuru yaparak yeni bir kayıt oluşturabilirsiniz.'
    );
    return;
  }
  
  try {
    // Token ile tercih dokümanını bul
    const tercihRef = collection(db, 'havuzMailTercihleri');
    const q = query(tercihRef, where('optOutToken', '==', token));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      hataGoster(
        'Link Geçersiz',
        'Bu link geçerli değil veya süresi dolmuş. Lütfen size gönderilen en son maildeki linki kullanın.'
      );
      return;
    }
    
    const tercihDoc = snapshot.docs[0];
    aktifTercih = tercihDoc.data();
    aktifTercihId = tercihDoc.id;
    
    // Direk çıkış istemişse
    if (cikis === 'true') {
      await tamamenCikInternal(false);
      return;
    }
    
    // Normal akış - tercihleri göster
    icerikGoster();
    
  } catch (hata) {
    console.error('Tercih yükleme hatası:', hata);
    hataGoster('Bir Sorun Oluştu', 'Tercihleriniz yüklenirken bir hata oluştu: ' + hata.message);
  }
});

// ───────────────────────────────────────────────
// Hata göster
// ───────────────────────────────────────────────
function hataGoster(baslik, mesaj) {
  document.getElementById('yukleniyor').classList.add('gizli');
  document.getElementById('hataMesaj').textContent = mesaj;
  document.querySelector('#hataAlani h2').textContent = '⚠️ ' + baslik;
  document.getElementById('hataAlani').classList.remove('gizli');
}

// ───────────────────────────────────────────────
// İçerik göster
// ───────────────────────────────────────────────
function icerikGoster() {
  document.getElementById('yukleniyor').classList.add('gizli');
  document.getElementById('anaIcerik').classList.remove('gizli');
  
  // Aday bilgisi
  document.getElementById('adayAdi').textContent = aktifTercih.adayAdi || aktifTercihId;
  
  // Mail almak istiyor checkbox
  const mailCheck = document.getElementById('mailAlmakIstiyor');
  mailCheck.checked = aktifTercih.mailAlmakIstiyor !== false;
  mailCheck.addEventListener('change', mailDurumDegisti);
  
  // Kategori listesi
  kategorileriCiz();
  
  mailDurumDegisti();
}

// ───────────────────────────────────────────────
// Mail almak istiyor durumu değişti
// ───────────────────────────────────────────────
function mailDurumDegisti() {
  const mailCheck = document.getElementById('mailAlmakIstiyor');
  const kategoriKart = document.getElementById('kategoriKart');
  
  if (mailCheck.checked) {
    kategoriKart.style.opacity = '1';
    kategoriKart.style.pointerEvents = 'auto';
  } else {
    kategoriKart.style.opacity = '0.4';
    kategoriKart.style.pointerEvents = 'none';
  }
}

// ───────────────────────────────────────────────
// Kategorileri çiz
// ───────────────────────────────────────────────
function kategorileriCiz() {
  const liste = document.getElementById('kategoriListesi');
  const secilenler = aktifTercih.ilgiliKategoriler || [];
  
  liste.innerHTML = POZISYON_KATEGORILERI.map(kat => `
    <div class="checkbox-grup">
      <input type="checkbox" id="kat_${kat.id}" 
             value="${kat.id}" 
             ${secilenler.includes(kat.id) ? 'checked' : ''}>
      <label for="kat_${kat.id}">${kat.ikon} ${kat.ad}</label>
    </div>
  `).join('');
}

// ───────────────────────────────────────────────
// Tercihleri kaydet
// ───────────────────────────────────────────────
window.tercihleriKaydet = async function() {
  const mailAlmakIstiyor = document.getElementById('mailAlmakIstiyor').checked;
  
  let secilenler = [];
  if (mailAlmakIstiyor) {
    document.querySelectorAll('#kategoriListesi input[type="checkbox"]:checked').forEach(cb => {
      secilenler.push(cb.value);
    });
    
    if (secilenler.length === 0) {
      alertGoster('uyari', 'Mail almak istiyorsanız en az bir kategori seçmelisiniz.');
      return;
    }
  }
  
  try {
    await updateDoc(doc(db, 'havuzMailTercihleri', aktifTercihId), {
      mailAlmakIstiyor: mailAlmakIstiyor,
      ilgiliKategoriler: secilenler,
      guncellemeZamani: serverTimestamp()
    });
    
    document.getElementById('anaIcerik').classList.add('gizli');
    document.getElementById('basariliAlani').classList.remove('gizli');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (hata) {
    console.error('Kaydetme hatası:', hata);
    alertGoster('hata', 'Kaydedilemedi: ' + hata.message);
  }
};

// ───────────────────────────────────────────────
// Tamamen mail listesinden çık
// ───────────────────────────────────────────────
window.tamamenCik = async function() {
  const onay = confirm(
    '🚪 Tüm mail bildirimlerinden çıkmak istediğinize emin misiniz?\n\n' +
    'Yeni pozisyonlardan haberdar edilmeyeceksiniz. Bu işlemi her zaman geri alabilirsiniz.\n\n' +
    'Devam etmek istiyor musunuz?'
  );
  if (!onay) return;
  
  await tamamenCikInternal(true);
};

async function tamamenCikInternal(onayGosterildi) {
  try {
    await updateDoc(doc(db, 'havuzMailTercihleri', aktifTercihId), {
      mailAlmakIstiyor: false,
      ilgiliKategoriler: [],
      guncellemeZamani: serverTimestamp(),
      cikisZamani: serverTimestamp()
    });
    
    document.getElementById('yukleniyor').classList.add('gizli');
    document.getElementById('anaIcerik').classList.add('gizli');
    
    const basarili = document.getElementById('basariliAlani');
    basarili.innerHTML = `
      <div class="kart" style="text-align: center;">
        <div style="font-size: 64px; margin-bottom: 16px;">🌾</div>
        <h2 style="color: var(--ana-yesil);">Listeden Çıkarıldınız</h2>
        <p>
          Mail listemizden başarıyla çıkarıldınız. Artık otomatik mail almayacaksınız.
        </p>
        <p style="color: var(--gri); font-size: 14px;">
          Profilinizi havuzumuzda saklı tutuyoruz. İlerleyen dönemde manuel olarak 
          sizinle iletişime geçebiliriz. Eğer fikrinizi değiştirirseniz, ana sayfadan 
          tekrar başvuruda bulunarak listeye dönebilirsiniz.
        </p>
        <p style="font-style: italic; color: var(--acik-yesil); margin-top: 24px;">
          "Yolunuz açık olsun..." 🌸
        </p>
        <a href="index.html" class="btn">Ana Sayfaya Dön</a>
      </div>
    `;
    basarili.classList.remove('gizli');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (hata) {
    console.error('Çıkış hatası:', hata);
    alertGoster('hata', 'İşlem yapılamadı: ' + hata.message);
  }
}
