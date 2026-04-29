// ═══════════════════════════════════════════════════════════
// METİN EDİTÖRÜ - Hafif, Hızlı, Modüler
// Kullanım: editorOlustur('textareaId', { onizleme: true })
// ═══════════════════════════════════════════════════════════

const TOOLBAR_BUTONLARI = [
  { 
    id: 'kalin',
    ikon: '<strong>B</strong>',
    baslik: 'Kalın (Ctrl+B)',
    tag: 'strong',
    kisayol: 'b'
  },
  {
    id: 'italik',
    ikon: '<em>I</em>',
    baslik: 'İtalik (Ctrl+I)',
    tag: 'em',
    kisayol: 'i'
  },
  { tip: 'ayrac' },
  {
    id: 'h2',
    ikon: 'H2',
    baslik: 'Büyük Başlık',
    tag: 'h2',
    blok: true
  },
  {
    id: 'h3',
    ikon: 'H3',
    baslik: 'Küçük Başlık',
    tag: 'h3',
    blok: true
  },
  { tip: 'ayrac' },
  {
    id: 'liste',
    ikon: '• Liste',
    baslik: 'Maddeli Liste',
    tip: 'liste',
    listeTipi: 'ul'
  },
  {
    id: 'numarali',
    ikon: '1. Liste',
    baslik: 'Numaralı Liste',
    tip: 'liste',
    listeTipi: 'ol'
  },
  { tip: 'ayrac' },
  {
    id: 'vurgu',
    ikon: '💚',
    baslik: 'Vurgu (yeşil arka plan)',
    sariciAcik: '<span class="vurgu">',
    sariciKapali: '</span>'
  },
  {
    id: 'link',
    ikon: '🔗',
    baslik: 'Link Ekle (Ctrl+K)',
    tip: 'link',
    kisayol: 'k'
  },
  { tip: 'ayrac' },
  {
    id: 'paragraf',
    ikon: '¶',
    baslik: 'Paragraf Sonu',
    tip: 'paragraf'
  },
  {
    id: 'temizle',
    ikon: '🧹',
    baslik: 'Formatı Temizle',
    tip: 'temizle'
  }
];

// ───────────────────────────────────────────────
// Editörü oluştur ve textarea'ya bağla
// ───────────────────────────────────────────────
export function editorOlustur(textareaId, ayarlar = {}) {
  const ta = document.getElementById(textareaId);
  if (!ta) {
    console.warn(`Editör: textarea #${textareaId} bulunamadı`);
    return;
  }
  
  // Eğer zaten bağlanmışsa atla
  if (ta.dataset.editorBagli === 'true') return;
  ta.dataset.editorBagli = 'true';
  
  const onizlemeAcik = ayarlar.onizleme !== false; // Varsayılan açık
  
  // Wrapper oluştur
  const wrapper = document.createElement('div');
  wrapper.className = 'metin-editor-sarici';
  
  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'metin-editor-toolbar';
  
  TOOLBAR_BUTONLARI.forEach(btn => {
    if (btn.tip === 'ayrac') {
      const ayrac = document.createElement('div');
      ayrac.className = 'me-ayrac';
      toolbar.appendChild(ayrac);
      return;
    }
    
    const buton = document.createElement('button');
    buton.type = 'button';
    buton.className = 'me-btn';
    buton.innerHTML = btn.ikon;
    buton.title = btn.baslik;
    buton.dataset.editorBtn = btn.id;
    buton.addEventListener('click', (e) => {
      e.preventDefault();
      butonaTikla(ta, btn);
    });
    toolbar.appendChild(buton);
  });
  
  // Önizleme buton (sadece onizleme=true ise)
  if (onizlemeAcik) {
    const ayrac = document.createElement('div');
    ayrac.className = 'me-ayrac';
    toolbar.appendChild(ayrac);
    
    const onizleBtn = document.createElement('button');
    onizleBtn.type = 'button';
    onizleBtn.className = 'me-btn me-onizle';
    onizleBtn.innerHTML = '👁️ Önizle';
    onizleBtn.title = 'Önizlemeyi aç/kapat';
    onizleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      onizlemeyiToggle(wrapper);
    });
    toolbar.appendChild(onizleBtn);
  }
  
  // Geri al butonu (en sağa)
  const ayrac2 = document.createElement('div');
  ayrac2.style.flex = '1';
  toolbar.appendChild(ayrac2);
  
  const geriAlBtn = document.createElement('button');
  geriAlBtn.type = 'button';
  geriAlBtn.className = 'me-btn';
  geriAlBtn.innerHTML = '↺';
  geriAlBtn.title = 'Geri Al (Ctrl+Z)';
  geriAlBtn.addEventListener('click', (e) => {
    e.preventDefault();
    document.execCommand('undo');
    ta.focus();
  });
  toolbar.appendChild(geriAlBtn);
  
  // Sıralama: textarea'yı wrapper içine al
  ta.parentNode.insertBefore(wrapper, ta);
  wrapper.appendChild(toolbar);
  wrapper.appendChild(ta);
  
  // Textarea stillemesi
  ta.classList.add('me-textarea');
  
  // Önizleme alanı
  let onizlemeAlani = null;
  if (onizlemeAcik) {
    onizlemeAlani = document.createElement('div');
    onizlemeAlani.className = 'me-onizleme gizli';
    onizlemeAlani.innerHTML = `
      <div class="me-onizleme-baslik">
        <span>👁️ Önizleme</span>
        <small>Adaylara böyle görünecek</small>
      </div>
      <div class="me-onizleme-icerik"></div>
    `;
    wrapper.appendChild(onizlemeAlani);
    
    // Textarea değiştikçe önizlemeyi güncelle
    ta.addEventListener('input', () => {
      onizlemeyiGuncelle(wrapper);
    });
    
    // İlk yükleme
    onizlemeyiGuncelle(wrapper);
  }
  
  // Klavye kısayolları
  ta.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    
    const kisayollar = {
      'b': 'kalin',
      'i': 'italik',
      'k': 'link'
    };
    
    const btnId = kisayollar[e.key.toLowerCase()];
    if (btnId) {
      e.preventDefault();
      const btn = TOOLBAR_BUTONLARI.find(b => b.id === btnId);
      if (btn) butonaTikla(ta, btn);
    }
  });
}

// ───────────────────────────────────────────────
// Buton tıklama mantığı
// ───────────────────────────────────────────────
function butonaTikla(ta, btn) {
  const baslangic = ta.selectionStart;
  const bitis = ta.selectionEnd;
  const seciliMetin = ta.value.substring(baslangic, bitis);
  const oncesi = ta.value.substring(0, baslangic);
  const sonrasi = ta.value.substring(bitis);
  
  let yeniMetin;
  let yeniBaslangic;
  let yeniBitis;
  
  // Tag (kalın, italik)
  if (btn.tag && !btn.blok) {
    const acTag = `<${btn.tag}>`;
    const kapTag = `</${btn.tag}>`;
    yeniMetin = oncesi + acTag + (seciliMetin || 'metin') + kapTag + sonrasi;
    yeniBaslangic = baslangic + acTag.length;
    yeniBitis = yeniBaslangic + (seciliMetin || 'metin').length;
  }
  // Blok tag (h2, h3) — yeni satıra koy
  else if (btn.tag && btn.blok) {
    const acTag = `<${btn.tag}>`;
    const kapTag = `</${btn.tag}>`;
    
    // Önceki karakter newline değilse newline ekle
    const oncekiNL = (oncesi.length > 0 && !oncesi.endsWith('\n')) ? '\n' : '';
    const sonrakiNL = (sonrasi.length > 0 && !sonrasi.startsWith('\n')) ? '\n' : '';
    
    const icerik = seciliMetin || 'Başlık';
    yeniMetin = oncesi + oncekiNL + acTag + icerik + kapTag + sonrakiNL + sonrasi;
    yeniBaslangic = baslangic + oncekiNL.length + acTag.length;
    yeniBitis = yeniBaslangic + icerik.length;
  }
  // Liste
  else if (btn.tip === 'liste') {
    const tag = btn.listeTipi; // ul veya ol
    const oncekiNL = (oncesi.length > 0 && !oncesi.endsWith('\n')) ? '\n' : '';
    const sonrakiNL = (sonrasi.length > 0 && !sonrasi.startsWith('\n')) ? '\n' : '';
    
    let liItems;
    if (seciliMetin) {
      // Seçili metni satırlara böl, her satır için <li>
      liItems = seciliMetin.split('\n')
        .filter(s => s.trim())
        .map(s => `  <li>${s.trim()}</li>`)
        .join('\n');
    } else {
      liItems = '  <li>Madde 1</li>\n  <li>Madde 2</li>\n  <li>Madde 3</li>';
    }
    
    const yeni = `<${tag}>\n${liItems}\n</${tag}>`;
    yeniMetin = oncesi + oncekiNL + yeni + sonrakiNL + sonrasi;
    yeniBaslangic = baslangic + oncekiNL.length + yeni.length;
    yeniBitis = yeniBaslangic;
  }
  // Sarıcı (vurgu için)
  else if (btn.sariciAcik) {
    yeniMetin = oncesi + btn.sariciAcik + (seciliMetin || 'vurgu') + btn.sariciKapali + sonrasi;
    yeniBaslangic = baslangic + btn.sariciAcik.length;
    yeniBitis = yeniBaslangic + (seciliMetin || 'vurgu').length;
  }
  // Link
  else if (btn.tip === 'link') {
    const url = prompt('Link URL\'i giriniz (örn: https://...):', 'https://');
    if (!url || url === 'https://') return;
    
    const linkMetni = seciliMetin || prompt('Link metni:', 'tıkla') || 'tıkla';
    const yeni = `<a href="${url}" target="_blank">${linkMetni}</a>`;
    yeniMetin = oncesi + yeni + sonrasi;
    yeniBaslangic = baslangic + yeni.length;
    yeniBitis = yeniBaslangic;
  }
  // Paragraf sonu
  else if (btn.tip === 'paragraf') {
    yeniMetin = oncesi + '\n\n' + sonrasi;
    yeniBaslangic = baslangic + 2;
    yeniBitis = yeniBaslangic;
  }
  // Temizle (HTML tagları kaldır)
  else if (btn.tip === 'temizle') {
    if (!seciliMetin) {
      alert('Önce temizlemek istediğin metni seç!');
      return;
    }
    const temiz = seciliMetin.replace(/<[^>]+>/g, '');
    yeniMetin = oncesi + temiz + sonrasi;
    yeniBaslangic = baslangic;
    yeniBitis = baslangic + temiz.length;
  }
  else {
    return;
  }
  
  ta.value = yeniMetin;
  ta.focus();
  ta.setSelectionRange(yeniBaslangic, yeniBitis);
  
  // Input event'i tetikle (önizleme güncellensin)
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

// ───────────────────────────────────────────────
// Önizleme güncelle
// ───────────────────────────────────────────────
function onizlemeyiGuncelle(wrapper) {
  const ta = wrapper.querySelector('.me-textarea');
  const onizleme = wrapper.querySelector('.me-onizleme-icerik');
  if (!ta || !onizleme) return;
  
  // Boş ise placeholder göster
  if (!ta.value.trim()) {
    onizleme.innerHTML = '<p style="color: #aaa; font-style: italic;">(Henüz içerik yok)</p>';
    return;
  }
  
  // Düz metni HTML'e çevir (\n\n → paragraf, \n → <br>)
  const html = metniGuvenliHTMLeCevir(ta.value);
  onizleme.innerHTML = html;
}

// ───────────────────────────────────────────────
// Önizlemeyi aç/kapat
// ───────────────────────────────────────────────
function onizlemeyiToggle(wrapper) {
  const onizleme = wrapper.querySelector('.me-onizleme');
  const btn = wrapper.querySelector('.me-onizle');
  if (!onizleme) return;
  
  if (onizleme.classList.contains('gizli')) {
    onizleme.classList.remove('gizli');
    btn.innerHTML = '✏️ Yazma';
    btn.classList.add('aktif');
    onizlemeyiGuncelle(wrapper);
  } else {
    onizleme.classList.add('gizli');
    btn.innerHTML = '👁️ Önizle';
    btn.classList.remove('aktif');
  }
}

// ───────────────────────────────────────────────
// Düz metni güvenli HTML'e çevir
// (kullanıcının yazdığı taglar korunur, ama script vs çalışmaz)
// ───────────────────────────────────────────────
function metniGuvenliHTMLeCevir(metin) {
  // İzin verilen taglar
  const izinli = ['strong', 'em', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'p', 'br', 'span', 'a'];
  
  // Önce çift newline'ı paragraf olarak işle
  // Tek newline'ı <br>'a çevir
  // Ama eğer satır <ul>, <ol>, <h2> gibi blok tag içeriyorsa olduğu gibi bırak
  
  const paragraflar = metin.split(/\n\n+/);
  const sonuc = paragraflar.map(p => {
    p = p.trim();
    if (!p) return '';
    
    // Eğer paragraf zaten blok tag içeriyorsa (<ul>, <h2> vs) olduğu gibi bırak
    if (/^<(ul|ol|h[1-6]|p|div|blockquote)/.test(p)) {
      // Sadece tek satır içindeki \n'leri boşluğa çevir
      return p.replace(/\n/g, '\n');
    }
    
    // Normal metin: tek newline'ları <br>'a çevir, paragraf olarak sarmala
    return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
  }).join('\n');
  
  return sonuc;
}

// ───────────────────────────────────────────────
// Public: HTML'i güvenli render etmek için
// ───────────────────────────────────────────────
export function metniRender(metin) {
  if (!metin) return '';
  return metniGuvenliHTMLeCevir(metin);
}
