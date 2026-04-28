// ═══════════════════════════════════════════════════════════
// BÖLÜM RENDERLEM E VE VALİDASYON
// Her bölüm için ayrı HTML üretimi
// ═══════════════════════════════════════════════════════════

import { 
  bolumeKadarSoruSayisi,
  LIKERT_ETIKETLER
} from './test-sorular.js';

// ───────────────────────────────────────────────
// Bölümün tüm sorularını render et
// ───────────────────────────────────────────────
export function bolumRender(bolum, mevcutCevaplar) {
  const baslangicNo = bolumeKadarSoruSayisi(bolum.no) + 1;
  
  return bolum.sorular.map((soru, idx) => {
    const soruNo = baslangicNo + idx;
    const cevap = mevcutCevaplar[soru.id];
    const cevaplandiSinif = cevap ? 'cevaplandi' : '';
    
    let icerik = '';
    
    switch (bolum.tip) {
      case 'likert':
        icerik = renderLikert(soru, cevap);
        break;
      case 'forcedChoice':
        icerik = renderForcedChoice(soru, cevap);
        break;
      case 'senaryo':
        icerik = renderSenaryo(soru, cevap);
        break;
      case 'metin':
        icerik = renderMetin(soru, cevap);
        break;
      case 'cokSecmeli':
        icerik = renderCokSecmeli(soru, cevap);
        break;
      case 'tekSecim':
        icerik = renderTekSecim(soru, cevap);
        break;
    }
    
    return `
      <div class="soru-kart ${cevaplandiSinif}" id="soru_${soru.id}">
        <div class="soru-no">Soru ${soruNo}</div>
        ${icerik}
      </div>
    `;
  }).join('');
}

// ───────────────────────────────────────────────
// LIKERT (1-5)
// ───────────────────────────────────────────────
function renderLikert(soru, cevap) {
  const seceneklerHTML = LIKERT_ETIKETLER.map(et => `
    <label class="likert-secenek ${cevap === et.puan ? 'secili' : ''}">
      <input type="radio" name="${soru.id}" value="${et.puan}" 
             data-soru-id="${soru.id}"
             ${cevap === et.puan ? 'checked' : ''}>
      <div class="puan">${et.puan}</div>
      <div class="etiket">${et.kisa}</div>
    </label>
  `).join('');
  
  return `
    <div class="soru-metni">${soru.soru}</div>
    <div class="likert-grup">
      ${seceneklerHTML}
    </div>
  `;
}

// ───────────────────────────────────────────────
// FORCED CHOICE (İki seçenek)
// ───────────────────────────────────────────────
function renderForcedChoice(soru, cevap) {
  return `
    <div class="soru-metni">${soru.soru}</div>
    <div class="forced-choice-grup">
      <label class="fc-secenek ${cevap === 'A' ? 'secili' : ''}">
        <input type="radio" name="${soru.id}" value="A" 
               data-soru-id="${soru.id}"
               ${cevap === 'A' ? 'checked' : ''}>
        <div class="fc-harf">A</div>
        <div class="fc-metin">${soru.secenekler.A.metin}</div>
      </label>
      <label class="fc-secenek ${cevap === 'B' ? 'secili' : ''}">
        <input type="radio" name="${soru.id}" value="B" 
               data-soru-id="${soru.id}"
               ${cevap === 'B' ? 'checked' : ''}>
        <div class="fc-harf">B</div>
        <div class="fc-metin">${soru.secenekler.B.metin}</div>
      </label>
    </div>
  `;
}

// ───────────────────────────────────────────────
// SENARYO (Çoktan seçmeli + neden)
// ───────────────────────────────────────────────
function renderSenaryo(soru, cevap) {
  const secim = (typeof cevap === 'object' && cevap !== null) ? cevap.secim : cevap;
  const neden = (typeof cevap === 'object' && cevap !== null) ? (cevap.neden || '') : '';
  
  const seceneklerHTML = soru.secenekler.map(s => `
    <label class="cs-secenek ${secim === s.id ? 'secili' : ''}">
      <input type="radio" name="${soru.id}" value="${s.id}" 
             data-soru-id="${soru.id}"
             data-neden-sor="${soru.nedenSor || false}"
             ${secim === s.id ? 'checked' : ''}>
      <div class="cs-harf">${s.id}</div>
      <div class="cs-metin">${s.metin}</div>
    </label>
  `).join('');
  
  const nedenAlani = soru.nedenSor ? `
    <div class="neden-alani ${secim ? 'acik' : ''}">
      <label>💭 Neden bu cevabı verdiniz? <span style="font-weight:normal; color:var(--gri);">(en az birkaç cümle)</span></label>
      <textarea data-soru-id="${soru.id}" 
                placeholder="Düşüncenizi kısaca açıklayın..."
                rows="2">${neden}</textarea>
    </div>
  ` : '';
  
  return `
    <div class="soru-metni">📌 ${soru.senaryo}</div>
    <div class="cs-grup">
      ${seceneklerHTML}
    </div>
    ${nedenAlani}
  `;
}

// ───────────────────────────────────────────────
// METİN (Hikaye - açık uçlu)
// ───────────────────────────────────────────────
function renderMetin(soru, cevap) {
  const deger = cevap || '';
  const uzunluk = deger.length;
  const yeterli = uzunluk >= soru.minKarakter;
  
  return `
    <div class="soru-metni">${soru.soru}</div>
    ${soru.yardim ? `<div class="soru-yardim">💡 ${soru.yardim}</div>` : ''}
    <div class="hikaye-alani">
      <textarea data-soru-id="${soru.id}"
                data-min-karakter="${soru.minKarakter}"
                placeholder="${soru.placeholder || ''}"
                maxlength="${soru.maxKarakter || 2000}"
                rows="6">${deger}</textarea>
      <div class="karakter-sayisi ${yeterli ? 'yeterli' : (uzunluk > 0 ? 'az' : '')}">
        ${uzunluk} karakter (en az ${soru.minKarakter})
      </div>
    </div>
  `;
}

// ───────────────────────────────────────────────
// ÇOKTAN SEÇMELİ (Etik soruları - tek doğru var)
// ───────────────────────────────────────────────
function renderCokSecmeli(soru, cevap) {
  const seceneklerHTML = soru.secenekler.map(s => `
    <label class="cs-secenek ${cevap === s.id ? 'secili' : ''}">
      <input type="radio" name="${soru.id}" value="${s.id}" 
             data-soru-id="${soru.id}"
             data-neden-sor="false"
             ${cevap === s.id ? 'checked' : ''}>
      <div class="cs-harf">${s.id}</div>
      <div class="cs-metin">${s.metin}</div>
    </label>
  `).join('');
  
  return `
    <div class="soru-metni">${soru.soru}</div>
    <div class="cs-grup">
      ${seceneklerHTML}
    </div>
  `;
}

// ───────────────────────────────────────────────
// TEK SEÇİM (Hızlı tepki - cümle tamamlama)
// ───────────────────────────────────────────────
function renderTekSecim(soru, cevap) {
  const seceneklerHTML = soru.secenekler.map((s, idx) => {
    const harf = String.fromCharCode(65 + idx); // A, B, C...
    return `
      <label class="cs-secenek ${cevap === s ? 'secili' : ''}">
        <input type="radio" name="${soru.id}" value="${s}" 
               data-soru-id="${soru.id}"
               data-neden-sor="false"
               ${cevap === s ? 'checked' : ''}>
        <div class="cs-harf">${harf}</div>
        <div class="cs-metin">${s}</div>
      </label>
    `;
  }).join('');
  
  return `
    <div class="soru-metni">${soru.soru}</div>
    <div class="cs-grup">
      ${seceneklerHTML}
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// VALİDASYON - Bölüm tamamlandı mı?
// ═══════════════════════════════════════════════════════════
export function bolumValidate(bolum, cevaplar) {
  const toplam = bolum.sorular.length;
  let tamamlanan = 0;
  let eksikIds = [];
  let nedenEksikIds = [];
  let hikayeEksikIds = [];
  
  bolum.sorular.forEach(soru => {
    const cevap = cevaplar[soru.id];
    
    if (cevap === undefined || cevap === null || cevap === '') {
      eksikIds.push(soru.id);
      return;
    }
    
    // Senaryo - hem seçim hem neden gerekli olanlar
    if (bolum.tip === 'senaryo' && soru.nedenSor) {
      if (typeof cevap !== 'object' || !cevap.secim) {
        eksikIds.push(soru.id);
        return;
      }
      if (!cevap.neden || cevap.neden.trim().length < 10) {
        nedenEksikIds.push(soru.id);
        return;
      }
    }
    
    // Senaryo - sadece seçim gereken
    if (bolum.tip === 'senaryo' && !soru.nedenSor) {
      const secim = (typeof cevap === 'object') ? cevap.secim : cevap;
      if (!secim) {
        eksikIds.push(soru.id);
        return;
      }
    }
    
    // Hikaye - minimum karakter
    if (bolum.tip === 'metin') {
      if (cevap.length < soru.minKarakter) {
        hikayeEksikIds.push({ id: soru.id, mevcut: cevap.length, gerekli: soru.minKarakter });
        return;
      }
    }
    
    tamamlanan++;
  });
  
  const gecerli = (eksikIds.length === 0) && 
                  (nedenEksikIds.length === 0) && 
                  (hikayeEksikIds.length === 0);
  
  let mesaj = '';
  if (eksikIds.length > 0) {
    mesaj = `${tamamlanan}/${toplam} soru cevaplandı`;
  } else if (nedenEksikIds.length > 0) {
    mesaj = `${nedenEksikIds.length} soruda "neden" açıklaması yetersiz (en az 10 karakter)`;
  } else if (hikayeEksikIds.length > 0) {
    mesaj = `Hikayelerde minimum karakter sayısına ulaşılmadı`;
  }
  
  return {
    gecerli,
    tamamlanan,
    toplam,
    eksikIds,
    nedenEksikIds,
    hikayeEksikIds,
    mesaj
  };
}
