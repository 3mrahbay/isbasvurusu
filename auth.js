// ═══════════════════════════════════════════════════════════
// ORTAK AUTH FONKSİYONLARI (logout için kullanılır)
// Index.html artık bilgilendirme sitesi olduğu için login mantığı
// basvuru.js içinde çalışıyor.
// ═══════════════════════════════════════════════════════════

import { 
  auth,
  signOut
} from './firebase-config.js';

// Çıkış yap
window.cikisYap = async function() {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (hata) {
    console.error('Çıkış hatası:', hata);
  }
};
