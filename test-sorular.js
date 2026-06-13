// ═══════════════════════════════════════════════════════════
// TEST SORULARI - MERKEZİ VERİTABANI
// 6 bölüm, ~60 soru
// ═══════════════════════════════════════════════════════════

// ───────────────────────────────────────────────
// BÖLÜM 1: KİŞİLİK (Big Five) - 25 soru
// 1=Kesinlikle katılmıyorum, 5=Kesinlikle katılıyorum
// boyut: acıklık, sorumluluk, disaDonukluk, uyumluluk, duygusalDenge
// ters: ters puanlama (1↔5, 2↔4)
// ───────────────────────────────────────────────
export const BOLUM1_KISILIK = [
  // AÇIKLIK (yeniliğe ve deneyime açıklık)
  { id: 'k01', soru: 'Yeni fikirleri ve farklı bakış açılarını dinlemekten keyif alırım.', boyut: 'acıklık' },
  { id: 'k02', soru: 'Yaratıcı çözümler bulmaya çalışırım, alıştığım yöntemlere takılı kalmam.', boyut: 'acıklık' },
  { id: 'k03', soru: 'Soyut konular ve felsefi sorular ilgimi çeker.', boyut: 'acıklık' },
  { id: 'k04', soru: 'Yeni şeyler öğrenmek beni heyecanlandırır.', boyut: 'acıklık' },
  { id: 'k05', soru: 'Genellikle alışkanlıklarımı değiştirmek istemem.', boyut: 'acıklık', ters: true },
  
  // SORUMLULUK (disiplin, plan)
  { id: 'k06', soru: 'Bir işe başlamadan önce planlama yapmayı severim.', boyut: 'sorumluluk' },
  { id: 'k07', soru: 'Sözlerimi tutmaya, taahhütlerimi yerine getirmeye dikkat ederim.', boyut: 'sorumluluk' },
  { id: 'k08', soru: 'Detaylara dikkat eder, işleri özenle yaparım.', boyut: 'sorumluluk' },
  { id: 'k09', soru: 'Bazen son dakikaya bırakırım ve yetiştirmekte zorlanırım.', boyut: 'sorumluluk', ters: true },
  { id: 'k10', soru: 'Düzenli ve organize olmak benim için önemlidir.', boyut: 'sorumluluk' },
  
  // DIŞA DÖNÜKLÜK (sosyallik, enerji)
  { id: 'k11', soru: 'İnsanlarla iletişim kurmaktan enerji alırım.', boyut: 'disaDonukluk' },
  { id: 'k12', soru: 'Grup ortamlarında kendimi rahat hissederim.', boyut: 'disaDonukluk' },
  { id: 'k13', soru: 'Yalnız kalmak beni dinlendirir, çok sosyalleşmek yorar.', boyut: 'disaDonukluk', ters: true },
  { id: 'k14', soru: 'Kalabalık etkinliklerde dikkat çekmekten hoşlanırım.', boyut: 'disaDonukluk' },
  { id: 'k15', soru: 'Yeni insanlarla tanışmak hoşuma gider.', boyut: 'disaDonukluk' },
  
  // UYUMLULUK (empati, işbirliği) - ÖĞRETMENLİK İÇİN EN KRİTİK
  { id: 'k16', soru: 'Başkalarının duygularını anlamak benim için kolaydır.', boyut: 'uyumluluk' },
  { id: 'k17', soru: 'İhtiyacı olan birine yardım etmek beni mutlu eder.', boyut: 'uyumluluk' },
  { id: 'k18', soru: 'Tartışmaktan kaçınır, uzlaşma aramayı tercih ederim.', boyut: 'uyumluluk' },
  { id: 'k19', soru: 'Bazen başkalarının duygularını anlamakta zorlanırım.', boyut: 'uyumluluk', ters: true },
  { id: 'k20', soru: 'Ekip halinde çalışmaktan keyif alırım.', boyut: 'uyumluluk' },
  
  // DUYGUSAL DENGE (stres yönetimi)
  { id: 'k21', soru: 'Stresli durumlarda sakin kalmayı başarabilirim.', boyut: 'duygusalDenge' },
  { id: 'k22', soru: 'Genellikle iyimserim ve umutlu bakarım.', boyut: 'duygusalDenge' },
  { id: 'k23', soru: 'Küçük şeyler beni kolayca üzer veya endişelendirir.', boyut: 'duygusalDenge', ters: true },
  { id: 'k24', soru: 'Hatalar yaptığımda kendimi çok suçlu hissetmem, ders çıkarırım.', boyut: 'duygusalDenge' },
  { id: 'k25', soru: 'Zorluklar karşısında pes etmem, yol arar bulurum.', boyut: 'duygusalDenge' },
  
  // SOSYAL BEĞENİRLİK (dürüstlük / yalan yakalama - kimse gerçekte "kesinlikle katılıyorum" diyemez)
  { id: 'k26', soru: 'Söylediğim her sözü her zaman yerine getiririm.', boyut: 'sosyalBegenirlik', sahteIdeal: true },
  { id: 'k27', soru: 'Hata yaptığımda her zaman hemen kabul ederim.', boyut: 'sosyalBegenirlik', sahteIdeal: true }
];

// ───────────────────────────────────────────────
// BÖLÜM 2: ÇOCUK DEĞERLERİ (Forced Choice) - 8 soru
// İki seçenekten birini seçmek zorunda
// boyut: cocukMerkezli, kuralMerkezli
// ───────────────────────────────────────────────
export const BOLUM2_DEGERLER = [
  {
    id: 'd01',
    soru: 'Bir çocuk sınıfta yere oturmuş, yapması gereken etkinliğe katılmak istemiyor. Sizin için DAHA ÖNEMLİ olan hangisi?',
    secenekler: {
      A: { metin: 'Çocuğun neden katılmak istemediğini anlamaya çalışmak', boyut: 'cocukMerkezli' },
      B: { metin: 'Etkinlik düzeninin korunması, diğer çocukların etkilenmemesi', boyut: 'kuralMerkezli' }
    }
  },
  {
    id: 'd02',
    soru: 'Kardeşi yeni doğmuş 4 yaşındaki bir çocuk, sürekli "anne!" diye ağlıyor. Sınıfta bunu nasıl ele alırsınız?',
    secenekler: {
      A: { metin: 'Çocuğun yanına oturup "Annene çok ihtiyacın var değil mi?" diyerek duygusunu kabul ederim', boyut: 'cocukMerkezli' },
      B: { metin: '"Annen seni almaya gelecek, şimdi etkinliğe odaklanmaya çalışalım" diyerek dikkat dağıtırım', boyut: 'kuralMerkezli' }
    }
  },
  {
    id: 'd03',
    soru: 'Çocukların yaratıcılığını desteklemek için sizce DAHA ETKİLİ olan hangisi?',
    secenekler: {
      A: { metin: 'Önceden tasarlanmış etkinlikler ve modellenmiş örneklerle yönlendirmek', boyut: 'kuralMerkezli' },
      B: { metin: 'Açık uçlu malzemeler vermek ve çocuğun kendi yolunu bulmasına izin vermek', boyut: 'cocukMerkezli' }
    }
  },
  {
    id: 'd04',
    soru: '5 yaşındaki bir çocuk size "Bunu yapmayacağım, istemiyorum" diyor. İlk tepkiniz ne olur?',
    secenekler: {
      A: { metin: '"Bu yaşta öğrenmesi gereken bir şey, denesin" diyerek nazikçe ısrar ederim', boyut: 'kuralMerkezli' },
      B: { metin: '"Tamam, istemediğin için hakkın saklı. Hazır olduğunda yine deneyelim" derim', boyut: 'cocukMerkezli' }
    }
  },
  {
    id: 'd05',
    soru: 'Bir çocuk yan yana oturduğu arkadaşının kalemini kırmış. SIRA hangisi?',
    secenekler: {
      A: { metin: 'Önce çocuğa bunun nedenini sorarım, sonra ne olduğunu anlamaya çalışırım', boyut: 'cocukMerkezli' },
      B: { metin: 'Kuralı hatırlatırım: "Arkadaşının eşyasına zarar vermek doğru değil"', boyut: 'kuralMerkezli' }
    }
  },
  {
    id: 'd06',
    soru: 'Disiplin sizin için DAHA ÇOK hangisi?',
    secenekler: {
      A: { metin: 'Çocuğun kendi içsel dengesini ve sorumluluk duygusunu geliştirmek', boyut: 'cocukMerkezli' },
      B: { metin: 'Sınıfın işleyişi için gerekli kuralların uygulanmasını sağlamak', boyut: 'kuralMerkezli' }
    }
  },
  {
    id: 'd07',
    soru: 'Bir çocuk yemekte hiçbir şeyi yemek istemiyor. Sizin için DAHA DOĞRU olan hangisi?',
    secenekler: {
      A: { metin: 'Çocuğun açlık-tokluk hissi kendisine ait, zorlamam', boyut: 'cocukMerkezli' },
      B: { metin: 'Sağlıklı beslenmesi için en azından bir kaşık denemesini rica ederim', boyut: 'kuralMerkezli' }
    }
  },
  {
    id: 'd08',
    soru: 'İki çocuk aynı oyuncağı istiyor ve kavga ediyorlar. İlk yaklaşımınız nedir?',
    secenekler: {
      A: { metin: 'Aralarına girer, "Sıra ile oynayın" diye yönlendirir, gerekirse oyuncağı kaldırırım', boyut: 'kuralMerkezli' },
      B: { metin: 'Onları sakinleştirir, "Ne hissediyorsun?" diye sorar, birlikte çözüm aramalarını desteklerim', boyut: 'cocukMerkezli' }
    }
  }
];

// ───────────────────────────────────────────────
// BÖLÜM 3: SINIF SENARYOLARI (Situational Judgment) - 10 soru
// Çoktan seçmeli + neden açıklaması
// puan: ideal cevap > kabul edilebilir > zayıf > kötü
// ───────────────────────────────────────────────
export const BOLUM3_SENARYOLAR = [
  {
    id: 's01',
    senaryo: 'Sabah karşılama saati. 3 yaşındaki Defne, annesini bırakmak istemiyor, kollarına sarılıp ağlıyor. Anne işe geç kalmak üzere ve siz sınıftan sorumlusunuz. NE YAPARDINIZ?',
    secenekler: [
      { id: 'A', metin: 'Anneye "Çocukla biraz daha vakit geçirin" der, yarım saatlik geç başlangıç öneririm', puan: 2, etiket: 'kabulEdilebilir' },
      { id: 'B', metin: 'Defne\'nin yanına çömelir, "Annenin işe gitmesi gerekiyor, biz birlikte güzel şeyler yapacağız" derim. Anneye sakin bir veda öneririm', puan: 4, etiket: 'ideal' },
      { id: 'C', metin: 'Hızlıca Defne\'yi anneden alıp dikkatini başka tarafa çekerim, kısa sürede unutur', puan: 1, etiket: 'zayıf' },
      { id: 'D', metin: 'Anne gidene kadar bekler, sonra Defne\'yi grup etkinliğine katılması için yönlendiririm', puan: 3, etiket: 'iyi' }
    ],
    nedenSor: true
  },
  {
    id: 's02',
    senaryo: '4 yaşındaki Ali, sınıfta arkadaşlarını sürekli iter, vurur. Anne-baba bunun "evdeki strestendir" diyor ama siz başka bir şey hissediyorsunuz. NASIL YAKLAŞIRSINIZ?',
    secenekler: [
      { id: 'A', metin: 'Ali\'yi her olayda ayrı bir köşeye götürür, sakinleştiğinde döndürürüm', puan: 1, etiket: 'zayıf' },
      { id: 'B', metin: 'Ali\'nin duygularını adlandırmaya yardım eder, alternatif davranışlar öğretir, aileye gözlemlerimi paylaşırım', puan: 4, etiket: 'ideal' },
      { id: 'C', metin: 'Önce diğer çocukları korumayı önceliklendiririm, Ali sınıftan ayrı vakit geçirir', puan: 2, etiket: 'kabulEdilebilir' },
      { id: 'D', metin: 'Müdüre durumu raporlar, ailenin uzman desteği alması için yönlendirilmesini öneririm', puan: 3, etiket: 'iyi' }
    ],
    nedenSor: true
  },
  {
    id: 's03',
    senaryo: 'Bir veli size öğretmenlik yöntemlerinizi eleştiriyor: "Çocuğum hâlâ harfleri tanımıyor, çok serbestsiniz!" SİZİN İLK TEPKİNİZ?',
    secenekler: [
      { id: 'A', metin: 'Savunmaya geçip Montessori felsefesini açıklamaya çalışırım', puan: 2, etiket: 'kabulEdilebilir' },
      { id: 'B', metin: 'Velinin endişesini dinlerim, çocuğun gelişimini somut örneklerle paylaşır, birlikte çözüm aramayı öneririm', puan: 4, etiket: 'ideal' },
      { id: 'C', metin: 'Velinin haklı olduğunu kabul eder, harf çalışmasını artırırım', puan: 1, etiket: 'zayıf' },
      { id: 'D', metin: 'Müdürle görüşmesini öneririm, kurumsal cevap daha uygun olur', puan: 2, etiket: 'kabulEdilebilir' }
    ],
    nedenSor: true
  },
  {
    id: 's04',
    senaryo: '5 yaşındaki Zeynep, sınıfta utandığı bir şey olduğunda kendini suçlayıp ağlıyor: "Ben aptalım, hiçbir şey yapamıyorum." SİZ NE DERSİNİZ?',
    secenekler: [
      { id: 'A', metin: '"Aptal değilsin, çok zekisin!" diyerek kuvvetle reddederim', puan: 2, etiket: 'kabulEdilebilir' },
      { id: 'B', metin: 'Yanına oturur, sarılır, "Şu an çok zor hissediyorsun" diye duygusunu adlandırır, sakinleşince hep birlikte deneyebileceğimizi söylerim', puan: 4, etiket: 'ideal' },
      { id: 'C', metin: '"Ağlama, herkes hata yapar" der, etkinliğe geri dönmesini sağlarım', puan: 1, etiket: 'zayıf' },
      { id: 'D', metin: 'Onun başarabildiği bir şeyi hatırlatırım, "Bunu da yapmıştın!" diye motive ederim', puan: 3, etiket: 'iyi' }
    ],
    nedenSor: true
  },
  {
    id: 's05',
    senaryo: 'Sınıfta beklenmedik bir durum: Su döküldü, bir çocuk düştü ve dudağı kanıyor, başka bir çocuk korkudan ağlıyor, üçüncüsü dökülen suya daldı oynuyor. NE YAPARSIN?',
    secenekler: [
      { id: 'A', metin: 'Önce yardım çağırır (yardımcı/asistan), kanayan çocukla ilgilenirim', puan: 4, etiket: 'ideal' },
      { id: 'B', metin: 'Tüm çocukları toplar, sıraya geçirir, sonra her birini sırayla hallederirim', puan: 1, etiket: 'zayıf' },
      { id: 'C', metin: 'Hızlıca dökülen suyu temizler, sonra yaralı çocukla ilgilenirim', puan: 2, etiket: 'kabulEdilebilir' },
      { id: 'D', metin: 'Önce kanayan çocuğa bir mendil verir, oynayan çocuğu durdurur, ağlayan çocuğa "korkma" derim', puan: 3, etiket: 'iyi' }
    ],
    nedenSor: false
  },
  {
    id: 's06',
    senaryo: 'Yardımcı öğretmen arkadaşınız bir çocuğa "Çık dışarı, beni dinlemiyor musun!" diye yüksek sesle bağırdı. Siz tanık oldunuz. NE YAPARSIN?',
    secenekler: [
      { id: 'A', metin: 'O an müdahale etmem, ortamı yumuşatırım, sonra arkadaşımla özel konuşurum', puan: 4, etiket: 'ideal' },
      { id: 'B', metin: 'Yardımcı öğretmene orada kibarca "Nefes alalım" diye işaret eder, çocuğu sakinleştiririm', puan: 3, etiket: 'iyi' },
      { id: 'C', metin: 'Hiçbir şey demem, herkesin kötü günü olabilir', puan: 1, etiket: 'zayıf' },
      { id: 'D', metin: 'Müdüre rapor ederim, bu kabul edilemez', puan: 2, etiket: 'kabulEdilebilir' }
    ],
    nedenSor: true
  },
  {
    id: 's07',
    senaryo: '6 yaşında Eren, hep aynı arkadaşıyla oynuyor, başka çocuklarla iletişim kurmuyor. SİZİN ENDİŞENİZ VAR. NE YAPARDINIZ?',
    secenekler: [
      { id: 'A', metin: 'Eren\'i farklı arkadaşlarla eşleştiren etkinlikler tasarlar, doğal kaynaşmayı desteklerim', puan: 4, etiket: 'ideal' },
      { id: 'B', metin: 'Eren\'le konuşur, "Neden sadece o arkadaşınla oynuyorsun?" diye sorarım', puan: 2, etiket: 'kabulEdilebilir' },
      { id: 'C', metin: 'Müdahale etmem, tercih hakkına saygı duyarım, herkesin sosyal stili farklı', puan: 1, etiket: 'zayıf' },
      { id: 'D', metin: 'Aileyle paylaşır, evde de aynı durum mu diye sorarım', puan: 3, etiket: 'iyi' }
    ],
    nedenSor: true
  },
  {
    id: 's08',
    senaryo: 'Velilerden biri size hediye getiriyor (pahalı bir parfüm). NE YAPARSIN?',
    secenekler: [
      { id: 'A', metin: 'Nazikçe alır, teşekkür ederim, ilişkiyi gerginleştirmem', puan: 1, etiket: 'zayıf' },
      { id: 'B', metin: 'İçtenlikle teşekkür eder, kurumun politikası gereği hediye kabul edemediğimi açıklar, gerekirse müdüre yönlendiririm', puan: 4, etiket: 'ideal' },
      { id: 'C', metin: 'Alır ve sınıftaki tüm öğretmenlerle paylaşmayı öneririm', puan: 2, etiket: 'kabulEdilebilir' },
      { id: 'D', metin: 'Müdüre danışırım, onun kararına göre hareket ederim', puan: 3, etiket: 'iyi' }
    ],
    nedenSor: false
  },
  {
    id: 's09',
    senaryo: 'Sınıftaki çocuklardan biri "Babam beni dövüyor" diyor. ÇOK ÖNEMLİ - NE YAPARDINIZ?',
    secenekler: [
      { id: 'A', metin: 'Çocuğa tekrar sorar, detayları öğrenmeye çalışırım, sonra düşünürüm', puan: 1, etiket: 'zayıf' },
      { id: 'B', metin: 'Çocuğu sakinleştirir, "Senin bunu bana söylemen çok değerli" der, derhal müdürü ve okul psikoloğunu bilgilendiririm. Yasal yükümlülüğüm var', puan: 4, etiket: 'ideal' },
      { id: 'C', metin: 'Aileyle bir görüşme ayarlarım, durumu açık şekilde konuşurum', puan: 1, etiket: 'zayıf' },
      { id: 'D', metin: 'Çocuğa "Bazen anneler-babalar kızar, geçer" der, dikkatini başka tarafa çekerim', puan: 0, etiket: 'kotu' }
    ],
    nedenSor: true,
    kritik: true
  },
  {
    id: 's10',
    senaryo: 'Sosyal medyada okulun bir velisi, sınıfta uyguladığınız bir yöntemi eleştiren paylaşım yapmış (sizin adınızı vermeden). SİZİ NE TEPKİ VERMEYE İTER?',
    secenekler: [
      { id: 'A', metin: 'Cevap olarak yöntemi savunan açıklayıcı bir post yazarım', puan: 1, etiket: 'zayıf' },
      { id: 'B', metin: 'Konuyu okul yönetimiyle paylaşır, kurumsal cevap için yönlendiririm. Kişisel olarak cevap vermem', puan: 4, etiket: 'ideal' },
      { id: 'C', metin: 'Hiç umursamam, bireysel görüş', puan: 2, etiket: 'kabulEdilebilir' },
      { id: 'D', metin: 'Veliyle özel mesajlaşır, durumu açıklamaya çalışırım', puan: 2, etiket: 'kabulEdilebilir' }
    ],
    nedenSor: false
  }
];

// ───────────────────────────────────────────────
// BÖLÜM 4: AÇIK UÇLU HİKAYELER - 3 soru (AI burada konuşacak)
// ───────────────────────────────────────────────
export const BOLUM4_HIKAYELER = [
  {
    id: 'h01',
    soru: 'Hayatınızda size derinden dokunan bir çocuk anısı var mı? Bu bir öğrencinizden olabilir, bir akrabanızdan olabilir, hatta sokakta gördüğünüz bir çocuk olabilir. O an sizi neden bu kadar etkilemişti? Lütfen kısaca anlatın.',
    minKarakter: 100,
    maxKarakter: 1500,
    placeholder: 'Bu anıyı paylaşmak için aceleci olmayın. Gerçek hisleriniz, ne düşündüğünüz, ne hissettiğiniz çok değerli...',
    yardim: 'Bu soru ile sizi tanımak istiyoruz. Edebi bir cevap aramıyoruz, samimi olmanız bizim için yeterli.'
  },
  {
    id: 'h02',
    soru: 'Şunu hayal edin: 5 yaşındaki bir çocuk size geliyor ve "Ben kötü bir çocuğum, kimse beni sevmiyor" diyor. O an ona ne söylersiniz? Konuşmayı olabildiğince doğal şekilde aktarın.',
    minKarakter: 100,
    maxKarakter: 1500,
    placeholder: 'Çocuğun karşısında olduğunuzu hayal edin. Ona kendi sözlerinizle hitap edin...',
    yardim: 'Buradaki amacımız teorik bilgi değil, sizin yaklaşım tarzınızı görmek.'
  },
  {
    id: 'h03',
    soru: 'Çocukluğunuzdan bir öğretmeniniz aklınızdan çıkmıyor mu? Pozitif veya negatif olabilir. O öğretmenin size öğrettiği en derin şey neydi? Bu deneyim, bugün siz öğretmen olarak yola çıkmanızı nasıl etkiledi?',
    minKarakter: 100,
    maxKarakter: 1500,
    placeholder: 'O öğretmeni hatırlayın... yüzü, sesi, yaptıkları... Hangisi sizde iz bıraktı?',
    yardim: 'Bu soru, sizi bu mesleğe çeken kişisel hikayeyi anlamamıza yardımcı oluyor.'
  }
];

// ───────────────────────────────────────────────
// BÖLÜM 5: ÇOCUK KORUMA & ETİK - 5 soru
// KIRMIZI BAYRAK BÖLÜMÜ - yanlış cevap = uyarı
// ───────────────────────────────────────────────
export const BOLUM5_KORUMA = [
  {
    id: 'e01',
    soru: 'Bir çocuk size sır verirken: "Lütfen anneme söyleme" diyor. Konunun çocuğun güvenliğiyle ilgili olduğundan şüpheleniyorsunuz. NE YAPARSIN?',
    secenekler: [
      { id: 'A', metin: 'Çocuğun güvenini sarsmamak için söylemem, bu önemli bir sırdı', dogru: false, kritikYanlis: true },
      { id: 'B', metin: 'Çocuğa "Seni korumak benim sorumluluğum, bunu söylemem gerekecek ama yanında olacağım" derim ve aileyi/yönetimi bilgilendiririm', dogru: true },
      { id: 'C', metin: 'Hiçbir şeye karışmam, bana söylenenleri kendime saklarım', dogru: false, kritikYanlis: true },
      { id: 'D', metin: 'Önce kendi başıma araştırırım, sonra duruma göre karar veririm', dogru: false }
    ]
  },
  {
    id: 'e02',
    soru: 'Bir çocuğun vücudunda sebebini bilmediğiniz morluklar görüyorsunuz. Çocuk "düştüm" diyor ama içiniz rahat etmiyor. NE YAPARSIN?',
    secenekler: [
      { id: 'A', metin: 'Çocuğun anlattığı doğru olabilir, çocuklar düşer. Müdahale etmem', dogru: false, kritikYanlis: true },
      { id: 'B', metin: 'Hemen müdüre/okul psikoloğuna durumu detaylı anlatır, gözlemlerimi yazılı olarak iletir, takipçi olurum', dogru: true },
      { id: 'C', metin: 'Aileyi arar, "Çocuğun bedeninde morluklar var, ne oldu?" diye sorarım', dogru: false },
      { id: 'D', metin: 'Diğer öğretmenlerle konuşur, ne yapacağıma karar veririm', dogru: false }
    ]
  },
  {
    id: 'e03',
    soru: 'Sınıfta bir çocuk size "Seni çok seviyorum" diyor ve sizi öpmek istiyor. NE YAPARSIN?',
    secenekler: [
      { id: 'A', metin: 'Karşılığını veririm, sevgisini reddetmek doğru olmaz', dogru: false, kritikYanlis: true },
      { id: 'B', metin: 'Şefkatle "Ben de seni çok seviyorum, gel sarılalım" derim. Öpüşmenin yerine sarılma veya el tutma gibi profesyonel sınırlar koyarım', dogru: true },
      { id: 'C', metin: '"Hayır, öpüşemeyiz" diyerek kesin bir sınır çekerim', dogru: false },
      { id: 'D', metin: 'Sevgiyi geri çevirmem, ama bunu velilerle paylaşırım', dogru: false }
    ]
  },
  {
    id: 'e04',
    soru: 'Bir çocuğun fotoğraflarını sınıf etkinliğinden kişisel sosyal medya hesabınıza yüklemek istiyorsunuz. NE YAPARSIN?',
    secenekler: [
      { id: 'A', metin: 'Yüklerim, herkesin gördüğü güzel anlar paylaşılmalı', dogru: false, kritikYanlis: true },
      { id: 'B', metin: 'Fotoğraflar sadece okulun resmi kanallarında, izin alınmış velilerin çocuklarına ait olarak paylaşılır. Kişisel hesabımdan asla', dogru: true },
      { id: 'C', metin: 'Çocuğun yüzünü göstermeden, sadece arkadan veya bulanıklaştırarak paylaşırım', dogru: false },
      { id: 'D', metin: 'Velilere sorar, izin verirlerse paylaşırım', dogru: false }
    ]
  },
  {
    id: 'e05',
    soru: 'Bir çocuk tuvalette kaza yapmış ve üzerini değiştirmek gerekiyor. NE YAPARSIN?',
    secenekler: [
      { id: 'A', metin: 'Çocuğu sakinleştirir, mahremiyetine saygı göstererek yardım ederim. İdeal olarak iki yetişkin yardımı koordine eder, kurumun protokollerini takip ederim', dogru: true },
      { id: 'B', metin: 'Çocuğu hızlıca soyup yenisini giydirir, kimsenin görmemesi için acele ederim', dogru: false },
      { id: 'C', metin: 'Aileyi arar, gelip çocuğu değiştirmesini isterim', dogru: false },
      { id: 'D', metin: 'Çocuğa "Kendin değişebilir misin?" diye sorar, müdahale etmem', dogru: false }
    ]
  }
];

// ───────────────────────────────────────────────
// BÖLÜM 6: HIZLI TEPKİ - 8 soru
// İlk akla gelen, düşünmeden seçilecek
// ───────────────────────────────────────────────
export const BOLUM6_HIZLI = [
  {
    id: 'r01',
    soru: 'Çocuk demek...',
    secenekler: ['Sevgi', 'Sorumluluk', 'Saflık', 'Geleceğin yetişkini', 'Bir yol arkadaşı', 'Bir şefkat hediyesi']
  },
  {
    id: 'r02',
    soru: 'İdeal sınıf...',
    secenekler: ['Sessiz ve düzenli', 'Hareketli ve yaratıcı', 'Sıcak ve güvenli', 'Disiplinli ve öğretici', 'Esnek ve doğal']
  },
  {
    id: 'r03',
    soru: 'Bir öğretmen olarak en güçlü yönüm...',
    secenekler: ['Sabır', 'Yaratıcılık', 'Empati', 'Disiplin', 'Mizah duygum', 'Şefkat', 'Düzenli olmam']
  },
  {
    id: 'r04',
    soru: 'En zorlandığım şey...',
    secenekler: ['Stresli durumlar', 'Kararsız çocuklar', 'Velilerle iletişim', 'Disiplin sağlamak', 'Sınırları korumak', 'Hayır demek']
  },
  {
    id: 'r05',
    soru: 'Çocuk öğretmenlik için...',
    secenekler: ['Bir meslek', 'Bir tutku', 'Bir görev', 'Bir hayat felsefesi', 'Bir yaşam tarzı', 'Bir hizmet']
  },
  {
    id: 'r06',
    soru: 'Çocuk ağladığında ilk hissim...',
    secenekler: ['Yardım etme isteği', 'Anlamaya çalışma', 'Sakinleştirme dürtüsü', 'Endişe', 'Kucaklama isteği', 'Soruna çözüm bulmak']
  },
  {
    id: 'r07',
    soru: 'Ödül sistemi hakkında düşüncem...',
    secenekler: ['Çok faydalı, motivasyon sağlar', 'Bazen gerekli, bazen değil', 'Mümkün olduğunca kaçınılmalı', 'Hiç kullanmam, içsel motivasyon yeter']
  },
  {
    id: 'r08',
    soru: 'Ceza hakkında düşüncem...',
    secenekler: ['Bazen kaçınılmaz', 'Sadece son çare', 'Asla kullanılmamalı', 'Cezalandırmak yerine sonuçları konuşmak gerekir', 'Çocuk eğitiminde yeri yok']
  }
];

// ───────────────────────────────────────────────
// BÖLÜM YAPILANDIRMASI
// ───────────────────────────────────────────────
export const BOLUMLER = [
  {
    no: 1,
    id: 'kisilik',
    baslik: 'Sizi Tanıyalım',
    altBaslik: 'Kişilik ve Mizaç',
    aciklama: 'Aşağıdaki ifadeleri okuyun ve size ne kadar uyduğunu işaretleyin. Doğru veya yanlış cevap yok — samimi olun yeterli.',
    sureDk: 5,
    sorular: BOLUM1_KISILIK,
    tip: 'likert' // 1-5 arası
  },
  {
    no: 2,
    id: 'degerler',
    baslik: 'Çocuğa Bakışınız',
    altBaslik: 'İki seçenek arasında seçim',
    aciklama: 'Aşağıdaki durumlarda ikisi de geçerli olabilir, ama sizin için DAHA ÖNEMLİ olan hangisi? Birini seçmek zorundasınız.',
    sureDk: 4,
    sorular: BOLUM2_DEGERLER,
    tip: 'forcedChoice'
  },
  {
    no: 3,
    id: 'senaryolar',
    baslik: 'Sınıfta Karşılaşırsanız...',
    altBaslik: 'Gerçek Senaryolar',
    aciklama: 'Aşağıdaki durumlarda nasıl davranırsınız? Size en yakın seçeneği işaretleyin. Bazılarında "neden bu cevabı verdiniz?" diye soracağız.',
    sureDk: 8,
    sorular: BOLUM3_SENARYOLAR,
    tip: 'senaryo'
  },
  {
    no: 4,
    id: 'hikayeler',
    baslik: 'Sizi Daha Yakından Tanımak İstiyoruz',
    altBaslik: 'Açık Uçlu Sorular',
    aciklama: 'Bu bölümde sizden sadece kendinizi anlatmanızı istiyoruz. Edebi bir metin değil — samimi, gerçek deneyimlerinizi paylaşın. Sizi tanımak için sabırsızız!',
    sureDk: 5,
    sorular: BOLUM4_HIKAYELER,
    tip: 'metin'
  },
  {
    no: 5,
    id: 'koruma',
    baslik: 'Çocuk Güvenliği ve Etik',
    altBaslik: 'Profesyonel Sınırlar',
    aciklama: 'Aşağıdaki durumlarda en doğru yaklaşımı seçin. Bu bölümün soruları çocuk koruma protokolleriyle ilgilidir, dikkatlice cevaplayın.',
    sureDk: 2,
    sorular: BOLUM5_KORUMA,
    tip: 'cokSecmeli'
  },
  {
    no: 6,
    id: 'hizli',
    baslik: 'Hızlı Tepkiler',
    altBaslik: 'İlk Akla Gelen',
    aciklama: 'Düşünmeden, ilk içinizden geçeni işaretleyin! Burada doğru-yanlış yok, sadece sizin doğal tepkilerinizi merak ediyoruz.',
    sureDk: 1,
    sorular: BOLUM6_HIZLI,
    tip: 'tekSecim'
  }
];

// ───────────────────────────────────────────────
// MOTİVASYON MESAJLARI (Bölüm aralarında)
// ───────────────────────────────────────────────
export const MOTIVASYONLAR = [
  {
    sonraki: 2,
    baslik: 'Harika gidiyorsunuz! 🌱',
    mesaj: 'Kendinizi nasıl tanıdığınızı görmek bizim için çok değerli. Şimdi biraz daha derine inelim — çocuğa bakışınızı anlamak istiyoruz.',
    ikon: '🌱'
  },
  {
    sonraki: 3,
    baslik: 'Çok iyi! 🌿',
    mesaj: 'Çocuk merkezli bir bakışınızın olduğunu görüyoruz. Şimdi pratik bir bölüme geçelim — gerçek sınıf senaryolarında nasıl tepki verirsiniz?',
    ikon: '🌿'
  },
  {
    sonraki: 4,
    baslik: 'Yarısını bitirdiniz! 🌳',
    mesaj: 'Tebrikler! Şimdi en sevdiğimiz bölüme geliyoruz — sizin hikâyelerinizi dinleyeceğiz. Bu bölümde edebi bir cevap değil, samimi olmanız yeterli.',
    ikon: '🌳'
  },
  {
    sonraki: 5,
    baslik: 'Çok güzel! 🌸',
    mesaj: 'Hikâyelerinizi okuduğumuzda, sizinle tanışmak için sabırsızlanacağımıza eminiz. Şimdi kısa bir bölüm var: çocuk güvenliği ve etik.',
    ikon: '🌸'
  },
  {
    sonraki: 6,
    baslik: 'Son bölüme geldik! 🌟',
    mesaj: 'Mükemmel! Son bir küçük bölüm kaldı — düşünmeden, ilk aklınıza geleni işaretleyeceksiniz. Hadi bitirelim!',
    ikon: '🌟'
  }
];

// ───────────────────────────────────────────────
// LIKERT ETİKETLERİ
// ───────────────────────────────────────────────
export const LIKERT_ETIKETLER = [
  { puan: 1, kisa: 'Hiç', uzun: 'Kesinlikle katılmıyorum' },
  { puan: 2, kisa: 'Az', uzun: 'Katılmıyorum' },
  { puan: 3, kisa: 'Orta', uzun: 'Kararsızım' },
  { puan: 4, kisa: 'Çok', uzun: 'Katılıyorum' },
  { puan: 5, kisa: 'Tam', uzun: 'Kesinlikle katılıyorum' }
];

// ───────────────────────────────────────────────
// TOPLAM SORU SAYISI
// ───────────────────────────────────────────────
export function toplamSoruSayisi() {
  return BOLUMLER.reduce((toplam, bolum) => toplam + bolum.sorular.length, 0);
}

export function bolumeKadarSoruSayisi(bolumNo) {
  return BOLUMLER
    .filter(b => b.no < bolumNo)
    .reduce((toplam, b) => toplam + b.sorular.length, 0);
}
