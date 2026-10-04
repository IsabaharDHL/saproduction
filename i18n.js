/* All public text, including editable content, is resolved here before rendering. */
window.SA_I18N = (() => {
  const messages = {
    ar: {
      brand: 'S.A Production', home: 'الرئيسية', events: 'الفعاليات', studio: 'الاستوديو', artists: 'الفنانين', offers: 'العروض', about: 'نبذة عنا',
      language: 'EN', languageLabel: 'English', booking: 'طلب الحجز', bookNow: 'طلب الحجز الآن',
      heroTitle: 'نصنع اللحظات .. ونبني التجارب', heroDescription: 'إنتاج وتنظيم الفعاليات | خدمات الاستوديو | إدارة الفنانين',
      services: 'خدماتنا', artistsDescription: 'إدارة الفنانين ونماذج أعمالهم.', eventsDescription: 'فرق، DJ، صوت، تصوير وشاشات.', studioDescription: 'تسجيل، مكساج، هندسة وتوزيع.',
      discover: 'اكتشف المزيد ←', featured: 'أبرز الفنانين', bookingTitle: 'اطلب حجزك الآن', bookingDescription: 'تواصل معنا مباشرة عبر واتساب.', whatsapp: 'تواصل عبر واتساب',
      qrTitle: 'لمستخدمي الأجهزة الأخرى غير الجوال', qrDescription: 'امسح رمز QR بالجوال لإرسال الطلب مباشرة عبر واتساب.', qrAlt: 'رمز واتساب QR',
      specialOffers: 'العروض الخاصة', details: 'اكتشف التفاصيل', copyright: '© 2026 S.A Production — جميع الحقوق محفوظة', credit: 'Developed by Isa Bahar',
      close: 'إغلاق', backToArtist: 'الرجوع لمعلومات الفنان', previous: 'الفنانون السابقون', next: 'الفنانون التاليون', bookArtist: 'طلب حجز الفنان', inquireOffer: 'استفسر عن العرض', inquire: 'طلب / استفسار عبر واتساب',
      inquiryMessage: 'استفسار عن {name}', artistMessage: 'أرغب بحجز {name}', video: 'تشغيل الفيديو {number}', player: 'مشغل الفيديو',
      artistFallback: 'فنان', offerFallback: 'عرض', bioFallback: 'تواصل معنا لمعرفة المزيد عن الفنان.', descriptionFallback: 'تواصل معنا لمعرفة التفاصيل.',
      aboutText: 'S.A Production شركة متخصصة في الإنتاج وتنظيم الفعاليات وخدمات الاستوديو وإدارة الفنانين.',
      eventItems: [{title:'فرقة كاملة / نصف فرقة',description:'تشكيلة مرنة حسب المناسبة.'},{title:'DJ وهندسة الصوت',description:'خدمة منفصلة أو ضمن الباقة.'},{title:'التصوير والشاشات',description:'إضافات حسب موقع ونوع المناسبة.'}],
      studioItems: [{title:'التسجيل الصوتي',description:'زفات، أغاني ومشاريع صوتية.'},{title:'المكساج والهندسة',description:'معالجة وموازنة وتجهيز الصوت.'},{title:'التوزيع الموسيقي',description:'توزيع جديد حسب متطلبات المشروع.'}],
      artistNames: ['الفنان أحمد','الفنان محمد','الفنان علي','الفنان خالد'], defaultBio: 'نبذة الفنان.',
      offerTitles: ['عرض التسجيل','باقات الفعاليات','إدارة الفنانين'], offerDescriptions: ['عرض خاص لخدمات الاستوديو.','باقات مرنة حسب المناسبة.','تفاصيل خدمات إدارة الفنانين.']
    },
    en: {
      brand: 'S.A Production', home: 'Home', events: 'Events', studio: 'Studio', artists: 'Artists', offers: 'Offers', about: 'About Us',
      language: 'AR', languageLabel: 'Switch to Arabic', booking: 'Book Now', bookNow: 'Book Now',
      heroTitle: 'We Create Moments.. We Build Experiences', heroDescription: 'Events Production | Studio Services | Artist Management',
      services: 'Our Services', artistsDescription: 'Artist management and performance portfolios.', eventsDescription: 'Bands, DJs, sound, filming and screens.', studioDescription: 'Recording, mixing, engineering and arrangement.',
      discover: 'Discover More →', featured: 'Featured Artists', bookingTitle: 'Book Now', bookingDescription: 'Contact us directly on WhatsApp.', whatsapp: 'Contact via WhatsApp',
      qrTitle: 'Using a Computer or Tablet?', qrDescription: 'Scan the QR code with your phone to send your request directly via WhatsApp.', qrAlt: 'WhatsApp QR code',
      specialOffers: 'Special Offers', details: 'Discover Details', copyright: '© 2026 S.A Production — All rights reserved', credit: 'Developed by Isa Bahar',
      close: 'Close', backToArtist: 'Back to Artist Information', previous: 'Previous artists', next: 'Next artists', bookArtist: 'Book Artist', inquireOffer: 'Ask About This Offer', inquire: 'Book / Enquire via WhatsApp',
      inquiryMessage: 'Enquiry about {name}', artistMessage: 'I would like to book {name}', video: 'Play video {number}', player: 'Video player',
      artistFallback: 'Artist', offerFallback: 'Offer', bioFallback: 'Contact us to learn more about this artist.', descriptionFallback: 'Contact us for details.',
      aboutText: 'S.A Production specializes in events production, studio services, and artist management.',
      eventItems: [{title:'Full / Half Band',description:'Flexible lineup based on the event.'},{title:'DJ & Sound Engineering',description:'Available separately or as part of a package.'},{title:'Filming & Screens',description:'Optional services based on venue and event type.'}],
      studioItems: [{title:'Recording',description:'Wedding entrances, songs and audio projects.'},{title:'Mixing & Engineering',description:'Audio processing, balancing and final preparation.'},{title:'Music Arrangement',description:'New arrangements based on project requirements.'}],
      artistNames: ['Artist Ahmed','Artist Mohammed','Artist Ali','Artist Khalid'], defaultBio: 'Artist biography.',
      offerTitles: ['Recording Offer','Event Packages','Artist Management'], offerDescriptions: ['Special studio offer.','Flexible event packages.','Artist management services.']
    }
  };
  const defaults = {
    whatsapp: '97366710720',
    bannerTitleAr: messages.ar.heroTitle, bannerTitleEn: messages.en.heroTitle,
    aboutAr: messages.ar.aboutText, aboutEn: messages.en.aboutText,
    artists: messages.ar.artistNames.map((ar,i) => ({ar,en:messages.en.artistNames[i],bioAr:messages.ar.defaultBio,bioEn:messages.en.defaultBio,image:`a${i+1}.jpg`,focusX:50,focusY:25,detailFocusX:50,detailFocusY:25,videos:[]})),
    offers: messages.ar.offerTitles.map((ar,i) => ({ar,en:messages.en.offerTitles[i],descAr:messages.ar.offerDescriptions[i],descEn:messages.en.offerDescriptions[i]}))
  };
  const arabic = /[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]/;
  function dictionary(lang, data) {
    const base = messages[lang];
    // A missing or Arabic-contaminated English field gets an English fallback,
    // never the Arabic field. User data itself is preserved unchanged.
    const localized = (item, ar, en, fallback) => {
      const value = item && item[lang === 'ar' ? ar : en];
      return typeof value === 'string' && value.trim() && (lang !== 'en' || !arabic.test(value)) ? value : fallback;
    };
    return {...base,
      heroTitle: localized(data,'bannerTitleAr','bannerTitleEn',base.heroTitle),
      aboutText: localized(data,'aboutAr','aboutEn',base.aboutText),
      artistContent: data.artists.map(x => ({name:localized(x,'ar','en',base.artistFallback),bio:localized(x,'bioAr','bioEn',base.bioFallback)})),
      offerContent: data.offers.map(x => ({name:localized(x,'ar','en',base.offerFallback),description:localized(x,'descAr','descEn',base.descriptionFallback)}))
    };
  }
  return {defaults, dictionary};
})();
