// ═══════════════════════════════════════════════════════════
// TEST YÖNETİM SİSTEMİ - 3 Test Tipi (eğitim/destek/idari)
// ═══════════════════════════════════════════════════════════

import { 
  auth, db,
  onAuthStateChanged,
  signOut,
  doc, getDoc, setDoc, updateDoc,
  serverTimestamp,
  PROXY_URL
} from './firebase-config.js';

// 🎓 EĞİTİM KADROSU TESTİ (60 soru)
import { 
  BOLUMLER as EGITIM_BOLUMLER,
  MOTIVASYONLAR as EGITIM_MOTIVASYONLAR,
  toplamSoruSayisi,
  bolumeKadarSoruSayisi
} from './test-sorular.js';

// 🛡️ DESTEK KADROSU TESTİ (30 soru)
import { 
  DESTEK_BOLUMLER,
  DESTEK_MOTIVASYONLAR
} from './test-sorular-destek.js';

// 💼 İDARİ KADROSU TESTİ (30 soru)
import { 
  IDARI_BOLUMLER,
  IDARI_MOTIVASYONLAR
} from './test-sorular-idari.js';

import { 
  bolumRender,
  bolumValidate
} from './test-bolumler.js';

import { alertGoster, mailGonder, testTipiBul, TEST_TIPLERI } from './yardimci.js';

// ───────────────────────────────────────────────
// 🎯 AKTİF TEST SETİ - pozisyona göre belirlenir
// ───────────────────────────────────────────────
let BOLUMLER = EGITIM_BOLUMLER;        // varsayılan: eğitim
let MOTIVASYONLAR = EGITIM_MOTIVASYONLAR;
let aktifTestTipi = 'egitim';

// Test setini değiştir
function testSetiniBelirle(testTipi) {
  aktifTestTipi = testTipi;
  
  if (testTipi === 'destek') {
    BOLUMLER = DESTEK_BOLUMLER;
    MOTIVASYONLAR = DESTEK_MOTIVASYONLAR;
  } else if (testTipi === 'idari') {
    BOLUMLER = IDARI_BOLUMLER;
    MOTIVASYONLAR = IDARI_MOTIVASYONLAR;
  } else {
    // Varsayılan: egitim
    BOLUMLER = EGITIM_BOLUMLER;
    MOTIVASYONLAR = EGITIM_MOTIVASYONLAR;
  }
  
  console.log(`📋 Test seti yüklendi: ${testTipi} (${BOLUMLER.length} bölüm)`);
}

// ───────────────────────────────────────────────
// STATE
// ───────────────────────────────────────────────
let aktifKullanici = null;
let aktifBasvuru = null;
let aktifBolum = 1;
let cevaplar = {}; // { 'k01': 5, 'd02': 'A', 's03': { secim: 'B', neden: '...' } }

// 🔍 DAVRANIŞSAL ANALİZ - Sahtekarlık tespiti
let davranisAnalizi = {
  testBaslangicZamani: null,
  testBitisZamani: null,
  toplamSureSn: 0,
  pasteOlaylari: {},  // { 'h01': [{karakter, zaman}, ...], ... }
  yazmaSureleri: {},  // { 'h01': { ilkYazma, sonYazma, toplamKarakter }, ... }
  bolumSureleri: {}   // { 1: 120, 2: 90, ... } saniye
};
let bolumBaslangicZamani = null;
const TOPLAM_SORU = toplamSoruSayisi();

// ───────────────────────────────────────────────
// Auth ve veri yükleme
// ───────────────────────────────────────────────
onAuthStateChanged(auth, async (kullanici) => {
  if (!kullanici) {
    document.getElementById('yukleniyor').classList.add('gizli');
    document.getElementById('yetkisiz').classList.remove('gizli');
    return;
  }
  
  aktifKullanici = kullanici;
  document.getElementById('kullaniciInfo').textContent = `👤 ${kullanici.email}`;
  
  try {
    // Başvuru var mı?
    const ref = doc(db, 'isBasvurulari', kullanici.email);
    const snap = await getDoc(ref);
    
    if (!snap.exists()) {
      document.getElementById('yukleniyor').classList.add('gizli');
      document.getElementById('yetkisiz').classList.remove('gizli');
      return;
    }
    
    aktifBasvuru = snap.data();
    
    // 🎯 POZİSYONA GÖRE TEST SETİNİ BELİRLE
    const kategoriId = aktifBasvuru.pozisyonKategoriId || aktifBasvuru.kategoriId || 'okulOncesiOgretmen';
    const testTipi = testTipiBul(kategoriId);
    testSetiniBelirle(testTipi);
    
    // Durumu kontrol et
    if (aktifBasvuru.durum === 'bilgilerEksik') {
      // Bilgileri eksik - bilgiler sayfasına gönder
      window.location.href = 'bilgiler.html';
      return;
    }
    
    if (aktifBasvuru.durum === 'tamamlandi' || 
        aktifBasvuru.durum === 'kabul' || 
        aktifBasvuru.durum === 'red' ||
        aktifBasvuru.durum === 'mulakat' ||
        aktifBasvuru.durum === 'havuz') {
      // Test zaten tamamlanmış
      window.location.href = 'tamamlandi.html';
      return;
    }
    
    // Eski cevaplar varsa yükle (yarıda bırakılmış)
    const testRef = doc(db, 'testCevaplari', kullanici.email);
    const testSnap = await getDoc(testRef);
    if (testSnap.exists()) {
      const veri = testSnap.data();
      cevaplar = veri.cevaplar || {};
      aktifBolum = veri.aktifBolum || 1;
    }
    
    document.getElementById('yukleniyor').classList.add('gizli');
    
    // Hangi ekranı gösterelim?
    if (aktifBolum === 1 && Object.keys(cevaplar).length === 0) {
      // Hiç başlamamış - karşılama ekranı
      const ad = aktifBasvuru.adayAdi || kullanici.email.split('@')[0];
      document.getElementById('adayIlk').textContent = ad.split(' ')[0];
      document.getElementById('karsilamaEkran').classList.remove('gizli');
    } else {
      // Devam ediyor - aktif bölümü göster
      bolumYukle(aktifBolum);
    }
    
  } catch (hata) {
    console.error('Yükleme hatası:', hata);
    document.getElementById('yukleniyor').innerHTML = `
      <div class="alert hata">Hata: ${hata.message}</div>
    `;
  }
});

// ───────────────────────────────────────────────
// Testi başlat
// ───────────────────────────────────────────────
window.testiBaslat = function() {
  document.getElementById('karsilamaEkran').classList.add('gizli');
  document.getElementById('ilerlemeBar').style.display = 'block';
  
  // 🔍 Davranış takibi başlat
  davranisAnalizi.testBaslangicZamani = Date.now();
  bolumBaslangicZamani = Date.now();
  
  bolumYukle(1);
};

// ───────────────────────────────────────────────
// Bölüm yükle
// ───────────────────────────────────────────────
function bolumYukle(bolumNo) {
  aktifBolum = bolumNo;
  const bolum = BOLUMLER.find(b => b.no === bolumNo);
  if (!bolum) return;
  
  // Tüm ekranları gizle
  ['karsilamaEkran', 'motivasyonEkran', 'tamamlandiEkran'].forEach(id => {
    document.getElementById(id).classList.add('gizli');
  });
  document.getElementById('bolumEkran').classList.remove('gizli');
  document.getElementById('ilerlemeBar').style.display = 'block';
  
  // Başlık ve açıklama
  document.getElementById('bolumNoGoster').textContent = `${bolum.no}/6`;
  document.getElementById('bolumBaslik').textContent = bolum.baslik;
  document.getElementById('bolumAltBaslik').textContent = bolum.altBaslik;
  document.getElementById('bolumAciklama').textContent = bolum.aciklama;
  
  // İlerleme barı
  document.getElementById('bolumGosterge').textContent = `Bölüm ${bolum.no}/6`;
  document.getElementById('bolumBaslikMini').textContent = bolum.baslik;
  
  // Soruları render et
  document.getElementById('sorularAlani').innerHTML = bolumRender(bolum, cevaplar);
  
  // Event listenerlar bağla
  eventBaglA();
  
  // İlerleme güncelle
  ilerlemeyiGuncelle();
  
  // Validasyon kontrol
  bolumDurumuKontrolEt();
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ───────────────────────────────────────────────
// Event listener'ları bağla
// ───────────────────────────────────────────────
function eventBaglA() {
  // Likert (kişilik)
  document.querySelectorAll('.likert-secenek input').forEach(input => {
    input.addEventListener('change', e => {
      const soruId = e.target.dataset.soruId;
      const puan = parseInt(e.target.value);
      cevaplar[soruId] = puan;
      
      // Görsel: önceki seçimi kaldır, yenisini ekle
      const grup = e.target.closest('.likert-grup');
      grup.querySelectorAll('.likert-secenek').forEach(s => s.classList.remove('secili'));
      e.target.closest('.likert-secenek').classList.add('secili');
      
      // Soru kartı işareti
      e.target.closest('.soru-kart').classList.add('cevaplandi');
      
      otoKaydet();
      bolumDurumuKontrolEt();
      ilerlemeyiGuncelle();
    });
  });
  
  // Forced Choice
  document.querySelectorAll('.fc-secenek input').forEach(input => {
    input.addEventListener('change', e => {
      const soruId = e.target.dataset.soruId;
      cevaplar[soruId] = e.target.value;
      
      const grup = e.target.closest('.forced-choice-grup');
      grup.querySelectorAll('.fc-secenek').forEach(s => s.classList.remove('secili'));
      e.target.closest('.fc-secenek').classList.add('secili');
      
      e.target.closest('.soru-kart').classList.add('cevaplandi');
      
      otoKaydet();
      bolumDurumuKontrolEt();
      ilerlemeyiGuncelle();
    });
  });
  
  // Çoktan Seçmeli (Senaryo + Etik)
  document.querySelectorAll('.cs-secenek input').forEach(input => {
    input.addEventListener('change', e => {
      const soruId = e.target.dataset.soruId;
      const secim = e.target.value;
      const nedenSor = e.target.dataset.nedenSor === 'true';
      
      // Mevcut cevap obje mi yoksa string mi?
      if (nedenSor) {
        const eskiNeden = cevaplar[soruId]?.neden || '';
        cevaplar[soruId] = { secim: secim, neden: eskiNeden };
      } else {
        cevaplar[soruId] = secim;
      }
      
      const grup = e.target.closest('.cs-grup');
      grup.querySelectorAll('.cs-secenek').forEach(s => s.classList.remove('secili'));
      e.target.closest('.cs-secenek').classList.add('secili');
      
      e.target.closest('.soru-kart').classList.add('cevaplandi');
      
      // Neden alanını aç
      if (nedenSor) {
        const nedenAlani = e.target.closest('.soru-kart').querySelector('.neden-alani');
        if (nedenAlani) nedenAlani.classList.add('acik');
      }
      
      otoKaydet();
      bolumDurumuKontrolEt();
      ilerlemeyiGuncelle();
    });
  });
  
  // Neden açıklamaları
  document.querySelectorAll('.neden-alani textarea').forEach(ta => {
    ta.addEventListener('input', e => {
      const soruId = e.target.dataset.soruId;
      if (typeof cevaplar[soruId] === 'object' && cevaplar[soruId] !== null) {
        cevaplar[soruId].neden = e.target.value;
      } else {
        cevaplar[soruId] = { secim: cevaplar[soruId] || '', neden: e.target.value };
      }
      otoKaydetGecikmeli();
      bolumDurumuKontrolEt();
    });
  });
  
  // Hikaye textarea
  document.querySelectorAll('.hikaye-alani textarea').forEach(ta => {
    
    // 🔍 PASTE EVENT - Yapıştırma takibi
    ta.addEventListener('paste', e => {
      const soruId = e.target.dataset.soruId;
      if (!soruId) return;
      
      const yapistirilan = (e.clipboardData || window.clipboardData)?.getData('text') || '';
      
      if (!davranisAnalizi.pasteOlaylari[soruId]) {
        davranisAnalizi.pasteOlaylari[soruId] = [];
      }
      
      davranisAnalizi.pasteOlaylari[soruId].push({
        karakter: yapistirilan.length,
        zaman: Date.now() - davranisAnalizi.testBaslangicZamani,
        ilkSatir: yapistirilan.substring(0, 100) // İlk 100 karakter (analiz için)
      });
      
      console.log(`🚨 Yapıştırma yakalandı: ${soruId} - ${yapistirilan.length} karakter`);
    });
    
    // 🔍 İLK YAZMA ANI
    ta.addEventListener('focus', e => {
      const soruId = e.target.dataset.soruId;
      if (!soruId) return;
      
      if (!davranisAnalizi.yazmaSureleri[soruId]) {
        davranisAnalizi.yazmaSureleri[soruId] = {
          ilkYazma: Date.now() - davranisAnalizi.testBaslangicZamani,
          sonYazma: null,
          toplamKarakter: 0,
          karakterDeggismeleri: 0
        };
      }
    });
    
    ta.addEventListener('input', e => {
      const soruId = e.target.dataset.soruId;
      const minKar = parseInt(e.target.dataset.minKarakter) || 0;
      cevaplar[soruId] = e.target.value;
      
      // 🔍 YAZMA TAKİBİ
      if (davranisAnalizi.yazmaSureleri[soruId]) {
        davranisAnalizi.yazmaSureleri[soruId].sonYazma = Date.now() - davranisAnalizi.testBaslangicZamani;
        davranisAnalizi.yazmaSureleri[soruId].toplamKarakter = e.target.value.length;
        davranisAnalizi.yazmaSureleri[soruId].karakterDeggismeleri++;
      }
      
      // Karakter sayacı
      const sayacEl = e.target.closest('.hikaye-alani').querySelector('.karakter-sayisi');
      const uzunluk = e.target.value.length;
      sayacEl.textContent = `${uzunluk} karakter (en az ${minKar})`;
      sayacEl.classList.remove('az', 'yeterli');
      if (uzunluk < minKar) {
        sayacEl.classList.add('az');
      } else {
        sayacEl.classList.add('yeterli');
        e.target.closest('.soru-kart').classList.add('cevaplandi');
      }
      
      otoKaydetGecikmeli();
      bolumDurumuKontrolEt();
      ilerlemeyiGuncelle();
    });
  });
}

// ───────────────────────────────────────────────
// Bölüm durumu kontrol (devam butonu aktif/pasif)
// ───────────────────────────────────────────────
function bolumDurumuKontrolEt() {
  const bolum = BOLUMLER.find(b => b.no === aktifBolum);
  if (!bolum) return;
  
  const sonuc = bolumValidate(bolum, cevaplar);
  const btn = document.getElementById('bolumTamamlaBtn');
  const durum = document.getElementById('bolumDurum');
  
  if (sonuc.gecerli) {
    btn.disabled = false;
    durum.innerHTML = '✓ Tüm sorular cevaplandı, devam edebilirsiniz!';
    durum.style.color = 'var(--ana-yesil)';
  } else {
    btn.disabled = true;
    durum.textContent = sonuc.mesaj || `${sonuc.tamamlanan}/${sonuc.toplam} soru cevaplandı`;
    durum.style.color = 'var(--gri)';
  }
}

// ───────────────────────────────────────────────
// İlerleme güncelle
// ───────────────────────────────────────────────
function ilerlemeyiGuncelle() {
  const cevaplananSayisi = Object.keys(cevaplar).filter(k => {
    const v = cevaplar[k];
    if (typeof v === 'object' && v !== null) {
      return v.secim && v.secim !== '';
    }
    return v !== null && v !== undefined && v !== '';
  }).length;
  
  const yuzde = Math.round((cevaplananSayisi / TOPLAM_SORU) * 100);
  
  document.getElementById('ilerlemePuan').textContent = `${cevaplananSayisi}/${TOPLAM_SORU}`;
  document.getElementById('ilerlemeYuzde').textContent = `%${yuzde}`;
  document.getElementById('ilerlemeCubuk').style.width = `${yuzde}%`;
}

// ───────────────────────────────────────────────
// Otomatik kayıt (her cevapta)
// ───────────────────────────────────────────────
let otoKayitTimer = null;
function otoKaydet() {
  if (otoKayitTimer) clearTimeout(otoKayitTimer);
  otoKayitTimer = setTimeout(kaydet, 800);
}

function otoKaydetGecikmeli() {
  // Yazı yazarken çok sık kayıt yapmamak için daha uzun gecikme
  if (otoKayitTimer) clearTimeout(otoKayitTimer);
  otoKayitTimer = setTimeout(kaydet, 2000);
}

async function kaydet() {
  if (!aktifKullanici) return;
  try {
    await setDoc(doc(db, 'testCevaplari', aktifKullanici.email), {
      adayEposta: aktifKullanici.email,
      adayAdi: aktifBasvuru?.adayAdi || '',
      pozisyonId: aktifBasvuru?.pozisyonId || null,
      kategoriId: aktifBasvuru?.kategoriId || null,
      cevaplar: cevaplar,
      aktifBolum: aktifBolum,
      sonGuncelleme: serverTimestamp()
    }, { merge: true });
  } catch (hata) {
    console.warn('Kayıt hatası:', hata);
  }
}

// ───────────────────────────────────────────────
// Bölüm tamamla
// ───────────────────────────────────────────────
window.bolumTamamla = async function() {
  // 🔍 Bu bölüm için harcanan süreyi kaydet
  if (bolumBaslangicZamani) {
    const sureSn = Math.floor((Date.now() - bolumBaslangicZamani) / 1000);
    davranisAnalizi.bolumSureleri[aktifBolum] = sureSn;
  }
  
  await kaydet();
  
  if (aktifBolum < 6) {
    motivasyonGoster(aktifBolum + 1);
    // Yeni bölüm başlangıç zamanı
    bolumBaslangicZamani = Date.now();
  } else {
    // Son bölümdü, testi bitir
    await testiTamamla();
  }
};

// ───────────────────────────────────────────────
// Motivasyon ekranı
// ───────────────────────────────────────────────
function motivasyonGoster(sonrakiBolum) {
  const mot = MOTIVASYONLAR.find(m => m.sonraki === sonrakiBolum);
  if (!mot) {
    bolumYukle(sonrakiBolum);
    return;
  }
  
  document.getElementById('bolumEkran').classList.add('gizli');
  document.getElementById('motivasyonEkran').classList.remove('gizli');
  
  document.getElementById('motIkon').textContent = mot.ikon;
  document.getElementById('motBaslik').textContent = mot.baslik;
  document.getElementById('motMesaj').textContent = mot.mesaj;
  
  // Noktaları güncelle
  document.querySelectorAll('.motivasyon-nokta').forEach(nokta => {
    const bolumNo = parseInt(nokta.dataset.bolum);
    nokta.classList.remove('tamamlandi', 'aktif');
    if (bolumNo < sonrakiBolum) nokta.classList.add('tamamlandi');
    if (bolumNo === sonrakiBolum) nokta.classList.add('aktif');
  });
  
  // Sonraki bölüm bilgisini sakla (geçici)
  window._sonrakiBolum = sonrakiBolum;
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.sonrakiBolumeBasla = function() {
  const bolum = window._sonrakiBolum;
  if (bolum) {
    bolumYukle(bolum);
  }
};

// ───────────────────────────────────────────────
// Testi tamamla
// ───────────────────────────────────────────────
async function testiTamamla() {
  try {
    // 🔍 Test bitiş zamanı + toplam süre
    davranisAnalizi.testBitisZamani = Date.now();
    davranisAnalizi.toplamSureSn = Math.floor(
      (davranisAnalizi.testBitisZamani - davranisAnalizi.testBaslangicZamani) / 1000
    );
    
    // Son bölümün süresini de kaydet
    if (bolumBaslangicZamani) {
      const sureSn = Math.floor((Date.now() - bolumBaslangicZamani) / 1000);
      davranisAnalizi.bolumSureleri[aktifBolum] = sureSn;
    }
    
    // Final kayıt + davranış verisi + test tipi
    await setDoc(doc(db, 'testCevaplari', aktifKullanici.email), {
      cevaplar: cevaplar,
      aktifBolum: 7,
      tamamlandi: true,
      tamamlanmaZamani: serverTimestamp(),
      davranisAnalizi: davranisAnalizi,
      testTipi: aktifTestTipi  // 🎯 'egitim', 'destek' veya 'idari'
    }, { merge: true });
    
    // Başvuru durumunu güncelle
    await updateDoc(doc(db, 'isBasvurulari', aktifKullanici.email), {
      durum: 'tamamlandi',
      testTamamlanmaZamani: serverTimestamp()
    });
    
    // Test tamam maili gönder (asenkron)
    mailGonder(
      aktifKullanici.email,
      aktifBasvuru?.adayAdi || aktifKullanici.email.split('@')[0],
      'testTamam',
      {}
    ).catch(e => console.warn('Mail gönderilemedi:', e));
    
    // Tamamlandı ekranı
    document.getElementById('bolumEkran').classList.add('gizli');
    document.getElementById('motivasyonEkran').classList.add('gizli');
    document.getElementById('ilerlemeBar').style.display = 'none';
    document.getElementById('tamamlandiEkran').classList.remove('gizli');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // 🤖 AI ANALİZİNİ ARKA PLANDA TETİKLE (kullanıcı sayfayı kapatabilir)
    aiAnaliziTetikle().catch(e => console.warn('AI analiz hatası:', e));
    
  } catch (hata) {
    console.error('Tamamlama hatası:', hata);
    alertGoster('hata', 'Bir hata oluştu: ' + hata.message);
  }
}

// ───────────────────────────────────────────────
// AI Analizi tetikle (arka planda)
// ───────────────────────────────────────────────
async function aiAnaliziTetikle() {
  try {
    console.log('🤖 AI analizi başlatılıyor...');
    
    const yanit = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        islem: 'aiAnaliz',
        adayBilgileri: aktifBasvuru,
        testCevaplari: cevaplar,
        davranisAnalizi: davranisAnalizi,
        testTipi: aktifTestTipi  // 🎯 'egitim', 'destek' veya 'idari'
      })
    });
    
    const sonuc = await yanit.json();
    
    if (sonuc.basarili && sonuc.analiz) {
      // Analizi Firestore'a kaydet
      await setDoc(doc(db, 'analizler', aktifKullanici.email), {
        adayEposta: aktifKullanici.email,
        adayAdi: aktifBasvuru?.adayAdi || '',
        analiz: sonuc.analiz,
        tokenKullanimi: sonuc.tokenKullanimi || null,
        olusturmaZamani: serverTimestamp()
      });
      
      console.log('✅ AI analizi tamamlandı ve kaydedildi');
    } else {
      console.warn('⚠️ AI analiz hatası:', sonuc.hata);
    }
  } catch (hata) {
    console.error('AI analiz fetch hatası:', hata);
  }
}

// ───────────────────────────────────────────────
// Çıkış
// ───────────────────────────────────────────────
window.cikisYap = async function() {
  // Önce kaydet
  await kaydet();
  await signOut(auth);
  window.location.href = 'index.html';
};

// Sekme kapanırken otomatik kayıt
window.addEventListener('beforeunload', () => {
  // Sync API yok, async kayıt kapanabilir; en azından son cevabı sakla
  if (otoKayitTimer) {
    clearTimeout(otoKayitTimer);
    kaydet();
  }
});
