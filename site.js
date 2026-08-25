
(function(){
  // Smooth page transitions: fade in on load, fade out before internal navigation
  const rootEl = document.documentElement;
  const markReady = () => { rootEl.classList.remove('page-leaving'); rootEl.classList.add('page-ready'); };
  requestAnimationFrame(markReady);
  setTimeout(markReady, 250); // failsafe: never leave the page hidden
  // Always reveal on show — covers back/forward (bfcache) restores on mobile,
  // where the page could otherwise return still marked 'page-leaving' (blank).
  window.addEventListener('pageshow', markReady);
  window.addEventListener('pagehide', () => rootEl.classList.remove('page-leaving'));
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if(!link) return;
    if(e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if(link.target && link.target !== '_self') return;
    const href = link.getAttribute('href');
    if(!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if(link.origin && link.origin !== location.origin) return;
    if(link.hasAttribute('data-bs-toggle')) return;
    e.preventDefault();
    rootEl.classList.remove('page-ready');
    rootEl.classList.add('page-leaving');
    setTimeout(() => { location.href = link.href; }, 210);
  });

  const langButtons = document.querySelectorAll('[data-set-lang]');
  const storageKey = 'siteLang';

  function getStoredLang(){
    try {
      return localStorage.getItem(storageKey) || 'tr';
    } catch (error) {
      return document.documentElement.dataset.siteLang || 'tr';
    }
  }

  function setStoredLang(lang){
    try {
      localStorage.setItem(storageKey, lang);
    } catch (error) {
      document.documentElement.dataset.siteLang = lang;
    }
  }

  function applyLang(lang){
    lang = lang === 'tr' ? 'tr' : 'en';

    document.documentElement.lang = lang;
    document.documentElement.dataset.siteLang = lang;
    document.body.classList.toggle('lang-tr', lang === 'tr');
    document.body.classList.toggle('lang-en', lang !== 'tr');

    document.querySelectorAll('[data-en][data-tr]').forEach(el => {
      const value = lang === 'tr' ? el.getAttribute('data-tr') : el.getAttribute('data-en');
      if (value !== null) el.textContent = value;
    });

    document.querySelectorAll('[data-placeholder-en][data-placeholder-tr]').forEach(el => {
      const value = lang === 'tr' ? el.getAttribute('data-placeholder-tr') : el.getAttribute('data-placeholder-en');
      if (value !== null) el.placeholder = value;
    });

    langButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-set-lang') === lang);
      btn.setAttribute('aria-pressed', btn.getAttribute('data-set-lang') === lang ? 'true' : 'false');
    });

    setStoredLang(lang);
  }

  langButtons.forEach(btn => {
    btn.addEventListener('click', function(event){
      event.preventDefault();
      applyLang(btn.getAttribute('data-set-lang') || 'en');
    });
  });

  window.setSiteLanguage = applyLang;
  applyLang(getStoredLang());

  const quoteModalEl = document.getElementById('quoteModal');
  const quoteService = document.querySelector('[data-quote-service]');
  const modalInstance = quoteModalEl && window.bootstrap ? new bootstrap.Modal(quoteModalEl) : null;

  function updateVehicleFields(){
    const form = quoteService ? quoteService.closest('form') : null;
    const wrap = form ? form.querySelector('[data-vehicle-fields]') : null;
    if(!wrap || !quoteService) return;
    const visible = quoteService.value === 'kasko-trafik-sigortalari';
    wrap.classList.toggle('is-visible', visible);
    wrap.querySelectorAll('input').forEach(input => {
      input.required = visible;
      if(!visible) input.value = '';
    });
  }

  document.querySelectorAll('[data-open-quote]').forEach(btn => {
    btn.addEventListener('click', function(e){
      e.preventDefault();
      const service = btn.dataset.service;
      if(service && quoteService) quoteService.value = service;
      updateVehicleFields();
      if(modalInstance) modalInstance.show();
      else if(quoteModalEl) quoteModalEl.classList.add('show');
    });
  });

  if(quoteService){
    quoteService.addEventListener('change', updateVehicleFields);
    updateVehicleFields();
  }

  document.querySelectorAll('input[name="plate"]').forEach(input => {
    input.addEventListener('input', () => input.value = input.value.toLocaleUpperCase('tr-TR').slice(0,14));
  });

  document.querySelectorAll('input[name="licenseSerial"]').forEach(input => {
    input.addEventListener('input', () => input.value = input.value.toLocaleUpperCase('tr-TR').replace(/\s+/g,'').slice(0,12));
  });

  // --- Email routing: which inbox(es) each product's requests are sent to ---
  var MAIL_DOMAIN = '@bahtiyarozdemirsigorta.com';
  var MAIL_ROUTES = {
    'kasko-trafik-sigortalari': ['teknik','bilgi'],
    'ihtiyari-mali-mesuliyet-sigortasi': ['teknik','bilgi'],
    'yesil-kart-sigortasi': ['teknik','bilgi'],
    'ferdi-kaza-sigortasi': ['teknik','bilgi'],
    'saglik-sigortalari-ve-calisan-yan-haklari': ['teknik2'],
    'hekim-sorumluluk-sigortalari': ['teknik2'],
    'seyahat-saglik-sigortalari': ['teknik2'],
    'dask-konut-sigortalari': ['teknik1','baha'],
    'bireysel-emeklilik-sigortasi': ['muhasebe']
  };
  var MAIL_DEFAULT = ['teknik1','kurumsal','elifgulec'];
  function mailFor(slug){
    var boxes = MAIL_ROUTES[slug] || MAIL_DEFAULT;
    return boxes.map(function(b){ return b + MAIL_DOMAIN; }).join(',');
  }
  function productName(slug, lang){
    var opt = document.querySelector('[data-product-select] option[value="' + slug + '"]');
    if(opt) return lang === 'tr' ? opt.getAttribute('data-tr') : opt.getAttribute('data-en');
    return slug;
  }
  function buildMailto(slug, f){
    var lang = getStoredLang();
    var name = productName(slug, lang) || (lang === 'tr' ? 'Sigorta' : 'Insurance');
    var subject = (lang === 'tr' ? 'Web Talebi - ' : 'Website Request - ') + name;
    var L = [];
    L.push((lang === 'tr' ? 'Ürün: ' : 'Product: ') + name);
    L.push((lang === 'tr' ? 'Ad Soyad: ' : 'Full Name: ') + (f.name || ''));
    L.push((lang === 'tr' ? 'E-posta: ' : 'E-mail: ') + (f.email || ''));
    if(f.phone) L.push((lang === 'tr' ? 'Telefon: ' : 'Phone: ') + f.phone);
    if(f.plate) L.push((lang === 'tr' ? 'Plaka: ' : 'Plate: ') + f.plate);
    if(f.licenseSerial) L.push((lang === 'tr' ? 'Ruhsat Seri No: ' : 'License Serial: ') + f.licenseSerial);
    L.push((lang === 'tr' ? 'Not: ' : 'Note: ') + (f.note || ''));
    return 'mailto:' + mailFor(slug) + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(L.join('\r\n'));
  }
  function buildMailtoTo(to, subject, f){
    var lang = getStoredLang();
    var L = [];
    if(f.name) L.push((lang === 'tr' ? 'Ad Soyad: ' : 'Full Name: ') + f.name);
    L.push((lang === 'tr' ? 'E-posta: ' : 'E-mail: ') + (f.email || ''));
    if(f.phone) L.push((lang === 'tr' ? 'Telefon: ' : 'Phone: ') + f.phone);
    L.push((lang === 'tr' ? 'Mesaj: ' : 'Message: ') + (f.note || ''));
    return 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(L.join('\r\n'));
  }

  // --- "Bilgi Al" info modal (product pages) ---
  var infoModalEl = document.getElementById('infoModal');
  var infoModalInstance = infoModalEl && window.bootstrap ? new bootstrap.Modal(infoModalEl) : null;
  document.querySelectorAll('[data-open-info]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      var input = document.querySelector('[data-info-service]');
      if(input) input.value = btn.dataset.service || '';
      if(infoModalInstance) infoModalInstance.show();
      else if(infoModalEl) infoModalEl.classList.add('show');
    });
  });

  document.querySelectorAll('[data-demo-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const svcEl = form.querySelector('[name="service"]');
      const get = n => { const el = form.querySelector('[name="' + n + '"]'); return el ? (el.value || '').trim() : ''; };
      let mailto = null;
      if(svcEl && svcEl.value){
        mailto = buildMailto(svcEl.value, {
          name: get('name'), email: get('email'), phone: get('phone'),
          plate: get('plate'), licenseSerial: get('licenseSerial'), note: get('message')
        });
      } else if(form.getAttribute('data-mailto')){
        mailto = buildMailtoTo(form.getAttribute('data-mailto'),
          getStoredLang() === 'tr' ? 'Web Öneri / Şikayet' : 'Website Suggestion / Complaint',
          { name: get('name'), email: get('email'), phone: get('phone'), note: get('message') });
      }
      const feedback = form.querySelector('.form-feedback');
      if(feedback){
        const lang = getStoredLang();
        feedback.textContent = lang === 'tr' ? feedback.getAttribute('data-feedback-tr') : feedback.getAttribute('data-feedback-en');
      }
      if(mailto){ window.location.href = mailto; }
      form.reset();
      updateVehicleFields();
    });
  });

  // Scroll-reveal animations (scroll-position based for broad compatibility)
  let revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(revealEls.length){
    if(prefersReduced){
      revealEls.forEach(el => el.classList.add('is-visible'));
    } else {
      const revealInView = () => {
        const vh = window.innerHeight || document.documentElement.clientHeight;
        revealEls = revealEls.filter(el => {
          if(el.getBoundingClientRect().top < vh * 0.9){
            el.classList.add('is-visible');
            return false;
          }
          return true;
        });
        if(!revealEls.length){
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onScroll);
        }
      };
      let ticking = false;
      const onScroll = () => {
        if(!ticking){
          ticking = true;
          requestAnimationFrame(() => { revealInView(); ticking = false; });
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      revealInView();
      // Failsafe: never leave content hidden if scroll events don't arrive.
      setTimeout(() => revealEls.forEach(el => el.classList.add('is-visible')), 2500);
    }
  }

  // Play flagged videos only when they scroll into view, pause when they leave.
  const inViewVideos = document.querySelectorAll('video[data-play-in-view]');
  if(inViewVideos.length){
    // On phones, videos flagged data-desktop-video are not fetched/played — the
    // poster image is shown instead. Saves ~14 MB per video on mobile data.
    // Checked at play-time so the current viewport width always decides.
    const skipOnMobile = v => v.hasAttribute('data-desktop-video') && window.matchMedia('(max-width: 991.98px)').matches;
    // muted must be set as a property (not just the attribute) for mobile autoplay.
    const tryPlay = v => {
      if(skipOnMobile(v)) return;
      v.muted = true; const p = v.play(); if(p && p.catch) p.catch(() => {});
    };
    if(!('IntersectionObserver' in window)){
      inViewVideos.forEach(tryPlay);
    } else {
      const vio = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const v = entry.target;
          if(entry.isIntersecting){
            tryPlay(v);
          } else if(!v.paused){
            v.pause();
          }
        });
      }, { threshold: 0.25 });
      inViewVideos.forEach(v => { v.muted = true; vio.observe(v); });
    }
    // iOS Low Power Mode / strict autoplay fallback: some phones refuse the
    // programmatic play() until the user interacts. Retry on the first tap.
    const kickVideos = () => {
      inViewVideos.forEach(v => {
        const r = v.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if(v.paused && r.top < vh && r.bottom > 0) tryPlay(v);
      });
    };
    ['touchstart','click'].forEach(ev => document.addEventListener(ev, kickVideos, { passive:true }));
  }
})();
