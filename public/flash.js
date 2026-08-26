(() => {
  const notices = [...document.querySelectorAll('.notice')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  setTimeout(() => notices.forEach((notice) => {
    if (reduce) return notice.remove();
    notice.classList.add('is-dismissing');
    setTimeout(() => notice.remove(), 260);
  }), 5000);
  const url = new URL(location.href);
  if (url.searchParams.has('message')) {
    url.searchParams.delete('message');
    url.searchParams.delete('type');
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }
})();
