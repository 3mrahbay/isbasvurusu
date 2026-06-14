// ═══════════════════════════════════════════════════════════
// DESTEK KADROSU TEST SORULARI (Aşçı, Temizlik, Şoför, Güvenlik)
// 30 soru, ~10 dakika
// 6 bölüm — toplam soru sayısı bölümlerden dinamik hesaplanır
// ═══════════════════════════════════════════════════════════

// ───────────────────────────────────────────────
// BÖLÜM 1: KİŞİLİK + SOSYAL BEĞENİRLİK - 8 soru
// 1=Kesinlikle katılmıyorum, 5=Kesinlikle katılıyorum
// ───────────────────────────────────────────────
export const DESTEK_BOLUM1_KISILIK = [
  // SORUMLULUK (en kritik özellik)
  { id: 'k01', soru: 'Bir işe başlamadan önce nasıl yapacağımı planlamayı severim.', boyut: 'sorumluluk' },
  { id: 'k02', soru: 'Sözlerimi tutmaya, taahhütlerimi yerine getirmeye dikkat ederim.', boyut: 'sorumluluk' },
  { id: 'k03', soru: 'Detaylara dikkat eder, işleri özenle yaparım.', boyut: 'sorumluluk' },
  
  // 🔍 SOSYAL BEĞENİRLİK 1
  { id: 'k04', soru: 'Hayatımda hiç birine kötü düşünce taşımadım.', boyut: 'sosyalBegenirlik', sahteIdeal: true },
  
  // DUYGUSAL DENGE (stres yönetimi - kritik)
  { id: 'k05', soru: 'Stresli durumlarda sakin kalmayı başarabilirim.', boyut: 'duygusalDenge' },
  { id: 'k06', soru: 'Küçük şeyler beni kolayca üzer veya endişelendirir.', boyut: 'duygusalDenge', ters: true },
  
  // 🔍 SOSYAL BEĞENİRLİK 2
  { id: 'k07', soru: 'Bazen başkalarını kıskandığım olur.', boyut: 'sosyalBegenirlik', sahteGercek: true },
  
  // UYUMLULUK
  { id: 'k08', soru: 'Ekip halinde çalışmaktan keyif alırım.', boyut: 'uyumluluk' }
];

// ───────────────────────────────────────────────
// BÖLÜM 2: İŞ ANLAYIŞI (Forced Choice) - 5 soru
// İki seçenekten birini seçmek zorunda
// ───────────────────────────────────────────────
export const DESTEK_BOLUM2_DEGERLER = [
  {
    id: 'd01',
    soru: 'İşinizde size DAHA ÖNEMLİ olan hangisi?',
    secenekler: {
      A: { metin: 'İşin gerektiği gibi, kuralına uygun yapılması', boyut: 'kurallibakim' },
      B: { metin: 'Çocukların huzuru ve güvenliğinin önde tutulması', boyut: 'cocukOdakli' }
    }
  },
  {
    id: 'd02',
    soru: 'Bir çocuk size doğrudan bir şey istediğinde (size verilen göreve dahil olmasa bile)?',
    secenekler: {
      A: { metin: 'Yardım etmeye çalışırım, çocuk önce gelir', boyut: 'cocukOdakli' },
      B: { metin: 'Görevimi açıklar, ilgili öğretmene yönlendiririm', boyut: 'kurallibakim' }
    }
  },
  {
    id: 'd03',
    soru: 'İşinizde DAHA ÖNEMLİ olan hangisi?',
    secenekler: {
      A: { metin: 'Uzun süre aynı kurumda çalışıp tecrübe biriktirmek', boyut: 'uzunVadeli' },
      B: { metin: 'Farklı yerlerde farklı işlerde deneyim kazanmak', boyut: 'kisaVadeli' }
    },
    kariyer: true
  },
  {
    id: 'd04',
    soru: '5 yıl sonra kendinizi nerede görmek istersiniz?',
    secenekler: {
      A: { metin: 'Sevdiğim bir kurumda, ekibimle yerleşmiş, deneyimli olarak', boyut: 'kurumaBagliBaglilik' },
      B: { metin: 'Kendi işimi kurmuş, bağımsız çalışıyor olarak', boyut: 'bireyselGelisim' }
    },
    kariyer: true
  },
  {
    id: 'd05',
    soru: 'Bir hata yaptığınızda ilk tepkiniz hangisi olur?',
    secenekler: {
      A: { metin: 'Hemen kabul eder, düzeltmek için ne yapacağımı düşünürüm', boyut: 'sorumluluk' },
      B: { metin: 'Kimseye söylemeden kendim çözmeye çalışırım', boyut: 'gizleme' }
    }
  }
];

// ───────────────────────────────────────────────
// BÖLÜM 3: İŞ SENARYOLARI - 6 soru
// Çocuk koruma + iş kalitesi
// ───────────────────────────────────────────────
export const DESTEK_BOLUM3_SENARYOLAR = [
  {
    id: 's01',
    durum: 'İşinizi yaparken (mutfakta/serviste/kapıda/temizlikte) bir çocuğun ağladığını gördünüz. Yanında öğretmeni yok. Ne yaparsınız?',
    secenekler: {
      A: 'Konum bana ait değil, çocukla ilgilenmem',
      B: 'Hemen yanına gider, sakinleştirip öğretmeni çağırırım',
      C: 'Yüksek sesle "Sen ağlama" diyerek susturmaya çalışırım',
      D: 'Görmezden gelir, işime devam ederim'
    },
    nedenIste: true
  },
  {
    id: 's02',
    durum: 'Bir veli size çocuğu hakkında özel bir bilgi (sağlık, aile durumu) anlatıp sır olarak saklamanızı istedi. Bilgi çocuğun güvenliğini etkileyebilir. Ne yaparsınız?',
    secenekler: {
      A: 'Velinin isteğini onurlandırır, kimseye söylemem',
      B: 'Çocuğun güvenliği için müdüre bildirmem gerektiğini açıklarım',
      C: 'Sadece çocuğun öğretmenine söylerim',
      D: 'Bilmiyormuş gibi davranır, unuttuğumu söylerim'
    }
  },
  {
    id: 's03',
    durum: 'Çalıştığınız alanda (mutfak/giriş/araç/sınıf dışı) bir tehlikeli durum fark ettiniz (kaygan zemin, gevşek elektrik, sıcak yüzey). Çocuklar yakında. İlk eyleminiz?',
    secenekler: {
      A: 'Hemen alanı emniyete alır, çocukları uzaklaştırırım',
      B: 'Yetkiliyi arar, gelmesini beklerim',
      C: 'Sonra söylerim, şu an meşgulüm',
      D: 'Bana ait değil, ilgili kişi halletsin'
    },
    nedenIste: true
  },
  {
    id: 's04',
    durum: 'Bir veli size para teklif edip "Çocuğuma özel ilgi gösterin, beni öğretmenden ayrı tutmayın" dedi. Ne yaparsınız?',
    secenekler: {
      A: 'Kabul ederim, herkesin işine yarar',
      B: 'Reddeder, durumu müdüre bildiririm',
      C: 'Reddederim ama söylemem',
      D: 'Az kabul ederim, çocuk için isteyebilir'
    }
  },
  {
    id: 's05',
    durum: 'Bir öğretmenin bir çocuğa sert davrandığını duydunuz/gördünüz. Ne yaparsınız?',
    secenekler: {
      A: 'Beni ilgilendirmiyor, başkası halletsin',
      B: 'Müdüre veya okul yönetimine bildirim',
      C: 'Kendim öğretmenle konuşurum',
      D: 'Diğer öğretmenlere söyler, herkes bilsin'
    },
    nedenIste: true
  },
  {
    id: 's06',
    durum: 'Sabah erken işe geldiniz, kimse yok. Görevinizin gerektirdiği bir alana (mutfak/sınıf/depo) girdiğinizde değerli bir eşya gördünüz (cüzdan, telefon, takı). Ne yaparsınız?',
    secenekler: {
      A: 'Olduğu yerde bırakır, sahibi gelince haber veririm',
      B: 'Güvenli bir yere koyar, müdüre haber veririm',
      C: 'Cebime alır, sahibi sorduğunda veririm',
      D: 'Sahibinin kim olduğunu araştırırım'
    }
  },
  {
    id: 's07',
    durum: 'Çıkış saatinde tanımadığınız bir kişi geldi ve "Ben X çocuğunun amcasıyım, onu almaya geldim" dedi. Listede adı yok. Ne yaparsınız?',
    secenekler: {
      A: 'Çocuğu teslim ederim, akraba olduğunu söyledi',
      B: 'Kesinlikle teslim etmem, öğretmeni/yönetimi çağırır kimlik ve izin teyidi isterim',
      C: 'Çocuğa "tanıyor musun" diye sorar, tanıyorsa veririm',
      D: 'Velinin telefonuna ulaşmaya çalışırım, ulaşamazsam teslim ederim'
    },
    nedenIste: true
  },
  {
    id: 's08',
    durum: 'Mutfakta/serviste bir çocuğun belirli bir yiyeceğe alerjisi olduğunu biliyorsunuz, ama o gün hazırlanan/ikram edilecek üründe o malzeme olduğunu fark ettiniz. Ne yaparsınız?',
    secenekler: {
      A: 'O çocuğa vermemeye dikkat eder, gerisini düşünmem',
      B: 'Derhal durdurur, öğretmeni/yönetimi bilgilendirir, o çocuğa ulaşmasını engellerim',
      C: 'Az miktarda sorun olmaz diye düşünürüm',
      D: 'Çocuğun kendisinin dikkat etmesi gerektiğini düşünürüm'
    },
    nedenIste: true
  },
  {
    id: 's09',
    durum: 'Servis aracından çocukları indirirken, sabah bindiğinde saydığınız çocuk sayısından bir eksik olduğunu fark ettiniz. Ne yaparsınız?',
    secenekler: {
      A: 'Aracı tekrar baştan sona kontrol eder, eksik çocuğu bulana kadar kimseyi göndermem ve derhal yönetimi ararım',
      B: 'Belki yanlış saymışımdır, devam ederim',
      C: 'Diğer çocukları indirir, sonra bakarım',
      D: 'Velilere sorar, onlar bulsun'
    },
    nedenIste: true
  }
];

// ───────────────────────────────────────────────
// BÖLÜM 4: AÇIK UÇLU - 2 hikaye soru
// ───────────────────────────────────────────────
export const DESTEK_BOLUM4_HIKAYELER = [
  {
    id: 'h01',
    baslik: '🌸 Hayatınızdaki En Önemli Görev',
    soru: 'Hayatınızda üstlendiğiniz, sizi gururlandıran ve sorumluluk duygunuzla yaptığınız bir işi (iş yeri olabilir, aile içinde olabilir) anlatın. Neden o iş sizin için önemliydi? Sonuç ne oldu?',
    minKarakter: 200,
    placeholder: 'Hayatınızda gerçekleşmiş bir an düşünün ve içtenlikle anlatın...'
  },
  {
    id: 'h02',
    baslik: '👶 Çocuklarla Karşılaşmanız',
    soru: 'Bir çocukla (kendinizinkiler, akrabalar, mahalle çocukları, daha önceki iş yerinden) yaşadığınız anlamlı bir an oldu mu? Bu an size ne hissettirdi? Çocuklara nasıl bakıyorsunuz?',
    minKarakter: 200,
    placeholder: 'Çocuklarla ilgili gerçek bir anınızı paylaşın...'
  }
];

// ───────────────────────────────────────────────
// BÖLÜM 5: ÇOCUK KORUMA + ETİK - 5 soru
// Tüm pozisyonlar için kritik
// ───────────────────────────────────────────────
export const DESTEK_BOLUM5_ETIK = [
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
    soru: 'Bir veli sizi telefonla arayıp çocuğunun fotoğrafını WhatsApp\'tan göndermenizi istedi. Ne yaparsınız?',
    secenekler: {
      A: 'Kabul ederim, sadece veli için',
      B: 'Reddeder, okul protokolüne uygun olarak yönlendirirsim',
      C: 'Sadece bir tane gönderirim, sorun olmaz',
      D: 'Müdüre sorar, izin alırım'
    }
  },
  {
    id: 'e04',
    soru: 'Bir çocuğu evinin önüne kadar bırakmanız gerekiyor (veya alıp getirmeniz). Ana yetkili veliyi göremediniz. Ne yaparsınız?',
    secenekler: {
      A: 'Çocuğu kapıya bırakır, hemen ayrılırım',
      B: 'Yetkili biri çıkana kadar bekler, gerekirse okula geri götürürüm',
      C: 'Komşusuna emanet ederim',
      D: 'Çocuğa anahtarla evine girip beklemesini söylerim'
    }
  },
  {
    id: 'e05',
    soru: 'Bir personel arkadaşınız sürekli işe geç geliyor ve siz onun işini de yapıyorsunuz. Ne yaparsınız?',
    secenekler: {
      A: 'Onunla konuşur, durumu anlamaya çalışırım',
      B: 'Müdüre şikayet ederim',
      C: 'Yapmaya devam ederim, ses çıkarmam',
      D: 'Diğer arkadaşlara şikayet ederim'
    }
  }
];

// ───────────────────────────────────────────────
// BÖLÜM 6: HIZLI TEPKİLER - 4 soru (kısa cevaplar)
// ───────────────────────────────────────────────
export const DESTEK_BOLUM6_HIZLI = [
  {
    id: 'r01',
    soru: 'Sizce bu işte (görevinizde) en önemli özellik nedir?',
    placeholder: 'Bir cümle ile...'
  },
  {
    id: 'r02',
    soru: 'En zorlandığınız iş türü hangisidir, neden?',
    placeholder: 'Kısa açıklama...'
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
// DESTEK BÖLÜM TANIMLARI
// ───────────────────────────────────────────────
export const DESTEK_BOLUMLER = [
  {
    no: 1,
    id: 'kisilik',
    baslik: 'Sizi Tanıyalım',
    altBaslik: 'Kişilik ve Mizaç',
    aciklama: 'Aşağıdaki ifadeleri okuyun ve size ne kadar uyduğunu işaretleyin. Doğru veya yanlış cevap yok — samimi olun yeterli.',
    sureDk: 2,
    sorular: DESTEK_BOLUM1_KISILIK,
    tip: 'likert'
  },
  {
    no: 2,
    id: 'degerler',
    baslik: 'İş Anlayışınız ve Hedefleriniz',
    altBaslik: 'İki seçenek arasında seçim',
    aciklama: 'Aşağıdaki durumlarda ikisi de mantıklı olabilir, ama sizin için DAHA DOĞRU olan hangisi?',
    sureDk: 2,
    sorular: DESTEK_BOLUM2_DEGERLER,
    tip: 'forcedChoice'
  },
  {
    no: 3,
    id: 'senaryolar',
    baslik: 'İş Yerinde Karşılaşacaklarınız',
    altBaslik: 'Gerçek durumlar',
    aciklama: 'Aşağıdaki gerçek durumlarda nasıl davranırdınız?',
    sureDk: 3,
    sorular: DESTEK_BOLUM3_SENARYOLAR,
    tip: 'senaryo'
  },
  {
    no: 4,
    id: 'hikayeler',
    baslik: 'Sizin Hikayeniz',
    altBaslik: 'Birkaç cümle yeter',
    aciklama: 'Bu kısımda kendinizden bahsedin — uzun yazmanıza gerek yok, samimi olun.',
    sureDk: 3,
    sorular: DESTEK_BOLUM4_HIKAYELER,
    tip: 'hikaye'
  },
  {
    no: 5,
    id: 'etik',
    baslik: 'Çocuk Koruma ve Etik',
    altBaslik: 'Önemli durumlar',
    aciklama: 'Çocuklarla aynı kurumda çalışıyoruz. Bu sorular tüm personel için kritik.',
    sureDk: 2,
    sorular: DESTEK_BOLUM5_ETIK,
    tip: 'senaryo'
  },
  {
    no: 6,
    id: 'hizli',
    baslik: 'Son Birkaç Soru',
    altBaslik: 'Hızlı tepkiler',
    aciklama: 'Hızlı yanıtlar verin — düşünmeden, ilk aklınıza geleni yazın.',
    sureDk: 1,
    sorular: DESTEK_BOLUM6_HIZLI,
    tip: 'hizliTepki'
  }
];

// ───────────────────────────────────────────────
// MOTİVASYONEL GEÇİŞ MESAJLARI
// ───────────────────────────────────────────────
export const DESTEK_MOTIVASYONLAR = [
  { sonraki: 2, ikon: '🌱', baslik: 'Güzel başladık!', mesaj: 'Şimdi iş hayatınızdaki yaklaşımınızı tanıyalım.' },
  { sonraki: 3, ikon: '💪', baslik: 'Harika gidiyorsunuz!', mesaj: 'Şimdi gerçek iş senaryoları üzerinde düşünelim.' },
  { sonraki: 4, ikon: '✨', baslik: 'Yarısını geçtik!', mesaj: 'Şimdi sizinle ilgili birkaç hikaye paylaşın.' },
  { sonraki: 5, ikon: '🛡️', baslik: 'Çok iyi gidiyorsunuz!', mesaj: 'Çocuk koruma ve etik kuralları üzerinde duralım.' },
  { sonraki: 6, ikon: '🎯', baslik: 'Son düzlük!', mesaj: 'Birkaç hızlı soru kaldı, sonra bitti.' }
];
