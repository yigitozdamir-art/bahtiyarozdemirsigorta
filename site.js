
(function(){
  // Smooth page transitions: fade in on load, fade out before internal navigation
  const rootEl = document.documentElement;
  const markReady = () => rootEl.classList.add('page-ready');
  requestAnimationFrame(markReady);
  setTimeout(markReady, 250); // failsafe: never leave the page hidden
  window.addEventListener('pageshow', e => {
    if(e.persisted){
      rootEl.classList.remove('page-leaving');
      rootEl.classList.add('page-ready');
    }
  });
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
      return localStorage.getItem(storageKey) || 'en';
    } catch (error) {
      return document.documentElement.dataset.siteLang || 'en';
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

  document.querySelectorAll('[data-demo-form]').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const feedback = form.querySelector('.form-feedback');
      if(feedback){
        const lang = getStoredLang();
        feedback.textContent = lang === 'tr' ? feedback.getAttribute('data-feedback-tr') : feedback.getAttribute('data-feedback-en');
      }
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
    if(!('IntersectionObserver' in window)){
      inViewVideos.forEach(v => { const p = v.play(); if(p && p.catch) p.catch(() => {}); });
    } else {
      const vio = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const v = entry.target;
          if(entry.isIntersecting){
            const p = v.play();
            if(p && p.catch) p.catch(() => {});
          } else if(!v.paused){
            v.pause();
          }
        });
      }, { threshold: 0.35 });
      inViewVideos.forEach(v => vio.observe(v));
    }
  }
})();
