// ═══════════════════════════════════════════════════════════
// İDARİ KADROSU TEST SORULARI (Halkla İlişkiler, Muhasebe, Diğer)
// 30 soru, ~10 dakika
// ═══════════════════════════════════════════════════════════

// ───────────────────────────────────────────────
// BÖLÜM 1: KİŞİLİK + SOSYAL BEĞENİRLİK - 8 soru
// ───────────────────────────────────────────────
export const IDARI_BOLUM1_KISILIK = [
  // SORUMLULUK
  { id: 'k01', soru: 'Detaylara dikkat eder, işleri özenle yaparım.', boyut: 'sorumluluk' },
  { id: 'k02', soru: 'Düzenli ve organize olmak benim için önemlidir.', boyut: 'sorumluluk' },
  { id: 'k03', soru: 'Bazen son dakikaya bırakırım ve yetiştirmekte zorlanırım.', boyut: 'sorumluluk', ters: true },
  
  // 🔍 SOSYAL BEĞENİRLİK 1
  { id: 'k04', soru: 'Hiçbir zaman söylediğim her şeyi hemen yapmadığım olmamıştır.', boyut: 'sosyalBegenirlik', sahteIdeal: true },
  
  // İLETİŞİM (DIŞA DÖNÜKLÜK)
  { id: 'k05', soru: 'İnsanlarla iletişim kurmaktan enerji alırım.', boyut: 'disaDonukluk' },
  { id: 'k06', soru: 'Yeni insanlarla tanışmak hoşuma gider.', boyut: 'disaDonukluk' },
  
  // 🔍 SOSYAL BEĞENİRLİK 2
  { id: 'k07', soru: 'Bazen söylediklerimi sonradan pişman olduğum olur.', boyut: 'sosyalBegenirlik', sahteGercek: true },
  
  // DUYGUSAL DENGE (kriz yönetimi)
  { id: 'k08', soru: 'Stresli durumlarda sakin kalmayı başarabilirim.', boyut: 'duygusalDenge' }
];

// ───────────────────────────────────────────────
// BÖLÜM 2: İŞ ANLAYIŞI (Forced Choice) - 5 soru
// ───────────────────────────────────────────────
export const IDARI_BOLUM2_DEGERLER = [
  {
    id: 'd01',
    soru: 'Bir veli/müşteri sizinle agresif bir tonla konuşuyor. Sizin için DAHA ÖNEMLİ olan hangisi?',
    secenekler: {
      A: { metin: 'Sakin kalıp problemi çözmeye odaklanmak', boyut: 'profesyonel' },
      B: { metin: 'Kendi haklarımı savunup karşı durmak', boyut: 'reaktif' }
    }
  },
  {
    id: 'd02',
    soru: 'İş yerinde DAHA ÖNEMLİ olan hangisi?',
    secenekler: {
      A: { metin: 'Hata yapmamak için her şeyi defalarca kontrol etmek', boyut: 'titiz' },
      B: { metin: 'Hızlı çalışıp çok iş bitirmek', boyut: 'hizli' }
    }
  },
  {
    id: 'd03',
    soru: 'İdeal bir iş ortamında size DAHA ÖNEMLİ olan?',
    secenekler: {
      A: { metin: 'Uzun yıllar aynı kurumda çalışıp birikim oluşturmak', boyut: 'uzunVadeli' },
      B: { metin: 'Farklı kurumlarda farklı deneyimler edinmek', boyut: 'kisaVadeli' }
    },
    kariyer: true
  },
  {
    id: 'd04',
    soru: '5 yıl sonra kendinizi nerede görmek istersiniz?',
    secenekler: {
      A: { metin: 'Sevdiğim bir kurumda kıdemli bir pozisyonda', boyut: 'kurumaBagliBaglilik' },
      B: { metin: 'Kendi danışmanlık veya işimi kurmuş', boyut: 'bireyselGelisim' }
    },
    kariyer: true
  },
  {
    id: 'd05',
    soru: 'Yöneticinizin verdiği bir karara katılmıyorsunuz. Ne yaparsınız?',
    secenekler: {
      A: { metin: 'Düşüncelerimi saygılı şekilde paylaşır, kararı kabul ederim', boyut: 'profesyonel' },
      B: { metin: 'Sessizce kabul eder, içime atarım', boyut: 'pasif' }
    }
  }
];

// ───────────────────────────────────────────────
// BÖLÜM 3: İŞ SENARYOLARI - 6 soru
// İdari/iletişim/dürüstlük odaklı
// ───────────────────────────────────────────────
export const IDARI_BOLUM3_SENARYOLAR = [
  {
    id: 's01',
    durum: 'Bir veli telefonla çok kızgın şekilde aradı, "Çocuğumun öğretmeni yetersiz, kaydımı iptal edin!" diyor. Size konuşma fırsatı bile vermiyor. Ne yaparsınız?',
    secenekler: {
      A: 'Sakin bir tonla onu dinler, duygusunu kabul ederim',
      B: 'Hemen müdüre veririm, sorumluluk benim değil',
      C: 'Aynı tonla cevap verir, hatamızı kabul etmediğimizi söylerim',
      D: 'Telefonu kapatır, e-posta atmasını söylerim'
    },
    nedenIste: true
  },
  {
    id: 's02',
    durum: 'Muhasebe/idari işiniz sırasında bir hata yaptığınızı fark ettiniz. Hata henüz fark edilmemiş ama gelecekte sorun olacak. Ne yaparsınız?',
    secenekler: {
      A: 'Hatayı kendim düzeltir, kimseye söylemem',
      B: 'Yöneticime hemen bildirim, çözüm için birlikte planlama yaparız',
      C: 'Diğer işlere odaklanır, fark eden olursa söylerim',
      D: 'Belge üzerinde değişiklik yaparak izini kapatırım'
    },
    nedenIste: true
  },
  {
    id: 's03',
    durum: 'Bir veli size küçük bir hediye veya nakit para teklif edip "Çocuğumla özel ilgilenin" dedi. Ne yaparsınız?',
    secenekler: {
      A: 'Kabul ederim, küçük bir jest sonuçta',
      B: 'Reddeder, durumu müdüre bildirim',
      C: 'Reddederim ama söylemem',
      D: 'Hediyeyi kabul eder, parayı reddederim'
    }
  },
  {
    id: 's04',
    durum: 'İş yerinde mesai saatleri dışında bir veli sizi telefonla arıyor. Ne yaparsınız?',
    secenekler: {
      A: 'Hemen cevaplar, her zaman ulaşılabilir olurum',
      B: 'Mesai saatlerinde dönüş yapacağımı söyler, ses bırakmasını öneririm',
      C: 'Hiç açmaz, ertesi sabah ararım',
      D: 'Kişisel telefonumu paylaştığım için gizliliğimi koruyacak şekilde davranırım'
    }
  },
  {
    id: 's05',
    durum: 'Bir personel arkadaşınız size "Müdür hakkında dedikodu duydum, sen de dinle" diyor. Ne yaparsınız?',
    secenekler: {
      A: 'Dinler, ben de fikrimi söylerim',
      B: 'Dinlemek istemediğimi nazikçe söyler, konuyu kapatırım',
      C: 'Dinler ama sonra başkalarına anlatmam',
      D: 'Müdüre direkt rapor ederim'
    },
    nedenIste: true
  },
  {
    id: 's06',
    durum: 'İdari/muhasebe sisteminde fark ettiğiniz bir tutarsızlık var. Mali olarak okul aleyhine. Açıklamak isterseniz suçlanmak da olası. Ne yaparsınız?',
    secenekler: {
      A: 'Görmemiş gibi davranır, beni ilgilendirmez',
      B: 'Müdüre belgelerle birlikte resmi şekilde rapor ederim',
      C: 'Sadece sözlü söylerim, suçlama olmasın',
      D: 'Kendi notlarımı tutar, gerekince çıkartırım'
    }
  }
];

// ───────────────────────────────────────────────
// BÖLÜM 4: AÇIK UÇLU - 2 hikaye
// ───────────────────────────────────────────────
export const IDARI_BOLUM4_HIKAYELER = [
  {
    id: 'h01',
    baslik: '🌸 Zor Bir İletişim Anınız',
    soru: 'Hayatınızda zor bir kişiyle (müşteri, akraba, iş arkadaşı, veli...) iletişim kurmanız gereken bir an oldu mu? Nasıl yaklaştınız? Sonuç ne oldu? Sizden ne öğrendi?',
    minKarakter: 250,
    placeholder: 'Gerçek bir anınızı içtenlikle paylaşın...'
  },
  {
    id: 'h02',
    baslik: '💼 İş Yerinizdeki Bir Hata',
    soru: 'İş yaşamınızda yaptığınız bir hata oldu mu? Nasıl ele aldınız? Bu durum size ne öğretti? (Hatayı kabul etmek bir güçtür, samimi olun)',
    minKarakter: 250,
    placeholder: 'Hata yapan biri değil, ondan ders çıkaran biri arıyoruz...'
  }
];

// ───────────────────────────────────────────────
// BÖLÜM 5: ÇOCUK KORUMA + ETİK - 5 soru
// İdari kadro da çocuklarla aynı binada
// ───────────────────────────────────────────────
export const IDARI_BOLUM5_ETIK = [
  {
    id: 'e01',
    soru: 'Bir çocuğun vücudunda morluk veya yara izi gördünüz. Çocuk size "Eve dönmek istemiyorum" dedi. Ne yaparsınız?',
    secenekler: {
      A: 'Konum bana ait değil, görmezden gelirim',
      B: 'Hemen müdüre bildirim, durumu raporlamasını sağlarım',
      C: 'Çocuğa "Endişelenme" der, devam ederim',
      D: 'Anneye soracağımı söylerim'
    }
  },
  {
    id: 'e02',
    soru: 'Bir çocuk size "Bunu kimseye söyleme, sır" dedi ve sonra rahatsız edici bir şey anlattı. Ne yaparsınız?',
    secenekler: {
      A: 'Sözümü tutar, sır olarak saklarım',
      B: '"Senin güvenliğin için söylemem gereken kişiler var" der, müdüre bildirim',
      C: 'Diğer çocuklarla konuşur, doğrulamaya çalışırım',
      D: 'Çocukla bir daha konuşmamayı tercih ederim'
    }
  },
  {
    id: 'e03',
    soru: 'Bir veli size çocuğunun fotoğrafını WhatsApp\'tan göndermenizi istedi. Okul protokolüne aykırı. Ne yaparsınız?',
    secenekler: {
      A: 'Kabul ederim, sadece veli için',
      B: 'Reddeder, okul protokolüne uygun olarak yönlendirirsim',
      C: 'Sadece bir tane gönderirim, sorun olmaz',
      D: 'Müdüre sorar, izin alırım'
    }
  },
  {
    id: 'e04',
    soru: 'Bir veli sosyal medyada okul aleyhine paylaşım yapmış. İçerikte yanlış bilgiler var. Müdür gizleniyor olabilir. Ne yaparsınız?',
    secenekler: {
      A: 'Veliyi blok atar, tartışmayı kapatırım',
      B: 'Müdüre bildirir, profesyonelce yanıt vermesi için bekleriz',
      C: 'Hemen yanıt yazarım, savunma yaparım',
      D: 'Görmezden gelirim, herkes paylaşıyor'
    }
  },
  {
    id: 'e05',
    soru: 'Bir personel arkadaşınızın iş yerinden değerli bir eşya çaldığına şüpheleniyorsunuz. Ne yaparsınız?',
    secenekler: {
      A: 'Doğrudan suçlar, hesap sorarım',
      B: 'Müdüre veya İK\'ya gizli olarak bildirim, soruşturulmasını sağlarım',
      C: 'Görmezden gelirim, sorun yaratmak istemem',
      D: 'Diğer personellere söyler, herkes bilsin'
    }
  }
];

// ───────────────────────────────────────────────
// BÖLÜM 6: HIZLI TEPKİLER - 4 soru
// ───────────────────────────────────────────────
export const IDARI_BOLUM6_HIZLI = [
  {
    id: 'r01',
    soru: 'Sizce bu pozisyonda en kritik özellik nedir?',
    placeholder: 'Bir cümle ile...'
  },
  {
    id: 'r02',
    soru: 'En zorlandığınız insan tipi hangisidir?',
    placeholder: 'Kısa cevap...'
  },
  {
    id: 'r03',
    soru: 'Çocuk demek sizin için...',
    placeholder: 'İlk aklınıza gelen...'
  },
  {
    id: 'r04',
    soru: 'Stresli bir günde kendinizi nasıl rahatlatırsınız?',
    placeholder: 'Kısa cevap...'
  }
];

// ───────────────────────────────────────────────
// İDARİ BÖLÜM TANIMLARI
// ───────────────────────────────────────────────
export const IDARI_BOLUMLER = [
  {
    no: 1,
    id: 'kisilik',
    baslik: 'Sizi Tanıyalım',
    altBaslik: 'Kişilik ve Mizaç',
    aciklama: 'Aşağıdaki ifadeleri okuyun ve size ne kadar uyduğunu işaretleyin. Doğru veya yanlış cevap yok — samimi olun yeterli.',
    sureDk: 2,
    sorular: IDARI_BOLUM1_KISILIK,
    tip: 'likert'
  },
  {
    no: 2,
    id: 'degerler',
    baslik: 'İş Anlayışınız ve Hedefleriniz',
    altBaslik: 'İki seçenek arasında seçim',
    aciklama: 'Aşağıdaki durumlarda ikisi de mantıklı olabilir, ama sizin için DAHA DOĞRU olan hangisi?',
    sureDk: 2,
    sorular: IDARI_BOLUM2_DEGERLER,
    tip: 'forcedChoice'
  },
  {
    no: 3,
    id: 'senaryolar',
    baslik: 'İş Yerinde Karşılaşacaklarınız',
    altBaslik: 'Profesyonel durumlar',
    aciklama: 'Aşağıdaki gerçek durumlarda nasıl davranırdınız?',
    sureDk: 3,
    sorular: IDARI_BOLUM3_SENARYOLAR,
    tip: 'senaryo'
  },
  {
    no: 4,
    id: 'hikayeler',
    baslik: 'Sizin Hikayeniz',
    altBaslik: 'Birkaç cümle yeter',
    aciklama: 'Bu kısımda kendinizden bahsedin — uzun yazmanıza gerek yok, samimi olun.',
    sureDk: 3,
    sorular: IDARI_BOLUM4_HIKAYELER,
    tip: 'hikaye'
  },
  {
    no: 5,
    id: 'etik',
    baslik: 'Çocuk Koruma ve Etik',
    altBaslik: 'Önemli durumlar',
    aciklama: 'Çocuklarla aynı kurumda çalışıyoruz. Bu sorular tüm personel için kritik.',
    sureDk: 2,
    sorular: IDARI_BOLUM5_ETIK,
    tip: 'senaryo'
  },
  {
    no: 6,
    id: 'hizli',
    baslik: 'Son Birkaç Soru',
    altBaslik: 'Hızlı tepkiler',
    aciklama: 'Hızlı yanıtlar verin — düşünmeden, ilk aklınıza geleni yazın.',
    sureDk: 1,
    sorular: IDARI_BOLUM6_HIZLI,
    tip: 'hizliTepki'
  }
];

export const IDARI_MOTIVASYONLAR = [
  { sonraki: 2, ikon: '🌱', baslik: 'Güzel başladık!', mesaj: 'Şimdi iş hayatınızdaki yaklaşımınızı tanıyalım.' },
  { sonraki: 3, ikon: '💼', baslik: 'Harika gidiyorsunuz!', mesaj: 'Şimdi profesyonel senaryolar üzerinde düşünelim.' },
  { sonraki: 4, ikon: '✨', baslik: 'Yarısını geçtik!', mesaj: 'Şimdi sizinle ilgili birkaç hikaye paylaşın.' },
  { sonraki: 5, ikon: '🛡️', baslik: 'Çok iyi gidiyorsunuz!', mesaj: 'Çocuk koruma ve etik kuralları üzerinde duralım.' },
  { sonraki: 6, ikon: '🎯', baslik: 'Son düzlük!', mesaj: 'Birkaç hızlı soru kaldı, sonra bitti.' }
];
