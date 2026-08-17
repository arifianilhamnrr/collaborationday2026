(() => {
  const dialog = document.querySelector('#delete-session-dialog');
  const form = document.querySelector('#delete-session-form');
  const copy = document.querySelector('#delete-session-copy');
  if (!dialog || !form || !copy) return;

  document.querySelectorAll('[data-delete-session]').forEach((button) => button.addEventListener('click', () => {
    const sessionId = button.dataset.deleteSession;
    form.action = `/dashboard/whatsar/sessions/${encodeURIComponent(sessionId)}/delete`;
    copy.textContent = `${button.dataset.deleteName} akan dihapus. Device akan logout dan session tidak dapat dipulihkan.`;
    dialog.showModal();
  }));
  dialog.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
})();
