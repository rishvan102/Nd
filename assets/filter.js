// assets/filter.js
// Tabs + search filtering for the tool grid

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const grid = $('#toolGrid');
  const tabs = $$('.tab');
  const cards = $$('.card');
  const search = $('#search');

  // --- Helpers --------------------------------------------------------------

  // Debounce utility
  const debounce = (fn, ms = 120) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  // Get active category
  const getActiveCat = () =>
    tabs.find(t => t.classList.contains('is-active'))?.dataset.cat || 'all';

  // Update visible cards based on active tab + search query
  const applyFilter = () => {
    const active = getActiveCat();
    const q = (search?.value || '').trim().toLowerCase();

    let shown = 0;
    cards.forEach(card => {
      // Skip disabled cards from filtering count but still hide/show correctly
      const inCat = active === 'all' || card.dataset.cat === active;
      const text = (card.innerText + ' ' + (card.dataset.tags || '')).toLowerCase();
      const match = !q || text.includes(q);
      const show = inCat && match;

      card.style.display = show ? '' : 'none';
      if (show) shown++;
    });

    // Announce count for screen readers
    grid?.setAttribute('aria-label', `${shown} tools visible`);
  };

  const applyFilterDebounced = debounce(applyFilter, 90);

  // --- Tabs: click + keyboard nav ------------------------------------------

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('is-active');
        t.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-pressed', 'true');

      // Sync hash for shareable state
      const cat = btn.dataset.cat;
      if (cat) history.replaceState(null, '', `#${cat}${search.value ? `?q=${encodeURIComponent(search.value)}` : ''}`);

      applyFilter();
    });

    // Arrow key navigation between tabs
    btn.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const i = tabs.indexOf(btn);
      let nextIdx = i;

      if (e.key === 'ArrowRight') nextIdx = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft')  nextIdx = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home')       nextIdx = 0;
      if (e.key === 'End')        nextIdx = tabs.length - 1;

      tabs[nextIdx].focus();
      tabs[nextIdx].click();
    });
  });

  // --- Search ---------------------------------------------------------------

  if (search) {
    search.addEventListener('input', () => {
      // Update URL (keeps current category)
      const cat = getActiveCat();
      const q = search.value.trim();
      history.replaceState(null, '', `#${cat}${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      applyFilterDebounced();
    });

    // Clear with Escape
    search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && search.value) {
        search.value = '';
        applyFilter();
      }
    });
  }

  // --- Restore state from URL (hash & ?q=) ---------------------------------

  const restoreFromURL = () => {
    const hash = (location.hash || '#all').slice(1);
    const [cat, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString || location.search);

    // Activate tab by category
    const target = tabs.find(t => t.dataset.cat === cat) || tabs[0];
    target.click(); // also triggers applyFilter

    // Restore query
    const q = params.get('q');
    if (q && search) {
      search.value = q;
      applyFilter();
    }
  };

  // Run once on load
  restoreFromURL();
})();
