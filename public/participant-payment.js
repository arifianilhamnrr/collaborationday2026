(() => {
  const select = document.querySelector('#participant-payment-method');
  const options = [...document.querySelectorAll('[data-payment-option]')];
  const empty = document.querySelector('#participant-payment-empty');
  if (!select || !options.length) return;

  const update = () => {
    const selected = select.value;
    options.forEach((option) => { option.hidden = option.dataset.paymentOption !== selected; });
    if (empty) empty.hidden = Boolean(selected);
  };
  select.addEventListener('change', update);
  update();

  document.querySelectorAll('[data-stable-upload]').forEach((form) => {
    const input = form.querySelector('[data-stable-file]');
    const status = form.querySelector('[data-upload-status]');
    const submit = form.querySelector('button[type="submit"]');
    let snapshot = null;
    let snapshotPromise = null;
    let selection = 0;

    const setStatus = (message) => { if (status) status.textContent = message; };

    input?.addEventListener('change', () => {
      const file = input.files?.[0];
      const currentSelection = ++selection;
      snapshot = null;
      if (!file) {
        snapshotPromise = null;
        setStatus('');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        snapshotPromise = null;
        setStatus('Ukuran berkas maksimal 5 MB. Pilih berkas yang lebih kecil.');
        return;
      }
      submit.disabled = true;
      setStatus('Menyiapkan berkas...');
      snapshotPromise = file.arrayBuffer().then((buffer) => {
        if (currentSelection !== selection) return null;
        snapshot = { blob: new Blob([buffer], { type: file.type || 'application/octet-stream' }), name: file.name || 'bukti-pembayaran' };
        setStatus(`Berkas siap: ${snapshot.name}`);
        return snapshot;
      }).catch(() => {
        if (currentSelection !== selection) return null;
        setStatus('Berkas tidak dapat dibaca. Pilih ulang dari galeri atau folder unduhan.');
        return null;
      }).finally(() => {
        if (currentSelection === selection) submit.disabled = false;
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (snapshotPromise) await snapshotPromise;
      if (!snapshot) {
        setStatus('Pilih ulang berkas bukti pembayaran sebelum mengirim.');
        input.focus();
        return;
      }
      submit.disabled = true;
      setStatus('Mengunggah bukti pembayaran...');
      try {
        input.disabled = true;
        const body = new FormData(form);
        input.disabled = false;
        body.set('proof', snapshot.blob, snapshot.name);
        const response = await fetch(form.action, { method: 'POST', body, credentials: 'same-origin' });
        if (response.redirected) {
          window.location.assign(response.url);
          return;
        }
        if (!response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const message = contentType.includes('text/plain') ? (await response.text()).slice(0, 240) : '';
          throw new Error(message || 'Upload belum berhasil. Coba lagi.');
        }
        window.location.reload();
      } catch (error) {
        input.disabled = false;
        setStatus(error instanceof Error ? error.message : 'Upload belum berhasil. Pilih ulang berkas lalu coba lagi.');
        submit.disabled = false;
      }
    });
  });
})();
