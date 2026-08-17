(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveal = [...document.querySelectorAll('[data-reveal]')];
  const revealMotion = !reduce && matchMedia('(min-width: 901px)').matches && 'IntersectionObserver' in window;
  if (revealMotion) {
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.05, rootMargin: '0px 0px -4%' });
    reveal.forEach((element) => observer.observe(element));
  } else reveal.forEach((element) => element.classList.add('is-visible'));

  const map = document.querySelector('[data-map-src]');
  const loadMap = () => {
    if (map.classList.contains('is-loading') || map.classList.contains('is-loaded')) return;
    map.classList.add('is-loading');
    const status = map.querySelector('[data-map-status]');
    if (status) status.textContent = 'Memuat Google Maps...';
    const frame = document.createElement('iframe');
    frame.title = 'Peta lokasi Collaboration Day 2026';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    frame.addEventListener('load', () => {
      map.classList.remove('is-loading');
      map.classList.add('is-loaded');
    }, { once: true });
    frame.src = map.dataset.mapSrc;
    map.append(frame);
  };
  if (map && 'IntersectionObserver' in window) {
    const mapObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      mapObserver.disconnect();
      loadMap();
    }, { rootMargin: '400px 0px', threshold: 0 });
    mapObserver.observe(map);
  } else if (map) loadMap();

  if (reduce) return;
  const hero = document.querySelector('.hero[data-slides]');
  const current = document.querySelector('.hero-slide.current');
  const next = document.querySelector('.hero-slide.next');
  if (!hero || !current || !next) return;
  const slides = JSON.parse(decodeURIComponent(hero.dataset.slides));
  if (slides.length < 2) return;
  const slideUrl = (url) => window.innerWidth <= 900 && url.startsWith('/media/archive/')
    ? url.replace('/media/archive/', '/media/archive-small/')
    : url;
  let index = 0;
  let visible = true;
  let timer = 0;
  let busy = false;
  const preload = (url) => { const image = new Image(); image.decoding = 'async'; image.src = url; };
  const schedule = () => { clearTimeout(timer); if (visible && !document.hidden) timer = setTimeout(advance, 6000); };
  const advance = () => {
    if (busy || !visible || document.hidden) return schedule();
    busy = true;
    const target = (index + 1) % slides.length;
    next.onload = () => {
      next.classList.add('enter');
      setTimeout(() => {
        current.src = slideUrl(slides[target]);
        current.removeAttribute('srcset');
        current.removeAttribute('sizes');
        next.classList.remove('enter');
        next.removeAttribute('src');
        index = target;
        busy = false;
        preload(slideUrl(slides[(index + 1) % slides.length]));
        schedule();
      }, 900);
    };
    next.onerror = () => { index = target; busy = false; schedule(); };
    next.removeAttribute('srcset');
    next.removeAttribute('sizes');
    next.src = slideUrl(slides[target]);
  };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible ? schedule() : clearTimeout(timer);
    }, { threshold: 0.08 }).observe(hero);
  }
  document.addEventListener('visibilitychange', schedule);
  preload(slideUrl(slides[1]));
  schedule();
})();
