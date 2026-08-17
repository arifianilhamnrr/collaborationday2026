(() => {
  const sidebar = document.querySelector('[data-sidebar]');
  const toggle = document.querySelector('[data-sidebar-toggle]');
  const closeButton = document.querySelector('[data-sidebar-close]');
  const overlay = document.querySelector('[data-sidebar-overlay]');
  if (!sidebar || !toggle || !closeButton || !overlay) return;

  let previousFocus = null;
  const focusable = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  const close = (restoreFocus = true) => {
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-open');
    document.body.classList.remove('sidebar-open');
    toggle.setAttribute('aria-expanded', 'false');
    if (matchMedia('(max-width: 960px)').matches) {
      sidebar.setAttribute('aria-hidden', 'true');
      sidebar.inert = true;
    }
    if (restoreFocus && previousFocus instanceof HTMLElement) previousFocus.focus();
  };
  const open = () => {
    previousFocus = document.activeElement;
    sidebar.classList.add('is-open');
    overlay.classList.add('is-open');
    document.body.classList.add('sidebar-open');
    toggle.setAttribute('aria-expanded', 'true');
    sidebar.setAttribute('aria-hidden', 'false');
    sidebar.inert = false;
    closeButton.focus();
  };

  toggle.addEventListener('click', open);
  closeButton.addEventListener('click', () => close());
  overlay.addEventListener('click', () => close());
  sidebar.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    if (matchMedia('(max-width: 960px)').matches) close(false);
  }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && sidebar.classList.contains('is-open')) close();
    if (event.key === 'Tab' && sidebar.classList.contains('is-open')) {
      const items = [...sidebar.querySelectorAll(focusable)];
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });
  matchMedia('(min-width: 961px)').addEventListener('change', (event) => {
    if (event.matches) {
      close(false);
      sidebar.removeAttribute('aria-hidden');
      sidebar.inert = false;
    } else {
      sidebar.setAttribute('aria-hidden', 'true');
      sidebar.inert = true;
    }
  });
  if (matchMedia('(max-width: 960px)').matches) {
    sidebar.setAttribute('aria-hidden', 'true');
    sidebar.inert = true;
  }
})();
