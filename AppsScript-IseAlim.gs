// ═══════════════════════════════════════════════════════════
// BCK İŞ BAŞVURUSU - APPS SCRIPT PROXY
// Google Apps Script: script.google.com → Yeni Proje
// Bu kodu yapıştırın, Script Properties'e API anahtarını ekleyin
// ═══════════════════════════════════════════════════════════

// ANA WEBHOOK - Tüm istekler buraya gelir
function doPost(e) {
  try {
    const veri = JSON.parse(e.postData.contents);
    const islem = veri.islem;
    
    let sonuc;
    
    switch(islem) {
      case 'aiAnaliz':
        sonuc = aiAnalizYap(veri.adayBilgileri, veri.testCevaplari);
        break;
      case 'mailGonder':
        sonuc = mailGonder(veri.alici, veri.aliciAdi, veri.tip, veri.parametreler);
        break;
      case 'test':
        sonuc = { durum: 'OK', mesaj: 'Apps Script çalışıyor!' };
        break;
      default:
        sonuc = { hata: 'Bilinmeyen islem: ' + islem };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(sonuc))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (hata) {
    return ContentService
      .createTextOutput(JSON.stringify({ hata: hata.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// CORS desteği için OPTIONS
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ durum: 'BCK İş Başvurusu Proxy aktif' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ═══════════════════════════════════════════════════════════
// CLAUDE AI ANALİZ
// ═══════════════════════════════════════════════════════════
function aiAnalizYap(adayBilgileri, testCevaplari) {
  const apiAnahtari = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');
  
  if (!apiAnahtari) {
    return { hata: 'Claude API anahtarı tanımlı değil. Script Properties kontrol edin.' };
  }
  
  // Claude'a gönderilecek prompt
  const prompt = analizPromptOlustur(adayBilgileri, testCevaplari);
  
  const istek = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiAnahtari,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    }),
    muteHttpExceptions: true
  };
  
  try {
    const yanit = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', istek);
    const veri = JSON.parse(yanit.getContentText());
    
    if (veri.error) {
      return { hata: 'Claude API hatası: ' + veri.error.message };
    }
    
    const analizMetni = veri.content[0].text;
    
    // Claude'dan JSON formatında yanıt bekliyoruz, parse edelim
    const temizMetin = analizMetni.replace(/```json|```/g, '').trim();
    const analizSonucu = JSON.parse(temizMetin);
    
    return { 
      basarili: true, 
      analiz: analizSonucu,
      tokenKullanimi: veri.usage 
    };
    
  } catch (hata) {
    return { hata: 'Analiz hatası: ' + hata.toString() };
  }
}

// AI'a gönderilecek prompt'u oluştur
function analizPromptOlustur(adayBilgileri, testCevaplari) {
  return `Sen bir Montessori okul öncesi öğretmenliği için aday değerlendirme uzmanısın. 
Aşağıdaki adayın test cevaplarını bilimsel objektiflikle analiz et.

ADAY BİLGİLERİ:
${JSON.stringify(adayBilgileri, null, 2)}

TEST CEVAPLARI:
${JSON.stringify(testCevaplari, null, 2)}

Aşağıdaki JSON formatında yanıt ver (başka hiçbir metin ekleme, sadece JSON):

{
  "genelUyumSkoru": 0-100 arası sayı,
  "tavsiyeEtiketi": "guclu" | "degerlendirilmeli" | "uygunDegil",
  "bigFive": {
    "aciklik": 0-100,
    "sorumluluk": 0-100,
    "disadonukluk": 0-100,
    "uyumluluk": 0-100,
    "duygusalDenge": 0-100
  },
  "yetkinlikler": {
    "empati": 0-100,
    "sabir": 0-100,
    "pedagojikYaklasim": 0-100,
    "cocukKorumaFarkindaligi": 0-100,
    "ekipCalismasi": 0-100,
    "iletisim": 0-100,
    "stresYonetimi": 0-100,
    "montessoriUyumu": 0-100
  },
  "guclu Yonler": ["...", "...", "..."],
  "gelisimAlanlari": ["...", "...", "..."],
  "kirmiziBayraklar": ["..."] veya [],
  "aiYorumu": "3-4 paragraflık derinlemesine değerlendirme. Adayın yazılı cevaplarındaki dil, empati derinliği, çocuk merkezli yaklaşım, çözüm odaklılığı analiz et.",
  "mulakatOnerileri": [
    "Mülakatta sorulması önerilen 1. soru",
    "Mülakatta sorulması önerilen 2. soru",
    "Mülakatta sorulması önerilen 3. soru"
  ],
  "diger PozisyonUyumu": {
    "egitimKoordinatoru": 0-100,
    "brans": 0-100
  }
}

ÖNEMLİ KRİTERLER:
- Çocuk koruma sorularında problemli cevap varsa kırmızı bayrak ekle ve genelSkoru düşür
- Empati, sabır ve çocuk merkezli düşünce en önemli faktörler
- Montessori felsefesine uyum: bağımsızlık, hazırlanmış çevre, gözlem
- Yazılı cevaplarda yüzeysel/genel cevaplar düşük puan, somut deneyim/duygu ifadesi yüksek puan
- 90+ = çok güçlü aday, 70-89 = mülakatta değerlendirilmeli, 50-69 = sınırda, 50- = uygun değil`;
}

// ═══════════════════════════════════════════════════════════
// MAIL GÖNDERİMİ (Brevo)
// ═══════════════════════════════════════════════════════════
function mailGonder(alici, aliciAdi, tip, parametreler) {
  const brevoAnahtari = PropertiesService.getScriptProperties().getProperty('BREVO_API_KEY');
  
  if (!brevoAnahtari) {
    return { hata: 'Brevo API anahtarı tanımlı değil.' };
  }
  
  // toName fallback
  if (!aliciAdi || aliciAdi.trim() === '') {
    aliciAdi = alici.split('@')[0];
  }
  
  let konu, icerik;
  
  switch(tip) {
    case 'hosgeldin':
      konu = '🌸 Bir Çiçek Koleji İş Başvurunuz Alındı';
      icerik = hosgeldinMaili(aliciAdi);
      break;
    case 'tebrik':
      konu = '🎉 Tebrikler! Bir Çiçek Koleji Ailesine Hoş Geldiniz';
      icerik = tebrikMaili(aliciAdi);
      break;
    case 'havuz':
      konu = '📋 Bir Çiçek Koleji - Aday Havuzumuzdasınız';
      icerik = havuzMaili(aliciAdi);
      break;
    case 'testTamam':
      konu = '✅ Değerlendirmeniz Tamamlandı';
      icerik = testTamamMaili(aliciAdi);
      break;
    default:
      return { hata: 'Bilinmeyen mail tipi: ' + tip };
  }
  
  const istek = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'api-key': brevoAnahtari },
    payload: JSON.stringify({
      sender: { 
        name: 'Bir Çiçek Koleji', 
        email: 'eposta@bircicekkoleji.com' 
      },
      to: [{ email: alici, name: aliciAdi }],
      subject: konu,
      htmlContent: icerik
    }),
    muteHttpExceptions: true
  };
  
  try {
    const yanit = UrlFetchApp.fetch('https://api.brevo.com/v3/smtp/email', istek);
    const kod = yanit.getResponseCode();
    
    if (kod === 201) {
      return { basarili: true, mesaj: 'Mail gönderildi' };
    } else {
      return { hata: 'Mail gönderilemedi: ' + yanit.getContentText() };
    }
  } catch (hata) {
    return { hata: 'Mail hatası: ' + hata.toString() };
  }
}

// ═══════════════════════════════════════════════════════════
// MAIL ŞABLONLARI
// ═══════════════════════════════════════════════════════════
function mailSablonuTemel(icerik, baslikRengi, baslikBg) {
  // Tüm mailler için ortak çerçeve - logolu, profesyonel
  const renk = baslikRengi || '#2c5530';
  const bg = baslikBg || '#e8f5e9';
  const logoUrl = 'https://3mrahbay.github.io/isbasvurusu/logo_kalkan_orta.png';
  
  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
            max-width: 620px; margin: 0 auto; background: #faf3e8;">
  
  <!-- ÜST LOGO BÖLGESİ -->
  <div style="background: ${bg}; padding: 40px 20px 30px; text-align: center; 
              border-radius: 16px 16px 0 0;">
    <img src="${logoUrl}" alt="Bir Çiçek Koleji" 
         style="width: 110px; height: 122px; object-fit: contain; 
                filter: drop-shadow(0 6px 12px rgba(0,0,0,0.1));">
    <div style="color: ${renk}; font-size: 13px; font-weight: 600; margin-top: 12px; 
                letter-spacing: 1.5px; text-transform: uppercase;">
      Bir Çiçek Koleji Anaokulu
    </div>
  </div>
  
  <!-- ANA İÇERİK -->
  <div style="background: white; padding: 40px 32px; line-height: 1.7; color: #2d2d2d;">
    ${icerik}
  </div>
  
  <!-- FOOTER -->
  <div style="background: #1e3d22; color: rgba(255,255,255,0.8); padding: 24px 20px; 
              text-align: center; font-size: 12px; line-height: 1.8;
              border-radius: 0 0 16px 16px;">
    <div style="color: white; font-weight: 600; font-size: 14px; margin-bottom: 8px;">
      🌸 Bir Çiçek Koleji Anaokulu
    </div>
    <div>Aydınlı, Tuzla / İstanbul</div>
    <div>📞 0216 393 54 57 • 💬 0555 103 54 57</div>
    <div>
      <a href="mailto:eposta@bircicekkoleji.com" style="color: rgba(255,255,255,0.9); text-decoration: none;">
        eposta@bircicekkoleji.com
      </a>
    </div>
    <div style="margin-top: 12px;">
      <a href="https://bircicekkoleji.com" style="color: rgba(255,255,255,0.7); text-decoration: none;">
        bircicekkoleji.com
      </a>
      &nbsp;•&nbsp;
      <a href="https://www.instagram.com/bircicekkoleji" style="color: rgba(255,255,255,0.7); text-decoration: none;">
        @bircicekkoleji
      </a>
    </div>
    <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); 
                font-size: 11px; opacity: 0.6;">
      © 2026 Bir Çiçek Koleji Anaokulu • Tüm hakları saklıdır
    </div>
  </div>
</div>`;
}

function hosgeldinMaili(ad) {
  const icerik = `
    <h2 style="color: #2c5530; font-size: 24px; margin: 0 0 16px;">
      Hoş Geldiniz, ${ad}! 🌸
    </h2>
    
    <p style="font-size: 16px;">
      Bir Çiçek Koleji ailesine ilgi gösterdiğiniz için <strong>içtenlikle teşekkür ederiz</strong>. 
      Başvurunuz başarıyla sistemimize alınmıştır.
    </p>
    
    <div style="background: #faf3e8; padding: 16px 20px; border-left: 4px solid #2c5530; 
                border-radius: 8px; margin: 24px 0;">
      <strong style="color: #2c5530;">📋 Sıradaki Adım:</strong><br>
      Sizden, sizi daha yakından tanımamızı sağlayacak <strong>20-25 dakikalık değerlendirme sürecini</strong> 
      tamamlamanızı rica ediyoruz.
    </div>
    
    <h3 style="color: #2c5530; margin-top: 28px;">💡 Süreç Hakkında</h3>
    <ul style="padding-left: 20px;">
      <li style="margin-bottom: 8px;">Soruları sakin bir ortamda, samimi cevaplarla yanıtlayın</li>
      <li style="margin-bottom: 8px;">"Doğru cevap" aramayın, gerçek düşüncelerinizi paylaşın</li>
      <li style="margin-bottom: 8px;">Yarıda bırakırsanız kaldığınız yerden devam edebilirsiniz</li>
      <li style="margin-bottom: 8px;">Cevaplarınız sadece okul yönetimi tarafından görülecektir</li>
    </ul>
    
    <p>
      Değerlendirme süreciniz tamamlandığında, başvurunuz titizlikle incelenecek ve 
      <strong>5-7 iş günü içinde</strong> size dönüş yapılacaktır.
    </p>
    
    <div style="text-align: center; margin: 36px 0 16px;">
      <a href="https://isbasvurusu.bircicekkoleji.com/basvuru.html" 
         style="background: #2c5530; color: white; padding: 16px 36px; 
                text-decoration: none; border-radius: 12px; display: inline-block; 
                font-weight: 600; font-size: 16px;">
        ✨ Değerlendirmeye Devam Et
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-top: 36px; padding-top: 20px; 
              border-top: 1px solid #eee;">
      Sevgiyle,<br>
      <strong style="color: #2c5530;">Bir Çiçek Koleji Ailesi</strong>
    </p>
  `;
  
  return mailSablonuTemel(icerik, '#2c5530', '#e8f5e9');
}

function tebrikMaili(ad) {
  const icerik = `
    <div style="text-align: center; margin-bottom: 28px;">
      <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
      <h2 style="color: #2c5530; font-size: 28px; margin: 0; font-weight: 800;">
        TEBRİKLER!
      </h2>
    </div>
    
    <h3 style="color: #2c5530; font-size: 20px;">Sevgili ${ad},</h3>
    
    <p style="font-size: 17px; line-height: 1.8;">
      Sizinle çok güzel bir haberi paylaşmaktan büyük mutluluk duyuyoruz. 🌸
    </p>
    
    <div style="background: #d4f5d4; padding: 24px; border-radius: 12px; 
                border-left: 4px solid #2c5530; margin: 24px 0;">
      <p style="margin: 0; font-size: 16px; line-height: 1.7;">
        Yapılan değerlendirmeler sonucunda 
        <strong style="color: #2c5530;">Bir Çiçek Koleji ailesinin yeni üyesi</strong> 
        olarak sizi seçtiğimizi bildirmek isteriz!
      </p>
    </div>
    
    <p style="font-size: 16px;">
      Çocuklarımızın hayatına dokunacak bu güzel yolculukta sizinle birlikte olmaktan 
      <strong>onur duyuyoruz</strong>. Bir sonraki adım olarak yüz yüze görüşmeye davet edilmek üzere 
      yakında sizinle iletişime geçeceğiz.
    </p>
    
    <div style="background: #faf3e8; padding: 20px; border-radius: 12px; margin: 24px 0;">
      <strong style="color: #2c5530;">📞 Sıradaki Adım:</strong><br>
      <span style="font-size: 14px; color: #666;">
        Çok yakında WhatsApp veya telefon yoluyla aranacaksınız. Lütfen 
        bildirimlerinizi açık tutun.
      </span>
    </div>
    
    <p style="font-style: italic; text-align: center; color: #4a7c59; 
              font-size: 16px; margin: 32px 0;">
      "Her bahar Bir Çiçekle başlar..." 🌸
    </p>
    
    <p style="color: #666; font-size: 14px; margin-top: 36px; padding-top: 20px; 
              border-top: 1px solid #eee;">
      Sevgiyle ve heyecanla,<br>
      <strong style="color: #2c5530;">Emrah Bay</strong><br>
      Kurucu Müdür<br>
      Bir Çiçek Koleji Anaokulu
    </p>
  `;
  
  return mailSablonuTemel(icerik, '#2c5530', '#d4f5d4');
}

function havuzMaili(ad) {
  const icerik = `
    <h2 style="color: #2c5530; font-size: 24px; margin: 0 0 16px;">
      Sevgili ${ad}, 🌾
    </h2>
    
    <p style="font-size: 16px;">
      Bir Çiçek Koleji'ne gösterdiğiniz <strong>ilgi</strong> ve değerlendirme sürecimize katıldığınız için 
      içtenlikle teşekkür ederiz.
    </p>
    
    <div style="background: #faf3e8; padding: 20px; border-radius: 12px; 
                border-left: 4px solid #6b4f3a; margin: 24px 0;">
      <p style="margin: 0; line-height: 1.7;">
        Bu dönem için aday seçimimizi tamamlamış olsak da, sizin profilinizi 
        <strong style="color: #2c5530;">aday havuzumuzda</strong> saklı tutuyoruz. 
        İlerleyen dönemlerde uygun bir pozisyon açıldığında, ilk sizinle iletişime geçeceğiz.
      </p>
    </div>
    
    <p>
      Eğitim alanında kendinizi geliştirmeye devam etmenizi ve yolunuzun açık olmasını dileriz. 
      Her başvuruyu değerli buluyor, sizi unutmuyoruz. 🌸
    </p>
    
    <div style="background: #e8f5e9; padding: 16px 20px; border-radius: 8px; margin: 24px 0;">
      <strong style="color: #2c5530;">📬 Mail Bildirimleri:</strong><br>
      <span style="font-size: 14px; color: #666;">
        İlgilendiğiniz pozisyon türlerinden biri açıldığında size mail göndereceğiz. 
        Bu maillerden çıkmak isterseniz alttaki linki kullanabilirsiniz.
      </span>
    </div>
    
    <p style="font-style: italic; text-align: center; color: #4a7c59; 
              font-size: 15px; margin: 32px 0;">
      "Her tohum kendi mevsimini bilir..." 🌱
    </p>
    
    <p style="color: #666; font-size: 14px; margin-top: 36px; padding-top: 20px; 
              border-top: 1px solid #eee;">
      Sevgiyle,<br>
      <strong style="color: #2c5530;">Bir Çiçek Koleji Ailesi</strong>
    </p>
  `;
  
  return mailSablonuTemel(icerik, '#6b4f3a', '#f5e6d3');
}

function testTamamMaili(ad) {
  const icerik = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 56px; margin-bottom: 8px;">✅</div>
      <h2 style="color: #2c5530; font-size: 24px; margin: 0;">
        Değerlendirmeniz Tamamlandı
      </h2>
    </div>
    
    <h3 style="color: #2c5530;">Sevgili ${ad},</h3>
    
    <p style="font-size: 16px;">
      Bir Çiçek Koleji <strong>değerlendirme sürecini tamamladığınız için</strong> teşekkür ederiz. 🌸
    </p>
    
    <div style="background: #e8f5e9; padding: 20px; border-radius: 12px; 
                border-left: 4px solid #2c5530; margin: 24px 0;">
      <strong style="color: #2c5530;">⏳ Bundan Sonrası:</strong><br>
      Cevaplarınız <strong>özenle incelenecek</strong> ve değerlendirme sonucumuz size 
      en kısa sürede iletilecektir. Genellikle <strong>5-7 iş günü</strong> içinde 
      dönüş yapıyoruz.
    </div>
    
    <p>
      Sabrınız ve ilginiz için minnettarız. Bu süreçte aklınıza takılan herhangi bir şey olursa, 
      bizimle iletişime geçmekten çekinmeyin.
    </p>
    
    <p style="color: #666; font-size: 14px; margin-top: 36px; padding-top: 20px; 
              border-top: 1px solid #eee;">
      Sevgiyle,<br>
      <strong style="color: #2c5530;">Bir Çiçek Koleji Ailesi</strong>
    </p>
  `;
  
  return mailSablonuTemel(icerik, '#2c5530', '#e8f5e9');
}
