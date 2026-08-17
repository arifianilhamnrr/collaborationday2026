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
})();
