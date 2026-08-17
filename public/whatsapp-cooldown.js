(() => {
  const forms = [...document.querySelectorAll('form[action="/dashboard/whatsapp/send"]')];
  if (!forms.length) return;

  let remaining = 0;
  let timer;
  const controls = forms.map((form) => {
    const button = form.querySelector('button[type="submit"]');
    const status = document.createElement('small');
    status.className = 'otp-cooldown';
    status.setAttribute('aria-live', 'polite');
    button?.insertAdjacentElement('afterend', status);
    form.addEventListener('submit', (event) => {
      if (remaining > 0) event.preventDefault();
    });
    return { button, status, label: button?.textContent || 'Kirim kode' };
  });

  const render = () => {
    controls.forEach(({ button, status, label }) => {
      if (!button) return;
      button.disabled = remaining > 0;
      button.textContent = remaining > 0 ? `Kirim ulang dalam ${remaining} dtk` : label;
      status.textContent = remaining > 0 ? `Tunggu ${remaining} detik sebelum meminta OTP baru.` : '';
    });
  };
  const start = (seconds) => {
    remaining = Math.max(0, Number(seconds) || 0);
    clearInterval(timer);
    render();
    if (!remaining) return;
    timer = setInterval(() => {
      remaining = Math.max(0, remaining - 1);
      render();
      if (!remaining) clearInterval(timer);
    }, 1000);
  };

  fetch('/dashboard/whatsapp/cooldown', { headers: { Accept: 'application/json' } })
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then((data) => start(data.remainingSeconds))
    .catch(() => controls.forEach(({ status }) => { status.textContent = 'Status jeda belum dapat dimuat.'; }));
})();
