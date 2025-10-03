// assets/card-enhance.js
// Minimal, no-badge version:
// - Removes any previously injected badge/label elements
// - Clears data-emoji / data-catlabel so CSS ::before/::after won't render chips
// - Optionally strips a leading emoji from <h3> (keeps text clean)
// - Does NOT add any new DOM nodes

(() => {
  const cards = Array.from(document.querySelectorAll('.card'));
  if (!cards.length) return;

  // Leading emoji regex (covers most emoji incl. ZWJ/variation selectors)
  const emojiRE = /^\s*([\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D]{1,3})\s*/u;

  cards.forEach(card => {
    // 1) Remove any legacy badge DOM nodes
    card.querySelectorAll('.badge, .label, .tag, .tool-tag, .chip, .card-badge').forEach(el => el.remove());

    // 2) Clear data attributes used by CSS pseudo-elements
    if (card.hasAttribute('data-emoji')) card.removeAttribute('data-emoji');
    if (card.hasAttribute('data-catlabel')) card.removeAttribute('data-catlabel');

    // 3) Strip any leading emoji from the <h3> text (optional cleanup)
    const h3 = card.querySelector('h3');
    if (h3 && h3.firstChild && typeof h3.textContent === 'string') {
      const txt = h3.textContent;
      const m = txt.match(emojiRE);
      if (m) h3.textContent = txt.replace(emojiRE, '').trimStart();
    }
  });
})();
