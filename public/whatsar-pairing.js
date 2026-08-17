(() => {
  const box = document.querySelector('#qr-pairing[data-status-url]');
  const image = document.querySelector('#qr-pairing-image');
  const status = document.querySelector('#qr-pairing-status');
  if (!box || !image || !status) return;
  let stopped = false;
  let lastImage = image.getAttribute('src') || '';

  const refresh = async () => {
    if (stopped || document.hidden) return;
    try {
      const response = await fetch(box.dataset.statusUrl, { headers: { Accept: 'application/json' } });
      const result = await response.json();
      if (!response.ok) {
        status.textContent = result.message || 'QR belum dapat diperbarui. Coba buat session baru.';
        stopped = response.status === 409;
        return;
      }
      if (result.status === 'connected') {
        status.textContent = 'WhatsApp berhasil terhubung. Halaman akan dimuat ulang.';
        stopped = true;
        setTimeout(() => location.reload(), 1200);
        return;
      }
      if (result.status === 'failed') {
        status.textContent = 'QR kedaluwarsa atau pairing gagal. Buat session baru untuk mencoba lagi.';
        stopped = true;
        return;
      }
      if (result.image && result.image !== lastImage) {
        image.src = result.image;
        image.style.display = '';
        lastImage = result.image;
      }
      status.textContent = result.image ? 'Scan melalui WhatsApp → Perangkat tertaut. QR diperbarui otomatis.' : 'Menunggu QR baru dari Whatsar…';
    } catch {
      status.textContent = 'Koneksi ke Whatsar terputus sementara. Mencoba kembali…';
    }
  };
  const timer = setInterval(refresh, 5000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  window.addEventListener('pagehide', () => { stopped = true; clearInterval(timer); });
  refresh();
})();
