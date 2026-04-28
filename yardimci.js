// ═══════════════════════════════════════════════════════════
// YARDIMCI FONKSİYONLAR
// ═══════════════════════════════════════════════════════════

import { PROXY_URL } from './firebase-config.js';

/**
 * Apps Script üzerinden mail gönderir
 */
export async function mailGonder(alici, aliciAdi, tip, parametreler = {}) {
  try {
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
 * Telefon formatlama
 */
export function telefonFormatla(numara) {
  let temiz = numara.replace(/\D/g, '');
  if (temiz.startsWith('0')) temiz = temiz.substring(1);
  if (temiz.startsWith('90')) temiz = temiz.substring(2);
  if (temiz.length === 0) return '';
  if (temiz.length <= 3) return temiz;
  if (temiz.length <= 6) return `${temiz.substring(0,3)} ${temiz.substring(3)}`;
  if (temiz.length <= 8) return `${temiz.substring(0,3)} ${temiz.substring(3,6)} ${temiz.substring(6)}`;
  return `${temiz.substring(0,3)} ${temiz.substring(3,6)} ${temiz.substring(6,8)} ${temiz.substring(8,10)}`;
}

export function telefonGecerli(numara) {
  const temiz = numara.replace(/\D/g, '');
  return temiz.length === 10 && temiz.startsWith('5');
}

export function epostaGecerli(eposta) {
  const desen = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return desen.test(eposta);
}

/**
 * Tarih formatlama
 */
export function tarihFormatla(tarih) {
  if (!tarih) return '';
  const t = tarih.toDate ? tarih.toDate() : new Date(tarih);
  const gun = String(t.getDate()).padStart(2, '0');
  const ay = String(t.getMonth() + 1).padStart(2, '0');
  const yil = t.getFullYear();
  return `${gun}.${ay}.${yil}`;
}

export function tarihSaatFormatla(tarih) {
  if (!tarih) return '';
  const t = tarih.toDate ? tarih.toDate() : new Date(tarih);
  const gun = String(t.getDate()).padStart(2, '0');
  const ay = String(t.getMonth() + 1).padStart(2, '0');
  const yil = t.getFullYear();
  const saat = String(t.getHours()).padStart(2, '0');
  const dakika = String(t.getMinutes()).padStart(2, '0');
  return `${gun}.${ay}.${yil} ${saat}:${dakika}`;
}

/**
 * Geri sayım - kalan süreyi hesapla
 */
export function geriSayimHesapla(hedefTarih) {
  const simdi = new Date().getTime();
  const hedef = hedefTarih.toDate ? hedefTarih.toDate().getTime() : new Date(hedefTarih).getTime();
  const fark = hedef - simdi;
  
  if (fark <= 0) return null;
  
  const gun = Math.floor(fark / (1000 * 60 * 60 * 24));
  const saat = Math.floor((fark % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const dakika = Math.floor((fark % (1000 * 60 * 60)) / (1000 * 60));
  const saniye = Math.floor((fark % (1000 * 60)) / 1000);
  
  return { gun, saat, dakika, saniye, toplamSaniye: Math.floor(fark / 1000) };
}

/**
 * Form alanı hata göster/temizle
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

export function hataTemizle(alanId) {
  const grup = document.getElementById(alanId)?.closest('.form-grup');
  if (!grup) return;
  grup.classList.remove('hata');
}

export function tumHatalariTemizle() {
  document.querySelectorAll('.form-grup.hata').forEach(grup => grup.classList.remove('hata'));
}

/**
 * Buton durumu
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
  if (buton.dataset.eskiMetin) buton.textContent = buton.dataset.eskiMetin;
}

/**
 * Alert göster
 */
export function alertGoster(tip, mesaj, hedefId = 'alertAlani') {
  const hedef = document.getElementById(hedefId);
  if (!hedef) {
    alert(mesaj);
    return;
  }
  hedef.innerHTML = `<div class="alert ${tip}">${mesaj}</div>`;
  hedef.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  
  if (tip === 'basarili') {
    setTimeout(() => { hedef.innerHTML = ''; }, 4000);
  }
}

/**
 * Mobil menü toggle
 */
export function mobilMenuToggle() {
  const menu = document.querySelector('.nav-menu');
  if (menu) menu.classList.toggle('acik');
}

/**
 * Token üret (opt-out için)
 */
export function tokenUret() {
  const karakterler = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += karakterler.charAt(Math.floor(Math.random() * karakterler.length));
  }
  return token;
}

/**
 * URL parametrelerini al
 */
export function urlParametreAl(ad) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(ad);
}

/**
 * Pozisyon kategorileri (sabit liste)
 */
export const POZISYON_KATEGORILERI = [
  { id: 'okulOncesiOgretmen', ad: 'Okul Öncesi Öğretmeni', ikon: '📚' },
  { id: 'egitimKoordinatoru', ad: 'Eğitim Koordinatörü', ikon: '🎯' },
  { id: 'bransOgretmeni', ad: 'Branş Öğretmeni (Müzik, Görsel Sanatlar, Beden Eğitimi)', ikon: '🎨' },
  { id: 'cocukGelisimi', ad: 'Çocuk Gelişimi Uzmanı', ikon: '🌱' },
  { id: 'rehberlik', ad: 'Rehberlik / Psikoloji', ikon: '💚' },
  { id: 'ingilizceOgretmen', ad: 'İngilizce Öğretmeni / Native Speaker', ikon: '🌍' },
  { id: 'asci', ad: 'Aşçı / Mutfak Personeli', ikon: '🍳' },
  { id: 'temizlik', ad: 'Temizlik Personeli', ikon: '🧹' },
  { id: 'halklaIliskiler', ad: 'Halkla İlişkiler', ikon: '📞' },
  { id: 'muhasebe', ad: 'Muhasebe / İdari', ikon: '📊' },
  { id: 'yardimciOgretmen', ad: 'Yardımcı Öğretmen / Stajyer', ikon: '🎓' },
  { id: 'soforServis', ad: 'Şoför / Servis Sorumlusu', ikon: '🚌' },
  { id: 'guvenlik', ad: 'Güvenlik Görevlisi', ikon: '🛡️' },
  { id: 'diger', ad: 'Diğer', ikon: '✨' }
];

/**
 * Pozisyon kategorisini ad'a göre bul
 */
export function pozisyonKategorisiBul(id) {
  return POZISYON_KATEGORILERI.find(p => p.id === id) || POZISYON_KATEGORILERI.find(p => p.id === 'diger');
}
