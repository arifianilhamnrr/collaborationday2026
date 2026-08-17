(() => {
  const dialog = document.querySelector('#payment-method-dialog');
  const form = document.querySelector('#payment-method-form');
  if (!dialog || !form) return;
  const fields = {
    type: document.querySelector('#payment-method-type'),
    typeSelect: document.querySelector('#payment-method-type-select'),
    bank: document.querySelector('#payment-method-bank'),
    number: document.querySelector('#payment-method-number'),
    owner: document.querySelector('#payment-method-owner'),
    qris: document.querySelector('#payment-method-qris'),
    instructions: document.querySelector('#payment-method-instructions'),
    bankGroup: document.querySelector('#payment-bank-fields'),
    qrisGroup: document.querySelector('#payment-qris-fields'),
    qrisPreview: document.querySelector('#payment-qris-preview'),
    title: document.querySelector('#payment-method-title'),
    submit: document.querySelector('#payment-method-submit'),
  };

  const setType = (type) => {
    fields.type.value = type;
    fields.typeSelect.value = type;
    const bank = type === 'bank_transfer';
    const qris = type === 'static_qris';
    fields.bankGroup.hidden = !bank;
    fields.qrisGroup.hidden = !qris;
    [fields.bank, fields.number, fields.owner].forEach((field) => { field.required = bank; });
    fields.qris.required = qris;
  };

  const openAdd = () => {
    form.reset();
    form.action = '/dashboard/payment-methods';
    fields.typeSelect.disabled = false;
    fields.title.textContent = 'Tambah metode pembayaran';
    fields.submit.textContent = 'Tambah metode';
    fields.qrisPreview.hidden = true;
    fields.qrisPreview.removeAttribute('href');
    fields.qrisPreview.replaceChildren();
    setType('bank_transfer');
    dialog.showModal();
  };

  document.querySelector('[data-add-payment]')?.addEventListener('click', openAdd);
  fields.typeSelect.addEventListener('change', () => setType(fields.typeSelect.value));

  document.querySelectorAll('[data-edit-payment]').forEach((button) => button.addEventListener('click', () => {
    const method = JSON.parse(button.dataset.editPayment);
    form.reset();
    form.action = `/dashboard/payment-methods/${method.id}`;
    fields.typeSelect.disabled = true;
    fields.title.textContent = 'Edit metode pembayaran';
    fields.submit.textContent = 'Simpan perubahan';
    setType(method.type);
    fields.bank.value = method.bank_name || '';
    fields.number.value = method.account_number || '';
    fields.owner.value = method.account_name || '';
    fields.qris.value = method.qris_payload || '';
    fields.instructions.value = method.instructions || '';
    const hasPreview = method.type === 'static_qris';
    fields.qrisPreview.hidden = !hasPreview;
    fields.qrisPreview.removeAttribute('href');
    fields.qrisPreview.removeAttribute('target');
    fields.qrisPreview.replaceChildren();
    if (hasPreview) {
      const image = document.createElement('img');
      image.className = 'qris-modal-preview';
      image.src = `/dashboard/payment-methods/${method.id}/qris.svg?preview=1`;
      image.alt = 'Preview QRIS';
      fields.qrisPreview.append(image);
    }
    dialog.showModal();
  }));
  dialog.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
})();
