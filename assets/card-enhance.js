// assets/card-enhance.js
// Pull leading emoji from <h3> into a badge (data-emoji), add category label chip.

(() => {
  const cards = Array.from(document.querySelectorAll('.card'));
  const catLabel = {
    docs: 'Docs',
    convert: 'Convert',
    organize: 'Organize',
    edit: 'Edit',
    secure: 'Secure'
  };
  const emojiRE = /^\s*([\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D]{1,3})\s*/u;

  cards.forEach(card => {
    const h3 = card.querySelector('h3');
    if (!h3) return;

    // If author already set data-emoji, keep it. Otherwise extract from h3.
    if (!card.dataset.emoji) {
      const m = h3.textContent.match(emojiRE);
      if (m) {
        card.dataset.emoji = m[1];
        h3.textContent = h3.textContent.replace(emojiRE, ''); // drop emoji from title
      }
    }

    // Footer chip text from data-cat
    if (!card.dataset.catlabel) {
      const key = card.dataset.cat || 'Tools';
      card.dataset.catlabel = catLabel[key] || 'Tools';
    }
  });
})();
