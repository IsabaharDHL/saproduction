(() => {
  'use strict';
  const read = key => { try { return localStorage.getItem(key); } catch { return null; } };
  function normalized(source = {}) {
    const value = {...structuredClone(SA_I18N.defaults), ...source};
    for (const key of ['artists','offers']) {
      if (!Array.isArray(value[key])) value[key] = SA_I18N.defaults[key];
      value[key] = value[key].filter(x => x && typeof x === 'object');
    }
    return value;
  }
  let data = normalized();
  let lang = read('saLang') === 'en' ? 'en' : 'ar';
  let words, start = 0, modal = null;
  const page = location.pathname.split('/').pop().replace('.html','') || 'index';
  const params = new URLSearchParams(location.search);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const t = (key, values = {}) => {
    if (!(key in words)) throw new Error(`Missing i18n key: ${key}`);
    return String(words[key]).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
  };
  const text = (key, values) => esc(t(key, values));
  const picture = (url, fallback) => {
    if (typeof url !== 'string' || !/^(?:data:image\/(?:png|jpeg|jpg|gif|webp);base64,|https?:\/\/|[\w.-]+\.(?:jpg|jpeg|png|webp|gif)$)/i.test(url)) return fallback;
    return url;
  };
  const background = (url, fallback) => esc(`background-image:url("${picture(url,fallback).replace(/["\\\n\r]/g,'')}")`);
  const focus = value => Math.max(0,Math.min(100,Number(value) || 0));
  const artistPosition = artist => `${artist?.focusX == null ? 50 : focus(artist.focusX)}% ${artist?.focusY == null ? 25 : focus(artist.focusY)}%`;
  const artistDetailPosition = artist => `${artist?.detailFocusX == null ? (artist?.focusX ?? 50) : focus(artist.detailFocusX)}% ${artist?.detailFocusY == null ? (artist?.focusY ?? 25) : focus(artist.detailFocusY)}%`;
  const whatsappNumber = () => String(data.whatsapp || '').replace(/\D/g,'') || SA_I18N.defaults.whatsapp;
  const whatsappUrl = (message = '') => `https://wa.me/${whatsappNumber()}${message ? '?text=' + encodeURIComponent(message) : ''}`;
  const wa = (label, message = '') => `<a class="wa" href="${esc(whatsappUrl(message))}">${text(label)}</a>`;
  let qrCacheUrl = '', qrCacheSource = '';
  function whatsappQr() {
    const url = whatsappUrl();
    if (url !== qrCacheUrl) {
      const code = qrcode(0, 'M');
      code.addData(url, 'Byte');
      code.make();
      qrCacheSource = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(code.createSvgTag({cellSize:4,margin:16}));
      qrCacheUrl = url;
    }
    return qrCacheSource;
  }
  const link = (key, href, action = key) => `<a href="${href}" data-open="${action}">${text(key)}</a>`;
  function nav() {
    return `<nav><div class="w nav"><a href="index.html"><img class="logo" src="logo-white.png" alt="${text('brand')}"></a><div class="menu">${link('home','index.html','')}${link('events','events.html')}${link('studio','studio.html')}${link('artists','artists.html')}${link('offers','index.html#offers')}${link('about','index.html#about')}</div><div style="display:flex;gap:8px"><button class="langBtn" id="langBtn" aria-label="${text('languageLabel')}">${text('language')}</button><a class="btn" href="${page === 'index' ? '' : 'index.html'}#booking">${text('booking')}</a></div></div></nav>`;
  }
  const footer = () => `<footer><img src="logo-white.png" alt="${text('brand')}"><p>${text('copyright')}</p><small>${text('credit')}</small></footer>`;
  const artistCard = i => `<a class="card artist" href="artist.html?i=${i+1}" data-open="artist" data-index="${i}"><div class="photo" style="${background(data.artists[i].image,'management.jpg')};background-position:${artistPosition(data.artists[i])}"></div><b>${esc(words.artistContent[i].name)}</b></a>`;
  let carouselTimer = null, carouselAnimation = null;
  let carouselHovered = false, carouselFocused = false, carouselTouching = false;
  let carouselOffset = 0, carouselLastTime = null;
  const visibleArtists = () => Math.min(data.artists.length, window.innerWidth <= 480 ? 1 : window.innerWidth <= 800 ? 2 : 4);
  function carousel() {
    const count = visibleArtists();
    return Array.from({length: data.artists.length ? count + (data.artists.length > 1 ? 1 : 0) : 0}, (_, k) => artistCard((start + k) % data.artists.length)).join('');
  }
  function carouselStep() {
    const track = document.getElementById('artistTrack');
    return track?.children[0] ? track.children[0].getBoundingClientRect().width + 15 : 1;
  }
  function positionCarousel() {
    const track = document.getElementById('artistTrack');
    if (track) track.style.transform = 'translateX(' + (lang === 'ar' ? 1 : -1) * carouselOffset * carouselStep() + 'px)';
  }
  function layoutCarousel() {
    const track = document.getElementById('artistTrack'), count = visibleArtists();
    if (!track) return;
    track.style.display = 'flex';
    track.style.gap = '15px';
    track.style.willChange = 'transform';
    for (const card of track.children) {
      card.style.flex = '0 0 calc((100% - ' + Math.max(0, count - 1) * 15 + 'px) / ' + Math.max(1, count) + ')';
      card.style.minWidth = '0';
    }
    for (const id of ['prev', 'next']) document.getElementById(id).disabled = data.artists.length <= 1;
    positionCarousel();
  }
  function stopCarousel() {
    if (carouselTimer !== null) cancelAnimationFrame(carouselTimer);
    carouselTimer = null;
    carouselLastTime = null;
  }
  function carouselPaused() {
    return page !== 'index' || document.hidden || modal || carouselHovered || carouselFocused || carouselTouching || carouselAnimation || data.artists.length <= 1;
  }
  function tickCarousel(time) {
    carouselTimer = null;
    if (carouselPaused()) {carouselLastTime = null; return;}
    const elapsed = carouselLastTime === null ? 0 : Math.min(time - carouselLastTime, 64);
    carouselLastTime = time;
    carouselOffset += elapsed * 0.028 / carouselStep();
    if (carouselOffset >= 1) {
      start = (start + Math.floor(carouselOffset)) % data.artists.length;
      carouselOffset %= 1;
      document.getElementById('artistTrack').innerHTML = carousel();
      layoutCarousel();
    } else positionCarousel();
    carouselTimer = requestAnimationFrame(tickCarousel);
  }
  function scheduleCarousel() {
    stopCarousel();
    if (!carouselPaused()) carouselTimer = requestAnimationFrame(tickCarousel);
  }
  function moveCarousel(direction) {
    const track = document.getElementById('artistTrack');
    stopCarousel();
    if (!track || carouselAnimation || data.artists.length <= 1) return;
    const shift = (lang === 'ar' ? 1 : -1) * carouselStep();
    const nextStart = (start + direction + data.artists.length) % data.artists.length;
    let from = carouselOffset * shift, to = shift;
    if (direction < 0) {
      // Keep the visible cards in place while adding the preceding card.
      start = nextStart;
      track.innerHTML = carousel();
      track.insertAdjacentHTML('beforeend', artistCard((start + visibleArtists() + 1) % data.artists.length));
      layoutCarousel();
      from = (1 + carouselOffset) * shift;
      to = 0;
    }
    const animation = track.animate(
      [{transform: 'translateX(' + from + 'px)'}, {transform: 'translateX(' + to + 'px)'}],
      {duration: 400, easing: 'ease-in-out', fill: 'forwards'}
    );
    carouselAnimation = animation;
    animation.finished.then(() => {
      if (carouselAnimation !== animation) return;
      start = nextStart;
      carouselOffset = 0;
      track.innerHTML = carousel();
      layoutCarousel();
      animation.cancel();
      carouselAnimation = null;
      scheduleCarousel();
    }).catch(() => {});
  }
  function initCarousel() {
    const root = document.querySelector('.artistCarousel');
    if (!root) return;
    carouselHovered = window.matchMedia('(hover: hover) and (pointer: fine)').matches && root.matches(':hover');
    carouselFocused = root.contains(document.activeElement);
    carouselTouching = false;
    layoutCarousel();
    root.addEventListener('mouseenter', () => {if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {carouselHovered = true; stopCarousel();}});
    root.addEventListener('mouseleave', () => {carouselHovered = false; scheduleCarousel();});
    root.addEventListener('focusin', () => {carouselFocused = true; stopCarousel();});
    root.addEventListener('focusout', event => {if (!root.contains(event.relatedTarget)) {carouselFocused = false; scheduleCarousel();}});
    root.addEventListener('pointerdown', event => {if (event.pointerType !== 'mouse') {carouselTouching = true; stopCarousel();}});
    scheduleCarousel();
  }
  document.addEventListener('pointerup', () => {carouselTouching = false; scheduleCarousel();});
  document.addEventListener('pointercancel', () => {carouselTouching = false; scheduleCarousel();});
  document.addEventListener('visibilitychange', scheduleCarousel);
  window.addEventListener('resize', () => {
    if (carouselAnimation) {carouselAnimation.cancel(); carouselAnimation = null; carouselOffset = 0;}
    const track = document.getElementById('artistTrack');
    if (track) {track.innerHTML = carousel(); layoutCarousel();}
    scheduleCarousel();
  });
  function offerCards() {
    return data.offers.map((o,i)=>`<a class="card feature" href="offer.html?id=${i+1}" data-open="offer" data-index="${i}"><h3>${esc(words.offerContent[i].name)}</h3><p>${text('details')}</p></a>`).join('');
  }
  function home() {
    return `<header class="hero" style="${background(data.bannerImage,'hero.jpg')}"><div class="hc"><img src="logo-white.png" alt="${text('brand')}"><h1>${text('heroTitle')}</h1><p>${text('heroDescription')}</p><a class="wa" href="#booking">${text('bookNow')}</a></div></header>
    <section><div class="w"><h2 class="title">${text('services')}</h2><div class="g3">${['artists','events','studio'].map(k=>`<div class="card"><div class="photo" style="background-image:url(${k==='artists'?'management':k}.jpg)"></div><div class="body"><h2>${text(k)}</h2><p>${text(k+'Description')}</p><a class="more" href="${k}.html" data-open="${k}">${text('discover')}</a></div></div>`).join('')}</div></div></section>
    <section><div class="w"><h2 class="title" id="featuredTitle">${text('featured')}</h2><div class="artistCarousel"><button class="arr ${lang==='ar'?'arrR':'arrL'}" id="prev" dir="ltr" aria-label="${text('previous')}">${lang==='ar'?'›':'‹'}</button><div style="overflow:hidden;min-width:0"><div class="artistTrack" id="artistTrack">${carousel()}</div></div><button class="arr ${lang==='ar'?'arrL':'arrR'}" id="next" dir="ltr" aria-label="${text('next')}">${lang==='ar'?'‹':'›'}</button></div></div></section>
    <section id="booking"><div class="w contact"><div class="panel"><h2>${text('bookingTitle')}</h2><p>${text('bookingDescription')}</p>${wa('whatsapp')}</div><div class="panel qrrow"><div><h2>${text('qrTitle')}</h2><p>${text('qrDescription')}</p></div><img class="qr" src="${esc(whatsappQr())}" alt="${text('qrAlt')}"></div></div></section>
    <section id="offers"><div class="w"><h2 class="title">${text('specialOffers')}</h2><div class="g3">${offerCards()}</div></div></section>`;
  }
  function serviceCards(k, modalView) {
    return words[k==='events'?'eventItems':'studioItems'].map(x=>`<div class="${modalView?'mini':'card feature'}"><h3>${esc(x.title)}</h3>${modalView?'':`<p>${esc(x.description)}</p>`}</div>`).join('');
  }
  const yt = url => {
    const match = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})(?:[?&/]|$)/);
    return match ? match[1] : '';
  };
  function artistDetail(index) {
    const x = data.artists[index], content = words.artistContent[index];
    if (!x) return `<h1>${text('artists')}</h1>`;
    const videos = (Array.isArray(x.videos)?x.videos:[]).map((url,i)=>{
      const id=yt(url);
      return id?`<button class="thumb" data-play="${id}" data-artist-index="${index}" style="background-image:url('https://img.youtube.com/vi/${id}/hqdefault.jpg')" aria-label="${text('video',{number:i+1})}"></button>`:'';
    }).join('');
    return `<h1>${esc(content.name)}</h1><div role="img" aria-label="${esc(content.name)}" style="height:280px;max-height:36vh;border-radius:14px;margin:15px 0;background-size:cover;background-repeat:no-repeat;${background(x.image,'management.jpg')};background-position:${artistDetailPosition(x)}"></div><p>${esc(content.bio)}</p><div class="videoGrid">${videos}</div><br>${wa('bookArtist',t('artistMessage',{name:content.name}))}`;
  }
  function offerDetail(index) {
    const x=data.offers[index], content=words.offerContent[index];
    if (!x) return `<h1>${text('specialOffers')}</h1>`;
    return `<h1>${esc(content.name)}</h1>${x.image?`<div class="modalHero" style="${background(x.image,'management.jpg')}"></div>`:''}<p>${esc(content.description)}</p>${wa('inquireOffer',t('inquiryMessage',{name:content.name}))}`;
  }
  function modalContent() {
    const {kind,index,id,returnIndex}=modal;
    if (kind==='artist') return artistDetail(index);
    if (kind==='offer') return offerDetail(index);
    if (kind==='play') return `<button class="wa" id="backArtist" data-return-index="${returnIndex}">${lang==='ar'?'→':'←'} ${text('backToArtist')}</button><br><br><iframe class="player" title="${text('player')}" src="https://www.youtube.com/embed/${id}?autoplay=1&hl=${lang}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    if (kind==='about') return `<h1>${text('about')}</h1><p>${text('aboutText')}</p>`;
    if (kind==='artists') return `<h1>${text('artists')}</h1><div class="videoGrid">${data.artists.map((x,i)=>`<a class="mini" href="artist.html?i=${i+1}" data-open="artist" data-index="${i}"><h3>${esc(words.artistContent[i].name)}</h3></a>`).join('')}</div>`;
    if (kind==='offers') return `<h1>${text('specialOffers')}</h1><div class="videoGrid">${data.offers.map((x,i)=>`<a class="mini" href="offer.html?id=${i+1}" data-open="offer" data-index="${i}"><h3>${esc(words.offerContent[i].name)}</h3><p>${esc(words.offerContent[i].description)}</p></a>`).join('')}</div>`;
    return `<h1>${text(kind)}</h1><div class="modalHero" style="background-image:url('${kind}.jpg')"></div><div class="videoGrid">${serviceCards(kind,true)}</div>`;
  }
  function detailPage() {
    if (page==='artist' || page==='offer') {
      const index=Math.max(0,(Number(params.get(page==='artist'?'i':'id'))||1)-1);
      return `<section><div class="w"><div class="panel">${page==='artist'?artistDetail(index):offerDetail(index)}</div></div></section>`;
    }
    const isArtists=page==='artists', key=isArtists?'artists':page==='events'?'events':'studio';
    return `<header class="pageHero" style="--bg:url(${isArtists?'management':key}.jpg)"><div><h1>${text(key)}</h1></div></header><section><div class="w"><div class="${isArtists?'g4':'g3'}">${isArtists?data.artists.map((_,i)=>artistCard(i)).join(''):serviceCards(key,false)}</div>${isArtists?'':`<br>${wa('inquire',t('inquiryMessage',{name:t(key)}))}`}</div></section>`;
  }
  function renderModal() {
    const wrap=document.getElementById('mw');
    document.getElementById('mcontent').innerHTML=modal?modalContent():'';
    wrap.classList.toggle('open',!!modal);
    wrap.setAttribute('aria-hidden',String(!modal));
    if (modal) document.getElementById('mc').focus();
    scheduleCarousel();
  }
  function render() {
    if (!contentReady) {
      words=SA_I18N.dictionary(lang,data);
      document.documentElement.lang=lang;
      document.documentElement.dir=lang==='ar'?'rtl':'ltr';
      const message=contentError ? (lang==='ar'?'تعذر تحميل الموقع. أعد تحميل الصفحة للمحاولة.':'Unable to load the site. Reload to try again.') : (lang==='ar'?'جاري تحميل الموقع…':'Loading…');
      document.getElementById('app').innerHTML=nav()+'<main class="sa-loading'+(contentError?' sa-loading-error':'')+'"><div class="sa-loading-brand"><img src="logo-white.png" alt="S.A Production" width="150" height="150"><span class="sa-loading-shine" aria-hidden="true"></span></div><div class="sa-loading-line" aria-hidden="true"><span></span></div><p role="status" aria-live="polite">'+esc(message)+'</p></main>'+footer();
      return;
    }
    stopCarousel();
    if (carouselAnimation) {carouselAnimation.cancel(); carouselAnimation = null;}
    start = data.artists.length ? start % data.artists.length : 0;
    words=SA_I18N.dictionary(lang,data);
    document.documentElement.lang=lang;
    document.documentElement.dir=lang==='ar'?'rtl':'ltr';
    document.title=page==='index'?t('brand'):`${t(page==='offer'?'specialOffers':page==='artist'?'artists':page)} | ${t('brand')}`;
    document.getElementById('app').innerHTML=nav()+(page==='index'?home():detailPage())+footer()+`<div class="modalWrap" id="mw" aria-hidden="true"><div class="modalBox" role="dialog" aria-modal="true" aria-label="${text('brand')}"><button class="modalClose" id="mc" aria-label="${text('close')}">×</button><div id="mcontent"></div></div></div>`;
    renderModal();
    initCarousel();
  }
  document.addEventListener('click', event => {
    const target=event.target.closest('a,button,#mw');
    if (!target) return;
    if (target.id==='langBtn') {
      lang=lang==='ar'?'en':'ar';
      try {localStorage.setItem('saLang',lang);} catch {}
      const scroll=window.scrollY;
      render(); window.scrollTo(0,scroll); return;
    }
    if (target.id==='mc' || target.id==='mw') {modal=null;renderModal();return;}
    if (target.id==='prev' || target.id==='next') {
      moveCarousel(target.id === 'prev' ? -1 : 1);
      if (event.detail > 0) target.blur();
      return;
    }
    if (target.id==='backArtist') {modal=page==='artist'?null:{kind:'artist',index:Number(target.dataset.returnIndex)||0};renderModal();return;}
    if (target.dataset.play) {modal={kind:'play',id:target.dataset.play,returnIndex:Number(target.dataset.artistIndex)||0};renderModal();return;}
    if (target.dataset.open && (page==='index' || target.dataset.open==='about')) {
      event.preventDefault();modal={kind:target.dataset.open,index:Number(target.dataset.index)||0};renderModal();
    }
  });
  document.addEventListener('keydown', event => {if(event.key==='Escape' && modal){modal=null;renderModal();}});
  // Firebase sends published content to every device through this event.
  window.addEventListener('sa:content', event => {
    const firstContent=!contentReady;
    contentReady = true;
    data = normalized(event.detail);
    const scroll = window.scrollY;
    render();
    if(firstContent&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches) document.getElementById('app').animate([{opacity:.35},{opacity:1}],{duration:180,easing:'ease-out'});
    window.scrollTo(0, scroll);
  });
  let contentReady = false, contentError = false;
  window.addEventListener('sa:content-error', () => {if(!contentReady){contentError=true;render();}});
  render();
})();
const loadingStyle=document.createElement('style');
  loadingStyle.textContent=`
    .sa-loading{min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;padding:60px 24px;background:radial-gradient(ellipse at center,#ffffff08,transparent 60%)}
    .sa-loading-brand{position:relative;width:150px;height:150px;overflow:hidden;animation:sa-breathe 2.4s ease-in-out infinite}
    .sa-loading-brand img{width:100%;height:100%;object-fit:contain;display:block}
    .sa-loading-shine{position:absolute;inset:0;background:linear-gradient(110deg,transparent 42%,#fff9 50%,transparent 58%) 150% 0/300% 100% no-repeat;-webkit-mask:url("logo-white.png") center/contain no-repeat;mask:url("logo-white.png") center/contain no-repeat;animation:sa-shine 2.4s ease-in-out infinite;pointer-events:none}
    .sa-loading-line{width:110px;height:2px;background:#ffffff15;border-radius:2px;overflow:hidden}
    .sa-loading-line span{display:block;width:45%;height:100%;background:#fff;border-radius:2px;animation:sa-progress 1.5s ease-in-out infinite}
    .sa-loading p{margin:0;color:#aaa;font-size:13px;line-height:1.8;text-align:center}
    @keyframes sa-breathe{0%,100%{opacity:.5;transform:scale(.96)}50%{opacity:1;transform:scale(1)}}
    @keyframes sa-shine{0%,15%{background-position:150% 0}80%,100%{background-position:-50% 0}}
    @keyframes sa-progress{0%{transform:translateX(-110%)}100%{transform:translateX(330%)}}
    .sa-loading-error .sa-loading-brand,.sa-loading-error .sa-loading-shine{animation:none;opacity:1;transform:none}
    .sa-loading-error .sa-loading-shine,.sa-loading-error .sa-loading-line{display:none}
    @media(prefers-reduced-motion:reduce){.sa-loading-brand,.sa-loading-shine,.sa-loading-line span{animation:none;transform:none;opacity:1}.sa-loading-shine{display:none}.sa-loading-line span{width:100%}}
  `;
  document.head.append(loadingStyle);
  let contentReady = false, contentError = false;
