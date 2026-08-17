(() => {
  const dialog = document.querySelector('#payment-review-dialog');
  const form = document.querySelector('#payment-review-form');
  const title = document.querySelector('#payment-review-title');
  const decision = document.querySelector('#payment-review-decision');
  const reason = document.querySelector('#payment-review-reason');
  const reasonWrap = document.querySelector('#payment-review-reason-wrap');
  if (!dialog || !form || !title || !decision || !reason || !reasonWrap) return;

  const syncDecision = () => {
    const rejected = decision.value === 'rejected';
    reasonWrap.hidden = !rejected;
    reason.required = rejected;
    if (!rejected) reason.value = '';
  };
  document.querySelectorAll('[data-review-payment]').forEach((button) => button.addEventListener('click', () => {
    const payment = JSON.parse(button.dataset.reviewPayment);
    form.action = `/dashboard/payments/${payment.id}/review`;
    title.textContent = `Review ${payment.publicId} · ${payment.name}`;
    form.reset();
    syncDecision();
    dialog.showModal();
  }));
  decision.addEventListener('change', syncDecision);
  dialog.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });

  const proofDialog = document.querySelector('#payment-proof-dialog');
  const proofFrame = document.querySelector('#payment-proof-frame');
  const proofTitle = document.querySelector('#payment-proof-title');
  if (proofDialog && proofFrame && proofTitle) {
    const closeProof = () => {
      proofDialog.close();
      proofFrame.removeAttribute('src');
    };
    document.querySelectorAll('[data-view-proof]').forEach((button) => button.addEventListener('click', () => {
      proofTitle.textContent = button.dataset.proofTitle || 'Bukti pembayaran';
      proofFrame.src = button.dataset.proofUrl;
      proofDialog.showModal();
    }));
    proofDialog.querySelector('[data-proof-close]').addEventListener('click', closeProof);
    proofDialog.addEventListener('click', (event) => { if (event.target === proofDialog) closeProof(); });
    proofDialog.addEventListener('close', () => proofFrame.removeAttribute('src'));
  }
})();
