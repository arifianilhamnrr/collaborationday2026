(() => {
  const dialog = document.querySelector('#participant-proof-dialog');
  const frame = document.querySelector('#participant-proof-frame');
  const title = document.querySelector('#participant-proof-title');
  const open = document.querySelector('#participant-proof-open');
  if (!dialog || !frame || !title || !open) return;
  let trigger = null;

  const close = () => {
    dialog.close();
    frame.removeAttribute('src');
  };

  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('[data-participant-proof]') : null;
    if (!link) return;
    event.preventDefault();
    trigger = link;
    title.textContent = link.dataset.proofTitle || 'Preview dokumen peserta';
    frame.src = link.dataset.proofUrl;
    open.href = link.dataset.proofUrl;
    dialog.showModal();
  });

  dialog.querySelector('[data-proof-close]').addEventListener('click', close);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  dialog.addEventListener('close', () => {
    frame.removeAttribute('src');
    trigger?.focus();
    trigger = null;
  });
})();
