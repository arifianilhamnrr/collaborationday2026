(() => {
  const normalize = (value) => value.toLocaleLowerCase('id-ID').normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  document.querySelectorAll('[data-client-table]').forEach((root) => {
    const rows = [...root.querySelectorAll('[data-table-row]')];
    const search = root.querySelector('[data-table-search]');
    const filters = [...root.querySelectorAll('[data-table-filter]')];
    const sort = root.querySelector('[data-table-sort]');
    const sizeSelect = root.querySelector('[data-table-page-size]');
    const previous = root.querySelector('[data-table-prev]');
    const next = root.querySelector('[data-table-next]');
    const pageLabel = root.querySelector('[data-table-page]');
    const summary = root.querySelector('[data-table-summary]');
    const empty = root.querySelector('[data-table-empty]');
    let page = 1;

    const render = () => {
      const query = normalize(search?.value.trim() || '');
      const pageSize = Number(sizeSelect?.value || root.dataset.pageSize || 10);
      const matches = rows.filter((row) => {
        if (!normalize(row.dataset.search || row.textContent || '').includes(query)) return false;
        return filters.every((filter) => !filter.value || String(row.dataset[filter.dataset.field] || '') === filter.value);
      });
      const [sortField, sortDirection] = (sort?.value || '').split('-');
      if (sortField && sortDirection) matches.sort((left, right) => {
        const a = normalize(left.dataset[sortField] || '');
        const b = normalize(right.dataset[sortField] || '');
        const comparison = a.localeCompare(b, 'id-ID', { numeric: true });
        return sortDirection === 'desc' ? -comparison : comparison;
      });
      const body = rows[0]?.parentElement;
      matches.forEach((row) => body?.insertBefore(row, empty || null));
      const pageCount = Math.max(1, Math.ceil(matches.length / pageSize));
      page = Math.min(page, pageCount);
      const start = (page - 1) * pageSize;
      const visible = new Set(matches.slice(start, start + pageSize));

      rows.forEach((row) => { row.hidden = !visible.has(row); });
      if (empty) empty.hidden = matches.length !== 0;
      previous.disabled = page <= 1;
      next.disabled = page >= pageCount || matches.length === 0;
      pageLabel.textContent = `Halaman ${matches.length ? page : 0} dari ${matches.length ? pageCount : 0}`;
      summary.textContent = matches.length
        ? `Menampilkan ${start + 1}–${Math.min(start + pageSize, matches.length)} dari ${matches.length} hasil`
        : '0 hasil';
    };

    search?.addEventListener('input', () => { page = 1; render(); });
    filters.forEach((filter) => filter.addEventListener('change', () => { page = 1; render(); }));
    sort?.addEventListener('change', () => { page = 1; render(); });
    sizeSelect?.addEventListener('change', () => { page = 1; render(); });
    previous?.addEventListener('click', () => { if (page > 1) { page -= 1; render(); } });
    next?.addEventListener('click', () => { page += 1; render(); });
    render();
  });
})();
