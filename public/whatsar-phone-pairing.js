(() => {
  const box = document.querySelector('#phone-pairing');
  const message = document.querySelector('#phone-pairing-status');
  const state = document.querySelector('#phone-pairing-state');
  if (!box || !message || !box.dataset.statusUrl) return;

  let stopped = false;
  let failures = 0;
  const poll = async () => {
    if (stopped || document.hidden) return;
    try {
      const response = await fetch(box.dataset.statusUrl, { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Status pairing belum dapat dimuat.');
      failures = 0;
      message.textContent = data.message;
      if (state) state.textContent = data.status;
      if (data.connected) {
        stopped = true;
        box.classList.add('success');
        setTimeout(() => location.reload(), 1200);
        return;
      }
      if (data.terminal) {
        stopped = true;
        box.classList.add('error');
        return;
      }
    } catch (error) {
      failures += 1;
      if (failures >= 3) message.textContent = error instanceof Error ? error.message : 'Status pairing belum dapat dimuat.';
    }
    setTimeout(poll, 3000);
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !stopped) poll();
  });
  poll();
})();
