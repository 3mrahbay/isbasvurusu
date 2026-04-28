// ═══════════════════════════════════════════════════════════
// YARDIMCI FONKSİYONLAR
// Mail gönderimi, form validasyonu, ortak kullanım
// ═══════════════════════════════════════════════════════════

import { PROXY_URL } from './firebase-config.js';

/**
 * Apps Script üzerinden mail gönderir
 * @param {string} alici - Alıcı eposta
 * @param {string} aliciAdi - Alıcı adı
 * @param {string} tip - hosgeldin | tebrik | havuz | testTamam
 * @param {object} parametreler - Ek parametreler
 */
export async function mailGonder(alici, aliciAdi, tip, parametreler = {}) {
  try {
    // Apps Script'e POST yapacağız ama CORS sorunu yaşamamak için 
    // text/plain kullanıyoruz (Apps Script özelliği)
    const yanit = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        islem: 'mailGonder',
        alici: alici,
        aliciAdi: aliciAdi,
        tip: tip,
        parametreler: parametreler
      })
    });
    
    const sonuc = await yanit.json();
    
    if (sonuc.basarili) {
      console.log(`Mail gönderildi: ${tip} -> ${alici}`);
      return true;
    } else {
      console.error('Mail hatası:', sonuc.hata);
      return false;
    }
  } catch (hata) {
    console.error('Mail gönderim hatası:', hata);
    return false;
  }
}

/**
 * Telefon numarasını formatlar (5XX XXX XX XX)
 */
export function telefonFormatla(numara) {
  let temiz = numara.replace(/\D/g, '');
  
  // Başında 0 varsa kaldır
  if (temiz.startsWith('0')) temiz = temiz.substring(1);
  // Başında 90 varsa kaldır
  if (temiz.startsWith('90')) temiz = temiz.substring(2);
  
  if (temiz.length === 0) return '';
  if (temiz.length <= 3) return temiz;
  if (temiz.length <= 6) return `${temiz.substring(0,3)} ${temiz.substring(3)}`;
  if (temiz.length <= 8) return `${temiz.substring(0,3)} ${temiz.substring(3,6)} ${temiz.substring(6)}`;
  return `${temiz.substring(0,3)} ${temiz.substring(3,6)} ${temiz.substring(6,8)} ${temiz.substring(8,10)}`;
}

/**
 * Telefon numarası validasyonu (Türkiye)
 */
export function telefonGecerli(numara) {
  const temiz = numara.replace(/\D/g, '');
  // 5XX XXX XX XX = 10 hane (başında 0 olmadan)
  return temiz.length === 10 && temiz.startsWith('5');
}

/**
 * Eposta validasyonu
 */
export function epostaGecerli(eposta) {
  const desen = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return desen.test(eposta);
}

/**
 * Yaş hesapla (doğum tarihinden)
 */
export function yasHesapla(dogumTarihi) {
  const bugun = new Date();
  const dogum = new Date(dogumTarihi);
  let yas = bugun.getFullYear() - dogum.getFullYear();
  const ayFark = bugun.getMonth() - dogum.getMonth();
  if (ayFark < 0 || (ayFark === 0 && bugun.getDate() < dogum.getDate())) {
    yas--;
  }
  return yas;
}

/**
 * Tarih formatla (DD.MM.YYYY)
 */
export function tarihFormatla(tarih) {
  if (!tarih) return '';
  const t = tarih.toDate ? tarih.toDate() : new Date(tarih);
  const gun = String(t.getDate()).padStart(2, '0');
  const ay = String(t.getMonth() + 1).padStart(2, '0');
  const yil = t.getFullYear();
  return `${gun}.${ay}.${yil}`;
}

/**
 * Form alanı hata göster
 */
export function hataGoster(alanId, mesaj) {
  const grup = document.getElementById(alanId)?.closest('.form-grup');
  if (!grup) return;
  grup.classList.add('hata');
  let hataMetni = grup.querySelector('.hata-metni');
  if (!hataMetni) {
    hataMetni = document.createElement('div');
    hataMetni.className = 'hata-metni';
    grup.appendChild(hataMetni);
  }
  hataMetni.textContent = mesaj;
}

/**
 * Form alanı hata temizle
 */
export function hataTemizle(alanId) {
  const grup = document.getElementById(alanId)?.closest('.form-grup');
  if (!grup) return;
  grup.classList.remove('hata');
}

/**
 * Tüm hataları temizle
 */
export function tumHatalariTemizle() {
  document.querySelectorAll('.form-grup.hata').forEach(grup => {
    grup.classList.remove('hata');
  });
}

/**
 * Buton durumu (yükleniyor)
 */
export function butonYukle(buton, mesaj = 'Yükleniyor...') {
  if (!buton) return;
  buton.disabled = true;
  buton.dataset.eskiMetin = buton.textContent;
  buton.textContent = mesaj;
}

export function butonNormal(buton) {
  if (!buton) return;
  buton.disabled = false;
  if (buton.dataset.eskiMetin) {
    buton.textContent = buton.dataset.eskiMetin;
  }
}
